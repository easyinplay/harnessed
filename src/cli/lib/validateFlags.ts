// Phase 5.2 W0 #BH — extract H1 gate duplicate from 5 CLI files.
// Sister: src/installers/lib/err.ts (Phase 5.1 W0 #BG extract pattern).
//
// 5-site duplicate (install.ts + install-base.ts + research.ts +
// manifest-add.ts + execute-task.ts) consolidated here.
// uninstall.ts uses --yes/--dry-run variant (NOT --non-interactive) — keep inline.
//
// v3.3.0 cleanup — `--apply` backward-compat alias removed (v3.0.1
// introduced, now redundant since default is apply-immediate)。H1 gate 仅
// 检测 --dry-run opt-in 与否 — 默认即 apply,non-interactive 无需额外 flag。

/**
 * H1 pre-action gate (v3.3.0 simplified): --non-interactive is always
 * compatible with the apply-immediate default; --dry-run is opt-in preview。
 * This function is now a no-op kept for backward-compat call-site shape;
 * --non-interactive alone proceeds with apply-immediate semantics。
 */
export function validateNonInteractiveFlags(
  _raw: { nonInteractive?: boolean; dryRun?: boolean },
  _cmdName: string,
): void {
  // v3.3.0: --non-interactive default == apply-immediate (sister interactive TTY)。
  // No flag combination is invalid; @clack/prompts confirmAt deadlock no longer
  // a risk because confirm prompts are bypassed when nonInteractive=true。
}
