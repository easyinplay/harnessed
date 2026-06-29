// src/checkpoint/forwardStep.ts — v12.0 Forward Continuation (Phase 38, W2). Pure
// surface resolvers shared by `harnessed next` (D3 read-only preview) and
// `harnessed advance` (D4 act + gate). Maps the deriveNext NextUnit (D1) onto the
// cross-unit print contract + exit-code contract, so the thin CLI action handlers
// (next.ts / advance.ts) stay testable without process.exit / fs.
//
// Exit-code contract (spec §4 D3, gsd-pi headless style — driver-distinguishable):
//   0  next unit available (advance)      2  all complete (done)
//   10 blocked (human decision needed)    1  error (raised by the CLI handler)
// advance adds: 11 gate-reject — refuse to skip an earlier incomplete phase (comet).

import { deriveNext, type NextUnit, type PlanningSnapshot } from './deriveNext.js'

export type ForwardExitCode = 0 | 2 | 10 | 11

/** Machine-readable shape for `harnessed advance --json` (spec §4 D4 driver loop). */
export interface ForwardJson {
  next: string
  unit: string | null
  hint: string | null
}

export interface ForwardStep {
  next: 'advance' | 'blocked' | 'done'
  unit: NextUnit
  exitCode: ForwardExitCode
  lines: string[]
  json: ForwardJson
}

export interface AdvanceStep {
  next: 'advance' | 'blocked' | 'done' | 'gate-reject'
  unit: NextUnit
  exitCode: ForwardExitCode
  lines: string[]
  json: ForwardJson
}

/** Human label for a unit's UNIT: line (null when there is nothing to point at). */
export function describeUnit(unit: NextUnit): string | null {
  switch (unit.kind) {
    case 'phase':
      return `phase ${unit.phase} '${unit.name}'`
    case 'task':
      return `task '${unit.task}' in phase ${unit.phase}`
    case 'sub':
      return `sub '${unit.sub}'`
    case 'blocked':
      return unit.unit
    case 'done':
      return null
  }
}

/** Count of phases still incomplete — drives the HINT "N phases remain". */
function remainingPhases(snapshot: PlanningSnapshot): number {
  return snapshot.phases.filter((p) => !p.complete).length
}

function pluralPhases(n: number): string {
  return `${n} phase${n === 1 ? '' : 's'} remain`
}

/**
 * D3 — resolve the `harnessed next` cross-unit forward step. Called ONLY after the
 * intra-workflow sub-ledger resolved to `done` (next.ts preserves the mid-flight
 * auto|manual|done sub contract before falling through — AC9). Read-only; never gates.
 */
export function resolveForwardStep(snapshot: PlanningSnapshot): ForwardStep {
  const unit = deriveNext(snapshot)
  switch (unit.kind) {
    case 'done':
      return {
        next: 'done',
        unit,
        exitCode: 2,
        lines: ['NEXT: done'],
        json: { next: 'done', unit: null, hint: null },
      }
    case 'blocked': {
      const u = describeUnit(unit) ?? unit.unit
      return {
        next: 'blocked',
        unit,
        exitCode: 10,
        lines: ['NEXT: blocked', `UNIT: ${u}`, `HINT: ${unit.reason}`],
        json: { next: 'blocked', unit: u, hint: unit.reason },
      }
    }
    default: {
      // phase | task | (defensive) sub — a concrete next unit is available.
      const u = describeUnit(unit) ?? ''
      const hint = `run /auto (or harnessed advance) to start it — ${pluralPhases(remainingPhases(snapshot))}`
      return {
        next: 'advance',
        unit,
        exitCode: 0,
        lines: ['NEXT: advance', `UNIT: ${u}`, `HINT: ${hint}`],
        json: { next: 'advance', unit: u, hint },
      }
    }
  }
}

interface Gate {
  unit: string
  reason: string
  code: ForwardExitCode
}

/**
 * The comet advance-gate (spec §4 D4 step 2 / §3.5): refuse to step PAST an
 * incomplete unit. Two triggers:
 *   - a blocked failed sub in the current ledger (fail-CLOSED, code 10), or
 *   - the derived next phase orders BEFORE the workflow pointer (an earlier phase was
 *     left incomplete while the pointer ran ahead — code 11). Disk reconciliation
 *     beats the stale pointer (AC3); advancing would skip the unfinished earlier work.
 * Returns null when forward advance is safe.
 */
function detectGate(snapshot: PlanningSnapshot, unit: NextUnit): Gate | null {
  if (unit.kind === 'blocked') {
    return { unit: describeUnit(unit) ?? unit.unit, reason: unit.reason, code: 10 }
  }
  if (unit.kind === 'phase' || unit.kind === 'task') {
    const pointer = snapshot.currentPhase
    if (pointer != null) {
      const pointerOrder = Number.parseFloat(pointer)
      const derivedOrder = Number.parseFloat(unit.phase)
      if (
        Number.isFinite(pointerOrder) &&
        Number.isFinite(derivedOrder) &&
        derivedOrder < pointerOrder
      ) {
        return {
          unit: describeUnit(unit) ?? unit.phase,
          reason: `phase ${unit.phase} is incomplete but the workflow pointer ran ahead to ${pointer}`,
          code: 11,
        }
      }
    }
  }
  return null
}

/**
 * D4 — resolve `harnessed advance` (the act half of the gsd-pi next/advance split).
 * Same derive engine as next, plus the advance-gate. `--force` overrides the gate,
 * printing an audit note and proceeding. Print-only (OQ-1): emits the start
 * instruction; the caller never seeds state or spawns.
 */
export function resolveAdvance(snapshot: PlanningSnapshot, force = false): AdvanceStep {
  const unit = deriveNext(snapshot)
  if (unit.kind === 'done') {
    return {
      next: 'done',
      unit,
      exitCode: 2,
      lines: ['ADVANCE: done — all phases complete'],
      json: { next: 'done', unit: null, hint: null },
    }
  }

  const gate = detectGate(snapshot, unit)
  if (gate && !force) {
    return {
      next: 'gate-reject',
      unit,
      exitCode: gate.code,
      lines: [
        `ADVANCE: refused — ${gate.reason}`,
        `UNFINISHED: ${gate.unit}`,
        'HINT: finish it, or pass --force to override (records an audit note)',
      ],
      json: { next: 'gate-reject', unit: gate.unit, hint: gate.reason },
    }
  }

  // advance — possibly forced past the gate.
  const u = describeUnit(unit) ?? ''
  const cmd = `→ run /auto "${u}"`
  const lines: string[] = []
  if (gate && force) {
    lines.push(`AUDIT: --force override — advancing past unfinished ${gate.unit} (${gate.reason})`)
  }
  lines.push('ADVANCE: advance', `UNIT: ${u}`, cmd)
  return {
    next: 'advance',
    unit,
    exitCode: 0,
    lines,
    json: { next: 'advance', unit: u, hint: cmd },
  }
}
