// src/checkpoint/breakLoop.ts — G6 anti-thrash. Pure detector: subs that have failed
// >= LOOP_THRESHOLD times are in a fix-forget-repeat loop (Trellis break-loop analog).
// The stop rule itself is NOT in a skill: the directive that reaches the model names
// the action (re-scope the subtask, fix the blocker, or escalate to the user) and the
// shipped workflow docs (task / verify-*) carry the same rule. A directive that points
// at a skill harnessed does not ship is unsatisfiable — it once made a codex agent stop
// and ask for a skill that does not exist on any host.

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
