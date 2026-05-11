// spec sub-schema per ADR 0001 § Top-level structure.
// Fields: type, component_type, install (discriminated union), verify, uninstall,
//         upstream_health, signed_by, signature?, platforms,
//         tested_with_versions?, mutually_exclusive_with?.

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
  },
  { additionalProperties: false },
)
