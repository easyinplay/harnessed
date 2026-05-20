// src/workflow/schema/workflow.ts — Phase v2.0-2.4 W0 T2.4.W0.1 (R20.1 + R20.2 + R20.9).
// TypeBox schema for harnessed.workflow.v2 — covers 4 workflow.yaml v2 surfaces
// (plan-feature / execute-task / research / verify-work) per D-04 / D-09 / D-10
// / D-11 / D-12 / D-15 + R20.10 acceptance c/d (max_iterations_exceeded fallback).
//
// v1 → v2 字段 delta (sister phases.ts v1 / planFeature.ts v1):
//   ADD `schema_version: 'harnessed.workflow.v2'` (16th surface in schemaVersion.ts)
//   ADD `phase.capability`    — '{{ capabilities.<name>.cmd }}' template ref (D-10)
//   ADD `phase.args`          — Type.Record(string, unknown) param map (D-10)
//   ADD `phase.gate`          — judgments.<file>.<gate>.fires 4-level ref (D-04 + D-11)
//   ADD `phase.on`            — Array<{if, invoke?, action?}> conditional clause (D-09)
//   ADD `phase.parallelism`   — judgments.parallelism-gate.<route>.fires ref (D-11)
//   ADD `phase.fallback`      — max_iterations_exceeded explicit halt (R20.10 c)
//   ADD `phase.artifacts_expected` — string[] persistence (D-15 + T2.4.W1.3 planning-with-files)
//   CHANGE `model` to 3 literal (haiku/sonnet/opus) — drop v1 'inherit' per PLAN L313 spec
//   CHANGE root `workflow` → keep + ADD `description` optional
//
// IMPL NOTE: workflow engine pre-resolves `gate` / `parallelism` 4-level ref via
// T2.3.W0.4 judgmentResolver BEFORE expr-eval evaluation (per T2.4.W0.1 Action L314).
// additionalProperties:false strict per Phase 2.2 STRIDE T-2.2-02 mitigation.

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

const ModelTier = Type.Union([Type.Literal('haiku'), Type.Literal('sonnet'), Type.Literal('opus')])

const OnAction = Type.Union([Type.Literal('skip'), Type.Literal('invoke')])

const OnClause = Type.Object(
  {
    if: Type.String(), // expr-eval expression OR judgments.<file>.<gate>.fires ref
    invoke: Type.Optional(Type.String()), // '{{ capabilities.<name>.cmd }}' OR literal
    action: Type.Optional(OnAction),
  },
  { additionalProperties: false },
)

const FallbackMaxIterationsExceeded = Type.Object(
  {
    action: Type.Literal('emit_warning_and_halt'), // R20.10 acceptance c "explicit NOT silent"
    message: Type.String(),
    exit_code: Type.Number(),
  },
  { additionalProperties: false },
)

const PhaseFallback = Type.Object(
  {
    max_iterations_exceeded: Type.Optional(FallbackMaxIterationsExceeded),
  },
  { additionalProperties: false },
)

export const WorkflowPhaseV2 = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    name: Type.Optional(Type.String()),
    upstream: Type.Optional(Type.String()),
    capability: Type.Optional(Type.String()), // '{{ capabilities.ralph-loop.cmd }}'
    model: Type.Optional(ModelTier),
    invokes: Type.Optional(Type.String()), // legacy slash-cmd OR JINJA template
    args: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    gate: Type.Optional(Type.String()), // judgments.<file>.<gate>.fires 4-level ref
    on: Type.Optional(Type.Array(OnClause)),
    parallelism: Type.Optional(Type.String()), // judgments.parallelism-gate.<route>.fires
    fallback: Type.Optional(PhaseFallback),
    max_iterations: Type.Optional(
      Type.Union([Type.Number(), Type.String()]), // numeric literal OR jinja '{{ defaults.x.y }}'
    ),
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
