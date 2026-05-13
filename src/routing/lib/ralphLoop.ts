// Phase 1.4 T3.1 spillover — engine.ts ≤200L hard limit (D-13 / D1.4-6).
//
// IMPL NOTE — Anchor 3 (D1.4-1 reload bypass) + Anchor 4 (D1.4-3 ralph-loop
// wedge ≤50L). Extracted from engine.ts to honor the line-count contract;
// no behavior change. SPIKE-REPORT.md § 3 + § 5 实测路径锚定.

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { RestartRequiredError } from '../agentDefinition.js'

export const COMPLETE_REGEX = /^COMPLETE$/m

export class MaxIterationsExceededError extends Error {
  constructor(public iterations: number) {
    super(`ralph-loop max-iterations exceeded after ${iterations} attempts`)
    this.name = 'MaxIterationsExceededError'
  }
}

export class VerbatimCompleteFailError extends Error {
  constructor(public lastMessage: string) {
    super('subagent final message did not contain verbatim ^COMPLETE$ (F33 P1 mitigation)')
    this.name = 'VerbatimCompleteFailError'
  }
}

export function isInstalled(skill: string, root: string): boolean {
  return existsSync(join(root, skill, 'SKILL.md'))
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Anchor 3 — install missing + sleep retry idempotent_check. RestartRequired
 *  is the extreme bail (settings.json hook needs main-session pickup). */
export async function ensureSkillsInstalled(required: string[], skillsRoot: string): Promise<void> {
  for (const name of required) {
    if (isInstalled(name, skillsRoot)) continue
    await sleep(500)
    let retries = 3
    while (retries-- > 0 && !isInstalled(name, skillsRoot)) {
      await sleep(300)
    }
    if (!isInstalled(name, skillsRoot)) {
      throw new RestartRequiredError(
        `Skill ${name} still missing after retry — please exit + restart Claude Code so the plugin takes effect.`,
      )
    }
  }
}

/** Anchor 4 — ralph-loop wedge ≤50L (D1.4-3 self-implemented). External
 *  max-iter (20) × internal maxTurns (50) = 1000 round-trip ceiling. */
export async function ralphLoopWrap(
  spawn: () => Promise<string>,
  maxIter: number,
): Promise<string> {
  let last = ''
  for (let i = 0; i < maxIter; i++) {
    last = await spawn()
    // Anchor 2 — verbatim ^COMPLETE$/m grep (SPIKE-REPORT § 3.1 PASS).
    if (COMPLETE_REGEX.test(last)) return last
  }
  throw new MaxIterationsExceededError(maxIter)
}
