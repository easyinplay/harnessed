// 4.26.0 (A3, intel 候选 P1) — serial-order guard integration tests for the
// `harnessed checkpoint complete|fail` paths (comet 0.3.9 phase-skip lesson:
// prose gates don't stop sequence jumps; enforcement must be script-level on
// every transition).
//
// Pattern: mirrors tests/checkpoint/checkpoint-complete-planning.test.ts
// (vi.mock modules + runCli helper). state.js readCurrentWorkflow is mocked to
// serve a ledger WITH mode/order fields (the 4.26.0 seeding shape); ledger.js
// stays REAL so findSerialBlockers is exercised end-to-end.

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/path/verify.json' })),
  completePhase: vi.fn(async () => undefined),
}))

vi.mock('../../src/checkpoint/evidence.js', () => ({
  checkArtifacts: vi.fn(async () => ({ status: 'none_declared', found: [], missing: [] })),
  checkPlanningSync: vi.fn(async () => ({ status: 'verified', missing: [] })),
}))

vi.mock('../../src/checkpoint/state.js', () => ({
  mutateSubProgress: vi.fn(async () => undefined),
  mutateStore: vi.fn(async () => undefined),
  readCurrentWorkflow: vi.fn(async () => null),
  writeCurrentWorkflow: vi.fn(async () => undefined),
}))

vi.mock('../../src/checkpoint/scale.js', () => ({
  collectScaleMetrics: vi.fn(async () => ({ changedFiles: 0, firedSubs: 0, requirements: 0 })),
  assessScale: vi.fn(() => 'light' as const),
}))

import { completePhase } from '../../src/checkpoint/engineHook.js'
import { buildWorkflowStateBlock } from '../../src/checkpoint/injectState.js'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { readCurrentWorkflow } from '../../src/checkpoint/state.js'
import { registerCheckpoint } from '../../src/cli/checkpoint.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

interface CliResult {
  code: number
  stdout: string
  stderr: string
}

async function runCli(argv: string[]): Promise<CliResult> {
  let stdout = ''
  let stderr = ''
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    stdout += `${args.map(String).join(' ')}\n`
  })
  const warn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    stderr += `${args.map(String).join(' ')}\n`
  })
  const err = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    stderr += `${args.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerCheckpoint(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) {
      code = e.code
    } else {
      code = 1
      stderr += `${(e as Error).message}\n`
    }
  } finally {
    exit.mockRestore()
    log.mockRestore()
    warn.mockRestore()
    err.mockRestore()
  }
  return { code, stdout, stderr }
}

/** verify-master shaped envelope: serial(1) progress pending → parallel
 *  code-review/paranoid → serial(99) simplify. */
function verifyWf(progressStatus: 'pending' | 'done' = 'pending'): CurrentWorkflowV1Type {
  return {
    schemaVersion: 'harnessed.current-workflow.v1',
    phase: 'verify',
    status: 'active',
    last_checkpoint_path: null,
    started_at: '2026-07-12T00:00:00.000Z',
    sub_progress: [
      { sub: 'progress', status: progressStatus, gate_fired: true, mode: 'serial', order: 1 },
      { sub: 'code-review', status: 'pending', gate_fired: true, mode: 'parallel' },
      { sub: 'paranoid', status: 'pending', gate_fired: true, mode: 'parallel' },
      { sub: 'simplify', status: 'pending', gate_fired: true, mode: 'serial', order: 99 },
    ],
  } as CurrentWorkflowV1Type
}

describe('checkpoint complete/fail — serial-order guard (4.26.0 A3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('blocks complete of a parallel sub while the serial predecessor is pending', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue(verifyWf('pending'))
    const { code, stderr } = await runCli(['checkpoint', 'complete', 'code-review'])
    expect(code).toBe(1)
    expect(completePhase).not.toHaveBeenCalled()
    expect(stderr).toContain('BLOCKED')
    expect(stderr).toContain('serial-order guard')
    expect(stderr).toContain('progress')
  })

  it('blocks fail of a parallel sub while the serial predecessor is pending', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue(verifyWf('pending'))
    const { code, stderr } = await runCli(['checkpoint', 'fail', 'paranoid'])
    expect(code).toBe(1)
    expect(completePhase).not.toHaveBeenCalled()
    expect(stderr).toContain('BLOCKED')
    expect(stderr).toContain('progress')
  })

  it('blocks the serial tail while parallel predecessors are pending', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue(verifyWf('done'))
    const { code, stderr } = await runCli(['checkpoint', 'complete', 'simplify'])
    expect(code).toBe(1)
    expect(stderr).toContain('code-review')
    expect(stderr).toContain('paranoid')
  })

  it('allows parallel subs to complete in any order once the serial head is done', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue(verifyWf('done'))
    const { code, stderr } = await runCli(['checkpoint', 'complete', 'paranoid'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    expect(stderr).not.toContain('BLOCKED')
  })

  it('--force overrides the guard and prints an explicit override note', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue(verifyWf('pending'))
    const { code, stdout, stderr } = await runCli([
      'checkpoint',
      'complete',
      'code-review',
      '--force',
    ])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    expect(`${stdout}${stderr}`).toMatch(/serial-order guard overridden/i)
  })

  it('no-ops on a pre-4.26.0 ledger without mode fields (back-compat)', async () => {
    const wf = verifyWf('pending')
    wf.sub_progress = (wf.sub_progress ?? []).map(({ mode: _m, order: _o, ...rest }) => rest)
    vi.mocked(readCurrentWorkflow).mockResolvedValue(wf)
    const { code } = await runCli(['checkpoint', 'complete', 'code-review'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
  })

  it('fail-soft: a guard-internal error warns and proceeds (runtime fault, not config)', async () => {
    vi.mocked(readCurrentWorkflow)
      .mockRejectedValueOnce(new Error('state store unreadable'))
      .mockResolvedValue(verifyWf('pending'))
    const { code, stderr } = await runCli(['checkpoint', 'complete', 'code-review'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    expect(stderr).toContain('serial-order guard skipped')
  })
})

describe('injectState compat — ledger entries carrying mode/order (4.26.0)', () => {
  it('buildWorkflowStateBlock renders a mode/order-carrying ledger unchanged', () => {
    const wf = verifyWf('pending')
    const block = buildWorkflowStateBlock(wf)
    expect(block).toContain('<workflow-state>')
    expect(block).toContain('next: progress')
  })
})
