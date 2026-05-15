// Phase 2.2 W5 T5.5 — cli/execute-task.ts unit tests (B-28 + F7 + KICKOFF § 1.2).
//
// 6+ test cells per task_plan.md L919-926 acceptance:
//   1. registers `execute-task` subcommand
//   2. H1 gate — --non-interactive without --apply/--dry-run → exit 2
//   3. missing --task → exit 2 (commander requiredOption)
//   4. --dry-run --non-interactive → exit 0 + stdout contains workflow JSON
//   5. --model-tier inherit → all phases.model === 'inherit' in dry-run JSON
//   6. invalid workflow path → exit 2 (loadPhases throw caught)
//
// Pattern J — mock @anthropic-ai/claude-agent-sdk + runRouting (apply path);
// dry-run path uses real loadPhases reading workflows/execute-task/phases.yaml.

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock SDK BEFORE engine import (Pattern J — Wave 4 sdk-spawn.test.ts L22-30).
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: () =>
    (async function* () {
      yield {
        type: 'result',
        subtype: 'success',
        result: 'COMPLETE',
        structured_output: { status: 'COMPLETE' },
      }
    })(),
}))

import { registerExecuteTask } from '../../src/cli/execute-task.js'

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

  it('2. H1 gate — --non-interactive without --apply/--dry-run → exit 2', async () => {
    const { code, stderr } = await runCli(['execute-task', '--task', 'hello', '--non-interactive'])
    expect(code).toBe(2)
    expect(stderr).toContain('--non-interactive requires --apply or --dry-run')
  })

  it('3. missing --task → non-zero exit (commander requiredOption)', async () => {
    const { code } = await runCli(['execute-task'])
    // commander requiredOption throws CommanderError before action — caught as code=1
    expect(code).not.toBe(0)
  })

  it('4. --dry-run --non-interactive → exit 0 + stdout JSON contains workflow + 4 phases', async () => {
    const { code, stdout } = await runCli([
      'execute-task',
      '--task',
      'implement auth',
      '--dry-run',
      '--non-interactive',
    ])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed.workflow).toBe('execute-task')
    expect(parsed.phases).toHaveLength(4)
    expect(parsed.taskCtx).toEqual({ task: 'implement auth', task_type: 'execute-task' })
    // intel CD-2 § 第 4 条 defaults
    expect(parsed.phases.map((p: { model: string }) => p.model)).toEqual([
      'opus',
      'sonnet',
      'sonnet',
      'haiku',
    ])
  })

  it('5. --model-tier inherit → all phases.model === "inherit" (B-10 escape hatch)', async () => {
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
    expect(parsed.phases.map((p: { model: string }) => p.model)).toEqual([
      'inherit',
      'inherit',
      'inherit',
      'inherit',
    ])
  })

  it('6. invalid workflow path → exit 2 (loadPhases throws caught)', async () => {
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
    expect(stderr).toMatch(/failed to load/i)
  })
})
