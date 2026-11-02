// The ownership lock must retry CONTENTION only.
//
// proper-lockfile's own `retries` option re-runs the attempt on ANY error, so
// a larger budget turns a permanent failure (a missing state root, a
// permission problem) into a minute of silent waiting before it surfaces.
// The backoff therefore lives in `withInstallOwnershipLock` and re-attempts
// only ELOCKED.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { withInstallOwnershipLock } from '../../src/installers/lib/installOwnershipLock.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor } from '../../src/platform/platform.js'

const { lock } = vi.hoisted(() => ({ lock: vi.fn() }))
vi.mock('proper-lockfile', () => ({ default: { lock } }))
vi.mock('node:fs/promises', () => ({ mkdir: vi.fn(async () => undefined) }))

function context() {
  return createHostInstallContext(claudeDescriptor('/fake/home'), {
    os: process.platform,
    userHome: '/fake/home',
  })
}

function failure(code: string): Error {
  return Object.assign(new Error(`lock failed: ${code}`), { code })
}

beforeEach(() => {
  lock.mockReset()
})

describe('ownership lock retry scope', () => {
  it('does not retry a failure that is not contention', async () => {
    lock.mockRejectedValueOnce(failure('EACCES'))

    const started = Date.now()
    await expect(withInstallOwnershipLock(context(), async () => 'never')).rejects.toThrow(
      'lock failed: EACCES',
    )

    expect(lock).toHaveBeenCalledTimes(1)
    // A permanent error must surface immediately, not after the whole budget.
    expect(Date.now() - started).toBeLessThan(1_000)
  })

  it('retries while the lock is held by somebody else', async () => {
    lock.mockRejectedValueOnce(failure('ELOCKED')).mockResolvedValueOnce(async () => () => {})

    await expect(withInstallOwnershipLock(context(), async () => 'acquired')).resolves.toBe(
      'acquired',
    )

    expect(lock).toHaveBeenCalledTimes(2)
  })
})
