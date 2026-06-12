// src/checkpoint/breakLoop.ts — G6 anti-thrash. Pure detector: subs that have failed
// >= LOOP_THRESHOLD times are in a fix-forget-repeat loop (Trellis break-loop analog).
// The 5-dimension root-cause framework lives in the break-loop skill doc, not here.

import type { SubProgressEntryType } from './schema/currentWorkflow.v1.js'

export const LOOP_THRESHOLD = 3

export interface LoopHit {
  sub: string
  count: number
}

export function detectLoop(ledger: SubProgressEntryType[]): LoopHit[] {
  return ledger
    .filter((e) => (e.fail_count ?? 0) >= LOOP_THRESHOLD)
    .map((e) => ({ sub: e.sub, count: e.fail_count as number }))
}
