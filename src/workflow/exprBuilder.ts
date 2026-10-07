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
// fail-soft. The common thread is STATIC drift between a gate expression and the
// context it is handed: no retry can fix it, so treating it as "gate fired" is
// strictly wrong. Failing open is what issue #5 looked like — verify-multispec
// (a 4-specialist Agent Team) firing on every ordinary verify.
// Callers treat this class as gate=false; all other eval errors stay fail-soft.
//
// Three shapes, all measured against this repo's pinned expr-eval rather than
// assumed (ADR-0038 third class, from the 4.32.23 spike —
// .planning/phases/51-ecc-orchestration/findings.md F7):
//
//   1. bare identifier missing  → `undefined variable: <name>`
//   2. `in` on a missing/null member (`'x' in subtask.missing`)
//                               → `Cannot read properties of undefined (reading 'length')`
//                                 (expr-eval reaches for `.length`; the raw throw is a
//                                 TypeError, which is why shape 1's regex missed it and
//                                 the sub kept firing)
//   3. unparseable expression    → `parse error [1:23]: Expected TNAME`
//
// NOT included, deliberately: `Expression must evaluate to boolean, got <t>`. That one
// CAN depend on a fact's runtime type, so it is not necessarily static, and the yaml
// corpus is already guarded against it by the audit below.
//
// Static guard (first line, covers all three for the yaml corpus):
// tests/workflow/judgmentContextAudit.test.ts evals every fires_when / skips_when
// against the default gate context. This classifier is the SECOND line: a fact that
// exists in that default context but is missing or null for some real task at runtime
// slips past the audit and arrives here.
const STATIC_CONFIG_ERROR =
  /undefined variable|cannot read propert(?:y|ies) of (?:undefined|null)|parse error/i

export function isStaticGateConfigError(e: unknown): boolean {
  return e instanceof GateEvalError && STATIC_CONFIG_ERROR.test(e.message)
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
