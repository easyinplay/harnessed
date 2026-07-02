// Phase v2.0-2.3 W0 T2.3.W0.5 — Agent Teams capability probe (Q-AUDIT-5b
// MANDATORY: schema is root-level `env.*` NOT nested `experimental.*`).
// Sister RESEARCH § 4.3 verbatim implementation; wired by setup.ts / doctor.ts.

import { readFile } from 'node:fs/promises'
import { getSettingsPath } from '../../installers/lib/platform.js'

export interface AgentTeamsCheckResult {
  status: 'pass' | 'warn' | 'missing'
  detected: { env: boolean; settingsJson: boolean }
  envValue?: string
  settingsValue?: string
  remediation?: string
}

export async function checkAgentTeams(): Promise<AgentTeamsCheckResult> {
  const envValue = process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
  const envOn = envValue === '1'

  let settingsValue: string | undefined
  let settingsOn = false
  try {
    // v4.14.0 — settings path via descriptor (claude byte-identical resolve).
    const path = getSettingsPath()
    const raw = await readFile(path, 'utf8')
    const data = JSON.parse(raw) as { env?: Record<string, string> }
    // Q-AUDIT-5b LOCKED: root-level env.* NOT nested experimental.*
    settingsValue = data.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
    settingsOn = settingsValue === '1'
  } catch {
    // settings.json missing / unparseable / invalid JSON — non-fatal, fall through to env probe
  }

  const detected = { env: envOn, settingsJson: settingsOn }
  if (envOn || settingsOn) {
    return { status: 'pass', detected, envValue, settingsValue }
  }

  return {
    status: 'missing',
    detected,
    envValue,
    settingsValue,
    remediation:
      'Agent Teams not enabled. Add to ~/.claude/settings.json:\n  "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" }\nOR run: claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1\nOR export env var:\n  export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1\nThen restart Claude Code (CC >= 2.1.133 required).',
  }
}
