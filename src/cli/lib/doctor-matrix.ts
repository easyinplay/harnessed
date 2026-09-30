// v16.0 Phase 66 T5 — the doctor check × host matrix (pure data + render).
//
// Why a separate module: doctor.ts is a thin dispatcher under a ≤225L budget, and
// the matrix needs BOTH a status-folding rule and a table renderer that deserve
// unit tests without dispatching 48 real checks. Everything here is pure —
// no fs, no spawn, no `detectPlatform()`.
//
// The `skipped` rule lives here and nowhere else (`summarise`): a skipped check is
// neither a pass nor a fail, so it can never flip the summary word or the exit
// code. That is the whole point of promoting it out of the fake `pass` those
// host-inapplicable early returns used to wear — the row now SAYS it did not run
// instead of claiming a green it never earned.
//
// Matrix semantics: a cell is `null` when the registry never declared that host
// for that check, rendered as `n/a` and never run. So a cell whose status IS
// `skipped` is a DRIFT SIGNAL — the registry claimed a host that the check's own
// early-return logic rejects. That makes `harnessed doctor --matrix --json` the
// self-audit surface for the host annotations in doctor-registry.ts.

import type { CheckResult } from './check-builtin.js'
import type { HostId } from './hostPrimitives.js'

/** Every status a check can report, `skipped` included. */
export type CheckStatus = CheckResult['status']

/** The three-tier verdict a whole run folds down to (no `skipped` tier). */
export type MatrixSummary = 'pass' | 'warn' | 'fail'

/** Rendered in a cell the registry never declared for that host. */
export const NOT_APPLICABLE = 'n/a'

/** The label of the trailing summary row (also reserves width in column 1). */
const SUMMARY_ROW = 'summary'

/** The header label of the check-name column. */
const CHECK_COL = 'check'

/** Gap between columns. Two spaces — wide enough to read, narrow enough that 24
 *  rows × 2 hosts still fits an 80-column terminal. */
const GUTTER = '  '

/** One check's outcome under one host. */
export interface MatrixCell {
  status: CheckStatus
  message: string
  fix?: string
}

/** One matrix row: a check, the hosts it declares, and its per-host cells.
 *  `cells[host] === null` ⇔ host ∉ hosts ⇔ the check was not run there. */
export interface MatrixRow {
  name: string
  hosts: readonly HostId[]
  cells: Record<HostId, MatrixCell | null>
}

/** The whole cross-host view, as emitted by `doctor --matrix --json`. */
export interface DoctorMatrix {
  hosts: readonly HostId[]
  checks: readonly MatrixRow[]
  summary: Record<HostId, MatrixSummary>
}

/**
 * Fold a set of check statuses into the run verdict.
 *
 * `fail` > `warn` > `pass`; `skipped` contributes NOTHING. An empty set is a
 * pass — "no check applied to this host" is not a health problem.
 */
export function summarise(results: readonly { status: CheckStatus }[]): MatrixSummary {
  if (results.some((r) => r.status === 'fail')) return 'fail'
  if (results.some((r) => r.status === 'warn')) return 'warn'
  return 'pass'
}

/** The token printed in a cell. */
function token(cell: MatrixCell | null): string {
  return cell === null ? NOT_APPLICABLE : cell.status
}

/** Left-align `text` in `width` columns. */
function pad(text: string, width: number): string {
  return text + ' '.repeat(Math.max(0, width - text.length))
}

/**
 * Render the matrix as a fixed-width table: one row per check, one column per
 * host, plus a trailing `summary` row.
 *
 * Status WORDS, not glyphs — the table is the surface a reader scans for "does
 * this check even apply over there", and `pass / warn / fail / skipped / n/a`
 * needs no legend beyond the one line explaining `n/a`. Column widths are
 * measured from the content (header, every cell, and the summary row) so adding
 * a longer check name never breaks alignment; every line is right-trimmed so the
 * output diffs cleanly.
 *
 * `legend` is passed IN rather than inlined so this module stays pure (no i18n,
 * no fs) and the English text keeps exactly one home — `doctor.matrix.legend` in
 * messages/*.json, which src/cli/doctor.ts resolves. It is appended verbatim, so
 * the caller's string owns its own leading blank line (sister `doctor.summary.*`).
 */
export function renderMatrix(m: DoctorMatrix, legend: string): string {
  const nameW = Math.max(
    CHECK_COL.length,
    SUMMARY_ROW.length,
    ...m.checks.map((c) => c.name.length),
  )
  const colW = m.hosts.map((h) =>
    Math.max(h.length, m.summary[h].length, ...m.checks.map((c) => token(c.cells[h]).length)),
  )
  const line = (first: string, cells: readonly string[]): string =>
    [pad(first, nameW), ...cells.map((c, i) => pad(c, colW[i] ?? c.length))].join(GUTTER).trimEnd()
  const rule = line(
    '-'.repeat(nameW),
    colW.map((w) => '-'.repeat(w)),
  )

  return [
    line(
      CHECK_COL,
      m.hosts.map((h) => h),
    ),
    rule,
    ...m.checks.map((c) =>
      line(
        c.name,
        m.hosts.map((h) => token(c.cells[h])),
      ),
    ),
    rule,
    line(
      SUMMARY_ROW,
      m.hosts.map((h) => m.summary[h]),
    ),
    legend,
  ].join('\n')
}
