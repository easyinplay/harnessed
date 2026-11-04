// The settings transaction lock must QUEUE, not fail.
//
// `harnessed setup` installs the components in parallel and several of them
// write the host settings, so every writer wants the same transaction lock.
// A contender has to wait for its turn — the previous budget (proper-lockfile's
// own ~4.6 s of retries) expired before a queued writer got its turn, and the
// whole setup then died with "Lock file is already being held".
//
// This test drives the REAL proper-lockfile against a real temp root: no mock
// can reproduce the mkdir-based contention proper-lockfile actually uses.

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { withSettingsTransactionLock } from '../../src/cli/lib/settingsTransactionLock.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor } from '../../src/platform/platform.js'

const homes: string[] = []

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

afterEach(async () => {
  await Promise.all(homes.splice(0).map((home) => rm(home, { recursive: true, force: true })))
})

async function makeContext() {
  const home = await mkdtemp(join(tmpdir(), 'harnessed-settings-transaction-lock-'))
  homes.push(home)
  return createHostInstallContext(claudeDescriptor(home), {
    os: process.platform,
    userHome: home,
  })
}

describe('settings transaction lock contention', () => {
  it('lets a queued writer finish after the holder releases the lock', async () => {
    const context = await makeContext()

    // The holder keeps the lock well past the old ~4.6 s retry budget, so a
    // writer that gives up early fails the whole setup.
    const holder = withSettingsTransactionLock(context, async () => {
      await sleep(6_000)
      return 'holder'
    })
    // Let the holder take the lock before the contender queues behind it.
    await sleep(100)

    const queued = withSettingsTransactionLock(context, async () => 'queued')

    await expect(Promise.all([holder, queued])).resolves.toEqual(['holder', 'queued'])
  })
})
