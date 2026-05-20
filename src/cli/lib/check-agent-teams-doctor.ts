// Phase v2.0-2.4 W3 T2.4.W3.1 — 9th doctor check delegate (Agent Teams env).
// Wraps src/cli/lib/checkAgentTeams.ts (Phase 2.3 W0.5 SHIPPED) into the
// CheckResult shape consumed by src/cli/doctor.ts (sister probe-gstack.ts
// delegate pattern for Karpathy ≤200L doctor.ts hard limit守门).
//
// Status map: checkAgentTeams 'pass' → 'pass'; 'missing' → 'warn' (non-blocking
// per CLAUDE.md L21 "warn ≠ fail / exit 0" R2.4.1 + R20.11 acceptance c).

import { checkAgentTeams } from './checkAgentTeams.js'

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
}

export async function checkAgentTeamsDoctor(): Promise<CheckResult> {
  const r = await checkAgentTeams()
  if (r.status === 'pass') {
    const source = r.detected.env ? 'env var' : 'settings.json'
    return {
      name: 'Agent Teams env',
      status: 'pass',
      message: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 (${source})`,
    }
  }
  return {
    name: 'Agent Teams env',
    status: 'warn',
    message: 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS not set (Agent Teams disabled)',
    fix: r.remediation,
  }
}
