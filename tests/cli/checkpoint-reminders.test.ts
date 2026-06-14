// Phase 22 — integration: `checkpoint complete` smart-reminder wire-in + the
// `harnessed retro --done` reset. Reuses the checkpoint-scale harness (mock
// engineHook + evidence, real state.ts, HARNESSED_ROOT_OVERRIDE tmp root). cwd is
// spied to the tmp dir for the whole flow: no git → defaultShipReady fail-soft to
// ready:false (deterministic), and state keys by repoKey(tmp) consistently.

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

import { type GatesPlan, seedLedger } from '../../src/checkpoint/ledger.js'
import { activate, mutateSubProgress, readCurrentWorkflow } from '../../src/checkpoint/state.js'
import { readStoreRaw, repoKey } from '../../src/checkpoint/workflowStore.js'
import { registerCheckpoint } from '../../src/cli/checkpoint.js'
import { runRetroDone } from '../../src/cli/retro.js'

let tmp: string
let originalOverride: string | undefined
let originalThreshold: string | undefined
let cwdSpy: ReturnType<typeof vi.spyOn> | undefined

beforeEach(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'ckpt-reminders-'))
  originalOverride = process.env.HARNESSED_ROOT_OVERRIDE
  originalThreshold = process.env.HARNESSED_RETRO_PHASE_THRESHOLD
  process.env.HARNESSED_ROOT_OVERRIDE = join(tmp, '.claude', 'harnessed')
  delete process.env.HARNESSED_RETRO_PHASE_THRESHOLD
  await mkdir(join(tmp, '.claude', 'harnessed'), { recursive: true })
  // No .git in tmp → defaultShipReady git calls fail-soft; repoKey(tmp) = resolve(tmp).
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmp)
  vi.clearAllMocks()
})

afterEach(() => {
  cwdSpy?.mockRestore()
  if (originalOverride === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
  else process.env.HARNESSED_ROOT_OVERRIDE = originalOverride
  if (originalThreshold === undefined) delete process.env.HARNESSED_RETRO_PHASE_THRESHOLD
  else process.env.HARNESSED_RETRO_PHASE_THRESHOLD = originalThreshold
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

const onePlan: GatesPlan = { master: 'm', fire: [{ sub: 'only', order: 1 }], skip: [] }
const twoPlan: GatesPlan = {
  master: 'm',
  fire: [
    { sub: 'a', order: 1 },
    { sub: 'b', order: 2 },
  ],
  skip: [],
}

describe('checkpoint complete — Phase 22 reminders', () => {
  it('allResolved completion bumps the retro counter + writes ship flags', async () => {
    await activate('m')
    await mutateSubProgress(() => seedLedger(onePlan))

    expect(await runCli(['checkpoint', 'complete', 'only'])).toBe(0)

    const store = await readStoreRaw()
    expect(store.retro_meta?.[repoKey()]?.phases_since_retro).toBe(1)

    const env = await readCurrentWorkflow()
    // The wiring ran (flags written). The git VALUE is deterministically covered by
    // shipReady.test.ts; the ambient git of a tmp dir is non-deterministic on this
    // MSYS host, so here we only assert the flags are present + well-typed.
    expect(typeof env?.ship_ready).toBe('boolean')
    expect(typeof env?.ship_commits).toBe('number')
    expect(env?.retro_due).toBe(false) // 1 < default 5
  })

  it('crosses the retro threshold (env=1) → retro_due true on the envelope', async () => {
    process.env.HARNESSED_RETRO_PHASE_THRESHOLD = '1'
    await activate('m')
    await mutateSubProgress(() => seedLedger(onePlan))

    expect(await runCli(['checkpoint', 'complete', 'only'])).toBe(0)

    const env = await readCurrentWorkflow()
    expect(env?.retro_due).toBe(true)
    expect((await readStoreRaw()).retro_meta?.[repoKey()]?.phases_since_retro).toBe(1)
  })

  it('NOT-allResolved completion (pending sub remains) sets no reminders', async () => {
    await activate('m')
    await mutateSubProgress(() => seedLedger(twoPlan))

    expect(await runCli(['checkpoint', 'complete', 'a'])).toBe(0) // b still pending

    const store = await readStoreRaw()
    expect(store.retro_meta).toBeUndefined()
    const env = await readCurrentWorkflow()
    expect(env?.ship_ready).toBeUndefined()
    expect(env?.retro_due).toBeUndefined()
  })
})

describe('harnessed retro --done (runRetroDone)', () => {
  it('zeroes the phase counter + clears retro_due', async () => {
    // Seed a due state: counter at 3 + envelope retro_due true.
    process.env.HARNESSED_RETRO_PHASE_THRESHOLD = '1'
    await activate('m')
    await mutateSubProgress(() => seedLedger(onePlan))
    await runCli(['checkpoint', 'complete', 'only']) // → retro_due true, counter 1
    // bump the sidecar counter to 3 by re-completing twice more
    await activate('m')
    await mutateSubProgress(() => seedLedger(onePlan))
    await runCli(['checkpoint', 'complete', 'only'])
    await activate('m')
    await mutateSubProgress(() => seedLedger(onePlan))
    await runCli(['checkpoint', 'complete', 'only'])
    expect((await readStoreRaw()).retro_meta?.[repoKey()]?.phases_since_retro).toBe(3)
    expect((await readCurrentWorkflow())?.retro_due).toBe(true)

    await runRetroDone('2026-06-14T12:00:00.000Z')

    const meta = (await readStoreRaw()).retro_meta?.[repoKey()]
    expect(meta?.phases_since_retro).toBe(0)
    expect(meta?.last_retro_at).toBe('2026-06-14T12:00:00.000Z')
    expect((await readCurrentWorkflow())?.retro_due).toBe(false)
  })
})
