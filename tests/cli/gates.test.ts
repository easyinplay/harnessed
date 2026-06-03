// tests/cli/gates.test.ts — TDD for `harnessed gates <master>` CLI.
//
// `harnessed gates` evaluates which sub-workflows fire for a master orchestrator
// and prints a JSON plan to stdout — NO spawning (mirror masterOrchestrator.ts
// gate eval loop lines 121-165, fail-soft per ADR 0029).
//
// Mocks (sister tests/workflow/masterOrchestrator.test.ts):
//   - judgmentResolver.resolveJudgmentGate → vi.fn (gate truth table)
//   - node:fs/promises readFile → path-keyed yaml fixture map
// CLI harness (sister tests/cli/run.test.ts): ExitError + runCli + exitOverride.

import { resolve } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// vi.mock hoisting — declare BEFORE importing src under test.
const resolveJudgmentGateMock =
  vi.fn<(ref: string, ctx: Record<string, unknown>, root: string) => Promise<boolean>>()
const yamlFileMap = new Map<string, string>()
const readFileMock = vi.fn(async (p: string) => {
  const content = yamlFileMap.get(p as string)
  if (content === undefined) throw new Error(`ENOENT no mock for ${p}`)
  return content
})

vi.mock('../../src/workflow/judgmentResolver.js', () => ({
  resolveJudgmentGate: (
    ref: string,
    ctx: Record<string, unknown>,
    root: string,
  ): Promise<boolean> => resolveJudgmentGateMock(ref, ctx, root),
}))
vi.mock('node:fs/promises', async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
  return { ...actual, readFile: (p: string) => readFileMock(p) }
})
// Pin package root so fixture path keys are deterministic.
vi.mock('../../src/cli/lib/packagePath.js', () => ({
  getPackageRoot: () => '/fake-root',
}))

import { registerGates } from '../../src/cli/gates.js'

const PACKAGE_ROOT = '/fake-root'

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
  const errSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    stderr += `${args.map(String).join(' ')}\n`
  })
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    stderr += `${args.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerGates(program)
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
    errSpy.mockRestore()
    warnSpy.mockRestore()
  }
  return { code, stdout, stderr }
}

function masterYaml(workflow: string, delegatesYaml: string): string {
  return `schema_version: harnessed.workflow.v3
workflow: ${workflow}
delegates_to:
${delegatesYaml}
`
}

function clauseLine(
  sub: string,
  opts: { gate?: string; mode?: string; order?: number } = {},
): string {
  const parts = [`  - sub: ${sub}`]
  if (opts.gate) parts.push(`    gate: ${opts.gate}`)
  if (opts.mode) parts.push(`    mode: ${opts.mode}`)
  if (opts.order !== undefined) parts.push(`    order: ${opts.order}`)
  return parts.join('\n')
}

function masterPath(master: string): string {
  return master === 'auto'
    ? resolve(PACKAGE_ROOT, 'workflows', 'auto', 'workflow.yaml')
    : resolve(PACKAGE_ROOT, 'workflows', master, 'auto', 'workflow.yaml')
}

/** Register fixture yaml for a master + return parsed JSON of stdout. */
function setMaster(master: string, delegatesYaml: string): void {
  yamlFileMap.set(masterPath(master), masterYaml(master, delegatesYaml))
}

beforeEach(() => {
  resolveJudgmentGateMock.mockReset()
  readFileMock.mockClear()
  yamlFileMap.clear()
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('cli/gates — gate eval plan (no spawn)', () => {
  it('cell 1 — all gates true → subs in fire[], valid JSON, 4 keys', async () => {
    setMaster(
      'task',
      [
        clauseLine('clarify', { gate: 'judgments.subtask-gate.brainstorming.fires', order: 1 }),
        clauseLine('code', { order: 2 }),
      ].join('\n'),
    )
    resolveJudgmentGateMock.mockResolvedValue(true)
    const { code, stdout } = await runCli(['gates', 'task', '--task', 'do X'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed.master).toBe('task')
    expect(parsed).toHaveProperty('fire')
    expect(parsed).toHaveProperty('skip')
    expect(parsed).toHaveProperty('parallelism')
    const fireSubs = parsed.fire.map((f: { sub: string }) => f.sub)
    expect(fireSubs).toContain('clarify')
    expect(fireSubs).toContain('code')
    // gated clause carries its gate ref
    const clarify = parsed.fire.find((f: { sub: string }) => f.sub === 'clarify')
    expect(clarify.gate).toBe('judgments.subtask-gate.brainstorming.fires')
    expect(clarify.order).toBe(1)
  })

  it('cell 2 — --skip-sub clarify → clarify in skip[] (skip_subs reason), gate NOT eval', async () => {
    setMaster(
      'task',
      [
        clauseLine('clarify', { gate: 'judgments.subtask-gate.brainstorming.fires' }),
        clauseLine('code'),
      ].join('\n'),
    )
    resolveJudgmentGateMock.mockResolvedValue(true)
    const { code, stdout } = await runCli(['gates', 'task', '--skip-sub', 'clarify'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    const skipSubs = parsed.skip.map((s: { sub: string }) => s.sub)
    expect(skipSubs).toContain('clarify')
    const clarifySkip = parsed.skip.find((s: { sub: string }) => s.sub === 'clarify')
    expect(clarifySkip.reason).toMatch(/skip_subs/)
    // gate for clarify was NOT evaluated — only `code` had no gate, so 0 gate evals
    // for clarify. resolveJudgmentGate only called for parallelism (separate ref).
    const clarifyGateCalls = resolveJudgmentGateMock.mock.calls.filter(
      (c) => c[0] === 'judgments.subtask-gate.brainstorming.fires',
    )
    expect(clarifyGateCalls.length).toBe(0)
  })

  it('cell 3 — gate returns false → sub in skip[] reason "gate ... = false"', async () => {
    setMaster(
      'task',
      [clauseLine('clarify', { gate: 'judgments.subtask-gate.brainstorming.fires' })].join('\n'),
    )
    // parallelism eval also goes through the mock — return false uniformly.
    resolveJudgmentGateMock.mockResolvedValue(false)
    const { code, stdout } = await runCli(['gates', 'task'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    const clarifySkip = parsed.skip.find((s: { sub: string }) => s.sub === 'clarify')
    expect(clarifySkip).toBeDefined()
    expect(clarifySkip.reason).toMatch(/gate judgments\.subtask-gate\.brainstorming\.fires = false/)
    expect(parsed.fire.map((f: { sub: string }) => f.sub)).not.toContain('clarify')
  })

  it('cell 4 — gate throws → fail-soft, sub in fire[] (ADR 0029)', async () => {
    setMaster(
      'task',
      [clauseLine('clarify', { gate: 'judgments.subtask-gate.brainstorming.fires' })].join('\n'),
    )
    resolveJudgmentGateMock.mockRejectedValue(new Error('undeclared var boom'))
    const { code, stdout } = await runCli(['gates', 'task'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    const fireSubs = parsed.fire.map((f: { sub: string }) => f.sub)
    expect(fireSubs).toContain('clarify')
    expect(parsed.skip.map((s: { sub: string }) => s.sub)).not.toContain('clarify')
  })

  it('cell 5 — unknown master → exit 1', async () => {
    // 'bogus' is not a valid master — no yaml fixture registered, readFile throws.
    const { code } = await runCli(['gates', 'bogus'])
    expect(code).toBe(1)
  })

  it('cell 5b — valid master but missing yaml → exit 1 + stderr', async () => {
    // 'plan' is a valid master name but we register no fixture → readFile ENOENT.
    const { code, stderr } = await runCli(['gates', 'plan'])
    expect(code).toBe(1)
    expect(stderr.length).toBeGreaterThan(0)
  })

  it('cell 6 — parallelism field present + boolean escalate_to_teams', async () => {
    setMaster('task', [clauseLine('code')].join('\n'))
    resolveJudgmentGateMock.mockResolvedValue(true)
    const { code, stdout } = await runCli(['gates', 'task'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed.parallelism).toBeDefined()
    expect(typeof parsed.parallelism.escalate_to_teams).toBe('boolean')
    // gate fired → parallelism eval returns true here
    expect(parsed.parallelism.escalate_to_teams).toBe(true)
    expect(parsed.parallelism.reason).toMatch(/agent-teams/)
  })

  it('cell 7 — parallelism gate throws → escalate_to_teams false, reason null', async () => {
    setMaster('task', [clauseLine('code')].join('\n'))
    // First call (none for code — no gate). parallelism ref throws.
    resolveJudgmentGateMock.mockImplementation(async (ref: string) => {
      if (ref === 'judgments.parallelism-gate.agent-teams-upgrade.fires') {
        throw new Error('parallelism var undefined')
      }
      return true
    })
    const { code, stdout } = await runCli(['gates', 'task'])
    expect(code).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed.parallelism.escalate_to_teams).toBe(false)
    expect(parsed.parallelism.reason).toBe(null)
  })

  it('cell 8 — --context json merges over default context (passed to gate eval)', async () => {
    setMaster(
      'task',
      [clauseLine('clarify', { gate: 'judgments.subtask-gate.brainstorming.fires' })].join('\n'),
    )
    resolveJudgmentGateMock.mockResolvedValue(true)
    await runCli([
      'gates',
      'task',
      '--task',
      'hello',
      '--context',
      JSON.stringify({ custom_fact: 42, phase: { stage: 'override' } }),
    ])
    // inspect ctx passed to the gate eval
    const call = resolveJudgmentGateMock.mock.calls.find(
      (c) => c[0] === 'judgments.subtask-gate.brainstorming.fires',
    )
    expect(call).toBeDefined()
    const ctx = call?.[1] as Record<string, unknown>
    expect(ctx.task).toBe('hello')
    expect(ctx.custom_fact).toBe(42)
    // merged phase override
    expect((ctx.phase as Record<string, unknown>).stage).toBe('override')
    // default subtask context still present (proves default object injected)
    expect(ctx.subtask).toBeDefined()
  })

  it('cell 9 — clause with no gate → fire[] without gate field', async () => {
    setMaster('task', [clauseLine('code', { order: 5, mode: 'serial' })].join('\n'))
    resolveJudgmentGateMock.mockResolvedValue(true)
    const { stdout } = await runCli(['gates', 'task'])
    const parsed = JSON.parse(stdout)
    const code = parsed.fire.find((f: { sub: string }) => f.sub === 'code')
    expect(code).toBeDefined()
    expect(code.gate).toBeUndefined()
    expect(code.order).toBe(5)
    expect(code.mode).toBe('serial')
  })

  it('cell 10 — master missing delegates_to → exit 1', async () => {
    yamlFileMap.set(masterPath('task'), 'schema_version: harnessed.workflow.v3\nworkflow: task\n')
    const { code } = await runCli(['gates', 'task'])
    expect(code).toBe(1)
  })

  it('cell 11 — v4.1 auto firing stage masters → is_master:true on plan/task/verify, absent on research/retro', async () => {
    setMaster(
      'auto',
      [
        clauseLine('research', { order: 0 }),
        clauseLine('plan', { order: 2 }),
        clauseLine('task', { order: 3 }),
        clauseLine('retro', { order: 5 }),
      ].join('\n'),
    )
    resolveJudgmentGateMock.mockResolvedValue(true)
    const { stdout } = await runCli(['gates', 'auto'])
    const parsed = JSON.parse(stdout)
    const byName = (n: string) => parsed.fire.find((f: { sub: string }) => f.sub === n)
    expect(byName('plan').is_master).toBe(true)
    expect(byName('task').is_master).toBe(true)
    expect(byName('research').is_master).toBeUndefined()
    expect(byName('retro').is_master).toBeUndefined()
  })

  it('cell 12 — leaf-only master (task) → no is_master on its execution subs', async () => {
    setMaster('task', [clauseLine('code'), clauseLine('test')].join('\n'))
    resolveJudgmentGateMock.mockResolvedValue(true)
    const { stdout } = await runCli(['gates', 'task'])
    const parsed = JSON.parse(stdout)
    for (const f of parsed.fire) {
      expect(f.is_master).toBeUndefined()
    }
  })
})
