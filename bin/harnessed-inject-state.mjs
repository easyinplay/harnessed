#!/usr/bin/env node
// G4 UserPromptSubmit hook — print the per-turn injection for the active harnessed
// workflow: a <workflow-state> breadcrumb + (Phase 17) a relevance-filtered
// <project-context> block (recent, phase/sub-relevant learnings from the repo's
// .planning/LEARNINGS.md + the current phase's CONTEXT.md excerpt). Silent exit 0
// on any error (fail-soft — a hook must never block the prompt).
//
// Self-contained plain JS (no project imports, no subprocess, no LLM) for hot-path
// speed. This MUST stay equivalent to src/checkpoint/injectState.ts `buildInjection`
// — the parity test in tests/checkpoint/injectState.test.ts runs this file and
// compares its stdout to the TS builder.
//
// Phase 15 repo-aware: resolves the active repo's slot from
// workflows.json[repoKey(cwd)] (legacy current-workflow.json as a fallback).
// Root: HARNESSED_ROOT_OVERRIDE if set, else <homedir>/.claude/harnessed.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const DEFAULT_INJECT_BUDGET = 1500
const tok = (s) => Math.ceil(Buffer.byteLength(s, 'utf8') / 4)

function repoKey(cwd) {
  let dir = resolve(cwd)
  for (;;) {
    if (existsSync(join(dir, '.git'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return resolve(cwd)
}

function harnessedRoot() {
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  return override !== undefined && override !== ''
    ? override
    : join(homedir(), '.claude', 'harnessed')
}

// workflows.json[repoKey] first, then the legacy singleton (dual-write anchor).
function readWorkflow(root, key) {
  try {
    const store = JSON.parse(readFileSync(join(root, 'workflows.json'), 'utf8'))
    if (store && store.workflows && store.workflows[key]) return store.workflows[key]
  } catch {}
  try {
    return JSON.parse(readFileSync(join(root, 'current-workflow.json'), 'utf8'))
  } catch {}
  return null
}

function workflowStateBlock(wf) {
  const ledger = wf.sub_progress ?? []
  const next = ledger.find((e) => e.status === 'pending')?.sub ?? null
  const lines = [
    '<workflow-state>',
    `phase: ${wf.phase}`,
    `status: ${wf.status}`,
    next ? `next: ${next}` : 'next: (none — all subs resolved)',
  ]
  for (const e of ledger) {
    if ((e.fail_count ?? 0) >= 3)
      lines.push(
        `BREAK-LOOP: sub '${e.sub}' failed ${e.fail_count}x — stop retrying, run break-loop skill`,
      )
  }
  lines.push('</workflow-state>')
  return lines.join('\n')
}

function parseLearnings(md) {
  const blocks = md.split(/^### /m).slice(1)
  return blocks.map((b) => {
    const raw = `### ${b}`.trimEnd()
    const phase = /phase (\S+)/.exec(b)?.[1] ?? ''
    const subs = []
    for (const m of b.matchAll(/^- (?:looped|rejected|failed): (\S+)/gm)) subs.push(m[1])
    return { raw, phase, subs }
  })
}

function filterRelevant(entries, phase, ledgerSubs) {
  const rel = entries.filter((e) => e.phase === phase || e.subs.some((s) => ledgerSubs.includes(s)))
  const ordered = [...rel].reverse()
  if (ordered.length === 0 && entries.length > 0) return [entries[entries.length - 1]]
  return ordered
}

function selectWithinBudget(entries, budget) {
  const out = []
  let acc = 0
  for (const e of entries) {
    const cost = tok(e.raw)
    if (acc + cost > budget) break
    acc += cost
    out.push(e)
  }
  return out
}

function findPhaseContextExcerpt(repoRoot, phase, budget) {
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
      const nextH = slice.indexOf('\n## ', 1)
      const excerpt = (nextH > 0 ? slice.slice(0, nextH) : slice).trim()
      return excerpt.length > budget * 4 ? excerpt.slice(0, budget * 4) : excerpt
    }
  } catch {}
  return null
}

function projectContextBlock(learnings, contextExcerpt) {
  const parts = []
  for (const l of learnings) parts.push(l.raw.trim())
  if (contextExcerpt) parts.push(contextExcerpt.trim())
  if (parts.length === 0) return ''
  return ['<project-context>', ...parts, '</project-context>'].join('\n')
}

try {
  const root = harnessedRoot()
  const key = repoKey(process.cwd())
  const wf = readWorkflow(root, key)
  if (!wf) process.exit(0)

  const budget = Number(process.env.HARNESSED_INJECT_BUDGET) || DEFAULT_INJECT_BUDGET
  const ws = workflowStateBlock(wf)

  let learningsMd = ''
  try {
    learningsMd = readFileSync(join(key, '.planning', 'LEARNINGS.md'), 'utf8')
  } catch {}

  const ledgerSubs = (wf.sub_progress ?? []).map((e) => e.sub)
  const rel = selectWithinBudget(
    filterRelevant(parseLearnings(learningsMd), wf.phase, ledgerSubs),
    budget,
  )
  const used = rel.reduce((a, e) => a + tok(e.raw), 0)
  const ctx = findPhaseContextExcerpt(key, wf.phase, Math.max(0, budget - used))
  const pc = projectContextBlock(rel, ctx ?? undefined)

  process.stdout.write(`${pc ? `${ws}\n${pc}` : ws}\n`)
} catch {
  // no state / corrupt / not a harnessed session -> inject nothing
}
process.exit(0)
