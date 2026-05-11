import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

// Each fixture below intentionally introduces an error on a known yaml line.
// We assert that at least one returned error reports the precise source line.

describe('validateManifestFile — line/column mapping', () => {
  it('reports correct line for missing required field metadata.name', () => {
    // Drop `name:` line. The metadata block now starts at line 3 and the
    // required-field error should anchor to /metadata (line 3).
    const yaml = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  description: Missing the required name field above.
  upstream:
    source: example
    homepage: https://example.com
    repository: https://github.com/example/example.git
    license: MIT
    notice: Example.
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
`
    const result = validateManifestFile(yaml, 'missing-name.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      // metadata block starts at line 3; some error should have line>=3.
      const linesReported = result.errors.map((e) => e.line).filter((l): l is number => l !== null)
      expect(linesReported.length).toBeGreaterThan(0)
      // Specifically: the /metadata path error should anchor to the start of the
      // metadata block content. yaml@2 sets a map node's range[0] to the first
      // child's start offset (line 4 here = `description:` line).
      const metaErr = result.errors.find((e) => e.path.startsWith('/metadata'))
      expect(metaErr).toBeDefined()
      expect(metaErr?.line).toBe(4)
    }
  })

  it('reports correct line for non-SPDX license literal on its own line', () => {
    // license is on line 9 (1-indexed).
    const yaml = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: example
  description: License on a known line.
  upstream:
    source: example
    homepage: https://example.com
    license: GPL-3.0
    repository: https://github.com/example/example.git
    notice: Example.
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
`
    const result = validateManifestFile(yaml, 'bad-license.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const licenseErr = result.errors.find((e) => e.path.includes('/license'))
      expect(licenseErr, 'expected at least one error pointing at /license').toBeDefined()
      // The license value sits on line 9 (1-indexed). Allow ±0 deviation.
      expect(licenseErr?.line).toBe(9)
    }
  })

  it('reports yaml parse errors with line info (CRLF tolerant)', () => {
    // Intentionally malformed yaml — unbalanced bracket — should produce a
    // yaml-parse error with a non-null line number. Use CRLF to verify the
    // yaml@2 parser handles Windows line endings correctly.
    const yaml = ['apiVersion: harnessed/v1', 'kind: Manifest', 'metadata: [', '  name: bad'].join(
      '\r\n',
    )
    const result = validateManifestFile(yaml, 'malformed.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      // At least one error must have a populated line number.
      const lines = result.errors.map((e) => e.line).filter((l): l is number => l !== null)
      expect(lines.length).toBeGreaterThan(0)
    }
  })

  it('reports correct line for invalid platforms[0] enum value (sequence index)', () => {
    // platforms[0] sits on its own line (line 30) — exercises the
    // numeric-segment branch of `instancePathToKeyPath()` where Ajv reports
    // `instancePath: '/spec/platforms/0'`.
    const yaml = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: example
  description: platforms[0] enum violation on a known line.
  upstream:
    source: example
    homepage: https://example.com
    repository: https://github.com/example/example.git
    license: MIT
    notice: Example.
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
    - windows
`
    const result = validateManifestFile(yaml, 'platforms-bad.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const platErr = result.errors.find((e) => e.path.includes('/spec/platforms/0'))
      expect(platErr, 'expected enum error at /spec/platforms/0').toBeDefined()
      // `- windows` sits on line 31 (1-indexed).
      expect(platErr?.line).toBe(31)
    }
  })

  it('reports correct line for deeply nested install.npm_version format error', () => {
    // Exercises 3-level deep path (/spec/install/npm_version) — verifies
    // the LineCounter resolves through nested map nodes correctly.
    const yaml = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: example
  description: Deeply nested install field with wrong type.
  upstream:
    source: example
    homepage: https://example.com
    repository: https://github.com/example/example.git
    license: MIT
    notice: Example.
spec:
  type: cli-npm
  component_type: cli-binary
  install:
    method: npm-cli
    cmd: npm install -g example
    npm_version: 123
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
`
    const result = validateManifestFile(yaml, 'nested-type-error.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const npmErr = result.errors.find((e) => e.path.includes('/spec/install/npm_version'))
      expect(npmErr, 'expected type error at /spec/install/npm_version').toBeDefined()
      // npm_version: 123 sits on line 18 (1-indexed).
      expect(npmErr?.line).toBe(18)
    }
  })
})
