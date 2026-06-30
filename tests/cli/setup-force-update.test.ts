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

import { describe, expect, it } from 'vitest'
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
  it('failed ∩ alreadyInstalled & probe→present → moved to keptExisting (out of failed)', async () => {
    const first = mkResult({ alreadyInstalled: ['gstack', 'gsd'] })
    const force = mkResult({ failed: ['gstack: git-clone-with-setup cmd exited 1'] })
    const r = await reclassifyForceUpdateFailures(first, force, probeFrom(['gstack']))
    expect(r.keptExisting).toEqual(['gstack'])
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
    expect(r.keptExisting.sort()).toEqual(['gstack', 'ui-ux-pro-max'])
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
