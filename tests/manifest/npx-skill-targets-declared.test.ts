// v5.0.11 — every npx-skill-installer install block must be able to PROVE its
// target set.
//
// Bug (codex host, `harnessed setup` exited 1 for every install):
//   manifests/skill-packs/planning-with-files.yaml was the ONLY
//   npx-skill-installer manifest that declared neither an explicit
//   `--skill <name>` selection in its install cmd nor a non-empty
//   `installs_skills` list. The npx skill installer's ownership guard
//   (src/installers/npxSkillInstaller.ts) refuses any pack whose target set it
//   cannot prove — and it refuses BEFORE it checks whether the component is
//   already installed. So the codex override was rejected as "unproven" even
//   though ~/.agents/skills/planning-with-files/ was present and complete, and
//   the whole setup exited 1.
//
// Contract enforced here: every install block whose effective method is
// `npx-skill-installer` (the base `spec.install` AND the
// `spec.harness_overrides.codex.install` override, which REPLACES the base
// install block wholesale on codex) EITHER
//   - names exactly one explicit `--skill <name>` / `-s <name>` selection in
//     its install cmd, OR
//   - declares a non-empty `installs_skills` list.
//
// The failure message lists every offending manifest (no hardcoded names), so
// a future pack that forgets to declare its target set fails here instead of
// silently breaking setup on one host.

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const ROOT = join(process.cwd(), 'manifests')

interface InstallBlock {
  method?: unknown
  cmd?: unknown
  installs_skills?: unknown
}

interface ManifestDoc {
  kind?: unknown
  spec?: {
    install?: InstallBlock
    harness_overrides?: { codex?: { install?: InstallBlock } }
  }
}

interface Offender {
  manifest: string
  block: string
  reason: string
}

function yamlFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...yamlFiles(full))
    else if (entry.name.endsWith('.yaml')) out.push(full)
  }
  return out
}

/**
 * Mirrors the installer's single-selection detection
 * (src/installers/npxSkillInstaller.ts → extractSingleSkillSelection in
 * src/installers/lib/idempotent.ts): exactly one `--skill <name>` / `-s <name>`
 * flag, exactly one selection.
 */
function namesOneExplicitSelection(cmd: string): boolean {
  const selections = [
    ...cmd.matchAll(
      /(?:^|\s)(?:--skill|-s)\s+['"]?([a-zA-Z0-9][a-zA-Z0-9._-]*)['"]?(?=\s+-|\s*$)/g,
    ),
  ]
  const selectionFlags = [...cmd.matchAll(/(?:^|\s)(?:--skill|-s)(?:\s|=)/g)]
  return selections.length === 1 && selectionFlags.length === 1
}

function collectOffenders(): { offenders: Offender[]; checked: number } {
  const offenders: Offender[] = []
  let checked = 0
  for (const file of yamlFiles(ROOT)) {
    const rel = relative(ROOT, file).split('\\').join('/')
    const doc = parseYaml(readFileSync(file, 'utf8')) as ManifestDoc | null
    // manifests/aliases.yaml is not a Manifest (different schemaVersion).
    if (!doc || doc.kind !== 'Manifest') continue
    const blocks: Array<[string, InstallBlock | undefined]> = [
      ['spec.install', doc.spec?.install],
      ['spec.harness_overrides.codex.install', doc.spec?.harness_overrides?.codex?.install],
    ]
    for (const [label, install] of blocks) {
      if (!install || install.method !== 'npx-skill-installer') continue
      checked += 1
      const declaresTargets =
        Array.isArray(install.installs_skills) && install.installs_skills.length > 0
      const cmd = typeof install.cmd === 'string' ? install.cmd : ''
      if (declaresTargets || namesOneExplicitSelection(cmd)) continue
      offenders.push({
        manifest: rel,
        block: label,
        reason:
          'npx-skill-installer install proves no target set: the cmd names no single explicit `--skill <name>` selection and `installs_skills` is missing or empty, so the ownership guard refuses it as unproven',
      })
    }
  }
  return { offenders, checked }
}

describe('manifests: every npx-skill-installer install proves its target set', () => {
  const { offenders, checked } = collectOffenders()

  it('audits at least one npx-skill-installer install block', () => {
    expect(checked).toBeGreaterThan(0)
  })

  it('declares an explicit skill selection or a non-empty installs_skills for every npx-skill-installer install', () => {
    expect(offenders.map((o) => `${o.manifest} ${o.block}: ${o.reason}`)).toEqual([])
  })
})
