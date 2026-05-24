// Phase 2.2 W5 T5.5 — cli/execute-task.ts unit tests (B-28 + F7 + KICKOFF § 1.2).
//
// v3.4.4 Phase 4 Commit 4 — REFACTORED per PHASE-4-SPEC.md L404-411 to mock
// `runWorkflow` at module boundary (sister tests/cli/run.test.ts L11-13 +
// tests/cli/research.test.ts L24-26 pattern) instead of the legacy
// @anthropic-ai/claude-agent-sdk + engine mock chain. K5 Option A
// `runBeforeCommitHook` + `node:child_process.execSync` mocks PRESERVED (cells
// 7+8+9 still exercise the pre-flight enforcement).
//
// 11 cells:
//   1. registers `execute-task` subcommand
//   3. missing --task → non-zero exit (commander requiredOption)
//   4. --dry-run --non-interactive → exit 0 + new JSON envelope shape
//      (workflow:string, yamlPath, gateContext.task) — replaces v2
//      {workflow, phases, taskCtx} shape
//   5. --model-tier inherit → gateContext.modelTierOverride === 'inherit'
//   6. invalid workflow path → exit 2 + stderr matches /workflow.yaml not found/
//   7. T3.5.W0.4 — apply path triggers runBeforeCommitHook (K5 Option A enforce)
//   8. T3.5.W0.4 — dry-run path NOT triggers runBeforeCommitHook (K5 separation)
//   9. v3.0.1 flip: apply-immediate default still wires through runBeforeCommitHook
//  10. Phase 4 NEW — runWorkflow called with yamlPath ending execute-task/workflow.yaml
//      (NOT phases.yaml — proves v3 yaml dispatch)
//  11. Phase 4 NEW — --max-iterations 5 forwards to gateContext.maxIterations === 5
//
// Pattern J — mock runWorkflow (Phase 4) + mock node:child_process.execSync +
// runBeforeCommitHook (K5 Option A regression preserved).

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock workflow runtime BEFORE registerExecuteTask import — captures runWorkflow calls.
vi.mock('../../src/workflow/run.js', () => ({
  runWorkflow: vi.fn(async () => ({ status: 'complete', phasesRun: 0 })),
}))

// T3.5.W0.4 — mock before-commit hook + execSync (apply path verify);
// dry-run path NOT triggers — proves K5 Option A clean separation.
const runBeforeCommitHookMock = vi.fn<() => Promise<void>>()
vi.mock('../../src/discipline/enforcement/before-commit.js', () => ({
  runBeforeCommitHook: (_ctx: unknown): Promise<void> => runBeforeCommitHookMock(),
}))
vi.mock('node:child_process', () => ({
  execSync: vi.fn(() => 'M  src/foo.ts\n'),
}))

import { registerExecuteTask } from '../../src/cli/execute-task.js'
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
  const program = new Command().exitOverride()
  registerExecuteTask(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) {
      code = e.code
    } else {
      // commander.exitOverride throws CommanderError for usage; commander code is 1
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

describe('cli/execute-task', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    runBeforeCommitHookMock.mockReset()
    runBeforeCommitHookMock.mockResolvedValue(undefined)
    vi.mocked(runWorkflow).mockResolvedValue({ status: 'complete', phasesRun: 0 })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('1. registers `execute-task` subcommand', () => {
    const program = new Command()
    registerExecuteTask(program)
    const cmd = program.commands.find((c) => c.name() === 'execute-task')
    expect(cmd).toBeDefined()
    expect(cmd?.description()).toContain('execute-task workflow')
  })

  it('3. missing --task → non-zero exit (commander requiredOption)', async () => {
    const { code } = await runCli(['execute-task'])
    // commander requiredOption throws CommanderError before action — caught as code=1
    expect(code).not.toBe(0)
  })

  it('4. --dry-run --non-interactive → exit 0 + JSON envelope (workflow, yamlPath, gateContext)', async () => {
    const { code, stdout } = await runCli([
      'execute-task',
      '--task',
      'implement auth',
      '--dry-run',
      '--non-interactive',
    ])
    expect(code).toBe(0)
    expect(runWorkflow).not.toHaveBeenCalled()
    const parsed = JSON.parse(stdout)
    // Phase 4 — new dry-run shape per PHASE-4-SPEC.md L227 / L406:
    //   workflow is the subcommand-resolved string (not yaml-parsed object)
    //   yamlPath ends with workflows/execute-task/workflow.yaml
    //   gateContext.task === '--task' value
    expect(parsed.workflow).toBe('execute-task')
    expect(parsed.yamlPath).toBeDefined()
    expect(parsed.yamlPath.replace(/\\/g, '/')).toMatch(/workflows\/execute-task\/workflow\.yaml$/)
    expect(parsed.gateContext).toBeDefined()
    expect(parsed.gateContext.task).toBe('implement auth')
  })

  it('5. --model-tier inherit → gateContext.modelTierOverride === "inherit" (B-10 escape hatch)', async () => {
    const { code, stdout } = await runCli([
      'execute-task',
      '--task',
      'x',
      '--dry-run',
      '--non-interactive',
      '--model-tier',
      'inherit',
    ])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed.gateContext.modelTierOverride).toBe('inherit')
  })

  it('6. invalid workflow path → exit 2 + stderr matches /workflow.yaml not found/', async () => {
    const { code, stderr } = await runCli([
      'execute-task',
      '--task',
      'x',
      '--dry-run',
      '--non-interactive',
      '--workflow',
      'nonexistent-workflow-xyz',
    ])
    expect(code).toBe(2)
    expect(stderr).toMatch(/workflow\.yaml not found/)
  })

  it('7. T3.5.W0.4 — apply path triggers runBeforeCommitHook (K5 Option A enforce)', async () => {
    await runCli(['execute-task', '--task', 'implement auth', '--non-interactive'])
    expect(runBeforeCommitHookMock).toHaveBeenCalledTimes(1)
  })

  it('8. T3.5.W0.4 — --dry-run path NOT triggers runBeforeCommitHook (K5 separation)', async () => {
    await runCli(['execute-task', '--task', 'preview', '--dry-run', '--non-interactive'])
    expect(runBeforeCommitHookMock).not.toHaveBeenCalled()
  })

  // v3.0.1 UX flip — apply-immediate default regression fixture.
  // 在 --non-interactive 下,no --apply / no --dry-run 仍走 apply-immediate path
  // (--apply legacy alias removed in v3.3.0;default 已是 apply-immediate)。
  it('9. v3.0.1 flip: apply-immediate default still triggers runBeforeCommitHook', async () => {
    await runCli(['execute-task', '--task', 'legacy', '--non-interactive'])
    expect(runBeforeCommitHookMock).toHaveBeenCalledTimes(1)
  })

  it('10. Phase 4 — runWorkflow called with yamlPath ending execute-task/workflow.yaml (NOT phases.yaml)', async () => {
    await runCli(['execute-task', '--task', 'verify v3 dispatch', '--non-interactive'])
    expect(runWorkflow).toHaveBeenCalledTimes(1)
    const calls = vi.mocked(runWorkflow).mock.calls
    const [yamlPath, vars, opts] = calls[0] ?? []
    expect(typeof yamlPath).toBe('string')
    expect((yamlPath as string).replace(/\\/g, '/')).toMatch(
      /workflows\/execute-task\/workflow\.yaml$/,
    )
    // Negative assertion — proves v2 phases.yaml is NOT the dispatched yaml.
    expect((yamlPath as string).replace(/\\/g, '/')).not.toMatch(/phases\.yaml$/)
    expect(vars).toEqual({})
    expect(opts?.packageRoot).toBeDefined()
    expect((opts?.gateContext as Record<string, unknown>)?.task).toBe('verify v3 dispatch')
  })

  it('11. Phase 4 — --max-iterations 5 forwards to gateContext.maxIterations === 5 (Phase 3 plumb path preserved)', async () => {
    const { code, stdout } = await runCli([
      'execute-task',
      '--task',
      'x',
      '--dry-run',
      '--non-interactive',
      '--max-iterations',
      '5',
    ])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed.gateContext.maxIterations).toBe(5)
  })
})
