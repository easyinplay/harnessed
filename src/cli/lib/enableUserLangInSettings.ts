// v3.4.0 NEW — auto-detect + write `env.HARNESSED_USER_LANG` in
// ~/.claude/settings.json during `harnessed setup` Step D.
//
// Sister enableAgentTeamsInSettings.ts (v3.3.1 hotfix): mirror probe + 3-case
// merge logic but for a different key. Q-AUDIT-5b LOCKED root-level env.*
// schema preserved.
//
// Locale matching policy (LOCKED per v3.4.0 coordinator clarification):
//   - `zh*` (zh-CN / zh-Hans / zh-TW / zh.UTF-8 / etc.) → 'zh-Hans'
//   - Any other input (en / ko / ja / fr / de / es / etc.) → 'en'
//
// Behavior (3 case + non-destructive merge):
//   (a) file missing → create with {env:{HARNESSED_USER_LANG: detected}}
//   (b) env.HARNESSED_USER_LANG already set → idempotent no-op (respects override)
//   (c) file exists missing key OR explicit override → backup + merge update
//
// `--user-lang <code>` CLI override is honored when provided (forces detected = code).
//
// Backup → ~/.claude/harnessed/backups/settings.json.{ISO-ts}.bak.
// Any error → warn + skip (sister fallback 铁律 1), NOT throw — non-blocking setup.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { harnessedSubdir } from '../../installers/lib/harnessedRoot.js'

export type UserLangCode = 'en' | 'zh-Hans'

export type EnableUserLangResult =
  | { status: 'created'; path: string; detected: UserLangCode }
  | { status: 'already-set'; path: string; existing: string }
  | { status: 'enabled'; path: string; backupPath: string; detected: UserLangCode }
  | { status: 'warn'; message: string }

function settingsPath(): string {
  return resolve(homedir(), '.claude', 'settings.json')
}

/**
 * Detect OS locale → 'zh-Hans' if zh*, else 'en'. Mirrors src/i18n/index.ts
 * `mapToSupported()` policy. Kept inline here (not imported from i18n) so the
 * helper has no cross-module coupling and the test fixture can override env
 * vars cleanly.
 */
export function detectUserLang(override?: string): UserLangCode {
  if (override) {
    if (/^zh([^a-z]|$)/i.test(override)) return 'zh-Hans'
    return 'en'
  }
  const raw =
    process.env.HARNESSED_LANG ||
    process.env.LC_ALL ||
    process.env.LANG ||
    process.env.LANGUAGE ||
    safeIntlLocale() ||
    ''
  if (/^zh([^a-z]|$)/i.test(raw)) return 'zh-Hans'
  return 'en'
}

function safeIntlLocale(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale
  } catch {
    return undefined
  }
}

export async function enableUserLangInSettings(override?: string): Promise<EnableUserLangResult> {
  const path = settingsPath()
  const detected = detectUserLang(override)

  let raw: string | undefined
  try {
    raw = await readFile(path, 'utf8')
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') {
      return { status: 'warn', message: `read ${path} failed: ${(err as Error).message}` }
    }
    // Case (a): file does not exist → create fresh with detected lang.
    return createFreshSettings(path, detected)
  }

  let data: Record<string, unknown>
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { status: 'warn', message: `${path} is not a JSON object` }
    }
    data = parsed as Record<string, unknown>
  } catch (err) {
    return { status: 'warn', message: `${path} malformed JSON: ${(err as Error).message}` }
  }

  const env = (data.env ?? {}) as Record<string, unknown>
  const existing = env.HARNESSED_USER_LANG
  if (typeof existing === 'string' && existing.length > 0 && override === undefined) {
    // Case (b): user-managed value present + no explicit override → respect it.
    return { status: 'already-set', path, existing }
  }

  // Case (c): backup original + merge add/update key (non-destructive).
  const backupPath = await backupOriginal(raw)
  if (backupPath.status === 'warn') return backupPath

  data.env = { ...env, HARNESSED_USER_LANG: detected }
  const writeErr = await atomicWrite(path, `${JSON.stringify(data, null, 2)}\n`)
  if (writeErr) return { status: 'warn', message: writeErr }

  return { status: 'enabled', path, backupPath: backupPath.path, detected }
}

async function createFreshSettings(
  path: string,
  detected: UserLangCode,
): Promise<EnableUserLangResult> {
  const data = { env: { HARNESSED_USER_LANG: detected } }
  try {
    await mkdir(join(homedir(), '.claude'), { recursive: true })
  } catch (err) {
    return { status: 'warn', message: `mkdir ~/.claude failed: ${(err as Error).message}` }
  }
  const writeErr = await atomicWrite(path, `${JSON.stringify(data, null, 2)}\n`)
  if (writeErr) return { status: 'warn', message: writeErr }
  return { status: 'created', path, detected }
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
