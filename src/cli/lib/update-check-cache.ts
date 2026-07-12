// 4.27.0 (B3 Slice 1, T4) — 24h-cached latest-version resolution with the
// isCompiledRuntime source split (compiled → GitHub releases/latest, npm →
// `npm view`). Refactors the always-fetch `checkUpdate` data source (CEO plan
// rev3 issue 1: doctor ran an uncached npm view every time, and on binary-only
// machines that check was permanently fail-soft silent — the discovery loop
// was dead for exactly the users D6 exists for).
//
// Discipline (rev3 终审陷阱): cachePath is a LAZY thunk — the npm default
// path must never eagerly touch detectPlatform() (fs-mock test environments
// throw); all cache I/O is fail-soft; an offline verdict (null) is NOT cached
// (a 24h-sticky null would mask network recovery).
//
// New module (mock-export-gap 铁律).

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import pkg from '../../../package.json' with { type: 'json' }
import { detectPlatform } from '../../installers/lib/platform.js'
import { isCompiledRuntime } from './assetsRoot.js'
import { fetchLatestVersion } from './version-check.js'

export const DEFAULT_UPDATE_CHECK_TTL_MS = 24 * 60 * 60 * 1000
export const DEFAULT_UPDATE_CHECK_TIMEOUT_MS = 2000

export interface LatestResolverDeps {
  cachePath: () => string
  now: () => number
  ttlMs?: number
  timeoutMs?: number
  isCompiled: () => boolean
  fetchNpm: () => Promise<string | null>
  fetchGitHub: (timeoutMs: number) => Promise<string | null>
}

interface CacheShape {
  latest: string
  ts: number
  source: 'npm' | 'github'
}

function parseCache(text: string): CacheShape | null {
  try {
    const c = JSON.parse(text) as Partial<CacheShape>
    if (typeof c.latest === 'string' && typeof c.ts === 'number') {
      return { latest: c.latest, ts: c.ts, source: c.source === 'github' ? 'github' : 'npm' }
    }
  } catch {
    /* corrupt → stale */
  }
  return null
}

/** Resolve the latest published version through the 24h cache. Fail-soft on
 *  every I/O edge; null = could not determine (and null is never cached). */
export async function resolveLatestCached(d: LatestResolverDeps): Promise<string | null> {
  const ttl = d.ttlMs ?? DEFAULT_UPDATE_CHECK_TTL_MS
  const timeout = d.timeoutMs ?? DEFAULT_UPDATE_CHECK_TIMEOUT_MS
  let cachePath: string | null = null
  try {
    cachePath = d.cachePath()
    const cached = parseCache(await readFile(cachePath, 'utf8'))
    if (cached && d.now() - cached.ts < ttl) return cached.latest
  } catch {
    /* no/unreadable cache → fetch */
  }
  const compiled = d.isCompiled()
  const latest = compiled ? await d.fetchGitHub(timeout) : await d.fetchNpm()
  if (latest !== null && cachePath !== null) {
    try {
      await mkdir(dirname(cachePath), { recursive: true })
      await writeFile(
        cachePath,
        `${JSON.stringify({ latest, ts: d.now(), source: compiled ? 'github' : 'npm' } satisfies CacheShape)}\n`,
        'utf8',
      )
    } catch {
      /* unwritable cache — still return the fetched value */
    }
  }
  return latest
}

/** GitHub releases/latest tag → version string (fail-soft null). Shares the
 *  frozen-contract endpoint with selfUpdateBinary but only needs tag_name. */
export async function fetchGitHubLatestVersion(timeoutMs: number): Promise<string | null> {
  try {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), timeoutMs)
    try {
      const res = await fetch('https://api.github.com/repos/easyinplay/harnessed/releases/latest', {
        signal: ac.signal,
        headers: { 'user-agent': `harnessed/${pkg.version}` },
      })
      if (!res.ok) return null
      const body = (await res.json()) as { tag_name?: string }
      const v = (body.tag_name ?? '').replace(/^v/, '')
      return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(v) ? v : null
    } finally {
      clearTimeout(timer)
    }
  } catch {
    return null
  }
}

function envTimeoutMs(): number {
  const raw = Number.parseInt(process.env.HARNESSED_UPDATE_CHECK_TIMEOUT_MS ?? '', 10)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_UPDATE_CHECK_TIMEOUT_MS
}

/** Production resolver (doctor / status / setup banner all share this cache). */
export function resolveLatestCachedDefault(): Promise<string | null> {
  return resolveLatestCached({
    // lazy: detectPlatform() only runs when this resolver actually executes
    // inside a real CLI run (never at import time).
    cachePath: () => join(detectPlatform().stateRoot, 'update-check.json'),
    now: () => Date.now(),
    timeoutMs: envTimeoutMs(),
    isCompiled: () => isCompiledRuntime(),
    fetchNpm: () => fetchLatestVersion(),
    fetchGitHub: (t) => fetchGitHubLatestVersion(t),
  })
}
