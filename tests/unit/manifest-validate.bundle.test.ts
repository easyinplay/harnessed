// Phase 2.1 T1.6 — bundle-install `provides` field tests (ADR 0010).
//
// ADR 0010 errata adds an optional top-level `provides` array to SpecSchema:
// `provides: Type.Array(ProvidedUnit, { minItems: 2, uniqueItems: true })`
// where ProvidedUnit = { id, component_type } with additionalProperties: false.
// Absent ⇒ atomic manifest (unchanged). install/verify/uninstall stay singular.
//
// Pattern J: BASE template + replace marker → covers accept + reject cells.

import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const BASE = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: bundletest
  display_name: bundletest
  description: bundle-install provides field test fixture (ADR 0010).
  upstream:
    source: bundletest
    homepage: https://example.com
    repository: https://github.com/example/bundletest.git
    license: anthropics-official
    notice: Test fixture only.
spec:
  type: cc-skill-pack
  component_type: behavior-rule
  category: content
  install_type: skill
__PROVIDES__
  install:
    method: cc-plugin-marketplace
    cmd: claude plugin install bundletest
    git_ref: abc1234
    idempotent_check: claude plugin list | grep bundletest
  verify:
    cmd: "test -d bundletest"
    timeout_ms: 5000
  uninstall:
    cmd: "rm -rf bundletest"
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

function build(providesBlock: string | null): string {
  if (providesBlock === null) {
    return BASE.replace('__PROVIDES__\n', '')
  }
  return BASE.replace('__PROVIDES__', providesBlock)
}

const TWO_UNITS = `  provides:
    - id: example-skill-pptx
      component_type: behavior-rule
    - id: anthropics-skills-docx
      component_type: behavior-rule`

describe('validateManifestFile — bundle-install provides field (ADR 0010)', () => {
  it('accepts provides with 2 units', () => {
    const result = validateManifestFile(build(TWO_UNITS), 'bundle-2unit.yaml')
    if (!result.ok) console.error('2-unit provides errors:', result.errors)
    expect(result.ok).toBe(true)
  })

  it('rejects provides with only 1 unit (minItems: 2)', () => {
    const oneUnit = `  provides:
    - id: example-skill-pptx
      component_type: behavior-rule`
    const result = validateManifestFile(build(oneUnit), 'bundle-1unit.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find((er) => er.path.includes('provides'))
      expect(e).toBeDefined()
    }
  })

  it('rejects provides with duplicate units (uniqueItems)', () => {
    const dup = `  provides:
    - id: example-skill-pptx
      component_type: behavior-rule
    - id: example-skill-pptx
      component_type: behavior-rule`
    const result = validateManifestFile(build(dup), 'bundle-dup.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find((er) => er.path.includes('provides'))
      expect(e).toBeDefined()
    }
  })

  it('accepts manifest with no provides field (atomic manifest, additive)', () => {
    const result = validateManifestFile(build(null), 'bundle-absent.yaml')
    if (!result.ok) console.error('absent provides errors:', result.errors)
    expect(result.ok).toBe(true)
  })

  it('rejects ProvidedUnit with extra property (additionalProperties: false)', () => {
    const extra = `  provides:
    - id: example-skill-pptx
      component_type: behavior-rule
      extra_field: nope
    - id: anthropics-skills-docx
      component_type: behavior-rule`
    const result = validateManifestFile(build(extra), 'bundle-extra.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find((er) => er.path.includes('provides'))
      expect(e).toBeDefined()
    }
  })
})
