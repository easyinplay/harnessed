// src/cli/lib/autoUpdateStatus.ts — Phase 84 / T2: the persistent auto-update
// status file (R12) plus the `harnessed auto-update status` output contract.
//
// Status file: `<stateRoot>/auto-update-status.json` (schemaVersion 1).
// The file is user-writable, so EVERY field read back from disk is validated
// defensively: an unreadable / malformed / wrong-version file degrades to
// `null` instead of poisoning the render path.
//
// Writes are atomic: temp file in the SAME directory → rename over the target.
// A reader therefore sees either the old file or the complete new one.

import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const AUTO_UPDATE_STATUS_FILE = 'auto-update-status.json'

/**
 * The environment variable that carries the ABSOLUTE path of the status file
 * to the new binary during the owned-state handover (R17).
 *
 * The path travels in the environment because the new binary must NOT derive
 * it: a derived path that lands one directory over makes the update notice
 * silently disappear, and the user is then told about an update they never
 * received.
 */
export const AUTO_UPDATE_STATUS_PATH_ENV = 'HARNESSED_AUTO_UPDATE_STATUS_PATH'

/**
 * The marker on the recorded message of a failure that left a RESUME POINT on
 * disk. A resumable failure is NOT a complete failure (R5): the next session
 * continues the download instead of starting over, so it must not consume the
 * 24 h quota.
 *
 * The marker lives here — in the module that owns the status file's
 * vocabulary — because both sides need it: the writer (the orchestration) and
 * the reader (the SessionStart hook, which decides whether to wake the worker
 * for a resume).
 */
export const AUTO_UPDATE_RESUMABLE_MARKER = '[resumable]'

/** History entries kept in the status file (D12). */
export const AUTO_UPDATE_HISTORY_LIMIT = 10

export type AutoUpdateState =
  | 'idle'
  | 'downloading'
  | 'verifying'
  | 'swapping'
  | 'handover'
  | 'updated'
  | 'failed'
  | 'skipped'

export type AutoUpdateReason =
  | 'network'
  | 'timeout'
  | 'http'
  | 'parse'
  | 'publishing'
  | 'integrity'
  | 'smoke'
  | 'swap'
  | 'swap-critical'
  | 'exec-dir-readonly'
  | 'handover'
  | 'handover-trust-pending'
  | 'busy'
  | 'npm-channel'

export const AUTO_UPDATE_STATES: readonly AutoUpdateState[] = [
  'idle',
  'downloading',
  'verifying',
  'swapping',
  'handover',
  'updated',
  'failed',
  'skipped',
]

export const AUTO_UPDATE_REASONS: readonly AutoUpdateReason[] = [
  'network',
  'timeout',
  'http',
  'parse',
  'publishing',
  'integrity',
  'smoke',
  'swap',
  'swap-critical',
  'exec-dir-readonly',
  'handover',
  'handover-trust-pending',
  'busy',
  'npm-channel',
]

const CHANNELS = ['binary', 'npm', 'bun', 'node'] as const
const RESULT_STATUSES = ['updated', 'failed', 'skipped'] as const
const IN_PROGRESS_STATES: readonly AutoUpdateState[] = [
  'downloading',
  'verifying',
  'swapping',
  'handover',
]

export interface AutoUpdateProgress {
  received: number
  total: number
  updatedAt: number
}

export interface AutoUpdateResult {
  version: string
  status: 'updated' | 'failed' | 'skipped'
  reason?: AutoUpdateReason
  message?: string
  at: number
}

export interface AutoUpdateNotice {
  from: string
  to: string
  changelog: string
  restart: string
  at: number
  /**
   * When the notice was printed (R16). 0 = never printed.
   *
   * The parser MUST keep this field: the notice is consumed exactly once —
   * the SessionStart hook stamps it after printing — and a parser that drops
   * unknown keys would wipe the stamp and print the notice again, forever.
   */
  consumedAt: number
}

export interface AutoUpdateStatus {
  schemaVersion: 1
  consent: { autoUpdate: boolean; enabled: boolean }
  channel: 'binary' | 'npm' | 'bun' | 'node'
  installed: string
  latest: string | null
  state: AutoUpdateState
  progress: AutoUpdateProgress
  lastResult: AutoUpdateResult | null
  history: AutoUpdateResult[]
  notice: AutoUpdateNotice | null
}

/** `<stateRoot>/auto-update-status.json` */
export function autoUpdateStatusPath(stateRoot: string): string {
  return join(stateRoot, AUTO_UPDATE_STATUS_FILE)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidDateMs(value: unknown): value is number {
  return isFiniteNumber(value) && !Number.isNaN(new Date(value).getTime())
}

function parseProgress(value: unknown): AutoUpdateProgress | null {
  if (!isPlainObject(value)) return null
  const { received, total, updatedAt } = value
  if (!isFiniteNumber(received) || received < 0) return null
  if (!isFiniteNumber(total) || total < 0) return null
  if (!isValidDateMs(updatedAt)) return null
  return { received, total, updatedAt }
}

function parseResult(value: unknown): AutoUpdateResult | null {
  if (!isPlainObject(value)) return null
  const { version, status, reason, message, at } = value
  if (typeof version !== 'string') return null
  if (typeof status !== 'string' || !(RESULT_STATUSES as readonly string[]).includes(status))
    return null
  if (reason !== undefined && typeof reason !== 'string') return null
  if (message !== undefined && typeof message !== 'string') return null
  if (!isValidDateMs(at)) return null
  const result: AutoUpdateResult = { version, status: status as AutoUpdateResult['status'], at }
  if (typeof reason === 'string') result.reason = reason as AutoUpdateReason
  if (typeof message === 'string') result.message = message
  return result
}

function parseNotice(value: unknown): AutoUpdateNotice | null {
  if (!isPlainObject(value)) return null
  const { from, to, changelog, restart, at } = value
  if (typeof from !== 'string' || typeof to !== 'string') return null
  if (typeof changelog !== 'string' || typeof restart !== 'string') return null
  if (!isValidDateMs(at)) return null
  // `consumedAt` is optional on disk (the worker writes the skeleton before
  // the handover) — a missing or invalid stamp means "never printed".
  const consumedAt =
    typeof value.consumedAt === 'number' &&
    Number.isFinite(value.consumedAt) &&
    value.consumedAt >= 0
      ? value.consumedAt
      : 0
  // NOTE: a notice with an EMPTY `to` is a half-written notice (the handover
  // has not filled it in yet) — it stays PENDING and is kept as a diagnostic.
  // The print rule lives in the notice module, not here.
  return { from, to, changelog, restart, at, consumedAt }
}

function parseStatus(value: unknown): AutoUpdateStatus | null {
  if (!isPlainObject(value)) return null
  if (value.schemaVersion !== 1) return null
  const consent = value.consent
  if (!isPlainObject(consent)) return null
  if (typeof consent.autoUpdate !== 'boolean' || typeof consent.enabled !== 'boolean') return null
  if (typeof value.channel !== 'string' || !(CHANNELS as readonly string[]).includes(value.channel))
    return null
  if (typeof value.installed !== 'string') return null
  if (value.latest !== null && typeof value.latest !== 'string') return null
  if (
    typeof value.state !== 'string' ||
    !(AUTO_UPDATE_STATES as readonly string[]).includes(value.state)
  )
    return null
  const progress = parseProgress(value.progress)
  if (!progress) return null
  const lastResult = value.lastResult === null ? null : parseResult(value.lastResult)
  if (value.lastResult !== null && !lastResult) return null
  if (!Array.isArray(value.history)) return null
  const history: AutoUpdateResult[] = []
  for (const entry of value.history) {
    const parsed = parseResult(entry)
    if (!parsed) return null
    history.push(parsed)
  }
  const notice = value.notice === null ? null : parseNotice(value.notice)
  if (value.notice !== null && !notice) return null
  return {
    schemaVersion: 1,
    consent: { autoUpdate: consent.autoUpdate, enabled: consent.enabled },
    channel: value.channel as AutoUpdateStatus['channel'],
    installed: value.installed,
    latest: value.latest as string | null,
    state: value.state as AutoUpdateState,
    progress,
    lastResult,
    history,
    notice,
  }
}

/**
 * Read + validate the status file. Never throws: a missing, unreadable,
 * malformed, or wrong-version file yields `null`.
 */
export function readAutoUpdateStatus(path: string): AutoUpdateStatus | null {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  return parseStatus(parsed)
}

let tmpCounter = 0

/**
 * Atomic write: temp file in the same directory → rename over the target.
 * The parent directory is created when missing. A failed write leaves the
 * previous file intact and removes the temp file.
 */
export function writeAutoUpdateStatus(path: string, status: AutoUpdateStatus): void {
  const dir = dirname(path)
  mkdirSync(dir, { recursive: true })
  const tmp = `${path}.${process.pid}.${++tmpCounter}.tmp`
  try {
    writeFileSync(tmp, `${JSON.stringify(status, null, 2)}\n`, 'utf8')
    renameSync(tmp, path)
  } catch (error) {
    try {
      rmSync(tmp, { force: true })
    } catch {
      // best-effort cleanup
    }
    throw error
  }
}

/**
 * Append a result to the history (newest last, capped at the newest 10) and
 * make it the `lastResult`. Returns a NEW status object — the input is not
 * mutated.
 */
export function appendAutoUpdateHistory(
  status: AutoUpdateStatus,
  entry: AutoUpdateResult,
): AutoUpdateStatus {
  const history = [...status.history, entry]
  const kept =
    history.length > AUTO_UPDATE_HISTORY_LIMIT
      ? history.slice(history.length - AUTO_UPDATE_HISTORY_LIMIT)
      : history
  return { ...status, lastResult: entry, history: kept }
}

/**
 * Is there auto-update work that a fresh round could RESUME?
 *
 * Two shapes, both meaning "bytes are already on disk, do not start over":
 *
 *   1. a recorded failure carrying the resumable marker (the round stalled
 *      with bytes on disk);
 *   2. an interrupted round — the worker was killed mid-download, so the state
 *      stayed non-terminal and the progress counter still counts the bytes
 *      that arrived.
 *
 * The reader of this flag is the SessionStart hook: it wakes the worker for a
 * resume even when the reminder cache has not reached its 24 h TTL. Without
 * it, R5's "the next session resumes the download" would really mean "the next
 * 24 h window resumes it".
 *
 * Deliberately NOT window-bound: the fragment on disk outlives any timestamp,
 * so a round interrupted days ago is still resumable.
 */
export function hasResumableAutoUpdateWork(status: AutoUpdateStatus | null): boolean {
  if (!status) return false
  const entries = status.lastResult ? [...status.history, status.lastResult] : status.history
  const resumableFailure = entries.some(
    (entry) =>
      entry.status === 'failed' && (entry.message ?? '').startsWith(AUTO_UPDATE_RESUMABLE_MARKER),
  )
  if (resumableFailure) return true
  return IN_PROGRESS_STATES.includes(status.state) && status.progress.received > 0
}

function formatMegabytes(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1)
}

// ISO 8601 UTC. The contract example renders `2026-11-04T03:12:00Z`, i.e. a
// zero millisecond fraction is dropped; a real fraction is kept as-is.
function formatTimestamp(at: number): string {
  return new Date(at).toISOString().replace(/\.000Z$/, 'Z')
}

/**
 * The reason words shown in the `last:` line.
 *
 * D3 requires the npm/bun channel to SAY why it did not self-replace:
 * "auto-update needs the binary channel". A bare `npm-channel` code leaves
 * the user guessing, so that one reason carries its explanation.
 */
const REASON_TEXT: Partial<Record<AutoUpdateReason, string>> = {
  'npm-channel': 'npm channel — auto-update needs the binary channel',
}

/**
 * The `harnessed auto-update status` output contract (R12 / AC6): at most 3
 * lines, fixed field names and order, no trailing spaces.
 */
export function formatAutoUpdateStatus(status: AutoUpdateStatus | null, now: number): string {
  if (!status) {
    return ['auto-update: off', 'installed: unknown   latest: unknown   state: idle'].join('\n')
  }
  const lines: string[] = [`auto-update: ${status.consent.autoUpdate ? 'on' : 'off'}`]
  const latest = status.latest ?? 'unknown'
  let second = `installed: ${status.installed}   latest: ${latest}   state: ${status.state}`
  if (status.progress.total > 0) {
    second += ` (${formatMegabytes(status.progress.received)} MB / ${formatMegabytes(status.progress.total)} MB)`
  }
  lines.push(second)
  if (status.lastResult) {
    const { status: resultStatus, version, reason, at } = status.lastResult
    // `now` is the fallback stamp for an out-of-range `at` (a hand-built status
    // object can carry a timestamp `new Date()` cannot render).
    const stamp = Number.isNaN(new Date(at).getTime()) ? now : at
    const reasonText = reason ? (REASON_TEXT[reason] ?? reason) : 'ok'
    lines.push(`last: ${resultStatus} ${version} (${reasonText}) at ${formatTimestamp(stamp)}`)
  }
  return lines.join('\n')
}
