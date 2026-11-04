/**
 * Shared contention handling for the locks that queue behind each other.
 *
 * Two locks in this codebase serialize on the same state root
 * (`~/.claude/harnessed`): the install-ownership lock
 * (`src/installers/lib/installOwnershipLock.ts`) and the settings transaction
 * lock (`src/cli/lib/settingsTransactionLock.ts`). `setup` installs the
 * components in parallel, so a contender is a QUEUE, not a race — it has to
 * wait for the components ahead of it, and each of those holds the lock for
 * the whole duration of its install.
 *
 * The bookkeeping lives here so both locks answer contention the same way:
 * the ownership lock already got this treatment (issue #37) and the settings
 * transaction lock still failed the whole setup with "Lock file is already
 * being held" / "Lock is already released".
 */

/** Retry budget for a contended lock acquisition. */
export interface LockRetryBudget {
  /** How many times the acquisition is re-attempted after the first try. */
  readonly retries: number
  /** Delay before the first retry, doubled on every further attempt. */
  readonly minTimeout: number
  /** Upper bound for a single retry delay. */
  readonly maxTimeout: number
}

/** proper-lockfile signals contention with ELOCKED ("Lock file is already being
 *  held"). Nothing was written by the loser, so the failure is retryable. */
export function isLockContention(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | undefined)?.code === 'ELOCKED'
}

/** proper-lockfile signals "this lock is not (or no longer) in our hands" with
 *  ERELEASED ("Lock is already released") or ENOTACQUIRED ("Lock is not
 *  acquired/owned by you"). The lock is gone either way — releasing it is a
 *  no-op, not a failure of the work that ran under it. */
export function isLockNotHeld(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code
  return code === 'ERELEASED' || code === 'ENOTACQUIRED'
}

/** Delay before attempt N+1: doubles from minTimeout, capped at maxTimeout. */
export function lockBackoffDelay(attempt: number, budget: LockRetryBudget): number {
  return Math.min(budget.minTimeout * 2 ** attempt, budget.maxTimeout)
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/**
 * Acquire a lock, retrying ONLY on contention.
 *
 * proper-lockfile's own `retries` option re-runs the attempt on ANY error —
 * a missing state root, a permission problem, a bad path — so a permanent
 * failure would silently burn the whole budget (over a minute) before it
 * surfaced. Doing the backoff here keeps the retry scoped to the only error
 * that is worth retrying: somebody else holds the lock right now.
 */
export async function acquireWithContentionRetry<T>(
  acquire: () => Promise<T>,
  budget: LockRetryBudget,
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await acquire()
    } catch (error) {
      if (!isLockContention(error) || attempt >= budget.retries) throw error
      await sleep(lockBackoffDelay(attempt, budget))
    }
  }
}

/**
 * Release a lock, tolerating the "not in our hands" outcomes.
 *
 * proper-lockfile throws ERELEASED when the lock was already released and
 * ENOTACQUIRED when the lock does not belong to us. Both mean the lock is
 * gone — the work that ran under it is done, so a release failure must not
 * turn a completed transaction into a failed one. Any other release error is
 * a real fault and stays visible.
 */
export async function releaseLockIdempotently(release: () => Promise<void>): Promise<void> {
  try {
    await release()
  } catch (error) {
    if (!isLockNotHeld(error)) throw error
  }
}
