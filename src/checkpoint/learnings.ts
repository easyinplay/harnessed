// Phase 16 — cross-session learning loop. On workflow completion, the mechanical
// failure/loop/reject signals in the final ledger are appended to the repo's
// git-shareable `.planning/LEARNINGS.md` (append-only), so the next session starts
// smarter (Trellis update-spec analog, no-vendor). The agent can also append a
// prose lesson via `harnessed learn`. Consumption is via the standard `.planning/`
// read convention now, and Phase 17's per-turn injection later.
//
// Write target is the REPO root (repoKey(cwd)), NOT the global harnessed root.
// D4 — no empty writes: a clean completion (no failure signals) writes nothing,
// which also keeps the test suite from polluting a real repo's `.planning/`.

import { existsSync } from 'node:fs'
import { appendFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { SubProgressEntryType } from './schema/currentWorkflow.v1.js'
import { repoKey } from './workflowStore.js'

export interface LearningSignal {
  sub: string
  kind: 'looped' | 'rejected' | 'failed'
  fail_count?: number
}

/** Pure — extract mechanical learning signals from a final ledger. One signal per
 *  sub at most: looped (fail_count>0, the G6 thrash signal) wins, then rejected
 *  (G7-lite abandon), then failed. Clean subs (done/skipped/pending) produce none. */
export function extractLearnings(ledger: SubProgressEntryType[]): LearningSignal[] {
  const signals: LearningSignal[] = []
  for (const e of ledger) {
    if ((e.fail_count ?? 0) > 0) {
      signals.push({ sub: e.sub, kind: 'looped', fail_count: e.fail_count })
    } else if (e.status === 'rejected') {
      signals.push({ sub: e.sub, kind: 'rejected' })
    } else if (e.status === 'failed') {
      signals.push({ sub: e.sub, kind: 'failed' })
    }
  }
  return signals
}

export interface LearningEntryInput {
  phase: string
  signals: LearningSignal[]
  prose?: string
  at: string
}

/** Pure — render a dated markdown block for one learning entry. */
export function formatLearningEntry({ phase, signals, prose, at }: LearningEntryInput): string {
  const lines = [`### ${at} — phase ${phase}`]
  for (const s of signals) {
    lines.push(`- ${s.kind}: ${s.sub}${s.fail_count != null ? ` (×${s.fail_count})` : ''}`)
  }
  if (prose) lines.push(`- lesson: ${prose}`)
  return `${lines.join('\n')}\n\n`
}

const HEADER =
  '# Learnings\n\n> Append-only cross-session learning log (harnessed Phase 16). Newest at bottom.\n\n'

/** The repo's learnings file: `<repoRoot>/.planning/LEARNINGS.md`. */
export function learningsPath(repoRoot: string): string {
  return join(repoRoot, '.planning', 'LEARNINGS.md')
}

/** Append-only write into the repo's LEARNINGS.md. Creates `.planning/` and the
 *  file (with a one-time header) on first write; never truncates existing content. */
export async function appendLearning(repoRoot: string, entry: string): Promise<void> {
  const p = learningsPath(repoRoot)
  await mkdir(dirname(p), { recursive: true })
  if (!existsSync(p)) await writeFile(p, HEADER, 'utf8')
  await appendFile(p, entry, 'utf8')
}

/** Auto-capture half of the hybrid loop: extract signals from a completed
 *  workflow's ledger and, when there is at least one, append a learning entry to
 *  the current repo's LEARNINGS.md. Returns the number of signals captured.
 *  NO-OP (returns 0, writes nothing) for a clean ledger (D4). */
export async function captureWorkflowLearnings(
  ledger: SubProgressEntryType[],
  phase: string,
): Promise<number> {
  const signals = extractLearnings(ledger)
  if (signals.length === 0) return 0
  const entry = formatLearningEntry({ phase, signals, at: new Date().toISOString() })
  await appendLearning(repoKey(), entry)
  return signals.length
}
