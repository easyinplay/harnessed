// Phase v3.4.4 Phase 4 Commit 2 — workflowName plumb unit test (2 fixtures).
// Verifies Part E end-to-end: runWorkflow extracts parsed.workflow once, threads
// it via opts.workflowName into every _dispatchSkillStub.fn call, and the
// fallback site uses it (instead of the pre-Phase 4 hardcoded 'harnessed-run').
//
// Fixtures (per PHASE-4-SPEC L425-427):
//   F1. _dispatchSkillStub.fn called with opts.workflowName === 'execute-task'
//       when runWorkflow parses `workflow: execute-task` yaml
//   F2. handleMaxIterationsExceeded ctx receives workflowName === 'execute-task'
//       (NOT 'harnessed-run') when fallback path triggers

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FallbackMaxIterationsExceededConfig } from '../../src/workflow/lib/ralphLoop.js'

// ============================================================
// F1 mocks: stub all run.ts side-effects; DI-override _dispatchSkillStub.fn.
// ============================================================
const loadPhasesMockF1 = vi.fn()
const activatePhaseMockF1 = vi.fn(async (_id: string) => ({ checkpointPath: '' }))
const completePhaseMockF1 = vi.fn(async (_ctx: { phaseId: string }) => {})
const isVetoedMockF1 = vi.fn<() => Promise<boolean>>()
const loadDisciplinesForPhaseMockF1 = vi.fn(async () => new Map())

vi.mock('../../src/workflow/loadPhases.js', () => ({
  loadPhases: (yamlPath: string, vars: Record<string, string>) => loadPhasesMockF1(yamlPath, vars),
}))
vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: (id: string) => activatePhaseMockF1(id),
  completePhase: (ctx: { phaseId: string }) => completePhaseMockF1(ctx),
}))
vi.mock('../../src/checkpoint/state.js', () => ({
  pause: async () => {},
}))
vi.mock('../../src/workflow/governance.js', () => ({
  isVetoed: () => isVetoedMockF1(),
}))
vi.mock('../../src/discipline/enforcement/before-phase-execute.js', () => ({
  loadDisciplinesForPhase: () => loadDisciplinesForPhaseMockF1(),
}))
vi.mock('../../src/discipline/enforcement/after-output.js', () => ({
  runAfterOutputHook: async () => [],
}))
vi.mock('../../src/discipline/enforcement/before-commit.js', () => ({
  runBeforeCommitHook: async () => {},
}))
vi.mock('../../src/discipline/enforcement/before-spawn.js', () => ({
  arbitrateBeforeSpawn: async (f: unknown) => f,
}))
vi.mock('../../src/workflow/judgmentResolver.js', () => ({
  resolveJudgmentGate: async () => true,
}))
vi.mock('../../src/workflow/masterOrchestrator.js', () => ({
  runMasterOrchestrator: async () => ({ master: '', fired: [], skipped: [] }),
}))
// Phase 4 — loadRolePrompts loaded once per workflow run. Return empty so
// buildAgentDef defaults to the conservative stub (we don't care about def
// shape here — F1/F2 are about workflowName plumb only).
vi.mock('../../src/cli/lib/generateCommands.js', () => ({
  loadRolePrompts: async (_dir: string) => ({}),
  // Re-export RolePrompt type-only — vi.mock can't carry types but src/workflow/run.ts
  // only imports the type at compile time; runtime import is `loadRolePrompts` only.
}))

// SDK kept inert (F1 path; F2 mocks sdkSpawn instead).
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: () => (async function* () {})(),
}))

// F2 — mock sdkSpawn to always return a non-COMPLETE envelope so
// ralphLoopWrap exhausts iter and throws MaxIterationsExceededError.
vi.mock('../../src/workflow/lib/sdkSpawn.js', () => ({
  sdkSpawn: async () =>
    JSON.stringify({
      subtype: 'error',
      result: 'still working but no COMPLETE signal',
    }),
}))

// ============================================================
// F2 helper — capture handleMaxIterationsExceeded ctx via vi.mock on ralphLoop.
// Mock only the handler; preserve MaxIterationsExceededError + ralphLoopWrap so
// the wrap path can run end-to-end and throw the typed error real runtime would.
// ============================================================
class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}
const handleMaxIterCapture = {
  lastCtx: undefined as
    | { workflowName: string; phaseId: string; subtaskSummary: string; maxIterations: number }
    | undefined,
}
vi.mock('../../src/workflow/lib/ralphLoop.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/workflow/lib/ralphLoop.js')>(
    '../../src/workflow/lib/ralphLoop.js',
  )
  return {
    ...actual,
    handleMaxIterationsExceeded: (
      _err: unknown,
      _fallback: FallbackMaxIterationsExceededConfig,
      ctx: { workflowName: string; phaseId: string; subtaskSummary: string; maxIterations: number },
    ): never => {
      handleMaxIterCapture.lastCtx = ctx
      // Sister tests/routing/ralph-fallback.test.ts ExitError pattern — bubble out
      // a typed error instead of actually calling process.exit (kills test runner).
      throw new ExitError(_fallback.exit_code ?? 1)
    },
  }
})

// Imports must come AFTER all vi.mock declarations (hoist rule).
import { _dispatchSkillStub, runWorkflow } from '../../src/workflow/run.js'

const SINGLE_PHASE = [{ id: '04-deliver', skills: ['execute-task-deliver'] }]

beforeEach(() => {
  loadPhasesMockF1.mockReset()
  activatePhaseMockF1.mockClear()
  completePhaseMockF1.mockClear()
  isVetoedMockF1.mockReset()
  loadDisciplinesForPhaseMockF1.mockReset()
  isVetoedMockF1.mockResolvedValue(false)
  loadDisciplinesForPhaseMockF1.mockResolvedValue(new Map())
  handleMaxIterCapture.lastCtx = undefined
})
afterEach(() => {
  vi.clearAllMocks()
})

describe('Phase 4 Part E — workflowName plumb (2 fixtures)', () => {
  it('F1. _dispatchSkillStub.fn opts.workflowName === "execute-task" when yaml workflow: execute-task', async () => {
    loadPhasesMockF1.mockReturnValue({ workflow: 'execute-task', phases: SINGLE_PHASE })

    type DispatchOpts = Parameters<typeof _dispatchSkillStub.fn>[2]
    const capturedOpts: DispatchOpts[] = []
    const originalFn = _dispatchSkillStub.fn
    _dispatchSkillStub.fn = async (_skillName: string, _phase?: unknown, opts?: DispatchOpts) => {
      capturedOpts.push(opts)
      return { status: 'ok' as const, output: '<stub>', decision: 'mock-approved' }
    }

    try {
      const r = await runWorkflow('workflows/execute-task/workflow.yaml', {})
      expect(r.status).toBe('complete')
      expect(capturedOpts).toHaveLength(1)
      expect(capturedOpts[0]?.workflowName).toBe('execute-task')
      // Sanity — other plumbed fields are present (rolePrompts is at least an object).
      expect(capturedOpts[0]?.rolePrompts).toBeDefined()
    } finally {
      _dispatchSkillStub.fn = originalFn
    }
  })

  it('F2. handleMaxIterationsExceeded ctx.workflowName === "execute-task" (not "harnessed-run") on fallback', async () => {
    // Use the REAL _dispatchSkillStub.fn (production wired to sdkSpawn + ralphLoopWrap).
    // Force the wrap path by giving the phase a fallback config + upstream: ralph-loop
    // (isRalphLoopOptIn → true). Mock sdkSpawn to always throw → ralphLoopWrap exhausts
    // iter count → throws MaxIterationsExceededError → fallback path fires.
    const phaseWithFallback = {
      id: '04-deliver',
      upstream: 'ralph-loop',
      max_iterations: 1,
      fallback: {
        max_iterations_exceeded: {
          action: 'emit_warning_and_halt' as const,
          message: 'fake max-iter halt',
          exit_code: 1,
        },
      },
    }
    loadPhasesMockF1.mockReturnValue({
      workflow: 'execute-task',
      phases: [phaseWithFallback],
    })

    // Manually invoke _dispatchSkillStub.fn with opts that mimic what runWorkflow
    // builds at L289-296 — this isolates the fallback ctx assertion to the dispatch
    // function itself (the runWorkflow → _dispatchSkillStub.fn plumb is covered by F1).
    const fallbackConfig = phaseWithFallback.fallback.max_iterations_exceeded
    await expect(
      _dispatchSkillStub.fn('04-deliver', phaseWithFallback, {
        maxIter: 1,
        fallback: fallbackConfig,
        workflowName: 'execute-task',
      }),
    ).rejects.toThrow(ExitError)

    // Capture assertion — ctx.workflowName MUST be the plumbed 'execute-task',
    // NOT the pre-Phase 4 hardcoded 'harnessed-run' literal.
    expect(handleMaxIterCapture.lastCtx).toBeDefined()
    expect(handleMaxIterCapture.lastCtx?.workflowName).toBe('execute-task')
    expect(handleMaxIterCapture.lastCtx?.workflowName).not.toBe('harnessed-run')
    expect(handleMaxIterCapture.lastCtx?.phaseId).toBe('04-deliver')
    expect(handleMaxIterCapture.lastCtx?.maxIterations).toBe(1)
  })
})
