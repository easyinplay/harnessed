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
// On rollback this means "delete the target file" rather than "restore". We
// honor that sentinel by calling unlink() instead of writeFile().

import { createHash } from 'node:crypto'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Command } from 'commander'
import { t } from '../i18n/index.js'
import { getBackupRoot } from '../installers/lib/backup.js'

interface BackupFileEntry {
  target: string
  backup: string
  sha1: string
  eol: 'lf' | 'crlf'
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
        { target: string; action: 'unlink' } | { target: string; action: 'write'; data: Buffer }
      > = []
      for (const entry of ordered) {
        if (entry.backup === '') {
          planned.push({ target: entry.target, action: 'unlink' })
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
