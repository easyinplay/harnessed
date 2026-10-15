// Phase 15 — per-repo multi-workflow store. The global singleton
// `current-workflow.json` is replaced by `workflows.json`, a map of
// repo-root → CurrentWorkflowV1 envelope. state.ts rewires its read/write
// kernels to the active repo's slot (behind-API: the 17 call sites + the
// envelope schema are unchanged). These kernels are lock-FREE — all locking
// stays in state.ts (sister: writeCurrentWorkflowUnlocked).
//
// Fixes the reverted rogue impl (F4 bolt-on cold index / F5 stale index) by
// construction: this store IS the sole SoT, reached through one write path.

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { type Static, Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { harnessedFile } from '../platform/harnessedRoot.js'
import { detectPlatform } from '../platform/platform.js'
import { SCHEMA_VERSIONS } from '../types/schemaVersion.js'
import { writeFileAtomic } from './atomicWrite.js'
import { CurrentWorkflowV1 } from './schema/currentWorkflow.v1.js'

/** Phase 22 — per-repo retro cadence sidecar. Lives at the STORE level (NOT the
 *  envelope) because `activate()` writes a fresh envelope each phase and would
 *  reset an envelope-stored counter. Keyed by repoKey, mirroring `workflows`.
 *  `phases_since_retro` increments on each allResolved `checkpoint complete`;
 *  `harnessed retro --done` zeroes it + stamps `last_retro_at`. */
export const RetroMetaEntry = Type.Object(
  {
    phases_since_retro: Type.Integer({ minimum: 0 }),
    last_retro_at: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
)
export type RetroMetaEntryType = Static<typeof RetroMetaEntry>

/** 4.22.0 (L1 anti-freestyle) — invocation intent sidecar. Written by
 *  `harnessed checkpoint intent <master>` (pre-executed by the generated /auto
 *  command + master SKILL.md via CC's `!`cmd`` preprocessing), absorbed (cleared)
 *  by `checkpoint start`. Keyed like `workflows` (activeKey). A fresh intent with
 *  an unseeded ledger = the freestyle signature the per-turn inject bin nags on. */
export const IntentEntry = Type.Object(
  {
    // Invoked command name (master OR leaf sub — field name kept for 765cbc9
    // store back-compat; kind carries the distinction).
    master: Type.String({ minLength: 1 }),
    ts: Type.String({ minLength: 1 }),
    // 4.22.0 T6 — additive-optional: absent = 'master' (765cbc9 only ever wrote
    // master intents). 'leaf' switches banner/nag to the leaf SOP wording
    // (prompt → spawn → checkpoint complete) and the absorb trigger to that
    // sub's complete/fail instead of `checkpoint start`.
    kind: Type.Optional(Type.Union([Type.Literal('master'), Type.Literal('leaf')])),
  },
  { additionalProperties: false },
)
export type IntentEntryType = Static<typeof IntentEntry>

export const WorkflowStoreV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.workflowStore),
    workflows: Type.Record(Type.String(), CurrentWorkflowV1),
    // Additive-optional (no schemaVersion bump — old stores Value.Check-pass).
    retro_meta: Type.Optional(Type.Record(Type.String(), RetroMetaEntry)),
    // 4.22.0 — additive-optional, same rationale.
    intents: Type.Optional(Type.Record(Type.String(), IntentEntry)),
  },
  { additionalProperties: false },
)
export type WorkflowStoreV1Type = Static<typeof WorkflowStoreV1>

function storePath(): string {
  return harnessedFile('workflows.json')
}

function emptyStore(): WorkflowStoreV1Type {
  return { schemaVersion: SCHEMA_VERSIONS.workflowStore, workflows: {} }
}

/** v16.0 Phase 67 T1 — fold a repo key to its canonical case.
 *
 *  `path.resolve` preserves case COMPLETELY, the drive letter included (measured
 *  on win32: `resolve('d:/gitcode/harnessed')` === `'d:\\gitcode\\harnessed'`
 *  while `resolve('D:/GitCode/harnessed')` === `'D:\\GitCode\\harnessed'`). On
 *  Windows both name the SAME directory, so entering a repo with different casing
 *  minted two independent ledger slots and an in-flight workflow silently
 *  disappeared from view. Pre-existing defect, not specific to any one feature.
 *
 *  win32 ONLY. Folding on a case-SENSITIVE filesystem would merge two genuinely
 *  distinct directories — strictly worse than the bug being fixed.
 *
 *  Deliberately NOT `fs.realpathSync.native()`: that also resolves symlinks, so
 *  on macOS/CI `/tmp` becomes `/private/tmp` and EVERY existing key on every
 *  non-Windows host would change. Symlink semantics stay untouched.
 *
 *  `platform` is a parameter so callers and tests can exercise both branches
 *  without stubbing `process.platform`. */
export function normalizeRepoKey(key: string, platform: string = process.platform): string {
  return platform === 'win32' ? key.toLowerCase() : key
}

/** Pure fs walk-up: the repo key is the nearest ancestor of `cwd` containing a
 *  `.git` entry; falls back to the resolved `cwd` when there is none. No `git`
 *  subprocess — deterministic and unit-testable. Phase 67 T1: the result is
 *  case-folded on win32 (see `normalizeRepoKey`), so `activeKey()` — which
 *  composes on top of this — inherits the normalization for free. */
export function repoKey(cwd: string = process.cwd()): string {
  let dir = resolve(cwd)
  // walk up to the filesystem root
  for (;;) {
    if (existsSync(join(dir, '.git'))) return normalizeRepoKey(dir)
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return normalizeRepoKey(resolve(cwd))
}

/** Phase 34 (Spec 2/D) — session-scoped composite key. Overlays the active
 *  harness's session dimension onto the per-repo store key so two concurrent
 *  sessions in one repo hold independent workflow slots. `<repoKey>::<sessionId>`
 *  when the active platform exposes a session-id env (and it is set); the bare
 *  `repoKey` (byte-identical single-session path) otherwise. The store value type
 *  is unchanged — a composite key is just a legal `Record<string,…>` map-key, so
 *  no schema bump.
 *
 *  Phase 35 — the session-id env NAME is resolved through the PlatformDescriptor
 *  seam (`detectPlatform().sessionIdEnv`), NOT hardcoded, so the harness stays
 *  cross-harness (claude → `CLAUDE_CODE_SESSION_ID`; codex → `CODEX_SESSION_ID`
 *  since v16.0 Phase 63). (CC exposes the id to Bash-invoked CLI + hooks; subagents
 *  inherit the parent's id → same slot.) */
export function activeKey(cwd: string = process.cwd()): string {
  const base = repoKey(cwd)
  const envName = detectPlatform().sessionIdEnv
  const sid = envName ? process.env[envName]?.trim() : undefined
  return sid ? `${base}::${sid}` : base
}

/** Lock-FREE read. Returns the parsed store when `workflows.json` exists+valid,
 *  else an empty store.
 *
 *  issue #10 — the legacy singleton `current-workflow.json` is NO LONGER read as
 *  a fallback. It is an UNKEYED global file (one per harness root, shared by every
 *  repo), so surfacing it under `repoKey(cwd)` attributed one repo's workflow to
 *  whatever repo happened to read it first — a cross-repo state leak (the phantom
 *  `<workflow-state>` a fresh repo with no slot saw injected). `workflows.json`
 *  is the sole read SoT and is per-repo keyed, so isolation is by construction.
 *  (The 4.32.6 bin fix already stopped `bin/harnessed-inject-state.mjs` from
 *  reading the singleton; this brings the TS store path into line.) The singleton
 *  is still WRITTEN by state.ts as a write-only eval-record / rollback anchor —
 *  nothing reads it back into live state. */
export async function readStoreRaw(): Promise<WorkflowStoreV1Type> {
  try {
    const parsed = JSON.parse(await readFile(storePath(), 'utf8'))
    if (Value.Check(WorkflowStoreV1, parsed)) return parsed as WorkflowStoreV1Type
  } catch {
    // missing or corrupt store → empty (never the unkeyed legacy singleton)
  }
  return emptyStore()
}

/** Lock-FREE atomic write of the whole store. Caller holds the lock. */
export async function writeStoreRaw(store: WorkflowStoreV1Type): Promise<void> {
  if (!Value.Check(WorkflowStoreV1, store)) {
    const errs = [...Value.Errors(WorkflowStoreV1, store)].map((e) => e.message).join('; ')
    throw new Error(`workflow-store schema validation failed: ${errs}`)
  }
  const p = storePath()
  await mkdir(dirname(p), { recursive: true })
  await writeFileAtomic(p, JSON.stringify(store, null, 2))
}

/** 4.22.0 — lock-free read of this session's pending intent (composite key first,
 *  bare repoKey fallback — mirrors the workflow slot lookup). null when none. */
export async function readIntent(cwd: string = process.cwd()): Promise<IntentEntryType | null> {
  const store = await readStoreRaw()
  return store.intents?.[activeKey(cwd)] ?? store.intents?.[repoKey(cwd)] ?? null
}

/** All in-flight workflows (one per repo). */
export async function listWorkflows(): Promise<{ key: string; phase: string; status: string }[]> {
  const store = await readStoreRaw()
  return Object.entries(store.workflows).map(([key, wf]) => ({
    key,
    phase: wf.phase,
    status: wf.status,
  }))
}

// ── v16.0 Phase 67 T1 — one-time ledger key case migration ───────────────────
//
// `normalizeRepoKey` fixes NEW keys; the three repoKey-keyed maps already on disk
// (`workflows`, `retro_meta`, `intents`) still hold whatever casing minted them.
// This folds them once, in place, through the existing locked `mutateStore()`.
//
// Archive keys are ARCHIVE-ONLY — same posture as `::displaced-*`. No read path
// recognises `::premigrate-*` and none may be wired to: `activeKey()`/`repoKey()`
// cannot construct that suffix, so the hot reads are immune by construction.

/** Suffix marker for a collision loser preserved verbatim. */
const PREMIGRATE = '::premigrate-'

/** Short stable hash of a key. 6 hex is plenty: it only has to disambiguate the
 *  handful of original keys that fold onto one normalized key. */
function shortHash(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 6)
}

/** Fold a STORE key — the repo-key prefix ONLY.
 *
 *  `workflows` and `intents` are keyed by `activeKey()` = `${repoKey}::${sid}`
 *  (and the archive keys append their own `::`-suffix), so lowercasing the whole
 *  string would fold the session id too and reintroduce the very "stored key no
 *  longer matches what `activeKey()` builds" defect on a second axis. Splitting
 *  at the FIRST `::` mirrors `activeKey()`'s own composition. `retro_meta` keys
 *  are bare repo keys and contain no `::`, so they take the left branch. */
function foldStoreKey(key: string, platform: string): string {
  const i = key.indexOf('::')
  return i === -1
    ? normalizeRepoKey(key, platform)
    : normalizeRepoKey(key.slice(0, i), platform) + key.slice(i)
}

/** true when any key in any of the three maps is not already folded. */
function needsFold(store: WorkflowStoreV1Type, platform: string): boolean {
  for (const map of [store.workflows, store.retro_meta, store.intents]) {
    if (!map) continue
    for (const k of Object.keys(map)) if (foldStoreKey(k, platform) !== k) return true
  }
  return false
}

/** Re-key one map. `newer(a, b)` decides collisions: the winner takes the folded
 *  key, every loser is preserved verbatim under `<folded>::premigrate-<hash>`
 *  (hash of its ORIGINAL key). Nothing is ever dropped. */
function foldMap<T>(
  map: Record<string, T>,
  newer: (a: T, b: T) => boolean,
  platform: string,
): { next: Record<string, T>; folded: number; archived: number } {
  // Map preserves insertion order → deterministic output key order (and so a
  // deterministic serialization, which the idempotency contract rests on).
  const groups = new Map<string, { key: string; value: T }[]>()
  let folded = 0
  for (const [key, value] of Object.entries(map)) {
    const k = foldStoreKey(key, platform)
    if (k !== key) folded++
    const g = groups.get(k)
    if (g) g.push({ key, value })
    else groups.set(k, [{ key, value }])
  }

  const next: Record<string, T> = {}
  let archived = 0
  for (const [k, entries] of groups) {
    // `entries` is non-empty by construction; first-seen wins an exact tie.
    let win = entries[0] as { key: string; value: T }
    for (const e of entries) if (e !== win && newer(e.value, win.value)) win = e
    next[k] = win.value
    for (const e of entries) {
      if (e === win) continue
      next[`${k}${PREMIGRATE}${shortHash(e.key)}`] = e.value
      archived++
    }
  }
  return { next, folded, archived }
}

/**
 * Fold every repoKey-keyed ledger map to its canonical case, once.
 *
 * Called from `src/cli.ts` before any subcommand runs — the sibling posture of
 * `migrateLegacyHarnessedRoot()`.
 *
 * Cheap when idle: a lock-FREE `readStoreRaw()` probe decides whether anything
 * needs folding and returns without taking the lock and without writing when it
 * does not. Since a successful run leaves every key already folded, that is the
 * permanent steady state — the migration becomes a permanent no-op. The write,
 * when needed, goes through the existing exported `mutateStore()` so it is locked
 * and atomic (and re-folds inside the lock, the probe being a TOCTOU snapshot).
 *
 * `platform` is injected so all three CI runners exercise the win32 folding path.
 */
export async function migrateRepoKeyCase(
  platform: string = process.platform,
): Promise<{ folded: number; archived: number }> {
  const noop = { folded: 0, archived: 0 }
  if (platform !== 'win32') return noop
  if (!needsFold(await readStoreRaw(), platform)) return noop

  let result = noop
  // Dynamic import: state.ts statically imports this module, so a static import
  // back would be a cycle. Sister precedent: src/workflow/run.ts:714.
  const { mutateStore } = await import('./state.js')
  await mutateStore((store) => {
    const w = foldMap(
      store.workflows,
      (a, b) => (a.updated_at ?? '') > (b.updated_at ?? ''),
      platform,
    )
    // retro_meta carries no updated_at — the repo-level cadence counter that got
    // further is the one worth keeping; last_retro_at only breaks a tie.
    const r = store.retro_meta
      ? foldMap(
          store.retro_meta,
          (a, b) =>
            a.phases_since_retro !== b.phases_since_retro
              ? a.phases_since_retro > b.phases_since_retro
              : (a.last_retro_at ?? '') > (b.last_retro_at ?? ''),
          platform,
        )
      : undefined
    const i = store.intents ? foldMap(store.intents, (a, b) => a.ts > b.ts, platform) : undefined

    result = {
      folded: w.folded + (r?.folded ?? 0) + (i?.folded ?? 0),
      archived: w.archived + (r?.archived ?? 0) + (i?.archived ?? 0),
    }
    const next: WorkflowStoreV1Type = { ...store, workflows: w.next }
    if (r) next.retro_meta = r.next
    if (i) next.intents = i.next
    return next
  })

  if (result.folded > 0 || result.archived > 0) {
    console.error(
      `[harnessed] folded ${result.folded} ledger key(s) to canonical case (Windows paths are case-insensitive; differently-cased spellings of one repo held separate workflow slots)` +
        (result.archived > 0
          ? ` — ${result.archived} colliding entr${result.archived === 1 ? 'y' : 'ies'} preserved under ${PREMIGRATE}* (archive only; nothing dropped)`
          : ''),
    )
  }
  return result
}
