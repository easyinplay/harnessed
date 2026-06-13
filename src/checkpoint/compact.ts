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

// Phase 14 — real compaction: evict resolved ledger entries, keep pending.
import type { SubProgressEntryType } from './schema/currentWorkflow.v1.js'
import { readCurrentWorkflow, writeCurrentWorkflow } from './state.js'

export interface CompactLedgerResult {
  kept: SubProgressEntryType[]
  evicted: number
  pct_saved: number
}

/** Evict resolved (done/skipped/failed/rejected) sub-progress entries, keep pending.
 *  Pure function — no I/O. Returns kept array + reduction metrics. */
export function compactLedger(entries: SubProgressEntryType[]): CompactLedgerResult {
  if (entries.length === 0) return { kept: [], evicted: 0, pct_saved: 0 }
  const kept = entries.filter((e) => e.status === 'pending')
  const evicted = entries.length - kept.length
  const pct_saved = Math.round((evicted / entries.length) * 100)
  return { kept, evicted, pct_saved }
}

export interface CompactWorkflowResult extends CompactLedgerResult {
  phase: string
}

/** Read current-workflow.json, evict resolved ledger entries, write back.
 *  Returns reduction metrics. No-op when no active workflow or ledger is empty. */
export async function compactWorkflow(): Promise<CompactWorkflowResult> {
  const wf = await readCurrentWorkflow()
  if (!wf) return { kept: [], evicted: 0, pct_saved: 0, phase: '(none)' }
  const result = compactLedger(wf.sub_progress ?? [])
  if (result.evicted > 0) {
    await writeCurrentWorkflow({ ...wf, sub_progress: result.kept })
  }
  return { ...result, phase: wf.phase }
}
