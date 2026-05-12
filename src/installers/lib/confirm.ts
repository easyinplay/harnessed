// Phase 1.2 4-level confirm wrapper per ADR 0004 contract 4 + Pattern C + H.
//
// IMPL NOTE (Rule 1 / GA-2 § B.3): every Clack prompt call MUST be guarded
// with `p.isCancel(ans)` immediately after await — otherwise Ctrl-C / ESC
// silently returns a Symbol() value that flows downstream as a truthy
// non-boolean and corrupts the install decision (terkelg/prompts has the
// same footgun; Clack v0.10 inherited it but exposes isCancel guard).
//
// IMPL NOTE (ADR 0004 contract 4): four risk levels map to four prompt
// shapes:
//   L1 (read-only / project-scope safe write) → just `note()` print, auto-yes
//   L2 (project-scope mutation, e.g. .mcp.json append) → single `confirm()`
//   L3 (user-scope mutation, e.g. ~/.claude.json) → confirm() × 2 — second
//      message MUST mention shared-state side effects on other plugins
//   L4 (system-wide / global npm install) → require explicit `--system`
//      flag at CLI; if missing, refuse without prompt + print educational
//      "use --system to opt in" hint (no L4 manifest may auto-apply)
//
// nonInteractive mode (CI / scripts): skip all prompts; honor ctx.opts.apply
// for L1/L2/L3 (apply=true → proceed; apply=false → dry-run yields proceed:
// true so caller computes plan but does not execute), while L4 still
// requires --system (security flag, not a UX decision).

import * as p from '@clack/prompts'
import type { InstallContext, Level } from './types.js'

export type ConfirmReason = 'user-cancel' | 'flag-missing'

export interface ConfirmOutcome {
  proceed: boolean
  reason?: ConfirmReason
}

export async function confirmAt(level: Level, ctx: InstallContext): Promise<ConfirmOutcome> {
  // L4 — system flag gate, runs first (must short-circuit before any prompt).
  if (level === 'L4' && !ctx.opts.system) {
    if (!ctx.opts.nonInteractive) {
      p.note(
        'this method requires --system flag (e.g. global npm install affects machine PATH); pass --system to opt in.',
        'L4 system-wide install',
      )
    }
    return { proceed: false, reason: 'flag-missing' }
  }

  // Non-interactive: skip prompts, decide from --apply.
  if (ctx.opts.nonInteractive) {
    return { proceed: ctx.opts.apply }
  }

  if (level === 'L1') {
    p.note('will write project-local files only (safe scope).', 'L1 confirm')
    return { proceed: true }
  }

  if (level === 'L2') {
    const ans = await p.confirm({ message: 'Proceed with install?', initialValue: false })
    if (p.isCancel(ans)) return { proceed: false, reason: 'user-cancel' }
    return { proceed: ans === true }
  }

  if (level === 'L3') {
    const first = await p.confirm({ message: 'Proceed with install?', initialValue: false })
    if (p.isCancel(first)) return { proceed: false, reason: 'user-cancel' }
    if (first !== true) return { proceed: false }

    const second = await p.confirm({
      message:
        'This affects other plugins (e.g. ~/.claude.json is shared user-scope state). Confirm again?',
      initialValue: false,
    })
    if (p.isCancel(second)) return { proceed: false, reason: 'user-cancel' }
    return { proceed: second === true }
  }

  // L4 with --system flag → single high-stakes confirm.
  const ans = await p.confirm({
    message: 'System-wide install will modify global PATH. Proceed?',
    initialValue: false,
  })
  if (p.isCancel(ans)) return { proceed: false, reason: 'user-cancel' }
  return { proceed: ans === true }
}
