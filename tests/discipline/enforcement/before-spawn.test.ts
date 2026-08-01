// Phase v3.0-3.3 W0 T3.3.W0.9 — before-spawn.ts hook fixture (5).
// Verifies priority_hierarchy arbitration order from disciplines/priority.yaml.
//
// 4.32.22 no-op-arbitration fix — 5 NEW fixture verify capability→tier resolution
// from workflows/capabilities.yaml `impl` (callers pass capability NAME, not a
// pre-baked tier). Pre-fix `tier` was the tool name itself → indexOf === -1 for
// every entry → MAX_SAFE_INTEGER rank → sort degenerated to identity.

import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  arbitrateBeforeSpawn,
  type FiredCapability,
} from '../../../src/discipline/enforcement/before-spawn.js'
import { _clearDisciplineCache } from '../../../src/workflow/disciplineLoader.js'

const PACKAGE_ROOT = process.cwd()

beforeEach(() => {
  _clearDisciplineCache()
})

describe('discipline/enforcement/before-spawn', () => {
  it('1. single capability — passthrough (no sort needed)', async () => {
    const fired: FiredCapability[] = [{ name: 'office-hours', tier: 'gstack' }]
    const out = await arbitrateBeforeSpawn(fired, PACKAGE_ROOT)
    expect(out).toEqual(fired)
  })

  it('2. empty fired list — passthrough', async () => {
    const out = await arbitrateBeforeSpawn([], PACKAGE_ROOT)
    expect(out).toEqual([])
  })

  it('3. gstack + gsd → gstack first (priority_hierarchy idx 0 < 1)', async () => {
    const fired: FiredCapability[] = [
      { name: 'gsd-discuss-phase', tier: 'gsd' },
      { name: 'office-hours', tier: 'gstack' },
    ]
    const out = await arbitrateBeforeSpawn(fired, PACKAGE_ROOT)
    expect(out[0]?.tier).toBe('gstack')
    expect(out[1]?.tier).toBe('gsd')
  })

  it('4. unknown tier sorts to end (MAX_SAFE_INTEGER rank — conservative degrade)', async () => {
    const fired: FiredCapability[] = [
      { name: 'unknown-cap', tier: 'unknown-tier' },
      { name: 'office-hours', tier: 'gstack' },
    ]
    const out = await arbitrateBeforeSpawn(fired, PACKAGE_ROOT)
    expect(out[0]?.tier).toBe('gstack')
    expect(out[1]?.tier).toBe('unknown-tier')
  })

  it('5. full 7-tier sort verifies priority_hierarchy order', async () => {
    const fired: FiredCapability[] = [
      { name: 'p', tier: 'parallel' },
      { name: 'm', tier: 'mattpocock' },
      { name: 'k', tier: 'karpathy' },
      { name: 'pwf', tier: 'planning-with-files' },
      { name: 's', tier: 'superpowers' },
      { name: 'g', tier: 'gsd' },
      { name: 'gs', tier: 'gstack' },
    ]
    const out = await arbitrateBeforeSpawn(fired, PACKAGE_ROOT)
    expect(out.map((c) => c.tier)).toEqual([
      'gstack',
      'gsd',
      'superpowers',
      'planning-with-files',
      'karpathy',
      'mattpocock',
      'parallel',
    ])
  })

  // ── 4.32.22 — capability→tier resolution (the no-op bug) ────────────────────

  it('6. mixed-impl capability NAMES resolve to tiers via capabilities.yaml impl', async () => {
    // Real capabilities.yaml entries, one per priority_hierarchy tier + 1 unmapped
    // impl (ecc). Callers now pass `name` only — before-spawn resolves the tier.
    const fired: FiredCapability[] = [
      { name: 'agent-teams-create' }, // impl claude-platform  → parallel   (idx 6)
      { name: 'ecc-api-design' }, // impl ecc            → unmapped   (last)
      { name: 'diagnose' }, // impl mattpocock-skills → mattpocock (idx 5)
      { name: 'gsd-plan-phase' }, // impl gsd            → gsd        (idx 1)
      { name: 'karpathy-guidelines' }, // name rule           → karpathy   (idx 4)
      { name: 'gstack-review' }, // impl gstack         → gstack     (idx 0)
      { name: 'planning-with-files' }, // name rule           → pwf        (idx 3)
      { name: 'tdd' }, // impl superpowers    → superpowers(idx 2)
    ]
    const out = await arbitrateBeforeSpawn(fired, PACKAGE_ROOT)
    expect(out.map((c) => c.name)).toEqual([
      'gstack-review',
      'gsd-plan-phase',
      'tdd',
      'planning-with-files',
      'karpathy-guidelines',
      'diagnose',
      'agent-teams-create',
      'ecc-api-design',
    ])
  })

  it('7. unresolvable capabilities keep input order (stable sort, all rank LOWEST)', async () => {
    // ecc / plugin / caveman impls have no priority_hierarchy tier. They must NOT
    // shuffle among themselves — only sink below the ranked entry.
    const fired: FiredCapability[] = [
      { name: 'ecc-api-design' },
      { name: 'completion-gate' }, // impl harnessed-bundled — orthogonal wrapper, deliberately untiered
      { name: 'caveman' },
      { name: 'gstack-review' },
      { name: 'not-a-capability-at-all' },
    ]
    const out = await arbitrateBeforeSpawn(fired, PACKAGE_ROOT)
    expect(out.map((c) => c.name)).toEqual([
      'gstack-review',
      'ecc-api-design',
      'completion-gate',
      'caveman',
      'not-a-capability-at-all',
    ])
  })

  it('8. explicit `tier` wins over name resolution (backwards-compat override)', async () => {
    const fired: FiredCapability[] = [
      { name: 'gstack-review', tier: 'parallel' }, // override → lowest ranked tier
      { name: 'ecc-api-design', tier: 'gstack' }, // override → highest
    ]
    const out = await arbitrateBeforeSpawn(fired, PACKAGE_ROOT)
    expect(out.map((c) => c.name)).toEqual(['ecc-api-design', 'gstack-review'])
  })

  it('9. resolved tier is surfaced on the returned entries', async () => {
    const fired: FiredCapability[] = [{ name: 'diagnose' }, { name: 'gstack-review' }]
    const out = await arbitrateBeforeSpawn(fired, PACKAGE_ROOT)
    expect(out.map((c) => c.tier)).toEqual(['gstack', 'mattpocock'])
  })

  it('10. capabilities.yaml missing — fail-soft warn + input order preserved (ADR 0029)', async () => {
    const root = mkdtempSync(join(tmpdir(), 'harnessed-before-spawn-'))
    try {
      mkdirSync(join(root, 'workflows', 'disciplines'), { recursive: true })
      copyFileSync(
        join(PACKAGE_ROOT, 'workflows', 'disciplines', 'priority.yaml'),
        join(root, 'workflows', 'disciplines', 'priority.yaml'),
      )
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const fired: FiredCapability[] = [{ name: 'diagnose' }, { name: 'gstack-review' }]
      const out = await arbitrateBeforeSpawn(fired, root)
      expect(out.map((c) => c.name)).toEqual(['diagnose', 'gstack-review'])
      expect(warnSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')).toMatch(
        /capabilities\.yaml/,
      )
      warnSpy.mockRestore()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
