import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import lockfile from 'proper-lockfile'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { markSub, seedLedger } from '../../src/checkpoint/ledger.js'
import { activate, mutateSubProgress, readCurrentWorkflow } from '../../src/checkpoint/state.js'

describe('issue #32: bounded checkpoint lock contention', () => {
  let tempRoot = ''
  let stateRoot = ''
  let originalCwd = ''
  let originalOverride: string | undefined
  let releaseExternal: (() => Promise<void>) | undefined

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'harnessed-checkpoint-contention-'))
    stateRoot = join(tempRoot, 'state')
    await mkdir(stateRoot, { recursive: true })
    originalCwd = process.cwd()
    originalOverride = process.env.HARNESSED_ROOT_OVERRIDE
    process.chdir(tempRoot)
    process.env.HARNESSED_ROOT_OVERRIDE = stateRoot
    await activate('auto')
    await mutateSubProgress(() =>
      seedLedger({
        master: 'auto',
        fire: ['discuss', 'plan', 'task-code', 'task-test'].map((sub, index) => ({
          sub,
          mode: 'parallel' as const,
          order: index + 1,
        })),
        skip: [],
      }),
    )
  })

  afterEach(async () => {
    await releaseExternal?.().catch(() => {})
    process.chdir(originalCwd)
    if (originalOverride === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
    else process.env.HARNESSED_ROOT_OVERRIDE = originalOverride
    await rm(tempRoot, { recursive: true, force: true })
  })

  it('waits through real >700ms contention and preserves every update', async () => {
    releaseExternal = await lockfile.lock(stateRoot, {
      stale: 10_000,
      retries: 0,
      lockfilePath: join(stateRoot, '.lock'),
    })
    const subs = ['discuss', 'plan', 'task-code', 'task-test']
    const updates = subs.map((sub) => mutateSubProgress((entries) => markSub(entries, sub, 'done')))
    await new Promise((resolve) => setTimeout(resolve, 1_000))
    await releaseExternal()
    releaseExternal = undefined
    await Promise.all(updates)
    const workflow = await readCurrentWorkflow()
    expect(workflow?.sub_progress?.map(({ sub, status }) => ({ sub, status }))).toEqual(
      subs.map((sub) => ({ sub, status: 'done' })),
    )
  }, 10_000)
})
