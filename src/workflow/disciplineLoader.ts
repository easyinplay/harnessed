// src/workflow/disciplineLoader.ts — Phase v3.0-3.3 W0 T3.3.W0.9 (R30.9 D-09).
// Sister judgmentResolver.ts pattern: module-level Map<basename, DisciplineT> cache,
// load + TypeBox validate on first access, subsequent cache hit.
//
// Public API:
//   loadDiscipline(basename, packageRoot): Promise<DisciplineT>
//   loadAllApplied(disciplines_applied[] | undefined, packageRoot):
//     Promise<Map<basename, DisciplineT>>  — undefined defaults to all 6
//   getRule(basename, rule_id): DisciplineRuleT | undefined  (sync, requires prior load)
//   _clearDisciplineCache(): void (test-only)
//
// Hot path: master orchestrator workflow load + 4 hook query path.

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { parse as parseYaml } from 'yaml'
import { Discipline, type DisciplineRuleT, type DisciplineT } from './schema/discipline.js'

/** All 6 LOCKED basenames per D-09 — sister DisciplineName Literal Union. */
export const DEFAULT_APPLIED: readonly string[] = [
  'karpathy',
  'output-style',
  'language',
  'operational',
  'priority',
  'protocols',
]

const _cache = new Map<string, DisciplineT>()

export async function loadDiscipline(basename: string, packageRoot: string): Promise<DisciplineT> {
  const cached = _cache.get(basename)
  if (cached) return cached
  const yamlPath = resolve(packageRoot, 'workflows', 'disciplines', `${basename}.yaml`)
  const raw = await readFile(yamlPath, 'utf8')
  const parsedRaw = parseYaml(raw) as unknown
  if (!Value.Check(Discipline, parsedRaw)) {
    const errors = [...Value.Errors(Discipline, parsedRaw)]
      .slice(0, 3)
      .map((e) => `${e.path} ${e.message}`)
      .join('; ')
    throw new Error(`Invalid discipline file ${basename}.yaml: ${errors}`)
  }
  const parsed = parsedRaw as DisciplineT
  _cache.set(basename, parsed)
  return parsed
}

export async function loadAllApplied(
  disciplines_applied: readonly string[] | undefined,
  packageRoot: string,
): Promise<Map<string, DisciplineT>> {
  const applied =
    disciplines_applied && disciplines_applied.length > 0 ? disciplines_applied : DEFAULT_APPLIED
  const out = new Map<string, DisciplineT>()
  for (const basename of applied) {
    out.set(basename, await loadDiscipline(basename, packageRoot))
  }
  return out
}

export function getRule(basename: string, ruleId: string): DisciplineRuleT | undefined {
  const d = _cache.get(basename)
  if (!d) return undefined
  return d.rules.find((r) => r.id === ruleId)
}

/** Test-only — clears the parsed-yaml cache so cache-hit / cache-miss fixtures
 *  stay independent. Production callers should never touch this. */
export function _clearDisciplineCache(): void {
  _cache.clear()
}
