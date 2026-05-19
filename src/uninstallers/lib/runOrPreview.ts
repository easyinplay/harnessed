// Phase 5.2 W0 #BI — extract dry-run gate duplicate from 7 installer files.
// Sister: src/installers/lib/err.ts (Phase 5.1 W0 #BG extract pattern).
//
// 7-site duplicate pattern (npmCli + mcpStdioAdd + mcpHttpAdd +
// ccPluginMarketplace + gitCloneWithSetup + npxSkillInstaller + ccHookAdd):
//   if (ctx.opts.dryRun) return { aborted: true, reason: 'user-cancel' }
//
// Used by all 7 src/uninstallers/*.ts (Wave 1 T1.2).
// NOT used by installers/ — installer files unchanged Phase 5.2.

/** Minimal context shape — expanded by src/uninstallers/lib/types.ts (T1.1). */
interface DryRunCtx {
  opts: { dryRun: boolean }
}

/** Dry-run abort result — mirrors UninstallResult aborted variant (T1.1). */
type AbortResult = { aborted: true; reason: 'dry-run' }

/**
 * Returns an abort result if ctx.opts.dryRun is true, otherwise null.
 * Callers: `const abort = dryRunGate(ctx); if (abort) return abort`
 */
export function dryRunGate(ctx: DryRunCtx): AbortResult | null {
  if (ctx.opts.dryRun) return { aborted: true, reason: 'dry-run' }
  return null
}
