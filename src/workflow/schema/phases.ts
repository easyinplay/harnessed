// Per-phase model tier schema — ADR 0011 errata (phase 2.2 W3 — F5 / CD-2 D-04).
//
// Intel `omc-comparison.md` § CD-2 (per-phase model tier — task workflow 省 token):
//   每个 workflow phase 静态标 `model:` 字段,agentFactory 读 `phase.model` 填进
//   `AgentDefinition.model`(SDK 5 字段里本就有 `model`,零新引擎)。
//
// 默认表 (v3 task workflow phases):
//   01-clarify = opus    (任务复杂度澄清)
//   02-code    = sonnet  (心法 always-on)
//   03-test    = sonnet  (conditional TDD)
//   04-deliver = haiku   (迭代验收循环省 token — 关键点)
//
// `--model-tier inherit` CLI flag override 逃生口 (B-10 — 用户场景多样)。
// 与 GSD `/gsd-set-profile` 独立 namespace (GSD profile 管 GSD agent,
// harnessed 管 spawn 的 subagent — intel CD-2 § 实施约束)。
//
// IMPL NOTE: TypeBox (`@sinclair/typebox`) per repo convention — NOT zod.

import { type Static, Type } from '@sinclair/typebox'

export const ModelTier = Type.Union([
  Type.Literal('haiku'),
  Type.Literal('sonnet'),
  Type.Literal('opus'),
  Type.Literal('inherit'), // B-10 override 逃生口
])

export const PhaseEntry = Type.Object(
  {
    id: Type.String({ minLength: 1 }), // e.g. '01-clarify'
    name: Type.String({ minLength: 1 }),
    upstream: Type.String({ minLength: 1 }), // e.g. 'superpowers brainstorming'
    model: ModelTier, // 必填 (B-08)
    skills: Type.Optional(Type.Array(Type.String())),
    max_iterations: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
    // Phase 3.2 W1 T1.7 — JINJA-templated invokes string (D-02, W-02 orchestrator fix unconditional extend).
    invokes: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
)

export const PhasesSchema = Type.Object(
  {
    workflow: Type.String({ minLength: 1 }), // e.g. 'execute-task'
    phases: Type.Array(PhaseEntry, { minItems: 1 }),
    // Phase 3.2 W1 T1.7 — CEO veto halt directive (D-04 PUSH, W-02 orchestrator fix unconditional extend).
    on_veto: Type.Optional(Type.String({ pattern: '^halt_workflow$' })),
  },
  { additionalProperties: false },
)

export type ModelTierType = Static<typeof ModelTier>
export type PhaseEntryType = Static<typeof PhaseEntry>
export type PhasesSchemaType = Static<typeof PhasesSchema>
