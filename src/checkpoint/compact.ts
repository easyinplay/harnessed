// Phase 3.1 W4 T4.2 — compact threshold (RESEARCH § 7 推 75%).
// Phase 14 — made real: `compactLedger` (pure summarize+evict of resolved
// sub-progress) + `compactWorkflow` (read-modify-write) + `shouldAutoCompact`
// (auto-trigger gate). G6 invariant: entries with fail_count>0 are NEVER evicted,
// so breakLoop's loop signal is never summarized away (the placeholder that
// preceded this lost that signal — see _rogue-impl-reference F1).

import type { SubProgressEntryType } from './schema/currentWorkflow.v1.js'
import { readCurrentWorkflow, writeCurrentWorkflow } from './state.js'

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

/** Auto-trigger gate: only when a caller-supplied conversation token count crosses
 *  the shouldCompact threshold. Undefined tokens → false (silent no-op; never
 *  fabricate a count). Reuses shouldCompact — no separate threshold path. */
export function shouldAutoCompact(currentTokens?: number, opts: CompactOpts = {}): boolean {
  return currentTokens != null && shouldCompact(currentTokens, opts)
}

export interface CompactLedgerResult {
  kept: SubProgressEntryType[]
  evicted: number
  by_status: Record<string, number>
  before_tokens: number
  after_tokens: number
  pct_saved: number
  digest: string
}

/** ~4 chars/token heuristic (sister: check-token-budget.ts), zero-dep. */
function estTokens(x: unknown): number {
  return Math.ceil(Buffer.byteLength(JSON.stringify(x) ?? '', 'utf8') / 4)
}

/** An entry is evictable iff it is terminal-resolved AND carries no failure signal.
 *  fail_count>0 entries are preserved unconditionally so breakLoop (G6) keeps
 *  seeing the loop — even when the entry's status is 'done'. */
function isEvictable(e: SubProgressEntryType): boolean {
  if ((e.fail_count ?? 0) > 0) return false
  return e.status === 'done' || e.status === 'skipped' || e.status === 'rejected'
}

/** Pure — summarize + evict resolved sub-progress entries. Returns the kept
 *  ledger, an eviction digest, and a REAL token-reduction metric (not entry %). */
export function compactLedger(entries: SubProgressEntryType[]): CompactLedgerResult {
  const before_tokens = estTokens(entries)
  const kept = entries.filter((e) => !isEvictable(e))
  const evictedEntries = entries.filter(isEvictable)
  const by_status: Record<string, number> = {}
  for (const e of evictedEntries) by_status[e.status] = (by_status[e.status] ?? 0) + 1
  const after_tokens = estTokens(kept)
  const pct_saved =
    before_tokens > 0 ? Math.round(((before_tokens - after_tokens) / before_tokens) * 100) : 0
  const parts = Object.entries(by_status).map(([s, n]) => `${s}:${n}`)
  const digest =
    evictedEntries.length === 0
      ? 'compacted 0 entries'
      : `compacted ${evictedEntries.length} entries (${parts.join(' ')})`
  return {
    kept,
    evicted: evictedEntries.length,
    by_status,
    before_tokens,
    after_tokens,
    pct_saved,
    digest,
  }
}

export interface CompactWorkflowResult extends CompactLedgerResult {
  phase: string
}

function mergeCounts(
  prev: Record<string, number> | undefined,
  next: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = { ...(prev ?? {}) }
  for (const [k, v] of Object.entries(next)) out[k] = (out[k] ?? 0) + v
  return out
}

/** Read current-workflow.json, evict resolved ledger entries, write back the kept
 *  ledger + a cumulative compacted_summary. No-op (no write) when there is no
 *  active workflow or nothing is evictable. */
export async function compactWorkflow(): Promise<CompactWorkflowResult> {
  const wf = await readCurrentWorkflow()
  if (!wf) {
    return {
      kept: [],
      evicted: 0,
      by_status: {},
      before_tokens: 0,
      after_tokens: 0,
      pct_saved: 0,
      digest: 'compacted 0 entries',
      phase: '(none)',
    }
  }
  const r = compactLedger(wf.sub_progress ?? [])
  if (r.evicted > 0) {
    const prev = wf.compacted_summary
    await writeCurrentWorkflow({
      ...wf,
      sub_progress: r.kept,
      compacted_summary: {
        evicted: (prev?.evicted ?? 0) + r.evicted,
        by_status: mergeCounts(prev?.by_status, r.by_status),
        last_at: new Date().toISOString(),
      },
    })
  }
  return { ...r, phase: wf.phase }
}
