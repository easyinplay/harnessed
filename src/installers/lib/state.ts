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
import { harnessedFile } from '../../platform/harnessedRoot.js'

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

/**
 * Phase 59 — record a component that `idempotent_check` found ALREADY present.
 *
 * Every installer probes `isAlreadyInstalled(ctx)` and returns early on a hit,
 * and that early return sits BEFORE the `updateInstalled` call at the end of the
 * success path — in all six installers. So the receipt was only ever written on
 * the path that performed a write: a component installed by hand (e.g. the
 * upstream-documented `claude plugin install`), or one whose entry was lost,
 * could never be recorded, and no number of `harnessed install` runs would
 * repair it. `harnessed status` — the one real consumer of state.json — then
 * reports "no installs recorded" on a machine full of installed components.
 *
 * Same defect Trellis fixed in `fix(update): repair receipt entries for files
 * already identical to a template` (#575): the write-back drew only from the
 * changed sets, so an absent or wrong entry beside an already-correct file was
 * unrepairable.
 *
 * Differs from `updateInstalled` in two ways, both about not overclaiming:
 *   - `installedAt` is NOT restamped when an entry already exists. We did not
 *     install it now, and we cannot know when it was installed; the first time
 *     we recorded it is the most honest thing the field can hold.
 *   - a matching entry is left completely alone, so re-running `harnessed
 *     install` on an up-to-date tree writes nothing.
 *
 * Fail-soft: a receipt is bookkeeping. Losing it must never turn a successful
 * idempotent no-op into an install failure, so every error is swallowed.
 */
export async function recordObservedInstall(
  cwd: string,
  name: string,
  version: string,
  manifestSha1: string,
): Promise<void> {
  try {
    const state = await readState(cwd)
    const prev = state.installed[name]
    if (prev && prev.version === version && prev.manifestSha1 === manifestSha1) return
    state.installed[name] = {
      version,
      installedAt: prev?.installedAt ?? new Date().toISOString(),
      manifestSha1,
    }
    await writeState(cwd, state)
  } catch {
    // bookkeeping only — see the fail-soft note above
  }
}
