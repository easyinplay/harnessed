// v12.0 Forward Continuation (Phase 38, W2) — `harnessed next` D3 fall-through +
// `harnessed advance` D4 + advance-gate. Tests the pure resolvers (forwardStep.ts)
// over fixtured `.planning/` snapshots, then the thin CLI action handlers for the
// exit-code contract (0 advance / 2 done / 10 blocked / 11 gate-reject).
//
// Sister patterns: tests/checkpoint/deriveNext.test.ts (phaseDir fixtures) +
// tests/cli/run.test.ts (ExitError + process.exit spy for exit-code assertions).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveAdvance, resolveForwardStep } from '../../src/checkpoint/forwardStep.js'
import { scanPlanning } from '../../src/checkpoint/planningScan.js'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

// state.js is dynamically imported by next.ts/advance.ts — mock the read so the CLI
// tests control the active workflow; scanPlanning still reads the real fs (cwd spy).
vi.mock('../../src/checkpoint/state.js', () => ({
  readCurrentWorkflow: vi.fn(async () => null),
}))

import { readCurrentWorkflow } from '../../src/checkpoint/state.js'
import { registerAdvance } from '../../src/cli/advance.js'
import { registerNext } from '../../src/cli/next.js'

const mockedRead = vi.mocked(readCurrentWorkflow)

// ── fixture helpers ──────────────────────────────────────────────────────────

let tmp: string

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'next-advance-'))
  mockedRead.mockReset()
  mockedRead.mockResolvedValue(null)
})
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
  vi.restoreAllMocks()
})

function phaseDir(dir: string, files: string[]): void {
  const p = join(tmp, '.planning', 'phases', dir)
  mkdirSync(p, { recursive: true })
  for (const f of files) writeFileSync(join(p, f), '', 'utf8')
}

const wf = (over: Partial<CurrentWorkflowV1Type> = {}): CurrentWorkflowV1Type => ({
  schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
  phase: 'task',
  status: 'active',
  last_checkpoint_path: null,
  started_at: '2026-06-30T00:00:00.000Z',
  ...over,
})

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit ${code}`)
  }
}

interface CliResult {
  code: number
  out: string
}

async function runCli(register: (p: Command) => void, argv: string[]): Promise<CliResult> {
  let out = ''
  const exit = vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
    throw new ExitError(typeof c === 'number' ? c : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    out += `${a.map(String).join(' ')}\n`
  })
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue(tmp)
  const program = new Command().exitOverride()
  register(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'h', ...argv])
  } catch (e) {
    code = e instanceof ExitError ? e.code : 1
    if (!(e instanceof ExitError)) out += `${(e as Error).message}\n`
  } finally {
    exit.mockRestore()
    log.mockRestore()
    cwd.mockRestore()
  }
  return { code, out }
}

// ── AC2 — phase boundary (next) ───────────────────────────────────────────────

describe('AC2 — phase 16 complete / 17 incomplete', () => {
  it('resolveForwardStep → advance, UNIT phase 17, exit 0', () => {
    phaseDir('16-alpha', ['16-PLAN.md', '16-01-SUMMARY.md'])
    phaseDir('17-beta', ['17-PLAN.md'])
    const fwd = resolveForwardStep(scanPlanning({ repoRoot: tmp, currentWorkflow: null }))
    expect(fwd.next).toBe('advance')
    expect(fwd.exitCode).toBe(0)
    expect(fwd.lines).toEqual([
      'NEXT: advance',
      "UNIT: phase 17 'beta'",
      'HINT: run /auto (or harnessed advance) to start it — 1 phase remain',
    ])
  })

  it('harnessed next → NEXT: advance + UNIT phase 17 + exit 0', async () => {
    phaseDir('16-alpha', ['16-PLAN.md', '16-01-SUMMARY.md'])
    phaseDir('17-beta', ['17-PLAN.md'])
    mockedRead.mockResolvedValue(null)
    const { code, out } = await runCli(registerNext, ['next'])
    expect(out).toContain('NEXT: advance')
    expect(out).toContain("UNIT: phase 17 'beta'")
    expect(code).toBe(0)
  })
})

// ── AC5 — all complete (done) ─────────────────────────────────────────────────

describe('AC5 — every phase has a matching SUMMARY', () => {
  it('resolveForwardStep → done, exit 2', () => {
    phaseDir('16-alpha', ['16-PLAN.md', '16-01-SUMMARY.md'])
    phaseDir('17-beta', ['17-PLAN.md', '17-01-SUMMARY.md'])
    const fwd = resolveForwardStep(scanPlanning({ repoRoot: tmp, currentWorkflow: null }))
    expect(fwd).toMatchObject({ next: 'done', exitCode: 2, lines: ['NEXT: done'] })
  })

  it('harnessed next → NEXT: done + exit 2', async () => {
    phaseDir('16-alpha', ['16-PLAN.md', '16-01-SUMMARY.md'])
    phaseDir('17-beta', ['17-PLAN.md', '17-01-SUMMARY.md'])
    const { code, out } = await runCli(registerNext, ['next'])
    expect(out).toContain('NEXT: done')
    expect(code).toBe(2)
  })
})

// ── AC9 — backward-compat: mid-flight pending sub keeps the old contract ───────

describe('AC9 — mid-flight workflow with a pending sub', () => {
  it('harnessed next → NEXT: auto + SUB, exit 0, no cross-unit fall-through', async () => {
    // an incomplete phase exists on disk, but a pending sub must take precedence
    phaseDir('16-alpha', ['16-PLAN.md'])
    mockedRead.mockResolvedValue(
      wf({ sub_progress: [{ sub: 'task-code', status: 'pending', gate_fired: true }] }),
    )
    const { code, out } = await runCli(registerNext, ['next'])
    expect(out).toContain('NEXT: auto')
    expect(out).toContain('SUB: task-code')
    expect(out).not.toContain('advance')
    expect(code).toBe(0)
  })
})

// ── blocked — resolved-but-failed ledger (next) ───────────────────────────────

describe('blocked — failed sub, no pending', () => {
  it('resolveForwardStep → blocked, exit 10', () => {
    const snap = scanPlanning({
      repoRoot: tmp,
      currentWorkflow: wf({
        sub_progress: [{ sub: 'task-code', status: 'failed', gate_fired: true, fail_count: 2 }],
      }),
    })
    const fwd = resolveForwardStep(snap)
    expect(fwd.next).toBe('blocked')
    expect(fwd.exitCode).toBe(10)
    expect(fwd.lines[0]).toBe('NEXT: blocked')
  })
})

// ── AC6 — advance-gate (comet): refuse to skip an earlier incomplete phase ─────

describe('AC6 — advance gate', () => {
  it('refuses (exit 11) naming the unfinished earlier phase when pointer ran ahead', () => {
    phaseDir('16-alpha', ['16-PLAN.md']) // incomplete (PLAN > SUMMARY)
    phaseDir('17-beta', ['17-PLAN.md']) // also incomplete, later
    // pointer claims 17 but 16 is unfinished — advancing would skip 16
    const snap = scanPlanning({ repoRoot: tmp, currentWorkflow: wf({ phase: '17' }) })
    const adv = resolveAdvance(snap, false)
    expect(adv.next).toBe('gate-reject')
    expect(adv.exitCode).toBe(11)
    expect(adv.lines.join('\n')).toContain("phase 16 'alpha'")
  })

  it('--force overrides the gate and advances (exit 0) with an audit note', () => {
    phaseDir('16-alpha', ['16-PLAN.md'])
    phaseDir('17-beta', ['17-PLAN.md'])
    const snap = scanPlanning({ repoRoot: tmp, currentWorkflow: wf({ phase: '17' }) })
    const adv = resolveAdvance(snap, true)
    expect(adv.next).toBe('advance')
    expect(adv.exitCode).toBe(0)
    expect(adv.lines.join('\n')).toContain('AUDIT: --force override')
  })

  it('harnessed advance CLI refuses (non-zero) without --force', async () => {
    phaseDir('16-alpha', ['16-PLAN.md'])
    phaseDir('17-beta', ['17-PLAN.md'])
    mockedRead.mockResolvedValue(wf({ phase: '17' }))
    const { code, out } = await runCli(registerAdvance, ['advance'])
    expect(code).not.toBe(0)
    expect(out).toContain("phase 16 'alpha'")
  })

  it('harnessed advance --force CLI advances (exit 0)', async () => {
    phaseDir('16-alpha', ['16-PLAN.md'])
    phaseDir('17-beta', ['17-PLAN.md'])
    mockedRead.mockResolvedValue(wf({ phase: '17' }))
    const { code, out } = await runCli(registerAdvance, ['advance', '--force'])
    expect(code).toBe(0)
    expect(out).toContain('ADVANCE: advance')
  })
})

// ── advance — normal forward (no gate) + --json shape ──────────────────────────

describe('advance — forward + json', () => {
  it('advances to the next phase when earlier work is complete (exit 0)', () => {
    phaseDir('16-alpha', ['16-PLAN.md', '16-01-SUMMARY.md']) // complete
    phaseDir('17-beta', ['17-PLAN.md']) // next
    const snap = scanPlanning({ repoRoot: tmp, currentWorkflow: wf({ phase: '16' }) })
    const adv = resolveAdvance(snap, false)
    expect(adv).toMatchObject({ next: 'advance', exitCode: 0 })
    expect(adv.lines.join('\n')).toContain('→ run /auto "phase 17 \'beta\'"')
  })

  it('--json emits {next, unit, hint} (exit 0)', async () => {
    phaseDir('16-alpha', ['16-PLAN.md', '16-01-SUMMARY.md'])
    phaseDir('17-beta', ['17-PLAN.md'])
    mockedRead.mockResolvedValue(wf({ phase: '16' }))
    const { code, out } = await runCli(registerAdvance, ['advance', '--json'])
    expect(code).toBe(0)
    const parsed = JSON.parse(out.trim())
    expect(parsed).toMatchObject({ next: 'advance', unit: "phase 17 'beta'" })
    expect(typeof parsed.hint).toBe('string')
  })

  it('--json done → exit 2, unit null', async () => {
    phaseDir('16-alpha', ['16-PLAN.md', '16-01-SUMMARY.md'])
    const { code, out } = await runCli(registerAdvance, ['advance', '--json'])
    expect(code).toBe(2)
    expect(JSON.parse(out.trim())).toMatchObject({ next: 'done', unit: null })
  })
})
