// issue #1 B1 — defaultSpawnDriver fail-fast. The master orchestrator already
// halts on a spawnDriver throw (masterOrchestrator.test.ts cell 28), but the
// REAL defaultSpawnDriver never threw: it swallowed runWorkflow throws in a
// try/catch warn AND discarded the non-throwing `{status:'failed'}` return, so
// a failed sub was reported as `Complete: N fired`. These cells lock the fix:
// defaultSpawnDriver throws (→ existing fail-fast fires) when the sub workflow
// fails or pauses, resolves when it completes, and propagates real throws.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const runWorkflowMock = vi.fn()
vi.mock('../../src/workflow/run.js', () => ({
  runWorkflow: (...args: unknown[]) => runWorkflowMock(...args),
}))

import { defaultSpawnDriver } from '../../src/workflow/masterOrchestrator-helpers.js'

const ROOT = '/fake-root'

beforeEach(() => {
  runWorkflowMock.mockReset()
})
afterEach(() => {
  vi.clearAllMocks()
})

describe('defaultSpawnDriver — issue #1 fail-fast (no silent swallow)', () => {
  it('status:complete → resolves without throwing', async () => {
    runWorkflowMock.mockResolvedValue({ status: 'complete', phasesRun: 2 })
    await expect(defaultSpawnDriver('auto', 'discuss', {}, ROOT)).resolves.toBeUndefined()
    expect(runWorkflowMock).toHaveBeenCalledTimes(1)
  })

  it('status:failed → throws (carries master/sub + last phase)', async () => {
    runWorkflowMock.mockResolvedValue({
      status: 'failed',
      phasesRun: 1,
      lastPhaseId: '01-architecture',
    })
    await expect(defaultSpawnDriver('plan', 'architecture', {}, ROOT)).rejects.toThrow(
      /plan\/architecture/,
    )
    await expect(defaultSpawnDriver('plan', 'architecture', {}, ROOT)).rejects.toThrow(
      /01-architecture/,
    )
  })

  it('status:paused-veto → throws (governance veto surfaced, not swallowed)', async () => {
    runWorkflowMock.mockResolvedValue({ status: 'paused-veto', phasesRun: 0, lastPhaseId: '00-x' })
    await expect(defaultSpawnDriver('verify', 'paranoid', {}, ROOT)).rejects.toThrow(
      /verify\/paranoid/,
    )
  })

  it('runWorkflow throws → propagates (real error not swallowed to warn)', async () => {
    runWorkflowMock.mockRejectedValue(new Error('sdkSpawn boom'))
    await expect(defaultSpawnDriver('task', 'code', {}, ROOT)).rejects.toThrow(/sdkSpawn boom/)
  })
})
