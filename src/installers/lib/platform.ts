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
// Out of scope for Phase A (do NOT add here):
//   - Config-dir resolvers consuming settings/skills/commands/plugins/mcp → Phase B (27).
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
export function claudeDescriptor(): PlatformDescriptor {
  const home = join(homedir(), '.claude')
  return {
    id: 'claude',
    homeDir: home,
    stateRoot: join(home, 'harnessed'),
    settingsPath: join(home, 'settings.json'),
    skillsDir: join(home, 'skills'),
    commandsDir: join(home, 'commands'),
    pluginsRegistry: join(home, 'plugins', 'installed_plugins.json'),
    mcpConfigPath: join(homedir(), '.claude.json'),
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
export function detectPlatform(): PlatformDescriptor {
  const base = claudeDescriptor()
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  if (override !== undefined && override !== '') return { ...base, stateRoot: override }
  return base
}
