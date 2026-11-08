// Phase 86 — `harnessed checkpoint complete --wait <seconds>` — the BOUNDED wait
// on the result artifact.
//
// The completion signal is the artifact the sub was told to write, not the chat
// notification: under claude-code's agent-teams mode a re-parented teammate's
// completion message never reaches the orchestrator (open-gsd/gsd-core#1355).
// So the orchestrator polls the file — with the SAME predicate the promise gate
// uses — and a timeout must fail CLOSED (exit 1, ledger stays pending) instead of
// hanging forever.
//
// The gates are mocked (state / evidence / engineHook / scale) so these stay pure
// unit tests: the real completionClaim predicate and the real ledger mark run.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockState = vi.hoisted(() => ({
  ledger: [] as Array<Record<string, unknown>>,
  marked: [] as Array<Record<string, unknown>>,
}))

vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/path/task-code.json' })),
  completePhase: vi.fn(async () => undefined),
}))

vi.mock('../../src/checkpoint/evidence.js', () => ({
  checkArtifacts: vi.fn(async () => ({ status: 'none_declared', found: [], missing: [] })),
  checkPlanningSync: vi.fn(async () => ({ status: 'verified', missing: [] })),
}))

vi.mock('../../src/checkpoint/state.js', () => ({
  mutateSubProgress: vi.fn(async (fn: (e: Array<Record<string, unknown>>) => unknown) => {
    mockState.marked = fn(mockState.ledger) as Array<Record<string, unknown>>
  }),
  mutateWorkflow: vi.fn(async () => undefined),
  mutateStore: vi.fn(async () => undefined),
  readCurrentWorkflow: vi.fn(async () => ({
    schemaVersion: '1.0.0',
    phase: 'task',
    status: 'active',
    last_checkpoint_path: null,
    started_at: '2026-06-05T00:00:00.000Z',
    sub_progress: mockState.ledger,
  })),
  writeCurrentWorkflow: vi.fn(async () => undefined),
}))

vi.mock('../../src/checkpoint/scale.js', () => ({
  collectScaleMetrics: vi.fn(async () => ({ changedFiles: 0, firedSubs: 0, requirements: 0 })),
  assessScale: vi.fn(() => 'light' as const),
}))

import { completePhase } from '../../src/checkpoint/engineHook.js'
import { mutateSubProgress } from '../../src/checkpoint/state.js'
import { registerCheckpoint } from '../../src/cli/checkpoint.js'
import { captureRunDeps, ExitError } from '../../src/platform/runDeps.js'

class CliExitError extends Error {
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
    throw new CliExitError(typeof code === 'number' ? code : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    stdout += `${args.map(String).join(' ')}\n`
  })
  const err = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    stderr += `${args.map(String).join(' ')}\n`
  })
  const warn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    stderr += `${args.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerCheckpoint(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof CliExitError) {
      code = e.code
    } else {
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

let dir: string

beforeEach(() => {
  vi.clearAllMocks()
  dir = mkdtempSync(join(tmpdir(), 'harnessed-wait-'))
  mockState.ledger = [{ sub: 'task-code', status: 'pending', gate_fired: true }]
  mockState.marked = []
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

/** A result file that satisfies the promise gate. */
function writeComplete(path: string): void {
  writeFileSync(path, 'the work is done\n<promise>COMPLETE</promise>\n', 'utf8')
}

describe('checkpoint complete --wait — the happy path', () => {
  it('a result file that already carries the marker completes the sub', async () => {
    const resultFile = join(dir, 'result.md')
    writeComplete(resultFile)
    const { code } = await runCli([
      'checkpoint',
      'complete',
      'task-code',
      '--result-file',
      resultFile,
      '--wait',
      '5',
    ])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    expect(mockState.marked[0]?.status).toBe('done')
  })

  it('a file that appears LATE with the marker still completes the sub', async () => {
    const resultFile = join(dir, 'late.md')
    const { deps } = captureRunDeps()
    const pending = (async () => {
      await new Promise((r) => setTimeout(r, 120))
      writeComplete(resultFile)
    })()
    const run = (async () => {
      const { runCheckpointComplete } = await import('../../src/cli/checkpoint.js')
      try {
        await runCheckpointComplete('task-code', { resultFile, wait: 5, waitPollMs: 20 }, deps)
      } catch (e) {
        // The deps seam exits by THROWING — that is the success path here.
        if (!(e instanceof ExitError)) throw e
        expect(e.code).toBe(0)
      }
    })()
    await Promise.all([pending, run])
    expect(mockState.marked[0]?.status).toBe('done')
    expect(mockState.marked[0]?.completion_claim).toBe('complete')
  })
})

describe('checkpoint complete --wait — the timeout fails closed', () => {
  it('a file that never carries the marker → exit 1 and result-wait-timeout', async () => {
    const resultFile = join(dir, 'empty.md')
    writeFileSync(resultFile, 'still working\n', 'utf8')
    const { code, stderr } = await runCli([
      'checkpoint',
      'complete',
      'task-code',
      '--result-file',
      resultFile,
      '--wait',
      '1',
    ])
    expect(code).toBe(1)
    expect(stderr).toContain('result-wait-timeout')
    // the waited path and the waited seconds are on the record
    expect(stderr).toContain(resultFile)
    expect(stderr).toContain('1s')
  })

  it('a file that never appears → exit 1 and result-wait-timeout', async () => {
    const resultFile = join(dir, 'never.md')
    const { code, stderr } = await runCli([
      'checkpoint',
      'complete',
      'task-code',
      '--result-file',
      resultFile,
      '--wait',
      '1',
    ])
    expect(code).toBe(1)
    expect(stderr).toContain('result-wait-timeout')
  })

  it('the ledger entry stays pending — no done flip on timeout', async () => {
    const resultFile = join(dir, 'empty2.md')
    writeFileSync(resultFile, 'still working\n', 'utf8')
    await runCli([
      'checkpoint',
      'complete',
      'task-code',
      '--result-file',
      resultFile,
      '--wait',
      '1',
    ])
    expect(mutateSubProgress).not.toHaveBeenCalled()
    expect(completePhase).not.toHaveBeenCalled()
  })

  it('--force records the timeout as an audited override', async () => {
    const resultFile = join(dir, 'empty3.md')
    writeFileSync(resultFile, 'still working\n', 'utf8')
    const { code, stderr } = await runCli([
      'checkpoint',
      'complete',
      'task-code',
      '--result-file',
      resultFile,
      '--wait',
      '1',
      '--force',
    ])
    expect(code).toBe(0)
    expect(stderr).toContain('result-wait-timeout')
    expect(mockState.marked[0]?.status).toBe('done')
    expect(mockState.marked[0]?.evidence_status).toBe('overridden')
  })
})

describe('checkpoint complete --wait — parameter errors', () => {
  it('--wait 0 behaves like the pre-Phase-86 path (no waiting)', async () => {
    const resultFile = join(dir, 'ready.md')
    writeComplete(resultFile)
    const started = Date.now()
    const { code } = await runCli([
      'checkpoint',
      'complete',
      'task-code',
      '--result-file',
      resultFile,
      '--wait',
      '0',
    ])
    expect(code).toBe(0)
    expect(Date.now() - started).toBeLessThan(1500)
  })

  it('--wait 0 with a marker-less file is still blocked by the promise gate', async () => {
    const resultFile = join(dir, 'nomarker.md')
    writeFileSync(resultFile, 'no marker here\n', 'utf8')
    const { code, stderr } = await runCli([
      'checkpoint',
      'complete',
      'task-code',
      '--result-file',
      resultFile,
      '--wait',
      '0',
    ])
    expect(code).toBe(1)
    expect(stderr).toContain('completion promise not met')
    expect(stderr).not.toContain('result-wait-timeout')
  })

  it('a non-integer --wait → exit 2', async () => {
    const { code, stderr } = await runCli([
      'checkpoint',
      'complete',
      'task-code',
      '--result-file',
      join(dir, 'x.md'),
      '--wait',
      'abc',
    ])
    expect(code).toBe(2)
    expect(stderr).toContain('--wait')
  })

  it('a fractional --wait → exit 2', async () => {
    const { code } = await runCli([
      'checkpoint',
      'complete',
      'task-code',
      '--result-file',
      join(dir, 'x.md'),
      '--wait',
      '1.5',
    ])
    expect(code).toBe(2)
  })

  it('a negative --wait → exit 2', async () => {
    const { code } = await runCli([
      'checkpoint',
      'complete',
      'task-code',
      '--result-file',
      join(dir, 'x.md'),
      '--wait',
      '-1',
    ])
    expect(code).toBe(2)
  })

  it('--wait above the 600s cap → exit 2', async () => {
    const { code } = await runCli([
      'checkpoint',
      'complete',
      'task-code',
      '--result-file',
      join(dir, 'x.md'),
      '--wait',
      '601',
    ])
    expect(code).toBe(2)
  })

  it('--wait without --result-file → exit 2', async () => {
    const { code, stderr } = await runCli(['checkpoint', 'complete', 'task-code', '--wait', '5'])
    expect(code).toBe(2)
    expect(stderr).toContain('--result-file')
  })
})
