import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

// A full valid manifest exercising every required field per ADR 0001.
// Uses cli-npm + npm-cli (matrix-legal combo).
const VALID_YAML = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: ctx7
  display_name: Context7 CLI
  description: Fetch up-to-date library documentation via the ctx7 CLI tool.
  upstream:
    source: ctx7
    homepage: https://context7.com
    repository: https://github.com/upstash/context7.git
    license: MIT
    notice: ctx7 by Upstash, used as on-demand library doc retriever.
spec:
  type: cli-npm
  component_type: cli-binary
  install:
    method: npm-cli
    cmd: npm install -g ctx7
    npm_version: ^1.0.0
    idempotent_check: which ctx7
  verify:
    cmd: ctx7 --version
    timeout_ms: 5000
    expected_exit_code: 0
  uninstall:
    cmd: npm uninstall -g ctx7
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

describe('validateManifestFile — positive', () => {
  it('accepts a full valid cli-npm manifest', () => {
    const result = validateManifestFile(VALID_YAML, 'ctx7.yaml')
    if (!result.ok) {
      // Surface errors so failing test output is debuggable.
      console.error('Unexpected validation errors:', result.errors)
    }
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.manifest.metadata.name).toBe('ctx7')
      expect(result.manifest.spec.type).toBe('cli-npm')
      expect(result.manifest.spec.install.method).toBe('npm-cli')
    }
  })
})
