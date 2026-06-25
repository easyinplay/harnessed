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
import { harnessedFile } from '../installers/lib/harnessedRoot.js'
import { SCHEMA_VERSIONS } from '../types/schemaVersion.js'
import { writeFileAtomic } from './atomicWrite.js'
import { CurrentWorkflowV1, type CurrentWorkflowV1Type } from './schema/currentWorkflow.v1.js'

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

export const WorkflowStoreV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.workflowStore),
    workflows: Type.Record(Type.String(), CurrentWorkflowV1),
    // Additive-optional (no schemaVersion bump — old stores Value.Check-pass).
    retro_meta: Type.Optional(Type.Record(Type.String(), RetroMetaEntry)),
  },
  { additionalProperties: false },
)
export type WorkflowStoreV1Type = Static<typeof WorkflowStoreV1>

function storePath(): string {
  return harnessedFile('workflows.json')
}
function legacyPath(): string {
  return harnessedFile('current-workflow.json')
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

/** Phase 34 (Spec 2/D) — session-scoped composite key. Overlays the CC session
 *  dimension onto the per-repo store key so two concurrent sessions in one repo
 *  hold independent workflow slots. `<repoKey>::<sessionId>` when
 *  `CLAUDE_CODE_SESSION_ID` is set; the bare `repoKey` (byte-identical
 *  single-session path) when it is absent/empty. The store value type is
 *  unchanged — a composite key is just a legal `Record<string,…>` map-key, so no
 *  schema bump. (CC exposes the session id to Bash-invoked CLI as
 *  `CLAUDE_CODE_SESSION_ID`; subagents inherit the parent's id → same slot.) */
export function activeKey(cwd: string = process.cwd()): string {
  const base = repoKey(cwd)
  const sid = process.env.CLAUDE_CODE_SESSION_ID?.trim()
  return sid ? `${base}::${sid}` : base
}

/** Lock-FREE read. Returns the parsed store when `workflows.json` exists+valid.
 *  Otherwise, when a legacy singleton `current-workflow.json` exists+valid,
 *  surfaces it IN MEMORY under repoKey(cwd) (compat-read, D5) WITHOUT writing —
 *  reads stay side-effect-free; the migration persists on the next locked write.
 *  Empty store when neither is present/valid. */
export async function readStoreRaw(): Promise<WorkflowStoreV1Type> {
  try {
    const parsed = JSON.parse(await readFile(storePath(), 'utf8'))
    if (Value.Check(WorkflowStoreV1, parsed)) return parsed as WorkflowStoreV1Type
  } catch {
    // missing or corrupt store → try legacy fallback below
  }
  try {
    const legacy = JSON.parse(await readFile(legacyPath(), 'utf8'))
    if (Value.Check(CurrentWorkflowV1, legacy)) {
      return {
        schemaVersion: SCHEMA_VERSIONS.workflowStore,
        workflows: { [repoKey()]: legacy as CurrentWorkflowV1Type },
      }
    }
  } catch {
    // no legacy either
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

/** All in-flight workflows (one per repo). */
export async function listWorkflows(): Promise<{ key: string; phase: string; status: string }[]> {
  const store = await readStoreRaw()
  return Object.entries(store.workflows).map(([key, wf]) => ({
    key,
    phase: wf.phase,
    status: wf.status,
  }))
}
