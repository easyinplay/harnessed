// src/workflow/schema/workflow.v2.ts — Phase v2.0-2.4 W0 T2.4.W0.1 SHIPPED schema.
// SPLIT from workflow.ts during Phase v3.0-3.3 W0 T3.3.W0.5 (v3 schema bump) to
// preserve karpathy ≤200L hard limit + maintain v2 yaml backward-compat during
// setup-helpers v2 deprecation period (T3.3.W0.12).
//
// Removal target: Phase v3.0 GA + 1 minor cycle (sister CHANGELOG alias map period).

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

const ModelTier = Type.Union([Type.Literal('haiku'), Type.Literal('sonnet'), Type.Literal('opus')])

const OnAction = Type.Union([Type.Literal('skip'), Type.Literal('invoke')])

export const OnClauseV2 = Type.Object(
  {
    if: Type.String(),
    invoke: Type.Optional(Type.String()),
    action: Type.Optional(OnAction),
  },
  { additionalProperties: false },
)

export const FallbackMaxIterationsExceededV2 = Type.Object(
  {
    action: Type.Literal('emit_warning_and_halt'),
    message: Type.String(),
    exit_code: Type.Number(),
  },
  { additionalProperties: false },
)

export const PhaseFallbackV2 = Type.Object(
  {
    max_iterations_exceeded: Type.Optional(FallbackMaxIterationsExceededV2),
  },
  { additionalProperties: false },
)

export const WorkflowPhaseV2 = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    name: Type.Optional(Type.String()),
    upstream: Type.Optional(Type.String()),
    capability: Type.Optional(Type.String()),
    model: Type.Optional(ModelTier),
    invokes: Type.Optional(Type.String()),
    args: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    gate: Type.Optional(Type.String()),
    on: Type.Optional(Type.Array(OnClauseV2)),
    parallelism: Type.Optional(Type.String()),
    fallback: Type.Optional(PhaseFallbackV2),
    max_iterations: Type.Optional(Type.Union([Type.Number(), Type.String()])),
    artifacts_expected: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: false },
)

export const WorkflowSchemaV2 = Type.Object(
  {
    schema_version: Type.Literal(SCHEMA_VERSIONS.workflow),
    workflow: Type.String({ minLength: 1 }),
    description: Type.Optional(Type.String()),
    phases: Type.Array(WorkflowPhaseV2, { minItems: 1 }),
  },
  { additionalProperties: false },
)

export type WorkflowPhaseV2T = Static<typeof WorkflowPhaseV2>
export type WorkflowSchemaV2T = Static<typeof WorkflowSchemaV2>
/** Alias of `WorkflowPhaseV2T` — sister deferred-items.md T2.4.W1.5 path-A naming. */
export type PhaseShape = WorkflowPhaseV2T
