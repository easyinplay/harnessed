import { randomUUID } from 'node:crypto'
import { realpathSync, statSync } from 'node:fs'
import asyncFs from 'node:fs/promises'
import { dirname, join } from 'node:path'
import lockfile from 'proper-lockfile'
import {
  type AutoUpdateChannel,
  type AutoUpdateConsent,
  type AutoUpdateDeps,
  isAutoUpdateConsentGranted,
  mapSelfUpdateFailureReason,
  runAutoUpdate,
} from './lib/autoUpdate.js'
import {
  autoUpdateStatusPath,
  readAutoUpdateStatus,
  writeAutoUpdateStatus,
} from './lib/autoUpdateStatus.js'
import {
  isReminderProbeFailure,
  isReminderVersion,
  REMINDER_LOCK_STALE_MS,
  REMINDER_MAX_BYTES,
  REMINDER_RETRY_MS,
  type ReminderCache,
  type ReminderIdentity,
  type ReminderProbeFailure,
  readReminderCache,
  shouldRefreshReminder,
} from './lib/updateReminderCache.js'
import { readUpdateReminderPreferencesFile } from './lib/updateReminderPreferences.js'
import { compareVersions } from './lib/version-check.js'

export interface UpdateReminderWorkerOptions {
  cachePath: string
  identity: ReminderIdentity
  installed: string
  observe: (signal: AbortSignal) => Promise<{
    latest: string | null
    /** Why the probe failed — a closed-set value, diagnosis only. */
    reason?: ReminderProbeFailure | null
  }>
  now?: () => number
  /** The preferences file — the worker reads the auto-update consent itself (R11). */
  preferencesPath?: string
  /** The canonical state root of this host (R15). Defaults to the cache dir. */
  stateRoot?: string
}

/** The reminder channel names the runtime knows; anything else is not binary. */
function autoUpdateChannel(channel: string): AutoUpdateChannel {
  if (channel === 'binary' || channel === 'npm' || channel === 'bun' || channel === 'node') {
    return channel
  }
  return 'npm'
}

/**
 * The failure reason to record when a probe produced no version.
 *
 * The recorded value set is closed, so a reason outside it is replaced by the
 * channel's generic one: the binary channel talks to GitHub first, the other
 * channels talk to the npm registry.
 */
function probeFailure(
  reason: ReminderProbeFailure | null | undefined,
  channel: string,
): ReminderProbeFailure {
  if (isReminderProbeFailure(reason)) return reason
  return channel === 'binary' ? 'github-unavailable' : 'npm-unavailable'
}

/**
 * Bytes already on disk for the resumable download fragment of `version`.
 *
 * The fragment is version-stable and PID-free on purpose (R4): a later
 * process must be able to continue a dropped download. Its existence with a
 * non-zero size is what makes a failed attempt RESUMABLE instead of a
 * complete failure (R5).
 */
function resumeFragmentBytes(execPath: string, version: string): number {
  try {
    return statSync(join(dirname(execPath), `.harnessed-update-${version}.part`)).size
  } catch {
    return 0
  }
}

/**
 * The consent view of the preferences file, with the schema version the
 * canonical reader does not surface.
 *
 * Both pre-existing readers require `schemaVersion === 1` on top of the field
 * values; the auto-update consent follows the same rule (fail-closed on an
 * unknown schema).
 */
function readAutoUpdateConsent(preferencesPath: string): AutoUpdateConsent {
  const { preferences, document } = readUpdateReminderPreferencesFile(preferencesPath)
  const schemaVersion = typeof document?.schemaVersion === 'number' ? document.schemaVersion : null
  return { ...preferences, schemaVersion }
}

/**
 * One automatic-update round (Phase 84 T5).
 *
 * The worker reads the auto-update consent ITSELF (R11): the compiled worker
 * entrypoint rejects every argv flag it does not know, so a new flag would
 * silently kill the whole reminder chain instead of enabling it.
 *
 * The worker runs detached with `stdio: 'ignore'` — every report goes into
 * the status file, never to stdout.
 */
async function runAutomaticUpdate(
  options: UpdateReminderWorkerOptions,
  targetVersion: string,
): Promise<void> {
  const preferencesPath = options.preferencesPath
  if (!preferencesPath) return
  // The consent is INDEPENDENT of the reminder consent: a silenced reminder
  // must not revoke an auto-update consent (and vice versa). It is still
  // fail-closed on an unknown schema version.
  if (!isAutoUpdateConsentGranted(readAutoUpdateConsent(preferencesPath))) return

  // The heavy auto-update modules are loaded LAZILY: the reminder chain is the
  // primary job of this worker, and a broken (or half-written) auto-update
  // engine must not take the reminder down with it.
  const [{ captureHostInstallContext }, engine, { withUpdateLock }] = await Promise.all([
    import('../platform/hostInstallContext.js'),
    import('./lib/selfUpdateBinary.js'),
    import('./lib/updateLock.js'),
  ])

  // R21: the host is EXPLICIT — the platform must not guess it, or the
  // bin-backup of a swapped binary lands in another root.
  const context = captureHostInstallContext({ hostId: options.identity.host })
  const stateRoot = options.stateRoot ?? dirname(options.cachePath)
  const statusPath = autoUpdateStatusPath(stateRoot)

  const deps: AutoUpdateDeps = {
    readPreferences: () => readAutoUpdateConsent(preferencesPath),
    channel: () => autoUpdateChannel(options.identity.channel),
    installedVersion: () => options.installed,
    context: () => context,
    // The lock target is the exec path — `updateTarget().target` for the
    // binary channel is exactly `realpath(process.execPath)`
    // (updateCoordinator.ts:233-239). It is spelled out here instead of
    // importing the coordinator, which would drag the i18n and the repair
    // machinery into the always-resident reminder worker bundle.
    target: () => realpathSync(process.execPath),
    execDirWritable: (execPath) => engine.execDirWritable(execPath),
    withLock: async (input, work) =>
      withUpdateLock({ stateRoot: input.stateRoot, target: input.target }, async () => work()),
    selfUpdate: async () => {
      const outcome = await engine.runBinarySelfUpdate(engine.realSelfUpdateDeps(context), {})
      if (outcome.status !== 'error') return outcome
      // R5: a download failure that left bytes on disk is RESUMABLE — the next
      // session continues the download instead of starting over, so it must
      // not burn the one-shot quota of the 24 h window.
      const progressed =
        mapSelfUpdateFailureReason(outcome.message) === 'network' &&
        resumeFragmentBytes(realpathSync(process.execPath), targetVersion) > 0
      return { ...outcome, progressed }
    },
    handover: async (input) => {
      // R17: the new binary must write the `notice` into the status file the
      // WORKER used — it is not allowed to derive the path itself, or the
      // notice lands in another root. `handoverAutoUpdate` owns that
      // contract (env var + the `from` record + the spawn), so there is
      // exactly ONE implementation of it.
      const { handoverAutoUpdate } = await import('./lib/autoUpdateHandover.js')
      const result = await handoverAutoUpdate(
        { from: input.from, to: input.to, statusPath: input.statusPath },
        { context, execPath: realpathSync(process.execPath) },
      )
      return { ok: result.ok, error: result.error }
    },
    statusPath: () => statusPath,
    readStatus: () => readAutoUpdateStatus(statusPath),
    writeStatus: (status) => writeAutoUpdateStatus(statusPath, status),
    preferencesPath: () => preferencesPath,
    now: () => Date.now(),
    // The worker has no stdout (stdio: 'ignore') — the status file is the
    // report channel.
    log: () => {},
  }

  await runAutoUpdate(deps, { targetVersion })
}

export async function runUpdateReminderWorker(options: UpdateReminderWorkerOptions): Promise<0> {
  let release: (() => Promise<void>) | undefined
  let temporary: string | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  const controller = new AbortController()
  let owned = false
  // The version an automatic update would target — set once the observation
  // says the installed version is behind.
  let autoUpdateTarget: string | null = null
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
    // The cache read BEFORE the probe is the only witness of what was known:
    // a failed probe must not erase a known "a newer version exists" fact.
    const previous = readReminderCache(options.cachePath, options.identity, now())
    if (!shouldRefreshReminder(previous, now())) return 0
    let latest: string | null = null
    let failure: ReminderProbeFailure | null = null
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
      else failure = probeFailure(observation.reason, options.identity.channel)
    } catch {
      failure = probeFailure(null, options.identity.channel)
    }
    // A failed probe downgrades a known observation to "last known" instead of
    // erasing it. Without any previous observation the record stays `unknown`
    // with the existing one hour backoff.
    let stale = false
    if (
      latest === null &&
      previous !== null &&
      previous.state !== 'unknown' &&
      previous.latest !== null
    ) {
      latest = previous.latest
      stale = true
    }
    const checkedAt = now()
    const state = latest === null ? 'unknown' : compareVersions(options.installed, latest)
    // Only a FRESH observation may drive the automatic update: a retained
    // version may already be outdated, and the update flow downloads from the
    // same GitHub source that just failed.
    if (state === 'behind' && latest !== null && !stale) autoUpdateTarget = latest
    const result: ReminderCache = {
      schemaVersion: 1,
      identity: { ...options.identity },
      installed: options.installed,
      latest,
      state,
      checkedAt,
      // A stale record asks for the next probe after ONE hour, not after the
      // 24 h TTL: the network may come back at any time.
      retryAfter: state === 'unknown' || stale ? checkedAt + REMINDER_RETRY_MS : 0,
      ...(stale ? { stale: true } : {}),
      ...(failure ? { lastError: failure } : {}),
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
    // The automatic update runs AFTER the reminder cache lock is released: it
    // takes the (different) update lock and may run for minutes — holding
    // the cache lock that long would block every other reminder worker.
    if (autoUpdateTarget) {
      try {
        await runAutomaticUpdate(options, autoUpdateTarget)
      } catch {
        // The orchestration records its own failures in the status file; the
        // worker must never crash on them.
      }
    }
  }
  return 0
}
