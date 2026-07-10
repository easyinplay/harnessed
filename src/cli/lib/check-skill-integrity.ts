// 4.23.0 (issue #3) — doctor check: installed workflow-skill integrity.
//
// A skill pack copying into the flat ~/.claude/skills namespace can silently
// shadow a shipped harnessed workflow (observed: mattpocock `research`, gstack
// `retro`). The slash command keeps existing but never enters the engine, so
// the failure is invisible without an explicit audit surface. warn-only:
// `harnessed setup` self-heals; doctor points there.

import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { getSkillsDir } from '../../installers/lib/platform.js'
import { getAssetsRoot } from './assetsRoot.js'
import type { CheckResult } from './check-builtin.js'
import { scanWorkflowsNested } from './scan-nested.js'
import { attachCulprits, auditInstalledSkills, buildCulpritIndex } from './skillIntegrity.js'

export async function checkSkillIntegrity(): Promise<CheckResult> {
  const name = 'workflow skill integrity'
  try {
    const assetsRoot = getAssetsRoot()
    const workflowsDir = resolve(assetsRoot, 'workflows')
    const entries = await readdir(workflowsDir)
    const { workflows } = await scanWorkflowsNested(workflowsDir, entries)
    if (workflows.length === 0) {
      return { name, status: 'pass', message: 'no shipped workflows to audit' }
    }
    const packsDir = resolve(assetsRoot, 'manifests', 'skill-packs')
    let manifestPaths: string[] = []
    try {
      manifestPaths = (await readdir(packsDir))
        .filter((f) => f.endsWith('.yaml'))
        .map((f) => resolve(packsDir, f))
    } catch {
      /* no packs dir → no culprit index, audit still runs */
    }
    const audit = attachCulprits(
      await auditInstalledSkills(workflows, getSkillsDir(), workflowsDir),
      await buildCulpritIndex(manifestPaths),
    )
    const bad = audit.filter((e) => e.status !== 'ok')
    if (bad.length === 0) {
      return {
        name,
        status: 'pass',
        message: `${audit.length} installed workflow skill(s) match their install-time hash ledger`,
      }
    }
    const detail = bad
      .map((e) => `${e.name} (${e.status}${e.culprit ? `, likely pack '${e.culprit}'` : ''})`)
      .join(', ')
    return {
      name,
      status: 'warn',
      message: `${bad.length} workflow skill(s) diverged from the install-time state (foreign/tampered/stale/missing) — the slash command may NOT enter the engine: ${detail}`,
      fix: 're-run `harnessed setup` (its end-of-run integrity pass restores + re-pins the shipped versions)',
    }
  } catch {
    // Fail-soft: an unreadable env is not a health failure for this check.
    return { name, status: 'pass', message: 'skipped (environment not auditable)' }
  }
}
