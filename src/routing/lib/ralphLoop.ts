// Phase 1.4 T3.1 spillover — engine.ts ≤200L hard limit (D-13 / D1.4-6).
// Phase 1.5 T5.2 — `<promise>COMPLETE</promise>` XML wrapper upgrade: the raw
// `^COMPLETE$/m` regex moved to the hard-split helper lib/promiseExtract.ts
// (ADR 0009 § Decision Errata 3 / D1.5-4 sub-item 3 / PLAN-CHECK W-2). Anchor 3
// (D1.4-1 reload bypass) + Anchor 4 (D1.4-3 ralph-loop wedge).

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { RestartRequiredError } from '../agentDefinition.js'
import { extractPromise } from './promiseExtract.js'

/** True when the agent output carries a verbatim `<promise>COMPLETE</promise>`. */
export function isComplete(output: string): boolean {
  return extractPromise(output) === 'COMPLETE'
}

export class MaxIterationsExceededError extends Error {
  constructor(public iterations: number) {
    super(`ralph-loop max-iterations exceeded after ${iterations} attempts`)
    this.name = 'MaxIterationsExceededError'
  }
}

export class VerbatimCompleteFailError extends Error {
  constructor(public lastMessage: string) {
    super('subagent final message lacked verbatim <promise>COMPLETE</promise> (F33 P1 mitigation)')
    this.name = 'VerbatimCompleteFailError'
  }
}

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

/** Anchor 4 — ralph-loop wedge (D1.4-3 self-implemented). External max-iter
 *  (20) × internal maxTurns (50) = 1000 round-trip ceiling. */
export async function ralphLoopWrap(
  spawn: () => Promise<string>,
  maxIter: number,
): Promise<string> {
  let last = ''
  for (let i = 0; i < maxIter; i++) {
    last = await spawn()
    if (isComplete(last)) return last // Anchor 2 — verbatim XML wrapper extract
  }
  throw new MaxIterationsExceededError(maxIter)
}
