// Phase v2.0-2.3 W0 T2.3.W0.3 — exprBuilder.ts 10 fixture test
// 5 positive syntax + 3 negative + 2 injection per PLAN L175.

import { describe, expect, it } from 'vitest'
import { _parserSingleton, evalGate, GateEvalError } from '../../src/workflow/exprBuilder.js'

describe('exprBuilder.evalGate — positive syntax (5)', () => {
  it('1. string == comparison: phase.type == "new_feature"', () => {
    expect(evalGate("phase.type == 'new_feature'", { phase: { type: 'new_feature' } })).toBe(true)
  })

  it('2. numeric >= comparison: phase.open_decisions >= 2', () => {
    expect(evalGate('phase.open_decisions >= 2', { phase: { open_decisions: 3 } })).toBe(true)
  })

  it('3. in operator with array literal', () => {
    expect(
      evalGate("phase.type in ['new_feature', 'new_milestone']", {
        phase: { type: 'new_feature' },
      }),
    ).toBe(true)
  })

  it('4. logical and / or operators (lowercase per expr-eval grammar)', () => {
    // Rule 1 — RESEARCH § 1.2 声称 ALL-CAPS AND/OR 是同义,实测 expr-eval 2.0.2
    // 仅接受小写 and/or (uppercase 抛 parse error [1:6] Expected EOF)。Fixture
    // 对齐实际 grammar; PLAN L178 acceptance criterion b 同步小写化。
    expect(evalGate('a and b', { a: true, b: true })).toBe(true)
    expect(evalGate('a or b', { a: false, b: true })).toBe(true)
  })

  it('5. mixed and + comparison + dot-access (acceptance criterion b)', () => {
    expect(
      evalGate("phase.type == 'new_feature' and phase.open_decisions >= 2", {
        phase: { type: 'new_feature', open_decisions: 3 },
      }),
    ).toBe(true)
  })
})

describe('exprBuilder.evalGate — negative (3)', () => {
  it('6. unbound variable throws GateEvalError', () => {
    expect(() => evalGate('undefined_var == 1', {})).toThrow(GateEvalError)
  })

  it('7. assignment attempt throws GateEvalError (acceptance criterion c)', () => {
    expect(() => evalGate('assignment_attempt = 1', {})).toThrow(GateEvalError)
  })

  it('8. function call attempt throws GateEvalError', () => {
    expect(() => evalGate("eval('process.exit')", {})).toThrow(GateEvalError)
  })
})

describe('exprBuilder.evalGate — injection lockdown (2)', () => {
  it('9. assignment-style injection `phase.type = "admin"` throws GateEvalError', () => {
    expect(() => evalGate("phase.type = 'admin'", { phase: { type: 'user' } })).toThrow(
      GateEvalError,
    )
  })

  it('10. Parser singleton identity (acceptance criterion e)', () => {
    expect(_parserSingleton).toBe(_parserSingleton)
  })
})
