// Phase 3.2 W2 T2.6 — runWorkflow() unit test (3 fixtures, D-03 WIRED + B-01 fix).
// T2.4.W1.4 — 2 NEW fixture verify v2 真接 `phase.gate` pre-flight consume
// (D-04 + D-11 strategic-gate / phase-gate skip path).
// T3.5.W0.2 — 5 NEW fixture verify master vs sub detect + loadDisciplinesForPhase wedge.
// Sister Phase 3.1 W1 state.test.ts vi.mock pattern.
// Mocks: governance.isVetoed + engineHook.activatePhase/completePhase + state.pause
//       + judgmentResolver.resolveJudgmentGate (T2.4.W1.4 v2 gate consume)
//       + masterOrchestrator.runMasterOrchestrator (T3.5.W0.2 master path)
//       + before-phase-execute.loadDisciplinesForPhase (T3.5.W0.2 disciplines wedge).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// vi.mock hoisting — declare mocks BEFORE importing src under test.
const isVetoedMock = vi.fn<() => Promise<boolean>>()
const activatePhaseMock = vi.fn(async (_phaseId: string) => ({
  checkpointPath: `.harnessed/checkpoints/${_phaseId}.json`,
}))
const completePhaseMock = vi.fn(
  async (_ctx: { phaseId: string; lastTask?: string; status?: string }) => {},
)
const pauseMock = vi.fn(async () => {})
const loadPhasesMock = vi.fn()
const resolveJudgmentGateMock = vi.fn<() => Promise<boolean>>()
const runMasterOrchestratorMock =
  vi.fn<() => Promise<{ master: string; fired: string[]; skipped: string[] }>>()
const loadDisciplinesForPhaseMock = vi.fn<() => Promise<Map<string, unknown>>>()

vi.mock('../../src/workflow/governance.js', () => ({
  isVetoed: () => isVetoedMock(),
}))
vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: (id: string) => activatePhaseMock(id),
  completePhase: (ctx: { phaseId: string }) => completePhaseMock(ctx),
}))
vi.mock('../../src/checkpoint/state.js', () => ({
  pause: () => pauseMock(),
}))
vi.mock('../../src/workflow/loadPhases.js', () => ({
  loadPhases: (yamlPath: string, vars: Record<string, string>) => loadPhasesMock(yamlPath, vars),
}))
vi.mock('../../src/workflow/judgmentResolver.js', () => ({
  resolveJudgmentGate: (
    _ref: string,
    _ctx: Record<string, unknown>,
    _root: string,
  ): Promise<boolean> => resolveJudgmentGateMock(),
}))
vi.mock('../../src/workflow/masterOrchestrator.js', () => ({
  runMasterOrchestrator: (
    _master: string,
    _ctx: Record<string, unknown>,
    _root: string,
  ): Promise<{ master: string; fired: string[]; skipped: string[] }> => runMasterOrchestratorMock(),
}))
vi.mock('../../src/discipline/enforcement/before-phase-execute.js', () => ({
  loadDisciplinesForPhase: (
    _applied: readonly string[] | undefined,
    _root: string,
  ): Promise<Map<string, unknown>> => loadDisciplinesForPhaseMock(),
}))

import { runWorkflow } from '../../src/workflow/run.js'

const fivePhases = [
  { id: '01-gstack-decision', skills: ['plan-feature-decision'] },
  { id: '02-brainstorm', skills: ['plan-feature-brainstorm'] },
  { id: '03-gsd-discuss', skills: ['plan-feature-discuss'] },
  { id: '04-gsd-plan', skills: ['plan-feature-plan'] },
  { id: '05-persist', skills: ['plan-feature-persist'] },
]

beforeEach(() => {
  isVetoedMock.mockReset()
  activatePhaseMock.mockClear()
  completePhaseMock.mockClear()
  pauseMock.mockClear()
  loadPhasesMock.mockReset()
  resolveJudgmentGateMock.mockReset()
  runMasterOrchestratorMock.mockReset()
  loadDisciplinesForPhaseMock.mockReset()
  loadPhasesMock.mockReturnValue({ workflow: 'plan-feature', phases: fivePhases })
  // Default — gate evaluates true (NOT skip). Per-test override for skip path.
  resolveJudgmentGateMock.mockResolvedValue(true)
  // T3.5.W0.2 — default disciplines map (6 entries) for existing v1 / v2 fixture path
  // 不破坏 backwards-compat;NEW fixture per-test override 验 wedge 行为。
  loadDisciplinesForPhaseMock.mockResolvedValue(new Map())
})
afterEach(() => vi.clearAllMocks())

describe('runWorkflow — D-03 WIRED + D-04 PUSH + B-01 fix', () => {
  it('1. 5 phase happy path → status=complete + phasesRun=5 + activate/complete called 5x each', async () => {
    isVetoedMock.mockResolvedValue(false)
    const r = await runWorkflow('workflows/plan-feature/workflow.yaml', {
      gstack_prefix: 'gstack-',
    })
    expect(r).toEqual({ status: 'complete', phasesRun: 5 })
    expect(activatePhaseMock).toHaveBeenCalledTimes(5)
    expect(completePhaseMock).toHaveBeenCalledTimes(5)
    expect(pauseMock).not.toHaveBeenCalled()
  })

  it('2. veto at phase 2 → status=paused-veto + phasesRun=1 + activate called 2x (B-01 reorder)', async () => {
    // B-01 ordering proof: activatePhase runs BEFORE veto-check inside for-loop,
    // so phase 2 activates THEN sees veto → pause; phase 1 completes normally.
    isVetoedMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    const r = await runWorkflow('workflows/plan-feature/workflow.yaml', {
      gstack_prefix: 'gstack-',
    })
    expect(r).toEqual({ status: 'paused-veto', phasesRun: 1, lastPhaseId: '02-brainstorm' })
    expect(activatePhaseMock).toHaveBeenCalledTimes(2) // phase 1 + phase 2 (B-01: activate BEFORE veto-check)
    expect(pauseMock).toHaveBeenCalledTimes(1)
    expect(completePhaseMock).toHaveBeenCalledTimes(1) // phase 1 only (phase 2 paused before complete)
  })

  it('3. dispatchSkillStub mock format ok per D-03 WIRED contract — phase chain runs all 5', async () => {
    // RESEARCH § 6.2 contract: 3-field mock {status:'ok', output:<contains "stub for ...">, decision:'mock-approved'}
    isVetoedMock.mockResolvedValue(false)
    await runWorkflow('workflows/plan-feature/workflow.yaml', { gstack_prefix: 'gstack-' })
    const lastTaskStrings = completePhaseMock.mock.calls.map((c) => c[0].lastTask ?? '')
    // Each completePhase call should carry the stub output marker
    for (const lt of lastTaskStrings) {
      expect(lt).toMatch(/<stub for plan-feature-/)
    }
    expect(lastTaskStrings).toHaveLength(5)
  })

  it('4. T2.4.W1.4 — v2 `phase.gate` resolves false → phase skipped (NOT pause), skippedPhases populated', async () => {
    // v2 真接 consume: phase 2 carries `gate` ref → resolveJudgmentGate returns false
    // → phase skipped (completePhase still called with skip marker), workflow continues.
    // Sister D-04 PUSH gate ≠ veto (gate evaluates per-phase, veto halts全 workflow).
    isVetoedMock.mockResolvedValue(false)
    const v2Phases = [
      { id: '01-gstack-decision', gate: 'judgments.strategic-gate.office-hours.fires' },
      { id: '02-brainstorm', gate: 'judgments.subtask-gate.brainstorming.fires' },
      { id: '03-gsd-discuss' },
    ]
    loadPhasesMock.mockReturnValue({ workflow: 'plan-feature', phases: v2Phases })
    // phase 1 gate fires=true → run normal; phase 2 gate fires=false → skip;
    // phase 3 no gate field → run normal (NOT subject to gate check).
    resolveJudgmentGateMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    const r = await runWorkflow(
      'workflows/plan-feature/workflow.yaml',
      { gstack_prefix: 'gstack-' },
      { packageRoot: '/tmp/fake-root', gateContext: { phase: { type: 'new_feature' } } },
    )
    expect(r).toEqual({
      status: 'complete',
      phasesRun: 3,
      skippedPhases: ['02-brainstorm'],
    })
    expect(resolveJudgmentGateMock).toHaveBeenCalledTimes(2)
    expect(activatePhaseMock).toHaveBeenCalledTimes(3) // all 3 activate (skip happens AFTER activate)
    expect(completePhaseMock).toHaveBeenCalledTimes(3) // skip completes with skip marker
    const skipLastTask = completePhaseMock.mock.calls[1]?.[0].lastTask ?? ''
    expect(skipLastTask).toMatch(/skipped: gate judgments\.subtask-gate/)
  })

  it('5. T2.4.W1.4 — v1 phases (NO `gate` field) untouched by gate path — resolveJudgmentGate NOT called', async () => {
    // Sister Phase 2.4 W1.1 ifelse dispatch backwards-compat: v1 PhasesSchema 不含
    // `gate` 字段 — narrow `'gate' in ph` 守住 v1 path 完全旁路 gate pre-flight。
    isVetoedMock.mockResolvedValue(false)
    // fivePhases (default mock) carry only `id` + `skills` — NO gate field.
    const r = await runWorkflow('workflows/plan-feature/workflow.yaml', {
      gstack_prefix: 'gstack-',
    })
    expect(r).toEqual({ status: 'complete', phasesRun: 5 })
    // KEY assertion — gate resolver NEVER touched on v1 phases (backwards compat守住).
    expect(resolveJudgmentGateMock).not.toHaveBeenCalled()
    expect(activatePhaseMock).toHaveBeenCalledTimes(5)
    expect(completePhaseMock).toHaveBeenCalledTimes(5)
  })

  it('6. T3.5.W0.2 — master detect: workflow=discuss + delegates_to → runMasterOrchestrator', async () => {
    // v3 master yaml — delegates_to present + workflow ∈ 4 master name → delegate path
    loadPhasesMock.mockReturnValue({
      workflow: 'discuss',
      delegates_to: [{ sub: 'strategic' }, { sub: 'phase' }],
      phases: undefined,
    })
    runMasterOrchestratorMock.mockResolvedValue({
      master: 'discuss',
      fired: ['strategic', 'phase'],
      skipped: [],
    })
    const r = await runWorkflow('workflows/discuss/auto/workflow.yaml', {})
    expect(runMasterOrchestratorMock).toHaveBeenCalledTimes(1)
    expect(r).toEqual({ status: 'complete', phasesRun: 2 })
    // KEY: master path 不走 5-phase 桩 spawn
    expect(activatePhaseMock).not.toHaveBeenCalled()
    expect(completePhaseMock).not.toHaveBeenCalled()
  })

  it('7. T3.5.W0.2 — master detect: workflow ∉ 4 master name → fall through to phase path', async () => {
    // workflow=plan-feature (legacy v2) + delegates_to absent → NOT master
    isVetoedMock.mockResolvedValue(false)
    const r = await runWorkflow('workflows/plan-feature/workflow.yaml', {})
    expect(runMasterOrchestratorMock).not.toHaveBeenCalled()
    expect(r.status).toBe('complete')
    expect(r.phasesRun).toBe(5)
  })

  it('8. T3.5.W0.2 — master detect: delegates_to empty array → NOT master (phase path)', async () => {
    // edge case — delegates_to: [] + workflow=discuss → engine 不 dispatch master
    loadPhasesMock.mockReturnValue({
      workflow: 'discuss',
      delegates_to: [],
      phases: [{ id: 'p1', skills: ['x'] }],
    })
    isVetoedMock.mockResolvedValue(false)
    const r = await runWorkflow('workflows/discuss/somewhere/workflow.yaml', {})
    expect(runMasterOrchestratorMock).not.toHaveBeenCalled()
    expect(r.status).toBe('complete')
    expect(r.phasesRun).toBe(1)
  })

  it('9. T3.5.W0.2 — disciplines wedge: v3 sub yaml disciplines_applied loaded into gateContext', async () => {
    // v3 sub yaml with disciplines_applied → loadDisciplinesForPhase called w/ that list
    loadPhasesMock.mockReturnValue({
      workflow: 'discuss-strategic',
      disciplines_applied: ['karpathy', 'output-style'],
      phases: [{ id: 'p1', skills: ['x'] }],
    })
    loadDisciplinesForPhaseMock.mockResolvedValue(new Map([['karpathy', { x: 1 }]]))
    isVetoedMock.mockResolvedValue(false)
    const r = await runWorkflow('workflows/discuss/strategic/workflow.yaml', {})
    expect(loadDisciplinesForPhaseMock).toHaveBeenCalledTimes(1)
    expect(r.status).toBe('complete')
  })

  it('10. T3.5.W0.2 — disciplines wedge fail-soft: ENOENT throw → console.warn + 不阻塞', async () => {
    // disciplines load throw → warn emit + continue phases (sister ADR 0029 fail-soft)
    loadDisciplinesForPhaseMock.mockRejectedValueOnce(new Error('ENOENT disciplines/x.yaml'))
    isVetoedMock.mockResolvedValue(false)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const r = await runWorkflow('workflows/plan-feature/workflow.yaml', {})
    expect(r.status).toBe('complete')
    expect(r.phasesRun).toBe(5) // 5 phase 仍 run, wedge fail 不影响
    expect(warnSpy).toHaveBeenCalled()
    const warnMsg = warnSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(warnMsg).toMatch(/loadDisciplinesForPhase failed/)
    warnSpy.mockRestore()
  })
})
