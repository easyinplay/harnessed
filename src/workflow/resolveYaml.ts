// src/workflow/resolveYaml.ts — workflow name → workflow.yaml path resolution.
//
// architecture review #7 (slice 2b) — extracted from cli/run.ts: the 3-tier
// workflows/ layout lookup is workflow-domain knowledge, consumed by
// checkpoint/evidence (evidence contract resolution) and six cli surfaces —
// a core module had to import UP into a cli command file to reach it.

import { existsSync } from 'node:fs'
import { join } from 'node:path'

/** 3-tier lookup matches workflows/ layout:
 *    1. workflows/<name>/workflow.yaml             (research, retro, auto top-level)
 *    2. workflows/<name>/auto/workflow.yaml        (4 stage-masters: discuss/plan/task/verify)
 *    3. workflows/<stage>/<sub>/workflow.yaml      (24 subs; <name> = '<stage>-<sub>' OR '<sub>')
 *
 * Sub names by convention flatten to `<stage>-<sub>` (e.g. 'verify-paranoid'
 * → workflows/verify/paranoid/workflow.yaml). Split on the FIRST dash to
 * derive (stage, sub). If `<name>` has no dash, only tiers 1 + 2 apply.
 */
export async function resolveWorkflowYaml(
  name: string,
  workflowsDir: string,
): Promise<string | null> {
  // Tier 1: top-level standalone
  const tier1 = join(workflowsDir, name, 'workflow.yaml')
  if (existsSync(tier1)) return tier1
  // Tier 2: stage-master auto
  const tier2 = join(workflowsDir, name, 'auto', 'workflow.yaml')
  if (existsSync(tier2)) return tier2
  // Tier 3: split on first dash
  const dashIdx = name.indexOf('-')
  if (dashIdx > 0) {
    const stage = name.slice(0, dashIdx)
    const sub = name.slice(dashIdx + 1)
    const tier3 = join(workflowsDir, stage, sub, 'workflow.yaml')
    if (existsSync(tier3)) return tier3
  }
  return null
}
