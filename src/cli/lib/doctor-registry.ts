// v3.7.0 Phase 1 — Doctor check registry. Single source of truth for the
// preflight check list, dispatched by src/cli/doctor.ts.
//
// Adding a new check:
//   1. Create `src/cli/lib/check-<name>.ts` exporting `Promise<CheckResult>` fn
//   2. Append to CHECKS array below
//   3. Update tests/cli/doctor.test.ts CHECKS.length assertion
//
// Ordering preserved per doctor.test.ts cell-1+4+5 expectations. Built-in
// checks (sync `checkNodeVersion` / `checkJq` / `checkWinBash`) are wrapped
// with `Promise.resolve()` to keep dispatch uniform (Promise.all over the
// whole array). All other checks are already async per delegate pattern.

import {
  type CheckResult,
  checkJq,
  checkMcpScope,
  checkNodeVersion,
  checkWinBash,
} from './check-builtin.js'

export type { CheckResult } from './check-builtin.js'

export type CheckFn = () => Promise<CheckResult>

/** All preflight checks, ordered for human-readable doctor output. */
export const CHECKS: readonly CheckFn[] = [
  async () => checkNodeVersion(),
  checkMcpScope,
  async () => checkJq(),
  async () => checkWinBash(),
  async () => {
    const { checkOrigin } = await import('./origin-check.js')
    const r = checkOrigin(process.cwd(), { allowFork: true })
    return { name: 'origin URL', status: r.status, message: r.detail, fix: r.fix }
  },
  async () => {
    const { probeGstackPrefix } = await import('./probe-gstack.js')
    const r = probeGstackPrefix()
    return { name: 'gstack prefix', status: r.status, message: r.detail, fix: r.fix }
  },
  async () => (await import('./check-deprecations.js')).checkDeprecations(),
  async () => (await import('./check-token-budget.js')).checkTokenBudget(),
  async () => (await import('./check-agent-teams-doctor.js')).checkAgentTeamsDoctor(),
  async () => (await import('./check-planning-with-files.js')).checkPlanningWithFiles(),
  async () => (await import('./check-mattpocock-skills.js')).checkMattpocockSkills(),
  async () => (await import('./check-mcp-availability.js')).checkMcpAvailability(),
  // Phase 18 — opt-in CodeGraph semantic-index detect (always 'pass'; absence of an
  // optional tool is not a health failure).
  async () => (await import('./check-codegraph.js')).checkCodeGraph(process.cwd()),
  // v4.16.1 T3 — bun presence (warn-only): gstack's upstream setup hard-requires
  // bun; missing bun is THE gstack refresh-failure cause on user dogfood machines.
  async () => (await import('./check-bun.js')).checkBun(),
  // 4.22.1 T4 — dual-guard conflict (warn-only): ECC GateGuard's filename policy
  // vs evidence-guard artifact contract names (subagents cannot fact-retry).
  async () => (await import('./check-guard-conflict.js')).checkGuardConflict(),
  // 4.23.0 (issue #3) — installed workflow-skill integrity (warn-only): flat
  // ~/.claude/skills packs can silently shadow shipped workflows; setup self-heals.
  async () => (await import('./check-skill-integrity.js')).checkSkillIntegrity(),
  // Phase 20 — "update available" version check ('warn' only when behind; 'pass'
  // when current/ahead/npm-unreachable — fail-soft, never flips the summary).
  async () => (await import('./check-update.js')).checkUpdate(),
  // 4.32.4 — dual install-channel conflict (warn-only): npm-global + standalone
  // binary both present → ambiguous PATH resolution + stale-update trap.
  async () => (await import('./check-install-channels.js')).checkInstallChannels(),
]
