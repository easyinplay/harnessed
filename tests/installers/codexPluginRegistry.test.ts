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

// Phase 62 follow-up — host-verified on codex-cli 0.154.0: the preset marketplace
// is `openai-api-curated`; `codex plugin add superpowers@openai-curated` fails with
// "plugin `superpowers` was not found in marketplace `openai-curated`". The shipped
// shell checks must also not match the "not installed" rows `codex plugin list`
// prints for every available plugin.
describe('manifests/tools/superpowers.yaml — codex override matches real codex', () => {
  const LIST_NOT_INSTALLED =
    'superpowers@openai-api-curated                   not installed           C:\\x\\superpowers'
  const LIST_INSTALLED =
    'superpowers@openai-api-curated                   installed, enabled  1dc19589  C:\\x\\superpowers'

  async function codexOverride() {
    const { readFileSync } = await import('node:fs')
    const { validateManifestFile } = await import('../../src/manifest/validate.js')
    const path = join(process.cwd(), 'manifests', 'tools', 'superpowers.yaml')
    const v = validateManifestFile(readFileSync(path, 'utf8'), path)
    if (!v.ok) throw new Error(`superpowers.yaml invalid: ${v.errors[0]?.message}`)
    const codex = v.manifest.spec.harness_overrides?.codex
    if (!codex) throw new Error('no codex override')
    return codex
  }

  /** The ERE inside `... | grep -qE '<re>'` (or a bare `grep -q <word>`). */
  function listPattern(cmd: string): RegExp {
    const quoted = /grep -qE? '([^']+)'/.exec(cmd)
    const bare = /grep -qE? (\S+)\s*$/.exec(cmd)
    const src = quoted?.[1] ?? bare?.[1]
    if (!src) throw new Error(`no list pattern in: ${cmd}`)
    return new RegExp(src)
  }

  it('installs from the marketplace codex actually has', async () => {
    const codex = await codexOverride()
    expect(codex.install.cmd).toBe('codex plugin add superpowers@openai-api-curated')
  })

  it('idempotent_check and verify match an installed row and NOT a "not installed" row', async () => {
    const codex = await codexOverride()
    const checks = [
      (codex.install as { idempotent_check?: string }).idempotent_check,
      codex.verify?.cmd,
    ]
    for (const cmd of checks) {
      expect(cmd).toBeDefined()
      const re = listPattern(cmd as string)
      expect(re.test(LIST_INSTALLED)).toBe(true)
      expect(re.test(LIST_NOT_INSTALLED)).toBe(false)
    }
  })
})
