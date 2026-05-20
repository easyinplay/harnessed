// Phase v3.0-3.3 W0 T3.3.W0.9 — before-spawn.ts hook fixture (5).
// Verifies priority_hierarchy arbitration order from disciplines/priority.yaml.

import { beforeEach, describe, expect, it } from 'vitest'
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
})
