import type { SpawnOptions } from 'node:child_process'
import childProcess from 'node:child_process'
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
  enabled: boolean
  worker: { executable: string; args: string[] }
  now?: () => number
  write?: (text: string) => void
  spawn?: (executable: string, args: string[], options: SpawnOptions) => DetachedChild
}

export async function runUpdateReminderHook(options: UpdateReminderHookOptions): Promise<0> {
  try {
    if (!options.enabled) return 0
    const now = (options.now ?? Date.now)()
    const cache = readReminderCache(options.cachePath, options.identity, now)
    if (cache?.state === 'behind') {
      try {
        const write =
          options.write ??
          ((text: string) => {
            process.stdout.write(text)
          })
        write(
          `Harnessed update available: ${cache.installed} -> ${cache.latest}. Run /harnessed-update.\n`,
        )
      } catch {}
    }
    if (shouldRefreshReminder(cache, now) && !isReminderWorkerActive(options.cachePath, now)) {
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
