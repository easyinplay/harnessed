// Phase 1.4 T3.1 spillover — engine.ts ≤200L hard limit (D-13 / D1.4-6).
// Phase 1.5 T5.2 — `<promise>COMPLETE</promise>` XML wrapper upgrade: the raw
// `^COMPLETE$/m` regex moved to the hard-split helper lib/promiseExtract.ts
// (ADR 0009 § Decision Errata 3 / D1.5-4 sub-item 3 / PLAN-CHECK W-2).
// Phase 1.5.1 sister review H2 — Anchor 3 (skill install) hard split to
// lib/skillInstall.ts so this file (Anchor 4 ralph-loop wedge) honors the
// D1.4-3 ≤50L strict limit declared in ADR 0009 § Decision Errata 3.

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
