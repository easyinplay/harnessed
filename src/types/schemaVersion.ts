// Phase 2.2 Wave 2 T2.0 — schemaVersion 7-surface infrastructure (CD-5).
// ADR 0011 errata — schemaVersion convention (phase 2.2 W2 — F4 / D-16 / B-32).
//
// IMPL NOTE — implements `.planning/intel/omc-comparison.md` § CD-5 (single
// 兼容门 ⭐⭐⭐ ECC pattern, 纯学不 vendor). Naming convention
// `harnessed.<surface>.v1` covers 7 schema-producing surfaces. Three consumer
// rules (documented as JSDoc on each export below):
//   (a) consumers MUST branch on `schemaVersion` (use `branchOnSchemaVersion`)
//   (b) unknown `schemaVersion` values gracefully degrade (treated as `unknown`
//       bucket — adapter-specific strings are legal, never throw)
//   (c) new fields MUST be added nested (never top-level on existing surface)
//
// The 7 surfaces (B-32) are the schema-producing artifacts in Wave 2-4:
//   - routing-snapshot      : routing engine arbitrate output snapshot
//   - handoff-doc           : phase → phase handoff document
//   - phases-yaml           : workflows/execute-task/phases.yaml
//   - manifest-state        : .harnessed/state/manifest.json
//   - installer-state       : .harnessed/state/installer.json
//   - route-decision-log    : routing decision audit log
//   - checkpoint            : execute-task workflow checkpoint envelope
//
// TypeBox is the established schema lib (sister of `src/manifest/schema/spec.ts`).

import { type Static, Type } from '@sinclair/typebox'

/** SchemaVersion template literal — `harnessed.<surface>.v1`. Each producer
 *  declares its surface name once via `SCHEMA_VERSIONS` below and references it
 *  through this type, so a string literal drift is a compile error. */
export type SchemaVersion<S extends string> = `harnessed.${S}.v1`

/** Single source of truth for the 7 surface names (B-32 / D-16). Producers MUST
 *  import from this const — direct string literals fail the Wave 2 grep
 *  acceptance (≥ 7 `harnessed.\w+.v1` references in src/types/*.ts). */
export const SCHEMA_VERSIONS = {
  routingSnapshot: 'harnessed.routing-snapshot.v1',
  handoffDoc: 'harnessed.handoff-doc.v1',
  phasesYaml: 'harnessed.phases-yaml.v1',
  manifestState: 'harnessed.manifest-state.v1',
  installerState: 'harnessed.installer-state.v1',
  routeDecisionLog: 'harnessed.route-decision-log.v1',
  checkpoint: 'harnessed.checkpoint.v1',
} as const

/** TypeBox literal union — useful as a refinement on a `schemaVersion` field
 *  inside any surface schema (e.g. `schemaVersion: SchemaVersionLiteral`). */
export const SchemaVersionLiteral = Type.Union([
  Type.Literal(SCHEMA_VERSIONS.routingSnapshot),
  Type.Literal(SCHEMA_VERSIONS.handoffDoc),
  Type.Literal(SCHEMA_VERSIONS.phasesYaml),
  Type.Literal(SCHEMA_VERSIONS.manifestState),
  Type.Literal(SCHEMA_VERSIONS.installerState),
  Type.Literal(SCHEMA_VERSIONS.routeDecisionLog),
  Type.Literal(SCHEMA_VERSIONS.checkpoint),
])

export type SchemaVersionLiteralType = Static<typeof SchemaVersionLiteral>

/** Consumer branch helper — rule (a) consumer MUST branch on `schemaVersion`;
 *  rule (b) unknown values gracefully degrade to the `unknown` handler. The
 *  handler-shape encodes the contract so the type system enforces it. */
export function branchOnSchemaVersion<T>(
  v: string,
  handlers: { v1: () => T; unknown: () => T },
): T {
  // v1 = any string matching `harnessed.<surface>.v1` for a known surface.
  const isKnownV1 = (Object.values(SCHEMA_VERSIONS) as readonly string[]).includes(v)
  return isKnownV1 ? handlers.v1() : handlers.unknown()
}
