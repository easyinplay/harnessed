// spec sub-schema per ADR 0001 § Top-level structure.
// Fields: type, component_type, install (discriminated union), verify, uninstall,
//         upstream_health, signed_by, signature?, platforms,
//         tested_with_versions?, mutually_exclusive_with?,
//         category, install_type, decision_rules? (ADR 0007 errata — phase 1.3 加),
//         phase?, triggers? (ADR 0009 errata — phase 1.5 T5.5 加).
//
// IMPL NOTE — phase 1.5 T5.5 (ADR 0009 § Decision / D1.5-6 / D1.5-7 / Pattern L
// spec-level metadata 加法 + Pattern T): adds 2 optional spec-level fields for
// the mattpocock 23 招式 phase routing schema. `phase` is a 4-value enum
// (discuss / plan / execute / verify) mirroring `decision_rules.yaml` v2
// `mattpocock_phases` keys; `triggers` is an optional object carrying routing
// hints (complexity_threshold / tdd_required / brainstorming_required). Both
// optional — additive only, A7' 8-pillar enforcement (no existing manifest
// broken). NOTE: this schema uses TypeBox (`@sinclair/typebox`), the project's
// established schema lib — NOT zod; the task_plan `z.enum` / `z.object` outline
// is a planning-doc shorthand, implemented here as `Type.Union` / `Type.Object`
// per ADR 0001 + the no-new-deps constraint.

import { Type } from '@sinclair/typebox'
import { type Install, InstallSchema } from './installMethods/index.js'

const TypeEnum = Type.Union([
  Type.Literal('cc-plugin'),
  Type.Literal('cc-skill-pack'),
  Type.Literal('mcp-npm'),
  Type.Literal('cli-npm'),
])

const ComponentType = Type.Union([
  Type.Literal('command'),
  Type.Literal('behavior-rule'),
  Type.Literal('mcp-tool'),
  Type.Literal('cli-binary'),
])

const Verify = Type.Object(
  {
    cmd: Type.String({ minLength: 1 }),
    timeout_ms: Type.Optional(Type.Integer({ minimum: 100, maximum: 60_000 })),
    expected_exit_code: Type.Optional(Type.Integer()),
  },
  { additionalProperties: false },
)

const Uninstall = Type.Object(
  {
    cmd: Type.String({ minLength: 1 }),
    cleanup_paths: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: false },
)

const Stability = Type.Union([
  Type.Literal('stable'),
  Type.Literal('beta'),
  Type.Literal('unstable'),
  Type.Literal('archived'),
])

const FallbackAction = Type.Union([
  Type.Literal('warn'),
  Type.Literal('block'),
  Type.Literal('use_alternative'),
])

const UpstreamHealth = Type.Object(
  {
    stability: Stability,
    last_check: Type.String({ format: 'date' }),
    last_known_good_version: Type.String({ minLength: 1 }),
    fallback_action: FallbackAction,
    alternative: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
)

const Platform = Type.Union([Type.Literal('linux'), Type.Literal('darwin'), Type.Literal('win32')])

const Signature = Type.Object(
  { sigstore_bundle: Type.String({ format: 'uri' }) },
  { additionalProperties: false },
)

const TestedWithVersions = Type.Object(
  {
    cc_versions: Type.Optional(Type.Array(Type.String())),
    node_versions: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: false },
)

// ADR 0007 errata — categorization schema (phase 1.3 T2.1 加 3 字段).
// `category` (必填, 6 enum) + `install_type` (必填, 4 enum, 与 install.method 1:N 闭合) +
// `decision_rules` (optional, per-manifest decision hint — 全局 rule-set 在
// routing/decision_rules.yaml T3.1, schema 完全独立).
const Category = Type.Union([
  Type.Literal('meta'),
  Type.Literal('engineering'),
  Type.Literal('design'),
  Type.Literal('content'),
  Type.Literal('testing'),
  Type.Literal('search'),
])

const InstallType = Type.Union([
  Type.Literal('skill'),
  Type.Literal('mcp'),
  Type.Literal('npm'),
  Type.Literal('git'),
])

const DecisionRules = Type.Object(
  {
    trigger: Type.Optional(Type.String({ minLength: 1 })),
    default_expert: Type.Optional(Type.String({ minLength: 1 })),
    arbitration_rule: Type.Optional(Type.String({ minLength: 1 })),
    override_signals: Type.Optional(
      Type.Array(
        Type.Object(
          {
            phrase: Type.String({ minLength: 1 }),
            use: Type.String({ minLength: 1 }),
          },
          { additionalProperties: false },
        ),
      ),
    ),
    // Phase 2.3 W2 T2.5 — CD-3 negative-space hint mirror (B-17 per-manifest hint
    // redundant guard layer; SSOT remains routing/decision_rules.yaml — D-04 lead).
    // Additive optional; existing manifests unchanged (A7 守恒).
    do_not_use_when: Type.Optional(Type.Array(Type.String({ minLength: 1 }), { minItems: 1 })),
    if_rejected_use: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
)

// ADR 0009 errata — mattpocock 23 招式 phase routing schema (phase 1.5 T5.5).
// `Phase` (optional, 4 enum — 1:1 with decision_rules.yaml v2 mattpocock_phases
// keys) + `Triggers` (optional, routing hints per D1.5-7). Both additive.
const Phase = Type.Union([
  Type.Literal('discuss'),
  Type.Literal('plan'),
  Type.Literal('execute'),
  Type.Literal('verify'),
])

const Triggers = Type.Object(
  {
    complexity_threshold: Type.Optional(Type.Integer({ minimum: 1 })),
    tdd_required: Type.Optional(Type.Boolean()),
    brainstorming_required: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
)

// ADR 0010 errata — bundle-install modeling (#10, D2.1-1). One install action
// may surface multiple named units (e.g. document-skills → pptx/docx/xlsx/pdf).
// `provides` absent ⇒ atomic manifest (unchanged behavior). Present ⇒ one
// install exposes N named units. `install`/`verify`/`uninstall` stay singular —
// the bundle is installed by ONE action. Bundle manifests use the existing
// `type: 'cc-skill-pack'` (D2.1-2 — no new TypeEnum/ComponentType value).
const ProvidedUnit = Type.Object(
  {
    id: Type.String({ minLength: 1 }), // routing-addressable, <org>-<repo>-<unit>
    component_type: ComponentType, // reuse existing union
  },
  { additionalProperties: false },
)

export const SpecSchema = Type.Object(
  {
    type: TypeEnum,
    component_type: ComponentType,
    install: Type.Unsafe<Install>(InstallSchema),
    verify: Verify,
    uninstall: Uninstall,
    upstream_health: UpstreamHealth,
    signed_by: Type.String({ pattern: '^[a-zA-Z0-9-]+$', minLength: 1 }),
    signature: Type.Optional(Signature),
    platforms: Type.Array(Platform, { minItems: 1, uniqueItems: true }),
    tested_with_versions: Type.Optional(TestedWithVersions),
    mutually_exclusive_with: Type.Optional(Type.Array(Type.String())),
    category: Category,
    install_type: InstallType,
    decision_rules: Type.Optional(DecisionRules),
    // ADR 0009 errata (phase 1.5 T5.5) — mattpocock phase routing schema.
    phase: Type.Optional(Phase),
    triggers: Type.Optional(Triggers),
    // ADR 0010 errata (phase 2.1 T1.3) — bundle-install `provides` field.
    provides: Type.Optional(Type.Array(ProvidedUnit, { minItems: 2, uniqueItems: true })),
  },
  { additionalProperties: false },
)
