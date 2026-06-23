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
  id: 'claude' | 'agents' | 'cursor' | 'gemini' | 'copilot'
  homeDir: string
  stateRoot: string
  settingsPath: string
  skillsDir: string
  commandsDir: string
  pluginsRegistry: string
  mcpConfigPath: string
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
  }
}

/**
 * Resolve the active platform descriptor.
 *
 * Phase A precedence ONLY:
 *   1. `HARNESSED_ROOT_OVERRIDE` set → claude descriptor with `stateRoot`
 *      replaced by the override verbatim (preserves e2e test isolation; other
 *      fields stay claude-default, matching today where only the harnessed root
 *      is overridden).
 *   2. else → `claudeDescriptor()`.
 *
 * NO auto-probe, NO `.agents/` fallback, NO `HARNESSED_PLATFORM` handling — those
 * are Phase C (anti-stale: don't build detection branches before the second
 * platform exists).
 */
export function detectPlatform(home: string = homedir()): PlatformDescriptor {
  const base = claudeDescriptor(home)
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  if (override !== undefined && override !== '') return { ...base, stateRoot: override }
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

/** `<home>/.claude/plugins/installed_plugins.json` — CC plugin registry. */
export function getPluginsRegistry(home?: string): string {
  return detectPlatform(home).pluginsRegistry
}

/** `<home>/.claude.json` — CC MCP/plugin config (homedir SIBLING, not a child). */
export function getMcpConfigPath(home?: string): string {
  return detectPlatform(home).mcpConfigPath
}
