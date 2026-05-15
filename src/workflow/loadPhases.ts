// loadPhases — parse + validate `phases.yaml` against PhasesSchema (T3.1).
//
// ADR 0011 errata — per-phase model tier (phase 2.2 W3 — T3.2).
// Sister to `src/manifest/validate.ts`(Ajv) — here we use TypeBox `Value.Check` +
// `Value.Errors` directly (simpler than Ajv compile path; phases.yaml schema is
// tiny ~50L and not on hot path — no perf gate needed).
//
// Pattern lifted from PATTERNS § 5 D-WP-1 "Truly NEW patterns" row.

import { readFileSync } from 'node:fs'
import { Value, type ValueError } from '@sinclair/typebox/value'
import { parse as parseYaml } from 'yaml'
import { PhasesSchema, type PhasesSchemaType } from './schema/phases.js'

export class PhasesValidationError extends Error {
  constructor(public errors: ValueError[]) {
    super(`phases.yaml validation failed (${errors.length} error${errors.length === 1 ? '' : 's'})`)
    this.name = 'PhasesValidationError'
  }
}

/** Load + validate a phases.yaml file. Throws `PhasesValidationError` on schema violation. */
export function loadPhases(yamlPath: string): PhasesSchemaType {
  const raw = readFileSync(yamlPath, 'utf8')
  const parsed = parseYaml(raw)
  if (!Value.Check(PhasesSchema, parsed)) {
    throw new PhasesValidationError([...Value.Errors(PhasesSchema, parsed)])
  }
  return parsed
}
