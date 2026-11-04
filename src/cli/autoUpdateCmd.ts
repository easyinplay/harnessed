// Phase 84 T3 — `harnessed auto-update on|off|status`.
//
// D9: the consent switch and the status view are a PUBLIC subcommand.
// R15: the preferences file and the status file are resolved through the SAME
// `resolveUpdateReminderRuntime` call the background worker uses — the worker's
// view is the canonical one, so "the user turned it on but it never fires"
// cannot come back. The resolved host + paths are printed for exactly that
// reason: a root mismatch must be visible in the terminal, not guessed at.
// The DEFAULT host is the detected one (`detectPlatform().id`), never a
// hardcoded 'claude' — see `resolveAutoUpdateHostId`.
// R18: `status` merges TWO sources — consent (preferences file) + runtime
// channel on one side, last-run state (status file) on the other.
//
// User-visible strings go through `t()` (T7): `auto_update.*` in
// messages/en.json + messages/zh-Hans.json. The `auto-update status` view
// keeps its fixed English field names — that layout IS the contract (AC6),
// not a translatable sentence.

import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { Argument, type Command } from 'commander'
import {
  resolveUpdateReminderRuntime,
  UPDATE_REMINDER_PREFERENCES_FILE,
} from '../compile/updateReminderEntrypoint.js'
import { t } from '../i18n/index.js'
import { isCompiledRuntime } from '../platform/assetsRoot.js'
import { detectPlatform } from '../platform/platform.js'
import { canonicalStateRoot } from '../platform/stateRoot.js'
import {
  type AutoUpdateStatus,
  autoUpdateStatusPath,
  formatAutoUpdateStatus,
  readAutoUpdateStatus,
} from './lib/autoUpdateStatus.js'
import { readUpdateReminderPreferencesFile } from './lib/updateReminderPreferences.js'

export type AutoUpdateAction = 'on' | 'off' | 'status'

export interface AutoUpdateOptions {
  /** `claude` | `codex`; omitted = auto-detect, like the rest of the CLI. */
  platform?: string
  json?: boolean
}

export interface AutoUpdatePaths {
  hostId: 'claude' | 'codex'
  stateRoot: string
  preferencesPath: string
  statusPath: string
  channel: AutoUpdateStatus['channel']
  installed: string
}

/**
 * The host this invocation targets.
 *
 * `--platform` wins; otherwise the DETECTED host decides (`detectPlatform().id`).
 * The default must never be a hardcoded 'claude': on a codex-only machine a
 * hardcoded default writes the consent into `~/.claude/harnessed` while the
 * codex worker reads `~/.codex/harnessed` — the user turns it on and it never
 * fires.
 */
export function resolveAutoUpdateHostId(platform?: string): 'claude' | 'codex' {
  if (platform !== undefined) {
    if (platform !== 'claude' && platform !== 'codex') {
      throw new Error(t('auto_update.error.unsupported_host', { host: platform }))
    }
    return platform
  }
  const detected = detectPlatform().id
  return detected === 'codex' ? 'codex' : 'claude'
}

/**
 * The runtime channel, narrowed to the status-file channel union.
 *
 * `resolveUpdateReminderRuntime` widens its channel to `string` (it is a plain
 * object literal), but it only ever produces 'binary' | 'bun' | 'npm'. The
 * narrowing is total and needs no cast: an unknown value degrades to 'npm',
 * which is the fail-safe reading (auto-update only self-replaces on the binary
 * channel, so anything else must never look like a binary install).
 */
function toStatusChannel(channel: string): AutoUpdateStatus['channel'] {
  return channel === 'binary' || channel === 'bun' || channel === 'npm' || channel === 'node'
    ? channel
    : 'npm'
}

/**
 * THE state-root seam for this command (R15).
 *
 * Everything the command touches — the preferences file and the status file —
 * is resolved through `canonicalStateRoot(hostId)`, the SAME function the
 * hook, the worker, the owned-state refresh and the codex hook registration
 * use. The command and the worker therefore agree on the root by
 * construction, not by convention.
 *
 * `compiled` mirrors the worker's own flag so the reported channel is the
 * channel the worker would act on (binary vs npm/bun).
 */
export function resolveAutoUpdatePaths(platform?: string): AutoUpdatePaths {
  const hostId = resolveAutoUpdateHostId(platform)
  const runtime = resolveUpdateReminderRuntime({
    args: ['--platform', hostId],
    compiled: isCompiledRuntime(),
  })
  if (!runtime) {
    throw new Error(t('auto_update.error.runtime', { host: hostId }))
  }
  const stateRoot = canonicalStateRoot(hostId)
  return {
    hostId,
    stateRoot,
    preferencesPath: join(stateRoot, UPDATE_REMINDER_PREFERENCES_FILE),
    statusPath: autoUpdateStatusPath(stateRoot),
    channel: toStatusChannel(runtime.identity.channel),
    installed: runtime.installed,
  }
}

/** Atomic write: temp file in the same directory → rename over the target. */
function writePreferences(path: string, document: Record<string, unknown>): void {
  mkdirSync(dirname(path), { recursive: true })
  const tmp = `${path}.${process.pid}.tmp`
  try {
    writeFileSync(tmp, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
    renameSync(tmp, path)
  } catch (error) {
    try {
      rmSync(tmp, { force: true })
    } catch {
      /* best-effort cleanup */
    }
    throw error
  }
}

export interface ConsentOutcome {
  /** The file existed but could not be parsed → it was replaced. */
  corrupt: boolean
  /** The file did not exist → it was created. */
  created: boolean
  /** The reminder consent that is now in force. */
  enabled: boolean
}

/**
 * Read-modify-write the preferences file: every existing key survives, only
 * `autoUpdate` changes. A missing file is created; a corrupt file is replaced
 * (the reader fails closed on it, so nothing could work until it is replaced).
 */
export function setAutoUpdateConsent(path: string, autoUpdate: boolean): ConsentOutcome {
  const file = readUpdateReminderPreferencesFile(path)
  const document = file.document && !Array.isArray(file.document) ? file.document : null
  const base: Record<string, unknown> = document
    ? { schemaVersion: 1, ...document }
    : { schemaVersion: 1, enabled: true }
  writePreferences(path, { ...base, autoUpdate })
  return {
    corrupt: file.preferences.unreadable,
    created: file.missing,
    enabled: base.enabled === true,
  }
}

/**
 * R18 — merge the two sources: consent + channel come from the live
 * preferences file and the runtime; everything else comes from the status
 * file. A missing status file degrades to the synthesized minimal view.
 */
export function mergeAutoUpdateStatus(
  paths: AutoUpdatePaths,
  consent: { autoUpdate: boolean; enabled: boolean },
  status: AutoUpdateStatus | null,
): AutoUpdateStatus {
  const base: AutoUpdateStatus = status ?? {
    schemaVersion: 1,
    consent: { autoUpdate: consent.autoUpdate, enabled: consent.enabled },
    channel: paths.channel,
    installed: paths.installed,
    latest: null,
    state: 'idle',
    progress: { received: 0, total: 0, updatedAt: 0 },
    lastResult: null,
    history: [],
    notice: null,
  }
  return {
    ...base,
    consent: { autoUpdate: consent.autoUpdate, enabled: consent.enabled },
    channel: paths.channel,
  }
}

/** The resolved target, spelled out so a root mismatch is visible at once. */
function printPaths(paths: AutoUpdatePaths): void {
  console.log(t('auto_update.path.host', { host: paths.hostId }))
  console.log(t('auto_update.path.preferences', { path: paths.preferencesPath }))
  console.log(t('auto_update.path.status', { path: paths.statusPath }))
}

function setConsent(paths: AutoUpdatePaths, autoUpdate: boolean): void {
  const outcome = setAutoUpdateConsent(paths.preferencesPath, autoUpdate)
  console.log(t(autoUpdate ? 'auto_update.consent_on' : 'auto_update.consent_off'))
  if (outcome.corrupt) {
    console.log(t('auto_update.preferences_replaced'))
  }
  printPaths(paths)
  if (!outcome.enabled) {
    console.log(t('auto_update.reminder_off_note'))
  }
}

function printStatus(paths: AutoUpdatePaths, json: boolean): void {
  const preferences = readUpdateReminderPreferencesFile(paths.preferencesPath)
  const status = readAutoUpdateStatus(paths.statusPath)
  const merged = mergeAutoUpdateStatus(
    paths,
    {
      autoUpdate: preferences.preferences.autoUpdate,
      enabled: preferences.preferences.enabled,
    },
    status,
  )
  if (json) {
    console.log(
      JSON.stringify(
        {
          ...merged,
          host: paths.hostId,
          preferencesPath: paths.preferencesPath,
          statusPath: paths.statusPath,
        },
        null,
        2,
      ),
    )
    return
  }
  console.log(formatAutoUpdateStatus(merged, Date.now()))
  printPaths(paths)
}

export async function runAutoUpdate(
  action: AutoUpdateAction,
  opts: AutoUpdateOptions,
): Promise<void> {
  let paths: AutoUpdatePaths
  try {
    paths = resolveAutoUpdatePaths(opts.platform)
  } catch (error) {
    console.warn(`[harnessed] ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
    return
  }
  if (action === 'status') {
    printStatus(paths, opts.json === true)
    return
  }
  setConsent(paths, action === 'on')
}

export function registerAutoUpdate(program: Command): void {
  program
    .command('auto-update')
    .description('Turn the background auto-update on or off, or show its consent + last run status')
    .addArgument(
      new Argument('<action>', 'on | off | status').choices(['on', 'off', 'status'] as const),
    )
    .option('--platform <host>', 'target host: claude | codex')
    .option('--json', 'emit the merged status as one JSON object')
    .action(async (action: string, opts: AutoUpdateOptions) => {
      await runAutoUpdate(action as AutoUpdateAction, opts)
    })
}
