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
// The 13 surfaces (B-32 + Phase 3.1 W1 T1.1 ADD `currentWorkflow` + Phase 3.2
// W1 T1.1 ADD `config` + `governance` + Phase 3.3 W0 T0.5 BACKFILL `planFeature`
// + Phase 3.3 W1 T1.1 ADD `aliases` + `knownGood`) are the schema-producing
// artifacts in Wave 2-4 + Phase 3.1 (workflow state machine) + Phase 3.2
// (plan-feature workflow infra) + Phase 3.3 (manifest-domain aliases.yaml +
// known-good version lock):
//   - routing-snapshot      : routing engine arbitrate output snapshot
//   - handoff-doc           : phase → phase handoff document
//   - phases-yaml           : workflows/execute-task/phases.yaml
//   - manifest-state        : .harnessed/state/manifest.json
//   - installer-state       : .harnessed/state/installer.json
//   - route-decision-log    : routing decision audit log
//   - checkpoint            : execute-task workflow checkpoint envelope
//   - current-workflow      : workflow state machine (active / paused / complete)  ← Phase 3.1 W1 T1.1 ADD (8th surface, D-02 KARPATHY 3-state lock)
//   - config                : .harnessed/config.json (gstack_prefix store)        ← Phase 3.2 W1 T1.1 ADD (9th surface, D-01 PROBE)
//   - governance            : .harnessed/governance.json (gstack veto status)     ← Phase 3.2 W1 T1.1 ADD (10th surface, D-04 PUSH)
//   - plan-feature          : src/workflow/schema/planFeature.ts (plan-feature workflow DSL)  ← Phase 3.3 W0 T0.5 BACKFILL (11th surface, sister Phase 3.2 W2 T2.2 b875e21 stale claim fix)
//   - aliases               : manifests/aliases.yaml (D-01 RICH upstream rename redirect + metadata)  ← Phase 3.3 W1 T1.1 ADD (12th surface, D-01 RICH)
//   - known-good            : versions/<harnessed-ver>-known-good.yaml (D-03 YAML per-ver version lock)  ← Phase 3.3 W1 T1.1 ADD (13th surface, D-03 YAML manifest)
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
  currentWorkflow: 'harnessed.current-workflow.v1', // ← Phase 3.1 W1 T1.1 ADD 8th surface (D-02 KARPATHY 3-state)
  config: 'harnessed.config.v1', // ← Phase 3.2 W1 T1.1 ADD 9th surface (D-01 PROBE gstack_prefix store)
  governance: 'harnessed.governance.v1', // ← Phase 3.2 W1 T1.1 ADD 10th surface (D-04 PUSH veto status)
  planFeature: 'harnessed.plan-feature.v1', // ← Phase 3.3 W0 T0.5 BACKFILL 11th surface (sister Phase 3.2 W2 T2.2 b875e21 commit msg claim "11th surface" was LATENT STALE — never registered; T0.5 surgical fix per sister Phase 3.2 W2 T2.6 latent W1 c37ee29 Rule 1 pattern)
  aliases: 'harnessed.aliases.v1', // ← Phase 3.3 W1 T1.1 ADD 12th surface (D-01 RICH manifests/aliases.yaml upstream rename redirect + metadata)
  knownGood: 'harnessed.known-good.v1', // ← Phase 3.3 W1 T1.1 ADD 13th surface (D-03 YAML versions/<harnessed-ver>-known-good.yaml per-version lock)
  capabilities: 'harnessed.capabilities.v1', // ← Phase v2.0-2.3 W0 T2.3.W0.6 ADD 14th surface (R20.2 flat yaml capabilities manifest validate)
  judgment: 'harnessed.judgment.v1', // ← Phase v2.0-2.3 W0 T2.3.W0.6 ADD 15th surface (R20.4 multi-file judgments triggers/rules validate)
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
  Type.Literal(SCHEMA_VERSIONS.currentWorkflow), // ← Phase 3.1 W1 T1.1 ADD 8th surface
  Type.Literal(SCHEMA_VERSIONS.config), // ← Phase 3.2 W1 T1.1 ADD 9th surface
  Type.Literal(SCHEMA_VERSIONS.governance), // ← Phase 3.2 W1 T1.1 ADD 10th surface
  Type.Literal(SCHEMA_VERSIONS.planFeature), // ← Phase 3.3 W0 T0.5 BACKFILL 11th surface
  Type.Literal(SCHEMA_VERSIONS.aliases), // ← Phase 3.3 W1 T1.1 ADD 12th surface
  Type.Literal(SCHEMA_VERSIONS.knownGood), // ← Phase 3.3 W1 T1.1 ADD 13th surface
  Type.Literal(SCHEMA_VERSIONS.capabilities), // ← Phase v2.0-2.3 W0 T2.3.W0.6 ADD 14th surface
  Type.Literal(SCHEMA_VERSIONS.judgment), // ← Phase v2.0-2.3 W0 T2.3.W0.6 ADD 15th surface
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
