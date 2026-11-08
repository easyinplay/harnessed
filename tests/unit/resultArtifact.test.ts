// Phase 86 — the result-artifact path is the transport contract: the sub writes
// its final result there and the orchestrator polls that very file. If the path
// is not a pure function of (cwd, session, sub), the two sides disagree and the
// completion signal is lost (open-gsd/gsd-core#1355).
//
// The path must also be SAFE: `sub` is a CLI argument and is joined into a path,
// so a traversal attempt must be refused before anything is written.

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resultArtifactPath, resultArtifactScope } from '../../src/cli/lib/resultArtifact.js'

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'harnessed-result-artifact-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
  vi.unstubAllEnvs()
})

describe('resultArtifactPath — determinism', () => {
  it('the same (cwd, sub) always yields the same path', () => {
    const a = resultArtifactPath('task-code', root)
    const b = resultArtifactPath('task-code', root)
    expect(a).toBe(b)
  })

  it('a different sub yields a different path', () => {
    expect(resultArtifactPath('task-code', root)).not.toBe(resultArtifactPath('task-test', root))
  })

  it('a different session yields a different path', () => {
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'session-a')
    const a = resultArtifactPath('task-code', root)
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'session-b')
    const b = resultArtifactPath('task-code', root)
    expect(a).not.toBe(b)
  })

  it('the no-session scope differs from a real session scope', () => {
    const noSession = resultArtifactScope(root)
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'session-a')
    expect(resultArtifactScope(root)).not.toBe(noSession)
  })
})

describe('resultArtifactPath — shape', () => {
  it('lands under <cwd>/.harnessed/results/<scope>/<sub>.md', () => {
    const path = resultArtifactPath('task-code', root)
    const scope = resultArtifactScope(root)
    expect(path).toBe(join(root, '.harnessed', 'results', scope, 'task-code.md'))
    expect(isAbsolute(path)).toBe(true)
  })

  it('the scope is 8 hex chars — no drive letter, no path separator', () => {
    const scope = resultArtifactScope(root)
    expect(scope).toMatch(/^[0-9a-f]{8}$/)
    expect(scope).not.toMatch(/[:\\/]/)
  })

  it('the scope is host-shaped the same way on every platform', () => {
    // The scope is a digest of the ledger slot key, never a path fragment — a
    // drive letter or a separator in it would make the results dir unportable.
    const scope = resultArtifactScope(root)
    expect(scope).not.toContain(':')
    expect(scope).not.toContain('\\')
    expect(scope).not.toContain('/')
  })
})

describe('resultArtifactPath — traversal guard', () => {
  it('refuses a sub that tries to escape the results dir', () => {
    expect(() => resultArtifactPath('../escape', root)).toThrow()
    expect(() => resultArtifactPath('..\\escape', root)).toThrow()
    expect(() => resultArtifactPath('a/b', root)).toThrow()
  })

  it('refuses a bare dot-segment', () => {
    expect(() => resultArtifactPath('..', root)).toThrow()
  })
})
