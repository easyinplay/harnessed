import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HostInstallContext } from '../../src/platform/hostInstallContext.js'

const lockState = vi.hoisted(() => {
  const acquiredPaths: string[] = []
  const heldPaths = new Set<string>()
  const waiters = new Map<string, Array<() => void>>()

  const lock = vi.fn(async (_root: string, options: { lockfilePath: string }) => {
    const lockPath = options.lockfilePath
    if (heldPaths.has(lockPath)) {
      await new Promise<void>((resolve) => {
        const queued = waiters.get(lockPath) ?? []
        queued.push(resolve)
        waiters.set(lockPath, queued)
      })
    }

    heldPaths.add(lockPath)
    acquiredPaths.push(lockPath)
    return async () => {
      heldPaths.delete(lockPath)
      waiters.get(lockPath)?.shift()?.()
    }
  })

  return { acquiredPaths, heldPaths, lock, waiters }
})

const detectedPlatform = vi.hoisted(() => ({
  homeDir: 'detected-home/.claude',
  stateRoot: 'ambient-override',
}))

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('proper-lockfile', () => ({
  default: { lock: lockState.lock },
}))

vi.mock('../../src/platform/platform.js', () => ({
  detectPlatform: () => detectedPlatform,
}))

import { withSettingsTransactionLock } from '../../src/cli/lib/settingsTransactionLock.js'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function hostContext(nativeHome: string, stateRoot: string): HostInstallContext {
  return {
    hostId: 'claude',
    os: process.platform,
    userHome: join(nativeHome, '..'),
    nativeHome,
    platform: {
      id: 'claude',
      homeDir: nativeHome,
      stateRoot,
      settingsPath: join(nativeHome, 'settings.json'),
      skillsDir: join(nativeHome, 'skills'),
      commandsDir: join(nativeHome, 'commands'),
      pluginsRegistry: join(nativeHome, 'plugins', 'installed_plugins.json'),
      mcpConfigPath: join(nativeHome, '..', '.claude.json'),
      supportsEnvKeyWrite: true,
      sessionIdEnv: 'CLAUDE_CODE_SESSION_ID',
    },
  }
}

beforeEach(() => {
  lockState.acquiredPaths.length = 0
  lockState.heldPaths.clear()
  lockState.waiters.clear()
  lockState.lock.mockClear()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('withSettingsTransactionLock', () => {
  it('serializes and reenters through one native-home lock despite different state roots', async () => {
    const nativeHome = join('homes', 'shared', '.claude')
    const firstContext = hostContext(nativeHome, join('state', 'first'))
    const secondContext = hostContext(nativeHome, join('state', 'second'))
    const firstEntered = deferred()
    const releaseFirst = deferred()
    let concurrentEntered = false

    const first = withSettingsTransactionLock(firstContext, async () => {
      await withSettingsTransactionLock(secondContext, async () => {
        firstEntered.resolve()
      })
      await releaseFirst.promise
    })
    await firstEntered.promise

    const concurrent = withSettingsTransactionLock(secondContext, async () => {
      concurrentEntered = true
    })
    await new Promise((resolve) => setImmediate(resolve))

    const expectedLockPath = join(nativeHome, 'harnessed', '.settings-transaction.lock')
    expect(lockState.acquiredPaths).toEqual([expectedLockPath])
    expect(concurrentEntered).toBe(false)

    releaseFirst.resolve()
    await Promise.all([first, concurrent])

    expect(lockState.acquiredPaths).toEqual([expectedLockPath, expectedLockPath])
  })

  it('allows different native homes to hold independent locks concurrently', async () => {
    const releaseFirst = deferred()
    const firstEntered = deferred()
    const secondEntered = deferred()
    const firstHome = join('homes', 'first', '.claude')
    const secondHome = join('homes', 'second', '.claude')

    const first = withSettingsTransactionLock(
      hostContext(firstHome, join('state', 'first')),
      async () => {
        firstEntered.resolve()
        await releaseFirst.promise
      },
    )
    await firstEntered.promise

    const second = withSettingsTransactionLock(
      hostContext(secondHome, join('state', 'second')),
      async () => {
        secondEntered.resolve()
      },
    )
    await secondEntered.promise

    expect(lockState.acquiredPaths).toEqual([
      join(firstHome, 'harnessed', '.settings-transaction.lock'),
      join(secondHome, 'harnessed', '.settings-transaction.lock'),
    ])

    releaseFirst.resolve()
    await Promise.all([first, second])
  })

  it('uses the detected native home when context is absent, ignoring the state-root override', async () => {
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', detectedPlatform.stateRoot)

    await withSettingsTransactionLock(undefined, async () => undefined)

    expect(lockState.acquiredPaths).toEqual([
      join(detectedPlatform.homeDir, 'harnessed', '.settings-transaction.lock'),
    ])
  })
})
