// Phase 3.1 Wave 1 T1.2 — current-workflow state machine schema (8th surface).
// Sister of `checkpoint.v1.ts` (same 3-state union by convention).
//
// Persisted to `.harnessed/current-workflow.json` and read by the state
// machine in `src/checkpoint/state.ts` (T1.3). D-02 KARPATHY 3-state lock
// (no xstate / robot3 — pure data with 3 transition functions).

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

/** 3-state workflow status (D-02 KARPATHY lock). Mirrors `CheckpointStatus`
 *  in `checkpoint.v1.ts` by convention. */
export const WorkflowStatus = Type.Union([
  Type.Literal('active'),
  Type.Literal('paused'),
  Type.Literal('complete'),
])

/** Current-workflow envelope — singleton state file pointing at the last
 *  checkpoint path. `last_checkpoint_path` is nullable on `activate()`
 *  before the first checkpoint write. */
export const CurrentWorkflowV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.currentWorkflow),
    phase: Type.String({ minLength: 1 }),
    status: WorkflowStatus,
    last_checkpoint_path: Type.Union([Type.String(), Type.Null()]),
    // ISO-8601 by convention (TypeBox `format` requires Ajv-style registry; shape-check only here, drift surfaces in state.ts writer).
    started_at: Type.String({ minLength: 1 }),
    paused_at: Type.Optional(Type.String({ minLength: 1 })),
    completed_at: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
)

export type CurrentWorkflowV1Type = Static<typeof CurrentWorkflowV1>
