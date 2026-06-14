// Phase 3.1 W1 T1.3 — workflow state machine (D-02 KARPATHY 3-state, no FSM
// lib). Sister of `src/workflow/loadPhases.ts` (Value.Check validate-and-throw).
// Persists singleton state to `<harnessed-root>/current-workflow.json`. Hard limit
// ≤ 80L per D-02 (3 transitions + read/write helpers).
// Phase 5.1 W2 T2.2 — R10.2 concurrent write lock (D-05+D-06+D-07+D-08 LOCKED)
// proper-lockfile dir-level lock `<harnessed-root>/.lock` wraps writeCurrentWorkflow.
// W-01 PLAN-CHECK Path A: state.ts self-locks; engineHook acquires transitively.
//
// v3.0.3 hotfix — state + lock path migrated from `<cwd>/.harnessed/...` to
// `<homedir>/.harnessed/...` via `getHarnessedRoot()` SoT. Sister v2.0.1
// backup-root migration verbatim — EPERM-free when user CWD is read-only.

import { mkdir } from 'node:fs/promises'
import { Value } from '@sinclair/typebox/value'
import lockfile from 'proper-lockfile'
import { getHarnessedRoot, harnessedFile } from '../installers/lib/harnessedRoot.js'
import { SCHEMA_VERSIONS } from '../types/schemaVersion.js'
import { writeFileAtomic } from './atomicWrite.js'
import {
  CurrentWorkflowV1,
  type CurrentWorkflowV1Type,
  type SubProgressEntryType,
} from './schema/index.js'
import { readStoreRaw, repoKey, type WorkflowStoreV1Type, writeStoreRaw } from './workflowStore.js'

// v3.0.3 — lazy path resolution so HARNESSED_ROOT_OVERRIDE in e2e tests
// applies before the first write (module-level const captured the path
// at import time, before the test set the env var).
function statePath(): string {
  return harnessedFile('current-workflow.json')
}
function lockTarget(): string {
  return getHarnessedRoot()
}
function lockOpts() {
  return {
    stale: 10_000,
    retries: { retries: 3, factor: 2, minTimeout: 100 },
    lockfilePath: harnessedFile('.lock'),
  }
}

export class WorkflowStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkflowStateError'
  }
}

/** Thrown when another harnessed process holds the harness-root `.lock` (D-06 LOCKED). */
export class LockHeldError extends Error {
  constructor() {
    super(
      `another harnessed process holds the lock at ${harnessedFile('.lock')} — wait or kill stale process (try: harnessed status)`,
    )
    this.name = 'LockHeldError'
    Object.setPrototypeOf(this, LockHeldError.prototype)
  }
}

/** Acquire dir-level lock then run fn(); release in finally (D-05+D-06+D-08).
 *  v3.0.3: lock target is the homedir-rooted harness root (ensures the lock
 *  directory exists before proper-lockfile tries to write `.lock` into it —
 *  proper-lockfile will fail if the lockfilePath parent does not exist). */
async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const target = lockTarget()
  // Ensure the harness root exists before proper-lockfile tries to write.
  await mkdir(target, { recursive: true })
  let release: (() => Promise<void>) | undefined
  try {
    release = await lockfile.lock(target, lockOpts())
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ELOCKED') throw new LockHeldError()
    throw e
  }
  try {
    return await fn()
  } finally {
    await release?.()
  }
}

/** Read state; returns null on missing/corrupt/unknown-version (CD-5 rule (b)
 *  fail-soft). Throws only via writeCurrentWorkflow on known-version drift. */
export async function readCurrentWorkflow(): Promise<CurrentWorkflowV1Type | null> {
  // Phase 15 — resolve the active repo's slot from the per-repo multi-workflow
  // store. readStoreRaw validates the store (each slot is a CurrentWorkflowV1)
  // and transparently surfaces a legacy singleton in-memory (compat-read, D5),
  // so the CD-5 fail-soft null behavior is preserved.
  const store = await readStoreRaw()
  return store.workflows[repoKey()] ?? null
}

/** Lock-FREE write kernel: self-validate (loadPhases.ts pattern) + create parent
 *  dir + atomic write. The caller MUST already hold the dir-level lock — this is
 *  the shared inner body of `writeCurrentWorkflow` (lock → kernel) and
 *  `mutateSubProgress` (lock → read → fn → kernel). Keeping it lock-free is what
 *  lets `mutateSubProgress` do a single-lock read-modify-write without the
 *  double-lock deadlock that proper-lockfile (non-reentrant) would otherwise
 *  cause (pre-v4 review C5 lost-update fix). */
async function writeCurrentWorkflowUnlocked(s: CurrentWorkflowV1Type): Promise<void> {
  if (!Value.Check(CurrentWorkflowV1, s)) {
    const errs = [...Value.Errors(CurrentWorkflowV1, s)].map((e) => e.message).join('; ')
    throw new WorkflowStateError(`current-workflow schema validation failed: ${errs}`)
  }
  // Phase 15 — write into the active repo's slot in the per-repo store. The
  // store IS the SoT (one write path → no stale-index drift; fixes rogue F4/F5).
  const store = await readStoreRaw()
  store.workflows[repoKey()] = s
  await writeStoreRaw(store)
  // D7 dual-write — mirror the active repo's envelope to the legacy singleton
  // as a one-release rollback anchor (a code revert still finds current data).
  // The harness-root dir already exists (withLock mkdir + writeStoreRaw mkdir).
  await writeFileAtomic(statePath(), JSON.stringify(s, null, 2))
}

/** Write state with self-validate (loadPhases.ts pattern); creates parent dir;
 *  acquires dir-level lock (D-05+D-08) before writeFile (R10.2 concurrent safety). */
export async function writeCurrentWorkflow(s: CurrentWorkflowV1Type): Promise<void> {
  await withLock(() => writeCurrentWorkflowUnlocked(s))
}

/** v5.0 Spec 1 (ADR-0033) — atomic read-modify-write of the sub-progress ledger.
 *  The read + transform + write happen inside a SINGLE `withLock` so concurrent
 *  `checkpoint complete`/`fail` calls cannot lost-update each other (pre-v4 review
 *  C5: locking only the write, not the read, drops the loser's update).
 *
 *  `fn` receives the current ledger array (`sub_progress ?? []`) and returns the
 *  next array (e.g. a `markSub(...)` result). No-ops if there is no active
 *  workflow record (nothing seeded yet) — returns silently, sister to
 *  `pause()`/`complete()` graceful no-op. */
export async function mutateSubProgress(
  fn: (entries: SubProgressEntryType[]) => SubProgressEntryType[],
): Promise<void> {
  await withLock(async () => {
    const s = await readCurrentWorkflow()
    if (!s) return
    const next = fn(s.sub_progress ?? [])
    await writeCurrentWorkflowUnlocked({ ...s, sub_progress: next })
  })
}

/** Phase 22 — locked read-modify-write of the WHOLE per-repo store (used for the
 *  `retro_meta` sidecar, which lives at the store level so it survives the fresh
 *  envelope `activate()` writes each phase). Single `withLock` read→fn→write so it
 *  cannot lost-update a concurrent envelope write. No-op-safe: `fn` gets the parsed
 *  store (empty when none) and returns the next store. */
export async function mutateStore(
  fn: (store: WorkflowStoreV1Type) => WorkflowStoreV1Type,
): Promise<void> {
  await withLock(async () => {
    const store = await readStoreRaw()
    await writeStoreRaw(fn(store))
  })
}

/** Transition 1/3 — start a new workflow for `phase`. */
export async function activate(phase: string, checkpointPath: string | null = null): Promise<void> {
  await writeCurrentWorkflow({
    schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
    phase,
    status: 'active',
    last_checkpoint_path: checkpointPath,
    started_at: new Date().toISOString(),
  })
}

/** Transition 2/3 — pause active workflow; preserves started_at. */
export async function pause(): Promise<void> {
  const s = await readCurrentWorkflow()
  if (!s) return
  await writeCurrentWorkflow({ ...s, status: 'paused', paused_at: new Date().toISOString() })
}

/** Transition 3/3 — complete active/paused workflow; preserves timestamps. */
export async function complete(): Promise<void> {
  const s = await readCurrentWorkflow()
  if (!s) return
  await writeCurrentWorkflow({ ...s, status: 'complete', completed_at: new Date().toISOString() })
}
