// Phase 5.2 W0 #BH — extract H1 gate duplicate from 5 CLI files.
// Sister: src/installers/lib/err.ts (Phase 5.1 W0 #BG extract pattern).
//
// 5-site duplicate (install.ts + install-base.ts + research.ts +
// manifest-add.ts + execute-task.ts) consolidated here.
// uninstall.ts uses --yes/--apply variant (NOT --non-interactive) — keep inline.

/**
 * H1 pre-action gate: --non-interactive requires --apply or --dry-run.
 * Exits with code 2 if --non-interactive is set without either flag.
 *
 * v3.0.1 UX flip note: CLI default is now apply-immediate, but the H1 gate
 * is kept verbatim for CI / scripts — explicit intent (`--apply` for execute
 * OR `--dry-run` for preview) is still required to avoid silent surprises
 * in automation。Interactive TTY 使用不受影响 (default apply-immediate)。
 */
export function validateNonInteractiveFlags(
  raw: { nonInteractive?: boolean; apply?: boolean; dryRun?: boolean },
  cmdName: string,
): void {
  if (raw.nonInteractive && !raw.apply && !raw.dryRun) {
    console.error(
      `error: --non-interactive requires --apply or --dry-run\n` +
        `  fix:  'harnessed ${cmdName} --non-interactive --dry-run' or '--apply'`,
    )
    process.exit(2)
  }
}
