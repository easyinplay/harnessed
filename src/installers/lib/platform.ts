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
  settingsPath: string
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
 *   - `settingsPath === mcpConfigPath` — both point at the same `config.toml`
 *     (settings + `[mcp_servers.*]` live in one TOML file).
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
    settingsPath: configToml,
    // SHARED convention dir, NOT <homeDir>/skills.
    skillsDir: join(home, '.agents', 'skills'),
    commandsDir: join(codexHome, 'prompts'),
    pluginsRegistry: null,
    mcpConfigPath: configToml,
    supportsEnvKeyWrite: false,
  }
}

/** Known platform descriptors keyed by id (HARNESSED_PLATFORM / .platform pin lookup). */
function descriptorById(id: string, home: string): PlatformDescriptor | undefined {
  if (id === 'claude') return claudeDescriptor(home)
  if (id === 'codex') return codexDescriptor(home)
  return undefined
}

/**
 * Resolve the active platform descriptor.
 *
 * Phase C precedence (claude-first = zero blast radius for the incumbent):
 *   1. `HARNESSED_ROOT_OVERRIDE` set → claude descriptor with `stateRoot`
 *      replaced by the override verbatim (kept FIRST — preserves e2e test
 *      isolation; other fields stay claude-default, matching today).
 *   2. `HARNESSED_PLATFORM=<id>` env → that descriptor (claude | codex). Unknown
 *      id → ignore, fall through.
 *   3. `.platform` pin file at the claude/incumbent stateRoot (the well-known
 *      location) → the pinned descriptor if it names a known id. Absent /
 *      unreadable / unknown id → fall through.
 *   4. auto-probe: `~/.claude/` exists → claude (INCUMBENT wins); else
 *      `~/.codex/` exists → codex.
 *   5. fallback → `claudeDescriptor()`.
 *
 * A claude user with no env / no pin gets byte-identical behavior to today
 * (~/.claude present → step 4 returns claudeDescriptor; absent → step 5 same).
 * codex is reached ONLY via explicit opt-in (env / pin) or a codex-only host.
 */
export function detectPlatform(home: string = homedir()): PlatformDescriptor {
  const base = claudeDescriptor(home)

  // 1. HARNESSED_ROOT_OVERRIDE — FIRST, unchanged (test-isolation hook).
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  if (override !== undefined && override !== '') return { ...base, stateRoot: override }

  // 2. HARNESSED_PLATFORM env.
  const envPlatform = process.env.HARNESSED_PLATFORM
  if (envPlatform !== undefined && envPlatform !== '') {
    const d = descriptorById(envPlatform, home)
    if (d) return d
    // unknown id → fall through (do not throw — anti-footgun)
  }

  // 3. `.platform` pin at the claude/incumbent stateRoot.
  try {
    const pin = readFileSync(join(base.stateRoot, '.platform'), 'utf8').trim()
    const d = descriptorById(pin, home)
    if (d) return d
  } catch {
    // absent / unreadable → fall through
  }

  // 4. auto-probe — INCUMBENT (claude) wins when its home exists.
  //    Wrapped defensively: a partial `node:fs` mock (some unit tests stub only
  //    the sync writers they exercise) can leave `existsSync` undefined. Since
  //    the auto-probe only disambiguates the no-opt-in case and its absence of
  //    signal means "use the incumbent", any probe failure degrades to the
  //    claude-default fallback — byte-identical to the pre-Phase-C behavior.
  try {
    if (existsSync(base.homeDir)) return base
    const codex = codexDescriptor(home)
    if (existsSync(codex.homeDir)) return codex
  } catch {
    // existsSync unavailable / threw → fall through to claude fallback.
  }

  // 5. fallback → claude.
  return base
}

// ── Config-dir resolvers (Phase B / D1) ──────────────────────────────────────
//
// Each is a thin `detectPlatform(home).<field>` accessor. They centralize the
// ~7 scattered `~/.claude/`-config call sites behind the descriptor so Phase C
// (28) can retarget a second harness by swapping the descriptor, not the call
// sites. The optional `home` threads through capabilityResolver's homedirOverride
// test param (D2). HARNESSED_ROOT_OVERRIDE is orthogonal — it only moves
// stateRoot, so these config resolvers are unaffected by it.

/** `<home>/.claude/settings.json` — the shared user-scope settings file. */
export function getSettingsPath(home?: string): string {
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
 * `~/.claude/skills` + `~/.agents/skills`. Phase C / D6: replaces the hardcoded
 * `['.claude','.agents']` dual-probe in idempotent.ts so the probe set is
 * descriptor-derived (same paths, single source of truth). Order: claude first.
 */
export function harnessSkillsDirs(home?: string): string[] {
  const dirs = [claudeDescriptor(home).skillsDir, codexDescriptor(home).skillsDir]
  return [...new Set(dirs)]
}
