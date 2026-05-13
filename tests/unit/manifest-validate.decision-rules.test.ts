// Phase 1.3 T2.3 — decision_rules field tests (ADR 0007).
//
// ADR 0007 errata adds an optional `decision_rules` field to spec — a
// per-manifest decision hint Object (4 fields, all optional):
//   trigger?           — string (minLength 1) — task trigger description
//   default_expert?    — string (minLength 1) — default expert/agent name
//   arbitration_rule?  — string (minLength 1) — conflict arbitration text
//   override_signals?  — Array<{ phrase: string, use: string }>
//                        — user phrase → forced expert override map
//
// Strict additionalProperties: false on both the outer Object and each
// override_signal entry. Field is optional — omitting it must pass.
//
// IMPL NOTE — B-1 schema 区分: this is per-manifest hint, distinct from the
// global rule-set in `routing/decision_rules.yaml` (T3.1, separate Ajv
// schema). T2.3 here ONLY tests manifest.spec.decision_rules.
//
// Pattern J: BASE template + replace marker → covers 4 cells (omit pass /
// full valid pass / nested array+object reject / additionalProperties reject).
// R1 风险 1 mitigation: nested array+object reject case included to verify
// TypeBox嵌套 robust 性 (R1 risk 1).

import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const BASE = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: drfix
  display_name: drfix
  description: decision_rules field test fixture (ADR 0007).
  upstream:
    source: drfix
    homepage: https://example.com
    repository: https://github.com/example/drfix.git
    license: MIT
    notice: Test fixture only.
spec:
  type: cc-skill-pack
  component_type: command
  category: design
  install_type: skill
  install:
    method: cc-plugin-marketplace
    cmd: "/plugin install drfix@drfix"
    git_ref: v1.0.0
    idempotent_check: "/plugin list | grep -q drfix"
__DECISION_RULES__
  verify:
    cmd: "/plugin list | grep -q drfix"
    timeout_ms: 5000
  uninstall:
    cmd: "/plugin uninstall drfix@drfix"
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

function withDecisionRules(block: string): string {
  // block includes leading newline + 2-space indent under spec.
  return BASE.replace('__DECISION_RULES__\n', block)
}

describe('validateManifestFile — decision_rules field (ADR 0007, R1 风险 1 mitigation)', () => {
  // ─── Cell 1: omit (optional pass) ───────────────────────────────────
  it('1. omit decision_rules → pass (optional field)', () => {
    const yaml = withDecisionRules('')
    const result = validateManifestFile(yaml, 'dr-omit.yaml')
    if (!result.ok) console.error('omit errors:', result.errors)
    expect(result.ok).toBe(true)
  })

  // ─── Cell 2: full valid (all 4 fields + nested override_signals) ────
  it('2. full valid decision_rules with nested override_signals → pass', () => {
    const block = `  decision_rules:
    trigger: "user 请求 UI/UX 设计"
    default_expert: ui-ux-pro-max
    arbitration_rule: "ui-ux-pro-max 出主方案; frontend-design 补 layout"
    override_signals:
      - phrase: "做出风格"
        use: frontend-design
      - phrase: "experimental"
        use: frontend-design
`
    const yaml = withDecisionRules(block)
    const result = validateManifestFile(yaml, 'dr-full.yaml')
    if (!result.ok) console.error('full valid errors:', result.errors)
    expect(result.ok).toBe(true)
  })

  // ─── Cell 3: invalid override_signals shape (nested array+object reject) ──
  // R1 风险 1 mitigation — TypeBox 嵌套 array+object 必须严格 enforce.
  it('3. invalid override_signals shape (missing `use`) → reject (nested array+object enforce)', () => {
    const block = `  decision_rules:
    override_signals:
      - phrase: "做出风格"
`
    const yaml = withDecisionRules(block)
    const result = validateManifestFile(yaml, 'dr-bad-shape.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      // Some error must point inside override_signals + carry `required` keyword.
      const e = result.errors.find(
        (er) => er.path.includes('override_signals') && er.keyword === 'required',
      )
      expect(
        e,
        `expected required-error inside override_signals. errors: ${result.errors
          .map((er) => `${er.keyword}@${er.path}: ${er.message}`)
          .join(' | ')}`,
      ).toBeDefined()
    }
  })

  // ─── Cell 4: additionalProperties on outer object → reject ──────────
  it('4. extra property on decision_rules outer object → reject (additionalProperties: false)', () => {
    const block = `  decision_rules:
    trigger: "ui task"
    secondary_expert: frontend-design
`
    const yaml = withDecisionRules(block)
    const result = validateManifestFile(yaml, 'dr-extra-outer.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find(
        (er) =>
          er.keyword === 'additionalProperties' &&
          (er.path.includes('decision_rules') || er.message.includes('secondary_expert')),
      )
      expect(
        e,
        `expected additionalProperties-error on decision_rules outer. errors: ${result.errors
          .map((er) => `${er.keyword}@${er.path}: ${er.message}`)
          .join(' | ')}`,
      ).toBeDefined()
    }
  })

  // ─── Cell 5: additionalProperties on override_signal entry → reject ──
  it('5. extra property on override_signal entry → reject (additionalProperties: false)', () => {
    const block = `  decision_rules:
    override_signals:
      - phrase: "做出风格"
        use: frontend-design
        confidence: 0.9
`
    const yaml = withDecisionRules(block)
    const result = validateManifestFile(yaml, 'dr-extra-entry.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find(
        (er) =>
          er.keyword === 'additionalProperties' &&
          (er.path.includes('override_signals') || er.message.includes('confidence')),
      )
      expect(
        e,
        `expected additionalProperties-error on override_signal entry. errors: ${result.errors
          .map((er) => `${er.keyword}@${er.path}: ${er.message}`)
          .join(' | ')}`,
      ).toBeDefined()
    }
  })
})
