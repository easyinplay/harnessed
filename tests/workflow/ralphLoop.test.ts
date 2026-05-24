// Phase v3.4.4 Phase 3 Commit 2 — isRalphLoopOptIn + resolveMaxIterations unit tests.
// Sister tests/workflow/loadPhases.test.ts pattern (pure-function fixtures, no
// SDK mock for 1-9). Phase 3 Commit 3 adds fixtures 10-12 (wrap behavior inside
// `_dispatchSkillStub.fn` with vi.mock SDK) once the wrap exists.
//
// Fixtures (per PHASE-3-SPEC L325-338):
//   1.  isRalphLoopOptIn — phase with `max_iterations` (Number) → true
//   2.  isRalphLoopOptIn — phase with `fallback.max_iterations_exceeded` only → true
//   3.  isRalphLoopOptIn — phase with `upstream: 'ralph-loop'` only → true
//   4.  isRalphLoopOptIn — phase with none of the three signals → false
//   5.  resolveMaxIterations — CLI flag in gateContext.maxIterations wins over phase yaml
//   6.  resolveMaxIterations — phase yaml wins when no CLI flag
//   7.  resolveMaxIterations — hardcoded 20 fallback (CLI absent, yaml absent)
//   8.  resolveMaxIterations — JINJA string '5' coerces to 5
//   9.  resolveMaxIterations — clamp at hard_upper_limit 100 (CLI=500 → 100)
//   10. _dispatchSkillStub.fn opt-in + non-COMPLETE repeatedly → MaxIterationsExceededError → fail-soft
//   11. _dispatchSkillStub.fn opt-in + COMPLETE on iter 2 → ok + 2 spawn calls
//   12. _dispatchSkillStub.fn opt-in + fallback config → handleMaxIterationsExceeded fires process.exit(1)

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Phase 3 Commit 3 — vi.mock SDK at module boundary so fixtures 10-12 can drive
// envelope responses iteration-by-iteration via queryResponses[] queue. Hoisted
// BEFORE src imports (vi.mock hoist rule). Sister tests/routing/ralph-fallback.test.ts L15-25.
let queryCallCount = 0
let queryResponses: unknown[] = []

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: () =>
    (async function* () {
      queryCallCount++
      const response = queryResponses[queryCallCount - 1] ?? {
        type: 'result',
        subtype: 'error',
        result: 'still working',
      }
      yield response
    })(),
}))

import {
  _dispatchSkillStub,
  isRalphLoopOptIn,
  resolveMaxIterations,
} from '../../src/workflow/run.js'

describe('isRalphLoopOptIn — 3-signal opt-in detection (v3.4.4 Phase 3 Commit 2)', () => {
  it('1. phase with max_iterations (Number) → true', () => {
    expect(isRalphLoopOptIn({ id: 'p1', max_iterations: 10 })).toBe(true)
  })

  it('2. phase with fallback.max_iterations_exceeded only → true', () => {
    expect(
      isRalphLoopOptIn({
        id: 'p1',
        fallback: {
          max_iterations_exceeded: {
            action: 'emit_warning_and_halt',
            message: 'ralph-loop exceeded',
            exit_code: 1,
          },
        },
      }),
    ).toBe(true)
  })

  it('3. phase with upstream: ralph-loop only → true', () => {
    expect(isRalphLoopOptIn({ id: 'p1', upstream: 'ralph-loop' })).toBe(true)
  })

  it('4. phase with none of the three signals → false', () => {
    expect(isRalphLoopOptIn({ id: 'p1' })).toBe(false)
    expect(isRalphLoopOptIn({ id: 'p1', upstream: 'superpowers brainstorming' })).toBe(false)
    // unrelated fallback key → still false (only max_iterations_exceeded counts)
    expect(
      isRalphLoopOptIn({
        id: 'p1',
        fallback: {
          verbatim_complete_fail: {
            action: 'emit_warning_and_halt',
            message: 'x',
            exit_code: 1,
          },
        },
      }),
    ).toBe(false)
    // non-object inputs → false (defensive narrowing)
    expect(isRalphLoopOptIn(null)).toBe(false)
    expect(isRalphLoopOptIn(undefined)).toBe(false)
    expect(isRalphLoopOptIn('p1')).toBe(false)
  })
})

describe('resolveMaxIterations — chain CLI → yaml → 20, clamp 100 (v3.4.4 Phase 3 Commit 2)', () => {
  it('5. CLI flag in gateContext.maxIterations wins over phase yaml', () => {
    expect(resolveMaxIterations({ id: 'p1', max_iterations: 10 }, { maxIterations: 5 })).toBe(5)
  })

  it('6. phase yaml wins when no CLI flag', () => {
    expect(resolveMaxIterations({ id: 'p1', max_iterations: 15 }, {})).toBe(15)
  })

  it('7. hardcoded 20 fallback (CLI absent, yaml absent)', () => {
    expect(resolveMaxIterations({ id: 'p1' }, {})).toBe(20)
    expect(resolveMaxIterations(undefined, {})).toBe(20)
    expect(resolveMaxIterations(null, {})).toBe(20)
  })

  it("8. JINJA string '5' coerces to 5 (pre-resolved yaml String)", () => {
    expect(resolveMaxIterations({ id: 'p1', max_iterations: '5' }, {})).toBe(5)
    // invalid string falls through to 20 default (not NaN, not 0)
    expect(resolveMaxIterations({ id: 'p1', max_iterations: 'not-a-number' }, {})).toBe(20)
    expect(resolveMaxIterations({ id: 'p1', max_iterations: '0' }, {})).toBe(20)
  })

  it('9. clamp at hard_upper_limit 100 (CLI=500 → 100)', () => {
    expect(resolveMaxIterations({ id: 'p1', max_iterations: 10 }, { maxIterations: 500 })).toBe(100)
    // yaml-side over-limit also clamped
    expect(resolveMaxIterations({ id: 'p1', max_iterations: 999 }, {})).toBe(100)
    // lower clamp at 1 (defensive — 0 is a valid Number so ?? does NOT short-circuit;
    // chosen = 0 then Math.max(1, 0) = 1, Math.min(1, 100) = 1).
    expect(resolveMaxIterations({ id: 'p1' }, { maxIterations: 0 })).toBe(1)
  })
})

// Phase v3.4.4 Phase 3 Commit 3 — wrap-behavior fixtures (10-12).
// _dispatchSkillStub.fn opt-in path drives sdkSpawn → ralphLoopWrap → SDK query()
// (vi.mock above yields envelopes from queryResponses[]). Non-COMPLETE envelopes
// trigger retry up to maxIter, COMPLETE returns ok, exhaustion → MaxIterationsExceededError.
// Sister tests/routing/ralph-fallback.test.ts L40-44 ExitError pattern for fixture 12.

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

const NON_COMPLETE_ENVELOPE = {
  type: 'result',
  subtype: 'error',
  result: 'still working but no COMPLETE signal',
}
const COMPLETE_ENVELOPE = {
  type: 'result',
  subtype: 'success',
  result: '<promise>COMPLETE</promise>',
  structured_output: { status: 'COMPLETE' },
}

describe('_dispatchSkillStub.fn — ralph-loop wrap behavior (v3.4.4 Phase 3 Commit 3)', () => {
  beforeEach(() => {
    queryCallCount = 0
    queryResponses = []
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('10. opt-in + non-COMPLETE repeatedly → MaxIterationsExceededError → fail-soft + 3 spawn calls', async () => {
    // 3 non-COMPLETE envelopes queued → ralphLoopWrap exhausts maxIter=3 → throws
    // MaxIterationsExceededError → no fallback config provided → fail-soft return.
    queryResponses = [NON_COMPLETE_ENVELOPE, NON_COMPLETE_ENVELOPE, NON_COMPLETE_ENVELOPE]
    const phase = { id: 'p1', max_iterations: 3 } // opt-in via max_iterations
    const r = await _dispatchSkillStub.fn('phase-p1', phase, { maxIter: 3 })
    expect(r.status).toBe('fail')
    expect(r.output).toMatch(/max-iterations exceeded \(3\)/)
    expect(r.output).toContain('phase-p1')
    expect(queryCallCount).toBe(3) // 3 spawn calls — wrap retried verbatim
  })

  it('11. opt-in + COMPLETE on iter 2 → ok + 2 spawn calls (wrap stops on first COMPLETE)', async () => {
    queryResponses = [NON_COMPLETE_ENVELOPE, COMPLETE_ENVELOPE]
    const phase = { id: 'p1', max_iterations: 5 }
    const r = await _dispatchSkillStub.fn('phase-p1', phase, { maxIter: 5 })
    expect(r.status).toBe('ok')
    expect(queryCallCount).toBe(2) // wrap exited on iter 2 — NOT 5
    // decision should reflect COMPLETE status_output
    expect(r.decision).toBe('COMPLETE')
  })

  it('12. opt-in + fallback config → MaxIterationsExceededError → handleMaxIterationsExceeded fires process.exit(1)', async () => {
    queryResponses = [NON_COMPLETE_ENVELOPE, NON_COMPLETE_ENVELOPE]
    // Mock process.exit to throw ExitError (sister tests/routing/ralph-fallback.test.ts:40-44)
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((code?: number | string | null) => {
        throw new ExitError(typeof code === 'number' ? code : 0)
      })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const phase = {
      id: 'p1',
      max_iterations: 2,
      fallback: {
        max_iterations_exceeded: {
          action: 'emit_warning_and_halt' as const,
          message: '⚠️ ralph-loop max-iterations ({{ args.max_iterations }}) exceeded for phase-p1.',
          exit_code: 1,
        },
      },
    }
    await expect(
      _dispatchSkillStub.fn('phase-p1', phase, {
        maxIter: 2,
        fallback: phase.fallback.max_iterations_exceeded,
      }),
    ).rejects.toThrow(ExitError)
    expect(exitSpy).toHaveBeenCalledWith(1)
    const stderr = errSpy.mock.calls.map((c) => c.join(' ')).join('\n')
    expect(stderr).toMatch(/max-iterations exceeded/i)
    expect(stderr).toContain('phase-p1')
    expect(stderr).toContain('2/2') // err.iterations / ctx.maxIterations format
    expect(queryCallCount).toBe(2) // exhausted maxIter=2
  })
})
