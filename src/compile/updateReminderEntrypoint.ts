import { createHash } from 'node:crypto'
import { statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from '../../package.json' with { type: 'json' }
import { autoUpdateStatusPath } from '../cli/lib/autoUpdateStatus.js'
import { readUpdateReminderPreferencesFile } from '../cli/lib/updateReminderPreferences.js'
import { runUpdateReminderHook } from '../cli/updateReminderHookMain.js'
import { canonicalStateRoot } from '../platform/stateRoot.js'

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
  // R15: ONE state-root derivation for every consumer. An explicit
  // `--state-root` still wins — it is an explicit instruction.
  const stateRoot = explicitStateRoot ?? canonicalStateRoot(host)
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
    // The auto-update status file of THIS host — the hook reads the pending
    // update notice from it, the worker writes the run state into it.
    statusPath: autoUpdateStatusPath(stateRoot),
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

/**
 * The two consents of the preferences file, in the shape the chain needs.
 *
 * They are INDEPENDENT (T1/R3): silencing the reminder must not revoke an
 * auto-update consent, and an auto-update consent must not resurrect the
 * reminder. Both fail closed on an unreadable file and on an unknown schema
 * version — the same rule the two pre-existing readers used.
 */
interface ReminderConsents {
  /** The "a new version is available" reminder may print. */
  enabled: boolean
  /** The background worker may replace the binary itself. */
  autoUpdate: boolean
}

function readConsents(path: string): ReminderConsents {
  // The single canonical reader owns the file semantics; this gate only adds
  // the schema-version check the local readers used to do inline.
  const { preferences, missing, document } = readUpdateReminderPreferencesFile(path)
  if (preferences.unreadable) return { enabled: false, autoUpdate: false }
  // No preferences file at all → the reminder is opt-out, so it stays on;
  // the auto-update consent is opt-in, so it stays off.
  if (missing) return { enabled: true, autoUpdate: false }
  const known = document?.schemaVersion === 1
  return { enabled: known && preferences.enabled, autoUpdate: known && preferences.autoUpdate }
}

/**
 * Does ANY consent ask for work?
 *
 * The whole chain (hook, worker) runs when EITHER consent is on. Gating it on
 * the reminder consent alone was the bug that made "auto-update on" a switch
 * that never fires: a user who silenced the reminder kept an auto-update
 * consent that nothing acted on.
 */
function anyConsent(consents: ReminderConsents): boolean {
  return consents.enabled || consents.autoUpdate
}

export async function runUpdateReminderEntrypoint(
  options: UpdateReminderEntryOptions = {},
): Promise<0> {
  try {
    const runtime = resolveUpdateReminderRuntime(options)
    if (!runtime) return 0
    const consents = readConsents(runtime.preferencesPath)
    if (!anyConsent(consents)) return 0
    if (!statSync(runtime.stateRoot).isDirectory()) return 0
    return await runUpdateReminderHook({
      ...runtime,
      enabled: consents.enabled,
      autoUpdate: consents.autoUpdate,
    })
  } catch {}
  return 0
}

export async function runUpdateReminderWorkerEntrypoint(
  options: UpdateReminderEntryOptions = {},
): Promise<0> {
  try {
    const runtime = resolveUpdateReminderRuntime(options)
    if (!runtime) return 0
    const consents = readConsents(runtime.preferencesPath)
    if (!anyConsent(consents)) return 0
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
