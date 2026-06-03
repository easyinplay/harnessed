// v4.0 W1 T1.2 — cli/prompt.ts unit tests (TDD).
//
// `harnessed prompt <sub> [--task <text>] [--json]` outputs a spawn-ready prompt
// (role prompt + checklist + disciplines + task + completion/clarification
// protocols). NO spawning — just prints text the CC main session feeds into its
// native Task tool.
//
// Sister pattern: tests/cli/run.test.ts (ExitError + runCli helper). Reads the
// REAL bundled workflows/role-prompts.yaml (24 entries, stable) + defaults.yaml
// (integration-ish) — no mocking needed.

import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

describe('cli/prompt — registration', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers `prompt` subcommand on Command instance', () => {
    const program = new Command()
    registerPrompt(program)
    const names = program.commands.map((c) => c.name())
    expect(names).toContain('prompt')
    const cmd = program.commands.find((c) => c.name() === 'prompt')
    expect(cmd?.description().toLowerCase()).toContain('prompt')
  })
})

describe('cli/prompt — text mode', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('cell 1 — prompt task-code --task "do X" → text has specialist + ## Task + do X + protocols', async () => {
    const { code, stdout } = await runCli(['prompt', 'task-code', '--task', 'do X'])
    expect(code).toBe(0)
    expect(stdout).toContain('You are a') // specialist line from buildAgentDef
    expect(stdout).toContain('## Task')
    expect(stdout).toContain('do X')
    expect(stdout).toContain('COMPLETE')
    expect(stdout).toContain('NEEDS_CLARIFICATION')
  })

  it('cell 2 — prompt verify-paranoid (no task) → both protocols, NO ## Task section', async () => {
    const { code, stdout } = await runCli(['prompt', 'verify-paranoid'])
    expect(code).toBe(0)
    expect(stdout).toContain('You are a')
    expect(stdout).toContain('Completion protocol')
    expect(stdout).toContain('Clarification protocol')
    expect(stdout).toContain('COMPLETE')
    expect(stdout).toContain('NEEDS_CLARIFICATION')
    expect(stdout).not.toContain('## Task')
  })

  it('cell 5 — checklist present in text for a sub that has one (task-code)', async () => {
    const { code, stdout } = await runCli(['prompt', 'task-code'])
    expect(code).toBe(0)
    expect(stdout).toContain('Checklist:')
    expect(stdout).toMatch(/\n\s+1\. /) // numbered checklist item
  })
})

describe('cli/prompt — json mode', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('cell 3 — --json → valid JSON with prompt/max_iterations/model/specialist keys', async () => {
    const { code, stdout } = await runCli(['prompt', 'task-code', '--task', 'do X', '--json'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed).toHaveProperty('prompt')
    expect(parsed).toHaveProperty('max_iterations')
    expect(parsed).toHaveProperty('model')
    expect(parsed).toHaveProperty('specialist')
    expect(typeof parsed.max_iterations).toBe('number')
    expect(typeof parsed.prompt).toBe('string')
    expect(parsed.prompt).toContain('NEEDS_CLARIFICATION')
    expect(parsed.prompt).toContain('## Task')
  })

  it('cell 3b — --json model defaults to sonnet; specialist non-empty', async () => {
    const { stdout } = await runCli(['prompt', 'verify-paranoid', '--json'])
    const parsed = JSON.parse(stdout)
    expect(parsed.model).toBe('sonnet')
    expect(parsed.specialist.length).toBeGreaterThan(0)
  })
})

describe('cli/prompt — fallback', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('cell 4 — unknown sub → fallback prompt, exit 0, still has both protocols', async () => {
    const { code, stdout } = await runCli(['prompt', 'nonexistent-xyz'])
    expect(code).toBe(0)
    expect(stdout).toContain('COMPLETE')
    expect(stdout).toContain('NEEDS_CLARIFICATION')
  })

  it('cell 4b — unknown sub --json → max_iterations falls back to 20, specialist default', async () => {
    const { code, stdout } = await runCli(['prompt', 'nonexistent-xyz', '--json'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed.max_iterations).toBe(20)
    expect(parsed.specialist).toBe('Implementation Engineer')
    expect(parsed.model).toBe('sonnet')
  })
})

describe('cli/prompt — v4.0.1 language discipline injection', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.HARNESSED_USER_LANG
  })

  it('cell 6 — HARNESSED_USER_LANG=zh-Hans → ## Language section with 简体中文 + preserve note', async () => {
    process.env.HARNESSED_USER_LANG = 'zh-Hans'
    const { code, stdout } = await runCli(['prompt', 'task-code', '--task', 'x'])
    expect(code).toBe(0)
    expect(stdout).toContain('## Language')
    expect(stdout).toContain('简体中文')
    expect(stdout).toMatch(/do not translate/i)
  })

  it('cell 7 — HARNESSED_USER_LANG unset → no ## Language section', async () => {
    delete process.env.HARNESSED_USER_LANG
    const { code, stdout } = await runCli(['prompt', 'task-code', '--task', 'x'])
    expect(code).toBe(0)
    expect(stdout).not.toContain('## Language')
  })

  it('cell 8 — HARNESSED_USER_LANG=en → English language section', async () => {
    process.env.HARNESSED_USER_LANG = 'en'
    const { code, stdout } = await runCli(['prompt', 'task-code'])
    expect(code).toBe(0)
    expect(stdout).toContain('## Language')
    expect(stdout).toContain('English')
  })

  it('cell 9 — --json prompt also carries the language section', async () => {
    process.env.HARNESSED_USER_LANG = 'zh-Hans'
    const { code, stdout } = await runCli(['prompt', 'task-code', '--json'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed.prompt).toContain('## Language')
    expect(parsed.prompt).toContain('简体中文')
  })
})

describe('cli/prompt — v4.1 tools_available injection', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.HARNESSED_USER_LANG
  })

  it('cell 10 — plan-phase prompt injects ## Tools with /gsd-plan-phase + /plan (planning-with-files)', async () => {
    const { code, stdout } = await runCli(['prompt', 'plan-phase', '--task', 'x'])
    expect(code).toBe(0)
    expect(stdout).toContain('## Tools')
    expect(stdout).toContain('/gsd-plan-phase')
    expect(stdout).toContain('/plan')
    expect(stdout).toMatch(/planning-with-files/)
    expect(stdout).toMatch(/not optional|do NOT improvise/i)
  })

  it('cell 11 — task-code prompt injects ## Tools section', async () => {
    const { code, stdout } = await runCli(['prompt', 'task-code'])
    expect(code).toBe(0)
    expect(stdout).toContain('## Tools')
  })

  it('cell 12 — unknown sub → no ## Tools section (fail-soft, prompt still works)', async () => {
    const { code, stdout } = await runCli(['prompt', 'nonexistent-xyz'])
    expect(code).toBe(0)
    expect(stdout).not.toContain('## Tools')
    expect(stdout).toContain('NEEDS_CLARIFICATION')
  })

  it('cell 13 — --json prompt also carries the tools section', async () => {
    const { code, stdout } = await runCli(['prompt', 'plan-phase', '--json'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed.prompt).toContain('## Tools')
    expect(parsed.prompt).toContain('/gsd-plan-phase')
  })
})
