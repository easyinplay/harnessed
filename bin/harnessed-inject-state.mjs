#!/usr/bin/env node
// biome-ignore-all format: esbuild-generated (hook drift gate owns this file)
// biome-ignore-all lint: esbuild-generated
// biome-ignore-all assist/source/organizeImports: esbuild-generated

// src/checkpoint/injectStateMain.ts
import { createHash as createHash2 } from "node:crypto";
import { existsSync as existsSync3, readFileSync as readFileSync4, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join as join4, resolve } from 'node:path'

// src/checkpoint/injectCache.ts
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
var DEFAULT_REFRESH_TURNS = 10
function decidePcEmission(cache, pcHash, refreshN, nowMs) {
  if (cache && cache.pcHash === pcHash && cache.turns < refreshN) {
    return { emit: false, next: { pcHash, ts: cache.ts, turns: cache.turns + 1 } }
  }
  return { emit: true, next: { pcHash, ts: nowMs, turns: 0 } }
}
function parseRefreshTurns(raw) {
  const n = Number.parseInt(raw ?? '', 10)
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_REFRESH_TURNS
}
function injectCacheKey(repoKey2, sid) {
  return createHash('sha256').update(`${repoKey2}::${sid}`).digest('hex').slice(0, 16)
}
function cacheFile(root, key) {
  return join(root, 'inject-cache', `${key}.json`)
}
function readInjectCache(root, key) {
  try {
    const parsed = JSON.parse(readFileSync(cacheFile(root, key), 'utf8'))
    if (parsed && typeof parsed === 'object') {
      const e = parsed
      if (typeof e.pcHash === 'string' && typeof e.ts === 'number' && typeof e.turns === 'number') {
        return { pcHash: e.pcHash, ts: e.ts, turns: e.turns }
      }
    }
  } catch {}
  return null
}
function writeInjectCache(root, key, entry) {
  try {
    mkdirSync(join(root, 'inject-cache'), { recursive: true })
    writeFileSync(
      cacheFile(root, key),
      `${JSON.stringify(entry)}
`,
      'utf8',
    )
    return true
  } catch {
    return false
  }
}

// src/checkpoint/injectState.ts
import {
  existsSync as existsSync2,
  readdirSync as readdirSync2,
  readFileSync as readFileSync3,
} from 'node:fs'
import { join as join3 } from 'node:path'

// src/checkpoint/breakLoop.ts
var LOOP_THRESHOLD = 3
function detectLoop(ledger) {
  return ledger
    .filter((e) => (e.fail_count ?? 0) >= LOOP_THRESHOLD)
    .map((e) => ({ sub: e.sub, count: e.fail_count }))
}

// src/checkpoint/ledger.ts
function nextPending(entries) {
  return entries.find((e) => e.status === 'pending')?.sub ?? null
}

// src/checkpoint/deriveNext.ts
function deriveNext(snapshot) {
  const pendingSub = nextPending(snapshot.subProgress)
  if (pendingSub !== null) return { kind: 'sub', sub: pendingSub }
  const failed = snapshot.subProgress.find((e) => e.status === 'failed' && (e.fail_count ?? 0) > 0)
  if (failed) {
    return {
      kind: 'blocked',
      unit: failed.sub,
      reason: `sub '${failed.sub}' failed ${failed.fail_count}x \u2014 resolve before advancing`,
    }
  }
  const firstIncomplete = snapshot.phases.find((p) => !p.complete)
  if (firstIncomplete) {
    const task = firstIncomplete.tasks?.nextUnchecked
    if (task) return { kind: 'task', phase: firstIncomplete.phase, task }
    return { kind: 'phase', phase: firstIncomplete.phase, name: firstIncomplete.name }
  }
  return { kind: 'done' }
}

// src/checkpoint/forwardStep.ts
function describeUnit(unit) {
  switch (unit.kind) {
    case 'phase':
      return `phase ${unit.phase} '${unit.name}'`
    case 'task':
      return `task '${unit.task}' in phase ${unit.phase}`
    case 'sub':
      return `sub '${unit.sub}'`
    case 'blocked':
      return unit.unit
    case 'done':
      return null
  }
}

// src/checkpoint/planningScan.ts
import { existsSync, readdirSync, readFileSync as readFileSync2 } from 'node:fs'
import { join as join2 } from 'node:path'
var PHASE_DIR = /^(\d+(?:\.\d+)?)-(.*)$/
function scanPlanning(opts = {}) {
  const repoRoot = opts.repoRoot ?? process.cwd()
  const wf = opts.currentWorkflow ?? null
  return {
    subProgress: wf?.sub_progress ?? [],
    currentPhase: wf?.phase ?? null,
    phases: scanPhases(repoRoot, opts.includeTasks ?? false),
  }
}
function scanPhases(repoRoot, includeTasks) {
  try {
    const phasesDir = join2(repoRoot, '.planning', 'phases')
    if (!existsSync(phasesDir)) return []
    const out = []
    for (const dir of readdirSync(phasesDir)) {
      const m = PHASE_DIR.exec(dir)
      const num = m?.[1]
      if (!num) continue
      const dirPath = join2(phasesDir, dir)
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
      const phase = {
        phase: num,
        name: m?.[2] ?? '',
        plans,
        summaries,
        complete,
        order: Number.parseFloat(num),
      }
      if (includeTasks && !complete) phase.tasks = scanTasks(dirPath)
      out.push(phase)
    }
    out.sort((a, b) => a.order - b.order)
    return out
  } catch {
    return []
  }
}
function scanTasks(dirPath) {
  for (const fname of ['task_plan.md', 'progress.md']) {
    try {
      const p = join2(dirPath, fname)
      if (!existsSync(p)) continue
      const m = /^[ \t]*- \[ \]\s+(.+)$/m.exec(readFileSync2(p, 'utf8'))
      const task = m?.[1]
      if (task) return { nextUnchecked: task.trim() }
    } catch {}
  }
  return { nextUnchecked: null }
}

// src/checkpoint/injectState.ts
var INTENT_TTL_MS = 24 * 60 * 60 * 1e3
function formatIntentAge(ms) {
  const m = Math.floor(ms / 6e4)
  if (m < 1) return '<1m'
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h`
}
function buildIntentBlock(intent, nowMs) {
  if (!intent) return ''
  const born = Date.parse(intent.ts)
  if (Number.isNaN(born)) return ''
  const age = nowMs - born
  if (age < 0 || age > INTENT_TTL_MS) return ''
  const m = intent.master
  if (intent.kind === 'leaf') {
    return [
      '<workflow-intent>',
      `intent: /${m} invoked ${formatIntentAge(age)} ago \u2014 sub NOT checkpointed`,
      `ENGINE: /${m} is registered but not engaged \u2014 freestyle risk. Run: \`harnessed prompt ${m} --task "<spec>" --json\` \u2192 spawn per SOP \u2192 \`harnessed checkpoint complete ${m}\` (or \`harnessed checkpoint fail ${m}\`).`,
      '</workflow-intent>',
    ].join('\n')
  }
  return [
    '<workflow-intent>',
    `intent: /${m} invoked ${formatIntentAge(age)} ago \u2014 ledger NOT seeded`,
    `ENGINE: /${m} is registered but not engaged \u2014 freestyle risk. Run: \`harnessed gates ${m} --task "<locked spec>"\` \u2192 \`harnessed checkpoint start ${m} --plan '<gates JSON>'\`; then drive each sub via \`harnessed prompt\` / \`harnessed checkpoint complete|fail\`.`,
    '</workflow-intent>',
  ].join('\n')
}
var STALE_LEDGER_MS = 24 * 60 * 60 * 1e3
function buildWorkflowStateBlock(wf, forward, ledgerAgeMs) {
  if (!wf) return ''
  const ledger = wf.sub_progress ?? []
  const next = nextPending(ledger)
  const loops = detectLoop(ledger)
  const lines = [
    '<workflow-state>',
    `phase: ${wf.phase}`,
    `status: ${wf.status}`,
    next ? `next: ${next}` : 'next: (none \u2014 all subs resolved)',
  ]
  if (next && typeof ledgerAgeMs === 'number' && ledgerAgeMs > STALE_LEDGER_MS) {
    const days = Math.floor(ledgerAgeMs / (24 * 60 * 60 * 1e3))
    lines.push(
      `ENGINE: STALE state machine \u2014 sub '${next}' has been pending with NO checkpoint activity for >${days}d. This ledger may belong to an abandoned/bypassed run (issue #3 class). Run \`harnessed status --recover\` to re-orient, then either resume the sub or close it out with \`harnessed checkpoint fail ${next} --summary "<why>"\`.`,
    )
  } else if (next) {
    lines.push(
      `ENGINE: mid state-machine \u2014 drive sub '${next}' via \`harnessed prompt ${next}\` \u2192 spawn \u2192 \`harnessed checkpoint complete/fail\`. Do NOT freestyle the orchestration or skip the ledger; run \`harnessed status --recover\` if unsure where you are.`,
    )
  }
  if (!next && forward && (forward.unit.kind === 'phase' || forward.unit.kind === 'task')) {
    const n = forward.remainingPhases
    lines.push(
      `NEXT-UNIT: current workflow complete \u2192 next is ${describeUnit(forward.unit)} (run /auto or \`harnessed advance\`); ${n} phase${n === 1 ? '' : 's'} remain`,
    )
  }
  for (const l of loops) {
    lines.push(
      `BREAK-LOOP: sub '${l.sub}' failed ${l.count}x \u2014 stop retrying, run break-loop skill`,
    )
  }
  if (wf.ship_ready) {
    lines.push(
      `SHIP-READY: ${wf.ship_commits ?? 0} commit(s) since the last release tag \u2014 consider shipping (harnessed release-preflight, then /ship)`,
    )
  }
  if (wf.retro_due) {
    lines.push(
      'RETRO-DUE: enough phases completed since the last retro \u2014 run /retro, then `harnessed retro --done`',
    )
  }
  if (wf.verify_mode === 'full') {
    lines.push(
      'VERIFY-MODE: full \u2014 run full verification (large/risky change: >5 files / >4 subs / >3 reqs)',
    )
  } else if (wf.verify_mode === 'light') {
    lines.push('VERIFY-MODE: light \u2014 scope verification to the changed surface (small change)')
  }
  lines.push('</workflow-state>')
  return lines.join('\n')
}
var DEFAULT_INJECT_BUDGET = 1500
var tok = (s) => Math.ceil(Buffer.byteLength(s, 'utf8') / 4)
function parseLearnings(md) {
  const blocks = md.split(/^### /m).slice(1)
  return blocks.map((b) => {
    const raw = `### ${b}`.trimEnd()
    const phase = /phase (\S+)/.exec(b)?.[1] ?? ''
    const subs = []
    for (const m of b.matchAll(/^- (?:looped|rejected|failed): (\S+)/gm)) {
      if (m[1]) subs.push(m[1])
    }
    return { raw, phase, subs }
  })
}
function filterRelevantLearnings(entries, ctx) {
  const rel = entries.filter(
    (e) => e.phase === ctx.phase || e.subs.some((s) => ctx.ledgerSubs.includes(s)),
  )
  const ordered = [...rel].reverse()
  if (ordered.length === 0) {
    const last = entries[entries.length - 1]
    return last ? [last] : []
  }
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
function buildProjectContextBlock(input) {
  const parts = []
  for (const l of input.learnings) parts.push(l.raw.trim())
  if (input.contextExcerpt) parts.push(input.contextExcerpt.trim())
  if (parts.length === 0) return ''
  return ['<project-context>', ...parts, '</project-context>'].join('\n')
}
function findPhaseContextExcerpt(repoRoot, phase, budget) {
  try {
    const phasesDir = join3(repoRoot, '.planning', 'phases')
    if (!existsSync2(phasesDir)) return null
    for (const dir of readdirSync2(phasesDir)) {
      const num = /^(\d+)/.exec(dir)?.[1]
      if (!num || !phase.includes(num)) continue
      const ctxFile = join3(phasesDir, dir, `${num}-CONTEXT.md`)
      if (!existsSync2(ctxFile)) continue
      const body = readFileSync3(ctxFile, 'utf8')
      const goalIdx = body.indexOf('## Goal')
      const slice = goalIdx >= 0 ? body.slice(goalIdx) : body
      const next = slice.indexOf('\n## ', 1)
      const excerpt = (next > 0 ? slice.slice(0, next) : slice).trim()
      return excerpt.length > budget * 4 ? excerpt.slice(0, budget * 4) : excerpt
    }
  } catch {}
  return null
}
function buildInjection(
  repoRoot,
  wf,
  learningsMd,
  budget = DEFAULT_INJECT_BUDGET,
  intent = null,
  nowMs = Date.now(),
  opts = {},
) {
  const ledgerEmpty = (wf?.sub_progress ?? []).length === 0
  const intentBlock = ledgerEmpty ? buildIntentBlock(intent, nowMs) : ''
  if (!wf) return intentBlock
  const forward = nextPending(wf.sub_progress ?? []) === null ? forwardPointer(repoRoot, wf) : null
  const ws = buildWorkflowStateBlock(wf, forward, opts.ledgerAgeMs)
  const ledgerSubs = (wf.sub_progress ?? []).map((e) => e.sub)
  const rel = selectWithinBudget(
    filterRelevantLearnings(parseLearnings(learningsMd), { phase: wf.phase, ledgerSubs }),
    budget,
  )
  const usedTokens = rel.reduce((a, e) => a + tok(e.raw), 0)
  const ctx = findPhaseContextExcerpt(repoRoot, wf.phase, Math.max(0, budget - usedTokens))
  const pcRaw = buildProjectContextBlock({ learnings: rel, contextExcerpt: ctx ?? void 0 })
  const pc = pcRaw && opts.pcGate ? (opts.pcGate(pcRaw) ? pcRaw : '') : pcRaw
  const normal = pc
    ? `${ws}
${pc}`
    : ws
  return intentBlock
    ? `${intentBlock}
${normal}`
    : normal
}
function forwardPointer(repoRoot, wf) {
  const snapshot = scanPlanning({ repoRoot, currentWorkflow: wf, includeTasks: false })
  const unit = deriveNext(snapshot)
  if (unit.kind !== 'phase' && unit.kind !== 'task') return null
  return { unit, remainingPhases: snapshot.phases.filter((p) => !p.complete).length }
}

// src/checkpoint/injectStateMain.ts
function repoKey(cwd) {
  let dir = resolve(cwd)
  for (;;) {
    if (existsSync3(join4(dir, '.git'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return resolve(cwd)
}
function harnessedRoot() {
  const override = process.env.HARNESSED_ROOT_OVERRIDE
  return override !== void 0 && override !== ''
    ? override
    : join4(homedir(), '.claude', 'harnessed')
}
function sessionIdEnvName() {
  const platform = (process.env.HARNESSED_PLATFORM || 'claude').trim()
  if (platform === 'codex') return null
  return 'CLAUDE_CODE_SESSION_ID'
}
function readWorkflow(root, keys) {
  let wf = null
  let intent = null
  let ledgerAgeMs = null
  const ageOf = (p) => {
    try {
      return Date.now() - statSync(p).mtimeMs
    } catch {
      return null
    }
  }
  try {
    const storePath = join4(root, 'workflows.json')
    const store = JSON.parse(readFileSync4(storePath, 'utf8'))
    if (store?.workflows) {
      for (const k of keys) {
        if (store.workflows[k]) {
          wf = store.workflows[k]
          ledgerAgeMs = ageOf(storePath)
          break
        }
      }
    }
    if (store?.intents) {
      for (const k of keys) {
        if (store.intents[k]) {
          intent = store.intents[k]
          break
        }
      }
    }
  } catch {}
  return { wf, intent, ledgerAgeMs }
}
function shouldEmitPc(root, repoRoot, sid, pc) {
  try {
    const key = injectCacheKey(repoRoot, sid)
    const cache = readInjectCache(root, key)
    const pcHash = createHash2('sha256').update(pc).digest('hex')
    const refreshN = parseRefreshTurns(process.env.HARNESSED_INJECT_REFRESH_TURNS)
    const d = decidePcEmission(cache, pcHash, refreshN, Date.now())
    if (!writeInjectCache(root, key, d.next)) return true
    return d.emit
  } catch {
    return true
  }
}
function main() {
  try {
    const root = harnessedRoot()
    const key = repoKey(process.cwd())
    const envName = sessionIdEnvName()
    const sid = envName ? process.env[envName]?.trim() : void 0
    const { wf, intent, ledgerAgeMs } = readWorkflow(root, sid ? [`${key}::${sid}`, key] : [key])
    let learningsMd = ''
    try {
      learningsMd = readFileSync4(join4(key, '.planning', 'LEARNINGS.md'), 'utf8')
    } catch {}
    const budget = Number(process.env.HARNESSED_INJECT_BUDGET) || DEFAULT_INJECT_BUDGET
    const out = buildInjection(key, wf, learningsMd, budget, intent, Date.now(), {
      ledgerAgeMs,
      pcGate: sid ? (pc) => shouldEmitPc(root, key, sid, pc) : void 0,
    })
    if (out)
      process.stdout.write(`${out}
`)
  } catch {}
}
main()
