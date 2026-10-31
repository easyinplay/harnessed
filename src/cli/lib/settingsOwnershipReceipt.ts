import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { harnessedFile } from '../../platform/harnessedRoot.js'
import type { HostInstallContext } from '../../platform/hostInstallContext.js'
import { withSettingsTransactionLock } from './settingsTransactionLock.js'

export const SETTINGS_OWNERSHIP_RECEIPT_FILE = 'settings-env-ownership.json'
const MANAGED_ENV_KEYS = new Set([
  'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS',
  'GATEGUARD_EXEMPT_GLOBS',
  'HARNESSED_USER_LANG',
])

export interface SettingsOwnershipReceipt {
  version: 1
  entries: Record<
    string,
    {
      installedValue: string
      previous: { present: boolean; value?: unknown }
    }
  >
}

export type SettingsOwnershipReceiptLoadResult =
  | { status: 'absent' }
  | { status: 'ok'; receipt: SettingsOwnershipReceipt }
  | { status: 'corrupt'; error: string }
  | { status: 'error'; error: string }

export function settingsOwnershipReceiptPath(hostContext?: HostInstallContext): string {
  return hostContext
    ? join(hostContext.platform.stateRoot, SETTINGS_OWNERSHIP_RECEIPT_FILE)
    : harnessedFile(SETTINGS_OWNERSHIP_RECEIPT_FILE)
}

export async function loadSettingsOwnershipReceipt(
  hostContext?: HostInstallContext,
): Promise<SettingsOwnershipReceiptLoadResult> {
  const path = settingsOwnershipReceiptPath(hostContext)
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        const parent = await stat(dirname(path))
        if (!parent.isDirectory()) {
          return { status: 'error', error: `receipt parent is not a directory: ${dirname(path)}` }
        }
      } catch (parentError) {
        if ((parentError as NodeJS.ErrnoException).code !== 'ENOENT') {
          return {
            status: 'error',
            error: `inspect ${dirname(path)} failed: ${(parentError as Error).message}`,
          }
        }
      }
      return { status: 'absent' }
    }
    return { status: 'error', error: `read ${path} failed: ${(error as Error).message}` }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch (error) {
    return { status: 'corrupt', error: `parse ${path} failed: ${(error as Error).message}` }
  }
  if (!isReceipt(parsed)) return { status: 'corrupt', error: `invalid receipt at ${path}` }
  return { status: 'ok', receipt: parsed }
}

export async function recordSettingsEnvOwnership(
  key: string,
  installedValue: string,
  previous: { present: boolean; value?: unknown },
  hostContext?: HostInstallContext,
): Promise<void> {
  await withSettingsTransactionLock(hostContext, () =>
    recordSettingsEnvOwnershipUnlocked(key, installedValue, previous, hostContext),
  )
}

export async function recordSettingsEnvOwnershipUnlocked(
  key: string,
  installedValue: string,
  previous: { present: boolean; value?: unknown },
  hostContext?: HostInstallContext,
): Promise<void> {
  if (!MANAGED_ENV_KEYS.has(key)) throw new Error(`unsupported managed settings env key: ${key}`)
  if (previous.present && typeof previous.value !== 'string') {
    throw new Error(`invalid previous value for managed settings env key: ${key}`)
  }
  const loaded = await loadSettingsOwnershipReceipt(hostContext)
  if (loaded.status === 'corrupt' || loaded.status === 'error') throw new Error(loaded.error)
  const existing = loaded.status === 'ok' ? loaded.receipt : null
  const priorEntry = existing?.entries[key]
  const retainedPrevious =
    priorEntry && previous.present && previous.value === priorEntry.installedValue
      ? priorEntry.previous
      : previous
  const receipt: SettingsOwnershipReceipt = {
    version: 1,
    entries: {
      ...(existing?.entries ?? {}),
      [key]: { installedValue, previous: retainedPrevious },
    },
  }
  const path = settingsOwnershipReceiptPath(hostContext)
  const tmpPath = `${path}.tmp-${process.pid}-${Date.now()}`
  await mkdir(dirname(path), { recursive: true })
  try {
    await writeFile(tmpPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
    await rename(tmpPath, path)
  } catch (error) {
    await rm(tmpPath, { force: true }).catch(() => undefined)
    throw error
  }
}

export function restoreOwnedSettingsEnv(
  data: Record<string, unknown>,
  receipt: SettingsOwnershipReceipt,
): { changed: boolean; restored: number; removed: number } {
  if (data.env !== undefined && !isPlainRecord(data.env)) {
    throw new Error('settings env is not a JSON object')
  }
  const env = (data.env ?? {}) as Record<string, unknown>
  let restored = 0
  let removed = 0
  for (const [key, entry] of Object.entries(receipt.entries)) {
    if (!isManagedEntry(key, entry)) continue
    if (env[key] !== entry.installedValue) continue
    if (entry.previous.present) {
      env[key] = entry.previous.value
      restored++
    } else {
      delete env[key]
      removed++
    }
  }
  const changed = restored + removed > 0
  if (changed) {
    if (Object.keys(env).length === 0) delete data.env
    else data.env = env
  }
  return { changed, restored, removed }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isReceipt(value: unknown): value is SettingsOwnershipReceipt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const receipt = value as Partial<SettingsOwnershipReceipt>
  if (receipt.version !== 1 || !receipt.entries || typeof receipt.entries !== 'object') return false
  return Object.entries(receipt.entries).every(([key, entry]) => isManagedEntry(key, entry))
}

function isManagedEntry(
  key: string,
  value: unknown,
): value is SettingsOwnershipReceipt['entries'][string] {
  if (!MANAGED_ENV_KEYS.has(key) || value === null || typeof value !== 'object') return false
  const entry = value as SettingsOwnershipReceipt['entries'][string]
  if (
    typeof entry.installedValue !== 'string' ||
    entry.previous === null ||
    typeof entry.previous !== 'object' ||
    typeof entry.previous.present !== 'boolean'
  ) {
    return false
  }
  return !entry.previous.present || typeof entry.previous.value === 'string'
}
