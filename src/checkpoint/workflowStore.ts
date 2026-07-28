// Phase 15 — per-repo multi-workflow store. The global singleton
// `current-workflow.json` is replaced by `workflows.json`, a map of
// repo-root → CurrentWorkflowV1 envelope. state.ts rewires its read/write
// kernels to the active repo's slot (behind-API: the 17 call sites + the
// envelope schema are unchanged). These kernels are lock-FREE — all locking
// stays in state.ts (sister: writeCurrentWorkflowUnlocked).
//
// Fixes the reverted rogue impl (F4 bolt-on cold index / F5 stale index) by
// construction: this store IS the sole SoT, reached through one write path.

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

/** Pure fs walk-up: the repo key is the nearest ancestor of `cwd` containing a
 *  `.git` entry; falls back to the resolved `cwd` when there is none. No `git`
 *  subprocess — deterministic and unit-testable. */
export function repoKey(cwd: string = process.cwd()): string {
  let dir = resolve(cwd)
  // walk up to the filesystem root
  for (;;) {
    if (existsSync(join(dir, '.git'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return resolve(cwd)
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
 *  cross-harness (claude → `CLAUDE_CODE_SESSION_ID`; codex → `null` →
 *  single-session). (CC exposes the id to Bash-invoked CLI + hooks; subagents
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
