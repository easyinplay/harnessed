// src/checkpoint/progress.ts — T2.7 D-3: no-progress (plateau) damping.
//
// WHY a second stopping reason. ECC's loop-design-check names the failure mode:
// "Retry cap, hard stop, human flips the last switch = damping. Negative feedback
// with no damping oscillates (the Ralph-Wiggum loop: spinning in place, burning
// tokens)" (skills/loop-design-check/SKILL.md:87-89). Its gan-harness implements the
// plateau stop directly (gan-harness.sh:224-235 — from round 3 on, a per-round gain
// <= 0.2 counts once; two consecutive counts stop the loop). harnessed had only the
// budget stop and the advisory BREAK-LOOP failure counter — nothing that noticed a
// sub failing the SAME way over and over.
//
// TWO METRICS, NO SELF-REPORT (OQ2 裁决). ECC's own plateau input is a rubric score
// the model writes about itself, then scraped back out with three layers of regex
// (gan-harness.sh:61-69) — its most brittle seam, and exactly the "agents are
// pathological optimists" trap its own harness doc warns about
// (gan-style-harness/SKILL.md:15-17). So:
//   (ii) failing_tests   — a COUNT produced by a test runner. The agent transcribes a
//                          measurement; it never gets to assert "I made progress".
//                          Gaming it downward means fixing tests or deleting them —
//                          and deleting them is what the D-4 boundary blocks.
//   (i)  evidence_digest — the sha256 set of the sub's declared artifacts, which the
//                          evidence guard already computes. Needs zero extra input.
//                          Known weakness (accepted in OQ2): editing one character
//                          moves the digest. It is the FALLBACK, not the primary.
// Explicitly NOT adopted: a structured "progress" field written by the subagent, and
// rubric scoring. Both are self-assessment.
//
// Pure module (schema types only, zero I/O) — sister of ledger.ts / breakLoop.ts.

import type { EvidenceRefType } from './schema/currentWorkflow.v1.js'

/** Consecutive no-progress attempts before the loop is considered plateaued.
 *  2 = ECC gan-harness.sh:224-235 parity (`no_progress_count >= 2`). */
export const PLATEAU_THRESHOLD = 2

export type ProgressMetric = 'failing_tests' | 'evidence_digest'

/** The plateau state persisted on a ledger entry (`SubProgressEntry.progress`). */
export interface ProgressMark {
  metric: ProgressMetric
  failing_tests?: number
  evidence_digest?: string
  /** Consecutive attempts that produced no improvement under `metric`. */
  stale_count: number
}

/** One attempt's measurement. Both fields optional — absence degrades the metric. */
export interface ProgressSample {
  failing_tests?: number
  evidence_digest?: string
}

/** Order-independent fingerprint of the sub's declared artifacts. Empty array →
 *  '' (metric unavailable → no damping). Short prefixes keep the ledger small; the
 *  set is tiny and collisions across a single sub's own history are not a concern. */
export function evidenceDigest(refs: EvidenceRefType[]): string {
  if (refs.length === 0) return ''
  return refs
    .map((r) => r.sha256.slice(0, 12))
    .sort()
    .join(',')
}

const usableCount = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0

/** Fold one attempt's sample into the running plateau mark.
 *
 *  Returns `null` when the sample carries nothing measurable — the caller then writes
 *  NO mark, so an un-instrumented sub can never be circuit-broken by accident
 *  (fail-open; the budget stop still applies to it).
 *
 *  `failing_tests` wins whenever present. Samples are only comparable within one
 *  metric, so switching metric resets `stale_count` — a deliberate degradation:
 *  losing the counter is cheaper than comparing two different scales. */
export function sampleProgress(
  prev: ProgressMark | null | undefined,
  sample: ProgressSample,
): ProgressMark | null {
  const count = sample.failing_tests
  if (usableCount(count)) {
    const before = prev?.metric === 'failing_tests' ? prev.failing_tests : undefined
    const stalled = usableCount(before) && count >= before
    return {
      metric: 'failing_tests',
      failing_tests: count,
      stale_count: stalled ? (prev?.stale_count ?? 0) + 1 : 0,
    }
  }
  const digest = sample.evidence_digest
  if (typeof digest === 'string' && digest !== '') {
    const before = prev?.metric === 'evidence_digest' ? prev.evidence_digest : undefined
    const stalled = !!before && digest === before
    return {
      metric: 'evidence_digest',
      evidence_digest: digest,
      stale_count: stalled ? (prev?.stale_count ?? 0) + 1 : 0,
    }
  }
  return null
}

/** True once `PLATEAU_THRESHOLD` consecutive attempts produced no improvement. */
export function isPlateaued(mark: ProgressMark | null | undefined): boolean {
  return (mark?.stale_count ?? 0) >= PLATEAU_THRESHOLD
}
