import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { withInstallOwnershipLock } from '../../src/installers/lib/installOwnershipLock.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor } from '../../src/platform/platform.js'

const homes: string[] = []

afterEach(async () => {
  await Promise.all(homes.splice(0).map((home) => rm(home, { recursive: true, force: true })))
})

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
})
