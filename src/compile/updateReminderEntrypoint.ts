import { createHash } from 'node:crypto'
import { closeSync, constants, fstatSync, openSync, readSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from '../../package.json' with { type: 'json' }
import { runUpdateReminderHook } from '../cli/updateReminderHookMain.js'

export const UPDATE_REMINDER_OPERATION = 'update-reminder'
export const UPDATE_REMINDER_WORKER_OPERATION = 'update-reminder-worker'
export const UPDATE_REMINDER_PREFERENCES_FILE = 'update-reminder-preferences.json'
const BINARY_SOURCE = 'https://api.github.com/repos/easyinplay/harnessed/releases/latest'

export interface UpdateReminderEntryOptions {
  args?: readonly string[]
  compiled?: boolean
}

export function resolveUpdateReminderRuntime(options: UpdateReminderEntryOptions = {}) {
  const args = [...(options.args ?? process.argv.slice(2))]
  if (args[0] === UPDATE_REMINDER_OPERATION || args[0] === UPDATE_REMINDER_WORKER_OPERATION)
    args.shift()
  let host: 'claude' | 'codex' = 'claude'
  let explicitStateRoot: string | undefined
  let platformSpecified = false
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index]
    const value = args[index + 1]
    if (
      !flag ||
      value === undefined ||
      [flag, value].some((argument) =>
        Array.from(argument).some((character) => character < ' ' || character === '\x7f'),
      )
    )
      return null
    if (flag === '--platform') {
      if (platformSpecified || (value !== 'claude' && value !== 'codex')) return null
      platformSpecified = true
      host = value
    } else if (flag === '--state-root') {
      if (explicitStateRoot !== undefined || !isAbsolute(value)) return null
      explicitStateRoot = resolve(value)
    } else return null
  }
  const nativeHome = resolve(
    (host === 'codex' ? process.env.CODEX_HOME?.trim() : process.env.CLAUDE_CONFIG_DIR) ||
      join(homedir(), host === 'codex' ? '.codex' : '.claude'),
  )
  const stateRoot =
    explicitStateRoot ??
    resolve(process.env.HARNESSED_ROOT_OVERRIDE || join(nativeHome, 'harnessed'))
  const channel = options.compiled ? 'binary' : process.versions.bun ? 'bun' : 'npm'
  const source = channel === 'binary' ? BINARY_SOURCE : `${channel}:harnessed`
  const fingerprint = createHash('sha256')
    .update(
      JSON.stringify([
        host === 'codex' ? stateRoot : nativeHome,
        process.execPath,
        pkg.version,
        source,
      ]),
    )
    .digest('hex')
  return {
    stateRoot,
    nativeHome,
    cachePath: join(stateRoot, `update-reminder-${host}.json`),
    preferencesPath: join(stateRoot, UPDATE_REMINDER_PREFERENCES_FILE),
    installed: pkg.version,
    identity: {
      host,
      runtime: options.compiled ? 'binary' : process.versions.bun ? 'bun' : 'node',
      channel,
      source,
      fingerprint,
    },
    worker: {
      executable: process.execPath,
      args: [
        options.compiled
          ? UPDATE_REMINDER_WORKER_OPERATION
          : join(dirname(fileURLToPath(import.meta.url)), 'harnessed-update-reminder-worker.mjs'),
        '--platform',
        host,
        ...(explicitStateRoot ? ['--state-root', explicitStateRoot] : []),
      ],
    },
  }
}

function reminderEnabled(path: string): boolean {
  let descriptor: number | undefined
  try {
    descriptor = openSync(path, constants.O_RDONLY | constants.O_NONBLOCK)
    const info = fstatSync(descriptor)
    if (!info.isFile() || info.size > 1024) return false
    const buffer = Buffer.alloc(1025)
    const bytes = readSync(descriptor, buffer, 0, buffer.length, 0)
    if (bytes > 1024 || bytes < info.size) return false
    const value = JSON.parse(buffer.toString('utf8', 0, bytes)) as unknown
    return (
      typeof value === 'object' &&
      value !== null &&
      'schemaVersion' in value &&
      value.schemaVersion === 1 &&
      'enabled' in value &&
      value.enabled === true
    )
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'ENOENT'
  } finally {
    if (descriptor !== undefined) {
      try {
        closeSync(descriptor)
      } catch {}
    }
  }
}

export async function runUpdateReminderEntrypoint(
  options: UpdateReminderEntryOptions = {},
): Promise<0> {
  try {
    const runtime = resolveUpdateReminderRuntime(options)
    if (!runtime || !reminderEnabled(runtime.preferencesPath)) return 0
    if (!statSync(runtime.stateRoot).isDirectory()) return 0
    return await runUpdateReminderHook({ ...runtime, enabled: true })
  } catch {}
  return 0
}

export async function runUpdateReminderWorkerEntrypoint(
  options: UpdateReminderEntryOptions = {},
): Promise<0> {
  try {
    const runtime = resolveUpdateReminderRuntime(options)
    if (!runtime || !reminderEnabled(runtime.preferencesPath)) return 0
    const { runUpdateReminderWorker } = await import('../cli/updateReminderWorkerMain.js')
    return await runUpdateReminderWorker({
      ...runtime,
      observe: async (signal) => {
        if (runtime.identity.channel === 'binary') {
          const response = await fetch(BINARY_SOURCE, {
            signal,
            headers: { 'user-agent': `harnessed/${pkg.version}` },
          })
          if (!response.ok) return { latest: null }
          const value = (await response.json()) as { tag_name?: unknown }
          return {
            latest: typeof value.tag_name === 'string' ? value.tag_name.replace(/^v/, '') : null,
          }
        }
        const { fetchLatestBunVersion, fetchLatestNpmVersion } = await import(
          '../cli/lib/version-check.js'
        )
        return {
          latest: await (runtime.identity.channel === 'bun'
            ? fetchLatestBunVersion()
            : fetchLatestNpmVersion()),
        }
      },
    })
  } catch {}
  return 0
}
