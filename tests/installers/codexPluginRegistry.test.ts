// External review M15 — on codex the cc-plugin idempotency probe could never
// return true: isPluginRegistered knew only Claude Code's JSON registries, and
// codex keeps installed plugins as `[plugins."<p>@<m>"]` tables in
// ~/.codex/config.toml (host-verified). Every `harnessed setup` re-ran
// `codex plugin add`.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isPluginInToml, isPluginRegistered } from '../../src/installers/lib/readClaudeConfig.js'

const TOML = [
  '[marketplaces.codex-warp]',
  'source = "https://github.com/warpdotdev/codex-warp.git"',
  '',
  '[plugins."superpowers@openai-curated"]',
  'enabled = true',
  '',
  "[plugins.'ecc@ecc']",
  'enabled = false',
].join('\n')

describe('isPluginInToml', () => {
  it.each([
    ['superpowers', true],
    ['superpowers@openai-curated', true],
    ['superpowers@other-market', false],
    ['ecc', true],
    ['ecc@ecc', true],
    ['super', false],
    ['codex-warp', false],
    ['warp', false],
  ])('%s → %s', (name, expected) => {
    expect(isPluginInToml(TOML, name)).toBe(expected)
  })

  it('regex metacharacters in the name are literal', () => {
    expect(isPluginInToml('[plugins."a.b@m"]\n', 'a.b')).toBe(true)
    expect(isPluginInToml('[plugins."axb@m"]\n', 'a.b')).toBe(false)
  })
})

describe('isPluginRegistered on codex reads ~/.codex/config.toml', () => {
  let home: string

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'harnessed-codex-plugins-'))
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('HOME', home)
    vi.stubEnv('USERPROFILE', home)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(home, { recursive: true, force: true })
  })

  it('registered plugin → true (was always false: the probe never looked here)', async () => {
    mkdirSync(join(home, '.codex'), { recursive: true })
    writeFileSync(join(home, '.codex', 'config.toml'), TOML)
    await expect(isPluginRegistered('superpowers')).resolves.toBe(true)
  })

  it('plugin absent from the registry → false', async () => {
    mkdirSync(join(home, '.codex'), { recursive: true })
    writeFileSync(join(home, '.codex', 'config.toml'), TOML)
    await expect(isPluginRegistered('gstack')).resolves.toBe(false)
  })

  it('codex never configured (no config.toml) → false, no throw', async () => {
    await expect(isPluginRegistered('superpowers')).resolves.toBe(false)
  })
})
