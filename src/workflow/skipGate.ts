// src/workflow/skipGate.ts — T2.1 D-5: `delegates_to[].skip_gate` veto.
//
// Audit S2 finding 2: `skips_when` was dead configuration. judgmentResolver has
// supported the `.skips` field since Phase 2.3, but EVERY `delegates_to[].gate`
// in workflows/ pointed at `.fires`, so no skip condition was ever evaluated —
// the ❌ half of each judgment was documentation only. `skip_gate` is the
// declarative wire that turns it on:
//
//   gate fires + no skip_gate        → run   (unchanged)
//   gate fires + skip_gate true      → VETO  (recorded with the skip_gate ref)
//   gate does not fire               → not run (skip_gate never consulted)
//   skip_gate faults (undefined var, → do NOT veto
//     missing trigger/file/expr)
//
// Row 2 is a PRECEDENCE DECISION, not an artifact of the veto running after the
// gate: ❌ beats ✅. The two halves of a judgment are independent criteria over the
// same facts, so a context can satisfy both — the shipped phase-tier criterion
// proves it, since `phase.open_decisions >= 2` (fires) and `phase.scope_days < 1`
// (skips) are both true for a three-decision half-day phase. The tie-break comes
// from the methodology these judgments encode, whose fallback 铁律 is 「拿不准 →
// 倾向跳过」: an ambiguous signal resolves toward NOT running the governance step,
// and then declaring that it was skipped. ✅-wins would invert that rule and turn
// every overlapping context into a gate the operator had explicitly scoped out.
// Locked by tests/workflow/skip-gate-path-parity.test.ts (both engines).
//
// The last row is deliberately the OPPOSITE direction from ADR-0038's
// fail-CLOSED gate handling, and it is the same principle: on a broken config
// harnessed never does MORE than asked, and never silently REMOVES a governance
// step. A veto that fired on a typo'd fact name would delete a gate the operator
// believes is armed, with no signal — the exact failure class T2.1 exists to
// kill. Faults are reported by the caller (gates.ts warns), never acted on.
//
// Own module, not a new export on judgmentResolver: that module is `vi.mock`'d
// with factory mocks in 4 suites, and adding an export there makes every mocker
// hand the consumer `undefined` (project memory: mock-export-gap-extract-module).

import { evalGate } from './exprBuilder.js'
import { resolveJudgmentExpression } from './judgmentResolver.js'

/** Reason string when the skip gate vetoes a fired sub, else null.
 *  NEVER throws — a config fault resolves to "no veto". */
export async function resolveSkipVeto(
  skipGateRef: string | undefined,
  context: Record<string, unknown>,
  packageRoot: string,
): Promise<string | null> {
  if (!skipGateRef) return null
  try {
    const expr = await resolveJudgmentExpression(skipGateRef, packageRoot)
    if (!evalGate(expr, context)) return null
    return `skip_gate ${skipGateRef} = true (skip condition met — sub vetoed despite its gate firing)`
  } catch {
    return null
  }
}
