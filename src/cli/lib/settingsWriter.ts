// Phase 27 W1 T2 — shared settings env-key writer (D3 fold).
//
// enableAgentTeamsInSettings (v3.3.1) and enableUserLangInSettings (v3.4.0) were
// near-identical: read → parse → 3-case (create fresh / idempotent / backup +
// merge) → atomicWrite (tmp + rename), backup → harnessedSubdir('backups'). The
// only differences were the env key + (lang) an already-set policy. This module
// extracts the shared mechanics behind `mergeSettingsEnvKey(key, value, opts?)`,
// returning a discriminated outcome the two thin callers map to their existing
// public result-type unions. Byte-for-byte identical writes (settingsPath via the
// Phase-B getSettingsPath() resolver; backup, atomic semantics unchanged).
//
// Zero behavior change: every write/rename/backup the callers used to do is still
// done here, in the same order, with the same content + warn wording. Any error →
// warn outcome (NOT throw) so `harnessed setup` stays non-blocking (sister fallback
// 铁律 1).

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { harnessedSubdir } from '../../installers/lib/harnessedRoot.js'
import { getSettingsPath } from '../../installers/lib/platform.js'

/**
 * Discriminated outcome of a settings env-key merge.
 *
 * - `created` — file did not exist; wrote a fresh `{env:{key:value}}`.
 * - `already` — `skipIfPresent(existing)` was true; no-op. Carries the existing
 *   value so the lang caller can surface it.
 * - `merged`  — backed up the original + merged the key non-destructively.
 * - `warn`    — read/parse/write failed; nothing partial left behind.
 */
export type MergeOutcome =
  | { outcome: 'created'; path: string }
  | { outcome: 'already'; path: string; existing: string }
  | { outcome: 'merged'; path: string; backupPath: string }
  | { outcome: 'warn'; message: string }

export interface MergeOpts {
  /**
   * Given the current value of `env[key]` (a string), return true to treat the
   * file as already-correct and no-op. Used for idempotency / user-override
   * policies. When omitted, an existing key is always overwritten (backup +
   * merge). Only invoked when `env[key]` is a non-empty string.
   */
  skipIfPresent?: (existing: string) => boolean
}

/**
 * Merge `env[key] = value` into `~/.claude/settings.json` (3-case, non-destructive).
 *
 * Mirrors the original enable*-writer mechanics exactly so the fold is a pure
 * refactor.
 */
export async function mergeSettingsEnvKey(
  key: string,
  value: string,
  opts: MergeOpts = {},
): Promise<MergeOutcome> {
  const path = getSettingsPath()

  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') {
      return { outcome: 'warn', message: `read ${path} failed: ${(err as Error).message}` }
    }
    // Case (a): file does not exist → create fresh.
    return createFresh(path, key, value)
  }

  let data: Record<string, unknown>
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { outcome: 'warn', message: `${path} is not a JSON object` }
    }
    data = parsed as Record<string, unknown>
  } catch (err) {
    return { outcome: 'warn', message: `${path} malformed JSON: ${(err as Error).message}` }
  }

  const env = (data.env ?? {}) as Record<string, unknown>
  const existing = env[key]
  if (
    typeof existing === 'string' &&
    existing.length > 0 &&
    opts.skipIfPresent?.(existing) === true
  ) {
    // Case (b): present + policy says respect it → idempotent no-op.
    return { outcome: 'already', path, existing }
  }

  // Case (c): backup original + merge add/update key (non-destructive).
  const backup = await backupOriginal(raw)
  if (backup.status === 'warn') return { outcome: 'warn', message: backup.message }

  data.env = { ...env, [key]: value }
  const writeErr = await atomicWrite(path, `${JSON.stringify(data, null, 2)}\n`)
  if (writeErr) return { outcome: 'warn', message: writeErr }

  return { outcome: 'merged', path, backupPath: backup.path }
}

async function createFresh(path: string, key: string, value: string): Promise<MergeOutcome> {
  const data = { env: { [key]: value } }
  try {
    await mkdir(dirname(path), { recursive: true })
  } catch (err) {
    return { outcome: 'warn', message: `mkdir ~/.claude failed: ${(err as Error).message}` }
  }
  const writeErr = await atomicWrite(path, `${JSON.stringify(data, null, 2)}\n`)
  if (writeErr) return { outcome: 'warn', message: writeErr }
  return { outcome: 'created', path }
}

async function backupOriginal(
  raw: string,
): Promise<{ status: 'ok'; path: string } | { status: 'warn'; message: string }> {
  const backupRoot = harnessedSubdir('backups')
  const ts = new Date().toISOString().replace(/:/g, '-')
  const backupPath = join(backupRoot, `settings.json.${ts}.bak`)
  try {
    await mkdir(backupRoot, { recursive: true })
    await writeFile(backupPath, raw, 'utf8')
    return { status: 'ok', path: backupPath }
  } catch (err) {
    return { status: 'warn', message: `backup ${backupPath} failed: ${(err as Error).message}` }
  }
}

async function atomicWrite(path: string, content: string): Promise<string | undefined> {
  const tmpPath = `${path}.tmp-${process.pid}-${Date.now()}`
  try {
    await writeFile(tmpPath, content, 'utf8')
    await rename(tmpPath, path)
    return undefined
  } catch (err) {
    return `write ${path} failed: ${(err as Error).message}`
  }
}
