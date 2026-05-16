// Phase 3.1 Wave 1 T1.2 — checkpoint envelope schema (7th-existing surface,
// 1st checkpoint-namespace producer). Sister of `src/workflow/schema/phases.ts`
// (TypeBox `Type.Object` pattern, PATTERNS § 1 #1 90% reuse).
//
// IMPL NOTE — `cwd` field is a hard requirement per RESEARCH § 1.3 (Claude
// Agent SDK session resume binds to the original working directory; resuming
// from a different cwd silently fails). D-04 WIRE-IN: optional `session_id`
// captured via `sdkSpawn` `onSessionId` callback (CD-4 closure-ready) and
// archived in the checkpoint envelope so a future `--resume` can replay.
//
// Status is the same 3-state union as `currentWorkflow.v1` (D-02 KARPATHY
// lock — no FSM lib). Drift across the two unions = test-time mismatch in
// `tests/checkpoint/schema.test.ts`.

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

/** 3-state checkpoint status (D-02 KARPATHY lock). Matches `WorkflowStatus`
 *  in `currentWorkflow.v1.ts` by convention. */
export const CheckpointStatus = Type.Union([
  Type.Literal('active'),
  Type.Literal('paused'),
  Type.Literal('complete'),
])

/** Checkpoint envelope — execute-task workflow snapshot persisted to
 *  `.harnessed/checkpoints/<phase>.json`. Consumers MUST branch on
 *  `schemaVersion` via `branchOnSchemaVersion` (CD-5 rule (a)). */
export const CheckpointV1 = Type.Object(
  {
    schemaVersion: Type.Literal(SCHEMA_VERSIONS.checkpoint),
    phase: Type.String({ minLength: 1 }),
    status: CheckpointStatus,
    last_task: Type.String(),
    key_decisions: Type.Array(Type.String()),
    canonical_refs: Type.Array(Type.String()),
    /** D-04 WIRE-IN: optional SDK session_id captured via `sdkSpawn`
     *  `onSessionId` callback (CD-4 closure-ready) for future `--resume`. */
    session_id: Type.Optional(Type.String()),
    /** RESEARCH § 1.3 critical constraint — SDK session resume requires cwd
     *  match; we capture and validate at restore time. */
    cwd: Type.String({ minLength: 1 }),
    timestamp: Type.String({ format: 'date-time' }),
    archive_path: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
)

export type CheckpointV1Type = Static<typeof CheckpointV1>
