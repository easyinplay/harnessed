// Phase 1.4 T3.1 / 1.5 T5.2 / 2.2 W2 T2.4 — ralph-loop wedge (D1.4-3 ≤50L).
// Phase 2.2 W2 T2.4 adds dual-signal 4-layer isComplete + resumeSessionId
// closure (ADR 0011 errata / B-02 B-26 / PATTERNS § 2.2 § 2.4 / RESEARCH § 1.3).
// Phase v3.4.4 — moved from src/routing/lib/ to src/workflow/lib/ (single SoT, sister Phase 2 sdkSpawn pattern). promiseExtract + completionSchema + fallbackHandlers remain in src/routing/ pending Phase 6 hoist.

import type { SdkResultEnvelope } from '../../routing/completionSchema.js'
import { extractPromise } from '../../routing/lib/promiseExtract.js'

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
 *  can attach SDK session resume (CD-4 **activated Phase 3.1 W3 T3.1** —
 *  T4.4 dead-wiring 首消费者 per RESEARCH § 1.5; D-04 WIRE-IN LOCKED).
 *  `onSessionId` callback fires on iter 1 SDK system:init capture, allowing
 *  iter 2+ to pass the captured id back via `resumeSessionId` arg. */
export async function ralphLoopWrap(
  spawn: (resumeSessionId?: string, onSessionId?: (id: string) => void) => Promise<string>,
  maxIter: number,
): Promise<string> {
  let last = ''
  let sessionId: string | undefined
  for (let i = 0; i < maxIter; i++) {
    last = await spawn(sessionId, (id) => {
      sessionId = id
    })
    if (isComplete(last)) return last
  }
  throw new MaxIterationsExceededError(maxIter)
}

export type {
  FallbackMaxIterationsExceededConfig,
  MaxIterFallbackCtx,
  VerbatimFallbackCtx,
} from '../../routing/lib/fallbackHandlers.js'
export {
  handleMaxIterationsExceeded,
  handleVerbatimCompleteFail,
} from '../../routing/lib/fallbackHandlers.js'
