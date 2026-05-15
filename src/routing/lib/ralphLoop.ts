// Phase 1.4 T3.1 / 1.5 T5.2 / 2.2 W2 T2.4 — ralph-loop wedge (D1.4-3 ≤50L).
// Phase 2.2 W2 T2.4 adds dual-signal 4-layer isComplete + resumeSessionId
// closure (ADR 0011 errata / B-02 B-26 / PATTERNS § 2.2 § 2.4 / RESEARCH § 1.3).

import type { SdkResultEnvelope } from '../completionSchema.js'
import { extractPromise } from './promiseExtract.js'

/** 4-layer dual-signal completion detect: (1) outer PRIMARY structured_output,
 *  (2) outer FALLBACK <promise> in result text, (3) inner FALLBACK on raw
 *  string (non-JSON envelope — test mock / degraded; B-07 Tier A path). */
export function isComplete(output: string): boolean {
  try {
    const env = JSON.parse(output) as SdkResultEnvelope
    if (env.subtype === 'success' && env.structured_output?.status === 'COMPLETE') return true
    if (extractPromise(env.text ?? env.result ?? '') === 'COMPLETE') return true
    return false
  } catch {
    return extractPromise(output) === 'COMPLETE'
  }
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

/** Anchor 4 wedge — `resumeSessionId` flows through `spawn` so T4.1 sdkSpawn
 *  can attach SDK session resume (CD-4 deferred to v0.3.0 per B-35). */
export async function ralphLoopWrap(
  spawn: (resumeSessionId?: string) => Promise<string>,
  maxIter: number,
): Promise<string> {
  let last = ''
  let sessionId: string | undefined
  for (let i = 0; i < maxIter; i++) {
    last = await spawn(sessionId)
    if (isComplete(last)) return last
  }
  throw new MaxIterationsExceededError(maxIter)
}
