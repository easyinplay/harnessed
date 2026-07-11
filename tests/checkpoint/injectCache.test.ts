// 4.25.0 (intel B1 — Trellis byte-stable injection + comet hash-hit skip,
// composed): session-scoped delta cache for the per-turn <project-context>
// block. Same pc hash within a session → skip re-injection (the content is
// already in the conversation); periodic refresh every N turns hedges against
// compaction dropping history. Any cache trouble → full injection (fail-soft:
// the cache may only ever SAVE tokens, never lose context).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_REFRESH_TURNS,
  decidePcEmission,
  injectCacheKey,
  parseRefreshTurns,
  readInjectCache,
  writeInjectCache,
} from '../../src/checkpoint/injectCache.js'

describe('decidePcEmission (pure)', () => {
  const NOW = 1_700_000_000_000

  it('no cache → emit full + fresh entry', () => {
    const d = decidePcEmission(null, 'abc', 10, NOW)
    expect(d.emit).toBe(true)
    expect(d.next).toEqual({ pcHash: 'abc', ts: NOW, turns: 0 })
  })

  it('hash hit below refreshN → skip, turns+1, ts preserved', () => {
    const d = decidePcEmission({ pcHash: 'abc', ts: 1, turns: 3 }, 'abc', 10, NOW)
    expect(d.emit).toBe(false)
    expect(d.next).toEqual({ pcHash: 'abc', ts: 1, turns: 4 })
  })

  it('hash hit at refreshN → periodic full re-emit + reset (compaction hedge)', () => {
    const d = decidePcEmission({ pcHash: 'abc', ts: 1, turns: 10 }, 'abc', 10, NOW)
    expect(d.emit).toBe(true)
    expect(d.next).toEqual({ pcHash: 'abc', ts: NOW, turns: 0 })
  })

  it('hash mismatch → full re-emit + reset (content changed)', () => {
    const d = decidePcEmission({ pcHash: 'old', ts: 1, turns: 2 }, 'new', 10, NOW)
    expect(d.emit).toBe(true)
    expect(d.next).toEqual({ pcHash: 'new', ts: NOW, turns: 0 })
  })
})

describe('parseRefreshTurns', () => {
  it('default 10; positive integers pass; junk/zero/negative → default', () => {
    expect(DEFAULT_REFRESH_TURNS).toBe(10)
    expect(parseRefreshTurns(undefined)).toBe(10)
    expect(parseRefreshTurns('5')).toBe(5)
    expect(parseRefreshTurns('1')).toBe(1)
    expect(parseRefreshTurns('0')).toBe(10)
    expect(parseRefreshTurns('-3')).toBe(10)
    expect(parseRefreshTurns('abc')).toBe(10)
    expect(parseRefreshTurns('')).toBe(10)
  })
})

describe('injectCacheKey', () => {
  it('16 hex chars, deterministic, sid-sensitive', () => {
    const a = injectCacheKey('/repo', 'sess1')
    expect(a).toMatch(/^[0-9a-f]{16}$/)
    expect(injectCacheKey('/repo', 'sess1')).toBe(a)
    expect(injectCacheKey('/repo', 'sess2')).not.toBe(a)
    expect(injectCacheKey('/other', 'sess1')).not.toBe(a)
  })
})

describe('read/write inject cache (impure, fail-soft)', () => {
  let tmp: string
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'inject-cache-'))
  })
  afterEach(() => rmSync(tmp, { recursive: true, force: true }))

  it('roundtrip', () => {
    writeInjectCache(tmp, 'deadbeefdeadbeef', { pcHash: 'h', ts: 5, turns: 2 })
    expect(readInjectCache(tmp, 'deadbeefdeadbeef')).toEqual({ pcHash: 'h', ts: 5, turns: 2 })
  })

  it('missing file → null', () => {
    expect(readInjectCache(tmp, 'nope')).toBeNull()
  })

  it('corrupt JSON → null', () => {
    mkdirSync(join(tmp, 'inject-cache'), { recursive: true })
    writeFileSync(join(tmp, 'inject-cache', 'bad1.json'), '{oops', 'utf8')
    expect(readInjectCache(tmp, 'bad1')).toBeNull()
  })

  it('wrong shape → null', () => {
    mkdirSync(join(tmp, 'inject-cache'), { recursive: true })
    writeFileSync(join(tmp, 'inject-cache', 'bad2.json'), '{"pcHash":1,"ts":"x"}', 'utf8')
    expect(readInjectCache(tmp, 'bad2')).toBeNull()
  })

  it('write failure is silent (returns false, never throws)', () => {
    // A FILE occupying the inject-cache path makes mkdir/write fail cross-platform.
    writeFileSync(join(tmp, 'inject-cache'), 'not a dir', 'utf8')
    expect(() => writeInjectCache(tmp, 'k', { pcHash: 'h', ts: 1, turns: 0 })).not.toThrow()
    expect(writeInjectCache(tmp, 'k', { pcHash: 'h', ts: 1, turns: 0 })).toBe(false)
  })

  it('write reports success (true) so a skip decision can be trusted', () => {
    expect(writeInjectCache(tmp, 'k2', { pcHash: 'h', ts: 1, turns: 0 })).toBe(true)
  })
})
