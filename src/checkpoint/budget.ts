// src/checkpoint/budget.ts — T2.7 D-2: the iteration budget gets an EXECUTOR.
//
// `workflows/defaults.yaml:11 ralph_max_iterations` has shipped since v2.0 as a
// template value with no enforcement on any live path: it was interpolated into
// workflow.yaml (`{{ defaults.ralph_max_iterations.task-test.01-test }}`) for
// `harnessed run` — the path every SKILL forbids — and echoed in the
// `harnessed prompt --json` payload for the upstream ralph-loop plugin to honor. On a
// machine with no plugin installed, nothing consumed it.
//
// The ledger already counts per-sub attempts: `SubProgressEntry.fail_count`, the same
// counter BREAK-LOOP reads (src/cli/checkpoint.ts BREAK-LOOP / breakLoop.ts). Same
// counting source, second threshold — an escalation ladder rather than a new counter:
//   fail_count >= LOOP_THRESHOLD (3)  → BREAK-LOOP, advisory: stop, do root cause
//   fail_count >= attempt budget      → BUDGET-EXHAUSTED, directive: stop spawning
//
// Resolution is deliberately fail-OPEN: an unreadable table or an unknown sub yields
// the generic default rather than a small number, because a false hard stop is worse
// than a late one.

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

/** Applied when the table has no usable entry for the sub. Mirrors the
 *  `harnessed prompt` default so both surfaces agree on an un-tabled sub. */
export const DEFAULT_ATTEMPT_BUDGET = 20

/** Ceiling for any resolved budget (defaults.yaml `hard_upper_limit`, Phase 2.2
 *  STRIDE T-2.2-05 DoS mitigation). Used when the table omits its own. */
export const FALLBACK_HARD_UPPER_LIMIT = 100

interface DefaultsDoc {
  ralph_max_iterations?: Record<string, unknown>
  hard_upper_limit?: unknown
}

/** Numbers reachable from one table entry (a plain number, or the phase map's values). */
function entryValues(entry: unknown): number[] {
  if (typeof entry === 'number' && Number.isFinite(entry)) return [entry]
  if (entry && typeof entry === 'object') {
    return Object.values(entry as Record<string, unknown>).filter(
      (v): v is number => typeof v === 'number' && Number.isFinite(v),
    )
  }
  return []
}

/** Table keys are FULL workflow names (`task-test`, `verify-progress`) while the
 *  ledger's `sub` is the leaf name `delegates_to` uses (`test`, `progress` — see
 *  workflows/task/auto/workflow.yaml:54, workflows/verify/auto/workflow.yaml:53).
 *  Both spellings reach `checkpoint fail` in practice (compare the `sub` values in
 *  fixtures/eval/checkpoint-fail-envelope vs fixtures/eval/serial-order-guard), so an
 *  exact hit wins and a leaf name falls back to the `<stage>-<leaf>` keys.
 *
 *  A leaf can be ambiguous — `phase` is both `discuss-phase` and `plan-phase` — so the
 *  suffix branch unions the candidates and the caller takes the MAX, which is the same
 *  fail-open rule this module already applies across phases: a too-generous ceiling is
 *  a late stop, a too-small one is a false hard stop. */
function tableValues(table: Record<string, unknown>, sub: string): number[] {
  const exact = entryValues(table[sub])
  if (exact.length > 0) return exact
  const suffix = `-${sub}`
  return Object.keys(table)
    .filter((k) => k.endsWith(suffix))
    .flatMap((k) => entryValues(table[k]))
}

/** Per-sub attempt ceiling from `ralph_max_iterations`.
 *
 *  The table is keyed `<workflow>.<phase>` while the ledger counts attempts per SUB
 *  (one level coarser), so a multi-phase sub resolves to the MAX of its phase values:
 *  any single phase is permitted that many iterations, and the coarser counter must
 *  not stop the sub before its most generous phase would have. A plain-number entry
 *  is taken as-is. Result is clamped to `hard_upper_limit`.
 *
 *  Every failure mode (missing file, bad yaml, unknown sub, non-numeric values)
 *  degrades to DEFAULT_ATTEMPT_BUDGET. */
export async function resolveAttemptBudget(sub: string, packageRoot: string): Promise<number> {
  try {
    const doc = parseYaml(
      await readFile(resolve(packageRoot, 'workflows', 'defaults.yaml'), 'utf8'),
    ) as DefaultsDoc | null
    const cap =
      typeof doc?.hard_upper_limit === 'number' && Number.isFinite(doc.hard_upper_limit)
        ? doc.hard_upper_limit
        : FALLBACK_HARD_UPPER_LIMIT
    const values = tableValues(doc?.ralph_max_iterations ?? {}, sub)
    if (values.length > 0) return Math.min(Math.max(...values), cap)
    return DEFAULT_ATTEMPT_BUDGET
  } catch {
    return DEFAULT_ATTEMPT_BUDGET
  }
}

/** Inclusive: spending the last permitted attempt exhausts the budget. */
export function isBudgetExhausted(attempts: number, budget: number): boolean {
  return attempts >= budget
}
