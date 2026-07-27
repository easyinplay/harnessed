// Phase 1.4 T3.1 / 1.5 T5.2 / 2.2 W2 T2.4 — ralph-loop wedge (D1.4-3 ≤50L).
// Phase 2.2 W2 T2.4 adds dual-signal 4-layer isComplete + resumeSessionId
// closure (ADR 0011 errata / B-02 B-26 / PATTERNS § 2.2 § 2.4 / RESEARCH § 1.3).
// Phase v3.4.4 — moved from src/routing/lib/ to src/workflow/lib/ (single SoT, sister Phase 2 sdkSpawn pattern). promiseExtract + completionSchema + fallbackHandlers remain in src/routing/ pending Phase 6 hoist.

import type { SdkResultEnvelope } from './completionSchema.js'
import { extractPromise } from './promiseExtract.js'

/** Single SoT completion predicate — issue #3 direction C ("principled middle").
 *  BOTH the single-shot dispatch (run.ts) and the ralph-loop retry gate call this
 *  one function, so the identical envelope can never be judged two ways (the prior
 *  divergence: run.ts treated `subtype:'success'` alone as done while this gate
 *  looped it to max-iter → fail).
 *
 *  Semantics:
 *   - an EXPLICIT structured status is authoritative:
 *       COMPLETE  → done, but only on a successful run (`subtype === 'success'`);
 *                   a COMPLETE claim on an errored/aborted run is not trusted.
 *       PARTIAL / BLOCKED → not done (ralph keeps retrying; single-shot fails).
 *   - status ABSENT (the SDK did not populate structured_output):
 *       a clean run (`subtype === 'success'`) counts as done;
 *       otherwise fall back to a verbatim `<promise>COMPLETE</promise>` tag in the
 *       result text (B-07 degraded path), else not done.
 *   - a non-JSON raw string (test mock / degraded) → the `<promise>` tag alone. */
export function isComplete(output: string): boolean {
  let env: SdkResultEnvelope
  try {
    env = JSON.parse(output) as SdkResultEnvelope
  } catch {
    return extractPromise(output) === 'COMPLETE'
  }
  const succeeded = env.subtype === 'success'
  const status = env.structured_output?.status
  if (status === 'COMPLETE') return succeeded
  if (status === 'PARTIAL' || status === 'BLOCKED') return false
  // status absent → a clean run is done; else the degraded <promise> fallback.
  if (succeeded) return true
  return extractPromise(env.text ?? env.result ?? '') === 'COMPLETE'
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
} from './fallbackHandlers.js'
export { handleMaxIterationsExceeded, handleVerbatimCompleteFail } from './fallbackHandlers.js'
