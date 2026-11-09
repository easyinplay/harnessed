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
import { type BackupMetadata, getBackupRoot } from '../installers/lib/backup.js'
import {
  applySubtreeChanges,
  containsUnsafeJsonNumber,
  type JsonValue,
  SUBTREE_ENTRY_SHA1,
  tryParseJsonObject,
  validateSubtreePayload,
} from '../installers/lib/jsonSubtree.js'
import { checkSafeSegment } from '../manifest/lib/path-guard.js'

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
      // A timestamp is one path segment. Unguarded, `rollback ..` joined to the
      // parent of the backup root and trusted that directory's metadata.json —
      // whose files[].target paths are then written and unlinked. The sha1 check
      // constrains the backup SOURCE only, never the target.
      try {
        checkSafeSegment(timestamp)
      } catch {
        console.error('error: invalid backup timestamp (path traversal rejected)')
        process.exit(2)
        return
      }
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
      // Phase 88 — fail closed on duplicate targets involving a subtree
      // entry: composing a byte restore with a subtree restore (or two subtree
      // payloads) over the same file cannot be ordered safely, so refuse in
      // Pass1 rather than silently lose one side.
      {
        const counts = new Map<string, number>()
        for (const entry of meta.files) {
          counts.set(entry.target, (counts.get(entry.target) ?? 0) + 1)
        }
        const dupInvolvingSubtree = meta.files.some(
          (entry) => entry.kind === 'json-subtree' && (counts.get(entry.target) ?? 0) > 1,
        )
        if (dupInvolvingSubtree) {
          console.error(
            'error: backup metadata has duplicate entries for a json-subtree target; refusing to guess composition order',
          )
          process.exit(1)
          return
        }
      }
      const ordered = [...meta.files].reverse()
      const planned: Array<
        | { target: string; action: 'unlink' }
        | { target: string; action: 'remove-created' }
        | { target: string; action: 'keep'; why: string }
        | { target: string; action: 'write'; data: Buffer }
      > = []
      for (const entry of ordered) {
        // Entry-contract validation — before sentinel handling, before any
        // mutation. Inconsistent combinations fail closed rather than letting
        // a scoped snapshot degrade into a byte restore or a sentinel delete.
        if (entry.kind === 'json-subtree') {
          if (
            entry.sha1 !== SUBTREE_ENTRY_SHA1 ||
            typeof entry.payloadSha1 !== 'string' ||
            !/^[a-f0-9]{40}$/.test(entry.payloadSha1) ||
            entry.backup === '' ||
            entry.sentinel !== undefined
          ) {
            console.error(
              `error: malformed json-subtree backup entry for ${entry.target}; scoped snapshots require a compatible harnessed reader — restore manually`,
            )
            process.exit(1)
            return
          }
        } else {
          if (entry.kind !== undefined && entry.kind !== 'bytes') {
            console.error(
              `error: backup entry for ${entry.target} has unknown kind ${String(entry.kind)}; upgrade harnessed or restore manually`,
            )
            process.exit(1)
            return
          }
          if (entry.payloadSha1 !== undefined) {
            console.error(
              `error: backup entry for ${entry.target} carries payloadSha1 without json-subtree kind; refusing to guess its format`,
            )
            process.exit(1)
            return
          }
        }
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
        const digest = createHash('sha1').update(buf).digest('hex')
        if (entry.kind === 'json-subtree') {
          // The backup file holds a diff payload of OLD values, not file
          // bytes; its integrity hash lives in payloadSha1 (entry.sha1 is the
          // format discriminator by design). Validate the payload fully, then
          // compute the restored image by applying changes onto the CURRENT
          // target — Pass2 still performs the only write. Note: there is
          // intentionally no post-image check; rollback reverts the managed
          // paths even if the user edited them after install, while every
          // unmanaged key is preserved.
          if (digest !== entry.payloadSha1) {
            console.error(
              t('rollback.checksum_mismatch', {
                target: entry.target,
                expected: (entry.payloadSha1 ?? '').slice(0, 12),
                actual: digest.slice(0, 12),
              }),
            )
            process.exit(1)
            return
          }
          let parsedPayload: unknown
          try {
            parsedPayload = JSON.parse(buf.toString('utf8'))
          } catch {
            console.error(`error: backup payload for ${entry.target} is not valid JSON`)
            process.exit(1)
            return
          }
          const payload = validateSubtreePayload(parsedPayload)
          if (!payload.ok) {
            console.error(
              `error: invalid json-subtree payload for ${entry.target}: ${payload.reason}`,
            )
            process.exit(1)
            return
          }
          const currentText = await (async () => {
            try {
              return await readFile(entry.target, 'utf8')
            } catch {
              return null
            }
          })()
          const current = currentText === null ? null : tryParseJsonObject(currentText)
          if (current === null) {
            console.error(
              `error: cannot restore ${entry.target}: current content is not a readable JSON object (refusing to overwrite user edits)`,
            )
            process.exit(1)
            return
          }
          // Restoring re-serializes the WHOLE file, so any number that cannot
          // round-trip — in the recorded old values or anywhere in the current
          // tree, including keys the install never touched — must refuse.
          const unsafe =
            containsUnsafeJsonNumber(current) ||
            payload.changes.some((c) => c.existed && containsUnsafeJsonNumber(c.value as JsonValue))
          if (unsafe) {
            console.error(
              `error: cannot restore ${entry.target}: JSON contains a number that cannot round-trip through JSON.stringify (non-finite or unsafe integer) — restore manually`,
            )
            process.exit(1)
            return
          }
          const applied = applySubtreeChanges(current, payload.changes)
          if (!applied.ok) {
            console.error(`error: cannot restore ${entry.target}: ${applied.reason}`)
            process.exit(1)
            return
          }
          planned.push({
            target: entry.target,
            action: 'write',
            data: normalizeEol(
              Buffer.from(`${JSON.stringify(current, null, 2)}\n`, 'utf8'),
              entry.eol,
            ),
          })
          continue
        }
        if (digest !== entry.sha1) {
          console.error(
            t('rollback.checksum_mismatch', {
              target: entry.target,
              expected: entry.sha1.slice(0, 12),
              actual: digest.slice(0, 12),
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
