// src/checkpoint/deriveNext.ts — v12.0 Forward Continuation (Phase 37, D1). Pure
// resolver (schema-type-only, no I/O) over a disk snapshot assembled by the impure
// reader (planningScan.ts, D2). Mirrors nextStep.ts's resolver style: the snapshot
// is passed in so this stays testable without fs.
//
// "Derive, don't queue" (spec §3.1): the next unit is recomputed from .planning/
// disk state each call — no stored FIFO. The pointer is stateless = first-incomplete
// unit (oh-my-pi). A stale current_phase that over-ran a dead session is NOT trusted;
// disk reconciliation (PLAN > SUMMARY) wins (gsd-core next.md Route 0 / spec AC3).

import { nextPending } from './ledger.js'
import type { SubProgressEntryType } from './schema/currentWorkflow.v1.js'

/** Per-phase artifact-derived status (one phases/NN-name dir). */
export interface PhaseSnapshot {
  /** the leading NN numeric prefix as a string, e.g. "16" or "16.1". */
  phase: string
  /** the dir's name suffix (after the NN- prefix), best-effort human label. */
  name: string
  /** count of NN-...-PLAN.md files. */
  plans: number
  /** count of NN-...-SUMMARY.md files. */
  summaries: number
  /** artifact-derived completion: plans > 0 && summaries >= plans (spec §3.3). */
  complete: boolean
  /** numeric sort key (parseFloat of NN) — supports decimal mid-insertion (16.1). */
  order: number
  /** OQ-2 stretch — task-level checkbox scan (only populated when includeTasks). */
  tasks?: TaskSnapshot
}

/** OQ-2 stretch — the active phase's task checkboxes (best-effort). */
export interface TaskSnapshot {
  /** first unchecked "- [ ]" task text, or null when none / all checked. */
  nextUnchecked: string | null
}

/** The disk snapshot D1 consumes. Assembled by planningScan (D2). */
export interface PlanningSnapshot {
  /** current-workflow sub-progress ledger (branch 1 / AC9). */
  subProgress: SubProgressEntryType[]
  /** the workflow phase pointer — informational ONLY; NEVER routed on (AC3). */
  currentPhase: string | null
  /** all phases, sorted ascending by order. */
  phases: PhaseSnapshot[]
}

/** The next work unit. Discriminated union on `kind` (first-match-wins). Exported
 *  for reuse by the W2 surface (harnessed next / advance). */
export type NextUnit =
  | { kind: 'sub'; sub: string } // (1) current workflow has a pending sub
  | { kind: 'task'; phase: string; task: string } // (2) current phase has an unchecked task
  | { kind: 'phase'; phase: string; name: string } // (3) first incomplete phase
  | { kind: 'blocked'; unit: string; reason: string } // a unit failed / needs a decision
  | { kind: 'done' } // all phases + tasks complete

/**
 * Resolve the next work unit from a disk snapshot. First match wins, in the
 * spec-D1 order: pending sub → blocked (failed sub) → unchecked task → first
 * incomplete phase → done.
 */
export function deriveNext(snapshot: PlanningSnapshot): NextUnit {
  // (1) intra-workflow: a mid-flight sub takes precedence (backward-compat, AC9).
  const pendingSub = nextPending(snapshot.subProgress)
  if (pendingSub !== null) return { kind: 'sub', sub: pendingSub }

  // blocked: the current workflow died on a failed sub (no pending left, but a
  // failure was recorded). Fail-CLOSED — a human decides before forward advance.
  const failed = snapshot.subProgress.find((e) => e.status === 'failed' && (e.fail_count ?? 0) > 0)
  if (failed) {
    return {
      kind: 'blocked',
      unit: failed.sub,
      reason: `sub '${failed.sub}' failed ${failed.fail_count}x — resolve before advancing`,
    }
  }

  // forward continuation: first incomplete phase by NN order (disk beats pointer).
  const firstIncomplete = snapshot.phases.find((p) => !p.complete)
  if (firstIncomplete) {
    // (2) task-level granularity (OQ-2 stretch) — an unchecked task in this phase.
    const task = firstIncomplete.tasks?.nextUnchecked
    if (task) return { kind: 'task', phase: firstIncomplete.phase, task }
    // (3) phase-level advance (the high-value floor).
    return { kind: 'phase', phase: firstIncomplete.phase, name: firstIncomplete.name }
  }

  // (5) every phase complete and no pending/failed work.
  return { kind: 'done' }
}
