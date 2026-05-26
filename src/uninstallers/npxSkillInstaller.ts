// Phase 5.2 W1 T1.2 — uninstall method 6/7: npx-skill-installer.
// NOT ephemeral (npxSkill writes persistent files per RESEARCH § 2 L155 + Pitfall 2).
// extractSkillName imported from shared lib (sister installers/lib/idempotent.ts).

import { rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { extractSkillName } from '../installers/lib/idempotent.js'
import { dryRunGate } from './lib/runOrPreview.js'
import type { Uninstaller } from './lib/types.js'

export const uninstallNpxSkillInstaller: Uninstaller = async (ctx) => {
  const install = ctx.manifest.spec.install
  if (install.method !== 'npx-skill-installer') {
    return { ok: false, phase: 'preflight', error: `dispatch bug: ${install.method}` }
  }

  const abort = dryRunGate(ctx)
  if (abort) return abort

  const name = ctx.manifest.metadata.name
  const skillName = extractSkillName(install.cmd, name)
  const skillDir = join(homedir(), '.claude', 'skills', skillName)

  await rm(skillDir, { recursive: true, force: true, maxRetries: 3 })
  return { ok: true, removedPaths: [skillDir] }
}
