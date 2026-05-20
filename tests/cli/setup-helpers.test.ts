// Phase v3.0-3.3 T3.3.W0.12 — TDD for nested 2-level scan + v2 deprecation warn.
// Covers acceptance criteria #1: ≥10 fixture incl. nested 2-level + flat legacy +
// deprecation warn + disciplines skip + judgments skip (per PLAN.md L373-378).
//
// vi.mock fs/promises to avoid real filesystem I/O.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
}))

import { readdir, stat } from 'node:fs/promises'
import {
  FLAT_LEGACY_DEPRECATED,
  FLAT_LEGACY_KEEP,
  NON_WORKFLOW_DIRS,
  renderDeprecationBlock,
  scanWorkflowsNested,
} from '../../src/cli/lib/scan-nested.js'

const readdirMock = vi.mocked(readdir)
const statMock = vi.mocked(stat)

/** stat mock: returns isDirectory()=true for any path NOT containing SKILL.md;
 *  for SKILL.md paths returns isDirectory()=false ONLY if `flatSkillDirs` substring
 *  matches the segment immediately before SKILL.md (top-level flat path A). */
function makeStat(flatSkillDirs: string[], nestedSkillDirs: string[] = []) {
  return async (p: unknown) => {
    const path = String(p).replace(/\\/g, '/')
    if (path.endsWith('SKILL.md')) {
      // Flat path A — workflows/<entry>/SKILL.md (NOT nested)
      for (const d of flatSkillDirs) {
        if (path.endsWith(`/${d}/SKILL.md`)) return { isDirectory: () => false } as never
      }
      // Path B — workflows/<stage>/<sub>/SKILL.md (nested)
      for (const ns of nestedSkillDirs) {
        if (path.endsWith(`/${ns}/SKILL.md`)) return { isDirectory: () => false } as never
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    }
    return { isDirectory: () => true } as never
  }
}

/** readdir mock: top-level returns supplied `entries`; nested paths return
 *  contents from `nested[<stagename>]` keyed by the trailing dir segment. */
function makeReaddir(topEntries: string[], nested: Record<string, string[]> = {}) {
  return async (p: unknown) => {
    const path = String(p).replace(/\\/g, '/').replace(/\/+$/, '')
    for (const [stage, subs] of Object.entries(nested)) {
      if (path.endsWith(`/${stage}`)) return subs as never
    }
    return topEntries as never
  }
}

describe('cli/lib/scan-nested — Phase v3.0-3.3 T3.3.W0.12 nested 2-level scan', () => {
  beforeEach(() => {
    readdirMock.mockReset()
    statMock.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it('fixture 1 — empty workflows dir → empty result, no deprecation', async () => {
    statMock.mockImplementation(makeStat([]))
    readdirMock.mockImplementation(makeReaddir([]))
    const { workflows, deprecated } = await scanWorkflowsNested('/workflows', [])
    expect(workflows).toEqual([])
    expect(deprecated).toEqual([])
  })

  it('fixture 2 — flat keep dir (research) → installed as flat non-master', async () => {
    statMock.mockImplementation(makeStat(['research']))
    readdirMock.mockImplementation(makeReaddir([]))
    const { workflows, deprecated } = await scanWorkflowsNested('/workflows', ['research'])
    expect(workflows).toEqual([{ name: 'research', relPath: 'research', isMaster: false }])
    expect(deprecated).toEqual([])
  })

  it('fixture 3 — flat keep dir (retro) → installed as flat non-master', async () => {
    statMock.mockImplementation(makeStat(['retro']))
    readdirMock.mockImplementation(makeReaddir([]))
    const { workflows, deprecated } = await scanWorkflowsNested('/workflows', ['retro'])
    expect(workflows).toEqual([{ name: 'retro', relPath: 'retro', isMaster: false }])
    expect(deprecated).toEqual([])
  })

  it('fixture 4 — flat legacy deprecated (plan-feature) → warn + skip install', async () => {
    statMock.mockImplementation(makeStat(['plan-feature']))
    readdirMock.mockImplementation(makeReaddir([]))
    const { workflows, deprecated } = await scanWorkflowsNested('/workflows', ['plan-feature'])
    expect(workflows).toEqual([])
    expect(deprecated).toEqual(['plan-feature'])
  })

  it('fixture 5 — flat legacy deprecated 3 cmd (plan-feature/execute-task/verify-work) all skipped', async () => {
    const v2Names = ['plan-feature', 'execute-task', 'verify-work']
    statMock.mockImplementation(makeStat(v2Names))
    readdirMock.mockImplementation(makeReaddir([]))
    const { workflows, deprecated } = await scanWorkflowsNested('/workflows', v2Names)
    expect(workflows).toEqual([])
    expect(deprecated.sort()).toEqual(['execute-task', 'plan-feature', 'verify-work'])
  })

  it('fixture 6 — nested 2-level: discuss/auto + discuss/strategic flatten correctly', async () => {
    // No flat SKILL.md on discuss/ — only on discuss/auto and discuss/strategic
    statMock.mockImplementation(makeStat([], ['auto', 'strategic']))
    readdirMock.mockImplementation(makeReaddir([], { discuss: ['auto', 'strategic'] }))
    const { workflows, deprecated } = await scanWorkflowsNested('/workflows', ['discuss'])
    // sub === 'auto' → master, name flatten to bare stage
    // sub !== 'auto' → sub-stage, name = '<stage>-<sub>'
    expect(workflows).toEqual([
      { name: 'discuss', relPath: 'discuss/auto', isMaster: true },
      { name: 'discuss-strategic', relPath: 'discuss/strategic', isMaster: false },
    ])
    expect(deprecated).toEqual([])
  })

  it('fixture 7 — disciplines/ skipped (K10 mitigation, non-workflow dir)', async () => {
    statMock.mockImplementation(makeStat([], ['karpathy']))
    readdirMock.mockImplementation(makeReaddir([], { disciplines: ['karpathy'] }))
    const { workflows, deprecated } = await scanWorkflowsNested('/workflows', ['disciplines'])
    // disciplines/ ⊆ NON_WORKFLOW_DIRS → entirely skipped, even if SKILL.md present nested
    expect(workflows).toEqual([])
    expect(deprecated).toEqual([])
  })

  it('fixture 8 — judgments/ skipped (K10 mitigation, non-workflow dir)', async () => {
    statMock.mockImplementation(makeStat([], ['strategic-gate']))
    readdirMock.mockImplementation(makeReaddir([], { judgments: ['strategic-gate'] }))
    const { workflows, deprecated } = await scanWorkflowsNested('/workflows', ['judgments'])
    expect(workflows).toEqual([])
    expect(deprecated).toEqual([])
  })

  it('fixture 9 — mixed: nested master + flat keep + flat deprecated all classified', async () => {
    statMock.mockImplementation(makeStat(['research', 'plan-feature'], ['auto']))
    readdirMock.mockImplementation(makeReaddir([], { task: ['auto'] }))
    const { workflows, deprecated } = await scanWorkflowsNested('/workflows', [
      'plan-feature',
      'research',
      'task',
    ])
    expect(workflows).toEqual([
      { name: 'research', relPath: 'research', isMaster: false },
      { name: 'task', relPath: 'task/auto', isMaster: true },
    ])
    expect(deprecated).toEqual(['plan-feature'])
  })

  it('fixture 10 — nested sub w/o auto: verify/progress + verify/qa flatten as sub-stages', async () => {
    statMock.mockImplementation(makeStat([], ['progress', 'qa']))
    readdirMock.mockImplementation(makeReaddir([], { verify: ['progress', 'qa'] }))
    const { workflows, deprecated } = await scanWorkflowsNested('/workflows', ['verify'])
    expect(workflows).toEqual([
      { name: 'verify-progress', relPath: 'verify/progress', isMaster: false },
      { name: 'verify-qa', relPath: 'verify/qa', isMaster: false },
    ])
    expect(deprecated).toEqual([])
  })

  it('fixture 11 — nested with empty subdir (no SKILL.md inside) silent-skipped', async () => {
    // discuss/empty has no SKILL.md → skipped; discuss/auto has → installed
    statMock.mockImplementation(makeStat([], ['auto']))
    readdirMock.mockImplementation(makeReaddir([], { discuss: ['auto', 'empty'] }))
    const { workflows, deprecated } = await scanWorkflowsNested('/workflows', ['discuss'])
    expect(workflows).toEqual([{ name: 'discuss', relPath: 'discuss/auto', isMaster: true }])
    expect(deprecated).toEqual([])
  })

  it('fixture 12 — non-directory entry (e.g. capabilities.yaml file) skipped', async () => {
    // capabilities.yaml at top level — not a dir, must be skipped
    statMock.mockImplementation(async (p: unknown) => {
      const path = String(p).replace(/\\/g, '/')
      if (path.endsWith('capabilities.yaml')) return { isDirectory: () => false } as never
      if (path.endsWith('SKILL.md')) {
        if (path.endsWith('research/SKILL.md')) return { isDirectory: () => false } as never
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      }
      return { isDirectory: () => true } as never
    })
    readdirMock.mockImplementation(makeReaddir([]))
    const { workflows, deprecated } = await scanWorkflowsNested('/workflows', [
      'capabilities.yaml',
      'research',
    ])
    expect(workflows).toEqual([{ name: 'research', relPath: 'research', isMaster: false }])
    expect(deprecated).toEqual([])
  })

  it('fixture 13 — sorted output: nested entries returned in stable sub-sort order', async () => {
    statMock.mockImplementation(makeStat([], ['auto', 'strategic', 'tactical']))
    readdirMock.mockImplementation(makeReaddir([], { discuss: ['tactical', 'auto', 'strategic'] }))
    const { workflows } = await scanWorkflowsNested('/workflows', ['discuss'])
    // After sort(): ['auto', 'strategic', 'tactical']
    expect(workflows.map((w) => w.name)).toEqual([
      'discuss',
      'discuss-strategic',
      'discuss-tactical',
    ])
  })

  it('fixture 14 — exported constants match D-04 alias map verbatim', () => {
    // Sanity check sets are exposed for cross-validate scripts (sister contract)
    expect(FLAT_LEGACY_DEPRECATED.has('plan-feature')).toBe(true)
    expect(FLAT_LEGACY_DEPRECATED.has('execute-task')).toBe(true)
    expect(FLAT_LEGACY_DEPRECATED.has('verify-work')).toBe(true)
    expect(FLAT_LEGACY_KEEP.has('research')).toBe(true)
    expect(FLAT_LEGACY_KEEP.has('retro')).toBe(true)
    expect(NON_WORKFLOW_DIRS.has('disciplines')).toBe(true)
    expect(NON_WORKFLOW_DIRS.has('judgments')).toBe(true)
  })
})

describe('cli/lib/scan-nested — renderDeprecationBlock', () => {
  it('fixture 15 — empty deprecated list → empty string', () => {
    expect(renderDeprecationBlock([])).toBe('')
  })

  it('fixture 16 — deprecation block contains v3 alias map + CHANGELOG ref', () => {
    const out = renderDeprecationBlock(['plan-feature', 'execute-task'])
    expect(out).toContain('v3.0 BREAKING')
    expect(out).toContain('/plan-feature')
    expect(out).toContain('/execute-task')
    expect(out).toContain('/verify-work')
    expect(out).toContain('/research, /retro 不变')
    expect(out).toContain('CHANGELOG [3.0.0]')
    expect(out).toContain('skipped install: execute-task, plan-feature')
  })
})
