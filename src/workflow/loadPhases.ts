// loadPhases — parse + validate `phases.yaml` against PhasesSchema (T3.1) OR
// WorkflowSchemaV2 (T2.4.W1.1 Option A++ dispatch by `schema_version`).
//
// ADR 0011 errata — per-phase model tier (phase 2.2 W3 — T3.2).
// Sister to `src/manifest/validate.ts`(Ajv) — here we use TypeBox `Value.Check` +
// `Value.Errors` directly (simpler than Ajv compile path; phases.yaml schema is
// tiny ~50L and not on hot path — no perf gate needed).
//
// Pattern lifted from PATTERNS § 5 D-WP-1 "Truly NEW patterns" row.
//
// Phase 3.2 W2 T2.1 — sig extend `vars?: Record<string, string>`; if provided,
// interpolate {{ var }} placeholders in `invokes` field per phase (D-02 JINJA
// LOCKED). Backward-compat: vars omitted → no interpolate (existing callers
// unchanged; sister `workflows/execute-task/phases.yaml` has no invokes).
//
// Phase v2.0-2.4 W1.1 T2.4.W1.1 (Option A++ team-lead arbitration) — schema
// dispatch on root `schema_version` field. v2 yaml validates against
// WorkflowSchemaV2 and the v2 shape is returned unchanged (structural superset
// of v1 — legacy v1 readers safely access the v1 subset; engine catch handler
// reads `phase.fallback.max_iterations_exceeded.*` for R20.10 explicit halt).
// Legacy yaml without `schema_version` falls back to PhasesSchema v1 path.

import { readFileSync } from 'node:fs'
import { Value, type ValueError } from '@sinclair/typebox/value'
import { parse as parseYaml } from 'yaml'
import { interpolate } from './interpolate.js'
import { PhasesSchema, type PhasesSchemaType } from './schema/phases.js'
import { WorkflowSchemaV2, type WorkflowSchemaV2T } from './schema/workflow.js'

export class PhasesValidationError extends Error {
  constructor(public errors: ValueError[]) {
    super(`phases.yaml validation failed (${errors.length} error${errors.length === 1 ? '' : 's'})`)
    this.name = 'PhasesValidationError'
  }
}

export type LoadedPhases = PhasesSchemaType | WorkflowSchemaV2T

/** Load + validate a phases.yaml file. Throws `PhasesValidationError` on schema
 *  violation. If `vars` provided, interpolates {{ var }} in each phase's
 *  `invokes` field (Phase 3.2 W2 T2.1 D-02 JINJA).
 *
 *  T2.4.W1.1 v2 dispatch (Option A++): yaml with `schema_version:
 *  harnessed.workflow.v2` validates against `WorkflowSchemaV2` and is returned
 *  unchanged. Legacy v1 consumers read the v1 subset (workflow + phases[id,
 *  name, upstream, model, max_iterations, invokes]) which the v2 shape
 *  structurally contains; engine catch handler reads `phase.fallback`. */
export function loadPhases(yamlPath: string, vars?: Record<string, string>): LoadedPhases {
  const raw = readFileSync(yamlPath, 'utf8')
  const parsed = parseYaml(raw) as { schema_version?: string } | null

  const isV2 = parsed?.schema_version === 'harnessed.workflow.v2'
  if (isV2) {
    if (!Value.Check(WorkflowSchemaV2, parsed)) {
      throw new PhasesValidationError([...Value.Errors(WorkflowSchemaV2, parsed)])
    }
  } else {
    if (!Value.Check(PhasesSchema, parsed)) {
      throw new PhasesValidationError([...Value.Errors(PhasesSchema, parsed)])
    }
  }
  const validated = parsed as LoadedPhases

  // Phase 3.2 W2 T2.1 — JINJA interpolate invokes field (D-02 LOCKED).
  // Backward-compat: vars omitted → no interpolate (existing callers unchanged).
  if (vars) {
    for (const ph of validated.phases) {
      if (ph.invokes) ph.invokes = interpolate(ph.invokes, vars)
    }
  }
  return validated
}
