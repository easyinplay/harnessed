// 4.27.0 (B3 Slice 1, T4) — 24h-cached latest-version resolution with
// isCompiledRuntime source split (compiled → GitHub releases/latest, npm →
// npm view). TDD red-first. Contract highlights (CEO plan rev3 issue 1 +
// 终审陷阱): cachePath is a lazy thunk (npm default path must not eagerly
// touch detectPlatform), all cache I/O fail-soft, offline result (null) is
// NOT cached (a 24h-sticky offline verdict would mask recovery).

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_UPDATE_CHECK_TTL_MS,
  type LatestResolverDeps,
  resolveLatestCached,
} from '../../../src/cli/lib/update-check-cache.js'

function deps(overrides: Partial<LatestResolverDeps> = {}): LatestResolverDeps {
  const dir = mkdtempSync(join(tmpdir(), 'updcache-'))
  return {
    cachePath: () => join(dir, 'update-check.json'),
    now: () => 1_000_000_000_000,
    isCompiled: () => false,
    fetchNpm: async () => '9.9.9',
    fetchGitHub: async () => '8.8.8',
    ...overrides,
  }
}

describe('resolveLatestCached', () => {
  it('fresh cache hit → returns cached value, no fetch', async () => {
    const fetchNpm = vi.fn(async () => '9.9.9')
    const d = deps({ fetchNpm })
    writeFileSync(
      d.cachePath(),
      JSON.stringify({ latest: '7.7.7', ts: d.now() - 1000, source: 'npm' }),
    )
    expect(await resolveLatestCached(d)).toBe('7.7.7')
    expect(fetchNpm).not.toHaveBeenCalled()
  })

  it('stale cache → refetch (npm mode) and rewrite the cache', async () => {
    const d = deps()
    writeFileSync(
      d.cachePath(),
      JSON.stringify({
        latest: '7.7.7',
        ts: d.now() - DEFAULT_UPDATE_CHECK_TTL_MS - 1,
        source: 'npm',
      }),
    )
    expect(await resolveLatestCached(d)).toBe('9.9.9')
    const cached = JSON.parse(readFileSync(d.cachePath(), 'utf8')) as { latest: string }
    expect(cached.latest).toBe('9.9.9')
  })

  it('compiled runtime → GitHub source, npm untouched', async () => {
    const fetchNpm = vi.fn(async () => '9.9.9')
    const d = deps({ isCompiled: () => true, fetchNpm })
    expect(await resolveLatestCached(d)).toBe('8.8.8')
    expect(fetchNpm).not.toHaveBeenCalled()
  })

  it('offline (fetch null) → null, and null is NOT cached', async () => {
    const d = deps({ fetchNpm: async () => null })
    expect(await resolveLatestCached(d)).toBe(null)
    // next call with a working fetch must not be shadowed by a cached null
    expect(await resolveLatestCached({ ...d, fetchNpm: async () => '9.9.9' })).toBe('9.9.9')
  })

  it('corrupt cache file → treated as stale (fail-soft), refetches', async () => {
    const d = deps()
    writeFileSync(d.cachePath(), '{oops')
    expect(await resolveLatestCached(d)).toBe('9.9.9')
  })

  it('unwritable cache path → still returns the fetched value (fail-soft write)', async () => {
    const d = deps({ cachePath: () => join('Z:\\nonexistent-vol', 'x', 'update-check.json') })
    expect(await resolveLatestCached(d)).toBe('9.9.9')
  })
})
