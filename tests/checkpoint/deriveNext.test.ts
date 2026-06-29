import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { deriveNext } from '../../src/checkpoint/deriveNext.js'
import { scanPlanning } from '../../src/checkpoint/planningScan.js'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

// ── fixture helpers ──────────────────────────────────────────────────────────

let tmp: string

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'derive-next-'))
})
afterEach(() => rmSync(tmp, { recursive: true, force: true }))

/** Create a phase dir under the temp `.planning/phases/`, writing the given
 *  PLAN / SUMMARY / loose files. `files` are written verbatim (content ''). */
function phaseDir(dir: string, files: string[]): void {
  const p = join(tmp, '.planning', 'phases', dir)
  mkdirSync(p, { recursive: true })
  for (const f of files) writeFileSync(join(p, f), '', 'utf8')
}

function writeFile(dir: string, name: string, body: string): void {
  const p = join(tmp, '.planning', 'phases', dir)
  mkdirSync(p, { recursive: true })
  writeFileSync(join(p, name), body, 'utf8')
}

const wf = (over: Partial<CurrentWorkflowV1Type> = {}): CurrentWorkflowV1Type => ({
  schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
  phase: 'task',
  status: 'active',
  last_checkpoint_path: null,
  started_at: '2026-06-30T00:00:00.000Z',
  ...over,
})

// ── AC2 — phase boundary ──────────────────────────────────────────────────────

describe('deriveNext — AC2 phase boundary', () => {
  it('routes to the first incomplete phase (16 complete, 17 incomplete)', () => {
    phaseDir('16-alpha', ['16-PLAN.md', '16-01-SUMMARY.md'])
    phaseDir('17-beta', ['17-PLAN.md'])
    const snap = scanPlanning({ repoRoot: tmp, currentWorkflow: null })
    expect(deriveNext(snap)).toEqual({ kind: 'phase', phase: '17', name: 'beta' })
  })
})

// ── AC3 — resume-first-incomplete (disk beats stale pointer) ──────────────────

describe('deriveNext — AC3 resume-first-incomplete', () => {
  it('routes to phase 16 even though the workflow pointer says 18', () => {
    phaseDir('16-alpha', ['16-PLAN.md']) // PLAN > SUMMARY → dead session
    phaseDir('17-beta', ['17-PLAN.md', '17-01-SUMMARY.md'])
    phaseDir('18-gamma', ['18-PLAN.md', '18-01-SUMMARY.md'])
    // pointer claims 18, but no pending subs (dead session) → disk reconciliation wins
    const snap = scanPlanning({ repoRoot: tmp, currentWorkflow: wf({ phase: '18' }) })
    expect(deriveNext(snap)).toEqual({ kind: 'phase', phase: '16', name: 'alpha' })
  })
})

// ── AC4 — mid-insertion (decimal NN ordering) ─────────────────────────────────

describe('deriveNext — AC4 mid-insertion', () => {
  it('picks up an inserted phase 16.1 after 16 completes (NN sort, no rebuild)', () => {
    phaseDir('16-alpha', ['16-PLAN.md', '16-01-SUMMARY.md']) // complete
    phaseDir('16.1-hotfix', ['16.1-PLAN.md']) // inserted, incomplete
    phaseDir('17-beta', ['17-PLAN.md']) // also incomplete but later
    const snap = scanPlanning({ repoRoot: tmp, currentWorkflow: null })
    expect(deriveNext(snap)).toEqual({ kind: 'phase', phase: '16.1', name: 'hotfix' })
  })
})

// ── AC5 — done ────────────────────────────────────────────────────────────────

describe('deriveNext — AC5 done', () => {
  it('returns done when every phase has a matching SUMMARY', () => {
    phaseDir('16-alpha', ['16-PLAN.md', '16-01-SUMMARY.md'])
    phaseDir('17-beta', ['17-PLAN.md', '17-01-SUMMARY.md'])
    const snap = scanPlanning({ repoRoot: tmp, currentWorkflow: null })
    expect(deriveNext(snap)).toEqual({ kind: 'done' })
  })

  it('multi-plan phase complete only when summaries >= plans', () => {
    // two plans, two summaries → complete
    phaseDir('16-alpha', ['16-01-PLAN.md', '16-02-PLAN.md', '16-01-SUMMARY.md', '16-02-SUMMARY.md'])
    const snap = scanPlanning({ repoRoot: tmp, currentWorkflow: null })
    expect(deriveNext(snap)).toEqual({ kind: 'done' })
  })

  it('multi-plan phase incomplete when a plan lacks a summary', () => {
    phaseDir('16-alpha', ['16-01-PLAN.md', '16-02-PLAN.md', '16-01-SUMMARY.md'])
    const snap = scanPlanning({ repoRoot: tmp, currentWorkflow: null })
    expect(deriveNext(snap)).toEqual({ kind: 'phase', phase: '16', name: 'alpha' })
  })
})

// ── AC8 — graceful with no .planning / GSD ────────────────────────────────────

describe('deriveNext — AC8 graceful (no .planning)', () => {
  it('returns done (no throw) when .planning is absent', () => {
    const snap = scanPlanning({ repoRoot: tmp, currentWorkflow: null })
    expect(snap.phases).toEqual([])
    expect(deriveNext(snap)).toEqual({ kind: 'done' })
  })

  it('returns done when phases dir is empty', () => {
    mkdirSync(join(tmp, '.planning', 'phases'), { recursive: true })
    const snap = scanPlanning({ repoRoot: tmp, currentWorkflow: null })
    expect(deriveNext(snap)).toEqual({ kind: 'done' })
  })
})

// ── AC9 — backward-compat (pending sub wins, no level-jump) ────────────────────

describe('deriveNext — AC9 backward-compat sub', () => {
  it('returns the pending sub instead of advancing to a phase', () => {
    phaseDir('16-alpha', ['16-PLAN.md']) // incomplete phase present...
    const snap = scanPlanning({
      repoRoot: tmp,
      currentWorkflow: wf({
        sub_progress: [{ sub: 'task-code', status: 'pending', gate_fired: true }],
      }),
    })
    // ...but a mid-flight sub takes precedence — no cross-unit jump
    expect(deriveNext(snap)).toEqual({ kind: 'sub', sub: 'task-code' })
  })

  it('does not treat a resolved ledger as a pending sub (falls through to phase)', () => {
    phaseDir('16-alpha', ['16-PLAN.md'])
    const snap = scanPlanning({
      repoRoot: tmp,
      currentWorkflow: wf({
        sub_progress: [{ sub: 'task-code', status: 'done', gate_fired: true }],
      }),
    })
    expect(deriveNext(snap)).toEqual({ kind: 'phase', phase: '16', name: 'alpha' })
  })
})

// ── blocked — failed sub in the current ledger ────────────────────────────────

describe('deriveNext — blocked', () => {
  it('reports blocked when the current workflow died on a failed sub', () => {
    phaseDir('16-alpha', ['16-PLAN.md'])
    const snap = scanPlanning({
      repoRoot: tmp,
      currentWorkflow: wf({
        sub_progress: [{ sub: 'task-code', status: 'failed', gate_fired: true, fail_count: 2 }],
      }),
    })
    const next = deriveNext(snap)
    expect(next.kind).toBe('blocked')
    if (next.kind === 'blocked') {
      expect(next.unit).toBe('task-code')
      expect(next.reason).toContain('failed')
    }
  })
})

// ── AC1 (stretch, OQ-2) — task-level granularity ──────────────────────────────

describe('deriveNext — AC1 task-level (stretch)', () => {
  it('routes to the next unchecked task when includeTasks is enabled', () => {
    writeFile('16-alpha', '16-PLAN.md', '')
    writeFile(
      '16-alpha',
      'task_plan.md',
      '# Tasks\n\n- [x] write the schema\n- [ ] implement the resolver\n- [ ] wire the CLI\n',
    )
    const snap = scanPlanning({ repoRoot: tmp, currentWorkflow: null, includeTasks: true })
    expect(deriveNext(snap)).toEqual({
      kind: 'task',
      phase: '16',
      task: 'implement the resolver',
    })
  })

  it('falls back to phase-level when includeTasks is off (default floor)', () => {
    writeFile('16-alpha', '16-PLAN.md', '')
    writeFile('16-alpha', 'task_plan.md', '- [ ] implement the resolver\n')
    const snap = scanPlanning({ repoRoot: tmp, currentWorkflow: null })
    expect(deriveNext(snap)).toEqual({ kind: 'phase', phase: '16', name: 'alpha' })
  })
})
