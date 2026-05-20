// src/discipline/enforcement/before-phase-execute.ts — Phase v3.0-3.3 W0 T3.3.W0.9 (R30.9).
// Hook trigger: workflow engine pre-phase (sister run.ts L74 for-loop start).
//
// Wedge entry point — load disciplines_applied[] from workflow.yaml (default all 6)
// into a Map<basename, DisciplineT> for downstream phase context + hook queries.
// Per RESEARCH-disciplines § 3.2.4 verbatim (DEFAULT_APPLIED 全 6 basename).

import { loadAllApplied } from '../../workflow/disciplineLoader.js'
import type { DisciplineT } from '../../workflow/schema/discipline.js'

export async function loadDisciplinesForPhase(
  disciplines_applied: readonly string[] | undefined,
  packageRoot: string,
): Promise<Map<string, DisciplineT>> {
  return loadAllApplied(disciplines_applied, packageRoot)
}
