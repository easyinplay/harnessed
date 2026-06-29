// src/checkpoint/planningScan.ts — v12.0 Forward Continuation (Phase 37, D2). The
// impure, best-effort disk reader that assembles the PlanningSnapshot the pure
// resolver (deriveNext.ts, D1) consumes. Mirrors injectState.ts:findPhaseContextExcerpt
// — graceful (try/catch → safe empty), repoRoot-injectable, sync fs only.
//
// "harnessed-native scan as the floor" (spec §3.2): the disk-reconciliation rule is
// a simple boolean (plans>0 && summaries>=plans). gsd_run query acceleration is a
// later wave (W3/P39), NOT here — this stays self-contained so AC8 (no GSD) holds.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PhaseSnapshot, PlanningSnapshot, TaskSnapshot } from './deriveNext.js'
import type { CurrentWorkflowV1Type } from './schema/currentWorkflow.v1.js'

export interface ScanOptions {
  /** repo root holding .planning/ (default process.cwd()). */
  repoRoot?: string
  /** the current-workflow envelope (branch-1 ledger). Injectable for tests; the
   *  W2 CLI passes the value read via readCurrentWorkflow. null → no active sub. */
  currentWorkflow?: CurrentWorkflowV1Type | null
  /** OQ-2 stretch — scan task_plan/progress checkboxes for incomplete phases.
   *  Default false (phase-level advance is the W1 floor). */
  includeTasks?: boolean
}

/** Matches NN-rest or NN.M-rest phase dir names (e.g. 16-alpha, 16.1-hotfix). */
const PHASE_DIR = /^(\d+(?:\.\d+)?)-(.*)$/

/**
 * Assemble the disk snapshot for deriveNext. Best-effort: a missing .planning/ or
 * any unreadable file yields a safe-empty snapshot (never throws) so the engine
 * degrades to `done` rather than crashing (AC8).
 */
export function scanPlanning(opts: ScanOptions = {}): PlanningSnapshot {
  const repoRoot = opts.repoRoot ?? process.cwd()
  const wf = opts.currentWorkflow ?? null
  return {
    subProgress: wf?.sub_progress ?? [],
    currentPhase: wf?.phase ?? null,
    phases: scanPhases(repoRoot, opts.includeTasks ?? false),
  }
}

/** Scan phases/NN-name dirs, deriving per-phase plan/summary counts and
 *  completion. Returns [] when the dir is absent/unreadable (graceful). Sorted
 *  ascending by numeric NN (decimal-aware for mid-insertion). */
function scanPhases(repoRoot: string, includeTasks: boolean): PhaseSnapshot[] {
  try {
    const phasesDir = join(repoRoot, '.planning', 'phases')
    if (!existsSync(phasesDir)) return []
    const out: PhaseSnapshot[] = []
    for (const dir of readdirSync(phasesDir)) {
      const m = PHASE_DIR.exec(dir)
      const num = m?.[1]
      if (!num) continue
      const dirPath = join(phasesDir, dir)
      let entries: string[]
      try {
        entries = readdirSync(dirPath)
      } catch {
        continue // not a dir / unreadable → skip
      }
      let plans = 0
      let summaries = 0
      const prefix = `${num}-`
      for (const f of entries) {
        // require the file's leading NN- to match this phase so decimal phases
        // (16.1-) never leak into the integer phase (16-) and vice versa.
        if (!f.startsWith(prefix)) continue
        if (f.endsWith('-PLAN.md')) plans++
        else if (f.endsWith('-SUMMARY.md')) summaries++
      }
      const complete = plans > 0 && summaries >= plans
      const phase: PhaseSnapshot = {
        phase: num,
        name: m?.[2] ?? '',
        plans,
        summaries,
        complete,
        order: Number.parseFloat(num),
      }
      if (includeTasks && !complete) phase.tasks = scanTasks(dirPath)
      out.push(phase)
    }
    out.sort((a, b) => a.order - b.order)
    return out
  } catch {
    return []
  }
}

/** Best-effort first-unchecked-task scan (OQ-2 stretch). Looks at task_plan.md
 *  then progress.md for the first "- [ ]" line. Unreadable → null. */
function scanTasks(dirPath: string): TaskSnapshot {
  for (const fname of ['task_plan.md', 'progress.md']) {
    try {
      const p = join(dirPath, fname)
      if (!existsSync(p)) continue
      const m = /^[ \t]*- \[ \]\s+(.+)$/m.exec(readFileSync(p, 'utf8'))
      const task = m?.[1]
      if (task) return { nextUnchecked: task.trim() }
    } catch {
      // unreadable → keep looking / graceful null
    }
  }
  return { nextUnchecked: null }
}
