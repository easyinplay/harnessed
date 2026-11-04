import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import lockfile from 'proper-lockfile'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import {
  acquireWithContentionRetry,
  type LockRetryBudget,
  releaseLockIdempotently,
} from '../../platform/lockContention.js'

export { isLockContention } from '../../platform/lockContention.js'

/** Retry budget for the ownership lock.
 *
 *  Setup installs the base components in parallel and every one of them wants
 *  this single lock, so a contender is a QUEUE, not a race: it has to wait for
 *  the components ahead of it, and each of those holds the lock for the whole
 *  duration of its install (seconds for an npm install). The previous budget
 *  (5 retries / 25 ms base, ~0.6 s in total) made every queued contender throw
 *  ELOCKED before its turn came, which surfaced as "setup failed, run it again".
 *  30 retries doubling from 250 ms up to a 4 s cap buy roughly a minute of
 *  waiting — long enough for a full install queue to drain. */
export const INSTALL_OWNERSHIP_LOCK_RETRIES: LockRetryBudget = {
  retries: 30,
  minTimeout: 250,
  maxTimeout: 4000,
}

/**
 * The lock directory of the ownership lock.
 *
 * proper-lockfile keys its in-process registry by the TARGET path, not by
 * `lockfilePath`. The ownership lock and the settings transaction lock used to
 * share one target (the state root), so they shared one registry entry: the
 * first release marked the other lock "already released" (ERELEASED) and left
 * its lock directory behind on disk — every later contender then failed with
 * ELOCKED ("Lock file is already being held"). Locking the lock directory
 * itself gives every lock its own registry entry; the on-disk path is
 * unchanged.
 */
function lockTarget(root: string): string {
  return join(root, '.ownership.lock')
}

/**
 * Acquire the lock, retrying ONLY on contention.
 *
 * proper-lockfile's own `retries` option re-runs the attempt on ANY error —
 * a missing state root, a permission problem, a bad path — so a permanent
 * failure would silently burn the whole budget (over a minute) before it
 * surfaced. Doing the backoff here keeps the retry scoped to the only error
 * that is worth retrying: somebody else holds the lock right now.
 */
async function acquireOwnershipLock(root: string): Promise<() => Promise<void>> {
  const target = lockTarget(root)
  return acquireWithContentionRetry(
    () =>
      lockfile.lock(target, {
        lockfilePath: target,
        realpath: false,
        stale: 10 * 60 * 1000,
        // One attempt only — the retry loop owns the backoff.
        retries: 0,
      }),
    INSTALL_OWNERSHIP_LOCK_RETRIES,
  )
}

export async function withInstallOwnershipLock<T>(
  context: HostInstallContext,
  work: () => Promise<T>,
): Promise<T> {
  const root = context.platform.stateRoot
  await mkdir(root, { recursive: true })
  const release = await acquireOwnershipLock(root)
  try {
    return await work()
  } finally {
    await releaseLockIdempotently(release)
  }
}
