// Patch 4.10.1 installer-robustness Fix A + Fix B regression guards.
//
// Fix A — the 3 git-clone skill-packs (gstack / frontend-design / ui-ux-pro-max)
// must `rm -rf <final-dest>` BEFORE writing that dest, so a force-update re-run
// is idempotent (prior dogfood: clone/cp into an existing dir exited 1). The
// `git clone <url> <dest>` shape MUST stay intact (extractCloneTarget + D-15
// SHA-verify depend on it).
//
// Fix B — DEFAULT_INSTALL_TIMEOUT_MS bumped 120s → 300s (cold npx/clone exceeds
// 120s on real machines; comet gives npx skills 300s).

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEFAULT_INSTALL_TIMEOUT_MS } from '../../src/installers/lib/spawn.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const MANIFESTS = resolve(process.cwd(), 'manifests', 'skill-packs')

async function loadCmd(file: string): Promise<string> {
  const src = await readFile(resolve(MANIFESTS, file), 'utf8')
  const v = validateManifestFile(src, file)
  if (!v.ok) throw new Error(`manifest invalid: ${v.errors[0]?.message ?? 'unknown'}`)
  return v.manifest.spec.install.cmd
}

describe('Fix A — git-clone skill-packs rm final dest before write (idempotent re-run)', () => {
  it('gstack: rm -rf ~/.claude/skills/gstack precedes git clone to same dest; clone shape intact', async () => {
    const cmd = await loadCmd('gstack.yaml')
    const rmIdx = cmd.indexOf('rm -rf ~/.claude/skills/gstack')
    const cloneIdx = cmd.indexOf(
      'git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack',
    )
    expect(rmIdx).toBeGreaterThanOrEqual(0)
    expect(cloneIdx).toBeGreaterThan(rmIdx) // rm BEFORE clone
    // git clone <url> <dest> shape preserved (extractCloneTarget dependency)
    expect(cmd).toContain(
      'git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack',
    )
  })

  it('frontend-design: rm -rf final dest precedes cp into it; clone shape intact', async () => {
    const cmd = await loadCmd('frontend-design.yaml')
    const rmFinalIdx = cmd.indexOf('rm -rf ~/.claude/skills/frontend-design ')
    const cpIdx = cmd.indexOf(
      'cp -R ~/.claude/skills/.cache/anthropics-skills-fe/skills/frontend-design ~/.claude/skills/frontend-design',
    )
    expect(rmFinalIdx).toBeGreaterThanOrEqual(0)
    expect(cpIdx).toBeGreaterThan(rmFinalIdx) // rm final dest BEFORE cp
    // git clone into cache dir unchanged
    expect(cmd).toContain(
      'git clone https://github.com/anthropics/skills.git ~/.claude/skills/.cache/anthropics-skills-fe',
    )
  })

  it('ui-ux-pro-max: rm -rf final dest precedes cp into it; clone shape intact', async () => {
    const cmd = await loadCmd('ui-ux-pro-max.yaml')
    const rmFinalIdx = cmd.indexOf('rm -rf ~/.claude/skills/ui-ux-pro-max ')
    const cpIdx = cmd.indexOf(
      'cp -R ~/.claude/skills/.cache/midway-uiux/.codex/skills/ui-ux-pro-max ~/.claude/skills/ui-ux-pro-max',
    )
    expect(rmFinalIdx).toBeGreaterThanOrEqual(0)
    expect(cpIdx).toBeGreaterThan(rmFinalIdx) // rm final dest BEFORE cp
    // git clone into cache dir unchanged (depth/branch flags preserved)
    expect(cmd).toContain(
      'git clone --depth 1 --branch v4-next https://github.com/midwayjs/midway.git ~/.claude/skills/.cache/midway-uiux',
    )
  })
})

describe('Fix B — install timeout raised to 300s', () => {
  it('DEFAULT_INSTALL_TIMEOUT_MS === 300_000', () => {
    expect(DEFAULT_INSTALL_TIMEOUT_MS).toBe(300_000)
  })
})
