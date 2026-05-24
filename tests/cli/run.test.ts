// v3.4.4 Phase 1 T1 — cli/run.ts unit tests (15 cells per PHASE-1-SPEC.md).
//
// Sister pattern: tests/cli/execute-task.test.ts (Pattern J mock + runCli helper).
// Covers registration / --list / name resolution (3-tier) / task input modes
// (flag / stdin / empty) / gateContext assembly / dry-run / failure / exception.

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock workflow runtime BEFORE registerRun import — captures runWorkflow calls.
vi.mock('../../src/workflow/run.js', () => ({
  runWorkflow: vi.fn(async () => ({ status: 'complete', phasesRun: 0 })),
}))

import { registerRun } from '../../src/cli/run.js'
import { runWorkflow } from '../../src/workflow/run.js'

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
  // stderr.write is the path run.ts uses for `[stage X complete]` line — capture.
  const stderrWrite = vi
    .spyOn(process.stderr, 'write')
    .mockImplementation((chunk: string | Uint8Array) => {
      stderr += typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk)
      return true
    })
  const program = new Command().exitOverride()
  registerRun(program)
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
    stderrWrite.mockRestore()
  }
  return { code, stdout, stderr }
}

describe('cli/run — 15 cells per v3.4.4 PHASE-1-SPEC.md', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock — completed workflow.
    vi.mocked(runWorkflow).mockResolvedValue({ status: 'complete', phasesRun: 0 })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('cell 1 — registers `run` subcommand on Command instance', () => {
    const program = new Command()
    registerRun(program)
    const names = program.commands.map((c) => c.name())
    expect(names).toContain('run')
    const cmd = program.commands.find((c) => c.name() === 'run')
    expect(cmd?.description()).toContain('workflow')
  })

  it('cell 2 — --list exits 0 + prints workflow names (one per line)', async () => {
    const { code, stdout } = await runCli(['run', '--list'])
    expect(code).toBe(0)
    expect(stdout).toContain('auto')
    expect(stdout).toContain('discuss')
    expect(stdout).toContain('verify-paranoid')
  })

  it('cell 3 — missing name (no --list) → exit 2 + usage error on stderr', async () => {
    const { code, stderr } = await runCli(['run'])
    expect(code).toBe(2)
    expect(stderr).toMatch(/workflow name required/)
  })

  it('cell 4 — unknown name → exit 2 + "not found" stderr', async () => {
    const { code, stderr } = await runCli(['run', 'nope-not-real'])
    expect(code).toBe(2)
    expect(stderr).toMatch(/not found/)
  })

  it('cell 5 — name resolution tier 1 (top-level standalone research)', async () => {
    await runCli(['run', 'research', '--dry-run'])
    // dry-run prints JSON envelope — verify yamlPath ends in research/workflow.yaml
    // (not via runWorkflow mock since dry-run short-circuits).
  })

  it('cell 5b — tier-1 resolution surfaces via dry-run JSON yamlPath', async () => {
    const { code, stdout } = await runCli(['run', 'research', '--dry-run'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed.workflow).toBe('research')
    expect(parsed.yamlPath.replace(/\\/g, '/')).toMatch(/workflows\/research\/workflow\.yaml$/)
  })

  it('cell 6 — name resolution tier 2 (stage-master discuss)', async () => {
    const { code, stdout } = await runCli(['run', 'discuss', '--dry-run'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed.yamlPath.replace(/\\/g, '/')).toMatch(/workflows\/discuss\/auto\/workflow\.yaml$/)
  })

  it('cell 7 — name resolution tier 3 (sub verify-paranoid)', async () => {
    const { code, stdout } = await runCli(['run', 'verify-paranoid', '--dry-run'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed.yamlPath.replace(/\\/g, '/')).toMatch(
      /workflows\/verify\/paranoid\/workflow\.yaml$/,
    )
  })

  it('cell 8 — --task "hello" → gateContext.task === "hello"', async () => {
    await runCli(['run', 'verify-paranoid', '--task', 'hello'])
    expect(runWorkflow).toHaveBeenCalledTimes(1)
    const calls = vi.mocked(runWorkflow).mock.calls
    const [, , opts] = calls[0] ?? []
    expect(opts?.gateContext?.task).toBe('hello')
  })

  it('cell 9 — --task-stdin reads stdin → gateContext.task === <piped text>', async () => {
    // Replace process.stdin async-iterator with a yielding mock for this cell.
    const originalStdin = process.stdin
    const fakeStdin = {
      [Symbol.asyncIterator]: async function* () {
        yield Buffer.from('piped requirement\n')
      },
    }
    Object.defineProperty(process, 'stdin', {
      configurable: true,
      get: () => fakeStdin,
    })
    try {
      await runCli(['run', 'verify-paranoid', '--task-stdin'])
      const calls = vi.mocked(runWorkflow).mock.calls
      const [, , opts] = calls[0] ?? []
      expect(opts?.gateContext?.task).toBe('piped requirement')
    } finally {
      Object.defineProperty(process, 'stdin', {
        configurable: true,
        get: () => originalStdin,
      })
    }
  })

  it('cell 10 — neither --task nor --task-stdin → gateContext.task === ""', async () => {
    await runCli(['run', 'verify-paranoid'])
    const calls = vi.mocked(runWorkflow).mock.calls
    const [, , opts] = calls[0] ?? []
    expect(opts?.gateContext?.task).toBe('')
  })

  it('cell 11 — --dry-run exits 0 + prints JSON envelope + does NOT call runWorkflow', async () => {
    const { code, stdout } = await runCli(['run', 'verify-paranoid', '--dry-run'])
    expect(code).toBe(0)
    expect(runWorkflow).not.toHaveBeenCalled()
    const parsed = JSON.parse(stdout)
    expect(parsed).toHaveProperty('workflow', 'verify-paranoid')
    expect(parsed).toHaveProperty('yamlPath')
    expect(parsed).toHaveProperty('gateContext')
  })

  it('cell 12 — --max-iterations 5 --model haiku --staged → gateContext carries all three', async () => {
    await runCli([
      'run',
      'verify-paranoid',
      '--max-iterations',
      '5',
      '--model',
      'haiku',
      '--staged',
    ])
    const calls = vi.mocked(runWorkflow).mock.calls
    const [, , opts] = calls[0] ?? []
    expect(opts?.gateContext?.maxIterations).toBe(5)
    expect(opts?.gateContext?.modelOverride).toBe('haiku')
    expect(opts?.gateContext?.staged).toBe(true)
  })

  it('cell 13 — runWorkflow returns { status: "failed" } → exit 1', async () => {
    vi.mocked(runWorkflow).mockResolvedValue({ status: 'failed', phasesRun: 1 })
    const { code } = await runCli(['run', 'verify-paranoid'])
    expect(code).toBe(1)
  })

  it('cell 14 — runWorkflow returns { status: "complete" } → exit 0 + stderr `[stage X complete]`', async () => {
    vi.mocked(runWorkflow).mockResolvedValue({ status: 'complete', phasesRun: 1 })
    const { code, stderr } = await runCli(['run', 'verify-paranoid'])
    expect(code).toBe(0)
    expect(stderr).toContain('[stage verify-paranoid complete]')
  })

  it('cell 15 — runWorkflow throws → exit 1 + stderr "runtime failed"', async () => {
    vi.mocked(runWorkflow).mockRejectedValue(new Error('boom'))
    const { code, stderr } = await runCli(['run', 'verify-paranoid'])
    expect(code).toBe(1)
    expect(stderr).toMatch(/runtime failed/)
    expect(stderr).toContain('boom')
  })
})
