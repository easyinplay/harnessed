// src/workflow/schema/workflow.ts — Phase v3.0-3.3 W0 T3.3.W0.5 (R30.9 + D-09 + D-05 + D-01).
// TypeBox schema for harnessed.workflow.v3 — covers 20 workflow yaml v3 surfaces
// (4 master orchestrator + 14 sub-stage + 2 standalone per D-07) per
// D-04 + D-09 + D-05 + D-01 NEW + Pattern A A.1 reconcile (strict Literal Union).
//
// v2 → v3 字段 delta (sister Phase v2.0-2.4 W0 T2.4.W0.1 SHIPPED v2 86L):
//   BUMP `schema_version: 'harnessed.workflow.v3'` (17th surface in schemaVersion.ts)
//   ADD  `disciplines_applied` — strict Literal Union of 6 basename (D-09 + Pattern A A.1)
//   ADD  `tools_available`     — string[] capabilities.yaml entry name (D-05)
//   ADD  `delegates_to`        — DelegationClause[] master orchestrator only (D-01 NEW)
//   ADD  phase.`invokes_tools` — InvokeToolClause[] conditional fire (D-05)
//   CHANGE `phases` to Optional — master has delegates_to only, sub/standalone has phases
//
// Runtime invariant (NOT schema): every parsed yaml must have phases[] OR delegates_to[]
// (engine asserts in `runWorkflow`); BOTH absent → fail-fast.
//
// IMPL NOTE: workflow engine pre-resolves `gate` / `parallelism` 4-level ref via
// T2.3.W0.4 judgmentResolver BEFORE expr-eval evaluation.
// additionalProperties:false strict per Phase 2.2 STRIDE T-2.2-02 mitigation.
// Pattern A A.1 strict Literal Union LOCKED — typo basename ('karpatHy' etc) fails fast.

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

const ModelTier = Type.Union([Type.Literal('haiku'), Type.Literal('sonnet'), Type.Literal('opus')])

const OnAction = Type.Union([Type.Literal('skip'), Type.Literal('invoke')])

// Pattern A A.1 LOCK — strict Literal Union of 6 discipline basename (D-09).
// Typo ('karpatHy' / 'output_style') fails Value.Check fast; sister 6 yaml file basename verbatim.
export const DisciplineName = Type.Union([
  Type.Literal('karpathy'),
  Type.Literal('output-style'),
  Type.Literal('language'),
  Type.Literal('operational'),
  Type.Literal('priority'),
  Type.Literal('protocols'),
])

export const OnClause = Type.Object(
  {
    if: Type.String(), // expr-eval expression OR judgments.<file>.<gate>.fires ref
    invoke: Type.Optional(Type.String()), // '{{ capabilities.<name>.cmd }}' OR literal
    action: Type.Optional(OnAction),
  },
  { additionalProperties: false },
)

// D-05 NEW — phase-level conditional tool fire (sister OnClause 'if?' + 主语段 style).
export const InvokeToolClause = Type.Object(
  {
    if: Type.Optional(Type.String()), // optional — 无 if = unconditional fire
    tool: Type.String({ minLength: 1 }), // capabilities.yaml entry name (cross-validate T3.3.W0.10)
  },
  { additionalProperties: false },
)

// D-01 NEW — master orchestrator declarative delegation (replaces phase-level invokes for master).
export const DelegationClause = Type.Object(
  {
    sub: Type.String({ minLength: 1 }), // sub-stage workflow name e.g. 'strategic' / 'phase' / 'subtask'
    gate: Type.Optional(Type.String()), // judgments.<file>.<trigger>.fires 4-level ref
    mode: Type.Optional(Type.Union([Type.Literal('parallel'), Type.Literal('serial')])),
    order: Type.Optional(Type.Number()), // serial-only: explicit ordering (K9 mitigation enforced in check-workflow-schema)
  },
  { additionalProperties: false },
)

export const FallbackMaxIterationsExceeded = Type.Object(
  {
    action: Type.Literal('emit_warning_and_halt'), // R20.10 acceptance c "explicit NOT silent"
    message: Type.String(),
    exit_code: Type.Number(),
  },
  { additionalProperties: false },
)

export const PhaseFallback = Type.Object(
  {
    max_iterations_exceeded: Type.Optional(FallbackMaxIterationsExceeded),
  },
  { additionalProperties: false },
)

export const WorkflowPhaseV3 = Type.Object(
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
    invokes_tools: Type.Optional(Type.Array(InvokeToolClause)), // NEW v3 D-05 phase-level conditional fire
    // v3.8.0 P1 — Conditional RULES inject. Empty/absent → DEFAULT_INJECTS_RULES
    // (escalation + transparent-skip, ~470 tokens). Declare full list
    // ['escalation', 'transparent-skip', 'agent-teams-prevention'] on phases
    // that genuinely involve Agent Teams escalation (task-deliver / task-test /
    // verify-multispec). Unknown rule names silently filtered at runtime
    // (forward-compat for future RULES additions).
    injects_rules: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: false },
)

export const WorkflowSchemaV3 = Type.Object(
  {
    schema_version: Type.Literal(SCHEMA_VERSIONS.workflow_v3),
    workflow: Type.String({ minLength: 1 }),
    description: Type.Optional(Type.String()),
    disciplines_applied: Type.Optional(Type.Array(DisciplineName)), // NEW v3 D-09 (Pattern A A.1 strict Literal Union)
    tools_available: Type.Optional(Type.Array(Type.String())), // NEW v3 D-05 (cross-validate T3.3.W0.10)
    delegates_to: Type.Optional(Type.Array(DelegationClause)), // NEW v3 D-01 (master orchestrator only)
    phases: Type.Optional(Type.Array(WorkflowPhaseV3, { minItems: 1 })), // 改 Optional — master 无 phases, sub/standalone 必有
  },
  { additionalProperties: false },
)

export type WorkflowPhaseV3T = Static<typeof WorkflowPhaseV3>
export type WorkflowSchemaV3T = Static<typeof WorkflowSchemaV3>
export type DelegationClauseT = Static<typeof DelegationClause>
export type InvokeToolClauseT = Static<typeof InvokeToolClause>
export type DisciplineNameT = Static<typeof DisciplineName>
export type FallbackMaxIterationsExceededT = Static<typeof FallbackMaxIterationsExceeded>
export type PhaseFallbackT = Static<typeof PhaseFallback>
export type OnClauseT = Static<typeof OnClause>

// v2 backward-compat re-export — sister run.ts + checker still reads v2 yaml during transition.
// Phase v2.0-2.4 W0 T2.4.W0.1 SHIPPED — KEEP for Phase v3.0-3.3 setup-helpers v2 deprecation period.
// CHANGELOG: drop v2 alias post v3.0 GA + setup-helpers nested scan + v2 yaml removed.
export {
  type PhaseShape,
  WorkflowPhaseV2,
  type WorkflowPhaseV2T,
  WorkflowSchemaV2,
  type WorkflowSchemaV2T,
} from './workflow.v2.js'
