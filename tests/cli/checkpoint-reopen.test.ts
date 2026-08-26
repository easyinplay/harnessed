// `harnessed checkpoint reopen <sub> --reason` CLI wiring (TDD red-first).
//
// 4.38.0 — the edge verify never had. `checkpoint fail` three stopping reasons
// are all STOP (BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP); none of them means
// "this came back wrong, do it again", so what happens after a verify rejection
// was carried by SKILL.md prose only. comet shipped the same edge as
// `--return-to-shape` (accepted only from Verify/Archive).
//
// NOT named `reject`: `harnessed reject <sub>` already exists and means the
// OPPOSITE — a terminal decline that deliberately does not touch fail_count
// (see currentWorkflow.v1.ts). Rework counts against the budget; abandonment
// does not.

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/task.json' })),
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
}))
vi.mock('../../src/checkpoint/scale.js', () => ({
  collectScaleMetrics: vi.fn(async () => ({ changedFiles: 0, firedSubs: 0, requirements: 0 })),
  assessScale: vi.fn(() => 'light' as const),
}))

import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import {
  mutateSubProgress,
  readCurrentWorkflow,
  writeCurrentWorkflow,
} from '../../src/checkpoint/state.js'
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
  }
  return { code, stdout, stderr }
}

const LEDGER = (over: Partial<SubProgressEntryType> = {}): SubProgressEntryType[] => [
  { sub: 'impl', status: 'done', gate_fired: true, fail_count: 0, attempt_budget: 20, ...over },
  { sub: 'verify', status: 'pending', gate_fired: true },
]

// The mocked ledger APPLIES its mutator — `reopen` reads the ledger back after
// writing (same shape as `fail`) to source the attempt counters, so a no-op mock
// would silently test the pre-mutation state.
let ledger: SubProgressEntryType[] = []

const seed = (entries: SubProgressEntryType[], status: 'active' | 'complete' = 'complete') => {
  ledger = entries
  vi.mocked(readCurrentWorkflow).mockImplementation(
    async () =>
      ({
        schemaVersion: 1,
        phase: 'task',
        status,
        last_checkpoint_path: null,
        started_at: '2026-08-26T00:00:00.000Z',
        sub_progress: ledger,
        // biome-ignore lint/suspicious/noExplicitAny: test fixture; schema shape asserted elsewhere
      }) as any,
  )
  vi.mocked(mutateSubProgress).mockImplementation(async (fn) => {
    ledger = fn(ledger)
  })
}

describe('checkpoint reopen', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('cell 1 — reopens a done sub, exit 0, ledger mutated', async () => {
    seed(LEDGER())
    const r = await runCli(['checkpoint', 'reopen', 'impl', '--reason', 'verify: 缺回归测试'])
    expect(r.code).toBe(0)
    expect(mutateSubProgress).toHaveBeenCalledTimes(1)
    expect(r.stdout).toContain('impl')
    const e = ledger.find((x) => x.sub === 'impl')
    expect(e?.status).toBe('pending')
    expect(e?.fail_count).toBe(1)
    expect(e?.reason).toBe('verify: 缺回归测试')
  })

  it('cell 2 — --reason is required (a rework order with no reason is not one)', async () => {
    seed(LEDGER())
    const r = await runCli(['checkpoint', 'reopen', 'impl'])
    expect(r.code).not.toBe(0)
    expect(mutateSubProgress).not.toHaveBeenCalled()
  })

  it('cell 3 — a COMPLETE workflow is flipped back to active (verify runs after the chain closed)', async () => {
    seed(LEDGER(), 'complete')
    await runCli(['checkpoint', 'reopen', 'impl', '--reason', 'r'])
    expect(writeCurrentWorkflow).toHaveBeenCalledTimes(1)
    expect(vi.mocked(writeCurrentWorkflow).mock.calls[0]?.[0]).toMatchObject({ status: 'active' })
  })

  it('cell 4 — an already-active workflow is not rewritten', async () => {
    seed(LEDGER(), 'active')
    await runCli(['checkpoint', 'reopen', 'impl', '--reason', 'r'])
    expect(writeCurrentWorkflow).not.toHaveBeenCalled()
  })

  it('cell 5 — unknown sub → exit 1, no mutation', async () => {
    seed(LEDGER())
    const r = await runCli(['checkpoint', 'reopen', 'nope', '--reason', 'r'])
    expect(r.code).toBe(1)
    expect(mutateSubProgress).not.toHaveBeenCalled()
    expect(r.stderr).toMatch(/not found/i)
  })

  it('cell 6 — an already-pending sub → exit 1, no mutation', async () => {
    seed(LEDGER())
    const r = await runCli(['checkpoint', 'reopen', 'verify', '--reason', 'r'])
    expect(r.code).toBe(1)
    expect(mutateSubProgress).not.toHaveBeenCalled()
  })

  it('cell 7 — no active workflow → exit 1, no mutation', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue(null)
    const r = await runCli(['checkpoint', 'reopen', 'impl', '--reason', 'r'])
    expect(r.code).toBe(1)
    expect(mutateSubProgress).not.toHaveBeenCalled()
  })

  it('cell 8 — reopening past the attempt budget still reopens, but says BUDGET-EXHAUSTED', async () => {
    seed(LEDGER({ fail_count: 19, attempt_budget: 20 }))
    const r = await runCli(['checkpoint', 'reopen', 'impl', '--reason', 'r'])
    expect(r.code).toBe(0)
    expect(mutateSubProgress).toHaveBeenCalledTimes(1)
    expect(r.stderr).toContain('BUDGET-EXHAUSTED')
  })
})
