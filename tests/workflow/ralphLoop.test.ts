// Phase v3.4.4 Phase 3 Commit 2 — isRalphLoopOptIn + resolveMaxIterations unit tests.
// Sister tests/workflow/loadPhases.test.ts pattern (pure-function fixtures, no
// SDK mock). Fixtures 10-12 (wrap behavior inside `_dispatchSkillStub.fn` with
// vi.mock SDK) land in Phase 3 Commit 3 once the wrap exists.
//
// Fixtures (per PHASE-3-SPEC L325-335):
//   1. isRalphLoopOptIn — phase with `max_iterations` (Number) → true
//   2. isRalphLoopOptIn — phase with `fallback.max_iterations_exceeded` only → true
//   3. isRalphLoopOptIn — phase with `upstream: 'ralph-loop'` only → true
//   4. isRalphLoopOptIn — phase with none of the three signals → false
//   5. resolveMaxIterations — CLI flag in gateContext.maxIterations wins over phase yaml
//   6. resolveMaxIterations — phase yaml wins when no CLI flag
//   7. resolveMaxIterations — hardcoded 20 fallback (CLI absent, yaml absent)
//   8. resolveMaxIterations — JINJA string '5' coerces to 5
//   9. resolveMaxIterations — clamp at hard_upper_limit 100 (CLI=500 → 100)

import { describe, expect, it } from 'vitest'
import { isRalphLoopOptIn, resolveMaxIterations } from '../../src/workflow/run.js'

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
