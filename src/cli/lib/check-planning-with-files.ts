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

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
}

const REMEDIATION =
  'install via Claude Code plugin marketplace: `claude plugin install planning-with-files` (requires >=2.2.0 per R20.15 + D-15)'

export async function checkPlanningWithFiles(): Promise<CheckResult> {
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
    }
  } catch {
    return {
      name: 'planning-with-files plugin',
      status: 'warn',
      message: 'not installed (plugin cache path missing)',
      fix: REMEDIATION,
    }
  }
}
