// src/workflow/schema/capabilities.ts — Phase v3.0-3.3 W0 T3.3.W0.7 (D-08 + Pattern A B.3 LOCK).
// TypeBox schema for workflows/capabilities.yaml — capabilities.v1 in-place extend
// (NOT bump per Pattern A B.1 — `category` field is Optional additive per D-16 rule c).
//
// v2 → v3 字段 delta (sister Phase v2.0-2.3 W0 T2.3.W0.6 SHIPPED v2 67L):
//   ADD `category` 7-enum CategoryEnum (D-08 — discriminator)
//   ADD `discipline_ref` String pattern (behavioral category only, D-09 cross-link)
//   Sister judgment.ts JudgmentTriggersFile vs JudgmentRulesFile discriminated union pattern verbatim
//
// Schema discriminated union (Pattern A B.3):
//   DisciplineCapabilityEntry — `category: 'behavioral'` + `discipline_ref: workflows/disciplines/<basename>.yaml`
//   ToolCapabilityEntry       — `category` ∈ 6 non-behavioral literal + NO discipline_ref (additionalProperties:false guards)
//
// IMPL NOTE: schema_version 字面值未变 (`harnessed.capabilities.v1`); category 是 Optional 字段
// 以保持 v2 backward-compat 期间 v2.x 35 entry 无需立刻 backfill (T3.3.W0.1 backfill 39 entry +
// T3.3.W0.2 NEW 36 entry 已 ship — 全 v3 entry 必带 category, v2 SHIPPED entry 已 backfill 全部)。

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

const RequiresShape = Type.Object(
  {
    plugin: Type.Optional(Type.String()),
    settings_env_var: Type.Optional(Type.String()),
    cc_version: Type.Optional(Type.String()),
    capabilities: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: false },
)

const AliasShape = Type.Object(
  {
    impl: Type.String(),
    cmd: Type.String(),
  },
  { additionalProperties: false },
)

// D-08 7-enum 之 6 non-behavioral tool category (Pattern A B.3 — discriminated union variant 2).
// DisciplineCapabilityEntry 直接 hardcode 'behavioral' literal,sister judgment.ts dual-shape。
const ToolCategoryEnum = Type.Union([
  Type.Literal('tool-slash-cmd'),
  Type.Literal('tool-mcp'),
  Type.Literal('tool-cli'),
  Type.Literal('tool-plugin'),
  Type.Literal('tool-bundled-skill'),
  Type.Literal('agent-platform'),
])

// Shared base — 全 v2 SHIPPED 8 字段 + Optional `category` (Pattern A B.1 LOCK) +
// v3.4.2 Optional `install_type` / `plugin_id` / `skill_dir` (presence-check fields
// for setup-time SKILL.md template render). v3.4.1 `plugin_namespace` is kept as a
// dead Optional to preserve backward-compat for any third-party consumer parsing
// older capabilities.yaml shapes; the resolver no longer reads it.
//
// Presence-check semantics (src/cli/lib/capabilityResolver.ts):
//   install_type=plugin    + plugin_id  → match left of `@` in installed_plugins.json
//   install_type=user-skill + skill_dir → match dir name under ~/.claude/skills/
//   install_type omitted              → no check (built-in / cli / mcp / sentinel)
//
// The resolver NEVER mutates `cmd` — capabilities.yaml `cmd` field is the verbatim
// invocable slash command (e.g. `/review` for gstack, `/code-review` for the
// code-review plugin; bare, no `<namespace>:` prefix).
const CapabilityEntryBase = Type.Object(
  {
    impl: Type.String(),
    cmd: Type.String(),
    since: Type.String(),
    description: Type.Optional(Type.String()),
    fires_when: Type.Optional(Type.Array(Type.String())),
    requires: Type.Optional(RequiresShape),
    plugin_path: Type.Optional(Type.String()),
    plugin_namespace: Type.Optional(Type.String()), // v3.4.1 legacy — unused by resolver
    install_type: Type.Optional(
      Type.Union([
        Type.Literal('plugin'),
        Type.Literal('user-skill'),
        Type.Array(Type.Union([Type.Literal('plugin'), Type.Literal('user-skill')]), {
          minItems: 1,
        }),
      ]),
    ),
    plugin_id: Type.Optional(Type.String()),
    skill_dir: Type.Optional(Type.String()),
    outputs: Type.Optional(Type.Array(Type.String())),
    aliases: Type.Optional(Type.Array(AliasShape)),
    sdk_ref: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
)

// Discriminated union variant 1 — behavioral category MUST have discipline_ref.
const DisciplineCapabilityEntry = Type.Composite(
  [
    CapabilityEntryBase,
    Type.Object({
      category: Type.Literal('behavioral'),
      discipline_ref: Type.String({
        pattern: '^workflows/disciplines/[a-z-]+\\.yaml$',
      }),
    }),
  ],
  { additionalProperties: false },
)

// Discriminated union variant 2 — 6 non-behavioral category MUST NOT have discipline_ref
// (enforced by additionalProperties:false on Composite — `discipline_ref` not declared,
// schema check 拒绝任何含 `discipline_ref` 的 tool entry)。
const ToolCapabilityEntry = Type.Composite(
  [
    CapabilityEntryBase,
    Type.Object({
      category: ToolCategoryEnum,
    }),
  ],
  { additionalProperties: false },
)

// Legacy variant — v2 SHIPPED entry without `category` field (backward-compat during
// Phase 3.3 W0.1 backfill rollout; harnessed v3.0 GA 后 strict require category 可能)。
const LegacyCapabilityEntry = Type.Composite([CapabilityEntryBase], {
  additionalProperties: false,
})

export const CapabilityEntry = Type.Union([
  DisciplineCapabilityEntry,
  ToolCapabilityEntry,
  LegacyCapabilityEntry,
])

export const Capabilities = Type.Object(
  {
    schema_version: Type.Literal(SCHEMA_VERSIONS.capabilities),
    capabilities: Type.Record(Type.String(), CapabilityEntry),
  },
  { additionalProperties: false },
)

export type CapabilitiesT = Static<typeof Capabilities>
export type CapabilityEntryT = Static<typeof CapabilityEntry>
export type DisciplineCapabilityEntryT = Static<typeof DisciplineCapabilityEntry>
export type ToolCapabilityEntryT = Static<typeof ToolCapabilityEntry>
