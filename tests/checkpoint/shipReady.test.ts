// Phase 22 — unit tests for src/checkpoint/shipReady.ts (ship-reminder git core).
//
// Covers (CONTEXT D2 + acceptance 2):
//   - pickLatestReleaseTag: filters vX.Y.Z, picks highest semver, ignores noise
//   - collectShipReady: commits>0 → ready; 0 → not; no tag → counts ALL commits
//   - the counter callback receives the picked base tag (null when no release tag)
//
// Pure module — no git here; the impure defaultShipReady wires execFileSync and is
// covered by the checkpoint-complete integration path.

import { describe, expect, it } from 'vitest'
import { collectShipReady, pickLatestReleaseTag } from '../../src/checkpoint/shipReady.js'

describe('pickLatestReleaseTag', () => {
  it('picks the highest vX.Y.Z by semver (not lexical)', () => {
    expect(pickLatestReleaseTag(['v4.5.0', 'v4.5.1', 'v4.10.0', 'v4.9.0'])).toBe('v4.10.0')
  })

  it('ignores non-release tags (no v / not 3-part / pre-release suffix)', () => {
    expect(pickLatestReleaseTag(['nightly', 'v1.2', 'v2.0.0-rc1', 'v1.0.0', 'release-3'])).toBe(
      'v1.0.0',
    )
  })

  it('returns null when there is no vX.Y.Z tag', () => {
    expect(pickLatestReleaseTag([])).toBeNull()
    expect(pickLatestReleaseTag(['foo', 'v1.2'])).toBeNull()
  })
})

describe('collectShipReady', () => {
  it('ready=true when there are commits since the latest release tag', () => {
    const r = collectShipReady(['v1.0.0', 'v1.1.0'], (tag) => (tag === 'v1.1.0' ? 3 : 999))
    expect(r).toEqual({ ready: true, commits: 3, baseTag: 'v1.1.0' })
  })

  it('ready=false when there are zero commits since the latest tag', () => {
    const r = collectShipReady(['v2.0.0'], () => 0)
    expect(r.ready).toBe(false)
    expect(r.commits).toBe(0)
    expect(r.baseTag).toBe('v2.0.0')
  })

  it('no release tag → counts ALL commits (baseTag null) and is ready when any exist', () => {
    const r = collectShipReady(['scratch'], (tag) => (tag === null ? 7 : 0))
    expect(r).toEqual({ ready: true, commits: 7, baseTag: null })
  })

  it('no tag + zero commits → not ready (fresh repo)', () => {
    const r = collectShipReady([], () => 0)
    expect(r).toEqual({ ready: false, commits: 0, baseTag: null })
  })
})
