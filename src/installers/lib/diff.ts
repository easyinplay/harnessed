// Phase 1.2 unified-diff renderer per ADR 0004 contract 2 + Pattern B + H.
//
// IMPL NOTE (Rule 1 / ASSUMPTIONS C3): jsdiff createPatch() is invoked with
// `stripTrailingCr: true` so a Windows manifest written with CRLF and a Unix
// target file with LF (or vice versa) produces a *stable* diff — not a
// 100%-noise "every line changed" diff. The trailing CR character (\r) at
// end-of-line is normalised away from both sides before line comparison.
//
// IMPL NOTE (Rule 1 / nodejs/node#39673 + GA-2 § B.1): we color via
// picocolors.isColorSupported (NOT process.stdout.isTTY directly). On
// Windows under Git-Bash, isTTY returns `undefined` instead of `true|false`,
// which would silently disable color for a real interactive shell. picocolors
// already combines isTTY ?? false || env.FORCE_COLOR / NO_COLOR / TERM=dumb
// into one boolean — trust it.

import { createPatch } from 'diff'
import pc from 'picocolors'
import type { DiffFile, DiffPlan, InstallContext } from './types.js'

// ADR 0004 § 2 — long diffs are folded by default to keep terminal scrollback
// reasonable; user passes --full-diff to expand.
const FOLD_THRESHOLD = 200
const FOLD_HEAD = 100

function colorize(line: string): string {
  if (!pc.isColorSupported) return line
  if (line.startsWith('+') && !line.startsWith('+++')) return pc.green(line)
  if (line.startsWith('-') && !line.startsWith('---')) return pc.red(line)
  if (line.startsWith('@@')) return pc.cyan(line)
  return line
}

function diffOneFile(file: DiffFile): { lines: string[]; added: number; removed: number } {
  const patch = createPatch(file.target, file.oldText, file.newText, '', '', {
    stripTrailingCr: true,
  })
  const lines = patch.split('\n')
  let added = 0
  let removed = 0
  for (const ln of lines) {
    if (ln.startsWith('+') && !ln.startsWith('+++')) added++
    else if (ln.startsWith('-') && !ln.startsWith('---')) removed++
  }
  return { lines, added, removed }
}

export function renderDiff(plan: DiffPlan, ctx: InstallContext): string {
  if (plan.files.length === 0) return '(no file changes)\n'

  const out: string[] = []
  let totalAdded = 0
  let totalRemoved = 0

  for (const file of plan.files) {
    const { lines, added, removed } = diffOneFile(file)
    totalAdded += added
    totalRemoved += removed

    const folded = !ctx.opts.fullDiff && lines.length > FOLD_THRESHOLD
    const visible = folded ? lines.slice(0, FOLD_HEAD) : lines
    for (const ln of visible) out.push(colorize(ln))
    if (folded) {
      const more = lines.length - FOLD_HEAD
      out.push(pc.dim(`... ${more} more lines (use --full-diff to expand)`))
    }
  }

  // ADR 0004 § 2 summary line — appended at the bottom so user always sees it.
  const summary = `will modify ${plan.files.length} file${plan.files.length === 1 ? '' : 's'} (${totalAdded} added, ${totalRemoved} removed)`
  out.push('')
  out.push(pc.bold(summary))

  return `${out.join('\n')}\n`
}
