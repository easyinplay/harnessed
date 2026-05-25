// src/workflow/schema/judgment.ts — Phase v2.0-2.3 W0 T2.3.W0.6 (R20.4).
// TypeBox schema for workflows/judgments/*.yaml (W0.2 shipped 6 file, 158L).
// Sister W0.2 5 file root key `triggers` + 1 fallback file root key `rules`.
//
// 6 file 覆盖 (per D-16 multi-file 分类):
//   triggers root key (5 file):
//     - strategic-gate.yaml   (office-hours / plan-ceo-review)
//     - phase-gate.yaml       (gsd-discuss-phase)
//     - subtask-gate.yaml     (brainstorming)
//     - parallelism-gate.yaml (subagent-default / agent-teams-upgrade / main-session-fallback / ralph-loop-wrapper)
//     - tdd-gate.yaml         (tdd-strongly-suggested)
//   rules root key (1 file):
//     - fallback.yaml         (uncertain-skip-transparently / user-explicit-override / chain-isolation)
//
// 14th surface schema_version: harnessed.judgment.v1 (sister schemaVersion.ts).

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

const TriggerInvocation = Type.Object(
  {
    capability: Type.String(),
  },
  { additionalProperties: false },
)

const RequiresCapabilities = Type.Object(
  {
    capabilities: Type.Array(Type.String()),
  },
  { additionalProperties: false },
)

// Triggers-style entry — 5 file 通用 shape.
// `wraps` 仅 parallelism-gate.yaml ralph-loop-wrapper 用 (orthogonal wrapper per R20.10).
export const JudgmentTrigger = Type.Object(
  {
    description: Type.Optional(Type.String()),
    fires_when: Type.Optional(Type.String()),
    skips_when: Type.Optional(Type.String()),
    invokes: Type.Optional(Type.Array(TriggerInvocation)),
    requires: Type.Optional(RequiresCapabilities),
    wraps: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: false },
)

// Fallback rule entry — 仅 fallback.yaml 用 (3 rule per CLAUDE.md "Fallback 三条铁律").
export const FallbackRule = Type.Object(
  {
    description: Type.Optional(Type.String()),
    fallback_action: Type.Optional(Type.String()),
    message_template: Type.Optional(Type.String()),
    override_signal: Type.Optional(Type.Array(Type.String())),
    chain_isolation: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
)

// Triggers-style file (strategic / phase / subtask / parallelism / tdd).
export const JudgmentTriggersFile = Type.Object(
  {
    schema_version: Type.Literal(SCHEMA_VERSIONS.judgment),
    triggers: Type.Record(Type.String(), JudgmentTrigger),
  },
  { additionalProperties: false },
)

// Rules-style file (fallback only).
export const JudgmentRulesFile = Type.Object(
  {
    schema_version: Type.Literal(SCHEMA_VERSIONS.judgment),
    rules: Type.Record(Type.String(), FallbackRule),
  },
  { additionalProperties: false },
)

// Discriminated union — resolver consumes either shape.
export const JudgmentFile = Type.Union([JudgmentTriggersFile, JudgmentRulesFile])

// v3.6.0 Phase 3 — user-overrides.yaml schema (P0b 上半, R20.4 sister extension).
// Separate top-level shape (NOT in JudgmentFile union — additive only per Phase 3
// 灰区 #1-3 protocol + Risk 3 mitigation). Consumed by
// src/cli/lib/extract-user-overrides.ts (Wave 2). schema_version literal
// `harnessed.user-overrides.v1` (15th surface; NOT yet wired into
// types/schemaVersion.ts SCHEMA_VERSIONS — single-file consumer per Phase 3).
const UserOverrideEntry = Type.Object(
  {
    id: Type.String({ minLength: 1 }), // kebab-case (e.g. 'brainstorm', 'arch-review')
    keywords: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
    triggers: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
  },
  { additionalProperties: false },
)

export const UserOverridesFile = Type.Object(
  {
    schema_version: Type.Literal('harnessed.user-overrides.v1'),
    overrides: Type.Array(UserOverrideEntry, { minItems: 1 }),
  },
  { additionalProperties: false },
)

export type JudgmentTriggerT = Static<typeof JudgmentTrigger>
export type FallbackRuleT = Static<typeof FallbackRule>
export type JudgmentTriggersFileT = Static<typeof JudgmentTriggersFile>
export type JudgmentRulesFileT = Static<typeof JudgmentRulesFile>
export type JudgmentFileT = Static<typeof JudgmentFile>
export type UserOverrideEntryT = Static<typeof UserOverrideEntry>
export type UserOverridesFileT = Static<typeof UserOverridesFile>
