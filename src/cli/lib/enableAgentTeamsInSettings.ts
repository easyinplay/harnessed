// v3.3.1 hotfix — auto-enable Agent Teams in ~/.claude/settings.json during `harnessed setup`.
// Sister checkAgentTeams.ts (Phase 2.3 W0.5 SHIPPED): mirror probe logic but WRITE-side.
// Q-AUDIT-5b LOCKED: schema is root-level `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`
// NOT nested `experimental.*`.
//
// Phase 27 (D3 fold): the read/parse/3-case/atomicWrite/backup mechanics moved to
// the shared `settingsWriter.mergeSettingsEnvKey()`. This file is now a thin caller
// that fixes the env key + idempotency policy (key === '1' → no-op) and maps the
// shared MergeOutcome back to the public EnableResult union. Behavior + result type
// unchanged (byte-identical writes, same statuses).
//
// Behavior (3 case + non-destructive merge):
//   (a) file 不存在 → create with `{env: {CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"}}`
//   (b) file 存在 + env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === "1" → idempotent no-op
//   (c) file 存在 + 缺 key OR key !== "1" → backup original + merge add/update key
//
// Backup → `~/.claude/harnessed/backups/settings.json.{ISO-ts}.bak`; atomic tmp+rename.
// Any error → warn + skip (sister fallback 铁律 1 透明声明), NOT throw — non-blocking setup.

import { detectPlatform } from '../../installers/lib/platform.js'
import { mergeSettingsEnvKey } from './settingsWriter.js'

const ENV_KEY = 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS'

export type EnableResult =
  | { status: 'created'; path: string }
  | { status: 'already-enabled'; path: string }
  | { status: 'enabled'; path: string; backupPath: string }
  | { status: 'warn'; message: string }

export async function enableAgentTeamsInSettings(): Promise<EnableResult> {
  // Phase C / D4: capability gate. A platform whose settings file is not a JSON
  // env-key store (e.g. codex's TOML config.toml) must NOT be written to — the
  // CC env key is meaningless there and a JSON merge would corrupt the TOML.
  // Short-circuit BEFORE any fs read; inform via the existing 'warn' variant.
  const platform = detectPlatform()
  if (!platform.supportsEnvKeyWrite) {
    return {
      status: 'warn',
      message: `platform '${platform.id}' does not support env-key settings writes (capability-absent) — ${ENV_KEY} skipped`,
    }
  }
  const r = await mergeSettingsEnvKey(ENV_KEY, '1', {
    skipIfPresent: (existing) => existing === '1',
  })
  switch (r.outcome) {
    case 'created':
      return { status: 'created', path: r.path }
    case 'already':
      return { status: 'already-enabled', path: r.path }
    case 'merged':
      return { status: 'enabled', path: r.path, backupPath: r.backupPath }
    case 'warn':
      return { status: 'warn', message: r.message }
  }
}
