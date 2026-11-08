import fs from 'node:fs'

export const REMINDER_TTL_MS = 24 * 60 * 60 * 1000
export const REMINDER_RETRY_MS = 60 * 60 * 1000
export const REMINDER_MAX_BYTES = 16 * 1024
export const REMINDER_LOCK_STALE_MS = 30_000

/**
 * The CLOSED set of probe failure reasons the cache may record.
 *
 * Diagnosis only — nothing in the reminder decision reads it. Keeping the set
 * closed is what makes the field safe to persist: no free-form text (a URL, a
 * stack trace, a proxy password) can ever reach the cache file.
 */
export const REMINDER_PROBE_FAILURES = [
  'github-rate-limited',
  'github-timeout',
  'github-unavailable',
  'npm-unavailable',
  'invalid-version',
] as const

export type ReminderProbeFailure = (typeof REMINDER_PROBE_FAILURES)[number]

export function isReminderProbeFailure(value: unknown): value is ReminderProbeFailure {
  return typeof value === 'string' && (REMINDER_PROBE_FAILURES as readonly string[]).includes(value)
}

export interface ReminderIdentity {
  host: 'claude' | 'codex'
  runtime: string
  channel: string
  source: string
  fingerprint: string
}

export interface ReminderCache {
  schemaVersion: 1
  identity: ReminderIdentity
  installed: string
  latest: string | null
  state: 'behind' | 'current' | 'ahead' | 'unknown'
  checkedAt: number
  retryAfter: number
  /**
   * The record's `latest` comes from an EARLIER successful observation, not
   * from the probe that produced this record. A failed probe must not erase a
   * known "there is a newer version" fact — it downgrades it to "last known".
   */
  stale?: boolean
  /** Why the last probe failed. Diagnosis only; never part of a decision. */
  lastError?: ReminderProbeFailure
}

export function isReminderVersion(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 128 &&
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value)
  )
}

function parseCache(text: string, identity: ReminderIdentity, now: number): ReminderCache | null {
  const cache = JSON.parse(text) as Partial<ReminderCache> | null
  if (!cache || cache.schemaVersion !== 1 || !cache.identity) return null
  const keys = ['host', 'runtime', 'channel', 'source', 'fingerprint'] as const
  if (identity.host !== 'claude' && identity.host !== 'codex') return null
  for (const key of keys) {
    const value = cache.identity[key]
    if (
      typeof value !== 'string' ||
      !value.length ||
      value.length > 512 ||
      value !== identity[key]
    ) {
      return null
    }
  }
  const { installed, latest, state, checkedAt, retryAfter, stale, lastError } = cache
  if (
    !isReminderVersion(installed) ||
    typeof checkedAt !== 'number' ||
    !Number.isSafeInteger(checkedAt) ||
    checkedAt < 0 ||
    checkedAt > now ||
    typeof retryAfter !== 'number' ||
    !Number.isSafeInteger(retryAfter) ||
    retryAfter < 0
  )
    return null
  // A missing `stale` means "not stale" — old cache files stay readable.
  if (stale !== undefined && typeof stale !== 'boolean') return null
  if (lastError !== undefined && !isReminderProbeFailure(lastError)) return null
  if (state === 'unknown') {
    // Never observed a version: no version, and one retry hour away.
    if (latest !== null || retryAfter !== checkedAt + REMINDER_RETRY_MS) return null
    // A stale record always carries a KNOWN version.
    if (stale === true) return null
  } else {
    if (!['behind', 'current', 'ahead'].includes(state ?? '') || !isReminderVersion(latest))
      return null
    if (stale === true) {
      // A retained observation asks for an EARLY retry (its retryAfter is a
      // deadline after the failed probe), never the 24 h TTL.
      if (retryAfter <= checkedAt) return null
    } else if (retryAfter !== 0) return null
  }
  return {
    schemaVersion: 1,
    identity: { ...identity },
    installed,
    latest: latest ?? null,
    state: state as ReminderCache['state'],
    checkedAt,
    retryAfter,
    ...(stale === true ? { stale: true } : {}),
    ...(lastError !== undefined ? { lastError } : {}),
  }
}

export function readReminderCache(
  cachePath: string,
  identity: ReminderIdentity,
  now = Date.now(),
): ReminderCache | null {
  let descriptor: number | undefined
  try {
    descriptor = fs.openSync(cachePath, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK)
    const stat = fs.fstatSync(descriptor)
    if (!stat.isFile() || stat.size > REMINDER_MAX_BYTES) return null
    const buffer = Buffer.alloc(REMINDER_MAX_BYTES + 1)
    const bytes = fs.readSync(descriptor, buffer, 0, buffer.length, 0)
    if (bytes > REMINDER_MAX_BYTES || bytes < stat.size) return null
    return parseCache(buffer.toString('utf8', 0, bytes), identity, now)
  } catch {
    return null
  } finally {
    if (descriptor !== undefined) {
      try {
        fs.closeSync(descriptor)
      } catch {}
    }
  }
}

export function shouldRefreshReminder(cache: ReminderCache | null, now: number): boolean {
  if (!cache) return true
  if (cache.retryAfter > now) return false
  // A stale record already carries a known version: it only asks for the next
  // probe at its own (short) retryAfter, never at the 24 h TTL.
  if (cache.stale === true) return true
  return cache.state === 'unknown' || now - cache.checkedAt >= REMINDER_TTL_MS
}

export function isReminderWorkerActive(cachePath: string, now: number): boolean {
  try {
    const lock = fs.statSync(`${cachePath}.lock`)
    return now - lock.mtimeMs < REMINDER_LOCK_STALE_MS
  } catch {
    return false
  }
}
