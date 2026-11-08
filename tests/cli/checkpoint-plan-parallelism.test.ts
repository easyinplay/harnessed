// Phase 86 — `checkpoint start --plan` must CARRY the gates plan's
// team-capability / transport fields, not drop or reject them.
//
// The gates plan grew four parallelism fields (teams_active / transport /
// result_contract / bounded_wait). They are the orchestrator's contract
// declaration ("a parallel sub completes via its result file, and the wait for
// that file is bounded"), so a plan that loses them on the way into the
// checkpoint is a plan whose contract the orchestrator never sees.
//
// Sister harness: tests/cli/checkpoint.test.ts (same CLI entry point, mocked
// engineHook / evidence / state so the assertions stay pure).

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/path/task-code.json' })),
  completePhase: vi.fn(async () => undefined),
}))
vi.mock('../../src/checkpoint/evidence.js', () => ({
  checkArtifacts: vi.fn(async () => ({ status: 'none_declared', found: [], missing: [] })),
  checkPlanningSync: vi.fn(async () => ({ status: 'verified', missing: [] })),
}))
vi.mock('../../src/checkpoint/state.js', () => ({
  mutateSubProgress: vi.fn(async () => undefined),
  mutateWorkflow: vi.fn(async () => undefined),
  readCurrentWorkflow: vi.fn(async () => null),
  writeCurrentWorkflow: vi.fn(async () => undefined),
}))
vi.mock('../../src/checkpoint/scale.js', () => ({
  collectScaleMetrics: vi.fn(async () => ({ changedFiles: 0, firedSubs: 0, requirements: 0 })),
  assessScale: vi.fn(() => 'light' as const),
}))

import { parsePlan, registerCheckpoint } from '../../src/cli/checkpoint.js'

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

const PHASE86_PLAN = {
  master: 'task-code',
  fire: [{ sub: 'task-code', mode: 'parallel', order: 1 }],
  skip: [],
  parallelism: {
    escalate_to_teams: true,
    reason: 'agent-teams-upgrade gate fired',
    teams_active: true,
    transport: 'teammate',
    result_contract: 'result-file',
    bounded_wait: true,
  },
}

beforeEach(() => {
  vi.clearAllMocks()
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('Phase 86 — checkpoint plan parsing keeps the transport contract', () => {
  it('carries every parallelism field through the parse', async () => {
    const plan = await parsePlan(JSON.stringify(PHASE86_PLAN))
    expect(plan).not.toBeNull()
    expect(plan?.parallelism).toEqual({
      escalate_to_teams: true,
      reason: 'agent-teams-upgrade gate fired',
      teams_active: true,
      transport: 'teammate',
      result_contract: 'result-file',
      bounded_wait: true,
    })
  })

  it('keeps the fields when the plan routes to the subagent transport', async () => {
    const plan = await parsePlan(
      JSON.stringify({
        ...PHASE86_PLAN,
        parallelism: {
          escalate_to_teams: false,
          reason: 'agent-teams 未启用，不能成团，改用 subagent fan-out',
          teams_active: false,
          transport: 'subagent',
          result_contract: 'result-file',
          bounded_wait: true,
        },
      }),
    )
    expect(plan?.parallelism?.transport).toBe('subagent')
    expect(plan?.parallelism?.teams_active).toBe(false)
    expect(plan?.parallelism?.result_contract).toBe('result-file')
    expect(plan?.parallelism?.bounded_wait).toBe(true)
  })

  it('a plan without parallelism still parses (back-compat)', async () => {
    const plan = await parsePlan(
      JSON.stringify({ master: 'task-code', fire: [{ sub: 'task-code' }], skip: [] }),
    )
    expect(plan).not.toBeNull()
    expect(plan?.parallelism).toBeUndefined()
  })

  it('unknown parallelism keys are dropped — the --plan JSON is untrusted input', async () => {
    const plan = await parsePlan(
      JSON.stringify({
        ...PHASE86_PLAN,
        parallelism: { ...PHASE86_PLAN.parallelism, injected: 'nope', __proto__: { x: 1 } },
      }),
    )
    expect(plan?.parallelism).not.toHaveProperty('injected')
    expect(Object.keys(plan?.parallelism ?? {})).toEqual([
      'escalate_to_teams',
      'reason',
      'teams_active',
      'transport',
      'result_contract',
      'bounded_wait',
    ])
  })

  it('`checkpoint start --plan` accepts the new fields without erroring', async () => {
    const { code, stderr } = await runCli([
      'checkpoint',
      'start',
      'task-code',
      '--plan',
      JSON.stringify(PHASE86_PLAN),
    ])
    expect(code).toBe(0)
    expect(stderr).toBe('')
  })
})
