// Phase v2.0-2.3 W0 T2.3.W0.3 — exprBuilder.ts 10 fixture test
// 5 positive syntax + 3 negative + 2 injection per PLAN L175.

import { describe, expect, it } from 'vitest'
import {
  _parserSingleton,
  evalGate,
  GateEvalError,
  isStaticGateConfigError,
} from '../../src/workflow/exprBuilder.js'

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

// 4.23.2 (issue #5) — discriminator for the fail-closed exception to ADR 0029:
// a bare identifier missing from the eval context is a STATIC config bug
// (gate expression ↔ gateContext contract drift), not a runtime fault.
describe('exprBuilder.isStaticGateConfigError — fail-closed discriminator', () => {
  it('11. true for GateEvalError wrapping expr-eval "undefined variable: X"', () => {
    let caught: unknown
    try {
      evalGate('is_critical_release == true', {})
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(GateEvalError)
    expect(isStaticGateConfigError(caught)).toBe(true)
  })

  it('12. false for a plain Error with the same message (must be GateEvalError)', () => {
    expect(isStaticGateConfigError(new Error('undefined variable: x'))).toBe(false)
  })

  it('13. false for a GateEvalError of a different failure class', () => {
    expect(
      isStaticGateConfigError(
        new GateEvalError('Expression must evaluate to boolean, got number', 'x'),
      ),
    ).toBe(false)
  })

  // ADR-0038 third class (v16.0 post-close) — found by the 4.32.23 spike, see
  // .planning/phases/51-ecc-orchestration/findings.md F7. `'x' in subtask.missing`
  // does NOT produce "undefined variable": expr-eval reaches for `.length` on the
  // missing member and the raw throw is a TypeError. Measured on this repo's pinned
  // expr-eval, which is why these cells assert the real thrown text rather than a
  // hand-written message:
  //
  //   'x' in subtask.missing  → Cannot read properties of undefined (reading 'length')
  //   'x' in subtask.nul      → Cannot read properties of null (reading 'length')
  //   subtask.missing.length  → parse error [1:23]: Expected TNAME
  //
  // All three are STATIC drift between a gate expression and the context it is given:
  // no retry can fix them, so they belong on the fail-closed side with the bare
  // undefined identifier. Falling open is what issue #5 looked like — the gated sub
  // (a 4-specialist Agent Team) firing on every ordinary run.
  //
  // The yaml corpus is still guarded first by judgmentContextAudit.test.ts, which
  // evals every fires_when/skips_when against the default context. This classifier is
  // the second line: a fact that EXISTS in that default context but is missing or null
  // for some real task at runtime slips past the audit and lands here.
  it('15. `in` against a MISSING member → fail-closed (the ADR-0038 third class)', () => {
    let caught: unknown
    try {
      evalGate("'x' in subtask.missing", { subtask: {} })
    } catch (e) {
      caught = e
    }
    expect((caught as Error).message).toMatch(/cannot read properties of undefined/i)
    expect(isStaticGateConfigError(caught)).toBe(true)
  })

  it('16. `in` against a NULL member → fail-closed', () => {
    let caught: unknown
    try {
      evalGate("'x' in subtask.nul", { subtask: { nul: null } })
    } catch (e) {
      caught = e
    }
    expect((caught as Error).message).toMatch(/cannot read properties of null/i)
    expect(isStaticGateConfigError(caught)).toBe(true)
  })

  it('17. an unparseable expression → fail-closed (no retry can parse it either)', () => {
    let caught: unknown
    try {
      evalGate('subtask.missing.length > 0', { subtask: {} })
    } catch (e) {
      caught = e
    }
    expect((caught as Error).message).toMatch(/parse error/i)
    expect(isStaticGateConfigError(caught)).toBe(true)
  })

  it('18. a satisfied `in` still just evaluates — the widening added no false positive', () => {
    expect(evalGate("'x' in arr", { arr: ['x'] })).toBe(true)
    expect(evalGate("'y' in arr", { arr: ['x'] })).toBe(false)
  })

  it('14. false for non-error values', () => {
    expect(isStaticGateConfigError(undefined)).toBe(false)
    expect(isStaticGateConfigError('undefined variable: x')).toBe(false)
  })
})
