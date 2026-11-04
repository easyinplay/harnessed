// src/cli/lib/autoUpdate.ts — Phase 84 T5: the auto-update ORCHESTRATION.
//
// This module decides WHETHER the background worker may replace the binary,
// takes the mutual-exclusion lock, runs the self-update and records what
// happened. It performs no side effect of its own: every one of them
// (preferences, status file, lock, download, handover) goes through an
// injected dependency, so the whole decision tree is testable without a
// network, without a filesystem outside a tmpdir and without a real binary.
//
// The decision order IS the contract (CONTEXT.md R1/R2/R5/R6/R7):
//
//   1. consent       → off ⇒ stop, and do NOT write the status file (AC1)
//   2. channel       → only the binary channel may replace itself (AC5 / D3)
//   3. failure quota → a complete failure for this version blocks 24 h (R5)
//   4. writability   → the exec dir must be writable, BEFORE the lock (R6)
//   5. the lock      → mutual exclusion with the manual update (R1 / R2)
//   6. self-update   → download → verify → swap → handover (D4 / D8)
//   7. CRITICAL      → record it and turn the consent off (R7)
//
// Why the writability pre-flight comes BEFORE the lock: the lock's anchor is
// created in the exec directory too (updateLock.ts:118-127). A read-only exec
// directory therefore fails the lock with EACCES — and `acquireUpdateLock`
// only handles ELOCKED, so the error escapes, gets swallowed by the worker's
// `catch {}` and leaves ZERO trace. The pre-flight turns that silent failure
// into a diagnosable `exec-dir-readonly` (R6).

import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import {
  AUTO_UPDATE_RESUMABLE_MARKER,
  AUTO_UPDATE_STATUS_PATH_ENV,
  type AutoUpdateNotice,
  type AutoUpdateReason,
  type AutoUpdateResult,
  type AutoUpdateState,
  type AutoUpdateStatus,
  appendAutoUpdateHistory,
} from './autoUpdateStatus.js'
import { readUpdateReminderPreferencesFile } from './updateReminderPreferences.js'

/** How long ONE complete failure blocks the next automatic attempt (D6). */
export const AUTO_UPDATE_FAILURE_QUOTA_MS = 24 * 60 * 60 * 1000

/**
 * R17: the env var that carries the ABSOLUTE status-file path to the new
 * binary. The new binary must write the `notice` into THAT file — it is not
 * allowed to derive the path itself, or the notice lands in another root.
 *
 * The name lives in the status module (one source of truth); it is re-exported
 * here because the worker imports it from this module.
 */
/**
 * Marker on the recorded message of a failure that left a RESUME POINT on
 * disk. A resumable failure is NOT a complete failure (R5): the next session
 * continues the download instead of starting over, so it must not consume the
 * 24 h quota. `AutoUpdateResult` has no dedicated field for the distinction,
 * so the marker is what survives the round trip through the status file.
 *
 * It lives in the status module (one source of truth) and is re-exported here
 * because the worker imports it from this module.
 */
export { AUTO_UPDATE_RESUMABLE_MARKER, AUTO_UPDATE_STATUS_PATH_ENV }

export type AutoUpdateChannel = 'binary' | 'npm' | 'bun' | 'node'

/**
 * Why a round ended the way it did. Wider than the status file's
 * `AutoUpdateReason` on purpose: the two reasons that never reach the status
 * file (`consent-off` writes nothing at all, `rate-limited` is silent) and
 * the two that only exist in the outcome (`current`, `rate-limited`) have no
 * place in the persisted reason enum.
 */
export type AutoUpdateOutcomeReason = AutoUpdateReason | 'consent-off' | 'rate-limited' | 'current'

export interface AutoUpdateOutcome {
  status: 'updated' | 'skipped' | 'error'
  reason?: AutoUpdateOutcomeReason
  message?: string
  /** The version this round was about. */
  version: string
}

/**
 * What the self-update engine reports back. Structurally compatible with
 * `SelfUpdateOutcome` from `selfUpdateBinary.ts` — the two extra flags are
 * optional, so the engine's own outcome satisfies this type as-is.
 */
export type AutoUpdateSelfUpdateOutcome =
  | { status: 'updated'; from: string; to: string }
  | { status: 'current'; version: string }
  | { status: 'checked'; installed: string; latest: string; cmp: string }
  | { status: 'dry-run'; steps: string[] }
  | { status: 'refused'; reason: string }
  | {
      status: 'error'
      message: string
      /** The swap failed AND the rollback failed → no binary at the exec path. */
      critical?: boolean
      /** The attempt left a resume point on disk (bytes arrived). */
      progressed?: boolean
    }

export interface AutoUpdateHandoverInput {
  from: string
  to: string
  /**
   * The ABSOLUTE path of the status file. The handover writes the `notice`
   * into THAT file — it must never derive the path itself, or the notice
   * lands in another root (R17).
   */
  statusPath: string
}

export interface AutoUpdateHandoverResult {
  ok: boolean
  error?: string
}

/**
 * The consent view the orchestration decides on.
 *
 * `schemaVersion` is part of it on purpose: the canonical reader reports the
 * FIELD values only, while both pre-existing readers additionally require
 * `schemaVersion === 1`. A preferences file written by a future version
 * (`schemaVersion: 2`) must not be read as a granted consent — that would be
 * fail-open on a file this code does not understand.
 */
export interface AutoUpdateConsent {
  enabled: boolean
  autoUpdate: boolean
  unreadable: boolean
  /** The preferences file's `schemaVersion`; null when it is missing/unreadable. */
  schemaVersion: number | null
}

/**
 * Is the auto-update consent granted?
 *
 * Fail-closed: only a file with the known schema version AND a strict
 * `autoUpdate: true` grants it (R3 / R22).
 */
export function isAutoUpdateConsentGranted(consent: AutoUpdateConsent): boolean {
  return consent.schemaVersion === 1 && consent.autoUpdate === true
}

export interface AutoUpdateDeps {
  /**
   * The canonical consent view (R3). `autoUpdate` is independent of
   * `enabled`, but it is NOT enough on its own: see
   * {@link isAutoUpdateConsentGranted} for the schema-version gate.
   */
  readPreferences: () => AutoUpdateConsent
  channel: () => AutoUpdateChannel
  installedVersion: () => string
  /** The host install context — its `platform.stateRoot` roots the lock. */
  context: () => HostInstallContext
  /** The update target (the exec path for the binary channel). */
  target: () => string
  /** Writability probe for the exec directory (R6). */
  execDirWritable: (execPath: string) => boolean | Promise<boolean>
  /**
   * The mutual-exclusion gate. The target MUST be the exec path: the lock's
   * anchor lives in the exec directory, so the same lock excludes a manual
   * `harnessed update` AND the other host's worker (R1 / R2).
   */
  withLock: <T>(
    input: { stateRoot: string; target: string },
    work: () => Promise<T>,
  ) => Promise<{ status: 'completed'; value: T } | { status: 'busy' }>
  /** The self-update engine (download → verify → smoke → swap). */
  selfUpdate: () => Promise<AutoUpdateSelfUpdateOutcome>
  /** The handover to the new binary (D8). R8/R14/R17 wiring lands in T6. */
  handover: (input: AutoUpdateHandoverInput) => Promise<AutoUpdateHandoverResult>
  /** The ABSOLUTE path of the status file. */
  statusPath: () => string
  readStatus: () => AutoUpdateStatus | null
  writeStatus: (status: AutoUpdateStatus) => void
  /** The preferences file — the consent write-back of the CRITICAL path. */
  preferencesPath: () => string
  now: () => number
  log: (line: string) => void
}

interface StatusPatch {
  state?: AutoUpdateState
  result?: AutoUpdateResult
  notice?: AutoUpdateNotice
}

/**
 * Map a self-update failure message onto the status file's reason enum.
 *
 * Explicit, not heuristic: the engine reports the stage in its message, and
 * the four stages that matter (integrity / smoke / swap / handover) each have
 * their own vocabulary. Everything else is a transport problem, which the
 * enum calls `network`.
 */
export function mapSelfUpdateFailureReason(message: string): AutoUpdateReason {
  const text = message.toLowerCase()
  if (
    text.includes('integrity') ||
    text.includes('signature') ||
    text.includes('sha256') ||
    text.includes('ed25519')
  )
    return 'integrity'
  if (text.includes('smoke') || text.includes('--version')) return 'smoke'
  if (
    text.includes('swap') ||
    text.includes('rollback') ||
    text.includes('rename') ||
    text.includes('binary aside')
  )
    return 'swap'
  if (text.includes('handover') || text.includes('owned-state')) return 'handover'
  return 'network'
}

/** The one failure that leaves no binary at the exec path (R7). */
function isCriticalOutcome(outcome: { message: string; critical?: boolean }): boolean {
  // The engine flags it; the message prefix is the belt-and-braces fallback
  // for an engine build that only words it.
  return outcome.critical === true || outcome.message.startsWith('CRITICAL')
}

/**
 * Turn the auto-update consent OFF, preserving every other key of the
 * preferences file (R7). A full overwrite would silently drop keys another
 * writer owns.
 */
export function disableAutoUpdateConsent(path: string): void {
  const { document } = readUpdateReminderPreferencesFile(path)
  const next: Record<string, unknown> = document
    ? { ...document }
    : { schemaVersion: 1, enabled: true }
  next.autoUpdate = false
  mkdirSync(dirname(path), { recursive: true })
  // Atomic: the file is read by the reminder hook on every session start, and
  // a half-written JSON there reads as "corrupt" → both consents off.
  const temporary = `${path}.${process.pid}.tmp`
  try {
    writeFileSync(temporary, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
    renameSync(temporary, path)
  } catch (error) {
    try {
      rmSync(temporary, { force: true })
    } catch {
      // best-effort cleanup
    }
    throw error
  }
}

/**
 * Has this version already burned its one complete failure inside the quota
 * window? Only a COMPLETE failure counts (R5): a failure that left a resume
 * point is marked and skipped.
 */
function quotaBlocked(status: AutoUpdateStatus | null, version: string, now: number): boolean {
  if (!status) return false
  const entries = status.lastResult ? [...status.history, status.lastResult] : status.history
  return entries.some((entry) => {
    if (entry.version !== version) return false
    if (entry.status !== 'failed') return false
    if ((entry.message ?? '').startsWith(AUTO_UPDATE_RESUMABLE_MARKER)) return false
    return Math.abs(now - entry.at) < AUTO_UPDATE_FAILURE_QUOTA_MS
  })
}

function baseStatus(
  deps: AutoUpdateDeps,
  preferences: { enabled: boolean; autoUpdate: boolean },
  channel: AutoUpdateChannel,
  installed: string,
  version: string,
): AutoUpdateStatus {
  const now = deps.now()
  return {
    schemaVersion: 1,
    consent: { autoUpdate: preferences.autoUpdate, enabled: preferences.enabled },
    channel,
    installed,
    latest: version,
    state: 'idle',
    progress: { received: 0, total: 0, updatedAt: now },
    lastResult: null,
    history: [],
    notice: null,
  }
}

/**
 * Write the worker's own fields into the status file.
 *
 * The file is re-read before every write and only the worker's fields are
 * replaced, so the `notice` the new binary owns is never wiped (R16). The
 * write itself is atomic (autoUpdateStatus.writeAutoUpdateStatus).
 */
function persist(
  deps: AutoUpdateDeps,
  preferences: { enabled: boolean; autoUpdate: boolean },
  channel: AutoUpdateChannel,
  installed: string,
  version: string,
  patch: StatusPatch,
): AutoUpdateStatus {
  const existing = deps.readStatus()
  const base = existing ?? baseStatus(deps, preferences, channel, installed, version)
  let next: AutoUpdateStatus = {
    ...base,
    consent: { autoUpdate: preferences.autoUpdate, enabled: preferences.enabled },
    channel,
    installed,
    latest: version,
    state: patch.state ?? base.state,
  }
  if (patch.result) next = appendAutoUpdateHistory(next, patch.result)
  if (patch.notice) next = { ...next, notice: patch.notice }
  deps.writeStatus(next)
  return next
}

/**
 * One automatic-update round.
 *
 * `targetVersion` is the version the release observation reported — it is the
 * quota key (host + version) and the version every record is written for.
 */
export async function runAutoUpdate(
  deps: AutoUpdateDeps,
  options: { targetVersion: string },
): Promise<AutoUpdateOutcome> {
  const version = options.targetVersion
  const preferences = deps.readPreferences()

  // 1. CONSENT (D2 / R3 / R22). Fail-closed: the known schema version AND a
  //    strict `autoUpdate: true`. The consent is INDEPENDENT of `enabled`:
  //    silencing the reminder must not revoke an auto-update consent (and
  //    vice versa). AC1: nothing is written when the consent is off — not
  //    even the status file.
  if (!isAutoUpdateConsentGranted(preferences)) {
    return { status: 'skipped', reason: 'consent-off', version }
  }

  const channel = deps.channel()
  const installed = deps.installedVersion()

  // 2. CHANNEL (D3). Only the binary channel can replace itself; the npm
  //    and bun channels keep reminding and nothing else.
  if (channel !== 'binary') {
    persist(deps, preferences, channel, installed, version, {
      state: 'skipped',
      result: { version, status: 'skipped', reason: 'npm-channel', at: deps.now() },
    })
    return { status: 'skipped', reason: 'npm-channel', version }
  }

  // 3. FAILURE QUOTA (D6 / R5). Checked before anything expensive: a
  //    version that already burned its one complete failure is not retried
  //    for 24 h. The check runs inside the lock further down, so the same
  //    round cannot slip through a concurrent one — this early check is the
  //    cheap "don't even try" gate.
  if (quotaBlocked(deps.readStatus(), version, deps.now())) {
    deps.log(`auto-update: ${version} already failed once in the last 24h — skipping`)
    return { status: 'skipped', reason: 'rate-limited', version }
  }

  const execPath = deps.target()

  // 4. WRITABILITY PRE-FLIGHT (R6). BEFORE the lock — see the file header.
  if (!(await deps.execDirWritable(execPath))) {
    const message = `the directory of ${execPath} is not writable — the binary cannot be replaced`
    persist(deps, preferences, channel, installed, version, {
      state: 'failed',
      result: { version, status: 'failed', reason: 'exec-dir-readonly', message, at: deps.now() },
    })
    return { status: 'error', reason: 'exec-dir-readonly', message, version }
  }

  // 5. THE LOCK (R1 / R2). The target is the exec path, so this is the SAME
  //    lock the manual `harnessed update` takes: an auto-update can never
  //    interleave its renames with a manual one, and the other host's worker
  //    is excluded as well (the anchor lives in the exec directory, which is
  //    host-independent).
  const stateRoot = deps.context().platform.stateRoot
  let locked: { status: 'completed'; value: AutoUpdateOutcome } | { status: 'busy' }
  try {
    locked = await deps.withLock({ stateRoot, target: execPath }, () =>
      runLockedRound(deps, {
        preferences,
        channel,
        installed,
        version,
      }),
    )
  } catch (error) {
    // The anchor could not be created (the exec directory is read-only) —
    // exactly the case the pre-flight is meant to catch, but a race or an
    // exotic errno must still leave a trace instead of being swallowed.
    const message = error instanceof Error ? error.message : String(error)
    persist(deps, preferences, channel, installed, version, {
      state: 'failed',
      result: {
        version,
        status: 'failed',
        reason: 'exec-dir-readonly',
        message: `could not take the update lock: ${message}`,
        at: deps.now(),
      },
    })
    return { status: 'error', reason: 'exec-dir-readonly', message, version }
  }

  if (locked.status === 'busy') {
    persist(deps, preferences, channel, installed, version, {
      state: 'skipped',
      result: { version, status: 'skipped', reason: 'busy', at: deps.now() },
    })
    return { status: 'skipped', reason: 'busy', version }
  }
  return locked.value
}

/** The part of the round that runs WHILE the lock is held. */
async function runLockedRound(
  deps: AutoUpdateDeps,
  input: {
    preferences: { enabled: boolean; autoUpdate: boolean }
    channel: AutoUpdateChannel
    installed: string
    version: string
  },
): Promise<AutoUpdateOutcome> {
  const { preferences, channel, installed, version } = input

  // The quota is re-checked inside the lock: two workers (or a worker and a
  // manual update) may have raced between the early check and the lock.
  if (quotaBlocked(deps.readStatus(), version, deps.now())) {
    return { status: 'skipped', reason: 'rate-limited', version }
  }

  persist(deps, preferences, channel, installed, version, { state: 'downloading' })

  let outcome: AutoUpdateSelfUpdateOutcome
  try {
    outcome = await deps.selfUpdate()
  } catch (error) {
    // An unexpected throw is still a failure that must leave a trace.
    const message = error instanceof Error ? error.message : String(error)
    persist(deps, preferences, channel, installed, version, {
      state: 'failed',
      result: { version, status: 'failed', reason: 'network', message, at: deps.now() },
    })
    return { status: 'error', reason: 'network', message, version }
  }

  if (outcome.status === 'updated') {
    const from = outcome.from
    const to = outcome.to
    persist(deps, preferences, channel, installed, version, {
      state: 'updated',
      result: { version: to, status: 'updated', at: deps.now() },
    })
    // R17: the notice skeleton is written BEFORE the handover, so the new
    // binary only has to fill in the changelog and the restart hint.
    //
    // The skeleton stays PENDING: `to` (and the changelog, and the restart
    // hint) are empty until the handover fills them in. A half-written
    // notice must never be printed by the hook — an empty `to` is what
    // marks it as "not ready yet".
    persist(deps, preferences, channel, installed, version, {
      notice: { from, to: '', changelog: '', restart: '', at: deps.now(), consumedAt: 0 },
    })
    const handover = await deps.handover({ from, to, statusPath: deps.statusPath() })
    if (!handover.ok) {
      // The binary IS the new version — the update is not rolled back. The
      // handover failure is recorded on top of it.
      const message = handover.error ?? 'the owned-state handover failed'
      persist(deps, preferences, channel, installed, version, {
        state: 'updated',
        result: { version: to, status: 'updated', reason: 'handover', message, at: deps.now() },
      })
      return { status: 'updated', reason: 'handover', message, version: to }
    }
    persist(deps, preferences, channel, installed, version, { state: 'updated' })
    return { status: 'updated', version: to }
  }

  if (outcome.status === 'current') {
    // Not an error and not a failure: the binary is already at the target.
    persist(deps, preferences, channel, installed, version, {
      state: 'skipped',
      result: { version, status: 'skipped', at: deps.now() },
    })
    return { status: 'skipped', reason: 'current', version }
  }

  if (outcome.status === 'refused') {
    // The engine refuses to self-replace an npm-managed binary — that is a
    // channel problem, not a transport one.
    const message = outcome.reason
    persist(deps, preferences, channel, installed, version, {
      state: 'skipped',
      result: { version, status: 'skipped', reason: 'npm-channel', message, at: deps.now() },
    })
    return { status: 'skipped', reason: 'npm-channel', message, version }
  }

  if (outcome.status === 'checked' || outcome.status === 'dry-run') {
    // Neither is reachable from the automatic path (the worker never asks for
    // a check-only or a dry-run run), but a silent skip beats a crash.
    persist(deps, preferences, channel, installed, version, {
      state: 'skipped',
      result: { version, status: 'skipped', at: deps.now() },
    })
    return { status: 'skipped', reason: 'current', version }
  }

  // ── the failure path ──
  const critical = isCriticalOutcome(outcome)
  const reason: AutoUpdateReason = critical
    ? 'swap-critical'
    : mapSelfUpdateFailureReason(outcome.message)
  // A failure that left a resume point is NOT a complete failure (R5): the
  // next session continues the download instead of starting over.
  const resumable = outcome.progressed === true
  const message = resumable ? `${AUTO_UPDATE_RESUMABLE_MARKER} ${outcome.message}` : outcome.message
  persist(deps, preferences, channel, installed, version, {
    state: 'failed',
    result: { version, status: 'failed', reason, message, at: deps.now() },
  })
  if (critical) {
    // R7: the binary is gone from the exec path. Turn the consent off so the
    // next session does not hit the same wall — the message carries the
    // manual restore command.
    try {
      disableAutoUpdateConsent(deps.preferencesPath())
    } catch (error) {
      deps.log(
        `auto-update: could not turn the auto-update consent off: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }
  return { status: 'error', reason, message: outcome.message, version }
}
