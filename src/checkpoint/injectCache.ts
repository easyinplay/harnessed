// src/checkpoint/injectCache.ts — 4.25.0 (intel B1): session-scoped delta cache
// for the per-turn <project-context> injection.
//
// Trellis v0.6.5/0.6.6 keeps its injected context "byte-stable across turns" to
// preserve provider prefix-cache eligibility; comet 0.3.7 skips re-reads on a
// handoff-hash hit. Composed for harnessed: the <project-context> block (up to
// DEFAULT_INJECT_BUDGET ≈ 1500 tokens of learnings + CONTEXT excerpt) is
// byte-identical turn after turn, yet the UserPromptSubmit hook re-injected it
// every turn — pure token burn, the content already sits in the conversation
// history. Within one session (repoKey::sid) we hash the block and skip
// re-injection on a hit, re-emitting every REFRESH_TURNS turns as a hedge
// against compaction dropping the earlier copy (stateless alternative to a
// PreCompact hook we do not install).
//
// Fail-soft contract: the cache may only ever SAVE tokens, never lose context —
// no sid / unreadable cache / unwritable cache ⇒ full injection. In particular
// a skip decision is only honored when the incremented cache entry was
// PERSISTED (otherwise `turns` would freeze and the periodic refresh would
// never fire). bin/harnessed-inject-state.mjs inlines this exact logic (it is
// self-contained plain JS by contract); the delta cells in
// tests/checkpoint/injectState.test.ts hold the two implementations together.

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const DEFAULT_REFRESH_TURNS = 10

export interface InjectCacheEntry {
  pcHash: string
  ts: number
  turns: number
}

/** Pure — should this turn emit the full <project-context> block?
 *  Hit below the refresh horizon → skip (turns+1, ts kept). Anything else
 *  (no cache / hash miss / horizon reached) → full emission + reset. */
export function decidePcEmission(
  cache: InjectCacheEntry | null,
  pcHash: string,
  refreshN: number,
  nowMs: number,
): { emit: boolean; next: InjectCacheEntry } {
  if (cache && cache.pcHash === pcHash && cache.turns < refreshN) {
    return { emit: false, next: { pcHash, ts: cache.ts, turns: cache.turns + 1 } }
  }
  return { emit: true, next: { pcHash, ts: nowMs, turns: 0 } }
}

/** Pure — HARNESSED_INJECT_REFRESH_TURNS parser; junk/zero/negative → default. */
export function parseRefreshTurns(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '', 10)
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_REFRESH_TURNS
}

/** Pure — cache filename stem for a repo+session pair (16 hex chars). */
export function injectCacheKey(repoKey: string, sid: string): string {
  return createHash('sha256').update(`${repoKey}::${sid}`).digest('hex').slice(0, 16)
}

function cacheFile(root: string, key: string): string {
  return join(root, 'inject-cache', `${key}.json`)
}

/** Impure, fail-soft — null on missing/corrupt/wrong-shape cache. */
export function readInjectCache(root: string, key: string): InjectCacheEntry | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(cacheFile(root, key), 'utf8'))
    if (parsed && typeof parsed === 'object') {
      const e = parsed as Record<string, unknown>
      if (typeof e.pcHash === 'string' && typeof e.ts === 'number' && typeof e.turns === 'number') {
        return { pcHash: e.pcHash, ts: e.ts, turns: e.turns }
      }
    }
  } catch {
    /* fail-soft */
  }
  return null
}

/** Impure, fail-soft — returns whether the entry was persisted. Callers must
 *  only honor a SKIP decision when this returns true (see header). */
export function writeInjectCache(root: string, key: string, entry: InjectCacheEntry): boolean {
  try {
    mkdirSync(join(root, 'inject-cache'), { recursive: true })
    writeFileSync(cacheFile(root, key), `${JSON.stringify(entry)}\n`, 'utf8')
    return true
  } catch {
    return false
  }
}
