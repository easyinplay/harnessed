// Phase v3.0-3.5 W0 T3.5.W0.1 — masterOrchestrator.test.ts (≥15 fixture per acceptance #1).
// Sister Phase 3.2 W2 T2.6 run.test.ts vi.mock pattern + T2.4.W1.4 gate consume fixture.
//
// Coverage matrix:4 master × {all fire, partial fire, all skip, gate error} = 16 fixture
// + transparency block + arbitration warn + serial order + Path B fallback + invalid yaml
// = 21 fixture total。
//
// Mocks: judgmentResolver.resolveJudgmentGate(gate eval)+ spawnDriver(default driver
// → runWorkflow inflight 跳过 — DI 注入 spawnDriver mock 避开真 spawn 调用栈)+
// arbitrateBeforeSpawn(priority hierarchy mock — disciplineLoader fs 跳过)。
// fs.readFile + parseYaml 真接读 mock yaml 字符串(通过 vi.mock fs/promises path-keyed map)。

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// vi.mock hoisting — declare BEFORE importing src under test
const resolveJudgmentGateMock = vi.fn<() => Promise<boolean>>()
const arbitrateBeforeSpawnMock = vi.fn(async (fired: { name: string; tier: string }[]) => fired)
const yamlFileMap = new Map<string, string>()
const readFileMock = vi.fn(async (p: string) => {
  const content = yamlFileMap.get(p as string)
  if (content === undefined) throw new Error(`ENOENT no mock for ${p}`)
  return content
})

vi.mock('../../src/workflow/judgmentResolver.js', () => ({
  resolveJudgmentGate: (
    _ref: string,
    _ctx: Record<string, unknown>,
    _root: string,
  ): Promise<boolean> => resolveJudgmentGateMock(),
}))
vi.mock('../../src/discipline/enforcement/before-spawn.js', () => ({
  arbitrateBeforeSpawn: (fired: { name: string; tier: string }[], _root: string) =>
    arbitrateBeforeSpawnMock(fired),
}))
vi.mock('node:fs/promises', async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
  return { ...actual, readFile: (p: string) => readFileMock(p) }
})

import {
  type MasterName,
  runMasterOrchestrator,
  type SpawnDriver,
} from '../../src/workflow/masterOrchestrator.js'

const PACKAGE_ROOT = '/fake-root'

function masterYaml(masterName: MasterName, delegatesYaml: string): string {
  return `schema_version: harnessed.workflow.v3
workflow: ${masterName}
delegates_to:
${delegatesYaml}
`
}

function clauseLine(
  sub: string,
  opts: { gate?: string; mode?: string; order?: number } = {},
): string {
  const parts = [`  - sub: ${sub}`]
  if (opts.gate) parts.push(`    gate: ${opts.gate}`)
  if (opts.mode) parts.push(`    mode: ${opts.mode}`)
  if (opts.order !== undefined) parts.push(`    order: ${opts.order}`)
  return parts.join('\n')
}

function pathFor(masterName: MasterName): string {
  // Cross-platform path resolve — Node path.resolve uses platform separator;
  // mock map key 用 platform separator 正常 resolve 结果。
  // Test runs on Win + posix CI;use process.platform-detect。
  return require('node:path').resolve(
    PACKAGE_ROOT,
    'workflows',
    masterName,
    'auto',
    'workflow.yaml',
  )
}

let consoleLogSpy: ReturnType<typeof vi.spyOn>
let consoleWarnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  resolveJudgmentGateMock.mockReset()
  arbitrateBeforeSpawnMock.mockClear()
  readFileMock.mockClear()
  yamlFileMap.clear()
  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  consoleLogSpy.mockRestore()
  consoleWarnSpy.mockRestore()
  vi.clearAllMocks()
})

describe('runMasterOrchestrator — 4 master × 4 gate scenario + 5 extra', () => {
  const masters: MasterName[] = ['discuss', 'plan', 'task', 'verify']

  for (const master of masters) {
    it(`${master} — all fire (3 sub all gate=true)`, async () => {
      yamlFileMap.set(
        pathFor(master),
        masterYaml(
          master,
          [
            clauseLine('sub-a', { gate: 'judgments.x.a.fires' }),
            clauseLine('sub-b', { gate: 'judgments.x.b.fires' }),
            clauseLine('sub-c', { gate: 'judgments.x.c.fires' }),
          ].join('\n'),
        ),
      )
      resolveJudgmentGateMock.mockResolvedValue(true)
      const spawn: SpawnDriver = vi.fn(async () => {})
      const r = await runMasterOrchestrator(master, {}, PACKAGE_ROOT, spawn)
      expect(r.master).toBe(master)
      expect(r.fired.sort()).toEqual(['sub-a', 'sub-b', 'sub-c'])
      expect(r.skipped).toEqual([])
      expect(spawn).toHaveBeenCalledTimes(3)
    })

    it(`${master} — partial fire (sub-a=true, sub-b=false, sub-c=true)`, async () => {
      yamlFileMap.set(
        pathFor(master),
        masterYaml(
          master,
          [
            clauseLine('sub-a', { gate: 'judgments.x.a.fires' }),
            clauseLine('sub-b', { gate: 'judgments.x.b.fires' }),
            clauseLine('sub-c', { gate: 'judgments.x.c.fires' }),
          ].join('\n'),
        ),
      )
      resolveJudgmentGateMock
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
      const spawn: SpawnDriver = vi.fn(async () => {})
      const r = await runMasterOrchestrator(master, {}, PACKAGE_ROOT, spawn)
      expect(r.fired.sort()).toEqual(['sub-a', 'sub-c'])
      expect(r.skipped).toEqual(['sub-b'])
      expect(spawn).toHaveBeenCalledTimes(2)
    })

    it(`${master} — all skip (all gates false)`, async () => {
      yamlFileMap.set(
        pathFor(master),
        masterYaml(
          master,
          [
            clauseLine('sub-a', { gate: 'judgments.x.a.fires' }),
            clauseLine('sub-b', { gate: 'judgments.x.b.fires' }),
          ].join('\n'),
        ),
      )
      resolveJudgmentGateMock.mockResolvedValue(false)
      const spawn: SpawnDriver = vi.fn(async () => {})
      const r = await runMasterOrchestrator(master, {}, PACKAGE_ROOT, spawn)
      expect(r.fired).toEqual([])
      expect(r.skipped.sort()).toEqual(['sub-a', 'sub-b'])
      expect(spawn).not.toHaveBeenCalled()
    })

    it(`${master} — gate error treated as skip (fail-soft per ADR 0029)`, async () => {
      yamlFileMap.set(
        pathFor(master),
        masterYaml(
          master,
          [
            clauseLine('sub-a', { gate: 'judgments.broken.x.fires' }),
            clauseLine('sub-b', { gate: 'judgments.x.b.fires' }),
          ].join('\n'),
        ),
      )
      resolveJudgmentGateMock
        .mockRejectedValueOnce(new Error('TriggerNotFoundError'))
        .mockResolvedValueOnce(true)
      const spawn: SpawnDriver = vi.fn(async () => {})
      const r = await runMasterOrchestrator(master, {}, PACKAGE_ROOT, spawn)
      expect(r.fired).toEqual(['sub-b'])
      expect(r.skipped).toEqual(['sub-a'])
    })
  }
})

describe('runMasterOrchestrator — extra fixtures (transparency / arbitration / serial / errors)', () => {
  it('17. Transparency block — emits Evaluating / Firing / Complete output', async () => {
    yamlFileMap.set(
      pathFor('discuss'),
      masterYaml(
        'discuss',
        [
          clauseLine('strategic', { gate: 'judgments.strategic-gate.office-hours.fires' }),
          clauseLine('phase', { gate: 'judgments.phase-gate.gsd-discuss-phase.fires' }),
          clauseLine('subtask', { gate: 'judgments.subtask-gate.brainstorming.fires' }),
        ].join('\n'),
      ),
    )
    resolveJudgmentGateMock
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
    await runMasterOrchestrator('discuss', {}, PACKAGE_ROOT, async () => {})
    const allLogs = consoleLogSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(allLogs).toMatch(/Evaluating 3 sub-workflow gates/)
    expect(allLogs).toMatch(/Firing 2 sub/)
    expect(allLogs).toMatch(/Complete: 2 fired, 1 skipped/)
  })

  it('18. Arbitration warn — multi-capability fires emits K14 warn (NOT halt)', async () => {
    yamlFileMap.set(
      pathFor('plan'),
      masterYaml(
        'plan',
        [
          clauseLine('strategic', { gate: 'judgments.x.a.fires' }),
          clauseLine('phase', { gate: 'judgments.x.b.fires' }),
        ].join('\n'),
      ),
    )
    resolveJudgmentGateMock.mockResolvedValue(true)
    const r = await runMasterOrchestrator('plan', {}, PACKAGE_ROOT, async () => {})
    expect(arbitrateBeforeSpawnMock).toHaveBeenCalledTimes(1)
    const warnMsgs = consoleWarnSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(warnMsgs).toMatch(/multi-capability fires \(2 sub\), arbitrating by priority/)
    expect(r.fired.length).toBe(2) // NOT halt
  })

  it('19. Serial mode — spawn order respects `order` field', async () => {
    yamlFileMap.set(
      pathFor('verify'),
      masterYaml(
        'verify',
        [
          clauseLine('sub-b', { mode: 'serial', order: 2 }),
          clauseLine('sub-a', { mode: 'serial', order: 1 }),
          clauseLine('sub-c', { mode: 'serial', order: 3 }),
        ].join('\n'),
      ),
    )
    const spawnSeq: string[] = []
    const spawn: SpawnDriver = async (_m, sub) => {
      spawnSeq.push(sub)
    }
    const r = await runMasterOrchestrator('verify', {}, PACKAGE_ROOT, spawn)
    expect(spawnSeq).toEqual(['sub-a', 'sub-b', 'sub-c'])
    expect(r.fired).toEqual(['sub-a', 'sub-b', 'sub-c'])
  })

  it('20. Unconditional clause (no gate field) — fires without resolveJudgmentGate call', async () => {
    yamlFileMap.set(pathFor('task'), masterYaml('task', clauseLine('sub-uncond')))
    const spawn: SpawnDriver = vi.fn(async () => {})
    const r = await runMasterOrchestrator('task', {}, PACKAGE_ROOT, spawn)
    expect(r.fired).toEqual(['sub-uncond'])
    expect(resolveJudgmentGateMock).not.toHaveBeenCalled()
    expect(spawn).toHaveBeenCalledTimes(1)
  })

  it('21. Invalid yaml — missing delegates_to throws', async () => {
    yamlFileMap.set(
      pathFor('discuss'),
      `schema_version: harnessed.workflow.v3
workflow: discuss
`,
    )
    await expect(
      runMasterOrchestrator('discuss', {}, PACKAGE_ROOT, async () => {}),
    ).rejects.toThrow(/missing delegates_to|Invalid master/)
  })

  it('22. Invalid yaml — schema_version wrong throws', async () => {
    yamlFileMap.set(
      pathFor('plan'),
      `schema_version: harnessed.workflow.v2
workflow: plan
delegates_to:
  - sub: x
`,
    )
    await expect(runMasterOrchestrator('plan', {}, PACKAGE_ROOT, async () => {})).rejects.toThrow(
      /Invalid master workflow.yaml/,
    )
  })

  it('23. T3.5.W0.3 — single sub fire → arbitrate NOT called (K14 skip path)', async () => {
    yamlFileMap.set(
      pathFor('discuss'),
      masterYaml(
        'discuss',
        [
          clauseLine('sub-a', { gate: 'judgments.x.a.fires' }),
          clauseLine('sub-b', { gate: 'judgments.x.b.fires' }),
        ].join('\n'),
      ),
    )
    resolveJudgmentGateMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    const r = await runMasterOrchestrator('discuss', {}, PACKAGE_ROOT, async () => {})
    expect(r.fired).toEqual(['sub-a'])
    expect(arbitrateBeforeSpawnMock).not.toHaveBeenCalled()
  })

  it('24. T3.5.W0.3 — arbitrate throw → console.warn + 继续 default order (K14 fail-soft)', async () => {
    yamlFileMap.set(
      pathFor('task'),
      masterYaml(
        'task',
        [clauseLine('sub-a'), clauseLine('sub-b'), clauseLine('sub-c')].join('\n'),
      ),
    )
    arbitrateBeforeSpawnMock.mockRejectedValueOnce(new Error('priority.yaml ENOENT'))
    const spawnSeq: string[] = []
    const r = await runMasterOrchestrator('task', {}, PACKAGE_ROOT, async (_m, sub) => {
      spawnSeq.push(sub)
    })
    const warnMsgs = consoleWarnSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(warnMsgs).toMatch(/arbitrate failed.*proceeding default order/)
    expect(r.fired.length).toBe(3) // NOT halt — all 3 still spawned
    expect(spawnSeq).toHaveLength(3)
  })

  it('25. T3.5.W0.3 — multi-sub warn emit contains K14 "warn-not-halt" + tier placeholder note', async () => {
    yamlFileMap.set(
      pathFor('verify'),
      masterYaml('verify', [clauseLine('sub-a'), clauseLine('sub-b')].join('\n')),
    )
    const r = await runMasterOrchestrator('verify', {}, PACKAGE_ROOT, async () => {})
    expect(arbitrateBeforeSpawnMock).toHaveBeenCalledTimes(1)
    const warnMsgs = consoleWarnSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(warnMsgs).toMatch(/multi-capability fires \(2 sub\)/)
    expect(warnMsgs).toMatch(/K14 warn-not-halt/)
    expect(r.fired.length).toBe(2)
  })
})

// ── v3.1.0 NEW /auto super-master fixtures ──────────────────────────────────
// 6 fixture per CHANGELOG [3.1.0] regression coverage: top-level path resolve +
// 4-stage serial spawn + correct order + pause flag + fail-fast + K8 ctx single snapshot。

/** Path resolver for super-master `/auto` top-level standalone yaml. */
function pathForAuto(): string {
  return require('node:path').resolve(PACKAGE_ROOT, 'workflows', 'auto', 'workflow.yaml')
}

/** Build /auto super-master yaml — 4 stage serial delegates_to discuss/plan/task/verify。 */
function autoSuperMasterYaml(): string {
  return masterYaml(
    'auto',
    [
      clauseLine('discuss', { mode: 'serial', order: 1 }),
      clauseLine('plan', { mode: 'serial', order: 2 }),
      clauseLine('task', { mode: 'serial', order: 3 }),
      clauseLine('verify', { mode: 'serial', order: 4 }),
    ].join('\n'),
  )
}

describe('runMasterOrchestrator — v3.1.0 NEW /auto super-master (6 fixtures)', () => {
  it('26. /auto invoke → 4 stage-master serial spawn in correct order (discuss → plan → task → verify)', async () => {
    yamlFileMap.set(pathForAuto(), autoSuperMasterYaml())
    const spawnSeq: string[] = []
    const spawn: SpawnDriver = async (masterName, sub) => {
      expect(masterName).toBe('auto') // K1 — super-master passes own name to driver
      spawnSeq.push(sub)
    }
    const r = await runMasterOrchestrator('auto', {}, PACKAGE_ROOT, spawn)
    expect(r.master).toBe('auto')
    expect(r.fired).toEqual(['discuss', 'plan', 'task', 'verify'])
    expect(r.skipped).toEqual([])
    expect(spawnSeq).toEqual(['discuss', 'plan', 'task', 'verify'])
  })

  it('27. /auto --pause-between-stages → pauseFn called 4 times (one per stage)', async () => {
    yamlFileMap.set(pathForAuto(), autoSuperMasterYaml())
    const pausedStages: string[] = []
    const pauseFn = vi.fn(async (stage: string) => {
      pausedStages.push(stage)
    })
    const r = await runMasterOrchestrator('auto', {}, PACKAGE_ROOT, async () => {}, {
      pauseBetweenStages: true,
      pauseFn,
    })
    expect(r.fired).toEqual(['discuss', 'plan', 'task', 'verify'])
    expect(pauseFn).toHaveBeenCalledTimes(4)
    expect(pausedStages).toEqual(['discuss', 'plan', 'task', 'verify'])
  })

  it('28. /auto fail-fast — stage 2 throw halts spawn of stage 3/4', async () => {
    yamlFileMap.set(pathForAuto(), autoSuperMasterYaml())
    const spawnSeq: string[] = []
    const spawn: SpawnDriver = async (_master, sub) => {
      spawnSeq.push(sub)
      if (sub === 'plan') throw new Error('plan stage failed')
    }
    await expect(runMasterOrchestrator('auto', {}, PACKAGE_ROOT, spawn)).rejects.toThrow(
      /plan stage failed/,
    )
    // stage 1 + 2 spawned (stage 2 throws before fired.push); stage 3 / 4 never spawn
    expect(spawnSeq).toEqual(['discuss', 'plan'])
    expect(spawnSeq).not.toContain('task')
    expect(spawnSeq).not.toContain('verify')
  })

  it('29. K8 ctx single snapshot — same context object passed to all 4 stage spawn', async () => {
    yamlFileMap.set(pathForAuto(), autoSuperMasterYaml())
    const ctxSnapshot = { phase: 'auto-test', topLevel: true }
    const seenCtxs: unknown[] = []
    const spawn: SpawnDriver = async (_master, _sub, ctx) => {
      seenCtxs.push(ctx)
    }
    await runMasterOrchestrator('auto', ctxSnapshot, PACKAGE_ROOT, spawn)
    expect(seenCtxs).toHaveLength(4)
    // K8 invariant — same reference (NOT re-snapshot per stage)
    for (const c of seenCtxs) expect(c).toBe(ctxSnapshot)
  })

  it('30. /auto without --pause-between-stages → pauseFn NOT called (default fail-fast continuous)', async () => {
    yamlFileMap.set(pathForAuto(), autoSuperMasterYaml())
    const pauseFn = vi.fn(async () => {})
    const r = await runMasterOrchestrator('auto', {}, PACKAGE_ROOT, async () => {}, { pauseFn })
    expect(r.fired).toEqual(['discuss', 'plan', 'task', 'verify'])
    expect(pauseFn).not.toHaveBeenCalled() // pauseBetweenStages=false default → noop
  })

  it('31. /auto yaml loads from top-level workflows/auto/workflow.yaml (NOT workflows/auto/auto/)', async () => {
    // K-design — super-master走 sister research/retro top-level standalone layout,
    // NOT nested workflows/<master>/auto/workflow.yaml stage-master layout
    yamlFileMap.set(pathForAuto(), autoSuperMasterYaml())
    const spawn: SpawnDriver = vi.fn(async () => {})
    const r = await runMasterOrchestrator('auto', {}, PACKAGE_ROOT, spawn)
    expect(r.fired).toHaveLength(4)
    // Verify yaml was read from top-level path (NOT nested auto/auto path)
    const readPaths = readFileMock.mock.calls.map((c) => String(c[0]))
    expect(readPaths).toContain(pathForAuto())
    expect(readPaths).not.toContain(
      require('node:path').resolve(PACKAGE_ROOT, 'workflows', 'auto', 'auto', 'workflow.yaml'),
    )
  })
})
