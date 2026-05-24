// Phase 3.2 W2 T2.6 — runWorkflow() unit test (3 fixtures, D-03 WIRED + B-01 fix).
// T2.4.W1.4 — 2 NEW fixture verify v2 真接 `phase.gate` pre-flight consume
// (D-04 + D-11 strategic-gate / phase-gate skip path).
// T3.5.W0.2 — 5 NEW fixture verify master vs sub detect + loadDisciplinesForPhase wedge.
// T3.5.W1.5 — 6 NEW fixture verify 3 phase-level hook fire point per RESEARCH-disciplines § 4.4
// (before-spawn invokes_tools.length>1 / after-output r.target=chat / before-commit r.triggers_commit)。
// Sister Phase 3.1 W1 state.test.ts vi.mock pattern.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Phase v3.4.4 — production default in run.ts:_dispatchSkillStub.fn now calls
// real sdkSpawn → @anthropic-ai/claude-agent-sdk query(). Mock the SDK at the
// module boundary so any fixture that does NOT DI-override _dispatchSkillStub.fn
// (none currently — all 16 fixtures override via _testStubFn rebind below)
// would still not hit the real SDK. Sister tests/routing/sdk-spawn.test.ts:27-34.
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: () => (async function* () {})(),
}))

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
// T3.5.W1.5 — 3 phase-level hook mock。
interface FiredCapShape {
  name: string
  tier: string
}
const arbitrateBeforeSpawnMock = vi.fn<(fired: FiredCapShape[]) => Promise<FiredCapShape[]>>()
const runAfterOutputHookMock = vi.fn<() => Promise<string[]>>()
const runBeforeCommitHookMock = vi.fn<() => Promise<void>>()

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
vi.mock('../../src/discipline/enforcement/before-spawn.js', () => ({
  arbitrateBeforeSpawn: (fired: FiredCapShape[], _root: string): Promise<FiredCapShape[]> =>
    arbitrateBeforeSpawnMock(fired),
}))
vi.mock('../../src/discipline/enforcement/after-output.js', () => ({
  runAfterOutputHook: (_ctx: unknown): Promise<string[]> => runAfterOutputHookMock(),
}))
vi.mock('../../src/discipline/enforcement/before-commit.js', () => ({
  runBeforeCommitHook: (_ctx: unknown): Promise<void> => runBeforeCommitHookMock(),
}))

import type { FallbackMaxIterationsExceededConfig } from '../../src/workflow/lib/ralphLoop.js'
import { _dispatchSkillStub, type DispatchStubResult, runWorkflow } from '../../src/workflow/run.js'

const fivePhases = [
  { id: '01-gstack-decision', skills: ['plan-feature-decision'] },
  { id: '02-brainstorm', skills: ['plan-feature-brainstorm'] },
  { id: '03-gsd-discuss', skills: ['plan-feature-discuss'] },
  { id: '04-gsd-plan', skills: ['plan-feature-plan'] },
  { id: '05-persist', skills: ['plan-feature-persist'] },
]

// Phase v3.4.4 — production default of _dispatchSkillStub.fn now calls real
// sdkSpawn (was literal '<stub for X>' shim). Tests own the legacy stub-string
// behavior via _testStubFn rebound in beforeEach/afterEach. This isolates the
// legacy shim to the test file (where it was always conceptually owned) and
// decouples 16 existing fixtures from the production default rewire.
// Phase v3.4.4 Phase 3 Commit 3 — signature widened to match real _dispatchSkillStub.fn
// (skillName, phase?, opts?). TS optional params keep 1-arg call sites backwards-compatible
// — all 16 existing fixtures pass single-arg without change. `_opts.fallback` uses the REAL
// `FallbackMaxIterationsExceededConfig` type (not `unknown`) per user-confirmed spec-gap fix
// — strengthens future fixture type safety.
const _testStubFn = async (
  skillName: string,
  _phase?: unknown,
  _opts?: { maxIter?: number; fallback?: FallbackMaxIterationsExceededConfig },
): Promise<DispatchStubResult> => ({
  status: 'ok' as const,
  output: `<stub for ${skillName}>`,
  decision: 'mock-approved',
})

beforeEach(() => {
  isVetoedMock.mockReset()
  activatePhaseMock.mockClear()
  completePhaseMock.mockClear()
  pauseMock.mockClear()
  loadPhasesMock.mockReset()
  resolveJudgmentGateMock.mockReset()
  runMasterOrchestratorMock.mockReset()
  loadDisciplinesForPhaseMock.mockReset()
  arbitrateBeforeSpawnMock.mockReset()
  runAfterOutputHookMock.mockReset()
  runBeforeCommitHookMock.mockReset()
  loadPhasesMock.mockReturnValue({ workflow: 'plan-feature', phases: fivePhases })
  resolveJudgmentGateMock.mockResolvedValue(true)
  loadDisciplinesForPhaseMock.mockResolvedValue(new Map())
  arbitrateBeforeSpawnMock.mockImplementation(async (fired) => fired)
  runAfterOutputHookMock.mockResolvedValue([])
  runBeforeCommitHookMock.mockResolvedValue(undefined)
  // Reset stub fn to test shim (per-test override 后 restore;Phase v3.4.4 production
  // default 现 call real sdkSpawn — tests own legacy '<stub for X>' shim via _testStubFn)。
  _dispatchSkillStub.fn = _testStubFn
})
afterEach(() => {
  vi.clearAllMocks()
  _dispatchSkillStub.fn = _testStubFn
})

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

  it('11. T3.5.W1.5 — before-spawn fires: phase.invokes_tools.length=2 → arbitrate called', async () => {
    // v3 phase 含 invokes_tools array length=2 → arbitrate fires once per phase
    isVetoedMock.mockResolvedValue(false)
    const v3Phases = [
      {
        id: 'p1',
        invokes_tools: [{ tool: 'zoom-out' }, { tool: 'diagnose' }],
      },
    ]
    loadPhasesMock.mockReturnValue({ workflow: 'task-code', phases: v3Phases })
    const r = await runWorkflow('workflows/task/code/workflow.yaml', {})
    expect(r.status).toBe('complete')
    expect(r.phasesRun).toBe(1)
    expect(arbitrateBeforeSpawnMock).toHaveBeenCalledTimes(1)
    const calledFired = arbitrateBeforeSpawnMock.mock.calls[0]?.[0] ?? []
    expect(calledFired).toEqual([
      { name: 'zoom-out', tier: 'zoom-out' },
      { name: 'diagnose', tier: 'diagnose' },
    ])
  })

  it('12. T3.5.W1.5 — before-spawn NOT fire: invokes_tools.length=1 (single tool) → arbitrate NOT called', async () => {
    // Single-tool phase 不需 arbitrate (RESEARCH-disciplines § 4.4 verbatim: length > 1 trigger)。
    isVetoedMock.mockResolvedValue(false)
    const v3Phases = [{ id: 'p1', invokes_tools: [{ tool: 'zoom-out' }] }]
    loadPhasesMock.mockReturnValue({ workflow: 'task-code', phases: v3Phases })
    const r = await runWorkflow('workflows/task/code/workflow.yaml', {})
    expect(r.status).toBe('complete')
    expect(arbitrateBeforeSpawnMock).not.toHaveBeenCalled()
  })

  it('13. T3.5.W1.5 — before-spawn fail-soft: arbitrate throw → console.warn + 继续 phase (K14)', async () => {
    // K14 mitigation:arbitrate throw → warn + 不阻塞;phase 仍 complete。
    isVetoedMock.mockResolvedValue(false)
    arbitrateBeforeSpawnMock.mockRejectedValueOnce(new Error('priority.yaml malformed'))
    const v3Phases = [{ id: 'p1', invokes_tools: [{ tool: 'zoom-out' }, { tool: 'diagnose' }] }]
    loadPhasesMock.mockReturnValue({ workflow: 'task-code', phases: v3Phases })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const r = await runWorkflow('workflows/task/code/workflow.yaml', {})
    expect(r.status).toBe('complete')
    expect(r.phasesRun).toBe(1)
    expect(warnSpy).toHaveBeenCalled()
    const warnMsg = warnSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
    expect(warnMsg).toMatch(/before-spawn arbitrate failed/)
    warnSpy.mockRestore()
  })

  it('14. T3.5.W1.5 — after-output fires: stub r.target=chat → runAfterOutputHook called', async () => {
    // Stub override return shape with target='chat' → after-output validate fires。
    isVetoedMock.mockResolvedValue(false)
    _dispatchSkillStub.fn = async (skillName) => ({
      status: 'ok',
      output: `chat response from ${skillName}`,
      target: 'chat',
    })
    const v2Phases = [{ id: 'p1' }]
    loadPhasesMock.mockReturnValue({ workflow: 'task', phases: v2Phases })
    const r = await runWorkflow('workflows/task/clarify/workflow.yaml', {})
    expect(r.status).toBe('complete')
    expect(runAfterOutputHookMock).toHaveBeenCalledTimes(1)
    // KEY: file/commit-message target NOT trigger after-output;default undefined NOT trigger 也证实。
    expect(runBeforeCommitHookMock).not.toHaveBeenCalled()
  })

  it('15. T3.5.W1.5 — before-commit fires: stub r.triggers_commit=true → runBeforeCommitHook called', async () => {
    // Stub override triggers_commit=true → before-commit hook fires before completePhase。
    isVetoedMock.mockResolvedValue(false)
    _dispatchSkillStub.fn = async (skillName) => ({
      status: 'ok',
      output: `<stub for ${skillName}>`,
      triggers_commit: true,
    })
    const v2Phases = [{ id: 'p1' }]
    loadPhasesMock.mockReturnValue({ workflow: 'task', phases: v2Phases })
    const r = await runWorkflow('workflows/task/deliver/workflow.yaml', {})
    expect(r.status).toBe('complete')
    expect(runBeforeCommitHookMock).toHaveBeenCalledTimes(1)
    // KEY: after-output NOT trigger (target undefined ≠ 'chat')。
    expect(runAfterOutputHookMock).not.toHaveBeenCalled()
  })

  it('16. T3.5.W1.5 — default stub (target=undefined, triggers_commit=undefined) → both hook NOT called', async () => {
    // Default WIRED stub return NO target NO triggers_commit → backwards-compat existing fixture
    // 不破:after-output + before-commit both 跳过(negative gating proof)。
    isVetoedMock.mockResolvedValue(false)
    const r = await runWorkflow('workflows/plan-feature/workflow.yaml', {})
    expect(r.status).toBe('complete')
    expect(r.phasesRun).toBe(5)
    // Default stub 不带 target / triggers_commit → 两 hook 全 NOT fire。
    expect(runAfterOutputHookMock).not.toHaveBeenCalled()
    expect(runBeforeCommitHookMock).not.toHaveBeenCalled()
    // Default fivePhases 不带 invokes_tools → before-spawn 也 NOT fire。
    expect(arbitrateBeforeSpawnMock).not.toHaveBeenCalled()
  })

  // Phase v3.4.4 Phase 3 Commit 3 — ralph-loop wrap conditional at the call-site (L281-ish).
  // 3 fixtures cover: opt-in trigger + CLI override priority + non-opt-in fallback resolution.
  // _dispatchSkillStub.fn is DI-overridden to OBSERVE phase + opts the call-site passes
  // (production wrap behavior is unit-tested in tests/workflow/ralphLoop.test.ts fixtures 10-12).
  it('17. T3.x — phase with max_iterations declared → ralph-loop wrap fires (opt-in path)', async () => {
    isVetoedMock.mockResolvedValue(false)
    let wrapInvoked = false
    // Override stub to observe wrap path: production default uses ralphLoopWrap
    // when isRalphLoopOptIn(phase) → true. Test verifies the call-site passes phase
    // object so opt-in detection has data to work with + resolved maxIter is propagated.
    _dispatchSkillStub.fn = async (skillName, phase, opts) => {
      if (phase && typeof phase === 'object' && 'max_iterations' in phase) {
        wrapInvoked = true
        expect(opts?.maxIter).toBe(10) // resolved from phase.max_iterations
      }
      return { status: 'ok', output: `done ${skillName}` }
    }
    const v3Phases = [{ id: 'p1', max_iterations: 10 }]
    loadPhasesMock.mockReturnValue({ workflow: 'task-code', phases: v3Phases })
    const r = await runWorkflow('workflows/task/code/workflow.yaml', {})
    expect(r.status).toBe('complete')
    expect(wrapInvoked).toBe(true)
  })

  it('18. T3.x — CLI --max-iterations flag wins over phase.max_iterations', async () => {
    isVetoedMock.mockResolvedValue(false)
    let observedMaxIter: number | undefined
    _dispatchSkillStub.fn = async (_skillName, _phase, opts) => {
      observedMaxIter = opts?.maxIter
      return { status: 'ok', output: 'done' }
    }
    const v3Phases = [{ id: 'p1', max_iterations: 10 }]
    loadPhasesMock.mockReturnValue({ workflow: 'task-code', phases: v3Phases })
    await runWorkflow(
      'workflows/task/code/workflow.yaml',
      {},
      { packageRoot: '/tmp/fake', gateContext: { maxIterations: 3 } },
    )
    expect(observedMaxIter).toBe(3) // CLI flag wins
  })

  it('19. T3.x — non-opt-in phase (no max_iterations/fallback/upstream) → single-shot sdkSpawn path (no wrap)', async () => {
    isVetoedMock.mockResolvedValue(false)
    let observedMaxIter: number | undefined
    _dispatchSkillStub.fn = async (_skillName, _phase, opts) => {
      observedMaxIter = opts?.maxIter // resolver still computes; wrap-conditional inside .fn
      return { status: 'ok', output: 'done' }
    }
    const v3Phases = [{ id: 'p1' }] // no opt-in signal
    loadPhasesMock.mockReturnValue({ workflow: 'task-code', phases: v3Phases })
    const r = await runWorkflow('workflows/task/code/workflow.yaml', {})
    expect(r.status).toBe('complete')
    expect(observedMaxIter).toBe(20) // fallback hardcoded 20 (still resolved + passed)
  })
})
