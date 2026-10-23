// Phase v2.0-2.4 W3 T2.4.W3.1 — 10th doctor check (planning-with-files plugin
// presence per R20.15 acceptance d + D-15). File-based probe NOT shell CLI call
// (sister checkAgentTeams.ts pattern; avoids dependency on `claude plugin list`).
//
// Probe path: ~/.claude/plugins/cache/planning-with-files/planning-with-files/<version>/
// per capabilities.yaml planning-with-files.plugin_path field. Real install path
// verified 2026-05-20: `~/.claude/plugins/cache/planning-with-files/planning-with-files/2.34.0/`.
// Missing → warn (non-blocking per warn ≠ fail R2.4.1) with `claude plugin install` remediation.

import { readdir, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { getPluginsRegistry } from '../../platform/platform.js'
// v16.0 Phase 66 T5 — shared CheckResult (its `status` now carries `skipped`)
// instead of a local re-declaration that would have to be widened in parallel.
import type { CheckResult } from './check-builtin.js'

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

async function readableContent(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile() && (await readFile(path, 'utf8')).trim().length > 0
  } catch {
    return false
  }
}

async function hasResourceContent(path: string): Promise<boolean> {
  try {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (entry.isFile() && (await readableContent(join(path, entry.name)))) return true
    }
  } catch {
    // Missing, unreadable, or not a resource directory.
  }
  return false
}

async function hasPlanningContent(root: string): Promise<boolean> {
  return (
    (await readableContent(join(root, 'SKILL.md'))) &&
    (await hasResourceContent(join(root, 'scripts'))) &&
    (await hasResourceContent(join(root, 'templates')))
  )
}

export async function checkPlanningWithFiles(): Promise<CheckResult> {
  // v4.14.0 — plugin-cache probe is a claude-only concept. On a platform with
  // no plugin registry (codex) the warn + `claude plugin install` remediation
  // would be misleading (setup's codex install path is the harness_overrides
  // npx-skill route, verified by its own manifest verify).
  // v16.0 Phase 66 T5 — `skipped`, not a `pass` that says "skipped" in prose.
  if (getPluginsRegistry() === null) {
    return {
      name: 'planning-with-files plugin',
      status: 'skipped',
      message:
        'skipped (Claude-only plugin-cache probe; Codex installed skills, content and runtime are not verified)',
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
    const entries = await readdir(root, { withFileTypes: true })
    for (const version of entries) {
      if (!version.isDirectory() || !/^\d+\.\d+/.test(version.name)) continue
      const versionRoot = join(root, version.name)
      // Resources must accompany SKILL.md at the same candidate root.
      for (const candidate of [join(versionRoot, 'skills', 'planning-with-files'), versionRoot]) {
        if (await hasPlanningContent(candidate)) {
          return {
            name: 'planning-with-files plugin',
            status: 'pass',
            message: `local planning-with-files content detected (version ${version.name}; SKILL.md, scripts and templates); runtime execution not verified`,
          }
        }
      }
    }
    return {
      name: 'planning-with-files plugin',
      status: 'warn',
      message:
        'no readable nonempty planning-with-files skill, scripts and templates found together',
      fix: REMEDIATION,
      install_commands: INSTALL_COMMANDS,
    }
  } catch {
    return {
      name: 'planning-with-files plugin',
      status: 'warn',
      message: 'local plugin content not detected (plugin cache path missing or unreadable)',
      fix: REMEDIATION,
      install_commands: INSTALL_COMMANDS,
    }
  }
}
