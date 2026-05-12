// Phase 1.3 T2.3 — category field tests (ADR 0007).
//
// ADR 0007 errata adds a required `category` field to spec (6 enum union):
// meta / engineering / design / content / testing / search. Missing or
// out-of-enum values must reject.
//
// Pattern J: BASE template + replace marker → covers 6 valid + 2 invalid
// cases (8 cells total ≥ 4 required).

import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const BASE = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: catfix
  display_name: catfix
  description: category field test fixture (ADR 0007).
  upstream:
    source: catfix
    homepage: https://example.com
    repository: https://github.com/example/catfix.git
    license: MIT
    notice: Test fixture only.
spec:
  type: cli-npm
  component_type: cli-binary
__CATEGORY__
  install_type: npm
  install:
    method: npm-cli
    cmd: "npm install -g catfix"
    npm_version: ^1.0.0
    idempotent_check: "command -v catfix"
  verify:
    cmd: "catfix --version"
    timeout_ms: 5000
  uninstall:
    cmd: "npm uninstall -g catfix"
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

function withCategory(value: string | null): string {
  if (value === null) {
    // Drop the field entirely to test required-rejection.
    return BASE.replace('__CATEGORY__\n', '')
  }
  return BASE.replace('__CATEGORY__', `  category: ${value}`)
}

describe('validateManifestFile — category field (ADR 0007)', () => {
  // ─── 6 valid enum values ────────────────────────────────────────────
  const validValues = ['meta', 'engineering', 'design', 'content', 'testing', 'search'] as const

  for (const v of validValues) {
    it(`accepts category: ${v}`, () => {
      const yaml = withCategory(v)
      const result = validateManifestFile(yaml, `cat-${v}.yaml`)
      if (!result.ok) console.error(`category=${v} errors:`, result.errors)
      expect(result.ok).toBe(true)
    })
  }

  // ─── Invalid enum value ─────────────────────────────────────────────
  it('rejects category: invalid (out of 6 enum)', () => {
    const yaml = withCategory('infrastructure')
    const result = validateManifestFile(yaml, 'cat-invalid.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find((er) => er.path.includes('category'))
      expect(e).toBeDefined()
      // Ajv reports `enum` keyword for union literal mismatch.
      expect(e?.keyword === 'enum' || e?.keyword === 'const').toBe(true)
    }
  })

  // ─── Missing field ──────────────────────────────────────────────────
  it('rejects manifest with no category field (required)', () => {
    const yaml = withCategory(null)
    const result = validateManifestFile(yaml, 'cat-missing.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find(
        (er) => er.keyword === 'required' && er.message.includes('category'),
      )
      expect(e).toBeDefined()
    }
  })
})
