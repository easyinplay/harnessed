// loadPhases — parse + validate `phases.yaml` against PhasesSchema (T3.1).
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

import { readFileSync } from 'node:fs'
import { Value, type ValueError } from '@sinclair/typebox/value'
import { parse as parseYaml } from 'yaml'
import { interpolate } from './interpolate.js'
import { PhasesSchema, type PhasesSchemaType } from './schema/phases.js'

export class PhasesValidationError extends Error {
  constructor(public errors: ValueError[]) {
    super(`phases.yaml validation failed (${errors.length} error${errors.length === 1 ? '' : 's'})`)
    this.name = 'PhasesValidationError'
  }
}

/** Load + validate a phases.yaml file. Throws `PhasesValidationError` on schema
 *  violation. If `vars` provided, interpolates {{ var }} in each phase's
 *  `invokes` field (Phase 3.2 W2 T2.1 D-02 JINJA). */
export function loadPhases(yamlPath: string, vars?: Record<string, string>): PhasesSchemaType {
  const raw = readFileSync(yamlPath, 'utf8')
  const parsed = parseYaml(raw)
  if (!Value.Check(PhasesSchema, parsed)) {
    throw new PhasesValidationError([...Value.Errors(PhasesSchema, parsed)])
  }
  // Phase 3.2 W2 T2.1 — JINJA interpolate invokes field (D-02 LOCKED).
  // Backward-compat: vars omitted → no interpolate (existing callers unchanged).
  if (vars) {
    for (const ph of parsed.phases) {
      if (ph.invokes) ph.invokes = interpolate(ph.invokes, vars)
    }
  }
  return parsed
}
