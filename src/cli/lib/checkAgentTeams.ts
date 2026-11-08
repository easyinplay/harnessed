// Phase v2.0-2.3 W0 T2.3.W0.5 — Agent Teams capability probe (Q-AUDIT-5b
// MANDATORY: schema is root-level `env.*` NOT nested `experimental.*`).
// Sister RESEARCH § 4.3 verbatim implementation; wired by setup.ts / doctor.ts.
//
// Phase 86 — the probe is split in two:
//   - `resolveAgentTeamsStatus` — PURE (no process.env, no fs). It answers one
//     question: "given these two raw values, is agent-teams switched on?"
//   - `checkAgentTeams` — the IO shell that READS env + settings.json and feeds
//     the pure resolver. Kept as the doctor/setup-facing API.
//
// Why the split: the gates decision (src/cli/gates.ts) needs the SAME truth
// table as the doctor, but the decision itself must stay pure, and a shared
// truth table is the only way "doctor says enabled" and "gates says this host
// can form a team" cannot drift apart.

import { readFile } from 'node:fs/promises'
import { getSettingsPath } from '../../platform/platform.js'

export interface AgentTeamsCheckResult {
  status: 'pass' | 'warn' | 'missing'
  detected: { env: boolean; settingsJson: boolean }
  envValue?: string
  settingsValue?: string
  remediation?: string
}

/** Where the "agent-teams is on" verdict came from. `none` = nowhere. */
export interface AgentTeamsStatus {
  active: boolean
  source: 'env' | 'settings' | 'none'
  envValue?: string
  settingsValue?: string
}

/**
 * Strict truth table for the enable flag. The two spellings that mean "on" are
 * `'1'` and `'true'`; everything else — `'0'`, `'false'`, `''`, whitespace-only,
 * unset — means OFF. Deliberately strict: a sloppy truthiness check (`'0'` is a
 * truthy STRING) would report teams as available on a host where the flag is
 * explicitly disabled.
 */
function isEnabledValue(value: string | undefined): boolean {
  if (typeof value !== 'string') return false
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true'
}

/**
 * PURE resolver — no process.env, no fs. `env` wins the `source` attribution
 * when both sources are on (the live env overrides the on-disk setting).
 */
export function resolveAgentTeamsStatus(input: {
  envValue?: string
  settingsValue?: string
}): AgentTeamsStatus {
  const { envValue, settingsValue } = input
  const envOn = isEnabledValue(envValue)
  const settingsOn = isEnabledValue(settingsValue)

  const status: AgentTeamsStatus = {
    active: envOn || settingsOn,
    source: envOn ? 'env' : settingsOn ? 'settings' : 'none',
  }
  if (envValue !== undefined) status.envValue = envValue
  if (settingsValue !== undefined) status.settingsValue = settingsValue
  return status
}

export async function checkAgentTeams(): Promise<AgentTeamsCheckResult> {
  const envValue = process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS

  let settingsValue: string | undefined
  try {
    // v4.14.0 — settings path via descriptor (claude byte-identical resolve).
    // v16.0 Phase 63 — null (codex: no JSON settings file) → empty, env probe decides.
    const path = getSettingsPath()
    const raw = path === null ? '{}' : await readFile(path, 'utf8')
    const data = JSON.parse(raw) as { env?: Record<string, string> }
    // Q-AUDIT-5b LOCKED: root-level env.* NOT nested experimental.*
    settingsValue = data.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
  } catch {
    // settings.json missing / unparseable / invalid JSON — non-fatal, fall through to env probe
  }

  // One truth table for both sources. `detected` reports EACH source's own
  // verdict (not only the winning one) — the doctor shows both rows.
  // Phase 86: the table is the resolver's, so 'true' enables alongside '1'
  // (the pre-Phase-86 inline check accepted '1' only). The returned shape,
  // the pass/missing verdicts and the remediation text are unchanged.
  const detected = {
    env: isEnabledValue(envValue),
    settingsJson: isEnabledValue(settingsValue),
  }
  const status = resolveAgentTeamsStatus({ envValue, settingsValue })

  if (status.active) {
    return { status: 'pass', detected, envValue, settingsValue }
  }

  return {
    status: 'missing',
    detected,
    envValue,
    settingsValue,
    remediation:
      'Agent Teams not enabled. Add to ~/.claude/settings.json:\n  "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" }\nOR run: claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1\nOR export env var:\n  export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1\nThen restart Claude Code (CC >= 2.1.178 required).',
  }
}
