import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

// Discriminator matrix test (T4.4) — no new validator code; relies entirely on
// the cross-field `allOf` if/then constraints already in ManifestSchema (T4.2).
// Per ADR 0001 § type×install.method matrix:
//   cc-plugin     → cc-plugin-marketplace
//   cc-skill-pack → cc-plugin-marketplace | git-clone-with-setup | npx-skill-installer
//   mcp-npm       → mcp-stdio-add | mcp-http-add
//   cli-npm       → npm-cli
// Anything else is rejected.

interface IllegalCase {
  label: string
  type: 'cc-plugin' | 'cc-skill-pack' | 'mcp-npm' | 'cli-npm'
  componentType: 'command' | 'behavior-rule' | 'mcp-tool' | 'cli-binary'
  install: string // raw yaml block, indented under `  install:`
}

function buildYaml(c: IllegalCase): string {
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

const cases: IllegalCase[] = [
  {
    label: 'cc-plugin × git-clone-with-setup',
    type: 'cc-plugin',
    componentType: 'command',
    install: [
      '    method: git-clone-with-setup',
      '    cmd: git clone https://example.com/x.git',
      '    git_ref: abc1234',
      '    idempotent_check: test -d ~/.example',
    ].join('\n'),
  },
  {
    label: 'cc-plugin × npm-cli',
    type: 'cc-plugin',
    componentType: 'command',
    install: [
      '    method: npm-cli',
      '    cmd: npm install -g x',
      '    npm_version: ^1.0.0',
      '    idempotent_check: which x',
    ].join('\n'),
  },
  {
    label: 'cc-skill-pack × npm-cli',
    type: 'cc-skill-pack',
    componentType: 'command',
    install: [
      '    method: npm-cli',
      '    cmd: npm install -g x',
      '    npm_version: ^1.0.0',
      '    idempotent_check: which x',
    ].join('\n'),
  },
  {
    label: 'mcp-npm × npm-cli',
    type: 'mcp-npm',
    componentType: 'mcp-tool',
    install: [
      '    method: npm-cli',
      '    cmd: npm install -g x',
      '    npm_version: ^1.0.0',
      '    idempotent_check: which x',
    ].join('\n'),
  },
  {
    label: 'cli-npm × git-clone-with-setup',
    type: 'cli-npm',
    componentType: 'cli-binary',
    install: [
      '    method: git-clone-with-setup',
      '    cmd: git clone https://example.com/x.git',
      '    git_ref: abc1234',
      '    idempotent_check: test -d ~/.example',
    ].join('\n'),
  },
]

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
