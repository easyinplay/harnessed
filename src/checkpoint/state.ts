// Phase 3.1 W1 T1.3 — workflow state machine (D-02 KARPATHY 3-state, no FSM
// lib). Sister of `src/workflow/loadPhases.ts` (Value.Check validate-and-throw).
// Persists singleton state to `.harnessed/current-workflow.json`. Hard limit
// ≤ 80L per D-02 (3 transitions + read/write helpers).

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { branchOnSchemaVersion, SCHEMA_VERSIONS } from '../types/schemaVersion.js'
import { CurrentWorkflowV1, type CurrentWorkflowV1Type } from './schema/index.js'

const STATE_PATH = '.harnessed/current-workflow.json'

export class WorkflowStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkflowStateError'
  }
}

/** Read state; returns null on missing/corrupt/unknown-version (CD-5 rule (b)
 *  fail-soft). Throws only via writeCurrentWorkflow on known-version drift. */
export async function readCurrentWorkflow(): Promise<CurrentWorkflowV1Type | null> {
  let raw: string
  try {
    raw = await readFile(STATE_PATH, 'utf8')
  } catch {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  const v = (parsed as { schemaVersion?: string }).schemaVersion ?? ''
  return branchOnSchemaVersion(v, {
    v1: () => (Value.Check(CurrentWorkflowV1, parsed) ? (parsed as CurrentWorkflowV1Type) : null),
    unknown: () => null,
  })
}

/** Write state with self-validate (loadPhases.ts pattern); creates parent dir. */
export async function writeCurrentWorkflow(s: CurrentWorkflowV1Type): Promise<void> {
  if (!Value.Check(CurrentWorkflowV1, s)) {
    const errs = [...Value.Errors(CurrentWorkflowV1, s)].map((e) => e.message).join('; ')
    throw new WorkflowStateError(`current-workflow schema validation failed: ${errs}`)
  }
  await mkdir(dirname(STATE_PATH), { recursive: true })
  await writeFile(STATE_PATH, JSON.stringify(s, null, 2), 'utf8')
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
