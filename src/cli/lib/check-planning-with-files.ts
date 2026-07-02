// Phase v2.0-2.4 W3 T2.4.W3.1 — 10th doctor check (planning-with-files plugin
// presence per R20.15 acceptance d + D-15). File-based probe NOT shell CLI call
// (sister checkAgentTeams.ts pattern; avoids dependency on `claude plugin list`).
//
// Probe path: ~/.claude/plugins/cache/planning-with-files/planning-with-files/<version>/
// per capabilities.yaml planning-with-files.plugin_path field. Real install path
// verified 2026-05-20: `~/.claude/plugins/cache/planning-with-files/planning-with-files/2.34.0/`.
// Missing → warn (non-blocking per warn ≠ fail R2.4.1) with `claude plugin install` remediation.

import { readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { getPluginsRegistry } from '../../installers/lib/platform.js'

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
  install_commands?: readonly string[]
}

// v3.9.1 — planning-with-files lives in OthmanAdi/planning-with-files
// marketplace (NOT default claude marketplace). Two-step install:
//   1. claude plugin marketplace add OthmanAdi/planning-with-files
//   2. claude plugin install planning-with-files
const REMEDIATION =
  'install via `claude plugin marketplace add OthmanAdi/planning-with-files && ' +
  'claude plugin install planning-with-files` (requires >=2.2.0 per R20.15 + D-15)'

const INSTALL_COMMANDS = [
  'claude plugin marketplace add OthmanAdi/planning-with-files',
  'claude plugin install planning-with-files',
] as const

export async function checkPlanningWithFiles(): Promise<CheckResult> {
  // v4.14.0 — plugin-cache probe is a claude-only concept. On a platform with
  // no plugin registry (codex) the warn + `claude plugin install` remediation
  // would be misleading → pass-skip (setup's codex install path is the
  // harness_overrides npx-skill route, verified by its own manifest verify).
  if (getPluginsRegistry() === null) {
    return {
      name: 'planning-with-files plugin',
      status: 'pass',
      message: 'skipped (claude-only plugin-cache probe; no plugin registry on this platform)',
    }
  }
  const root = join(
    homedir(),
    '.claude',
    'plugins',
    'cache',
    'planning-with-files',
    'planning-with-files',
  )
  try {
    const entries = await readdir(root)
    // entries are version subdirs (e.g., '2.34.0'); at least one = installed.
    const versions = entries.filter((e) => /^\d+\.\d+/.test(e))
    if (versions.length > 0) {
      return {
        name: 'planning-with-files plugin',
        status: 'pass',
        message: `installed (version ${versions.join(', ')})`,
      }
    }
    return {
      name: 'planning-with-files plugin',
      status: 'warn',
      message: 'plugin directory exists but no version subdir found',
      fix: REMEDIATION,
      install_commands: INSTALL_COMMANDS,
    }
  } catch {
    return {
      name: 'planning-with-files plugin',
      status: 'warn',
      message: 'not installed (plugin cache path missing)',
      fix: REMEDIATION,
      install_commands: INSTALL_COMMANDS,
    }
  }
}
