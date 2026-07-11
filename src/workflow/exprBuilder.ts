// Phase v2.0-2.3 W0 T2.3.W0.3 (D-03 + R20.3 + RESEARCH § 1.3) — expr-eval gate
// evaluator with locked-down operators (Phase 2.2 STRIDE T-2.2-02 yaml-injection
// mitigation: disable add/subtract/multiply/divide/assignment; keep only
// logical/comparison/in). Module-level Parser singleton per PLAN-ENG-REVIEW
// § 4 LOW perf recommendation (avoid hot-path Parser rebuild).

import { Parser, type Values } from 'expr-eval'

const PARSER_OPTIONS = {
  operators: {
    add: false,
    subtract: false,
    multiply: false,
    divide: false,
    logical: true,
    comparison: true,
    in: true,
    assignment: false,
  },
} as const

// Module-level singleton — re-used across all evalGate calls. Test-only export
// for identity assertion (acceptance criterion e).
const _parserSingleton = new Parser(PARSER_OPTIONS)

export class GateEvalError extends Error {
  constructor(
    message: string,
    public readonly expression: string,
  ) {
    super(message)
    this.name = 'GateEvalError'
  }
}

// 4.23.2 (issue #5) — discriminator for the fail-closed carve-out to ADR 0029
// fail-soft. expr-eval throws `undefined variable: <name>` when a BARE
// identifier is missing from the eval context: that is a STATIC config bug
// (gate expression ↔ gateContext contract drift), not a runtime fault.
// Failing open on it turns the gated sub into the default path — issue #5:
// verify-multispec (4-specialist Agent Team) fired on every ordinary verify.
// Callers treat this class as gate=false; all other eval errors stay fail-soft.
// Static guard: tests/workflow/judgmentContextAudit.test.ts.
export function isUndefinedVariableError(e: unknown): boolean {
  return e instanceof GateEvalError && /undefined variable/i.test(e.message)
}

export function evalGate(expression: string, context: Record<string, unknown>): boolean {
  try {
    const parsed = _parserSingleton.parse(expression)
    // expr-eval `Values` interface accepts boolean at runtime even though the
    // declared `Value` union only lists number/string/function/nested-record —
    // 10 W0.3 fixture verify boolean propagation works. Cast preserves runtime
    // contract without forcing all callers to narrow their context types.
    const result = parsed.evaluate(context as unknown as Values)
    if (typeof result !== 'boolean') {
      throw new GateEvalError(
        `Expression must evaluate to boolean, got ${typeof result}`,
        expression,
      )
    }
    return result
  } catch (err) {
    if (err instanceof GateEvalError) throw err
    throw new GateEvalError(`Gate eval failed: ${(err as Error).message}`, expression)
  }
}

export { _parserSingleton }
