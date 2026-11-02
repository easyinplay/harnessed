import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import lockfile from 'proper-lockfile'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'

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
export const INSTALL_OWNERSHIP_LOCK_RETRIES = {
  retries: 30,
  minTimeout: 250,
  maxTimeout: 4000,
}

/** proper-lockfile signals contention with ELOCKED ("Lock file is already being
 *  held"). Nothing was written by the loser, so the failure is retryable. */
export function isLockContention(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | undefined)?.code === 'ELOCKED'
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/** Delay before attempt N+1: doubles from minTimeout, capped at maxTimeout. */
function backoffDelay(attempt: number): number {
  return Math.min(
    INSTALL_OWNERSHIP_LOCK_RETRIES.minTimeout * 2 ** attempt,
    INSTALL_OWNERSHIP_LOCK_RETRIES.maxTimeout,
  )
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
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await lockfile.lock(root, {
        lockfilePath: join(root, '.ownership.lock'),
        realpath: false,
        stale: 10 * 60 * 1000,
        // One attempt only — the loop below owns the backoff.
        retries: 0,
      })
    } catch (error) {
      if (!isLockContention(error) || attempt >= INSTALL_OWNERSHIP_LOCK_RETRIES.retries) {
        throw error
      }
      await sleep(backoffDelay(attempt))
    }
  }
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
    await release()
  }
}
