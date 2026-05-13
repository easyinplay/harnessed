// spec sub-schema per ADR 0001 § Top-level structure.
// Fields: type, component_type, install (discriminated union), verify, uninstall,
//         upstream_health, signed_by, signature?, platforms,
//         tested_with_versions?, mutually_exclusive_with?,
//         category, install_type, decision_rules? (ADR 0007 errata — phase 1.3 加).

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
  },
  { additionalProperties: false },
)
