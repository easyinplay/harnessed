// src/workflow/schema/phaseFactContext.ts — Phase v2.0-2.3 W0 T2.3.W0.6 (T2.3.W1.3 union).
// TypeBox typed shape for PhaseFactContext (RESEARCH § 1.3 verbatim).
// Sister: src/workflow/exprBuilder.ts evalGate(expr, ctx: PhaseFactContext).
//
// Field source (合并 RESEARCH § 1.3 base + W0.2 judgments/*.yaml 实际引用):
//   phase: 11 boolean + 1 enum (type) + 2 number (open_decisions, scope_days)
//          + 2 extra boolean from strategic-gate.yaml / phase-gate.yaml
//            (has_cross_phase_data_flow, scope_locked_in_history)
//   subtask: 7 boolean + 1 enum (type) + 1 enum (regression_risk) + 2 number
//            + 1 enum (error_cost) + 1 boolean (communication_needed)
//            + 1 boolean (has_api_contract) + 1 number (parallel_count)
//   user: explicit_signal string[]
//   teammate_send_message_needed / subagent_context_overflow / shared_task_list /
//     opposing_hypothesis_debate / fullstack_three_way / test_fail :
//     6 root-level boolean (per parallelism-gate.yaml + tdd-gate.yaml flat refs)

import { type Static, Type } from '@sinclair/typebox'

const PhaseType = Type.Union([
  Type.Literal('new_project'),
  Type.Literal('new_milestone'),
  Type.Literal('new_feature'),
  Type.Literal('bug_fix'),
  Type.Literal('tech_debt'),
  Type.Literal('continuing_phase'),
])

const SubtaskType = Type.Union([
  Type.Literal('crud'),
  Type.Literal('core_logic'),
  Type.Literal('algorithm'),
  Type.Literal('ui_polish'),
  Type.Literal('docs_only'),
  Type.Literal('single_command_query'),
  Type.Literal('standard_lib_call'),
])

const RegressionRisk = Type.Union([
  Type.Literal('low'),
  Type.Literal('medium'),
  Type.Literal('high'),
])

const ErrorCost = Type.Union([Type.Literal('low'), Type.Literal('medium'), Type.Literal('high')])

const PhaseShape = Type.Object(
  {
    type: PhaseType,
    open_decisions: Type.Number(),
    scope_days: Type.Number(),
    single_task: Type.Boolean(),
    is_critical_module: Type.Boolean(),
    has_ui_changes: Type.Boolean(),
    has_auth_or_secrets: Type.Boolean(),
    has_design_changes: Type.Boolean(),
    is_major_release: Type.Boolean(),
    is_large_refactor: Type.Boolean(),
    spec_ambiguous: Type.Boolean(),
    unfamiliar_module: Type.Boolean(),
    has_cross_phase_data_flow: Type.Boolean(),
    scope_locked_in_history: Type.Boolean(),
  },
  { additionalProperties: false },
)

const SubtaskShape = Type.Object(
  {
    type: SubtaskType,
    lines: Type.Number(),
    approaches: Type.Number(),
    core_algorithm: Type.Boolean(),
    is_core_business_logic: Type.Boolean(),
    is_algorithm: Type.Boolean(),
    is_data_processing: Type.Boolean(),
    regression_risk: RegressionRisk,
    reliability_required: Type.Boolean(),
    has_api_contract: Type.Boolean(),
    error_cost: ErrorCost,
    parallel_count: Type.Number(),
    communication_needed: Type.Boolean(),
  },
  { additionalProperties: false },
)

const UserShape = Type.Object(
  {
    explicit_signal: Type.Array(Type.String()),
  },
  { additionalProperties: false },
)

export const PhaseFactContext = Type.Object(
  {
    phase: PhaseShape,
    subtask: SubtaskShape,
    user: UserShape,
    // 5 Agent Teams flag (per parallelism-gate.yaml flat fires_when array, D-11).
    teammate_send_message_needed: Type.Boolean(),
    subagent_context_overflow: Type.Boolean(),
    shared_task_list: Type.Boolean(),
    opposing_hypothesis_debate: Type.Boolean(),
    fullstack_three_way: Type.Boolean(),
    // 1 TDD flag (tdd-gate.yaml subtask.test_fail flat ref via diagnose capability).
    test_fail: Type.Boolean(),
  },
  { additionalProperties: false },
)

export type PhaseFactContextT = Static<typeof PhaseFactContext>
