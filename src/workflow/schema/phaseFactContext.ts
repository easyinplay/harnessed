// src/workflow/schema/phaseFactContext.ts — Phase v3.0-3.3 W0 T3.3.W0.8 (R30.9 13 NEW field MIN scope).
// TypeBox typed shape for PhaseFactContext.
// Sister: src/workflow/exprBuilder.ts evalGate(expr, ctx: PhaseFactContext).
//
// v2 SHIPPED 109L → v3 ~135L (Appendix C "core MIN" 13 NEW field per K3 mitigation,
// defer 35 gstack optional fires_when 到 v3.x patch).
//
// Field source (v3 additive):
//   phase: v2 14 + 6 NEW core (D-01 + web-design + D-06 + sister v2 backfill 3) = 20
//   subtask: v2 13 + 5 NEW (3 enum + 2 boolean) = 18
//   root flat: v2 6 + 2 NEW boolean = 8

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

// NEW v3 subtask enum — test_type (4 literal per Appendix C subtask shape)
const TestType = Type.Union([
  Type.Literal('ci-commit'),
  Type.Literal('probe'),
  Type.Literal('python-backend'),
  Type.Literal('perf-diagnostic'),
])

// NEW v3 subtask enum — search_type (6 literal per Appendix C subtask shape)
const SearchType = Type.Union([
  Type.Literal('keyword'),
  Type.Literal('descriptive'),
  Type.Literal('academic'),
  Type.Literal('lib-docs'),
  Type.Literal('github-url'),
  Type.Literal('single-url'),
])

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
    // Phase v3.0-3.3 W0 T3.3.W0.8 — 6 NEW core boolean per Appendix C MIN scope:
    is_complex_architecture: Type.Boolean(), // D-01 master /plan → /plan-architecture
    requires_creative_polish: Type.Boolean(), // legacy XOR-era flag; v4.11 two-stage no longer gates on it
    requires_persisted_plan: Type.Boolean(), // D-06 planning-with-files cross-stage
    requires_peer_review: Type.Boolean(), // sister gsd-review v2 fires_when backfill
    is_final_step: Type.Boolean(), // sister code-simplifier v2 fires_when backfill
    has_business_decisions: Type.Boolean(), // sister gstack-plan-ceo-review v2 backfill
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
    // Phase v3.0-3.3 W0 T3.3.W0.8 — 5 NEW per Appendix C MIN scope:
    test_type: TestType, // 4-literal enum (web-testing-routing fires_when)
    search_type: SearchType, // 6-literal enum (web-search-routing fires_when)
    needs_lib_docs: Type.Boolean(), // ctx7 / context7 MCP routing
    needs_web_search: Type.Boolean(), // tavily/exa MCP routing (subtask-nested + root-flat duplicate per Appendix C)
    needs_google_workspace: Type.Boolean(), // google-workspace gws CLI routing
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
    // Phase v3.0-3.3 W0 T3.3.W0.8 — 2 NEW root-flat boolean per Appendix C MIN scope:
    needs_web_search: Type.Boolean(), // web-search-routing.yaml top-level ref convenience
    is_critical_release: Type.Boolean(), // stage-routing.yaml verify-multispec-critical-release
  },
  { additionalProperties: false },
)

export type PhaseFactContextT = Static<typeof PhaseFactContext>
