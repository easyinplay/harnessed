// v3.4.4 Phase 4 Commit 3 — cli/research.ts unit tests (9 cells per PHASE-4-SPEC.md L393-402).
//
// Sister pattern: tests/cli/run.test.ts Pattern J (Phase 1 T1) — mock
// runWorkflow at module boundary, exercise CLI surface end-to-end via
// commander.parseAsync, capture process.exit via spy + ExitError throw.
//
// Coverage:
//   1. registers `research` subcommand on Command instance
//   2. H1 gate — --non-interactive without --query → exit 2 (commander requiredOption)
//   3. --dry-run --non-interactive --query X exits 0 + JSON envelope shape
//   4. --query forwards to gateContext.task
//   5. --model haiku forwards to gateContext.modelOverride
//   6. apply path — runWorkflow called with correct (yamlPath, {}, { packageRoot, gateContext })
//   7. runWorkflow returns { status: 'failed' } → process.exit(1)
//   8. runWorkflow throws → process.exit(1) with stderr 'workflow runtime failed —'
//   9. runRouting NEVER imported in src/cli/research.ts (Phase 4 routing/ decoupling proof)

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock workflow runtime BEFORE registerResearch import — captures runWorkflow calls.
vi.mock('../../src/workflow/run.js', () => ({
  runWorkflow: vi.fn(async () => ({ status: 'complete', phasesRun: 0 })),
}))

import { registerResearch } from '../../src/cli/research.js'
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
  registerResearch(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) {
      code = e.code
    } else {
      // commander.exitOverride throws CommanderError for missing requiredOption — code 1
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

describe('cli/research — 9 cells per v3.4.4 PHASE-4-SPEC.md L393-402', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(runWorkflow).mockResolvedValue({ status: 'complete', phasesRun: 0 })
    // The suite may itself run inside a CC session (session id + non-TTY), which
    // the nested guard (L3) would otherwise trip; guard cells live below.
    process.env.HARNESSED_ALLOW_NESTED = '1'
  })
  afterEach(() => {
    delete process.env.HARNESSED_ALLOW_NESTED
    vi.restoreAllMocks()
  })

  it('cell 1 — registers `research` subcommand on Command instance', () => {
    const program = new Command()
    registerResearch(program)
    const cmd = program.commands.find((c) => c.name() === 'research')
    expect(cmd).toBeDefined()
    expect(cmd?.description()).toContain('research workflow')
  })

  it('cell 2 — H1 gate: --non-interactive without --query → non-zero exit (commander requiredOption)', async () => {
    const { code } = await runCli(['research', '--non-interactive'])
    // commander requiredOption throws CommanderError before action — caught as code != 0
    // (matches sister tests/cli/execute-task.test.ts cell 3 pattern — code 1 via exitOverride
    // or code 2 if commander propagates exit code; either way NOT 0).
    expect(code).not.toBe(0)
  })

  it('cell 3 — --dry-run --non-interactive --query X → exit 0 + JSON envelope shape', async () => {
    const { code, stdout } = await runCli([
      'research',
      '--query',
      'Next.js v15 router',
      '--dry-run',
      '--non-interactive',
    ])
    expect(code).toBe(0)
    expect(runWorkflow).not.toHaveBeenCalled()
    const parsed = JSON.parse(stdout)
    expect(parsed.workflow).toBe('research')
    expect(parsed.yamlPath).toBeDefined()
    expect(parsed.yamlPath.replace(/\\/g, '/')).toMatch(/workflows\/research\/workflow\.yaml$/)
    expect(parsed.gateContext).toBeDefined()
    expect(parsed.gateContext.task).toBe('Next.js v15 router')
  })

  it('cell 4 — --query "Y" forwards to gateContext.task === "Y" (apply path)', async () => {
    await runCli(['research', '--query', 'find docs for react 19'])
    expect(runWorkflow).toHaveBeenCalledTimes(1)
    const calls = vi.mocked(runWorkflow).mock.calls
    const [, , opts] = calls[0] ?? []
    expect(opts?.gateContext?.task).toBe('find docs for react 19')
  })

  it('cell 5 — --model haiku forwards to gateContext.modelOverride === "haiku"', async () => {
    await runCli(['research', '--query', 'X', '--model', 'haiku'])
    const calls = vi.mocked(runWorkflow).mock.calls
    const [, , opts] = calls[0] ?? []
    expect(opts?.gateContext?.modelOverride).toBe('haiku')
  })

  it('cell 6 — apply path: runWorkflow called with (yamlPath, {}, { packageRoot, gateContext })', async () => {
    await runCli(['research', '--query', 'test query'])
    expect(runWorkflow).toHaveBeenCalledTimes(1)
    const calls = vi.mocked(runWorkflow).mock.calls
    const [yamlPath, vars, opts] = calls[0] ?? []
    expect(typeof yamlPath).toBe('string')
    expect((yamlPath as string).replace(/\\/g, '/')).toMatch(/workflows\/research\/workflow\.yaml$/)
    expect(vars).toEqual({})
    expect(opts?.packageRoot).toBeDefined()
    expect(typeof opts?.packageRoot).toBe('string')
    expect(opts?.gateContext).toBeDefined()
    expect((opts?.gateContext as Record<string, unknown>)?.task).toBe('test query')
  })

  it('cell 7 — runWorkflow returns { status: "failed" } → exit 1', async () => {
    vi.mocked(runWorkflow).mockResolvedValue({ status: 'failed', phasesRun: 1 })
    const { code } = await runCli(['research', '--query', 'X'])
    expect(code).toBe(1)
  })

  it('cell 8 — runWorkflow throws → exit 1 + stderr "workflow runtime failed —"', async () => {
    vi.mocked(runWorkflow).mockRejectedValue(new Error('boom'))
    const { code, stderr } = await runCli(['research', '--query', 'X'])
    expect(code).toBe(1)
    expect(stderr).toMatch(/workflow runtime failed —/)
    expect(stderr).toContain('boom')
  })

  it('cell 9 — runRouting is NEVER imported in src/cli/research.ts (Phase 4 routing/ decoupling)', () => {
    // Static source-level proof: read the file off disk, strip line comments
    // (`// …`) + block comments (`/* … */`) so the historical-context
    // narrative at the top of the file doesn't false-positive, then confirm
    // the executable source has no `runRouting` symbol and no `from '../routing/`
    // import. This catches future regressions where someone re-adds the
    // runRouting call path without going through runWorkflow.
    const filePath = join(__dirname, '..', '..', 'src', 'cli', 'research.ts')
    const raw = readFileSync(filePath, 'utf8')
    const code = raw
      // Strip block comments first (greedy, multiline).
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Strip line comments (everything from `//` to EOL).
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    expect(code).not.toMatch(/runRouting/)
    expect(code).not.toMatch(/from ['"]\.\.\/routing\//)
    expect(code).not.toMatch(/from ['"]\.\.\/routing['"]/)
    expect(code).not.toMatch(/TaskContext/)
  })
})

// External review L3 — `research` is the same in-process SDK spawn as `run`, but
// had no nested-session guard, so inside a Claude Code session it reproduced
// issue #1's 108s hang.
describe('cli/research — nested-CC guard (L3)', () => {
  let savedSid: string | undefined
  let savedAllow: string | undefined
  let isTTYDescriptor: PropertyDescriptor | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(runWorkflow).mockResolvedValue({ status: 'complete', phasesRun: 0 })
    savedSid = process.env.CLAUDE_CODE_SESSION_ID
    savedAllow = process.env.HARNESSED_ALLOW_NESTED
    isTTYDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
    process.env.CLAUDE_CODE_SESSION_ID = 'sess-test-123'
    delete process.env.HARNESSED_ALLOW_NESTED
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
  })
  afterEach(() => {
    if (savedSid === undefined) delete process.env.CLAUDE_CODE_SESSION_ID
    else process.env.CLAUDE_CODE_SESSION_ID = savedSid
    if (savedAllow === undefined) delete process.env.HARNESSED_ALLOW_NESTED
    else process.env.HARNESSED_ALLOW_NESTED = savedAllow
    if (isTTYDescriptor) Object.defineProperty(process.stdin, 'isTTY', isTTYDescriptor)
    else Object.defineProperty(process.stdin, 'isTTY', { value: undefined, configurable: true })
    vi.restoreAllMocks()
  })

  it('nested + non-TTY + no override → exit 1 + pointer to /research, runWorkflow NOT called', async () => {
    const { code, stderr } = await runCli(['research', '--query', 'x'])
    expect(code).toBe(1)
    expect(stderr).toMatch(/\/research/)
    expect(runWorkflow).not.toHaveBeenCalled()
  })

  it('HARNESSED_ALLOW_NESTED=1 overrides → runWorkflow IS called', async () => {
    process.env.HARNESSED_ALLOW_NESTED = '1'
    await runCli(['research', '--query', 'x'])
    expect(runWorkflow).toHaveBeenCalledTimes(1)
  })

  it('--dry-run is never blocked', async () => {
    const { code } = await runCli(['research', '--query', 'x', '--dry-run'])
    expect(code).toBe(0)
  })
})
