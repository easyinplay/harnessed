// Phase 1.3 T2.3 — install_type field tests (ADR 0007).
//
// ADR 0007 errata adds a required `install_type` field to spec (4 enum union):
// skill / mcp / npm / git. Missing or out-of-enum values must reject.
//
// 1:N closure with install.method (D1.2.5-12 lock):
//   skill → cc-plugin-marketplace / npx-skill-installer
//   mcp   → mcp-stdio-add / mcp-http-add
//   npm   → npm-cli
//   git   → git-clone-with-setup
//
// ADR 0010 errata (phase 2.1 T1.4) UPGRADE: the 1:N closure is now mechanically
// enforced at the validate layer (`install-type-mismatch` keyword). The BASE
// fixture below is `type: cli-npm` + `method: npm-cli`, so the only
// closure-consistent install_type is `npm`. The original "4 valid enum values"
// loop (skill/mcp/git/npm all accepted in isolation) no longer holds — those
// combos are now correctly rejected. Closure behavior is covered by the
// dedicated describe block at the bottom of this file.
//
// Pattern J: BASE template + replace marker → enum membership (1 valid + 2
// invalid) + closure enforcement (3 cells).

import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const BASE = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: itfix
  display_name: itfix
  description: install_type field test fixture (ADR 0007).
  upstream:
    source: itfix
    homepage: https://example.com
    repository: https://github.com/example/itfix.git
    license: MIT
    notice: Test fixture only.
spec:
  type: cli-npm
  component_type: cli-binary
  category: engineering
__INSTALL_TYPE__
  install:
    method: npm-cli
    cmd: "npm install -g itfix"
    npm_version: ^1.0.0
    idempotent_check: "command -v itfix"
  verify:
    cmd: "itfix --version"
    timeout_ms: 5000
  uninstall:
    cmd: "npm uninstall -g itfix"
  upstream_health:
    stability: stable
    last_check: "2026-05-13"
    last_known_good_version: 1.0.0
    fallback_action: warn
  signed_by: easyinplay
  platforms:
    - linux
    - darwin
    - win32
`

function withInstallType(value: string | null): string {
  if (value === null) {
    return BASE.replace('__INSTALL_TYPE__\n', '')
  }
  return BASE.replace('__INSTALL_TYPE__', `  install_type: ${value}`)
}

describe('validateManifestFile — install_type field (ADR 0007)', () => {
  // ─── Closure-consistent valid value ─────────────────────────────────
  // BASE is cli-npm × npm-cli, so install_type: npm is the only closure-valid
  // value (ADR 0010 errata § Decision 4 — see closure describe block below).
  it('accepts install_type: npm (closure-consistent with npm-cli BASE)', () => {
    const yaml = withInstallType('npm')
    const result = validateManifestFile(yaml, 'it-npm.yaml')
    if (!result.ok) console.error('install_type=npm errors:', result.errors)
    expect(result.ok).toBe(true)
  })

  // ─── Invalid enum value ─────────────────────────────────────────────
  it('rejects install_type: invalid (out of 4 enum)', () => {
    const yaml = withInstallType('docker')
    const result = validateManifestFile(yaml, 'it-invalid.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find((er) => er.path.includes('install_type'))
      expect(e).toBeDefined()
      expect(e?.keyword === 'enum' || e?.keyword === 'const').toBe(true)
    }
  })

  // ─── Missing field ──────────────────────────────────────────────────
  it('rejects manifest with no install_type field (required)', () => {
    const yaml = withInstallType(null)
    const result = validateManifestFile(yaml, 'it-missing.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find(
        (er) => er.keyword === 'required' && er.message.includes('install_type'),
      )
      expect(e).toBeDefined()
    }
  })
})

// Phase 2.1 T1.6 — install_type ↔ install.method 1:N closure enforcement
// (ADR 0010 errata § Decision 4). validate-layer cross-field check; throws
// `keyword: 'install-type-mismatch'` when install_type and install.method are
// inconsistent. BASE above uses install_type: npm + method: npm-cli (matched).
describe('validateManifestFile — install_type ↔ install.method closure (ADR 0010)', () => {
  it('accepts npm ↔ npm-cli (matched closure)', () => {
    // BASE fixture is npm + npm-cli — already a matched pair.
    const result = validateManifestFile(withInstallType('npm'), 'it-closure-ok.yaml')
    if (!result.ok) console.error('npm↔npm-cli errors:', result.errors)
    expect(result.ok).toBe(true)
  })

  it('rejects git ↔ npm-cli (install-type-mismatch)', () => {
    // BASE install.method is npm-cli; install_type: git is not in its closure.
    const result = validateManifestFile(withInstallType('git'), 'it-closure-bad.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find((er) => er.keyword === 'install-type-mismatch')
      expect(e).toBeDefined()
      expect(e?.path).toBe('spec.install.method')
    }
  })

  it('rejects skill ↔ npm-cli (install-type-mismatch — skill closure excludes npm-cli)', () => {
    const result = validateManifestFile(withInstallType('skill'), 'it-closure-skill.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find((er) => er.keyword === 'install-type-mismatch')
      expect(e).toBeDefined()
    }
  })
})
