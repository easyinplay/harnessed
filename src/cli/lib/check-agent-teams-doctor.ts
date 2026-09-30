// Phase v2.0-2.4 W3 T2.4.W3.1 — 9th doctor check delegate (Agent Teams env).
// Wraps src/cli/lib/checkAgentTeams.ts (Phase 2.3 W0.5 SHIPPED) into the
// CheckResult shape consumed by src/cli/doctor.ts (sister probe-gstack.ts
// delegate pattern for Karpathy ≤200L doctor.ts hard limit守门).
//
// Status map: checkAgentTeams 'pass' → 'pass'; 'missing' → 'warn' (non-blocking
// per CLAUDE.md L21 "warn ≠ fail / exit 0" R2.4.1 + R20.11 acceptance c).

import { detectPlatform } from '../../platform/platform.js'
// v16.0 Phase 66 T5 — shared CheckResult (its `status` now carries `skipped`)
// instead of a local re-declaration that would have to be widened in parallel.
import type { CheckResult } from './check-builtin.js'
import { checkAgentTeams } from './checkAgentTeams.js'

export async function checkAgentTeamsDoctor(): Promise<CheckResult> {
  // v4.14.0 — Agent Teams is a Claude Code concept; on other platforms the
  // warn + CC remediation are meaningless (sister warnIfAgentTeamsMissing gate
  // in setup-helpers.ts).
  // v16.0 Phase 66 T5 — `skipped`, not a `pass` that says "skipped" in prose.
  if (detectPlatform().id !== 'claude') {
    return {
      name: 'Agent Teams env',
      status: 'skipped',
      message: 'skipped (claude-only check)',
    }
  }
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
