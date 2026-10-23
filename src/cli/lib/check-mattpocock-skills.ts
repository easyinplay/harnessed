// v3.6.0 Phase 2 Wave 1 — 11th doctor check (mattpocock-skills install probe per
// user reframe "setup 时检测 mattpocock-skills 并安装"). File-based probe NOT
// shell CLI (sister check-planning-with-files.ts pattern; avoids dependency on
// `claude plugin list`).
//
// Probe locations (try both per mattpocock dual support):
//   1. ~/.claude/plugins/cache/mattpocock-skills/mattpocock-skills/<version>/  (plugin form)
//   2. <harness skills dirs>/mattpocock-skills/                                 (user-skill form)
// At least one readable indicator SKILL.md → partial local content detected.
// Directory presence alone is insufficient; runtime execution is not verified.
// — methodology fallback already inline in role-prompts.yaml per v3.6.0 Phase 1,
// so install is optional; remediation enables /grill-with-docs /diagnosing-bugs etc.
// SlashCommand acceleration.
//
// v4.14.0 — cross-harness: plugin-cache probe gated on getPluginsRegistry()
// (claude-only concept), skill probes span harnessSkillsDirs(), and the
// install_commands --agent is computed from the ACTIVE platform at check time.

import { readdir, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  detectPlatform,
  getPluginsRegistry,
  getSkillsDir,
  harnessSkillsDirs,
} from '../../platform/platform.js'

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
  install_commands?: readonly string[]
}

// v3.9.1 — mattpocock-skills is NOT in any default Claude Code plugin marketplace
// (v3.9.0 P4 dogfood discovery: `claude plugin install mattpocock-skills` fails
// with "Plugin not found in any configured marketplace"). Correct install path
// is the upstream `skills` CLI:
//   npx skills@latest add mattpocock/skills
// which clones into ~/.claude/skills/mattpocock-skills (user-skill form).
const REMEDIATION =
  'install via `npx skills@latest add mattpocock/skills` ' +
  '(or git clone https://github.com/mattpocock/skills ~/.claude/skills/mattpocock-skills); ' +
  'methodology fallback already inline in role-prompts.yaml per v3.6.0 Phase 1 — install ' +
  'is optional but enables /grill-with-docs /tdd /diagnosing-bugs etc. SlashCommand acceleration'

// v4.13.0 — --copy (Windows symlink-safe) + -y (skills CLI prompts hang
// non-interactive spawns; sister manifests/skill-packs yaml).
// v4.14.0 — --agent computed per platform (was hardcoded claude-code — wrong
// install target on codex). Function, not module const: detectPlatform must
// resolve at CHECK time, not import time.
function installCommands(): readonly string[] {
  const agent = detectPlatform().id === 'codex' ? 'codex' : 'claude-code'
  return [`npx skills@latest add mattpocock/skills --copy -y --agent ${agent}`] as const
}

const INDICATORS = ['tdd', 'diagnosing-bugs', 'grill-with-docs', 'diagnose'] as const

async function hasSkillContent(root: string): Promise<boolean> {
  try {
    const path = join(root, 'SKILL.md')
    return (await stat(path)).isFile() && (await readFile(path, 'utf8')).trim().length > 0
  } catch {
    return false
  }
}

async function findIndicator(root: string): Promise<string | null> {
  for (const indicator of INDICATORS) {
    if (await hasSkillContent(join(root, indicator))) return indicator
  }
  return null
}

function contentDetected(indicator: string, root: string): CheckResult {
  return {
    name: 'mattpocock-skills',
    status: 'pass',
    message: `partial local content detected: ${indicator}/SKILL.md (${root}); complete package and runtime not verified`,
  }
}

export async function checkMattpocockSkills(): Promise<CheckResult> {
  const platform = detectPlatform()
  const pluginRoot = join(
    homedir(),
    '.claude',
    'plugins',
    'cache',
    'mattpocock-skills',
    'mattpocock-skills',
  )

  // Plugin versions are candidates, not evidence of installed skill content.
  if (getPluginsRegistry() !== null) {
    try {
      const entries = await readdir(pluginRoot, { withFileTypes: true })
      for (const version of entries) {
        if (!version.isDirectory() || !/^\d+\.\d+/.test(version.name)) continue
        const root = join(pluginRoot, version.name, 'skills')
        const indicator = await findIndicator(root)
        if (indicator) return contentDetected(indicator, root)
      }
    } catch {
      // fall through to user-skill check
    }
  }

  // A package-level document alone does not establish any known indicator.
  const skillsDirs =
    platform.id === 'codex'
      ? [getSkillsDir(), join(process.env.CODEX_HOME || platform.homeDir, 'skills')]
      : harnessSkillsDirs()
  let packageContent = false
  for (const skillsDir of skillsDirs) {
    const packRoot = join(skillsDir, 'mattpocock-skills')
    for (const root of [packRoot, join(packRoot, 'skills'), skillsDir]) {
      const indicator = await findIndicator(root)
      if (indicator) return contentDetected(indicator, root)
    }
    packageContent = (await hasSkillContent(packRoot)) || packageContent
  }

  return {
    name: 'mattpocock-skills',
    status: 'warn',
    message: packageContent
      ? 'local package SKILL.md content detected, but no readable known indicator; package completeness and runtime not verified'
      : 'no readable nonempty known indicator SKILL.md detected (plugin cache + user-skill paths); runtime not verified',
    fix:
      platform.id === 'codex'
        ? 'install via `npx skills@latest add mattpocock/skills --copy -y --agent codex`; optional methodology fallback remains in role-prompts.yaml'
        : REMEDIATION,
    install_commands: installCommands(),
  }
}
