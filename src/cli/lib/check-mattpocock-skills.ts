// v3.6.0 Phase 2 Wave 1 — 11th doctor check (mattpocock-skills install probe per
// user reframe "setup 时检测 mattpocock-skills 并安装"). File-based probe NOT
// shell CLI (sister check-planning-with-files.ts pattern; avoids dependency on
// `claude plugin list`).
//
// Probe locations (try both per mattpocock dual support):
//   1. ~/.claude/plugins/cache/mattpocock-skills/mattpocock-skills/<version>/  (plugin form)
//   2. ~/.claude/skills/mattpocock-skills/                                       (user-skill form)
// Either present → pass. Both missing → warn (non-blocking per warn ≠ fail R2.4.1)
// — methodology fallback already inline in role-prompts.yaml per v3.6.0 Phase 1,
// so install is optional; remediation enables /grill-with-docs /zoom-out etc.
// SlashCommand acceleration.

import { readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

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
  'is optional but enables /grill-with-docs /zoom-out etc. SlashCommand acceleration'

const INSTALL_COMMANDS = ['npx skills@latest add mattpocock/skills'] as const

export async function checkMattpocockSkills(): Promise<CheckResult> {
  const pluginRoot = join(
    homedir(),
    '.claude',
    'plugins',
    'cache',
    'mattpocock-skills',
    'mattpocock-skills',
  )
  const skillRoot = join(homedir(), '.claude', 'skills', 'mattpocock-skills')

  // Try plugin form first (sister check-planning-with-files.ts L24-43)
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

  // Try user-skill form
  try {
    await stat(skillRoot)
    return {
      name: 'mattpocock-skills',
      status: 'pass',
      message: `installed as user-skill (${skillRoot})`,
    }
  } catch {
    // fall through to warn
  }

  return {
    name: 'mattpocock-skills',
    status: 'warn',
    message: 'not installed (plugin cache + user-skill paths both missing)',
    fix: REMEDIATION,
    install_commands: INSTALL_COMMANDS,
  }
}
