// Phase 1.2 cli subcommand `rollback` per ADR 0004 § 3 + Pattern C + H.
//
// IMPL NOTE (Rule 1 / ASSUMPTIONS C3 — CRLF/LF preservation): each backup
// metadata.json file entry records `eol: 'lf' | 'crlf'` from the original
// on-disk content (lib/backup.ts detects via Buffer.includes('\r\n')). On
// restore we MUST honor that field — naive `fs.writeFile(buf)` would
// otherwise round-trip CRLF→LF on Win→Unix migrations or vice versa, mutating
// the user's original file content. We restore by converting buf to a string
// then re-emitting with the recorded eol convention.
//
// IMPL NOTE (Rule 1 / ENOENT pure-create sentinel): backup() records files
// that did not yet exist (oldText === '' + ENOENT) as `{ backup: '', sha1: '' }`.
// On rollback that used to mean a single-file unlink(), which cannot remove a
// directory — every git-clone rollback failed. Entries now carry `sentinel`
// ('created' → remove recursively; 'preexisting-dir' → leave in place), and
// legacy metadata without it never deletes a directory on a guess.

import { createHash } from 'node:crypto'
import { readFile, rm, stat, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Command } from 'commander'
import { t } from '../i18n/index.js'
import { getBackupRoot } from '../installers/lib/backup.js'

interface BackupFileEntry {
  target: string
  backup: string
  sha1: string
  eol: 'lf' | 'crlf'
  /** Mirror of lib/backup.ts — 'created' vs 'preexisting-dir'; absent on old metadata. */
  sentinel?: 'created' | 'preexisting-dir'
}
interface BackupMetadata {
  installer: string
  manifest: string
  timestamp: string
  files: BackupFileEntry[]
}

function normalizeEol(buf: Buffer, eol: 'lf' | 'crlf'): Buffer {
  // Convert all line endings to LF first, then to target convention.
  const lf = buf.toString('utf8').replace(/\r\n/g, '\n')
  return Buffer.from(eol === 'crlf' ? lf.replace(/\n/g, '\r\n') : lf, 'utf8')
}

export function registerRollback(program: Command): void {
  program
    .command('rollback <timestamp>')
    .description('Restore files from a backup snapshot (preserves original LF/CRLF)')
    .action(async (timestamp: string) => {
      const dir = join(getBackupRoot(), timestamp)
      const metaPath = join(dir, 'metadata.json')
      let meta: BackupMetadata
      try {
        meta = JSON.parse(await readFile(metaPath, 'utf8')) as BackupMetadata
      } catch (err) {
        console.error(
          `${t('rollback.metadata_unreadable', { path: metaPath, message: (err as Error).message })}\n${t('rollback.metadata_unreadable.fix')}`,
        )
        process.exit(1)
        return
      }
      // v4.1.3 — two-pass restore to avoid half-restored data loss. Pass 1:
      // read + sha1-verify EVERY backup into memory and abort before touching
      // any target. Pass 2: write/unlink only after all verifications pass.
      // Reverse order so files restored later (higher in dependency chain) come first.
      const ordered = [...meta.files].reverse()
      const planned: Array<
        | { target: string; action: 'unlink' }
        | { target: string; action: 'remove-created' }
        | { target: string; action: 'keep'; why: string }
        | { target: string; action: 'write'; data: Buffer }
      > = []
      for (const entry of ordered) {
        if (entry.backup === '') {
          // A sentinel entry means "no bytes were backed up". What that asks of
          // rollback depends on WHY, and the two answers are opposites. Before
          // `sentinel` was recorded every such entry got a single-file unlink(),
          // which on a git-clone target (a directory) failed with EPERM/EISDIR
          // and exited 1 — so rolling back any git-clone install always failed.
          if (entry.sentinel === 'created') {
            planned.push({ target: entry.target, action: 'remove-created' })
          } else if (entry.sentinel === 'preexisting-dir') {
            planned.push({
              target: entry.target,
              action: 'keep',
              why: 'existed before install and could not be byte-backed-up; left untouched',
            })
          } else {
            // Legacy metadata: no way to know whether a DIRECTORY here was created
            // by the install or was already the user's. Deleting on a guess could
            // destroy data, so directories are kept; files keep the old unlink.
            let isDir = false
            try {
              isDir = (await stat(entry.target)).isDirectory()
            } catch {
              // missing → nothing to remove either way
            }
            planned.push(
              isDir
                ? {
                    target: entry.target,
                    action: 'keep',
                    why: 'directory from pre-sentinel backup metadata; origin unknown, not deleting',
                  }
                : { target: entry.target, action: 'unlink' },
            )
          }
          continue
        }
        let buf: Buffer
        try {
          buf = await readFile(entry.backup)
        } catch (err) {
          console.error(`error: cannot read backup ${entry.backup}: ${(err as Error).message}`)
          process.exit(1)
          return
        }
        const sha1 = createHash('sha1').update(buf).digest('hex')
        if (sha1 !== entry.sha1) {
          console.error(
            t('rollback.checksum_mismatch', {
              target: entry.target,
              expected: entry.sha1.slice(0, 12),
              actual: sha1.slice(0, 12),
            }),
          )
          process.exit(1)
          return
        }
        planned.push({ target: entry.target, action: 'write', data: normalizeEol(buf, entry.eol) })
      }
      // Pass 2 — all verified; apply.
      for (const op of planned) {
        if (op.action === 'keep') {
          console.warn(`[harnessed] rollback: ${op.target} — ${op.why}`)
          continue
        }
        if (op.action === 'remove-created') {
          // Did not exist before install, so removing it (file or cloned dir) is
          // the restore. force:true — already gone is the same end state.
          await rm(op.target, { recursive: true, force: true })
          continue
        }
        if (op.action === 'unlink') {
          try {
            await unlink(op.target)
          } catch (err) {
            const code = (err as NodeJS.ErrnoException).code
            if (code !== 'ENOENT') {
              console.error(`error: cannot unlink ${op.target}: ${(err as Error).message}`)
              process.exit(1)
              return
            }
          }
        } else {
          await writeFile(op.target, op.data)
        }
      }
      console.log(t('rollback.restored', { count: meta.files.length, timestamp }))
    })
}
