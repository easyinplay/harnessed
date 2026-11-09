// Phase 1.2 backup writer per ADR 0004 § 3 schema + Pattern B + C + H.
//
// IMPL NOTE (Rule 1 / ASSUMPTIONS C3): each backed-up file's metadata entry
// records `eol: 'lf' | 'crlf'` based on the original on-disk content
// (detected by Buffer.includes('\r\n')). cli/rollback.ts MUST honor this
// field on restore — naive `fs.writeFile(buf)` would otherwise round-trip
// CRLF→LF on Win→Unix migrations or vice versa, mutating the user's
// original file content. The eol field is the only safe way to preserve
// the original line ending across a backup/restore cycle.
//
// ISO timestamp format: `2026-05-12T13-45-22.123Z`. We replace `:` with `-`
// because Windows refuses `:` inside filenames; `.` and `-` are universally
// safe.
//
// Pattern B (lazy timestamp dir creation): timestamp dir is mkdir-ed on the
// fly inside backup() — we never pre-create unused dirs.
// Pattern C: returns Result-shaped object; mkdir/write failures yield
// InstallResult-style { ok: false, error } never throws.

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { harnessedSubdir } from '../../platform/harnessedRoot.js'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import {
  containsUnsafeJsonNumber,
  diffJsonObjects,
  SUBTREE_ENTRY_SHA1,
  tryParseJsonObject,
} from './jsonSubtree.js'
import type { DiffPlan, InstallContext, InstallError } from './types.js'

// v2.0.1 fix: backup root migrated from `<ctx.cwd>/.harnessed-backup/` to
// `~/.harnessed/backups/` to support running harnessed from read-only CWD
// (e.g. user launched terminal from `C:\Program Files\Warp\` → mkdir EPERM).
// `getBackupRoot()` is exported so cli/backup-list.ts + cli/gc.ts +
// cli/rollback.ts share the same SoT (sister Phase 2.6 single-source-of-truth
// per ADR 0024 capability abstraction pattern).
//
// v3.0.3: routed through the shared `getHarnessedRoot()` SoT (sister
// `harnessedRoot.ts`) so all harness-owned roots compose from a single helper.
// Path remains `<homedir>/.harnessed/backups` — no behavioral change.
export function getBackupRoot(hostContext?: HostInstallContext): string {
  return hostContext ? join(hostContext.platform.stateRoot, 'backups') : harnessedSubdir('backups')
}

export interface BackupFileEntry {
  target: string // absolute path of original file
  backup: string // absolute path of backup copy
  /** sha1 of the stored payload bytes. On 'json-subtree' entries this instead
   *  holds the SUBTREE_ENTRY_SHA1 format discriminator and the real digest
   *  lives in `payloadSha1`. */
  sha1: string
  eol: 'lf' | 'crlf' // ASSUMPTIONS C3 — preserve original line ending
  /** Set only on sentinel entries (`backup === ''`), because rollback cannot tell
   *  the two cases apart after the fact and they need OPPOSITE handling:
   *   - 'created'         — target did not exist before install; removing it
   *                         (recursively: git-clone targets are directories)
   *                         restores the pre-install state.
   *   - 'preexisting-dir' — target was an existing directory (force-update over
   *                         a skill dir). No byte backup was possible, so rollback
   *                         must LEAVE it — deleting would destroy user data.
   *  Absent on metadata written before this field existed. */
  sentinel?: 'created' | 'preexisting-dir'
  /** Phase 88 — payload kind. Absent/'bytes' = legacy whole-file copy.
   *  'json-subtree' = the backup file holds a versioned diff payload
   *  (lib/jsonSubtree.ts) recording only the OLD values of changed keys, so
   *  unrelated credentials are never copied and rollback preserves keys the
   *  install did not touch. Unknown kinds must make rollback refuse before
   *  any mutation. */
  kind?: 'bytes' | 'json-subtree'
  /** Real sha1 of the stored payload bytes — set only on 'json-subtree'
   *  entries, where `sha1` instead holds the format discriminator
   *  SUBTREE_ENTRY_SHA1 (a non-hex marker an old reader can never
   *  checksum-match, so released rollbacks fail closed on scoped snapshots
   *  rather than byte-writing diff JSON into the target file). */
  payloadSha1?: string
}

export interface BackupMetadata {
  installer: string // manifest.metadata.name
  manifest: string // manifest.metadata.name (alias for clarity)
  timestamp: string // ISO-8601 (with `:` replaced by `-`)
  files: BackupFileEntry[]
}

export type BackupResult =
  | { ok: true; backupId: string; backupDir: string }
  | { ok: false; error: InstallError }

const HOME_DIR = process.env.HOME ?? process.env.USERPROFILE ?? ''

function mirrorPath(
  target: string,
  scope: 'HOME' | 'PROJECT',
  backupDir: string,
  hostContext?: HostInstallContext,
): string {
  // For HOME-scope files, mirror under .harnessed-backup/<id>/HOME/<rel-to-home>;
  // for PROJECT-scope, mirror under .harnessed-backup/<id>/PROJECT/<rel-to-cwd>.
  // If we cannot resolve a relative path (e.g. file is outside home dir on a
  // weird Win symlink), fall back to a flat sha1-of-path filename to avoid
  // colliding with sibling files.
  const root = scope === 'HOME' ? (hostContext?.userHome ?? HOME_DIR) : '.'
  const rel = root ? relative(root, target) : target
  if (!rel || rel.startsWith('..')) {
    const flat = createHash('sha1').update(target).digest('hex').slice(0, 16)
    return join(backupDir, scope, flat)
  }
  return join(backupDir, scope, rel)
}

function detectEol(buf: Buffer): 'lf' | 'crlf' {
  // First CRLF wins; manifests and config JSON are typically pure-LF or
  // pure-CRLF in real world (mixed-EOL files exist but are vanishingly rare;
  // we pick the dominant convention based on first occurrence).
  return buf.includes('\r\n') ? 'crlf' : 'lf'
}

export async function backup(plan: DiffPlan, ctx: InstallContext): Promise<BackupResult> {
  const filename = ctx.manifest.metadata.name

  // ISO timestamp with `:` → `-` for Win filename safety.
  const backupId = new Date().toISOString().replace(/:/g, '-')
  const backupDir = join(getBackupRoot(ctx.hostContext), backupId)

  try {
    await mkdir(backupDir, { recursive: true })
  } catch (err) {
    return {
      ok: false,
      error: {
        file: filename,
        path: '/',
        message: `failed to create backup dir ${backupDir}: ${(err as Error).message}`,
        line: null,
        column: null,
        keyword: 'backup-mkdir-failed',
      },
    }
  }

  const entries: BackupFileEntry[] = []

  for (const file of plan.files) {
    let buf: Buffer
    try {
      buf = await readFile(file.target)
    } catch (err) {
      // ENOENT is expected for pure-create plans (oldText === '' + file does
      // not yet exist) — record an empty backup entry so rollback knows to
      // delete the file rather than restore.
      const code = (err as NodeJS.ErrnoException).code
      if (code === 'ENOENT' && file.oldText === '') {
        entries.push({
          target: file.target,
          backup: '', // sentinel: no backup written; rollback removes the target
          sha1: '',
          eol: 'lf', // moot for non-existent file; default to lf
          sentinel: 'created',
        })
        continue
      }
      // v23 (4.5.1) — EISDIR: the target is a directory (e.g. git-clone-with-setup
      // overwriting an existing skill dir on force-update). A byte-backup isn't
      // applicable; record a sentinel so the install proceeds rather than crash with
      // "illegal operation on a directory, read". (git-clone-with-setup is pure-create;
      // directory rollback is out of scope by its own contract.)
      if (code === 'EISDIR') {
        entries.push({
          target: file.target,
          backup: '',
          sha1: '',
          eol: 'lf',
          sentinel: 'preexisting-dir',
        })
        continue
      }
      return {
        ok: false,
        error: {
          file: filename,
          path: file.target,
          message: `failed to read original file for backup: ${(err as Error).message}`,
          line: null,
          column: null,
          keyword: 'backup-read-failed',
        },
      }
    }

    const eol = detectEol(buf)
    const dest = mirrorPath(file.target, file.scope, backupDir, ctx.hostContext)

    // Scoped JSON backup: when the plan's old/new images both parse as JSON
    // objects, store the diff payload (OLD values only) instead of the whole
    // file so unrelated credentials stay out of the backup dir. Two fail-closed
    // gates, never a silent byte-fallback that would reintroduce the leak:
    //   - stale plan: on-disk bytes differ from plan oldText
    //   - unsafe numbers: 1e400→Infinity or >MAX_SAFE_INTEGER integers would
    //     be corrupted when rollback re-serializes the file
    const entry: BackupFileEntry = {
      target: file.target,
      backup: dest,
      sha1: createHash('sha1').update(buf).digest('hex'),
      eol,
    }
    let stored = buf
    const oldJson = tryParseJsonObject(file.oldText)
    const newJson = tryParseJsonObject(file.newText)
    if (oldJson !== null && newJson !== null) {
      if (buf.toString('utf8') !== file.oldText) {
        return {
          ok: false,
          error: {
            file: filename,
            path: file.target,
            message:
              'on-disk content differs from plan oldText (stale plan); re-run the install to regenerate the plan',
            line: null,
            column: null,
            keyword: 'backup-stale-plan',
          },
        }
      }
      if (containsUnsafeJsonNumber(oldJson) || containsUnsafeJsonNumber(newJson)) {
        return {
          ok: false,
          error: {
            file: filename,
            path: file.target,
            message:
              'JSON contains a number that cannot round-trip through JSON.stringify (non-finite or unsafe integer); scoped backup refused — edit the file manually',
            line: null,
            column: null,
            keyword: 'backup-json-unsafe-number',
          },
        }
      }
      stored = Buffer.from(
        `${JSON.stringify({ version: 1, changes: diffJsonObjects(oldJson, newJson) }, null, 2)}\n`,
        'utf8',
      )
      entry.kind = 'json-subtree'
      entry.sha1 = SUBTREE_ENTRY_SHA1
      entry.payloadSha1 = createHash('sha1').update(stored).digest('hex')
    }

    try {
      await mkdir(dirname(dest), { recursive: true })
      await writeFile(dest, stored)
    } catch (err) {
      return {
        ok: false,
        error: {
          file: filename,
          path: dest,
          message: `failed to write backup copy: ${(err as Error).message}`,
          line: null,
          column: null,
          keyword: 'backup-write-failed',
        },
      }
    }

    entries.push(entry)
  }

  // metadata.json — single source of truth for rollback.
  const metadata: BackupMetadata = {
    installer: filename,
    manifest: filename,
    timestamp: backupId,
    files: entries,
  }
  const metadataPath = join(backupDir, 'metadata.json')
  try {
    await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8')
  } catch (err) {
    return {
      ok: false,
      error: {
        file: filename,
        path: metadataPath,
        message: `failed to write metadata.json: ${(err as Error).message}`,
        line: null,
        column: null,
        keyword: 'backup-metadata-failed',
      },
    }
  }

  return { ok: true, backupId, backupDir }
}
