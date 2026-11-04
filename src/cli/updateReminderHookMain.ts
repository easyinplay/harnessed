// src/cli/updateReminderHookMain.ts — the SessionStart hook.
//
// Two independent jobs (Phase 84):
//
//   1. the REMINDER — "a new version is available" (reminder consent). The
//      text is only printed when the reminder consent is on.
//   2. the UPDATE NOTICE — "harnessed updated X -> Y" (the auto-update
//      consent). The notice is written by the NEW binary during the handover
//      and printed here EXACTLY once: after the print the notice is stamped
//      as consumed, so the next session stays quiet. The hook runs on every
//      session start — a notice that is never consumed would re-print the
//      whole changelog excerpt forever.
//
// A half-written notice (empty `to` — the handover has not finished filling
// it in) is never printed and never consumed: it stays pending as a
// diagnostic (R25).

import type { SpawnOptions } from 'node:child_process'
import childProcess from 'node:child_process'
import {
  consumeAutoUpdateNotice,
  formatAutoUpdateNotice,
  isPrintableAutoUpdateNotice,
} from './lib/autoUpdateNotice.js'
import { hasResumableAutoUpdateWork, readAutoUpdateStatus } from './lib/autoUpdateStatus.js'
import {
  isReminderWorkerActive,
  type ReminderIdentity,
  readReminderCache,
  shouldRefreshReminder,
} from './lib/updateReminderCache.js'

interface DetachedChild {
  once(event: 'error', listener: (error: Error) => void): unknown
  unref(): void
}

export interface UpdateReminderHookOptions {
  cachePath: string
  identity: ReminderIdentity
  /** The reminder consent — may the "update available" line be printed? */
  enabled: boolean
  /** The auto-update consent — may the background worker run? */
  autoUpdate?: boolean
  /** The status file of this host — the pending notice lives in it. */
  statusPath?: string
  worker: { executable: string; args: string[] }
  now?: () => number
  write?: (text: string) => void
  spawn?: (executable: string, args: string[], options: SpawnOptions) => DetachedChild
}

export async function runUpdateReminderHook(options: UpdateReminderHookOptions): Promise<0> {
  try {
    const now = (options.now ?? Date.now)()
    const write =
      options.write ??
      ((text: string) => {
        process.stdout.write(text)
      })

    // 1. the update notice — printed once, then consumed.
    //
    // The print comes BEFORE the consume: a notice that was printed but not
    // stamped is printed again next session (annoying), while a notice that
    // was stamped but not printed is lost forever (worse).
    //
    // The same read tells the hook whether a download is waiting to be
    // RESUMED (D2) — bytes on disk from a stalled round must not wait for the
    // reminder cache's 24 h TTL before the next attempt.
    let resumable = false
    if (options.statusPath) {
      try {
        const status = readAutoUpdateStatus(options.statusPath)
        const notice = status?.notice ?? null
        if (notice && isPrintableAutoUpdateNotice(notice)) {
          write(`${formatAutoUpdateNotice(notice)}\n`)
          consumeAutoUpdateNotice(options.statusPath, now)
        }
        resumable = hasResumableAutoUpdateWork(status)
      } catch {
        /* a broken status file must not break the session start */
      }
    }

    // 2. the reminder text.
    const cache = readReminderCache(options.cachePath, options.identity, now)
    if (options.enabled && cache?.state === 'behind') {
      try {
        write(
          `Harnessed update available: ${cache.installed} -> ${cache.latest}. Run /harnessed-update.\n`,
        )
      } catch {}
    }

    // 3. the worker — needed by EITHER consent: the reminder refresh AND the
    // automatic update both run inside it.
    //
    // `resumable` adds the second wake-up reason: a round that left bytes on
    // disk is continued in THIS session, not in the next 24 h window (R5).
    if (
      (options.enabled || options.autoUpdate) &&
      (shouldRefreshReminder(cache, now) || resumable) &&
      !isReminderWorkerActive(options.cachePath, now)
    ) {
      const spawn = options.spawn ?? childProcess.spawn
      const child = spawn(options.worker.executable, options.worker.args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        shell: false,
      })
      child.once('error', () => {})
      child.unref()
    }
  } catch {}
  return 0
}
