// src/workflow/schema/planFeature.ts — Phase 3.2 W2 T2.2 (D-03 WIRED LOCKED).
// Sister src/workflow/schema/phases.ts — separate DSL schema per RESEARCH § 5.3
// Path A single-responsibility (NOT union with phases.ts; future workflow types
// 易加). Defines plan-feature 5-phase reference DSL with:
//   - workflow-level `on_veto` (NOT per-phase per RESEARCH § 5.2 DRY)
//   - phase-level optional `invokes` (JINJA placeholder accepted, interpolated at loadPhases)
import { type Static, Type } from '@sinclair/typebox'

export const PlanFeaturePhase = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    name: Type.String({ minLength: 1 }),
    upstream: Type.String({ minLength: 1 }),
    model: Type.Union([Type.Literal('opus'), Type.Literal('sonnet'), Type.Literal('haiku')]),
    invokes: Type.Optional(Type.String()), // JINJA placeholder (e.g. '{{ gstack_prefix }}office-hours')
    skills: Type.Array(Type.String()),
    max_iterations: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false },
)

export const PlanFeatureWorkflowV1 = Type.Object(
  {
    workflow: Type.Literal('plan-feature'),
    on_veto: Type.Optional(Type.Literal('halt_workflow')),
    phases: Type.Array(PlanFeaturePhase, { minItems: 1 }),
  },
  { additionalProperties: false },
)
export type PlanFeaturePhaseType = Static<typeof PlanFeaturePhase>
export type PlanFeatureWorkflowV1Type = Static<typeof PlanFeatureWorkflowV1>
