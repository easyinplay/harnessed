// v9.0 Cross-Harness — Phase A: the PlatformDescriptor seam.
//
// Refactor-first foundation (Beck: make-the-change-easy). This introduces a
// single descriptor type + a detect function so that, in later phases, the
// harness can target a second AI-coding harness (the `.agents/` platform) by
// returning a different descriptor — WITHOUT touching the call sites. Phase A
// adds ZERO behavior change: only the `claude` descriptor is populated, and
// only `stateRoot` is consumed (by getHarnessedRoot). The descriptor output is
// byte-identical to today's hardcoded `~/.claude/harnessed` path.
//
// Phase B (27) ADDS here:
//   - Optional `home` base on claudeDescriptor/detectPlatform (additive, default
//     homedir()) so test/override homedirs thread through WITHOUT re-hardcoding
//     `.claude`. No-arg callers (Phase A) stay byte-identical.
//   - 5 config-dir resolvers (getSettingsPath/getSkillsDir/getCommandsDir/
//     getPluginsRegistry/getMcpConfigPath) = thin `detectPlatform(home).<field>`
//     accessors that centralize the ~7 scattered `~/.claude/`-config call sites.
//
// Out of scope for Phase A/B (do NOT add here):
//   - Auto-probe detection, the `.agents/` descriptor, HARNESSED_PLATFORM,
//     `.platform` pin, `setup --platform` → Phase C (28). Anti-stale: do not
//     build detection branches before the second platform exists.

import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Describes where a given AI-coding harness keeps its state + config surfaces.
 *
 * Phase A defines all 8 fields but only populates the `claude` descriptor and
 * only consumes `stateRoot`. The settings/skills/commands/plugins/mcp fields are
 * consumed starting in Phase B; the non-`claude` `id` values are produced
 * starting in Phase C.
 *
 * Note `mcpConfigPath` is a homedir SIBLING (`~/.claude.json`), not a child of
 * `homeDir` — Claude Code stores its MCP config next to the `.claude` dir, not
 * inside it (the §7 D-A irregular field).
 */
export interface PlatformDescriptor {
  id: 'claude' | 'codex' | 'agents' | 'cursor' | 'gemini' | 'copilot'
  homeDir: string
  stateRoot: string
  /**
   * v16.0 Phase 63: `string | null`. The JSON settings file harnessed merges
   * hooks / env keys / guard exemptions into. `null` on a harness without one
   * (codex: its config.toml is TOML and only ever written by the codex CLI).
   * Consumers treat null as "no settings surface → skip with a reason", never
   * falling back to another file.
   */
  settingsPath: string | null
  skillsDir: string
  commandsDir: string
  /**
   * Phase C / D1: `string | null`. A harness without a filesystem plugin
   * registry (e.g. codex uses inline `[marketplaces.*]` in config.toml, not a
   * `installed_plugins.json`) sets this to `null`. Consumers treat null as
   * "no registry → no plugins" (capabilityResolver, readClaudeConfig).
   */
  pluginsRegistry: string | null
  mcpConfigPath: string
  /**
   * Phase C / D1: gates the 2 env-key settings writers
   * (enableAgentTeamsInSettings / enableUserLangInSettings). `true` for claude
   * (JSON `settings.json` env merge). `false` for codex — its config.toml is
   * TOML and the CC-specific env keys are meaningless, so writes are
   * capability-absent (no-op + inform, never a TOML write).
   */
  supportsEnvKeyWrite: boolean
  /**
   * Phase 35 / Spec 3-G: the env var this harness exposes carrying the active
   * session id, or `null` when it has none. Consumed by `activeKey` (and the
   * inject bin) to scope the workflow ledger pointer per session. `null` →
   * single-session fallback (bare repoKey), byte-identical to no session
   * scoping. claude → `CLAUDE_CODE_SESSION_ID`; codex → `CODEX_SESSION_ID`
   * (v16.0 Phase 63, measured on codex-cli 0.154: set in codex shells and equal
   * to the hook stdin session_id).
   */
  sessionIdEnv: string | null
}

/**
 * The Claude Code descriptor — byte-identical to the paths the harness used
 * before the seam existed. `homeDir = ~/.claude`; `stateRoot = ~/.claude/harnessed`
 * (the getHarnessedRoot SoT); `mcpConfigPath = ~/.claude.json` (homedir sibling).
 */
export function claudeDescriptor(home: string = homedir()): PlatformDescriptor {
  const claudeHome = join(home, '.claude')
  return {
    id: 'claude',
    homeDir: claudeHome,
    stateRoot: join(claudeHome, 'harnessed'),
    settingsPath: join(claudeHome, 'settings.json'),
    skillsDir: join(claudeHome, 'skills'),
    commandsDir: join(claudeHome, 'commands'),
    pluginsRegistry: join(claudeHome, 'plugins', 'installed_plugins.json'),
    // mcpConfigPath is a SIBLING of `.claude` (`<home>/.claude.json`), based on
    // the same home base — not a child of homeDir.
    mcpConfigPath: join(home, '.claude.json'),
    // claude writes its env keys into JSON settings.json (capability present).
    supportsEnvKeyWrite: true,
    // Claude Code exposes the active session id to Bash-invoked CLI + hooks.
    sessionIdEnv: 'CLAUDE_CODE_SESSION_ID',
  }
}

/**
 * The Codex descriptor (v9.0 Phase C / D2) — the first REAL second harness the
 * v9.0 seam targets. Host-verified 2026-06-24 (`~/.codex/` + developers.openai.com/codex).
 *
 * Divergences from claude that this descriptor encodes EXPLICITLY (no derivation):
 *   - `skillsDir` is the SHARED `~/.agents/skills` convention, NOT `~/.codex/skills`.
 *     (`.agents/skills/<name>/SKILL.md` is byte-compatible with CC's format; codex
 *     reads it. Codex's own bundled skills live at `~/.codex/skills/.system/` —
 *     irrelevant; harnessed-installed skills go to the shared dir.)
 *   - `settingsPath` is `null` — there is no JSON settings file. config.toml is
 *     reachable only as `mcpConfigPath`, and since v16.0 close that field is purely a
 *     LABEL: the diff preview names it as the file `codex mcp add` will write. Nothing
 *     in src/ reads it — the `[mcp_servers.*]` probe moved to `codex mcp list --json`
 *     and `[plugins.*]` to `codex plugin list --json`. v16.0 Phase 63 / close.
 *   - `pluginsRegistry` is `null` — codex has no `installed_plugins.json`
 *     (inline `[marketplaces.*]` instead).
 *   - `supportsEnvKeyWrite` is `false` — the CC env keys are meaningless to codex
 *     and its config is TOML, so harnessed's JSON env-key merge is capability-absent.
 */
export function codexDescriptor(home: string = homedir()): PlatformDescriptor {
  const codexHome = join(home, '.codex')
  const configToml = join(codexHome, 'config.toml')
  return {
    id: 'codex',
    homeDir: codexHome,
    stateRoot: join(codexHome, 'harnessed'),
    settingsPath: null,
    // SHARED convention dir, NOT <homeDir>/skills.
    skillsDir: join(home, '.agents', 'skills'),
    commandsDir: join(codexHome, 'prompts'),
    pluginsRegistry: null,
    mcpConfigPath: configToml,
    supportsEnvKeyWrite: false,
    // Measured on codex-cli 0.154: codex shells carry it, equal to hook session_id.
    sessionIdEnv: 'CODEX_SESSION_ID',
  }
}

/**
 * The host ids this harness can target, as ONE enumerable exported list.
 *
 * v16.0 Phase 67 / D16 (ADR 0043 Decision 15). Before this, the host enumeration
 * was hand-written in three places and there was nothing to derive a fourth from:
 * the lookup below was a private `if` chain (not enumerable), and `setup.ts` kept
 * its own `KNOWN_PLATFORMS` literal. `checkpoint adopt` needs the id list twice
 * (validating `--from`, and inferring "the other host" when it is omitted), so the
 * list is declared once here and CONSUMED by `setup.ts` — three hand-written
 * enumerations collapse to two, rather than growing to four.
 *
 * Deliberately NOT derived from `PlatformDescriptor['id']`: that union also carries
 * the aspirational ids (`agents` / `cursor` / `gemini` / `copilot`) for which no
 * descriptor exists, and `--from cursor` must be refused, not accepted and then
 * crash. This list is "hosts with a real descriptor", which is the useful set.
 */
export const HOST_IDS = ['claude', 'codex'] as const

/** A host id with a real descriptor (see `HOST_IDS`). */
export type HostId = (typeof HOST_IDS)[number]

/** Narrow arbitrary text (CLI input, a `.platform` pin, an env var) to a host id. */
export function isHostId(id: string): id is HostId {
  return (HOST_IDS as readonly string[]).includes(id)
}

/** The descriptor for a known host id — the single id→descriptor mapping. */
export function descriptorFor(id: HostId, home: string = homedir()): PlatformDescriptor {
  return id === 'codex' ? codexDescriptor(home) : claudeDescriptor(home)
}

/** Known platform descriptors keyed by id (HARNESSED_PLATFORM / .platform pin lookup).
 *  Tolerates arbitrary text because both callers pass unvalidated user input. */
function descriptorById(id: string, home: string): PlatformDescriptor | undefined {
  return isHostId(id) ? descriptorFor(id, home) : undefined
}

/**
 * Resolve the active platform descriptor.
 *
 * ADR 0040 precedence (v16.0 Phase 63) — first hit wins:
 *   1. `HARNESSED_PLATFORM=<id>` env (also how `setup --platform <id>` reaches the
 *      process) → that descriptor (claude | codex). Unknown id → fall through.
 *   2. host env sniff — effective only when EXACTLY ONE is set (non-blank):
 *        `CLAUDE_CODE_SESSION_ID` → claude, `CODEX_SESSION_ID` → codex.
 *      Both set (one harness launched inside the other) → ambiguous, fall through.
 *   3. `.platform` pin — codex stateRoot first, then the claude stateRoot (which
 *      also carries pins written by pre-0040 `setup --platform codex`). Absent /
 *      unreadable / unknown id → fall through.
 *   4. directory probe: `~/.claude/` exists → claude (incumbent); else `~/.codex/`
 *      exists → codex.
 *   5. fallback → claude.
 *
 * `HARNESSED_ROOT_OVERRIDE` replaces ONLY `stateRoot` of whatever was resolved
 * above — it no longer short-circuits to claude (ADR 0040 behavior change). Pins
 * are still read at the hosts' own stateRoots, never under the override.
 *
 * A claude user with no host env / no pin gets byte-identical behavior to before
 * (tests/installers/platform-golden.test.ts locks it).
 */
export function detectPlatform(home: string = homedir()): PlatformDescriptor {
  const resolved = resolveHost(home)
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  if (override !== undefined && override !== '') return { ...resolved, stateRoot: override }
  return resolved
}

function resolveHost(home: string): PlatformDescriptor {
  return resolveHostWithReason(home).descriptor
}

/**
 * Which rule of the precedence ladder actually DECIDED the host.
 *
 * Structured data, deliberately NOT a pre-formatted sentence: the consumer that
 * needs this (`checkpoint adopt`, which hard-refuses when `--from` names the host
 * it already resolved to and must say why it resolved that way) renders its own
 * English at the call site. `src/cli/checkpoint.ts` carries zero `t()` calls, so
 * checkpoint's user-facing strings live at the call site by convention, not in a
 * catalog and not here.
 *
 * Discriminated on `kind`, so a consumer can switch exhaustively.
 */
export type HostResolutionReason =
  /** 1. `HARNESSED_PLATFORM=<value>` named a known host. */
  | { kind: 'env-platform'; envVar: 'HARNESSED_PLATFORM'; value: string }
  /** 2. Exactly one host session env was set, and it names this host. */
  | { kind: 'host-session-env'; envVar: 'CLAUDE_CODE_SESSION_ID' | 'CODEX_SESSION_ID' }
  /** 3. A `.platform` pin at `pinPath` held a known host id. */
  | { kind: 'platform-pin'; pinPath: string; value: string }
  /** 4. `probedDir` exists on disk (claude's home is probed first, as incumbent). */
  | { kind: 'directory-probe'; probedDir: string }
  /** 5. No signal at all → claude. */
  | { kind: 'fallback' }

/**
 * A rule that was reached and REJECTED, so the ladder kept descending. Worth
 * reporting because these are the cases where a user set something that did not
 * take, which is exactly when "why did it resolve to that?" gets asked.
 *
 * An ABSENT `.platform` pin is not listed: that is the overwhelmingly common
 * path, not an attempted rule, and reporting it would bury the real signals.
 */
export type HostResolutionSkip =
  /** `HARNESSED_PLATFORM` was set to something that is not a known host id. The
   *  ladder deliberately does not throw here (anti-footgun), so without this the
   *  typo would be invisible. */
  | { kind: 'env-platform-unknown'; envVar: 'HARNESSED_PLATFORM'; value: string }
  /** Both host session envs were set — one harness launched inside the other, so
   *  neither names the host unambiguously. */
  | { kind: 'host-session-env-ambiguous' }
  /** A `.platform` pin was readable but did not name a known host id. */
  | { kind: 'platform-pin-unknown'; pinPath: string; value: string }

/** A resolved host plus the provenance of that decision. */
export interface HostResolution {
  descriptor: PlatformDescriptor
  /** The rule that decided. */
  reason: HostResolutionReason
  /** Rules attempted and rejected before it, in ladder order. Empty on the
   *  common path. */
  skipped: HostResolutionSkip[]
}

/**
 * The ADR 0040 precedence ladder documented on `detectPlatform`, returning the
 * resolved descriptor AND the rule that produced it.
 *
 * `resolveHost` / `detectPlatform` are the same walk with the reason discarded —
 * this is the single implementation, so a consumer that needs the provenance does
 * not re-derive a 5-branch ladder and drift from it.
 *
 * Note this is the resolution ONLY: `HARNESSED_ROOT_OVERRIDE` is applied by
 * `detectPlatform` afterwards and only to `stateRoot`, so the descriptor here
 * always carries the host's OWN state root. That is what a cross-root reader
 * wants — an override in effect must not make it believe the other host's ledger
 * lives under the override.
 */
export function resolveHostWithReason(home: string = homedir()): HostResolution {
  const base = claudeDescriptor(home)
  const skipped: HostResolutionSkip[] = []

  // 1. HARNESSED_PLATFORM env (explicit).
  const envPlatform = process.env.HARNESSED_PLATFORM
  if (envPlatform !== undefined && envPlatform !== '') {
    const d = descriptorById(envPlatform, home)
    if (d) {
      return {
        descriptor: d,
        reason: { kind: 'env-platform', envVar: 'HARNESSED_PLATFORM', value: envPlatform },
        skipped,
      }
    }
    // unknown id → fall through (do not throw — anti-footgun)
    skipped.push({ kind: 'env-platform-unknown', envVar: 'HARNESSED_PLATFORM', value: envPlatform })
  }

  // 2. host env sniff — a single session env names the host; both = nested → ambiguous.
  const inClaude = Boolean(process.env.CLAUDE_CODE_SESSION_ID?.trim())
  const inCodex = Boolean(process.env.CODEX_SESSION_ID?.trim())
  if (inClaude !== inCodex) {
    return {
      descriptor: inClaude ? base : codexDescriptor(home),
      reason: {
        kind: 'host-session-env',
        envVar: inClaude ? 'CLAUDE_CODE_SESSION_ID' : 'CODEX_SESSION_ID',
      },
      skipped,
    }
  }
  if (inClaude && inCodex) skipped.push({ kind: 'host-session-env-ambiguous' })

  // 3. `.platform` pin — codex stateRoot first, then claude stateRoot.
  for (const pinRoot of [codexDescriptor(home).stateRoot, base.stateRoot]) {
    const pinPath = join(pinRoot, '.platform')
    try {
      const value = readFileSync(pinPath, 'utf8').trim()
      const d = descriptorById(value, home)
      if (d) return { descriptor: d, reason: { kind: 'platform-pin', pinPath, value }, skipped }
      skipped.push({ kind: 'platform-pin-unknown', pinPath, value })
    } catch {
      // absent / unreadable → next
    }
  }

  // 4. directory probe — INCUMBENT (claude) wins when its home exists.
  //    Wrapped defensively: a partial `node:fs` mock (some unit tests stub only
  //    the sync writers they exercise) can leave `existsSync` undefined. Since
  //    the probe only disambiguates the no-opt-in case and its absence of
  //    signal means "use the incumbent", any probe failure degrades to the
  //    claude-default fallback.
  try {
    if (existsSync(base.homeDir)) {
      return {
        descriptor: base,
        reason: { kind: 'directory-probe', probedDir: base.homeDir },
        skipped,
      }
    }
    const codex = codexDescriptor(home)
    if (existsSync(codex.homeDir)) {
      return {
        descriptor: codex,
        reason: { kind: 'directory-probe', probedDir: codex.homeDir },
        skipped,
      }
    }
  } catch {
    // existsSync unavailable / threw → fall through to claude fallback.
  }

  // 5. fallback → claude.
  return { descriptor: base, reason: { kind: 'fallback' }, skipped }
}

// ── Config-dir resolvers (Phase B / D1) ──────────────────────────────────────
//
// Each is a thin `detectPlatform(home).<field>` accessor. They centralize the
// ~7 scattered `~/.claude/`-config call sites behind the descriptor so Phase C
// (28) can retarget a second harness by swapping the descriptor, not the call
// sites. The optional `home` threads through capabilityResolver's homedirOverride
// test param (D2). HARNESSED_ROOT_OVERRIDE is orthogonal — it only moves
// stateRoot, so these config resolvers are unaffected by it.

/**
 * `<home>/.claude/settings.json` — the shared user-scope settings file, or `null`
 * when the active platform has none (codex). Callers skip with a reason on null.
 */
export function getSettingsPath(home?: string): string | null {
  return detectPlatform(home).settingsPath
}

/** `<home>/.claude/skills` — user-skills install root. */
export function getSkillsDir(home?: string): string {
  return detectPlatform(home).skillsDir
}

/** `<home>/.claude/commands` — platform-level slash-command dir. */
export function getCommandsDir(home?: string): string {
  return detectPlatform(home).commandsDir
}

/**
 * Plugin registry path, or `null` when the active platform has none (codex).
 * Phase C / D4: widened to `string | null`; callers tolerate null as "no
 * registry → no plugins".
 */
export function getPluginsRegistry(home?: string): string | null {
  return detectPlatform(home).pluginsRegistry
}

/** `<home>/.claude.json` — CC MCP/plugin config (homedir SIBLING, not a child). */
export function getMcpConfigPath(home?: string): string {
  return detectPlatform(home).mcpConfigPath
}

/**
 * Deduped skills-dir set of ALL known descriptors (claude + codex) =
 * `~/.claude/skills` + `~/.agents/skills` + `~/.codex/skills`. Phase C / D6:
 * replaces the hardcoded `['.claude','.agents']` dual-probe in idempotent.ts so
 * the probe set is descriptor-derived (single source of truth). Order: claude first.
 *
 * v4.14.0 — added `~/.codex/skills`: codex's OWN skills dir is distinct from the
 * shared `~/.agents/skills` convention (its descriptor skillsDir), and upstream
 * installers targeting codex write there (e.g. `@opengsd/gsd-core --codex` →
 * `~/.codex/skills/gsd-<name>`). Probe-only widening — install targets still
 * come from the active descriptor's skillsDir.
 */
export function harnessSkillsDirs(home?: string): string[] {
  const codex = codexDescriptor(home)
  const dirs = [claudeDescriptor(home).skillsDir, codex.skillsDir, join(codex.homeDir, 'skills')]
  return [...new Set(dirs)]
}
