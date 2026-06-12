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

/** v5.0 Spec 1 (ADR-0033 D4) — handoff/existence evidence ref. `evidence:
 *  [{path, sha256}]` serves both the fail-closed existence guard (C) and
 *  cross-CC handoff sha256 drift detection (F). */
export const EvidenceRef = Type.Object(
  { path: Type.String({ minLength: 1 }), sha256: Type.String({ minLength: 1 }) },
  { additionalProperties: false },
)

/** v5.0 Spec 1 (ADR-0033 D1) — per-sub progress ledger entry. Seeded upfront
 *  from the `gates` plan (fire→pending, skip→skipped+reason); flipped to
 *  done/failed by `checkpoint complete`/`fail`. */
export const SubProgressEntry = Type.Object(
  {
    // flattened sub name, e.g. "task-code".
    sub: Type.String({ minLength: 1 }),
    status: Type.Union([
      Type.Literal('pending'),
      Type.Literal('done'),
      Type.Literal('failed'),
      Type.Literal('skipped'),
      Type.Literal('rejected'),
    ]),
    gate_fired: Type.Boolean(),
    // skip reason (from gates plan skip[].reason).
    reason: Type.Optional(Type.String()),
    // D2 (eng-review) — three-state evidence posture, NOT a boolean:
    //   'verified'      — artifacts_expected declared AND all present (sha256 recorded)
    //   'none_declared' — leaf declares no artifacts_expected → guard N/A (NOT a pass)
    //   'overridden'    — --force used to bypass a missing-artifact block
    evidence_status: Type.Optional(
      Type.Union([
        Type.Literal('verified'),
        Type.Literal('none_declared'),
        Type.Literal('overridden'),
      ]),
    ),
    evidence: Type.Optional(Type.Array(EvidenceRef)),
    // G6 — failure counter; incremented only on each ->failed transition (drives
    // breakLoop detection). 'rejected' is terminal and does NOT increment it.
    fail_count: Type.Optional(Type.Integer({ minimum: 0 })),
  },
  { additionalProperties: false },
)

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
    // v5.0 Spec 1 (ADR-0033 D1/D3) — additive optional ledger (sole SoT; the
    // checkpoint envelope does NOT carry a copy). Old files without this field
    // still `Value.Check`-pass → no schema version bump; readers use `?? []`.
    sub_progress: Type.Optional(Type.Array(SubProgressEntry)),
    // G1 — verification depth used during the verify phase ('light' | 'full').
    verify_mode: Type.Optional(Type.Union([Type.Literal('light'), Type.Literal('full')])),
    // G2 — when true the next-step contract reports NEXT:auto (skill auto-advances);
    // when false NEXT:manual (pause for the operator). Precedence env > this > default.
    auto_transition: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
)

export type CurrentWorkflowV1Type = Static<typeof CurrentWorkflowV1>
export type SubProgressEntryType = Static<typeof SubProgressEntry>
export type EvidenceRefType = Static<typeof EvidenceRef>
