import { randomUUID } from 'node:crypto'
import asyncFs from 'node:fs/promises'
import { dirname } from 'node:path'
import lockfile from 'proper-lockfile'
import {
  isReminderVersion,
  REMINDER_LOCK_STALE_MS,
  REMINDER_MAX_BYTES,
  REMINDER_RETRY_MS,
  type ReminderCache,
  type ReminderIdentity,
  readReminderCache,
  shouldRefreshReminder,
} from './lib/updateReminderCache.js'
import { compareVersions } from './lib/version-check.js'

export interface UpdateReminderWorkerOptions {
  cachePath: string
  identity: ReminderIdentity
  installed: string
  observe: (signal: AbortSignal) => Promise<{ latest: string | null }>
  now?: () => number
}

export async function runUpdateReminderWorker(options: UpdateReminderWorkerOptions): Promise<0> {
  let release: (() => Promise<void>) | undefined
  let temporary: string | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  const controller = new AbortController()
  let owned = false
  try {
    const now = options.now ?? Date.now
    if (!isReminderVersion(options.installed)) return 0
    await asyncFs.mkdir(dirname(options.cachePath), { recursive: true })
    release = await lockfile.lock(options.cachePath, {
      realpath: false,
      retries: 0,
      stale: REMINDER_LOCK_STALE_MS,
      update: 10_000,
      onCompromised: () => {
        owned = false
        controller.abort()
      },
    })
    owned = true
    const cache = readReminderCache(options.cachePath, options.identity, now())
    if (!shouldRefreshReminder(cache, now())) return 0
    let latest: string | null = null
    try {
      const observation = await Promise.race([
        options.observe(controller.signal),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort()
            reject(new Error('timeout'))
          }, 8000)
        }),
      ])
      if (isReminderVersion(observation.latest)) latest = observation.latest
    } catch {}
    const checkedAt = now()
    const state = latest === null ? 'unknown' : compareVersions(options.installed, latest)
    const result: ReminderCache = {
      schemaVersion: 1,
      identity: { ...options.identity },
      installed: options.installed,
      latest,
      state,
      checkedAt,
      retryAfter: state === 'unknown' ? checkedAt + REMINDER_RETRY_MS : 0,
    }
    const text = `${JSON.stringify(result)}\n`
    if (!owned || Buffer.byteLength(text) > REMINDER_MAX_BYTES) return 0
    temporary = `${options.cachePath}.${randomUUID()}.tmp`
    await asyncFs.writeFile(temporary, text, { encoding: 'utf8', flag: 'wx', mode: 0o600 })
    if (owned) await asyncFs.rename(temporary, options.cachePath)
  } catch {
  } finally {
    if (timer) clearTimeout(timer)
    controller.abort()
    if (temporary) await asyncFs.unlink(temporary).catch(() => {})
    if (release) await release().catch(() => {})
  }
  return 0
}
