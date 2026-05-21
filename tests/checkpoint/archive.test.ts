// Phase 3.1 W2 T2.4 — archive.test.ts: 4 fixtures (21-24). vi.mock fs sister
// pattern: template.test.ts + state.test.ts (W1).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fsState = new Map<string, string>()
const mkdirCalls: string[] = []

vi.mock('node:fs', () => ({
  writeFileSync: (p: string, data: string) => void fsState.set(p, data),
  mkdirSync: (p: string) => void mkdirCalls.push(p),
}))

import { ArchiveWriteError, writeArchive } from '../../src/checkpoint/archive.js'

beforeEach(() => {
  fsState.clear()
  mkdirCalls.length = 0
})
afterEach(() => vi.clearAllMocks())

describe('archive — writeArchive raw dump (T2.4 fixtures 21-24)', () => {
  it('21. happy path: writeArchive(phase, turns) → file at phase-<X.Y>/raw-<ISO-ts>.json', () => {
    const p = writeArchive('3.1', [{ role: 'user', content: 'hi' }])
    // v3.0.3 — archive path now under ~/.claude/harnessed/archive/phase-<X.Y>/
    // (homedir-rooted via getHarnessedRoot SoT). Match cross-platform.
    expect(p).toMatch(/\.claude[\\/]harnessed[\\/]archive[\\/]phase-3\.1[\\/]raw-/)
    expect(p.endsWith('.json')).toBe(true)
    expect(fsState.get(p)).toBeDefined()
    expect(mkdirCalls.some((d) => d.includes('phase-3.1'))).toBe(true)
  })

  it('22. unbounded size: 100k-char raw turn preserved fully (no truncation)', () => {
    const huge = { role: 'assistant', content: 'x'.repeat(100_000) }
    const p = writeArchive('3.1', [huge])
    const written = fsState.get(p) as string
    expect(written.length).toBeGreaterThan(100_000)
    expect(JSON.parse(written)).toEqual([huge])
  })

  it('23. invalid phase: writeArchive("", []) → throws ArchiveWriteError', () => {
    expect(() => writeArchive('', [])).toThrow(ArchiveWriteError)
  })

  it('24. invalid rawTurns: non-array → throws ArchiveWriteError', () => {
    expect(() => writeArchive('3.1', 'not-array' as unknown as unknown[])).toThrow(
      ArchiveWriteError,
    )
  })
})
