// `harnessed checkpoint` CLI unit tests (TDD red-first).
//
// Single `checkpoint <action> <sub>` command; action ∈ {start, complete, fail}.
// Sister pattern: tests/cli/run.test.ts (ExitError + runCli helper, vi.mock module).
// engineHook.js fully mocked so we assert CLI→hook call args WITHOUT touching the
// real filesystem or Date (engineHook uses new Date().toISOString() in prod).

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/path/task-code.json' })),
  completePhase: vi.fn(async () => undefined),
}))

import { activatePhase, completePhase } from '../../src/checkpoint/engineHook.js'
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
    err.mockRestore()
  }
  return { code, stdout, stderr }
}

describe('cli/checkpoint — start/complete/fail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(activatePhase).mockResolvedValue({ checkpointPath: '/fake/path/task-code.json' })
    vi.mocked(completePhase).mockResolvedValue(undefined)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers `checkpoint` subcommand on Command instance', () => {
    const program = new Command()
    registerCheckpoint(program)
    const names = program.commands.map((c) => c.name())
    expect(names).toContain('checkpoint')
  })

  it('cell 1 — start task-code → activatePhase("task-code"), exit 0, stdout has path', async () => {
    const { code, stdout } = await runCli(['checkpoint', 'start', 'task-code'])
    expect(code).toBe(0)
    expect(activatePhase).toHaveBeenCalledTimes(1)
    expect(activatePhase).toHaveBeenCalledWith('task-code')
    expect(completePhase).not.toHaveBeenCalled()
    expect(stdout).toContain('/fake/path/task-code.json')
  })

  it('cell 2 — complete task-code --summary "done X" → completePhase with lastTask "done X", exit 0', async () => {
    const { code } = await runCli(['checkpoint', 'complete', 'task-code', '--summary', 'done X'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    expect(completePhase).toHaveBeenCalledWith({
      phaseId: 'task-code',
      status: 'complete',
      lastTask: 'done X',
    })
    expect(activatePhase).not.toHaveBeenCalled()
  })

  it('cell 3 — complete task-code (no summary) → completePhase with default lastTask, exit 0', async () => {
    const { code } = await runCli(['checkpoint', 'complete', 'task-code'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    expect(completePhase).toHaveBeenCalledWith({
      phaseId: 'task-code',
      status: 'complete',
      lastTask: 'phase task-code complete',
    })
  })

  it('cell 4 — fail task-code --summary "boom" → lastTask "FAILED: boom", exit 1, stderr note', async () => {
    const { code, stderr } = await runCli(['checkpoint', 'fail', 'task-code', '--summary', 'boom'])
    expect(code).toBe(1)
    expect(completePhase).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(completePhase).mock.calls[0]?.[0]
    expect(arg?.phaseId).toBe('task-code')
    expect(arg?.status).toBe('complete')
    expect(arg?.lastTask).toContain('FAILED')
    expect(arg?.lastTask).toContain('boom')
    expect(stderr.length).toBeGreaterThan(0)
  })

  it('cell 5 — badaction task-code → exit 1 (invalid action), neither hook called', async () => {
    const { code } = await runCli(['checkpoint', 'badaction', 'task-code'])
    expect(code).toBe(1)
    expect(activatePhase).not.toHaveBeenCalled()
    expect(completePhase).not.toHaveBeenCalled()
  })

  it('cell 6 — start then complete sequence → both hooks called', async () => {
    const r1 = await runCli(['checkpoint', 'start', 'task-code'])
    expect(r1.code).toBe(0)
    expect(activatePhase).toHaveBeenCalledTimes(1)
    const r2 = await runCli(['checkpoint', 'complete', 'task-code', '--summary', 'done'])
    expect(r2.code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
  })
})
