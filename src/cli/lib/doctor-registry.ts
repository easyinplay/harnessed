// v3.7.0 Phase 1 — Doctor check registry. Single source of truth for the
// preflight check list, dispatched by src/cli/doctor.ts.
//
// v16.0 Phase 66 T5 — each entry is now a DESCRIPTOR (`{ name, hosts, fn }`), not
// a bare `CheckFn`. Before T5 the array carried no metadata at all, so nothing
// could answer "which harness is this check even about": every check re-derived
// that itself (`detectPlatform()` / `getSettingsPath() === null` / …) and returned
// a FAKE `pass` labelled "skipped" on the wrong host. `hosts` makes the answer
// declarative, which is what `doctor --host <id>` filters on and what
// `doctor --matrix` puts in its columns.
//
// `hosts` is the set of harnesses the check is MEANINGFUL for — audited from each
// check's real early-return logic, never from its name. Reference points:
//   - a host early-return (`detectPlatform().id !== 'claude'`, `settingsPath ===
//     null`, `pluginsRegistry === null`) ⇒ that host is NOT listed;
//   - a probe that spans both harnesses' dirs (`harnessSkillsDirs()`), or a
//     descriptor-resolved path (`getSkillsDir()`), or no harness surface at all
//     (PATH / git / env / packaged assets) ⇒ BOTH hosts.
// The two are a contract: running a check under a host it does not declare must
// be impossible, and a check run under a host it DOES declare must not answer
// `skipped` for host reasons. `doctor --matrix` shows a violation as a `skipped`
// cell where the annotation promised a real verdict.
//
// Adding a new check:
//   1. Create `src/cli/lib/check-<name>.ts` exporting `Promise<CheckResult>` fn
//   2. Append a descriptor to CHECKS below — `name` MUST equal the `name` the
//      CheckResult carries (doctor.test.ts cell 8 pins that), and `hosts` must
//      match the check's own early-return behaviour
//   3. Update tests/cli/doctor.test.ts CHECKS.length assertion
//
// Ordering preserved per doctor.test.ts cell-1+4+5 expectations. Built-in
// checks (sync `checkNodeVersion` / `checkJq` / `checkWinBash`) are wrapped
// with `Promise.resolve()` to keep dispatch uniform (Promise.allSettled over the
// whole array). All other checks are already async per delegate pattern.

import {
  type CheckResult,
  checkJq,
  checkMcpScope,
  checkNodeVersion,
  checkWinBash,
} from './check-builtin.js'
import type { HostId } from './hostPrimitives.js'

export type { CheckResult } from './check-builtin.js'

export type CheckFn = () => Promise<CheckResult>

/** One registry entry: the check, its display name, and the harnesses it means
 *  something on. */
export interface CheckDescriptor {
  /** MUST equal the `name` the fn's CheckResult carries (matrix rows key on it). */
  readonly name: string
  /** Harnesses this check is meaningful for — see the module header's contract. */
  readonly hosts: readonly HostId[]
  readonly fn: CheckFn
}

/** Every harness the doctor matrix has a column for. Derived shape from
 *  `HostId` (src/cli/lib/hostPrimitives.ts), listed in matrix column order. */
export const ALL_HOSTS: readonly HostId[] = ['claude', 'codex']

/** Shorthand for the (majority) host-agnostic checks. */
const BOTH: readonly HostId[] = ALL_HOSTS

/** All preflight checks, ordered for human-readable doctor output. */
export const CHECKS: readonly CheckDescriptor[] = [
  // Node runtime version — `process.versions.node`, no harness surface at all.
  { name: 'node ≥ 22', hosts: BOTH, fn: async () => checkNodeVersion() },
  // claude-only: check-builtin.ts checkMcpScope early-returns unless
  // detectPlatform().id === 'claude'; it reads ~/.claude.json + project .mcp.json.
  { name: 'mcp scope', hosts: ['claude'], fn: checkMcpScope },
  // PATH probe (`where`/`which jq`) — the install hint switches on OS, not host.
  { name: 'jq present', hosts: BOTH, fn: async () => checkJq() },
  // resolveBash() PATH inspection. Its early return is an OS gate (non-Windows),
  // NOT a host gate — both harnesses need a usable bash on Windows.
  { name: 'bash flavor (win)', hosts: BOTH, fn: async () => checkWinBash() },
  // git remote of the cwd — no harness surface.
  {
    name: 'origin URL',
    hosts: BOTH,
    fn: async () => {
      const { checkOrigin } = await import('./origin-check.js')
      const r = checkOrigin(process.cwd(), { allowFork: true })
      return { name: 'origin URL', status: r.status, message: r.detail, fix: r.fix }
    },
  },
  // PATH probe + harnessSkillsDirs() (which spans BOTH harnesses' skills dirs).
  {
    name: 'gstack prefix',
    hosts: BOTH,
    fn: async () => {
      const { probeGstackPrefix } = await import('./probe-gstack.js')
      const r = probeGstackPrefix()
      return { name: 'gstack prefix', status: r.status, message: r.detail, fix: r.fix }
    },
  },
  // Reads the packaged manifests/aliases.yaml — harness-independent.
  {
    name: 'deprecated manifests',
    hosts: BOTH,
    fn: async () => (await import('./check-deprecations.js')).checkDeprecations(),
  },
  // getSkillsDir() — descriptor-resolved, so it audits whichever harness is active.
  {
    name: 'token budget',
    hosts: BOTH,
    fn: async () => (await import('./check-token-budget.js')).checkTokenBudget(),
  },
  // claude-only: Agent Teams is a Claude Code env key; the check early-returns
  // unless detectPlatform().id === 'claude'.
  {
    name: 'Agent Teams env',
    hosts: ['claude'],
    fn: async () => (await import('./check-agent-teams-doctor.js')).checkAgentTeamsDoctor(),
  },
  // claude-only: probes the CC plugin CACHE and early-returns when
  // getPluginsRegistry() is null (codex has no installed_plugins.json).
  {
    name: 'planning-with-files plugin',
    hosts: ['claude'],
    fn: async () => (await import('./check-planning-with-files.js')).checkPlanningWithFiles(),
  },
  // Both: the plugin-cache probe is registry-gated but the skill probes span
  // harnessSkillsDirs(), and install_commands computes `--agent` per host.
  {
    name: 'mattpocock-skills',
    hosts: BOTH,
    fn: async () => (await import('./check-mattpocock-skills.js')).checkMattpocockSkills(),
  },
  // Both: isMcpServerRegistered branches on codex → `[mcp_servers.*]` in config.toml.
  {
    name: 'MCP servers (tavily/exa)',
    hosts: BOTH,
    fn: async () => (await import('./check-mcp-availability.js')).checkMcpAvailability(),
  },
  // Phase 18 — opt-in CodeGraph semantic-index detect (always 'pass'; absence of an
  // optional tool is not a health failure). Project-local `.codegraph/` — no host surface.
  {
    name: 'codegraph',
    hosts: BOTH,
    fn: async () => (await import('./check-codegraph.js')).checkCodeGraph(process.cwd()),
  },
  // v4.16.1 T3 — bun presence (warn-only): gstack's upstream setup hard-requires
  // bun; missing bun is THE gstack refresh-failure cause on user dogfood machines.
  // Pure PATH probe.
  { name: 'bun present', hosts: BOTH, fn: async () => (await import('./check-bun.js')).checkBun() },
  // 4.22.1 T4 — dual-guard conflict (warn-only): ECC GateGuard's filename policy
  // vs evidence-guard artifact contract names (subagents cannot fact-retry).
  // Both: only the settings.json signal degrades on codex — the ecc-plugin signal
  // goes through isPluginRegistered (which asks `codex plugin list` there) and the
  // env signal is host-free. ECC ships a codex channel, so the conflict is real there.
  {
    name: 'guard conflict (GateGuard)',
    hosts: BOTH,
    fn: async () => (await import('./check-guard-conflict.js')).checkGuardConflict(),
  },
  // 4.23.0 (issue #3) — installed workflow-skill integrity (warn-only): flat
  // ~/.claude/skills packs can silently shadow shipped workflows; setup self-heals.
  // getSkillsDir() — per-host install dir, so it audits either harness.
  {
    name: 'workflow skill integrity',
    hosts: BOTH,
    fn: async () => (await import('./check-skill-integrity.js')).checkSkillIntegrity(),
  },
  // Phase 20 — "update available" version check ('warn' only when behind; 'pass'
  // when current/ahead/npm-unreachable — fail-soft, never flips the summary).
  // Compares package.json against npm — no harness surface.
  {
    name: 'update',
    hosts: BOTH,
    fn: async () => (await import('./check-update.js')).checkUpdate(),
  },
  // 4.32.4 — dual install-channel conflict (warn-only): npm-global + standalone
  // binary both present → ambiguous PATH resolution + stale-update trap. The
  // harnessed CLI's own install, independent of which harness drives it.
  {
    name: 'install channel',
    hosts: BOTH,
    fn: async () => (await import('./check-install-channels.js')).checkInstallChannels(),
  },
  // issue #8 — orphaned harnessed Stop/UserPromptSubmit hooks (warn-only): a hook
  // pointing at a deleted bin/*.mjs makes Claude Code error MODULE_NOT_FOUND every
  // prompt; `harnessed uninstall` now strips them. claude-only: the whole check is
  // a settings.json read, and getSettingsPath() is null on codex.
  {
    name: 'stale hooks',
    hosts: ['claude'],
    fn: async () => (await import('./check-stale-hooks.js')).checkStaleHooks(),
  },
  // 4.32.22 — ECC per-harness detect (optional; pass unless CC-side ecc overlaps
  // the official chrome-devtools-mcp plugin → warn). CC plugin registry + codex
  // sync-clone probed independently — by construction a both-hosts check.
  { name: 'ecc', hosts: BOTH, fn: async () => (await import('./check-ecc.js')).checkEcc() },
  // 4.38.0 — half-installed per-turn injection (warn-only): perturn-inject
  // without perturn-inject-invalidate keeps skipping <project-context> after a
  // compact/clear has already dropped the copy it is skipping on behalf of.
  // claude-only: pairs two settings.json hook registrations (null path on codex).
  {
    name: 'per-turn inject pairing',
    hosts: ['claude'],
    fn: async () => (await import('./check-inject-invalidate.js')).checkInjectInvalidate(),
  },
  // Phase 56 — silently stale marketplace plugins (warn-only): `claude plugin
  // install` pins a version into a versioned cache dir and never re-resolves, so
  // the four cc-plugin-marketplace components drift behind without any signal.
  // The only comparison in the codebase between a genuinely DETECTED version and
  // a recorded one — see the header for why the installer-state layer cannot do it.
  // claude-only: needs the installed_plugins.json registry (null on codex).
  {
    name: 'plugin install freshness',
    hosts: ['claude'],
    fn: async () => (await import('./check-plugin-staleness.js')).checkPluginStaleness(),
  },
  // Phase 60 — HARNESSED_OFF left on (warn-only): the kill switch silences every
  // first-party hook, so a machine that forgot to unset it looks exactly like a
  // broken install. doctor is where that gets said out loud. Env var — and the
  // hooks it silences exist on both harnesses.
  {
    name: 'ablation switch',
    hosts: BOTH,
    fn: async () => (await import('./check-ablation.js')).checkAblation(),
  },
  // v16.0 Phase 64 (ADR 0041) — codex hook plugins (warn-only): codex silently
  // skips an untrusted / modified hook, so "installed" is not "running". codex-only:
  // the check early-returns unless the active platform id is `codex`.
  {
    name: 'codex hook plugins',
    hosts: ['codex'],
    fn: async () => (await import('./check-codex-hooks.js')).checkCodexHooks(),
  },
]

/** The checks that declare `host` — the set `doctor --host <id>` runs, and the
 *  non-null cells of that host's `doctor --matrix` column. Registry order kept. */
export function checksForHost(host: HostId): readonly CheckDescriptor[] {
  return CHECKS.filter((c) => c.hosts.includes(host))
}
