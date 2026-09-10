// Phase 58 — the brainstorming skip must not be an unconditional veto.
//
// Before this phase `skips_when` was `type in ['crud','standard_lib_call'] or
// lines < 20`, evaluated independently of every risk fact. Measured on the real
// engine, a subtask with approaches=3 / core_algorithm=true /
// has_api_contract=true / error_cost='high' was still vetoed at lines=15 ("sub
// vetoed despite its gate firing") and fired at lines=25 — ten lines flipped a
// governance gate.
//
// The bug was encoding the SYMPTOM instead of the condition: ~/.claude CLAUDE.md
// says "常规 CRUD" and "单一明显实现（< 20 行 / 一个文件）", where small size is a
// MODIFIER on "single obvious implementation", not the criterion itself. With
// approaches >= 2 the implementation is by definition not obvious.
//
// These cells run the REAL workflows/judgments/subtask-gate.yaml through the real
// resolver — no fixture yaml — so a future edit to that file has to keep them true.

import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildDefaultGateContext } from '../../src/cli/lib/gateContext.js'
import { resolveJudgmentGate } from '../../src/workflow/judgmentResolver.js'

const PACKAGE_ROOT = resolve(__dirname, '../..')
const FIRES = 'judgments.subtask-gate.brainstorming.fires'
const SKIPS = 'judgments.subtask-gate.brainstorming.skips'

/** Every risk signal on. */
const HIGH_RISK = {
  approaches: 3,
  core_algorithm: true,
  has_api_contract: true,
  error_cost: 'high',
}
/** Every risk signal off — a genuinely single, obvious implementation. */
const NO_RISK = {
  approaches: 1,
  core_algorithm: false,
  has_api_contract: false,
  error_cost: 'low',
}

/** The sub runs iff `gate && !skip_gate` — see workflows/task/auto/workflow.yaml. */
async function clarifyRuns(subtask: Record<string, unknown>): Promise<boolean> {
  const ctx = buildDefaultGateContext('t', 'task')
  ctx.subtask = { ...ctx.subtask, ...subtask }
  const fires = await resolveJudgmentGate(FIRES, ctx, PACKAGE_ROOT)
  const skips = await resolveJudgmentGate(SKIPS, ctx, PACKAGE_ROOT)
  return fires && !skips
}

describe('subtask-gate.brainstorming — the skip is conjoined, not a veto', () => {
  it('1. tiny AND high-risk → RUNS (the regression: 15 lines used to veto every risk signal)', async () => {
    expect(await clarifyRuns({ lines: 15, type: 'general', ...HIGH_RISK })).toBe(true)
  })

  it('2. tiny AND no-risk → skipped (a genuinely obvious one-file change)', async () => {
    expect(await clarifyRuns({ lines: 15, type: 'general', ...NO_RISK })).toBe(false)
  })

  it('3. crud AND high-risk → RUNS (the type label is not a licence to skip either)', async () => {
    expect(await clarifyRuns({ lines: 500, type: 'crud', ...HIGH_RISK })).toBe(true)
  })

  it('4. crud AND no-risk → skipped (routine CRUD, which is what the rule meant)', async () => {
    expect(await clarifyRuns({ lines: 500, type: 'crud', ...NO_RISK })).toBe(false)
  })

  it('5. tiny AND only approaches>=2 → RUNS ("≥2 approaches" is the first line of the criteria)', async () => {
    // The narrower fix — dropping only core_algorithm/error_cost from the skip —
    // would still have vetoed this one.
    expect(
      await clarifyRuns({
        lines: 15,
        type: 'general',
        approaches: 3,
        core_algorithm: false,
        has_api_contract: false,
        error_cost: 'low',
      }),
    ).toBe(true)
  })

  it('6. seeded defaults (nothing measured) still RUN — unknown must not delete the gate', async () => {
    // The seeded `approaches: 2` / `has_api_contract: true` pins are what make the
    // skip's conjunction false when no facts were supplied. Withdrawing them as
    // well would turn every fires_when arm false and silently delete the gate by
    // default (ADR-0038), which is why this phase changed only the expression.
    const ctx = buildDefaultGateContext('t', 'task')
    const fires = await resolveJudgmentGate(FIRES, ctx, PACKAGE_ROOT)
    const skips = await resolveJudgmentGate(SKIPS, ctx, PACKAGE_ROOT)
    expect(fires).toBe(true)
    expect(skips).toBe(false)
  })

  it('7. lines 15 vs 25 no longer flips the outcome on their own', async () => {
    const small = await clarifyRuns({ lines: 15, type: 'general', ...HIGH_RISK })
    const bigger = await clarifyRuns({ lines: 25, type: 'general', ...HIGH_RISK })
    expect(small).toBe(bigger)
  })
})
