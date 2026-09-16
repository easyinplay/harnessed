// src/checkpoint/breakLoop.ts — G6 anti-thrash. Pure detector: subs that have failed
// >= LOOP_THRESHOLD times are in a fix-forget-repeat loop (Trellis break-loop analog).
// The 5-dimension root-cause framework lives in the break-loop skill doc, not here.

import type { SubProgressEntryType } from './schema/currentWorkflow.v1.js'

export const LOOP_THRESHOLD = 3

export interface LoopHit {
  sub: string
  count: number
}

/** History detector — deliberately status-blind (compaction keeps fail_count>0
 *  entries so this still sees them; tests/checkpoint/compact.test.ts G6). Callers
 *  that turn a hit into a "stop respawning" directive filter with isSettled. */
export function detectLoop(ledger: SubProgressEntryType[]): LoopHit[] {
  return ledger
    .filter((e) => (e.fail_count ?? 0) >= LOOP_THRESHOLD)
    .map((e) => ({ sub: e.sub, count: e.fail_count as number }))
}

/** A sub that has reached a resolution (done / skipped / rejected) will not be
 *  spawned again, so BREAK-LOOP / BUDGET-EXHAUSTED / NO-PROGRESS — all defined as
 *  "stop respawning" conditions — are noise for it. Without this filter a sub that
 *  failed 3x and then passed was told to stop on every turn for the rest of the
 *  workflow (external review L13). */
export function isSettled(e: SubProgressEntryType): boolean {
  return e.status === 'done' || e.status === 'skipped' || e.status === 'rejected'
}
