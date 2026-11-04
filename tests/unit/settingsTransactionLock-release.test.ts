// Releasing the settings transaction lock must be idempotent.
//
// proper-lockfile throws ERELEASED ("Lock is already released") when the lock
// was already released and ENOTACQUIRED ("Lock is not acquired/owned by you")
// when the lock does not belong to this process. Both mean the lock is gone —
// the work under it is DONE. A release failure that escapes the `finally`
// turns a successful settings write into a failed component, which is how
// `harnessed setup` aborted with "settings transaction lock failed: Lock is
// already released".

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HostInstallContext } from '../../src/platform/hostInstallContext.js'

const releaseError = vi.hoisted(() => ({ current: null as NodeJS.ErrnoException | null }))

vi.mock('proper-lockfile', () => ({
  default: {
    lock: vi.fn(async () => async () => {
      if (releaseError.current) throw releaseError.current
    }),
  },
}))

import { withSettingsTransactionLock } from '../../src/cli/lib/settingsTransactionLock.js'

const homes: string[] = []

function failure(code: string, message: string): NodeJS.ErrnoException {
  return Object.assign(new Error(message), { code })
}

function hostContext(nativeHome: string): HostInstallContext {
  return {
    hostId: 'claude',
    os: process.platform,
    userHome: join(nativeHome, '..'),
    nativeHome,
    platform: {
      id: 'claude',
      homeDir: nativeHome,
      stateRoot: join(nativeHome, 'harnessed'),
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
  releaseError.current = null
})

afterEach(async () => {
  await Promise.all(homes.splice(0).map((home) => rm(home, { recursive: true, force: true })))
})

describe('settings transaction lock release', () => {
  it('keeps the work result when the release reports the lock was already released', async () => {
    const home = await mkdtemp(join(tmpdir(), 'harnessed-settings-release-'))
    homes.push(home)
    releaseError.current = failure('ERELEASED', 'Lock is already released')

    await expect(
      withSettingsTransactionLock(hostContext(home), async () => 'written'),
    ).resolves.toBe('written')
  })

  it('keeps the work result when the release reports the lock was never ours', async () => {
    const home = await mkdtemp(join(tmpdir(), 'harnessed-settings-release-'))
    homes.push(home)
    releaseError.current = failure('ENOTACQUIRED', 'Lock is not acquired/owned by you')

    await expect(
      withSettingsTransactionLock(hostContext(home), async () => 'written'),
    ).resolves.toBe('written')
  })

  it('still surfaces a release failure that is not about the lock being gone', async () => {
    const home = await mkdtemp(join(tmpdir(), 'harnessed-settings-release-'))
    homes.push(home)
    releaseError.current = failure('EACCES', 'permission denied')

    await expect(
      withSettingsTransactionLock(hostContext(home), async () => 'written'),
    ).rejects.toThrow('permission denied')
  })
})
