// T2.7 first step — the completion GUARANTEE moves onto the live checkpoint path.
//
// Before: the guarantee lived on `harnessed run` (isComplete + ralph_max_iterations),
// which every SKILL forbids, plus an upstream `ralph-loop` plugin. On a machine with
// NO upstream plugin installed the live path enforced only artifact existence.
// After, `harnessed checkpoint complete/fail` enforce four deterministic checks:
//   1. artifact existence + .planning sync  (pre-existing, 4.33.0)
//   2. done-criterion BOUNDARY on tdd-evidence.md                      (D-4)
//   3. the completion promise, when a claim is supplied                (D-1)
//   4. attempt budget + no-progress damping, from the ledger's counter (D-2 / D-3)

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/task-test.json' })),
  completePhase: vi.fn(async () => undefined),
}))
vi.mock('../../src/checkpoint/evidence.js', () => ({
  checkArtifacts: vi.fn(async () => ({ status: 'none_declared', found: [], missing: [] })),
  checkPlanningSync: vi.fn(async () => ({ status: 'verified', missing: [] })),
}))
vi.mock('../../src/checkpoint/state.js', () => ({
  mutateSubProgress: vi.fn(async () => undefined),
  readCurrentWorkflow: vi.fn(async () => null),
  writeCurrentWorkflow: vi.fn(async () => undefined),
  mutateStore: vi.fn(async () => undefined),
}))
vi.mock('../../src/checkpoint/scale.js', () => ({
  collectScaleMetrics: vi.fn(async () => ({ changedFiles: 0, firedSubs: 0, requirements: 0 })),
  assessScale: vi.fn(() => 'light' as const),
}))
// The boundary itself is unit-tested against a real git fixture in
// tests/checkpoint/tddBoundary.test.ts; here we only assert the CLI wiring.
vi.mock('../../src/checkpoint/tddBoundary.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/checkpoint/tddBoundary.js')>(
    '../../src/checkpoint/tddBoundary.js',
  )
  return { ...actual, checkTddBoundary: vi.fn(async () => []) }
})

import { completePhase } from '../../src/checkpoint/engineHook.js'
import { checkArtifacts } from '../../src/checkpoint/evidence.js'
import { mutateSubProgress, readCurrentWorkflow } from '../../src/checkpoint/state.js'
import { checkTddBoundary } from '../../src/checkpoint/tddBoundary.js'
import { registerCheckpoint } from '../../src/cli/checkpoint.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  let stdout = ''
  let stderr = ''
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    stdout += `${a.map(String).join(' ')}\n`
  })
  const err = vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
    stderr += `${a.map(String).join(' ')}\n`
  })
  const warn = vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
    stderr += `${a.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerCheckpoint(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) code = e.code
    else {
      code = 1
      stderr += `${(e as Error).message}\n`
    }
  } finally {
    exit.mockRestore()
    log.mockRestore()
    err.mockRestore()
    warn.mockRestore()
  }
  return { code, stdout, stderr }
}

const ledgerOf = (entries: unknown[]) =>
  ({
    schemaVersion: 'harnessed.current-workflow.v1',
    phase: 'task',
    status: 'active',
    last_checkpoint_path: null,
    started_at: '2026-07-30T00:00:00.000Z',
    sub_progress: entries,
    // biome-ignore lint/suspicious/noExplicitAny: schema literal narrowing in a test fixture.
  }) as any

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(checkArtifacts).mockResolvedValue({ status: 'none_declared', found: [], missing: [] })
  vi.mocked(checkTddBoundary).mockResolvedValue([])
  vi.mocked(readCurrentWorkflow).mockResolvedValue(null)
})
afterEach(() => vi.restoreAllMocks())

// ── D-1 completion claim ──────────────────────────────────────────────────────
describe('D-1 — the completion promise is verified by `checkpoint complete`', () => {
  it('a verbatim promise passes and is recorded on the ledger entry', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue(
      ledgerOf([{ sub: 'task-test', status: 'pending', gate_fired: true }]),
    )
    const { code } = await runCli([
      'checkpoint',
      'complete',
      'task-test',
      '--result',
      'all good <promise>COMPLETE</promise>',
    ])
    expect(code).toBe(0)
    // the ledger mutation carries the verdict (auditable, not just a log line)
    const mutator = vi.mocked(mutateSubProgress).mock.calls[0]?.[0] as (e: unknown[]) => unknown[]
    const after = mutator([{ sub: 'task-test', status: 'pending', gate_fired: true }]) as Array<{
      completion_claim?: string
    }>
    expect(after[0]?.completion_claim).toBe('complete')
  })

  it('a claim WITHOUT the promise is fail-closed: BLOCKED, exit 1, no completePhase', async () => {
    const { code, stderr } = await runCli([
      'checkpoint',
      'complete',
      'task-test',
      '--result',
      'I made some progress but the tests still fail.',
    ])
    expect(code).toBe(1)
    expect(stderr).toContain('BLOCKED')
    expect(stderr).toMatch(/completion promise|<promise>COMPLETE<\/promise>/)
    expect(completePhase).not.toHaveBeenCalled()
  })

  it('--force overrides the promise block and records evidence_status=overridden', async () => {
    const { code, stdout } = await runCli([
      'checkpoint',
      'complete',
      'task-test',
      '--result',
      'not done',
      '--force',
    ])
    expect(code).toBe(0)
    expect(stdout).toContain('overridden')
  })

  it('no claim supplied → advisory warning only (back-compat: the gate is unarmed, not failed)', async () => {
    const { code, stderr } = await runCli(['checkpoint', 'complete', 'task-test'])
    expect(code).toBe(0)
    expect(stderr).toContain('completion promise')
    expect(stderr).not.toContain('BLOCKED')
  })
})

// ── D-4 boundary ──────────────────────────────────────────────────────────────
describe('D-4 — the tdd-evidence.md done-criterion carries a boundary', () => {
  const withEvidence = () =>
    vi.mocked(checkArtifacts).mockResolvedValue({
      status: 'verified',
      found: [{ path: '/proj/.planning/phases/52-x/tdd-evidence.md', sha256: 'a'.repeat(64) }],
      missing: [],
    })

  it('a blocking boundary finding fails the completion closed', async () => {
    withEvidence()
    vi.mocked(checkTddBoundary).mockResolvedValue([
      {
        id: 'test-file-deleted',
        kind: 'block',
        message: 'test file deleted: tests/widget.test.ts',
      },
    ])
    const { code, stderr } = await runCli([
      'checkpoint',
      'complete',
      'task-test',
      '--result',
      '<promise>COMPLETE</promise>',
    ])
    expect(code).toBe(1)
    expect(stderr).toContain('BLOCKED')
    expect(stderr).toContain('tests/widget.test.ts')
    expect(completePhase).not.toHaveBeenCalled()
  })

  it('a warn-only boundary finding prints but never blocks (delivery-gate:28 convention)', async () => {
    withEvidence()
    vi.mocked(checkTddBoundary).mockResolvedValue([
      { id: 'assertions-weakened', kind: 'warn', message: 'assertion count dropped 5 → 2' },
    ])
    const { code, stderr } = await runCli([
      'checkpoint',
      'complete',
      'task-test',
      '--result',
      '<promise>COMPLETE</promise>',
    ])
    expect(code).toBe(0)
    expect(stderr).toContain('assertion count dropped')
    expect(stderr).not.toContain('BLOCKED')
  })

  it('is not invoked when the sub declares no tdd-evidence.md (surgical scope)', async () => {
    vi.mocked(checkArtifacts).mockResolvedValue({
      status: 'verified',
      found: [{ path: '/proj/findings.md', sha256: 'b'.repeat(64) }],
      missing: [],
    })
    await runCli(['checkpoint', 'complete', 'discuss-phase'])
    expect(checkTddBoundary).not.toHaveBeenCalled()
  })
})

// ── D-2 budget + D-3 plateau ──────────────────────────────────────────────────
describe('D-2 — the iteration budget is executed against the ledger counter', () => {
  it('emits a BUDGET-EXHAUSTED breadcrumb once fail_count reaches the sub budget', async () => {
    // workflows/defaults.yaml ralph_max_iterations.task-test.01-test = 15
    vi.mocked(readCurrentWorkflow).mockResolvedValue(
      ledgerOf([{ sub: 'task-test', status: 'failed', gate_fired: true, fail_count: 15 }]),
    )
    const { code, stderr } = await runCli(['checkpoint', 'fail', 'task-test'])
    expect(code).toBe(1)
    expect(stderr).toContain('BUDGET-EXHAUSTED')
    expect(stderr).toContain('15')
    expect(stderr).toMatch(/do not spawn|stop spawning/i)
  })

  it('stays silent below the budget', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue(
      ledgerOf([{ sub: 'task-test', status: 'failed', gate_fired: true, fail_count: 4 }]),
    )
    const { stderr } = await runCli(['checkpoint', 'fail', 'task-test'])
    expect(stderr).not.toContain('BUDGET-EXHAUSTED')
  })
})

describe('D-3 — no-progress damping on the fail path', () => {
  it('a repeated failing-test count reaching the plateau threshold emits NO-PROGRESS', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue(
      ledgerOf([
        {
          sub: 'task-test',
          status: 'failed',
          gate_fired: true,
          fail_count: 2,
          progress: { metric: 'failing_tests', failing_tests: 5, stale_count: 1 },
        },
      ]),
    )
    const { stderr } = await runCli(['checkpoint', 'fail', 'task-test', '--failing-tests', '5'])
    expect(stderr).toContain('NO-PROGRESS')
    expect(stderr).toContain('failing_tests')
  })

  it('a dropping failing-test count resets the counter — no NO-PROGRESS', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue(
      ledgerOf([
        {
          sub: 'task-test',
          status: 'failed',
          gate_fired: true,
          fail_count: 2,
          progress: { metric: 'failing_tests', failing_tests: 5, stale_count: 1 },
        },
      ]),
    )
    const { stderr } = await runCli(['checkpoint', 'fail', 'task-test', '--failing-tests', '2'])
    expect(stderr).not.toContain('NO-PROGRESS')
  })

  it('no measurable metric → no damping at all (fail-open)', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue(
      ledgerOf([{ sub: 'task-test', status: 'failed', gate_fired: true, fail_count: 2 }]),
    )
    const { stderr } = await runCli(['checkpoint', 'fail', 'task-test'])
    expect(stderr).not.toContain('NO-PROGRESS')
  })
})
