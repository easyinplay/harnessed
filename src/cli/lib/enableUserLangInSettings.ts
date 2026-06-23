// v3.4.0 NEW — auto-detect + write `env.HARNESSED_USER_LANG` in
// ~/.claude/settings.json during `harnessed setup` Step D.
//
// Sister enableAgentTeamsInSettings.ts (v3.3.1 hotfix): mirror probe + 3-case
// merge logic but for a different key. Q-AUDIT-5b LOCKED root-level env.*
// schema preserved.
//
// Phase 27 (D3 fold): the read/parse/3-case/atomicWrite/backup mechanics moved to
// the shared `settingsWriter.mergeSettingsEnvKey()`. This file keeps the lang
// policy (detectUserLang/safeIntlLocale + the already-set respect-override rule)
// and maps the shared MergeOutcome back to the public EnableUserLangResult union.
// Behavior + result type unchanged.
//
// Locale matching policy (LOCKED per v3.4.0 coordinator clarification):
//   - `zh*` (zh-CN / zh-Hans / zh-TW / zh.UTF-8 / etc.) → 'zh-Hans'
//   - Any other input (en / ko / ja / fr / de / es / etc.) → 'en'
//
// Behavior (3 case + non-destructive merge):
//   (a) file missing → create with {env:{HARNESSED_USER_LANG: detected}}
//   (b) env.HARNESSED_USER_LANG already set + no explicit override → idempotent no-op
//   (c) file exists missing key OR explicit override → backup + merge update
//
// `--user-lang <code>` CLI override is honored when provided (forces detected = code).
//
// Backup → ~/.claude/harnessed/backups/settings.json.{ISO-ts}.bak.
// Any error → warn + skip (sister fallback 铁律 1), NOT throw — non-blocking setup.

import { mergeSettingsEnvKey } from './settingsWriter.js'

const ENV_KEY = 'HARNESSED_USER_LANG'

export type UserLangCode = 'en' | 'zh-Hans'

export type EnableUserLangResult =
  | { status: 'created'; path: string; detected: UserLangCode }
  | { status: 'already-set'; path: string; existing: string }
  | { status: 'enabled'; path: string; backupPath: string; detected: UserLangCode }
  | { status: 'warn'; message: string }

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
  const detected = detectUserLang(override)

  // Case (b) respects an existing user-managed value ONLY when no explicit
  // override was passed. mergeSettingsEnvKey invokes skipIfPresent only for a
  // present non-empty string value — matching the original guard exactly.
  const r = await mergeSettingsEnvKey(ENV_KEY, detected, {
    skipIfPresent: () => override === undefined,
  })
  switch (r.outcome) {
    case 'created':
      return { status: 'created', path: r.path, detected }
    case 'already':
      return { status: 'already-set', path: r.path, existing: r.existing }
    case 'merged':
      return { status: 'enabled', path: r.path, backupPath: r.backupPath, detected }
    case 'warn':
      return { status: 'warn', message: r.message }
  }
}
