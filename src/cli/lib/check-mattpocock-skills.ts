// v3.6.0 Phase 2 Wave 1 — 11th doctor check (mattpocock-skills install probe per
// user reframe "setup 时检测 mattpocock-skills 并安装"). File-based probe NOT
// shell CLI (sister check-planning-with-files.ts pattern; avoids dependency on
// `claude plugin list`).
//
// Probe locations (try both per mattpocock dual support):
//   1. ~/.claude/plugins/cache/mattpocock-skills/mattpocock-skills/<version>/  (plugin form)
//   2. <harness skills dirs>/mattpocock-skills/                                 (user-skill form)
// Either present → pass. Both missing → warn (non-blocking per warn ≠ fail R2.4.1)
// — methodology fallback already inline in role-prompts.yaml per v3.6.0 Phase 1,
// so install is optional; remediation enables /grill-with-docs /diagnosing-bugs etc.
// SlashCommand acceleration.
//
// v4.14.0 — cross-harness: plugin-cache probe gated on getPluginsRegistry()
// (claude-only concept), skill probes span harnessSkillsDirs(), and the
// install_commands --agent is computed from the ACTIVE platform at check time.

import { readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  detectPlatform,
  getPluginsRegistry,
  harnessSkillsDirs,
} from '../../installers/lib/platform.js'

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

export async function checkMattpocockSkills(): Promise<CheckResult> {
  const pluginRoot = join(
    homedir(),
    '.claude',
    'plugins',
    'cache',
    'mattpocock-skills',
    'mattpocock-skills',
  )

  // Try plugin form first (sister check-planning-with-files.ts L24-43).
  // v4.14.0 — claude-only concept; skipped where no plugin registry exists.
  if (getPluginsRegistry() !== null) {
    try {
      const entries = await readdir(pluginRoot)
      const versions = entries.filter((e) => /^\d+\.\d+/.test(e))
      if (versions.length > 0) {
        return {
          name: 'mattpocock-skills',
          status: 'pass',
          message: `installed as plugin (version ${versions.join(', ')})`,
        }
      }
    } catch {
      // fall through to user-skill check
    }
  }

  // Try user-skill form across ALL harness skills dirs (v4.14.0 — was
  // hardcoded ~/.claude/skills; codex installs land in ~/.agents/skills).
  for (const skillsDir of harnessSkillsDirs()) {
    try {
      const skillRoot = join(skillsDir, 'mattpocock-skills')
      await stat(skillRoot)
      return {
        name: 'mattpocock-skills',
        status: 'pass',
        message: `installed as user-skill (${skillRoot})`,
      }
    } catch {
      // fall through to indicator-skill check
    }
  }

  // v3.9.20 — npx skills CLI installs individual skill dirs without a parent
  // `mattpocock-skills/` folder. Sister INSTALLED_INDICATORS pattern in
  // src/installers/lib/idempotent.ts.
  // v4.16.0 — upstream renamed `diagnose` → `diagnosing-bugs`, dropped
  // `zoom-out` (verified 2026-07-03); legacy `diagnose` kept for pre-rename installs.
  const indicators = ['tdd', 'diagnosing-bugs', 'grill-with-docs', 'diagnose']
  for (const skillsDir of harnessSkillsDirs()) {
    for (const ind of indicators) {
      try {
        await stat(join(skillsDir, ind))
        return {
          name: 'mattpocock-skills',
          status: 'pass',
          message: `installed as individual skills (found ${ind}/)`,
        }
      } catch {
        // try next indicator
      }
    }
  }

  return {
    name: 'mattpocock-skills',
    status: 'warn',
    message: 'not installed (plugin cache + user-skill paths both missing)',
    fix: REMEDIATION,
    install_commands: installCommands(),
  }
}
