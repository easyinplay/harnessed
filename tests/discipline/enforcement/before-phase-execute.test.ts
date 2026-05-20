// Phase v3.0-3.3 W0 T3.3.W0.9 — before-phase-execute.ts hook fixture (5).
// Verifies DEFAULT_APPLIED fallback + explicit subset selection + cache reuse.

import { beforeEach, describe, expect, it } from 'vitest'
import { loadDisciplinesForPhase } from '../../../src/discipline/enforcement/before-phase-execute.js'
import { _clearDisciplineCache } from '../../../src/workflow/disciplineLoader.js'

const PACKAGE_ROOT = process.cwd()

beforeEach(() => {
  _clearDisciplineCache()
})

describe('discipline/enforcement/before-phase-execute', () => {
  it('1. loadDisciplinesForPhase(undefined) loads all 6 DEFAULT_APPLIED', async () => {
    const m = await loadDisciplinesForPhase(undefined, PACKAGE_ROOT)
    expect(m.size).toBe(6)
    expect(m.has('karpathy')).toBe(true)
    expect(m.has('protocols')).toBe(true)
  })

  it('2. loadDisciplinesForPhase([]) defaults to all 6 (empty array)', async () => {
    const m = await loadDisciplinesForPhase([], PACKAGE_ROOT)
    expect(m.size).toBe(6)
  })

  it('3. loadDisciplinesForPhase(["karpathy"]) loads only requested', async () => {
    const m = await loadDisciplinesForPhase(['karpathy'], PACKAGE_ROOT)
    expect(m.size).toBe(1)
    expect(m.has('karpathy')).toBe(true)
  })

  it('4. loadDisciplinesForPhase returns DisciplineT with rules populated', async () => {
    const m = await loadDisciplinesForPhase(['operational'], PACKAGE_ROOT)
    const op = m.get('operational')
    expect(op?.discipline).toBe('operational')
    expect(op?.rules.length).toBe(6)
  })

  it('5. unknown basename throws — fail-loud not silent skip', async () => {
    await expect(
      loadDisciplinesForPhase(['nonexistent-discipline'], PACKAGE_ROOT),
    ).rejects.toThrow()
  })
})
