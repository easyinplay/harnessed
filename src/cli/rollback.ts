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
import { join, resolve } from 'node:path'
import type { Command } from 'commander'

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
      const dir = resolve(process.cwd(), '.harnessed-backup', timestamp)
      const metaPath = join(dir, 'metadata.json')
      let meta: BackupMetadata
      try {
        meta = JSON.parse(await readFile(metaPath, 'utf8')) as BackupMetadata
      } catch (err) {
        console.error(
          `error: cannot read ${metaPath}: ${(err as Error).message}\n` +
            `  fix:  run 'harnessed backup list' to see available timestamps`,
        )
        process.exit(1)
        return
      }
      // Reverse iteration so files restored later (higher in dependency chain) come first.
      for (const entry of [...meta.files].reverse()) {
        if (entry.backup === '') {
          // Pure-create sentinel — original file did not exist; rollback = unlink.
          try {
            await unlink(entry.target)
          } catch (err) {
            const code = (err as NodeJS.ErrnoException).code
            if (code !== 'ENOENT') {
              console.error(`error: cannot unlink ${entry.target}: ${(err as Error).message}`)
              process.exit(1)
              return
            }
          }
          continue
        }
        const buf = await readFile(entry.backup)
        const sha1 = createHash('sha1').update(buf).digest('hex')
        if (sha1 !== entry.sha1) {
          console.error(
            `error: backup checksum mismatch for ${entry.target} (expected ${entry.sha1.slice(0, 12)}, got ${sha1.slice(0, 12)})`,
          )
          process.exit(1)
          return
        }
        await writeFile(entry.target, normalizeEol(buf, entry.eol))
      }
      console.log(`restored ${meta.files.length} file(s) from ${timestamp}`)
    })
}
