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

// Phase 35 — mirror PlatformDescriptor.sessionIdEnv (src/installers/lib/platform.ts)
// for the hot path: which env var carries the active session id. Minimal replica —
// HARNESSED_PLATFORM selects (default claude); codex has none. State-root selection
// (.platform pin / auto-probe) is orthogonal and already handled via
// HARNESSED_ROOT_OVERRIDE, so it is not re-derived here. The TS `activeKey` uses the
// full descriptor; the parity test sets matching signals.
function sessionIdEnvName() {
  const platform = (process.env.HARNESSED_PLATFORM || 'claude').trim()
  if (platform === 'codex') return null
  return 'CLAUDE_CODE_SESSION_ID' // claude (default)
}

// Phase 35 — try the session-scoped slot first, then the bare repoKey slot, then
// the legacy singleton (dual-write anchor). `keys` is ordered most→least specific.
function readWorkflow(root, keys) {
  try {
    const store = JSON.parse(readFileSync(join(root, 'workflows.json'), 'utf8'))
    if (store?.workflows) {
      for (const k of keys) {
        if (store.workflows[k]) return store.workflows[k]
      }
    }
  } catch {}
  try {
    return JSON.parse(readFileSync(join(root, 'current-workflow.json'), 'utf8'))
  } catch {}
  return null
}

// Phase 39 (D6) — plain-JS replicas of planningScan/deriveNext/describeUnit for the
// hot path. MUST stay byte-equivalent to src/checkpoint/{planningScan,deriveNext,
// forwardStep}.ts — the parity test compares this file's stdout to buildInjection.
// includeTasks:false (the per-turn phase-level floor) → tasks are never scanned, so
// the derived next is always phase-level here.
const PHASE_DIR = /^(\d+(?:\.\d+)?)-(.*)$/

function scanPhases(repoRoot) {
  try {
    const phasesDir = join(repoRoot, '.planning', 'phases')
    if (!existsSync(phasesDir)) return []
    const out = []
    for (const dir of readdirSync(phasesDir)) {
      const m = PHASE_DIR.exec(dir)
      const num = m?.[1]
      if (!num) continue
      const dirPath = join(phasesDir, dir)
      let entries
      try {
        entries = readdirSync(dirPath)
      } catch {
        continue
      }
      let plans = 0
      let summaries = 0
      const prefix = `${num}-`
      for (const f of entries) {
        if (!f.startsWith(prefix)) continue
        if (f.endsWith('-PLAN.md')) plans++
        else if (f.endsWith('-SUMMARY.md')) summaries++
      }
      const complete = plans > 0 && summaries >= plans
      out.push({
        phase: num,
        name: m?.[2] ?? '',
        plans,
        summaries,
        complete,
        order: Number.parseFloat(num),
      })
    }
    out.sort((a, b) => a.order - b.order)
    return out
  } catch {
    return []
  }
}

function describeUnit(unit) {
  switch (unit.kind) {
    case 'phase':
      return `phase ${unit.phase} '${unit.name}'`
    case 'task':
      return `task '${unit.task}' in phase ${unit.phase}`
    case 'sub':
      return `sub '${unit.sub}'`
    default:
      return null
  }
}

/** Mirror deriveNext for the per-turn path (ledger already resolved when called).
 *  includeTasks:false → no task branch; first-incomplete phase is the floor. */
function deriveNextUnit(wf, phases) {
  const ledger = wf.sub_progress ?? []
  const pendingSub = ledger.find((e) => e.status === 'pending')?.sub ?? null
  if (pendingSub !== null) return { kind: 'sub', sub: pendingSub }
  const failed = ledger.find((e) => e.status === 'failed' && (e.fail_count ?? 0) > 0)
  if (failed) return { kind: 'blocked', unit: failed.sub, reason: '' }
  const firstIncomplete = phases.find((p) => !p.complete)
  if (firstIncomplete)
    return { kind: 'phase', phase: firstIncomplete.phase, name: firstIncomplete.name }
  return { kind: 'done' }
}

/** Impure forward pointer (parity with injectState.ts:forwardPointer). null unless
 *  the next is a concrete phase|task. */
function forwardPointer(repoRoot, wf) {
  const phases = scanPhases(repoRoot)
  const unit = deriveNextUnit(wf, phases)
  if (unit.kind !== 'phase' && unit.kind !== 'task') return null
  return { unit, remainingPhases: phases.filter((p) => !p.complete).length }
}

function workflowStateBlock(wf, forward) {
  const ledger = wf.sub_progress ?? []
  const next = ledger.find((e) => e.status === 'pending')?.sub ?? null
  const lines = [
    '<workflow-state>',
    `phase: ${wf.phase}`,
    `status: ${wf.status}`,
    next ? `next: ${next}` : 'next: (none — all subs resolved)',
  ]
  // issue #2 (T2) — anti-freestyle enforcement (parity with injectState.ts).
  if (next) {
    lines.push(
      `ENGINE: mid state-machine — drive sub '${next}' via \`harnessed prompt ${next}\` → spawn → \`harnessed checkpoint complete/fail\`. Do NOT freestyle the orchestration or skip the ledger; run \`harnessed status --recover\` if unsure where you are.`,
    )
  }
  // Phase 39 (D6) — per-turn current→next pointer (parity with injectState.ts).
  if (!next && forward && (forward.unit.kind === 'phase' || forward.unit.kind === 'task')) {
    const n = forward.remainingPhases
    lines.push(
      `NEXT-UNIT: current workflow complete → next is ${describeUnit(forward.unit)} (run /auto or \`harnessed advance\`); ${n} phase${n === 1 ? '' : 's'} remain`,
    )
  }
  for (const e of ledger) {
    if ((e.fail_count ?? 0) >= 3)
      lines.push(
        `BREAK-LOOP: sub '${e.sub}' failed ${e.fail_count}x — stop retrying, run break-loop skill`,
      )
  }
  // Phase 22 — smart-reminder lines from envelope flags (parity with injectState.ts).
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
  // Phase 36 — scale-adaptive verify_mode directive (parity with injectState.ts).
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
  // `key` is the repo ROOT directory (used for .planning/ fs paths below). The
  // workflow LOOKUP uses the session-scoped composite key first (Phase 34/35),
  // falling back to the bare repoKey, then the legacy singleton. The composite
  // key is NOT a real directory — only the bare repoKey is.
  const key = repoKey(process.cwd())
  const envName = sessionIdEnvName()
  const sid = envName ? process.env[envName]?.trim() : undefined
  const wf = readWorkflow(root, sid ? [`${key}::${sid}`, key] : [key])
  if (!wf) process.exit(0)

  const budget = Number(process.env.HARNESSED_INJECT_BUDGET) || DEFAULT_INJECT_BUDGET
  // Phase 39 (D6) — derive the forward pointer only when the subs are all resolved
  // (parity with buildInjection). `key` is the repo root holding .planning/.
  const pending = (wf.sub_progress ?? []).find((e) => e.status === 'pending')?.sub ?? null
  const forward = pending === null ? forwardPointer(key, wf) : null
  const ws = workflowStateBlock(wf, forward)

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
