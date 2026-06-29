// src/checkpoint/injectState.ts — G4 per-turn breadcrumb. Pure builder: turns the
// current-workflow envelope into a <workflow-state> block for UserPromptSubmit hook
// injection (Trellis inject-workflow-state analog). null -> '' (silent no-op).

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { detectLoop } from './breakLoop.js'
import { nextPending } from './ledger.js'
import type { CurrentWorkflowV1Type } from './schema/currentWorkflow.v1.js'

export function buildWorkflowStateBlock(wf: CurrentWorkflowV1Type | null): string {
  if (!wf) return ''
  const ledger = wf.sub_progress ?? []
  const next = nextPending(ledger)
  const loops = detectLoop(ledger)
  const lines = [
    '<workflow-state>',
    `phase: ${wf.phase}`,
    `status: ${wf.status}`,
    next ? `next: ${next}` : 'next: (none — all subs resolved)',
  ]
  // issue #2 (T2) — anti-freestyle enforcement. While a sub is still pending, pull
  // a drifting agent back to the engine/ledger instead of letting it freestyle the
  // orchestration. Advisory tone like SHIP-READY/VERIFY-MODE; absent when resolved.
  if (next) {
    lines.push(
      `ENGINE: mid state-machine — drive sub '${next}' via \`harnessed prompt ${next}\` → spawn → \`harnessed checkpoint complete/fail\`. Do NOT freestyle the orchestration or skip the ledger; run \`harnessed status --recover\` if unsure where you are.`,
    )
  }
  for (const l of loops) {
    lines.push(
      `BREAK-LOOP: sub '${l.sub}' failed ${l.count}x — stop retrying, run break-loop skill`,
    )
  }
  // Phase 22 — smart-reminder lines from envelope flags (AI judges; not gates).
  if (wf.ship_ready) {
    lines.push(
      `SHIP-READY: ${wf.ship_commits ?? 0} commit(s) since the last release tag — consider shipping (harnessed release-preflight, then /ship)`,
    )
  }
  if (wf.retro_due) {
    lines.push(
      'RETRO-DUE: enough phases completed since the last retro — run /retro, then `harnessed retro --done`',
    )
  }
  // Phase 36 (Spec 3/H) — surface the scale-adaptive verify strength computed by
  // assessScale (stored on the envelope at `checkpoint complete`). Advisory, like
  // SHIP-READY/RETRO-DUE; absent verify_mode → no line (byte-identical to before).
  if (wf.verify_mode === 'full') {
    lines.push(
      'VERIFY-MODE: full — run full verification (large/risky change: >5 files / >4 subs / >3 reqs)',
    )
  } else if (wf.verify_mode === 'light') {
    lines.push('VERIFY-MODE: light — scope verification to the changed surface (small change)')
  }
  lines.push('</workflow-state>')
  return lines.join('\n')
}

// ── Phase 17 — relevance-filtered project-context injection (consumption half of
// the learning loop). Deterministic, LLM-free. The bin replicates this logic in
// plain JS (hot path); the parity test guards drift. ──

export const DEFAULT_INJECT_BUDGET = 1500

export interface LearningEntry {
  raw: string
  phase: string
  subs: string[]
}

const tok = (s: string): number => Math.ceil(Buffer.byteLength(s, 'utf8') / 4)

/** Pure — parse Phase-16 LEARNINGS.md back into entries. Each block starts at a
 *  `### ` header; phase from `phase <x>`, subs from `- <kind>: <sub>` lines. */
export function parseLearnings(md: string): LearningEntry[] {
  const blocks = md.split(/^### /m).slice(1)
  return blocks.map((b) => {
    const raw = `### ${b}`.trimEnd()
    const phase = /phase (\S+)/.exec(b)?.[1] ?? ''
    const subs: string[] = []
    for (const m of b.matchAll(/^- (?:looped|rejected|failed): (\S+)/gm)) {
      if (m[1]) subs.push(m[1])
    }
    return { raw, phase, subs }
  })
}

/** Pure — keep entries relevant to the current workflow (phase match OR a sub in
 *  the current ledger), newest-first. Falls back to the single most-recent entry
 *  when nothing matches (recency is a weak relevance signal). */
export function filterRelevantLearnings(
  entries: LearningEntry[],
  ctx: { phase: string; ledgerSubs: string[] },
): LearningEntry[] {
  const rel = entries.filter(
    (e) => e.phase === ctx.phase || e.subs.some((s) => ctx.ledgerSubs.includes(s)),
  )
  const ordered = [...rel].reverse() // input is append-order (oldest first) → newest first
  if (ordered.length === 0) {
    const last = entries[entries.length - 1]
    return last ? [last] : []
  }
  return ordered
}

/** Pure — greedily take entries (already newest-first) until the token budget. */
export function selectWithinBudget(entries: LearningEntry[], budget: number): LearningEntry[] {
  const out: LearningEntry[] = []
  let acc = 0
  for (const e of entries) {
    const cost = tok(e.raw)
    if (acc + cost > budget) break
    acc += cost
    out.push(e)
  }
  return out
}

/** Pure — assemble the `<project-context>` block. '' when there is nothing. */
export function buildProjectContextBlock(input: {
  learnings: LearningEntry[]
  contextExcerpt?: string
}): string {
  const parts: string[] = []
  for (const l of input.learnings) parts.push(l.raw.trim())
  if (input.contextExcerpt) parts.push(input.contextExcerpt.trim())
  if (parts.length === 0) return ''
  return ['<project-context>', ...parts, '</project-context>'].join('\n')
}

/** Impure best-effort — the current phase's CONTEXT.md Goal excerpt, bounded by
 *  the budget. Matches a `.planning/phases/<dir>/` whose leading number appears in
 *  the workflow `phase` string. null when no match / unreadable (graceful). */
export function findPhaseContextExcerpt(
  repoRoot: string,
  phase: string,
  budget: number,
): string | null {
  try {
    const phasesDir = join(repoRoot, '.planning', 'phases')
    if (!existsSync(phasesDir)) return null
    for (const dir of readdirSync(phasesDir)) {
      const num = /^(\d+)/.exec(dir)?.[1]
      if (!num || !phase.includes(num)) continue
      const ctxFile = join(phasesDir, dir, `${num}-CONTEXT.md`)
      if (!existsSync(ctxFile)) continue
      const body = readFileSync(ctxFile, 'utf8')
      const goalIdx = body.indexOf('## Goal')
      const slice = goalIdx >= 0 ? body.slice(goalIdx) : body
      const next = slice.indexOf('\n## ', 1)
      const excerpt = (next > 0 ? slice.slice(0, next) : slice).trim()
      // bound to the budget (~4 chars/token)
      return excerpt.length > budget * 4 ? excerpt.slice(0, budget * 4) : excerpt
    }
  } catch {
    // unreadable → graceful null
  }
  return null
}

/** End-to-end (impure via findPhaseContextExcerpt) — compose the per-turn
 *  injection: <workflow-state> + relevance-filtered <project-context>. Returns ''
 *  when there is no workflow; just the workflow-state block when nothing relevant. */
export function buildInjection(
  repoRoot: string,
  wf: CurrentWorkflowV1Type | null,
  learningsMd: string,
  budget: number = DEFAULT_INJECT_BUDGET,
): string {
  if (!wf) return ''
  const ws = buildWorkflowStateBlock(wf)
  const ledgerSubs = (wf.sub_progress ?? []).map((e) => e.sub)
  const rel = selectWithinBudget(
    filterRelevantLearnings(parseLearnings(learningsMd), { phase: wf.phase, ledgerSubs }),
    budget,
  )
  const usedTokens = rel.reduce((a, e) => a + tok(e.raw), 0)
  const ctx = findPhaseContextExcerpt(repoRoot, wf.phase, Math.max(0, budget - usedTokens))
  const pc = buildProjectContextBlock({ learnings: rel, contextExcerpt: ctx ?? undefined })
  return pc ? `${ws}\n${pc}` : ws
}
