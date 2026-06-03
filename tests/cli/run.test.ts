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

import { _resetAutoChainCache, getNextHint, registerRun } from '../../src/cli/run.js'
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

  it('cell 12b — --skip-sub clarify,test → gateContext.skip_subs array (v3.9.26 Option A)', async () => {
    await runCli(['run', 'task', '--task', 'do X', '--skip-sub', 'clarify,test'])
    const calls = vi.mocked(runWorkflow).mock.calls
    const [, , opts] = calls[0] ?? []
    expect(opts?.gateContext?.skip_subs).toEqual(['clarify', 'test'])
  })

  it('cell 12c — no --skip-sub → gateContext.skip_subs absent', async () => {
    await runCli(['run', 'task', '--task', 'do X'])
    const calls = vi.mocked(runWorkflow).mock.calls
    const [, , opts] = calls[0] ?? []
    expect(opts?.gateContext?.skip_subs).toBeUndefined()
  })

  it('cell 13 — runWorkflow returns { status: "failed" } → exit 1', async () => {
    vi.mocked(runWorkflow).mockResolvedValue({ status: 'failed', phasesRun: 1 })
    const { code } = await runCli(['run', 'verify-paranoid'])
    expect(code).toBe(1)
  })

  it('cell 14 — runWorkflow returns { status: "complete" } → exit 0 + stderr `[stage X complete]` + Phase 5 next-stage envelope', async () => {
    vi.mocked(runWorkflow).mockResolvedValue({ status: 'complete', phasesRun: 1 })
    _resetAutoChainCache() // cold cache so cell loads chain fresh
    const { code, stderr } = await runCli(['run', 'verify-paranoid'])
    expect(code).toBe(0)
    expect(stderr).toContain('[stage verify-paranoid complete]')
    // Phase 5 — parent-stage fallback emits next-stage envelope for 'verify-paranoid'
    // (parent 'verify' → next 'retro').
    expect(stderr).toContain('Next stage: harnessed run retro')
    expect(stderr).toContain('(In Claude Code: /retro)')
  })

  it('cell 15 — runWorkflow throws → exit 1 + stderr "runtime failed"', async () => {
    vi.mocked(runWorkflow).mockRejectedValue(new Error('boom'))
    const { code, stderr } = await runCli(['run', 'verify-paranoid'])
    expect(code).toBe(1)
    expect(stderr).toMatch(/runtime failed/)
    expect(stderr).toContain('boom')
  })
})

describe('getNextHint — Phase 5 real impl', () => {
  beforeEach(() => {
    _resetAutoChainCache() // cold cache each fixture
  })

  it('cell 16 — direct hit: getNextHint("discuss") → "plan"', async () => {
    expect(await getNextHint('discuss')).toBe('plan')
  })

  it('cell 17 — direct hit chain coverage (research→discuss, plan→task, task→verify, verify→retro)', async () => {
    expect(await getNextHint('research')).toBe('discuss')
    expect(await getNextHint('plan')).toBe('task')
    expect(await getNextHint('task')).toBe('verify')
    expect(await getNextHint('verify')).toBe('retro')
  })

  it('cell 18 — last stage: getNextHint("retro") → null', async () => {
    expect(await getNextHint('retro')).toBe(null)
  })

  it('cell 19 — super-master: getNextHint("auto") → null', async () => {
    expect(await getNextHint('auto')).toBe(null)
  })

  it('cell 20 — parent-stage fallback: verify-paranoid → retro, discuss-strategic → plan, task-clarify → verify, plan-architecture → task', async () => {
    expect(await getNextHint('verify-paranoid')).toBe('retro')
    expect(await getNextHint('discuss-strategic')).toBe('plan')
    expect(await getNextHint('task-clarify')).toBe('verify')
    expect(await getNextHint('plan-architecture')).toBe('task')
  })

  it('cell 21 — unresolvable name → null', async () => {
    expect(await getNextHint('totally-unknown-name')).toBe(null)
    expect(await getNextHint('xyz')).toBe(null) // no dash, not in chain
  })

  it('cell 22 — cache verify: loadPhases called exactly once across 3 hint calls', async () => {
    const loadPhasesMod = await import('../../src/workflow/loadPhases.js')
    const spy = vi.spyOn(loadPhasesMod, 'loadPhases')
    await getNextHint('discuss')
    await getNextHint('verify')
    await getNextHint('task-clarify')
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  it('cell 23 — fail-soft: yaml read fail → null + stderr warn', async () => {
    const loadPhasesMod = await import('../../src/workflow/loadPhases.js')
    const spy = vi.spyOn(loadPhasesMod, 'loadPhases').mockImplementation(() => {
      throw new Error('ENOENT: yaml missing')
    })
    const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    const result = await getNextHint('discuss')
    expect(result).toBe(null)
    expect(stderrWrite).toHaveBeenCalledWith(
      expect.stringMatching(/⚠️ getNextHint failed \(ENOENT: yaml missing\); skipping hint/),
    )
    spy.mockRestore()
    stderrWrite.mockRestore()
  })
})
