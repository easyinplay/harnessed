// Phase 5.2 W2 T2.2 — TDD RED: path-guard 5-vector OWASP A1 + D-08 safe-message verify.
// Sister: tests/manifest/aliases-security.test.ts (pure function, no vi.mock needed).
// Karpathy ≤200L; 9 cells per PLAN T2.2 + RESEARCH § 3.5.

import { describe, expect, it } from 'vitest'
import { PathTraversalError, checkPathSafe } from '../../../src/manifest/lib/path-guard.js'

describe('checkPathSafe — 5 OWASP A1 attack vectors', () => {
  // Cell 1: Unix dot-dot-slash
  it('rejects Unix dot-dot-slash traversal (../../etc/passwd)', () => {
    expect(() => checkPathSafe('../../etc/passwd')).toThrow(PathTraversalError)
  })

  // Cell 2: Windows backslash dot-dot
  it('rejects Windows backslash dot-dot (..\\.\\windows\\system32)', () => {
    expect(() => checkPathSafe('..\\..\\windows\\system32')).toThrow(PathTraversalError)
  })

  // Cell 3: Null byte injection
  it('rejects null byte injection (legit/path\\x00attack)', () => {
    expect(() => checkPathSafe('legit/path\x00attack')).toThrow(PathTraversalError)
  })

  // Cell 4: URL-encoded dot-dot
  it('rejects URL-encoded dot-dot (%2e%2e%2fetc)', () => {
    expect(() => checkPathSafe('%2e%2e%2fetc')).toThrow(PathTraversalError)
  })

  // Cell 5: Double-encoded dot-dot
  it('rejects double-encoded dot-dot (%252e%252e%252f)', () => {
    expect(() => checkPathSafe('%252e%252e%252f')).toThrow(PathTraversalError)
  })

  // Cell 6: D-08 verify — error message does NOT contain user input (CSO veto)
  it('D-08: PathTraversalError message does NOT contain the attempted path', () => {
    let caught: unknown
    try {
      checkPathSafe('../../etc/passwd')
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(PathTraversalError)
    const err = caught as PathTraversalError
    expect(err.message).not.toContain('../../etc/passwd')
    expect(err.message).not.toContain('etc/passwd')
    expect(err.message).toBe('path traversal attempt detected')
  })

  // Cell 7: safe path — manifests/tools/ctx7.yaml should pass
  it('accepts safe manifest path (manifests/tools/ctx7.yaml)', () => {
    expect(() => checkPathSafe('manifests/tools/ctx7.yaml')).not.toThrow()
  })

  // Cell 8: safe simple name — ctx7 should pass
  it('accepts safe simple name (ctx7)', () => {
    expect(() => checkPathSafe('ctx7')).not.toThrow()
  })

  // Cell 9: safe name with dashes and underscores
  it('accepts safe name with dashes/underscores (my-tool_v2)', () => {
    expect(() => checkPathSafe('my-tool_v2')).not.toThrow()
  })
})
