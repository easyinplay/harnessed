// Patch 4.10.1 installer-robustness Fix A + Fix B regression guards.
//
// Fix A — the git-clone skill-packs must `rm -rf <final-dest>` BEFORE writing
// that dest, so a force-update re-run is idempotent (prior dogfood: clone/cp
// into an existing dir exited 1). The `git clone <url> <dest>` shape MUST stay
// intact (extractCloneTarget + D-15 SHA-verify depend on it).
//
// 4.32.21 — ui-ux-pro-max cell REMOVED: manifest migrated git-clone-with-setup
// → cc-plugin-marketplace (official nextlevelbuilder/ui-ux-pro-max-skill
// plugin); its dry-run/method assertion now lives in
// tests/integration/manifest-install-dry-run.test.ts. gstack remains the sole
// git-clone skill-pack under this guard.
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
})

describe('Fix B — install timeout raised to 300s', () => {
  it('DEFAULT_INSTALL_TIMEOUT_MS === 300_000', () => {
    expect(DEFAULT_INSTALL_TIMEOUT_MS).toBe(300_000)
  })
})
