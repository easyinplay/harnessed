import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

// Discriminator matrix test (T4.4 + T8.3) — no new validator code; relies entirely on
// the cross-field `allOf` if/then constraints already in ManifestSchema (T4.2).
// Per ADR 0001 § type×install.method matrix (post ADR 0003 errata, 6 methods total):
//   cc-plugin     → cc-plugin-marketplace                                                      (1 legal)
//   cc-skill-pack → cc-plugin-marketplace | git-clone-with-setup | npx-skill-installer        (3 legal)
//   mcp-npm       → mcp-stdio-add | mcp-http-add                                              (2 legal)
//   cli-npm       → npm-cli                                                                    (1 legal)
//
// Total combinations = 4 type × 6 method = 24
// Legal combinations = 1 + 3 + 2 + 1 = 7
// Illegal combinations = 24 - 7 = 17  (see § B F15 for plan-checker 18→17 reconciliation).
// T8.3 expands from 5 illegal cases (batch 2 T4.4) to all 17, plus 1 legal sanity = 18 total.

interface IllegalCase {
  label: string
  type: 'cc-plugin' | 'cc-skill-pack' | 'mcp-npm' | 'cli-npm'
  componentType: 'command' | 'behavior-rule' | 'mcp-tool' | 'cli-binary'
  install: string // raw yaml block, indented under `  install:`
}

// Per-method install yaml block (uses fields per ADR 0001 line 64-65).
// Each block is exactly 4 indented lines so the BASE template stays uniform.
function installFor(method: string): string {
  switch (method) {
    case 'cc-plugin-marketplace':
      return [
        '    method: cc-plugin-marketplace',
        '    cmd: claude plugin install x',
        '    git_ref: abc1234',
        '    idempotent_check: claude plugin list | grep x',
      ].join('\n')
    case 'git-clone-with-setup':
      return [
        '    method: git-clone-with-setup',
        '    cmd: git clone https://example.com/x.git',
        '    git_ref: abc1234',
        '    idempotent_check: test -d ~/.example',
      ].join('\n')
    case 'npx-skill-installer':
      return [
        '    method: npx-skill-installer',
        '    cmd: npx some-installer x',
        '    npm_version: ^1.0.0',
        '    idempotent_check: test -d ~/.claude/skills/x',
      ].join('\n')
    case 'npm-cli':
      return [
        '    method: npm-cli',
        '    cmd: npm install -g x',
        '    npm_version: ^1.0.0',
        '    idempotent_check: which x',
      ].join('\n')
    case 'mcp-stdio-add':
      return [
        '    method: mcp-stdio-add',
        '    cmd: claude mcp add --scope project x npx -y x-mcp',
        '    npm_version: ^1.0.0',
        '    idempotent_check: claude mcp list | grep x',
      ].join('\n')
    case 'mcp-http-add':
      return [
        '    method: mcp-http-add',
        '    cmd: claude mcp add --scope project x https://example.com/mcp',
        '    npm_version: ^1.0.0',
        '    idempotent_check: claude mcp list | grep x',
      ].join('\n')
    default:
      throw new Error(`unknown method: ${method}`)
  }
}

// Component type that is semantically reasonable for a given manifest type
// (per ADR 0001 § component_type 语义). The allOf matrix only constrains
// type×install.method, so component_type itself is free — any valid enum
// value works for the negative test, but we pick a realistic pairing.
function componentTypeFor(t: IllegalCase['type']): IllegalCase['componentType'] {
  switch (t) {
    case 'cc-plugin':
      return 'command'
    case 'cc-skill-pack':
      return 'command'
    case 'mcp-npm':
      return 'mcp-tool'
    case 'cli-npm':
      return 'cli-binary'
  }
}

// All 17 illegal type×method combinations (24 total - 7 legal).
const ILLEGAL_PAIRS: ReadonlyArray<[IllegalCase['type'], string]> = [
  // cc-plugin (5 illegal — only cc-plugin-marketplace legal)
  ['cc-plugin', 'git-clone-with-setup'],
  ['cc-plugin', 'npx-skill-installer'],
  ['cc-plugin', 'npm-cli'],
  ['cc-plugin', 'mcp-stdio-add'],
  ['cc-plugin', 'mcp-http-add'],
  // cc-skill-pack (3 illegal — cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer legal)
  ['cc-skill-pack', 'npm-cli'],
  ['cc-skill-pack', 'mcp-stdio-add'],
  ['cc-skill-pack', 'mcp-http-add'],
  // mcp-npm (4 illegal — mcp-stdio-add / mcp-http-add legal)
  ['mcp-npm', 'cc-plugin-marketplace'],
  ['mcp-npm', 'git-clone-with-setup'],
  ['mcp-npm', 'npx-skill-installer'],
  ['mcp-npm', 'npm-cli'],
  // cli-npm (5 illegal — only npm-cli legal)
  ['cli-npm', 'cc-plugin-marketplace'],
  ['cli-npm', 'git-clone-with-setup'],
  ['cli-npm', 'npx-skill-installer'],
  ['cli-npm', 'mcp-stdio-add'],
  ['cli-npm', 'mcp-http-add'],
]

// install_type ↔ install.method 1:N closure (ADR 0010 errata § Decision 4) is
// now validate-layer enforced. Derive a closure-consistent install_type from
// the method so the matrix fixtures don't trip the cross-field check on top of
// the type×method allOf constraint under test.
function installTypeForMethod(method: string): string {
  switch (method) {
    case 'npm-cli':
      return 'npm'
    case 'mcp-stdio-add':
    case 'mcp-http-add':
      return 'mcp'
    case 'git-clone-with-setup':
      return 'git'
    default:
      return 'skill' // cc-plugin-marketplace / npx-skill-installer
  }
}

function buildYaml(c: IllegalCase): string {
  // Extract the method from the install block (`    method: x`).
  const methodMatch = c.install.match(/method:\s*(\S+)/)
  const method = methodMatch?.[1] ?? 'npm-cli'
  return `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: example
  description: Matrix test fixture.
  upstream:
    source: example
    homepage: https://example.com
    repository: https://github.com/example/example.git
    license: MIT
    notice: example.
spec:
  type: ${c.type}
  component_type: ${c.componentType}
  category: engineering
  install_type: ${installTypeForMethod(method)}
  install:
${c.install}
  verify:
    cmd: example --version
  uninstall:
    cmd: rm -rf /tmp/example
  upstream_health:
    stability: stable
    last_check: "2026-05-11"
    last_known_good_version: 1.0.0
    fallback_action: warn
  signed_by: harnessed-maintainer
  platforms:
    - linux
`
}

const cases: IllegalCase[] = ILLEGAL_PAIRS.map(([type, method]) => ({
  label: `${type} × ${method}`,
  type,
  componentType: componentTypeFor(type),
  install: installFor(method),
}))

describe('validateManifestFile — type×method matrix discriminator', () => {
  for (const c of cases) {
    it(`rejects ${c.label}`, () => {
      const result = validateManifestFile(buildYaml(c), `${c.label}.yaml`)
      expect(result.ok, `${c.label} should be rejected by allOf if/then matrix`).toBe(false)
      if (!result.ok) {
        // Some error must point inside /spec or carry an enum/oneOf keyword
        // pointing at the install method mismatch.
        const matched = result.errors.some(
          (e) => e.path.includes('/spec') || e.keyword === 'enum' || e.keyword === 'if',
        )
        expect(
          matched,
          `expected /spec-anchored error. errors: ${result.errors
            .map((e) => `${e.keyword}@${e.path}: ${e.message}`)
            .join(' | ')}`,
        ).toBe(true)
      }
    })
  }

  // Sanity counter-test: a legal combo must still pass.
  it('accepts cli-npm × npm-cli (matrix legal)', () => {
    const yaml = buildYaml({
      label: 'cli-npm × npm-cli (legal)',
      type: 'cli-npm',
      componentType: 'cli-binary',
      install: [
        '    method: npm-cli',
        '    cmd: npm install -g x',
        '    npm_version: ^1.0.0',
        '    idempotent_check: which x',
      ].join('\n'),
    })
    const result = validateManifestFile(yaml, 'legal.yaml')
    if (!result.ok) console.error(result.errors)
    expect(result.ok).toBe(true)
  })
})
