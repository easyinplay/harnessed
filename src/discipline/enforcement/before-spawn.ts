// src/discipline/enforcement/before-spawn.ts — Phase v3.0-3.3 W0 T3.3.W0.9 (R30.9 priority.yaml).
// Hook trigger: master orchestrator 收到 ≥2 capability fired 时 arbitrate.
//
// Sorts the fired capability list by `priority_hierarchy` rank loaded from
// disciplines/priority.yaml. Unknown tier names sort to the end (LOWEST priority,
// MAX_SAFE_INTEGER rank — conservative degrade per RESEARCH-disciplines § 3.2.3).

import { loadDiscipline } from '../../workflow/disciplineLoader.js'

export interface FiredCapability {
  name: string
  /** Tier identifier — one of priority.yaml priority_hierarchy entries
   *  (gstack / gsd / superpowers / planning-with-files / karpathy / mattpocock / parallel). */
  tier: string
}

export async function arbitrateBeforeSpawn(
  fired: FiredCapability[],
  packageRoot: string,
): Promise<FiredCapability[]> {
  if (fired.length <= 1) return fired
  const d = await loadDiscipline('priority', packageRoot)
  const hierarchy = d.priority_hierarchy ?? []
  const rank = (tier: string): number => {
    const i = hierarchy.indexOf(tier)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }
  return [...fired].sort((a, b) => rank(a.tier) - rank(b.tier))
}
