import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { defaultSpawnDriverMock, runAutoPreFlightMock } = vi.hoisted(() => ({
  runAutoPreFlightMock: vi.fn(
    async (_context: Record<string, unknown>, opts: Record<string, unknown>) => ({
      proceed: true,
      opts,
    }),
  ),
  defaultSpawnDriverMock: vi.fn(async () => {}),
}))

vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '.harnessed/checkpoints/auto.json' })),
  completePhase: vi.fn(async () => {}),
}))

vi.mock('../../src/workflow/masterOrchestrator-helpers.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/workflow/masterOrchestrator-helpers.js')
  >('../../src/workflow/masterOrchestrator-helpers.js')
  return {
    ...actual,
    defaultSpawnDriver: defaultSpawnDriverMock,
    runAutoPreFlight: runAutoPreFlightMock,
  }
})

import { registerRun } from '../../src/cli/run.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

async function runAuto(): Promise<number> {
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  const program = new Command().exitOverride()
  registerRun(program)
  try {
    await program.parseAsync(['node', 'harnessed', 'run', 'auto'])
    return 0
  } catch (error) {
    if (error instanceof ExitError) return error.code
    throw error
  } finally {
    exit.mockRestore()
    stderrWrite.mockRestore()
  }
}

describe('cli/run auto production pre-flight wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.HARNESSED_ALLOW_NESTED = '1'
  })

  afterEach(() => {
    delete process.env.HARNESSED_ALLOW_NESTED
    vi.restoreAllMocks()
  })

  it('runs the auto pre-flight without injected hooks', async () => {
    await expect(runAuto()).resolves.toBe(0)
    expect(runAutoPreFlightMock).toHaveBeenCalledTimes(1)
    expect(runAutoPreFlightMock).toHaveBeenCalledWith(expect.any(Object), {})
    expect(defaultSpawnDriverMock).toHaveBeenCalled()
  })
})
