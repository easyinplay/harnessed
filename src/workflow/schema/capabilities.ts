// src/workflow/schema/capabilities.ts — Phase v2.0-2.3 W0 T2.3.W0.6 (R20.2).
// TypeBox schema for workflows/capabilities.yaml (W0.1 shipped 360L, 37 entry).
// Sister W0.1 capabilities.yaml schema_version: harnessed.capabilities.v1 (14th
// surface in src/types/schemaVersion.ts SCHEMA_VERSIONS const).
//
// Buckets covered (per W0.1 shipped):
//   1. mattpocock 12 高频招式  (D-09)
//   2. special-purpose 13 tool (D-14)
//   3. gstack 治理关卡 6       (D-12)
//   4. 核心 capability 4       (D-10 / D-13 / D-15 / superpowers)
//   5. Agent Teams 3           (D-11 + Q-AUDIT-5b)
//
// `requires` 5 optional sub-field (matches W0.1 shipped):
//   - plugin / settings_env_var / cc_version : string predicates
//   - capabilities                            : string[] dep list (W0.2 cross-ref)
//
// IMPL NOTE: additionalProperties:false on every nested Object — schema drift
// (e.g. typo `requies` instead of `requires`) becomes a hard CI fail at the
// scripts/check-workflow-schema.mjs gate (per ADR pattern sister manifest/spec.ts).

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

export const CapabilityEntry = Type.Object(
  {
    impl: Type.String(),
    cmd: Type.String(),
    since: Type.String(),
    description: Type.Optional(Type.String()),
    fires_when: Type.Optional(Type.Array(Type.String())),
    requires: Type.Optional(RequiresShape),
    plugin_path: Type.Optional(Type.String()),
    outputs: Type.Optional(Type.Array(Type.String())),
    aliases: Type.Optional(Type.Array(AliasShape)),
    sdk_ref: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
)

export const Capabilities = Type.Object(
  {
    schema_version: Type.Literal(SCHEMA_VERSIONS.capabilities),
    capabilities: Type.Record(Type.String(), CapabilityEntry),
  },
  { additionalProperties: false },
)

export type CapabilitiesT = Static<typeof Capabilities>
export type CapabilityEntryT = Static<typeof CapabilityEntry>
