// Phase 3.1 W4 T4.2 — compact threshold placeholder (RESEARCH § 7 推 75%).
// Sister Claude Code "noisy workflow" override 50% + 平日 70% 中间; harnessed
// compact subcommand 推 Phase 3.4 (token budget 监控 + auto-fold turns).
// Phase 3.1 MVP: judge-only — trigger consumer not wired (no spawn yet).

export const DEFAULT_THRESHOLD_PCT = 75
export const DEFAULT_CONTEXT_WINDOW = 200_000 // sonnet/opus 4.x baseline; 1M ctx defer Phase 3.4

export interface CompactOpts {
  contextWindow?: number
  thresholdPct?: number
}

/** True when currentTokens ≥ thresholdPct% of contextWindow. */
export function shouldCompact(currentTokens: number, opts: CompactOpts = {}): boolean {
  const cw = opts.contextWindow ?? DEFAULT_CONTEXT_WINDOW
  const pct = opts.thresholdPct ?? DEFAULT_THRESHOLD_PCT
  if (cw <= 0) return false // avoid division by zero / negative budget
  return currentTokens >= (cw * pct) / 100
}

/** Placeholder — Phase 3.4 ships actual compact (turn fold + checkpoint refresh). */
export function compact(_currentTokens: number, _opts: CompactOpts = {}): void {
  console.warn('[compact] threshold-only MVP — Phase 3.4 ships actual fold logic.')
}
