import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  INSTALL_OWNERSHIP_LOCK_RETRIES,
  isLockContention,
  withInstallOwnershipLock,
} from '../../src/installers/lib/installOwnershipLock.js'
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
  const home = await mkdtemp(join(tmpdir(), 'harnessed-install-ownership-lock-'))
  homes.push(home)
  return createHostInstallContext(claudeDescriptor(home), {
    os: process.platform,
    userHome: home,
  })
}

describe('install ownership lock', () => {
  it('serializes snapshot through receipt commit for one host state root', async () => {
    const home = await mkdtemp(join(tmpdir(), 'harnessed-install-ownership-lock-'))
    homes.push(home)
    const context = createHostInstallContext(claudeDescriptor(home), {
      os: process.platform,
      userHome: home,
    })
    const events: string[] = []
    let releaseFirst: (() => void) | undefined
    let markFirstStarted: (() => void) | undefined
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    const firstStarted = new Promise<void>((resolve) => {
      markFirstStarted = resolve
    })

    const first = withInstallOwnershipLock(context, async () => {
      events.push('first-start')
      markFirstStarted?.()
      await firstGate
      events.push('first-end')
    })
    await firstStarted
    const second = withInstallOwnershipLock(context, async () => {
      events.push('second-start')
    })
    await new Promise((resolve) => setTimeout(resolve, 25))
    expect(events).toEqual(['first-start'])

    releaseFirst?.()
    await Promise.all([first, second])
    expect(events).toEqual(['first-start', 'first-end', 'second-start'])
  })

  it('acquires the lock after a competing holder releases it ~600 ms later', async () => {
    const context = await makeContext()
    const events: string[] = []

    const holder = withInstallOwnershipLock(context, async () => {
      events.push('holder-start')
      await sleep(600)
      events.push('holder-end')
    })
    // Give the holder the lock before the contender queues behind it.
    await sleep(50)

    const acquired = await withInstallOwnershipLock(context, async () => {
      events.push('waiter')
      return 'acquired'
    })
    await holder

    expect(acquired).toBe('acquired')
    expect(events).toEqual(['holder-start', 'holder-end', 'waiter'])
  })

  it('survives a queued contender whose turn comes more than a second later', async () => {
    const context = await makeContext()

    // The real queue: setup installs the base components in parallel and they
    // all want the SAME ownership lock, so a contender waits for the components
    // ahead of it. A ~1.2 s queue is what the old 0.6 s retry budget could not
    // survive — it gave up with ELOCKED before the contender's turn came.
    const holder = withInstallOwnershipLock(context, async () => {
      await sleep(1200)
    })
    await sleep(50)

    const acquired = await withInstallOwnershipLock(context, async () => 'acquired')
    await holder

    expect(acquired).toBe('acquired')
  })

  it('keeps a retry budget that outlasts a queued install', () => {
    // The retry module doubles the delay per attempt and caps it at maxTimeout.
    let worstCaseWait = 0
    for (let attempt = 0; attempt < INSTALL_OWNERSHIP_LOCK_RETRIES.retries; attempt += 1) {
      worstCaseWait += Math.min(
        INSTALL_OWNERSHIP_LOCK_RETRIES.minTimeout * 2 ** attempt,
        INSTALL_OWNERSHIP_LOCK_RETRIES.maxTimeout,
      )
    }
    expect(worstCaseWait).toBeGreaterThanOrEqual(60_000)
  })
})

describe('isLockContention', () => {
  it('recognises the proper-lockfile contention code', () => {
    expect(
      isLockContention(
        Object.assign(new Error('Lock file is already being held'), { code: 'ELOCKED' }),
      ),
    ).toBe(true)
  })

  it('does not claim unrelated failures', () => {
    expect(isLockContention(new Error('spawn failed'))).toBe(false)
    expect(isLockContention(Object.assign(new Error('nope'), { code: 'EACCES' }))).toBe(false)
    expect(isLockContention(undefined)).toBe(false)
  })
})
