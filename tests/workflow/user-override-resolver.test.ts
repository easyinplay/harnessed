// tests/workflow/user-override-resolver.test.ts — v3.6.0 Phase 3 Wave 4.
// Verify judgmentResolver user-override bypass (P0b 上半 mechanism shipped Wave 1).
//
// Fixtures (per PHASE-3-SPEC.md L282):
//   F1. bypass when gateRef ∈ context.user_overrides[] → fires=true (skip expr eval)
//   F2. fall-through when gateRef NOT in context.user_overrides[] → normal expr eval
//   F3. empty user_overrides → no-op (no behavior change vs Phase 2 baseline)
//   F4. multi-trigger union dedupe (multiple gateRefs in user_overrides, only matching one fires)
//   F5. bypass independent of fileName (works for all 7 trigger gate yamls)

import { beforeEach, describe, expect, it } from 'vitest'
import { _clearJudgmentCache, resolveJudgmentGate } from '../../src/workflow/judgmentResolver.js'

const PACKAGE_ROOT = process.cwd()

beforeEach(() => {
  _clearJudgmentCache()
})

describe('judgmentResolver — Phase 3 user-override bypass (5 fixtures)', () => {
  it('F1. bypass when gateRef ∈ user_overrides → fires=true (expr eval skipped)', async () => {
    // subtask-gate.brainstorming.fires_when normally requires approaches>=2 etc.
    // Pass context that would normally evaluate FALSE — bypass should override.
    const result = await resolveJudgmentGate(
      'judgments.subtask-gate.brainstorming.fires',
      {
        subtask: {
          approaches: 1,
          core_algorithm: false,
          has_api_contract: false,
          error_cost: 'low',
        },
        user_overrides: ['judgments.subtask-gate.brainstorming.fires'],
      },
      PACKAGE_ROOT,
    )
    expect(result).toBe(true)
  })

  it('F2. fall-through when gateRef NOT in user_overrides → normal expr eval (false here)', async () => {
    // user_overrides[] contains a different gate ref; current ref must fall through.
    const result = await resolveJudgmentGate(
      'judgments.subtask-gate.brainstorming.fires',
      {
        subtask: {
          approaches: 1,
          core_algorithm: false,
          has_api_contract: false,
          error_cost: 'low',
        },
        user_overrides: ['judgments.tdd-gate.tdd-strongly-suggested.fires'],
      },
      PACKAGE_ROOT,
    )
    expect(result).toBe(false)
  })

  it('F3. empty user_overrides → no-op (baseline Phase 2 behavior preserved)', async () => {
    // Empty array — bypass check sees nothing → normal expr eval path.
    const result = await resolveJudgmentGate(
      'judgments.strategic-gate.office-hours.fires',
      { phase: { type: 'new_feature', scope_locked_in_history: false }, user_overrides: [] },
      PACKAGE_ROOT,
    )
    // strategic-gate.office-hours.fires_when on new_feature → true via normal eval.
    expect(result).toBe(true)
  })

  it('F4. multi-trigger user_overrides[] — only matching ref fires via bypass', async () => {
    const overrides = [
      'judgments.subtask-gate.brainstorming.fires',
      'judgments.strategic-gate.office-hours.fires',
      'judgments.stage-routing.discuss-subtask-delegate.fires',
    ]
    // Matching ref → bypass true
    const r1 = await resolveJudgmentGate(
      'judgments.strategic-gate.office-hours.fires',
      // type=bug_fix would normally skip via skips_when, but bypass overrides .fires field
      { phase: { type: 'bug_fix', scope_locked_in_history: true }, user_overrides: overrides },
      PACKAGE_ROOT,
    )
    expect(r1).toBe(true)
    // Non-matching ref (NOT in user_overrides[]) → normal eval path
    const r2 = await resolveJudgmentGate(
      'judgments.phase-gate.gsd-discuss-phase.fires',
      {
        phase: {
          open_decisions: 0,
          has_cross_phase_data_flow: false,
          scope_days: 0,
        },
        user_overrides: overrides,
      },
      PACKAGE_ROOT,
    )
    expect(r2).toBe(false)
  })

  it('F5. bypass works across all 7 trigger gate yaml files (file-name independent)', async () => {
    // Single user_overrides entry per file — verify resolver does not gate the
    // bypass on which yaml the gateRef points to.
    const cases: string[] = [
      'judgments.strategic-gate.office-hours.fires',
      'judgments.phase-gate.gsd-discuss-phase.fires',
      'judgments.subtask-gate.brainstorming.fires',
      'judgments.tdd-gate.tdd-strongly-suggested.fires',
      'judgments.stage-routing.discuss-subtask-delegate.fires',
    ]
    for (const gateRef of cases) {
      const result = await resolveJudgmentGate(
        gateRef,
        // Empty context — would throw on missing fields under normal eval,
        // but bypass returns true before eval is reached.
        { user_overrides: [gateRef] },
        PACKAGE_ROOT,
      )
      expect(result).toBe(true)
    }
  })
})
