// Phase 86 — the spawn-ready prompt must carry the result-delivery contract.
//
// The completion signal is the FILE the sub writes, not the final chat message:
// under claude-code's agent-teams mode a re-parented teammate's completion
// notification never reaches the orchestrator (open-gsd/gsd-core#1355). So the
// prompt has to name the artifact, and the `--json` form has to hand that same
// path to the orchestrator — one path, two consumers.

import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resultArtifactPath } from '../../src/cli/lib/resultArtifact.js'
import { registerPrompt } from '../../src/cli/prompt.js'

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
  registerPrompt(program)
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

describe('cli/prompt — Phase 86 result delivery', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('the text body carries a ## Result delivery section naming the artifact', async () => {
    const { code, stdout } = await runCli(['prompt', 'task-code'])
    expect(code).toBe(0)
    expect(stdout).toContain('## Result delivery')
    expect(stdout).toContain(resultArtifactPath('task-code', process.cwd()))
  })

  it('the delivery section demands the verbatim <promise>COMPLETE</promise> line', async () => {
    const { stdout } = await runCli(['prompt', 'task-code'])
    const section = stdout.slice(stdout.indexOf('## Result delivery'))
    expect(section).toContain('<promise>COMPLETE</promise>')
    // The contract is the FILE, not the chat message.
    expect(section.toLowerCase()).toContain('file')
  })

  it('--json gains result_file — an absolute path', async () => {
    const { code, stdout } = await runCli(['prompt', 'task-code', '--json'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(typeof parsed.result_file).toBe('string')
    expect(parsed.result_file).toBe(resultArtifactPath('task-code', process.cwd()))
  })

  it('--json keeps every pre-existing field', async () => {
    const { stdout } = await runCli(['prompt', 'task-code', '--task', 'do X', '--json'])
    const parsed = JSON.parse(stdout)
    expect(parsed).toHaveProperty('prompt')
    expect(parsed).toHaveProperty('max_iterations')
    expect(parsed).toHaveProperty('model')
    expect(parsed).toHaveProperty('specialist')
    expect(typeof parsed.max_iterations).toBe('number')
    expect(typeof parsed.model).toBe('string')
    expect(typeof parsed.specialist).toBe('string')
  })

  it('the text body and the --json body are the SAME body', async () => {
    const text = await runCli(['prompt', 'task-code'])
    const json = await runCli(['prompt', 'task-code', '--json'])
    const parsed = JSON.parse(json.stdout)
    // console.log appends the newline the JSON body does not carry.
    expect(parsed.prompt).toBe(text.stdout.replace(/\n$/, ''))
    expect(parsed.prompt).toContain('## Result delivery')
  })

  it('the result path is per-sub', async () => {
    const a = await runCli(['prompt', 'task-code', '--json'])
    const b = await runCli(['prompt', 'task-test', '--json'])
    expect(JSON.parse(a.stdout).result_file).not.toBe(JSON.parse(b.stdout).result_file)
  })
})
