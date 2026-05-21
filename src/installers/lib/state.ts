// Phase 1.2 .harnessed/state.json SSOT per ADR 0004 contract 6 + D1.2-7.
//
// Tracks "what is currently installed" across reboots / shells:
//   - schema version (so future migrations are explicit)
//   - per-install record: version + ISO timestamp + manifest sha1
//
// karpathy YAGNI (D1.2-7): we do NOT pre-reserve audit.log / current-workflow
// / checkpoints fields here — those are added when their owner phases ship
// (audit log = phase 1.4 routing-engine, checkpoints = phase 3.1 ralph-loop
// integration). The state.json schema therefore lives behind a version field
// so future phases can bump it without touching this file.
//
// Plain TS interface (NOT TypeBox) — state.json is read/written by harnessed
// itself, never by user manifests; we don't need Ajv runtime validation.
//
// IMPL NOTE (Rule 1 / concurrent-write hazard): writeState() uses the atomic
// write-then-rename idiom (write to `.tmp` sibling + `fs.rename`). Two
// `harnessed install` processes running concurrently in the same project
// will see one another's tmp file but only one rename wins, so the final
// state.json is always either the pre- or the post-state — never a half-
// written truncation. This matches how npm/yarn/git index updates work.
//
// Pattern C: readState returns a default object on ENOENT (first install in
// a fresh project) — we never throw on missing state.json; absence is the
// expected initial condition.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { harnessedFile } from './harnessedRoot.js'

export interface HarnessedStateEntry {
  version: string
  installedAt: string // ISO-8601 timestamp
  manifestSha1: string // sha1 of the manifest yaml that produced this install
}

export interface HarnessedState {
  version: '1' // schema version of THIS file format; bump on incompatible change
  installed: Record<string, HarnessedStateEntry>
}

const DEFAULT_STATE: HarnessedState = { version: '1', installed: {} }

// v3.0.3 hotfix — state.json path now homedir-rooted (sister `getBackupRoot()`
// v2.0.1 + `getHarnessedRoot()` v3.0.3). Pre-v3.0.3 used `<cwd>/.harnessed/`
// which EPERMs when the user launches harnessed from a read-only directory
// (Warp default `C:\Program Files\Warp\`). The `cwd` parameter is now ignored
// for path composition (signature kept for backward-compat with callers like
// `cli/status.ts` and `npmCli.ts` that still pass `ctx.cwd` or `process.cwd()`).
function statePath(_cwd: string): string {
  return harnessedFile('state.json')
}

export async function readState(cwd: string): Promise<HarnessedState> {
  const path = statePath(cwd)
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch (err) {
    // ENOENT — first install in a fresh project; return default schema.
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...DEFAULT_STATE, installed: {} }
    }
    throw err
  }
  // Malformed JSON / wrong schema version is recoverable: log and return
  // default; we choose data loss over crash because state.json is not
  // primary truth (manifests + .harnessed-backup are). Caller may add a
  // doctor warning if installed map is empty but backups exist.
  try {
    const parsed = JSON.parse(raw) as HarnessedState
    if (parsed.version !== '1' || typeof parsed.installed !== 'object') {
      return { ...DEFAULT_STATE, installed: {} }
    }
    return parsed
  } catch {
    return { ...DEFAULT_STATE, installed: {} }
  }
}

export async function writeState(cwd: string, state: HarnessedState): Promise<void> {
  const path = statePath(cwd)
  const tmp = `${path}.tmp`
  await mkdir(dirname(path), { recursive: true })
  // Trailing newline keeps state.json POSIX-friendly + diff-friendly.
  await writeFile(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  await rename(tmp, path)
}

/**
 * Read-modify-write helper for the common case: record a successful install.
 * Adds or replaces `installed[name]` and persists atomically.
 */
export async function updateInstalled(
  cwd: string,
  name: string,
  version: string,
  manifestSha1: string,
): Promise<void> {
  const state = await readState(cwd)
  state.installed[name] = {
    version,
    installedAt: new Date().toISOString(),
    manifestSha1,
  }
  await writeState(cwd, state)
}
