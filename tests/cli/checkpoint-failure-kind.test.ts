// v16.0 Phase 66 T4 — `harnessed checkpoint fail --failure <kind>`.
//
// findings.md F2c: `runCheckpointFail` was the ONLY injection point for the
// five named spawn failures (the CLI had `--summary` / `--failing-tests` /
// `--force` and nothing else), and the ledger had no field to put them in.
// This file locks the new flag: the value lands on the ledger entry, an unknown
// value is rejected BEFORE anything is written, and omitting it changes nothing.

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/task-code.json' })),
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
  mutateStore: vi.fn(async () => undefined),
}))

import { completePhase } from '../../src/checkpoint/engineHook.js'
import { mutateSubProgress } from '../../src/checkpoint/state.js'
import { registerCheckpoint } from '../../src/cli/checkpoint.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stderr: string }> {
  let stderr = ''
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const err = vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
    stderr += `${a.map(String).join(' ')}\n`
  })
  const warn = vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
    stderr += `${a.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerCheckpoint(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) code = e.code
    else {
      code = 1
      stderr += `${(e as Error).message}\n`
    }
  } finally {
    exit.mockRestore()
    log.mockRestore()
    err.mockRestore()
    warn.mockRestore()
  }
  return { code, stderr }
}

/** Replay the ledger mutation the CLI handed to `mutateSubProgress`. */
function replayLedger(): Array<Record<string, unknown>> {
  const mutator = vi.mocked(mutateSubProgress).mock.calls[0]?.[0] as (
    e: unknown[],
  ) => Array<Record<string, unknown>>
  return mutator([{ sub: 'task-code', status: 'pending', gate_fired: true }])
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.restoreAllMocks())

describe('checkpoint fail --failure <kind>', () => {
  it('records the kind on the ledger entry', async () => {
    const { code } = await runCli([
      'checkpoint',
      'fail',
      'task-code',
      '--failure',
      'SpawnTimeout',
      '--summary',
      'timed out',
    ])
    expect(code).toBe(1) // a recorded failure still exits 1
    expect(replayLedger()[0]?.spawn_failure).toBe('SpawnTimeout')
  })

  it('accepts every one of the five and nothing else', async () => {
    for (const kind of [
      'SpawnTimeout',
      'SpawnExitNonZero',
      'SpawnOutputMalformed',
      'SpawnAuthFailed',
      'SpawnRefused',
    ]) {
      vi.clearAllMocks()
      await runCli(['checkpoint', 'fail', 'task-code', '--failure', kind])
      expect(replayLedger()[0]?.spawn_failure).toBe(kind)
    }
  })

  it('rejects an unknown kind BEFORE any write, and names the five', async () => {
    const { code, stderr } = await runCli([
      'checkpoint',
      'fail',
      'task-code',
      '--failure',
      'SpawnOops',
    ])
    expect(code).toBe(1)
    expect(stderr).toContain('SpawnOops')
    expect(stderr).toContain('SpawnTimeout')
    // fail-CLOSED: nothing touched the ledger or the checkpoint envelope
    expect(vi.mocked(mutateSubProgress)).not.toHaveBeenCalled()
    expect(vi.mocked(completePhase)).not.toHaveBeenCalled()
  })

  it('omitting the flag leaves the entry without the key (eval-golden fence)', async () => {
    await runCli(['checkpoint', 'fail', 'task-code', '--summary', 'plain failure'])
    const entry = replayLedger()[0] as object
    expect(Object.hasOwn(entry, 'spawn_failure')).toBe(false)
    expect(JSON.stringify(entry)).not.toContain('spawn_failure')
  })
})
