// Patch 4.10.1 installer-robustness Fix C — TDD for reclassifyForceUpdateFailures.
//
// Background (real dogfood): `harnessed setup` force-update second pass re-runs
// install for already-installed plugins. When a refresh fails BUT the component
// is still present on disk (prior version retained), reporting it as `failed` is
// misleading — comet `ensureOpenSpecCli` "upgrade failure ≠ fatal" principle:
// fall back to the existing install + warn, do not red-flag.
//
// reclassifyForceUpdateFailures is a pure, probe-injectable function so we can
// TDD the failed→keptExisting reclassification without spawning real installs.

import { describe, expect, it, vi } from 'vitest'
import { reclassifyForceUpdateFailures, type StepBResult } from '../../src/cli/lib/setup-helpers.js'

function mkResult(p: Partial<StepBResult>): StepBResult {
  return {
    installed: [],
    alreadyInstalled: [],
    skipped: [],
    failed: [],
    elapsedMs: 0,
    componentTypes: {},
    ...p,
  }
}

/** probe stub: present-set membership → true. */
function probeFrom(present: string[]): (name: string) => Promise<boolean> {
  const set = new Set(present)
  return async (name: string) => set.has(name)
}

describe('reclassifyForceUpdateFailures — Fix C kept-existing fail-soft', () => {
  it.each([
    'false',
    'throw',
  ] as const)('keeps a prior install on structured update-unsupported without calling a %s probe', async (probeOutcome) => {
    const first = mkResult({ alreadyInstalled: ['existing-skill'] })
    const force = mkResult({ failed: ['existing-skill: opaque preflight refusal'] })
    Object.assign(force, { failureKeywords: { 'existing-skill': 'update-unsupported' } })
    const probe = vi.fn(async () => {
      if (probeOutcome === 'throw') throw new Error('runtime unavailable')
      return false
    })

    const result = await reclassifyForceUpdateFailures(first, force, probe)

    expect(result.keptExisting).toEqual([
      { name: 'existing-skill', reason: 'opaque preflight refusal' },
    ])
    expect(result.failed).toEqual([])
    expect(probe).not.toHaveBeenCalled()
  })

  it('keeps a fresh structured update-unsupported failure fatal without probing', async () => {
    const first = mkResult({ installed: ['fresh-skill'], alreadyInstalled: ['other-skill'] })
    const force = mkResult({ failed: ['fresh-skill: opaque preflight refusal'] })
    Object.assign(force, { failureKeywords: { 'fresh-skill': 'update-unsupported' } })
    const probe = vi.fn(async () => true)

    const result = await reclassifyForceUpdateFailures(first, force, probe)

    expect(result.failed).toEqual(['fresh-skill: opaque preflight refusal'])
    expect(result.keptExisting).toEqual([])
    expect(probe).not.toHaveBeenCalled()
  })

  it.each([
    'verify-failed',
    'spawn-failed',
    undefined,
  ])('uses the probe for generic keyword %s even when the message says update-unsupported', async (keyword) => {
    const first = mkResult({ alreadyInstalled: ['existing-skill'] })
    const force = mkResult({ failed: ['existing-skill: update-unsupported'] })
    if (keyword) Object.assign(force, { failureKeywords: { 'existing-skill': keyword } })
    const probe = vi.fn(async () => true)

    const result = await reclassifyForceUpdateFailures(first, force, probe)

    expect(result.keptExisting).toEqual([{ name: 'existing-skill', reason: 'update-unsupported' }])
    expect(result.failed).toEqual([])
    expect(probe).toHaveBeenCalledExactlyOnceWith('existing-skill')
  })

  it.each([
    ['verify-failed', 'false'],
    ['verify-failed', 'throw'],
    ['spawn-failed', 'false'],
    ['spawn-failed', 'throw'],
  ] as const)('keeps %s fatal when the probe returns %s', async (keyword, probeOutcome) => {
    const first = mkResult({ alreadyInstalled: ['existing-skill'] })
    const force = mkResult({ failed: ['existing-skill: update-unsupported'] })
    Object.assign(force, { failureKeywords: { 'existing-skill': keyword } })
    const probe = vi.fn(async () => {
      if (probeOutcome === 'throw') throw new Error('probe unavailable')
      return false
    })

    const result = await reclassifyForceUpdateFailures(first, force, probe)

    expect(result.failed).toEqual(['existing-skill: update-unsupported'])
    expect(result.keptExisting).toEqual([])
    expect(probe).toHaveBeenCalledExactlyOnceWith('existing-skill')
  })

  it('failed ∩ alreadyInstalled & probe→present → moved to keptExisting (out of failed)', async () => {
    const first = mkResult({ alreadyInstalled: ['gstack', 'gsd'] })
    const force = mkResult({ failed: ['gstack: git-clone-with-setup cmd exited 1'] })
    const r = await reclassifyForceUpdateFailures(first, force, probeFrom(['gstack']))
    // v4.15.2 T3 — keptExisting carries the underlying reason (was: bare names).
    expect(r.keptExisting).toEqual([
      { name: 'gstack', reason: 'git-clone-with-setup cmd exited 1' },
    ])
    expect(r.failed).toEqual([])
  })

  it('failed ∩ alreadyInstalled & probe→absent → stays failed (honest)', async () => {
    const first = mkResult({ alreadyInstalled: ['gstack'] })
    const force = mkResult({ failed: ['gstack: git rm then clone network fail'] })
    const r = await reclassifyForceUpdateFailures(first, force, probeFrom([]))
    expect(r.keptExisting).toEqual([])
    expect(r.failed).toEqual(['gstack: git rm then clone network fail'])
  })

  it('failed NOT in alreadyInstalled (fresh install failure) → stays failed, never probed', async () => {
    const first = mkResult({ alreadyInstalled: ['gsd'] })
    const force = mkResult({ failed: ['brand-new: verify exit 1'] })
    let probed = false
    const probe = async (name: string): Promise<boolean> => {
      probed = true
      return name === 'brand-new'
    }
    const r = await reclassifyForceUpdateFailures(first, force, probe)
    expect(r.failed).toEqual(['brand-new: verify exit 1'])
    expect(r.keptExisting).toEqual([])
    expect(probed).toBe(false)
  })

  it('mixed batch — buckets + counts correct', async () => {
    const first = mkResult({ alreadyInstalled: ['gstack', 'frontend-design', 'ui-ux-pro-max'] })
    const force = mkResult({
      failed: [
        'gstack: cmd exited 1',
        'frontend-design: cmd exited 1',
        'ui-ux-pro-max: cmd exited 1',
        'fresh-pkg: install failed',
      ],
    })
    // gstack + ui-ux-pro-max still present; frontend-design genuinely gone.
    const r = await reclassifyForceUpdateFailures(
      first,
      force,
      probeFrom(['gstack', 'ui-ux-pro-max']),
    )
    // v4.15.2 T3 — objects with reason; sort by name for a stable comparison.
    expect(r.keptExisting.map((k) => k.name).sort()).toEqual(['gstack', 'ui-ux-pro-max'])
    expect(r.keptExisting.every((k) => k.reason === 'cmd exited 1')).toBe(true)
    expect(r.failed.sort()).toEqual(['fresh-pkg: install failed', 'frontend-design: cmd exited 1'])
    expect(r.keptExisting.length + r.failed.length).toBe(force.failed.length)
  })

  it('probe throw → treated as absent (stays failed, no crash)', async () => {
    const first = mkResult({ alreadyInstalled: ['gstack'] })
    const force = mkResult({ failed: ['gstack: cmd exited 1'] })
    const probe = async (): Promise<boolean> => {
      throw new Error('probe boom')
    }
    const r = await reclassifyForceUpdateFailures(first, force, probe)
    expect(r.keptExisting).toEqual([])
    expect(r.failed).toEqual(['gstack: cmd exited 1'])
  })
})
