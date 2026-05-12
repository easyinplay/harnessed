// Phase 1.1.1 hotfix B2 + M1 — git_ref pattern enforcement.
//
// ADR 0001 § "版本锁哲学" requires reproducible installs via SHA-pinned
// or SemVer-tagged refs. Branch names like HEAD/main/master would
// silently drift, breaking determinism. M1 adds a regex pattern to the
// cc-plugin-marketplace + git-clone-with-setup install method schemas:
//
//   ^([a-f0-9]{7,40}|v?\d+\.\d+\.\d+([.-][\w.-]+)?)$
//
// Accepted: 7-40 lowercase hex (commit SHA), or v?N.N.N optionally
// followed by a SemVer-style suffix (-rc.1, .post1, +build.7, etc.).
// Rejected: HEAD, main, master, feature/*, anything with uppercase
// hex, branch refs.

import { describe, expect, it } from 'vitest'
import { validateManifestFile } from '../../src/manifest/validate.js'

const BASE_GIT_CLONE = `apiVersion: harnessed/v1
kind: Manifest
metadata:
  name: gitref
  display_name: gitref
  description: git_ref pattern enforcement test fixture.
  upstream:
    source: gitref
    homepage: https://example.com
    repository: https://github.com/example/gitref.git
    license: MIT
    notice: Test fixture only.
spec:
  type: cc-skill-pack
  component_type: command
  category: engineering
  install_type: git
  install:
    method: git-clone-with-setup
    cmd: "git clone https://example.com/x ~/.claude/skills/gitref"
    git_ref: __REF__
    idempotent_check: "test -d ~/.claude/skills/gitref/.git"
  verify:
    cmd: "test -d ~/.claude/skills/gitref"
    timeout_ms: 5000
  uninstall:
    cmd: "rm -rf ~/.claude/skills/gitref"
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

function withRef(ref: string): string {
  return BASE_GIT_CLONE.replace('__REF__', ref)
}

describe('validateManifestFile — git_ref pattern (B2/M1)', () => {
  // ─── Reject branch names ────────────────────────────────────────────
  it('rejects git_ref: HEAD (branch name, would drift)', () => {
    const result = validateManifestFile(withRef('HEAD'), 'gitref-head.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const e = result.errors.find((er) => er.path.includes('git_ref'))
      expect(e).toBeDefined()
      expect(e?.keyword).toBe('pattern')
    }
  })

  it('rejects git_ref: main (branch name)', () => {
    const result = validateManifestFile(withRef('main'), 'gitref-main.yaml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path.includes('git_ref'))).toBe(true)
    }
  })

  it('rejects git_ref: master (branch name)', () => {
    const result = validateManifestFile(withRef('master'), 'gitref-master.yaml')
    expect(result.ok).toBe(false)
  })

  it('rejects git_ref: feature/foo (branch path)', () => {
    const result = validateManifestFile(withRef('feature/foo'), 'gitref-feat.yaml')
    expect(result.ok).toBe(false)
  })

  // ─── Accept SHA + SemVer ────────────────────────────────────────────
  it('accepts 40-char SHA', () => {
    const result = validateManifestFile(
      withRef('a5ac7e51b41094c92402da3b24376905380afc29'),
      'gitref-sha40.yaml',
    )
    expect(result.ok).toBe(true)
  })

  it('accepts 7-char short SHA', () => {
    const result = validateManifestFile(withRef('a5ac7e5'), 'gitref-sha7.yaml')
    expect(result.ok).toBe(true)
  })

  it('accepts SemVer tag with v prefix', () => {
    const result = validateManifestFile(withRef('v2.37.0'), 'gitref-tagv.yaml')
    expect(result.ok).toBe(true)
  })

  it('accepts SemVer tag without v prefix', () => {
    const result = validateManifestFile(withRef('1.0.0'), 'gitref-tag.yaml')
    expect(result.ok).toBe(true)
  })

  it('accepts SemVer pre-release tag', () => {
    const result = validateManifestFile(withRef('v1.0.0-rc.1'), 'gitref-rc.yaml')
    expect(result.ok).toBe(true)
  })
})
