// Wiring: `checkpoint complete` → first-time CodeGraph bootstrap. Asserts WHERE the
// hook hangs (the workflow-complete transition of the `task` master) and that it can
// never affect the exit code. The bootstrap module itself is mocked here — its real
// decision logic (binary / index / claim / .gitignore) is covered by
// tests/checkpoint/codegraphInit.test.ts against injected seams.
//
// Harness reused verbatim from tests/cli/checkpoint-reminders.test.ts (mock engineHook
// + evidence, real state.ts, HARNESSED_ROOT_OVERRIDE tmp root, cwd spied to tmp).

import { mkdtempSync, rmSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/path/task.json' })),
  completePhase: vi.fn(async () => undefined),
}))
vi.mock('../../src/checkpoint/evidence.js', () => ({
  checkArtifacts: vi.fn(async () => ({ status: 'none_declared', found: [], missing: [] })),
  checkPlanningSync: vi.fn(async () => ({ status: 'verified', missing: [] })),
}))
vi.mock('../../src/checkpoint/codegraphInit.js', () => ({
  maybeInitCodeGraph: vi.fn(() => 'launched'),
  ensureCodegraphIgnored: vi.fn(() => 'already'),
}))

import { maybeInitCodeGraph } from '../../src/checkpoint/codegraphInit.js'
import { type GatesPlan, seedLedger } from '../../src/checkpoint/ledger.js'
import { activate, mutateSubProgress } from '../../src/checkpoint/state.js'
import { registerCheckpoint } from '../../src/cli/checkpoint.js'

let tmp: string
let originalOverride: string | undefined
let cwdSpy: ReturnType<typeof vi.spyOn> | undefined

beforeEach(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'ckpt-codegraph-'))
  originalOverride = process.env.HARNESSED_ROOT_OVERRIDE
  process.env.HARNESSED_ROOT_OVERRIDE = join(tmp, '.claude', 'harnessed')
  await mkdir(join(tmp, '.claude', 'harnessed'), { recursive: true })
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmp)
  vi.clearAllMocks()
})

afterEach(() => {
  cwdSpy?.mockRestore()
  if (originalOverride === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
  else process.env.HARNESSED_ROOT_OVERRIDE = originalOverride
  rmSync(tmp, { recursive: true, force: true })
  vi.restoreAllMocks()
})

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit ${code}`)
  }
}

async function runCli(argv: string[]): Promise<number> {
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const program = new Command().exitOverride()
  registerCheckpoint(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    code = e instanceof ExitError ? e.code : 1
  } finally {
    exit.mockRestore()
  }
  return code
}

const onePlan: GatesPlan = { master: 'task', fire: [{ sub: 'task-code', order: 1 }], skip: [] }
const twoPlan: GatesPlan = {
  master: 'task',
  fire: [
    { sub: 'task-code', order: 1 },
    { sub: 'task-test', order: 2 },
  ],
  skip: [],
}

describe('checkpoint complete → CodeGraph auto-init wiring', () => {
  it('task master + workflow complete → bootstrap invoked once', async () => {
    await activate('task')
    await mutateSubProgress(() => seedLedger(onePlan))

    expect(await runCli(['checkpoint', 'complete', 'task-code'])).toBe(0)

    expect(maybeInitCodeGraph).toHaveBeenCalledTimes(1)
    // The note channel is routed through RunDeps (stderr), not raw console.
    expect(vi.mocked(maybeInitCodeGraph).mock.calls[0]?.[0]?.note).toBeTypeOf('function')
  })

  it('non-task master (plan) → NOT invoked', async () => {
    await activate('plan')
    await mutateSubProgress(() => seedLedger({ ...onePlan, master: 'plan' }))

    expect(await runCli(['checkpoint', 'complete', 'task-code'])).toBe(0)

    expect(maybeInitCodeGraph).not.toHaveBeenCalled()
  })

  it('task master but a sub is still pending → NOT invoked (sub ≠ workflow complete)', async () => {
    await activate('task')
    await mutateSubProgress(() => seedLedger(twoPlan))

    expect(await runCli(['checkpoint', 'complete', 'task-code'])).toBe(0)

    expect(maybeInitCodeGraph).not.toHaveBeenCalled()
  })

  it('bootstrap failure leaves `checkpoint complete` exiting 0, unchanged', async () => {
    vi.mocked(maybeInitCodeGraph).mockImplementationOnce(() => {
      throw new Error('boom')
    })
    await activate('task')
    await mutateSubProgress(() => seedLedger(onePlan))

    expect(await runCli(['checkpoint', 'complete', 'task-code'])).toBe(0)

    expect(maybeInitCodeGraph).toHaveBeenCalledTimes(1)
  })

  it('a BLOCKED completion never reaches the bootstrap', async () => {
    const { checkArtifacts } = await import('../../src/checkpoint/evidence.js')
    vi.mocked(checkArtifacts).mockResolvedValueOnce({
      status: 'missing',
      found: [],
      missing: ['findings.md'],
    } as unknown as Awaited<ReturnType<typeof checkArtifacts>>)
    await activate('task')
    await mutateSubProgress(() => seedLedger(onePlan))

    expect(await runCli(['checkpoint', 'complete', 'task-code'])).toBe(1)

    expect(maybeInitCodeGraph).not.toHaveBeenCalled()
  })
})
