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
]
