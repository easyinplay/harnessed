import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

// Helper: minimal valid template that we mutate per case to isolate one defect.
const BASE = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: example
  description: Example manifest used by negative tests.
  upstream:
    source: example
    homepage: https://example.com
    repository: https://github.com/example/example.git
    license: MIT
    notice: Example upstream attribution.
spec:
  type: cli-npm
  component_type: cli-binary
  install:
    method: npm-cli
    cmd: npm install -g example
    npm_version: ^1.0.0
    idempotent_check: which example
  verify:
    cmd: example --version
  uninstall:
    cmd: npm uninstall -g example
  upstream_health:
    stability: stable
    last_check: "2026-05-11"
    last_known_good_version: 1.0.0
    fallback_action: warn
  signed_by: harnessed-maintainer
  platforms:
    - linux
    - darwin
    - win32
`

function expectError(yaml: string, predicate: (paths: string[]) => boolean, label: string) {
  const result = validateManifestFile(yaml, `${label}.yaml`)
  expect(result.ok).toBe(false)
  if (!result.ok) {
    const paths = result.errors.map((e) => `${e.keyword}@${e.path}: ${e.message}`)
    expect(
      predicate(paths),
      `expected error path predicate to match. got: ${paths.join(' | ')}`,
    ).toBe(true)
  }
}

describe('validateManifestFile — negative cases', () => {
  it('rejects missing required field metadata.name', () => {
    const yaml = BASE.replace('  name: example\n', '')
    expectError(
      yaml,
      (paths) => paths.some((p) => p.includes('/metadata') && p.includes('name')),
      'missing-name',
    )
  })

  it('rejects wrong type for spec.platforms (string instead of array)', () => {
    const yaml = BASE.replace(
      / {2}platforms:\n {4}- linux\n {4}- darwin\n {4}- win32\n/,
      '  platforms: linux\n',
    )
    expectError(
      yaml,
      (paths) => paths.some((p) => p.includes('/spec/platforms')),
      'wrong-type-platforms',
    )
  })

  it('rejects unknown field at metadata level (additionalProperties: false)', () => {
    const yaml = BASE.replace('  description:', '  unexpected_field: bar\n  description:')
    expectError(
      yaml,
      (paths) => paths.some((p) => p.includes('additionalProperties') && p.includes('/metadata')),
      'unknown-field-metadata',
    )
  })

  it('rejects non-SPDX license value', () => {
    const yaml = BASE.replace('    license: MIT', '    license: GPL-3.0')
    expectError(
      yaml,
      (paths) => paths.some((p) => p.includes('/metadata/upstream/license')),
      'non-spdx-license',
    )
  })

  it('rejects type=cli-npm with method=cc-plugin-marketplace (matrix violation)', () => {
    // Replace the whole install block so we get an illegal type×method combo.
    // cli-npm only allows npm-cli; we send cc-plugin-marketplace which is for cc-plugin only.
    const yaml = BASE.replace(
      / {2}install:\n {4}method: npm-cli\n {4}cmd: npm install -g example\n {4}npm_version: \^1\.0\.0\n {4}idempotent_check: which example\n/,
      '  install:\n    method: cc-plugin-marketplace\n    cmd: claude plugin install example\n    git_ref: abcdef0\n    idempotent_check: claude plugin list | grep example\n',
    )
    expectError(yaml, (paths) => paths.some((p) => p.includes('/spec/install')), 'matrix-violation')
  })

  it('returns multiple errors when multiple fields are wrong (allErrors: true)', () => {
    // Drop name AND change license.
    const yaml = BASE.replace('  name: example\n', '').replace(
      '    license: MIT',
      '    license: GPL-3.0',
    )
    const result = validateManifestFile(yaml, 'multi.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      // We expect at least 2 distinct error paths (one for missing name, one for license).
      const paths = new Set(result.errors.map((e) => e.path))
      expect(paths.size).toBeGreaterThanOrEqual(2)
    }
  })
})
