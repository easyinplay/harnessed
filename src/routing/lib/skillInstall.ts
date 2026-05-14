// Phase 1.5.1 sister review H2 — Anchor 3 (skill install) hard split out of
// lib/ralphLoop.ts. Anchor 3 (install missing + retry idempotent_check) and
// Anchor 4 (ralph-loop wedge wrap) are conceptually distinct anchors; keeping
// them in one file pushed ralphLoop.ts to 65L, contradicting the "≤50L strict"
// claim in ADR 0009 § Decision Errata 3. Splitting Anchor 3 here makes that
// claim true without an ADR errata — A7 conservation preserved (ADR 0009 main
// body untouched; the code is brought into compliance with the doc, not vice
// versa, per D-18 contract-drift prohibition).

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { RestartRequiredError } from '../agentDefinition.js'

export function isInstalled(skill: string, root: string): boolean {
  return existsSync(join(root, skill, 'SKILL.md'))
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Anchor 3 — install missing + sleep retry idempotent_check. RestartRequired
 *  is the extreme bail (settings.json hook needs main-session pickup). */
export async function ensureSkillsInstalled(required: string[], skillsRoot: string): Promise<void> {
  for (const name of required) {
    if (isInstalled(name, skillsRoot)) continue
    await sleep(500)
    let retries = 3
    while (retries-- > 0 && !isInstalled(name, skillsRoot)) await sleep(300)
    if (!isInstalled(name, skillsRoot)) {
      throw new RestartRequiredError(
        `Skill ${name} still missing after retry — please exit + restart Claude Code so the plugin takes effect.`,
      )
    }
  }
}
