// Phase 2.1 T1.6 — license whitelist + license_source field tests (ADR 0010).
//
// ADR 0010 errata extends the SpdxLicense union with `MIT-0` (baoyu-skills) +
// `anthropics-official` carve-out, and adds an optional `license_source` audit
// enum (README / registry / none / anthropics-official) to metadata.upstream.
//
// Pattern J: BASE template + replace marker → covers accept + reject cells.

import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const BASE = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: lictest
  display_name: lictest
  description: license field test fixture (ADR 0010).
  upstream:
    source: lictest
    homepage: https://example.com
    repository: https://github.com/example/lictest.git
    license: __LICENSE__
__LICENSE_SOURCE__
    notice: Test fixture only.
spec:
  type: cli-npm
  component_type: cli-binary
  category: engineering
  install_type: npm
  install:
    method: npm-cli
    cmd: "npm install -g lictest"
    npm_version: ^1.0.0
    idempotent_check: "command -v lictest"
  verify:
    cmd: "lictest --version"
    timeout_ms: 5000
  uninstall:
    cmd: "npm uninstall -g lictest"
  upstream_health:
    stability: stable
    last_check: "2026-05-15"
    last_known_good_version: 1.0.0
    fallback_action: warn
  signed_by: easyinplay
  platforms:
    - linux
    - darwin
    - win32
`

function build(license: string, licenseSource: string | null): string {
  let yaml = BASE.replace('__LICENSE__', license)
  if (licenseSource === null) {
    yaml = yaml.replace('__LICENSE_SOURCE__\n', '')
  } else {
    yaml = yaml.replace('__LICENSE_SOURCE__', `    license_source: ${licenseSource}`)
  }
  return yaml
}

describe('validateManifestFile — license whitelist + license_source (ADR 0010)', () => {
  it('accepts license: MIT-0 (baoyu-skills, D-05)', () => {
    const result = validateManifestFile(build('MIT-0', null), 'lic-mit0.yaml')
    if (!result.ok) console.error('MIT-0 errors:', result.errors)
    expect(result.ok).toBe(true)
  })

  it('accepts license: anthropics-official (carve-out, D-03/D-04)', () => {
    const result = validateManifestFile(build('anthropics-official', null), 'lic-anthropic.yaml')
    if (!result.ok) console.error('anthropics-official errors:', result.errors)
    expect(result.ok).toBe(true)
  })

  it('rejects license: GPL-3.0 (not in whitelist)', () => {
    const result = validateManifestFile(build('GPL-3.0', null), 'lic-gpl.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find((er) => er.path.includes('license'))
      expect(e).toBeDefined()
    }
  })

  it('accepts all 4 license_source enum values', () => {
    for (const src of ['README', 'registry', 'none', 'anthropics-official'] as const) {
      const result = validateManifestFile(build('MIT', src), `lic-src-${src}.yaml`)
      if (!result.ok) console.error(`license_source=${src} errors:`, result.errors)
      expect(result.ok).toBe(true)
    }
  })

  it('rejects license_source: invalid (out of enum)', () => {
    const result = validateManifestFile(build('MIT', 'guessed'), 'lic-src-invalid.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find((er) => er.path.includes('license_source'))
      expect(e).toBeDefined()
    }
  })

  it('accepts manifest with no license_source field (optional, additive)', () => {
    const result = validateManifestFile(build('MIT', null), 'lic-src-absent.yaml')
    if (!result.ok) console.error('absent license_source errors:', result.errors)
    expect(result.ok).toBe(true)
  })
})
