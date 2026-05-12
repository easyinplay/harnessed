// Phase 1.2 T1.5 — marketplace_source schema field tests (ADR 0005).
//
// ADR 0005 errata adds an optional `marketplace_source` field to the
// cc-plugin-marketplace install method only. Required: source = 'github'
// (literal) and repo = '<owner>/<repo>' pattern. Other install methods
// (e.g. npm-cli) reject the field via additionalProperties: false.
//
// Pattern J: BASE template + with*() modifier producing 5 test cells.

import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const BASE_CC_PLUGIN_MARKETPLACE = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: market
  display_name: market
  description: marketplace_source field test fixture.
  upstream:
    source: market
    homepage: https://example.com
    repository: https://github.com/example/market.git
    license: MIT
    notice: Test fixture only.
spec:
  type: cc-skill-pack
  component_type: command
  install:
    method: cc-plugin-marketplace
    cmd: "/plugin marketplace add example/market && /plugin install market@market"
    git_ref: v1.0.0
    idempotent_check: "/plugin list | grep -q market"
__MARKETPLACE_SOURCE__
  verify:
    cmd: "/plugin list | grep -q market"
    timeout_ms: 5000
  uninstall:
    cmd: "/plugin uninstall market@market"
  upstream_health:
    stability: stable
    last_check: "2026-05-12"
    last_known_good_version: 1.0.0
    fallback_action: warn
  signed_by: easyinplay
  platforms:
    - linux
    - darwin
    - win32
`

const BASE_NPM_CLI = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: marketcli
  display_name: marketcli
  description: marketplace_source field on npm-cli rejection test.
  upstream:
    source: marketcli
    homepage: https://example.com
    repository: https://github.com/example/marketcli.git
    license: MIT
    notice: Test fixture only.
spec:
  type: cli-npm
  component_type: command
  install:
    method: npm-cli
    cmd: "npx --yes example-cli@1.0.0"
    npm_version: ^1.0.0
    idempotent_check: "test -d ~/.local/share/marketcli"
__MARKETPLACE_SOURCE__
  verify:
    cmd: "npx --yes example-cli@1.0.0 --version"
    timeout_ms: 5000
  uninstall:
    cmd: "rm -rf ~/.local/share/marketcli"
  upstream_health:
    stability: stable
    last_check: "2026-05-12"
    last_known_good_version: 1.0.0
    fallback_action: warn
  signed_by: easyinplay
  platforms:
    - linux
    - darwin
    - win32
`

function withMarketplaceSource(base: string, ms: string): string {
  // Indent each line of `ms` to align under spec.install (4 spaces).
  const indented = ms.length === 0 ? '' : ms
  return base.replace('__MARKETPLACE_SOURCE__\n', indented)
}

describe('validateManifestFile — marketplace_source field (ADR 0005)', () => {
  it('1. cc-plugin-marketplace + omit marketplace_source → pass (official upstream)', () => {
    const yaml = withMarketplaceSource(BASE_CC_PLUGIN_MARKETPLACE, '')
    const result = validateManifestFile(yaml, 'market-omit.yaml')
    if (!result.ok) console.error('omit errors:', result.errors)
    expect(result.ok).toBe(true)
  })

  it('2. cc-plugin-marketplace + valid marketplace_source → pass', () => {
    const ms = `    marketplace_source:\n      source: github\n      repo: OthmanAdi/planning-with-files\n`
    const yaml = withMarketplaceSource(BASE_CC_PLUGIN_MARKETPLACE, ms)
    const result = validateManifestFile(yaml, 'market-valid.yaml')
    if (!result.ok) console.error('valid errors:', result.errors)
    expect(result.ok).toBe(true)
  })

  it('3. cc-plugin-marketplace + source: gitlab → reject (const github)', () => {
    const ms = `    marketplace_source:\n      source: gitlab\n      repo: foo/bar\n`
    const yaml = withMarketplaceSource(BASE_CC_PLUGIN_MARKETPLACE, ms)
    const result = validateManifestFile(yaml, 'market-gitlab.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find((er) => er.path.includes('source'))
      expect(e).toBeDefined()
      // Ajv reports `const` keyword for literal mismatch.
      expect(e?.keyword === 'const' || e?.keyword === 'enum').toBe(true)
    }
  })

  it('4. cc-plugin-marketplace + repo "no-slash" → reject (pattern)', () => {
    const ms = `    marketplace_source:\n      source: github\n      repo: noslash\n`
    const yaml = withMarketplaceSource(BASE_CC_PLUGIN_MARKETPLACE, ms)
    const result = validateManifestFile(yaml, 'market-noslash.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find((er) => er.path.includes('repo'))
      expect(e).toBeDefined()
      expect(e?.keyword).toBe('pattern')
    }
  })

  it('5. npm-cli + marketplace_source → reject (additionalProperties)', () => {
    const ms = `    marketplace_source:\n      source: github\n      repo: foo/bar\n`
    const yaml = withMarketplaceSource(BASE_NPM_CLI, ms)
    const result = validateManifestFile(yaml, 'market-wrongmethod.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find(
        (er) => er.keyword === 'additionalProperties' && er.path.includes('marketplace_source'),
      )
      expect(e).toBeDefined()
    }
  })
})
