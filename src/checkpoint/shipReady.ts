// Phase 22 — ship-reminder git core. Pure decision (`collectShipReady`) over an
// injected commit counter + impure git reader (`defaultShipReady`), sister to
// `cli/lib/release-preflight.ts` (pure checks + impure defaultDeps). Fail-soft:
// any git error degrades to { ready:false } — a reminder must never crash a
// checkpoint.
//
// Fact under test: are there unshipped commits since the most recent vX.Y.Z tag?
// No release tag yet → count ALL commits (HEAD). The result is recomputed at each
// allResolved `checkpoint complete`, so it self-heals to false after a release.

import { execFileSync } from 'node:child_process'

export interface ShipReadyResult {
  ready: boolean
  commits: number
  baseTag: string | null
}

const RELEASE_TAG = /^v(\d+)\.(\d+)\.(\d+)$/

/** Pure — pick the highest vX.Y.Z tag by numeric semver (ignores non-release tags
 *  and pre-release suffixes). null when there is no release tag. */
export function pickLatestReleaseTag(tags: string[]): string | null {
  let best: { tag: string; n: [number, number, number] } | null = null
  for (const tag of tags) {
    const m = RELEASE_TAG.exec(tag.trim())
    if (!m) continue
    const n: [number, number, number] = [Number(m[1]), Number(m[2]), Number(m[3])]
    if (
      !best ||
      n[0] > best.n[0] ||
      (n[0] === best.n[0] && n[1] > best.n[1]) ||
      (n[0] === best.n[0] && n[1] === best.n[1] && n[2] > best.n[2])
    ) {
      best = { tag: tag.trim(), n }
    }
  }
  return best?.tag ?? null
}

/** Pure — decide ship-readiness. `countSince(tag)` returns commits after `tag`
 *  (or ALL commits when tag is null). ready = commits > 0. */
export function collectShipReady(
  tags: string[],
  countSince: (tag: string | null) => number,
): ShipReadyResult {
  const baseTag = pickLatestReleaseTag(tags)
  const commits = countSince(baseTag)
  return { ready: commits > 0, commits, baseTag }
}

/** Impure — read git tags + commit count, fail-soft. Wires `collectShipReady`
 *  with a real `git rev-list … --count` counter. Any git error → not ready. */
export function defaultShipReady(cwd: string): ShipReadyResult {
  let tags: string[] = []
  try {
    tags = execFileSync('git', ['tag', '-l'], { cwd, encoding: 'utf8' })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return { ready: false, commits: 0, baseTag: null }
  }
  const countSince = (tag: string | null): number => {
    try {
      const range = tag ? `${tag}..HEAD` : 'HEAD'
      const out = execFileSync('git', ['rev-list', range, '--count'], {
        cwd,
        encoding: 'utf8',
      }).trim()
      const n = Number(out)
      return Number.isFinite(n) ? n : 0
    } catch {
      return 0
    }
  }
  return collectShipReady(tags, countSince)
}
