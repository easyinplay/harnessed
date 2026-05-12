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
// (schema does not enforce cross-field 1:N closure — phase 1.4 routing engine
//  does runtime check; schema only validates enum membership.)
//
// Pattern J: BASE template + replace marker → covers 4 valid + 2 invalid
// cases (6 cells total ≥ 4 required).

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
  // ─── 4 valid enum values ────────────────────────────────────────────
  const validValues = ['skill', 'mcp', 'npm', 'git'] as const

  for (const v of validValues) {
    it(`accepts install_type: ${v}`, () => {
      const yaml = withInstallType(v)
      const result = validateManifestFile(yaml, `it-${v}.yaml`)
      if (!result.ok) console.error(`install_type=${v} errors:`, result.errors)
      expect(result.ok).toBe(true)
    })
  }

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
