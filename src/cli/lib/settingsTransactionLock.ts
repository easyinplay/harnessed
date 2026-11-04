import { AsyncLocalStorage } from 'node:async_hooks'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import lockfile from 'proper-lockfile'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import {
  acquireWithContentionRetry,
  type LockRetryBudget,
  releaseLockIdempotently,
} from '../../platform/lockContention.js'
import { detectPlatform } from '../../platform/platform.js'

const heldLocks = new AsyncLocalStorage<Set<string>>()

/** Retry budget for the settings transaction lock.
 *
 *  Setup writes the host settings from several components at once and every
 *  one of them wants this single lock, so a contender is a QUEUE, not a race:
 *  it has to wait for the components ahead of it. The previous budget
 *  (proper-lockfile's own 20 retries with a 1.3 factor, ~4 s in total) expired
 *  before a queued writer got its turn, and the component then died with
 *  "Lock file is already being held". The budget mirrors the install-ownership
 *  lock's: 30 retries doubling from 250 ms up to a 4 s cap buy roughly a minute
 *  of waiting — long enough for a full setup queue to drain. */
export const SETTINGS_TRANSACTION_LOCK_RETRIES: LockRetryBudget = {
  retries: 30,
  minTimeout: 250,
  maxTimeout: 4000,
}

function lockRoots(hostContext?: HostInstallContext): string[] {
  return [join(hostContext?.nativeHome ?? detectPlatform().homeDir, 'harnessed')]
}

/**
 * The lock directory of the settings transaction lock.
 *
 * proper-lockfile keys its in-process registry by the TARGET path, not by
 * `lockfilePath`. The settings transaction lock and the install-ownership lock
 * used to share one target (the state root), so they shared one registry
 * entry: the first release marked the other lock "already released" (ERELEASED)
 * and left its lock directory behind on disk — every later contender then
 * failed with ELOCKED ("Lock file is already being held"). Locking the lock
 * directory itself gives every lock its own registry entry; the on-disk path
 * is unchanged.
 */
function lockTarget(root: string): string {
  return join(root, '.settings-transaction.lock')
}

async function acquireSettingsLock(root: string): Promise<() => Promise<void>> {
  const target = lockTarget(root)
  return acquireWithContentionRetry(
    () =>
      lockfile.lock(target, {
        stale: 60_000,
        // One attempt only — the retry loop owns the backoff.
        retries: 0,
        lockfilePath: target,
        realpath: false,
      }),
    SETTINGS_TRANSACTION_LOCK_RETRIES,
  )
}

export async function withSettingsTransactionLock<T>(
  hostContext: HostInstallContext | undefined,
  work: () => Promise<T>,
): Promise<T> {
  const active = heldLocks.getStore()
  const roots = lockRoots(hostContext)
  if (roots.every((root) => active?.has(root))) return work()

  const releases: Array<() => Promise<void>> = []
  const next = new Set(active)
  try {
    for (const root of roots) {
      if (next.has(root)) continue
      await mkdir(root, { recursive: true })
      releases.push(await acquireSettingsLock(root))
      next.add(root)
    }
    return await heldLocks.run(next, work)
  } finally {
    for (const release of releases.reverse()) await releaseLockIdempotently(release)
  }
}
