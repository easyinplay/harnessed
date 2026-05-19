// Phase 5.2 W1 T1.2 — uninstall method 6/7: npx-skill-installer.
// NOT ephemeral (npxSkill writes persistent files per RESEARCH § 2 L155 + Pitfall 2).
// extractSkillName inline — sister src/installers/npxSkillInstaller.ts L47-54 YAGNI.

import { rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { dryRunGate } from './lib/runOrPreview.js'
import type { Uninstaller } from './lib/types.js'

// sister src/installers/npxSkillInstaller.ts extractSkillName — refactor to shared lib if 3rd caller appears.
function extractSkillName(cmd: string, fallback: string): string {
  const m = cmd.match(/\bskills(?:@\S+)?\s+add\s+(\S+)/i)
  if (!m || m[1] === undefined) return fallback
  const ref = m[1]
  const seg = ref.split('/')
  return seg[seg.length - 1] ?? fallback
}

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
