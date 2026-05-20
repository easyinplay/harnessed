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
import { homedir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import type { DiffPlan, InstallContext, InstallError } from './types.js'

// v2.0.1 fix: backup root migrated from `<ctx.cwd>/.harnessed-backup/` to
// `~/.harnessed/backups/` to support running harnessed from read-only CWD
// (e.g. user launched terminal from `C:\Program Files\Warp\` → mkdir EPERM).
// `getBackupRoot()` is exported so cli/backup-list.ts + cli/gc.ts +
// cli/rollback.ts share the same SoT (sister Phase 2.6 single-source-of-truth
// per ADR 0024 capability abstraction pattern).
export function getBackupRoot(): string {
  return join(homedir(), '.harnessed', 'backups')
}

export interface BackupFileEntry {
  target: string // absolute path of original file
  backup: string // absolute path of backup copy
  sha1: string // sha1 of original content
  eol: 'lf' | 'crlf' // ASSUMPTIONS C3 — preserve original line ending
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

function mirrorPath(target: string, scope: 'HOME' | 'PROJECT', backupDir: string): string {
  // For HOME-scope files, mirror under .harnessed-backup/<id>/HOME/<rel-to-home>;
  // for PROJECT-scope, mirror under .harnessed-backup/<id>/PROJECT/<rel-to-cwd>.
  // If we cannot resolve a relative path (e.g. file is outside home dir on a
  // weird Win symlink), fall back to a flat sha1-of-path filename to avoid
  // colliding with sibling files.
  const root = scope === 'HOME' ? HOME_DIR : '.'
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
  const backupDir = join(getBackupRoot(), backupId)

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
          backup: '', // sentinel: no backup written; rollback should unlink target
          sha1: '',
          eol: 'lf', // moot for non-existent file; default to lf
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

    const sha1 = createHash('sha1').update(buf).digest('hex')
    const eol = detectEol(buf)
    const dest = mirrorPath(file.target, file.scope, backupDir)

    try {
      await mkdir(dirname(dest), { recursive: true })
      await writeFile(dest, buf)
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

    entries.push({ target: file.target, backup: dest, sha1, eol })
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
