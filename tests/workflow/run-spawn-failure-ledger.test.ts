// v16.0 Phase 66 T4 — the classification travels from run.ts to the leaf ledger.
//
// The link is IN-PROCESS, not cross-process. `harnessed run` never shells out to
// `harnessed checkpoint fail`: it already writes the terminal checkpoint itself
// through `completePhase` (src/workflow/run.ts), and it already imports
// src/checkpoint/state.js. So the classification reaches the ledger the same way
// the checkpoint does — a locked read-modify-write from this process.
//
// The ledger key is the WORKFLOW name, not the phase id: ledger entries are the
// flattened `<master>-<sub>` names seeded by `checkpoint start --plan`
// (`task-code`), while `ph.id` is a phase inside that sub (`01-code`).
//
// Two invariants:
//   * a spawn failure annotates the entry WITHOUT flipping status or fail_count
//     (run.ts is not the status writer — the checkpoint CLI is, and double
//     counting would mislead BREAK-LOOP / BUDGET-EXHAUSTED).
//   * a non-spawn failure (ralph-loop exhaustion, gate config error) writes
//     nothing at all.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'

const loadPhasesMock = vi.fn()
const completePhaseMock = vi.fn()
const mutateSubProgressMock = vi.fn()

vi.mock('../../src/workflow/loadPhases.js', () => ({
  loadPhases: (p: string, v: Record<string, string>) => loadPhasesMock(p, v),
}))
vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/task-code.json' })),
  completePhase: (ctx: unknown) => completePhaseMock(ctx),
}))
vi.mock('../../src/checkpoint/state.js', () => ({
  pause: async () => {},
  mutateSubProgress: (fn: unknown) => mutateSubProgressMock(fn),
}))
vi.mock('../../src/workflow/governance.js', () => ({ isVetoed: async () => false }))
vi.mock('../../src/discipline/enforcement/before-phase-execute.js', () => ({
  loadDisciplinesForPhase: async () => new Map(),
}))
vi.mock('../../src/discipline/enforcement/before-spawn.js', () => ({
  arbitrateBeforeSpawn: async (f: unknown) => f,
}))
vi.mock('../../src/workflow/judgmentResolver.js', () => ({ resolveJudgmentGate: async () => true }))
vi.mock('../../src/workflow/masterOrchestrator.js', () => ({
  runMasterOrchestrator: async () => ({ master: '', fired: [], skipped: [] }),
}))
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: () => (async function* () {})(),
}))

import { _dispatchSkillStub, runWorkflow } from '../../src/workflow/run.js'

/** Replay the mutator the run loop handed to `mutateSubProgress` against a
 *  ledger seeded the way `checkpoint start --plan` would seed it. */
function replay(seed: SubProgressEntryType[]): SubProgressEntryType[] {
  const fn = mutateSubProgressMock.mock.calls[0]?.[0] as (
    e: SubProgressEntryType[],
  ) => SubProgressEntryType[]
  return fn(seed)
}

const SEED: SubProgressEntryType[] = [
  { sub: 'task-code', status: 'pending', gate_fired: true },
  { sub: 'task-test', status: 'pending', gate_fired: true },
]

beforeEach(() => {
  loadPhasesMock.mockReset()
  completePhaseMock.mockReset()
  mutateSubProgressMock.mockReset()
  loadPhasesMock.mockReturnValue({ workflow: 'task-code', phases: [{ id: '01-code' }] })
})
afterEach(() => vi.restoreAllMocks())

describe('T4 — run.ts writes the spawn-failure kind onto the leaf ledger', () => {
  it('annotates the entry named by the WORKFLOW (task-code), not the phase id', async () => {
    vi.spyOn(_dispatchSkillStub, 'fn').mockResolvedValue({
      status: 'fail',
      output: 'sdkSpawn failed for 01-code: boom',
      failure: 'SpawnRefused',
    })
    const r = await runWorkflow('/fake/workflows/task/code/workflow.yaml', {})

    expect(r.status).toBe('failed')
    expect(mutateSubProgressMock).toHaveBeenCalledTimes(1)
    const after = replay(SEED)
    expect(after[0]?.sub).toBe('task-code')
    expect(after[0]?.spawn_failure).toBe('SpawnRefused')
    // untouched status / counter — run.ts annotates, it does not transition
    expect(after[0]?.status).toBe('pending')
    expect(after[0]?.fail_count).toBeUndefined()
    // sibling entry byte-identical
    expect(JSON.stringify(after[1])).toBe(JSON.stringify(SEED[1]))
  })

  it('still records the terminal FAILED checkpoint (the annotation is additive)', async () => {
    vi.spyOn(_dispatchSkillStub, 'fn').mockResolvedValue({
      status: 'fail',
      output: 'boom',
      failure: 'SpawnAuthFailed',
    })
    await runWorkflow('/fake/workflows/task/code/workflow.yaml', {})
    const ctx = completePhaseMock.mock.calls.at(-1)?.[0] as { lastTask: string }
    expect(ctx.lastTask).toContain('FAILED: phase 01-code')
  })

  it('writes NOTHING when the failure was not a spawn failure', async () => {
    vi.spyOn(_dispatchSkillStub, 'fn').mockResolvedValue({
      status: 'fail',
      output: 'ralph-loop max-iterations exceeded (20) for 01-code',
    })
    await runWorkflow('/fake/workflows/task/code/workflow.yaml', {})
    expect(mutateSubProgressMock).not.toHaveBeenCalled()
  })

  it('writes nothing on a successful run', async () => {
    vi.spyOn(_dispatchSkillStub, 'fn').mockResolvedValue({ status: 'ok', output: 'done' })
    const r = await runWorkflow('/fake/workflows/task/code/workflow.yaml', {})
    expect(r.status).toBe('complete')
    expect(mutateSubProgressMock).not.toHaveBeenCalled()
  })

  it('is fail-soft: a ledger write that throws does not change the run verdict', async () => {
    mutateSubProgressMock.mockImplementation(() => {
      throw new Error('lock held')
    })
    vi.spyOn(_dispatchSkillStub, 'fn').mockResolvedValue({
      status: 'fail',
      output: 'boom',
      failure: 'SpawnTimeout',
    })
    const r = await runWorkflow('/fake/workflows/task/code/workflow.yaml', {})
    expect(r.status).toBe('failed')
    expect(r.lastPhaseId).toBe('01-code')
  })
})
