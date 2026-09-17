// src/workflow/schema/discipline.ts — Phase v3.0-3.3 W0 T3.3.W0.6 (R30.9 + D-09).
// TypeBox schema for workflows/disciplines/*.yaml (6 file ship v3.0 per D-09 L0 Discipline Substrate).
// Sister: src/workflow/schema/judgment.ts dual-shape (triggers vs rules) pattern.
//
// 6 file covered (per D-09):
//   base shape (4 file)         karpathy / output-style / language / operational
//   priority_hierarchy shape    priority.yaml (ordered array of capability tier name)
//   protocols shape             protocols.yaml (Record<string, ProtocolShape>)
//
// 18th surface schema_version: harnessed.discipline.v1 (per T3.3.W0.11 ADD).
// additionalProperties:false strict per Phase 2.2 STRIDE T-2.2-02 + RESEARCH-disciplines § 1 verbatim.

import { type Static, Type } from '@sinclair/typebox'
import { SCHEMA_VERSIONS } from '../../types/schemaVersion.js'

const EnforcementLayer = Type.Union([
  Type.Literal('code-writing'), // karpathy 心法 — write code phase
  Type.Literal('output'), // BLUF / language / no-emoji — emit response phase
  Type.Literal('commit'), // biome / A7 / commit safety — pre-commit phase
  Type.Literal('workflow'), // priority hierarchy / protocols — workflow-level arbitration
  Type.Literal('tool'), // tool invoke discipline (reserved for v3.x extension)
])

const Enforcement = Type.Union([
  Type.Literal('halt'), // process.exit non-zero, sister fallbackHandlers
  Type.Literal('warn'), // console.warn emit, continue
  Type.Literal('info'), // log only, no action
])

export const DisciplineRule = Type.Object(
  {
    id: Type.String({ minLength: 1 }), // kebab-case
    description: Type.String(), // human-readable
    enforcement: Enforcement,
    trigger: Type.Union([Type.String(), Type.Array(Type.String())]), // expr OR always-on list
    // 4.43.0 — `check_method` / `auto_fix_cmd` and the `auto-fix` enforcement value
    // removed: nothing ever evaluated them (the only runner, the before-commit hook,
    // was unreachable and deleted in 4.42.0). A rule's description reaches the model
    // via `harnessed prompt`; mechanical checks live in `harnessed check-docs`.
  },
  { additionalProperties: false },
)

// priority.yaml 专字段 — 7-tier capability hierarchy
const PriorityHierarchy = Type.Array(Type.String(), { minItems: 1 })

// protocols.yaml 专字段 — Ideation→Onboarding + Plan→Execute + file-ownership-strict
const ProtocolShape = Type.Object(
  {
    // required_fields / forbidden_phrases / file_ownership removed 4.43.0 (never
    // checked); their content now lives in the protocol's description text.
    description: Type.String(),
    rules: Type.Optional(Type.Array(DisciplineRule)),
  },
  { additionalProperties: false },
)

export const Discipline = Type.Object(
  {
    schema_version: Type.Literal(SCHEMA_VERSIONS.discipline),
    discipline: Type.String({ minLength: 1 }), // basename (karpathy / output-style / ...)
    enforcement_layer: EnforcementLayer,
    rules: Type.Array(DisciplineRule),
    priority_hierarchy: Type.Optional(PriorityHierarchy), // priority.yaml only
    protocols: Type.Optional(Type.Record(Type.String(), ProtocolShape)), // protocols.yaml only
  },
  { additionalProperties: false },
)

export type DisciplineT = Static<typeof Discipline>
export type DisciplineRuleT = Static<typeof DisciplineRule>
export type ProtocolShapeT = Static<typeof ProtocolShape>
