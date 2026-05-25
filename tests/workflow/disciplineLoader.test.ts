// Phase v3.0-3.3 W0 T3.3.W0.9 — disciplineLoader.ts ≥10 fixture test.
// Sister tests/workflow/judgmentResolver.test.ts pattern verbatim:
//   - Consume real shipped workflows/disciplines/*.yaml (W0.4 ship)
//   - PACKAGE_ROOT = process.cwd() since vitest runs from repo root
//   - 6 load each + cache hit + invalid yaml + missing file + default applied
//
// Acceptance PLAN.md L319-323:
//   1. ≥10 fixture (load each of 6 + cache hit + invalid yaml + missing file)
//   5. loadAllApplied(undefined) defaults to all 6 (DEFAULT_APPLIED constant)

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  _clearDisciplineCache,
  DEFAULT_APPLIED,
  getRule,
  loadAllApplied,
  loadDiscipline,
} from '../../src/workflow/disciplineLoader.js'

const PACKAGE_ROOT = process.cwd()

beforeEach(() => {
  _clearDisciplineCache()
})

describe('disciplineLoader — load each of 6 LOCKED disciplines', () => {
  it('1. loadDiscipline karpathy → enforcement_layer=code-writing, 5 rules', async () => {
    const d = await loadDiscipline('karpathy', PACKAGE_ROOT)
    expect(d.discipline).toBe('karpathy')
    expect(d.enforcement_layer).toBe('code-writing')
    expect(d.auto_enforce).toBe(true)
    expect(d.rules.length).toBe(5)
  })

  it('2. loadDiscipline output-style → enforcement_layer=output, 7 rules', async () => {
    const d = await loadDiscipline('output-style', PACKAGE_ROOT)
    expect(d.discipline).toBe('output-style')
    expect(d.enforcement_layer).toBe('output')
    expect(d.rules.length).toBe(7)
  })

  it('3. loadDiscipline language → enforcement_layer=output, 4 rules (v3.4.0 NEW cross-cultural-humor)', async () => {
    const d = await loadDiscipline('language', PACKAGE_ROOT)
    expect(d.discipline).toBe('language')
    expect(d.enforcement_layer).toBe('output')
    expect(d.rules.length).toBe(4)
  })

  it('4. loadDiscipline operational → enforcement_layer=commit, 7 rules', async () => {
    // v3.6.0 Phase 3 Wave 3 — added `transparent-skip-on-low-confidence`
    // rule (P0b 下半, check_method: prompt-inject); count 6 → 7.
    const d = await loadDiscipline('operational', PACKAGE_ROOT)
    expect(d.discipline).toBe('operational')
    expect(d.enforcement_layer).toBe('commit')
    expect(d.rules.length).toBe(7)
  })

  it('5. loadDiscipline priority → enforcement_layer=workflow, priority_hierarchy 7-tier', async () => {
    const d = await loadDiscipline('priority', PACKAGE_ROOT)
    expect(d.discipline).toBe('priority')
    expect(d.enforcement_layer).toBe('workflow')
    expect(d.priority_hierarchy).toBeDefined()
    expect(d.priority_hierarchy?.length).toBe(7)
    expect(d.priority_hierarchy?.[0]).toBe('gstack')
  })

  it('6. loadDiscipline protocols → auto_enforce=false, 3 protocols Record', async () => {
    const d = await loadDiscipline('protocols', PACKAGE_ROOT)
    expect(d.discipline).toBe('protocols')
    expect(d.auto_enforce).toBe(false)
    expect(d.protocols).toBeDefined()
    expect(Object.keys(d.protocols ?? {}).length).toBe(3)
  })
})

describe('disciplineLoader — cache + error paths', () => {
  it('7. cache hit — second loadDiscipline call returns same reference', async () => {
    const a = await loadDiscipline('karpathy', PACKAGE_ROOT)
    const b = await loadDiscipline('karpathy', PACKAGE_ROOT)
    expect(a).toBe(b)
  })

  it('8. missing file — throws ENOENT with descriptive context', async () => {
    await expect(loadDiscipline('nonexistent', PACKAGE_ROOT)).rejects.toThrow()
  })

  it('9. invalid yaml — TypeBox Value.Check rejects malformed shape', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'discipline-invalid-'))
    try {
      mkdirSync(join(tmp, 'workflows', 'disciplines'), { recursive: true })
      writeFileSync(
        join(tmp, 'workflows', 'disciplines', 'bogus.yaml'),
        'schema_version: wrong-surface\ndiscipline: bogus\nrules: []\n',
        'utf8',
      )
      await expect(loadDiscipline('bogus', tmp)).rejects.toThrow(/Invalid discipline/)
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('10. _clearDisciplineCache resets — next load triggers re-read', async () => {
    await loadDiscipline('karpathy', PACKAGE_ROOT)
    _clearDisciplineCache()
    // getRule before re-load returns undefined (no cache)
    expect(getRule('karpathy', 'simplicity-first')).toBeUndefined()
    await loadDiscipline('karpathy', PACKAGE_ROOT)
    // After load, getRule resolves
    expect(getRule('karpathy', 'simplicity-first')?.id).toBe('simplicity-first')
  })
})

describe('disciplineLoader — loadAllApplied default + explicit', () => {
  it('11. loadAllApplied(undefined) defaults to all 6 DEFAULT_APPLIED', async () => {
    const m = await loadAllApplied(undefined, PACKAGE_ROOT)
    expect(m.size).toBe(6)
    for (const basename of DEFAULT_APPLIED) {
      expect(m.has(basename)).toBe(true)
    }
  })

  it('12. loadAllApplied([]) defaults to all 6 (empty array == undefined)', async () => {
    const m = await loadAllApplied([], PACKAGE_ROOT)
    expect(m.size).toBe(6)
  })

  it('13. loadAllApplied(["karpathy", "operational"]) loads only requested subset', async () => {
    const m = await loadAllApplied(['karpathy', 'operational'], PACKAGE_ROOT)
    expect(m.size).toBe(2)
    expect(m.has('karpathy')).toBe(true)
    expect(m.has('operational')).toBe(true)
    expect(m.has('language')).toBe(false)
  })

  it('14. DEFAULT_APPLIED constant exposes all 6 in expected order', () => {
    expect(DEFAULT_APPLIED).toEqual([
      'karpathy',
      'output-style',
      'language',
      'operational',
      'priority',
      'protocols',
    ])
  })
})

describe('disciplineLoader — getRule sync lookup', () => {
  it('15. getRule pre-load returns undefined', () => {
    expect(getRule('karpathy', 'think-before-coding')).toBeUndefined()
  })

  it('16. getRule post-load resolves rule by id', async () => {
    await loadDiscipline('karpathy', PACKAGE_ROOT)
    const r = getRule('karpathy', 'file-length-200-hard-limit')
    expect(r?.id).toBe('file-length-200-hard-limit')
    expect(r?.enforcement).toBe('halt')
  })

  it('17. getRule unknown id returns undefined', async () => {
    await loadDiscipline('karpathy', PACKAGE_ROOT)
    expect(getRule('karpathy', 'nonexistent-rule')).toBeUndefined()
  })
})
