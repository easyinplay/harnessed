// W3 aggregation — reads runs/*.result.json and emits the RESULTS.md table
// body (stdout). Excludes dry-runs and superseded pilots (a run is superseded
// when a later result.json exists for the same task/arm/rep stem — files are
// overwritten in place, so whatever is on disk IS the latest).
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const RUNS_DIR = join(import.meta.dirname, 'runs')
const rows = []
for (const f of readdirSync(RUNS_DIR)
  .filter((f) => f.endsWith('.result.json'))
  .sort()) {
  let r
  try {
    r = JSON.parse(readFileSync(join(RUNS_DIR, f), 'utf8'))
  } catch {
    continue
  }
  if (r.dryRun) continue
  const m = r.metrics ?? {}
  const pass = r.acceptance?.checklist?.passRate ?? r.acceptance?.passRate
  rows.push({
    task: r.task,
    arm: r.arm,
    rep: r.rep,
    pass: typeof pass === 'number' ? pass : null,
    turns: m.turns ?? null,
    costUsd: m.costUsd ?? null,
    subtype: m.resultSubtype ?? null,
    transcript: `runs/${r.task}-${r.arm}-r${r.rep}.jsonl`,
  })
}

console.log('| Task | Arm | Rep | 验收通过率 | Turns | Cost (USD) | 终态 |')
console.log('|------|-----|-----|-----------|-------|------------|------|')
for (const r of rows) {
  console.log(
    `| ${r.task} | ${r.arm} | r${r.rep} | ${r.pass === null ? '—' : r.pass.toFixed(2)} | ${r.turns ?? '—'} | ${r.costUsd === null ? '—' : `$${r.costUsd.toFixed(2)}`} | ${r.subtype ?? '—'} |`,
  )
}

// per task×arm aggregates
console.log('\n| Task | Arm | 平均通过率 | 平均 turns | 平均 cost |')
console.log('|------|-----|-----------|-----------|-----------|')
const groups = {}
for (const r of rows) {
  const k = `${r.task}|${r.arm}`
  if (!groups[k]) groups[k] = []
  groups[k].push(r)
}
for (const [k, g] of Object.entries(groups).sort()) {
  const [task, arm] = k.split('|')
  const avg = (sel) => {
    const v = g.map(sel).filter((x) => x !== null)
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
  }
  const p = avg((r) => r.pass)
  const t = avg((r) => r.turns)
  const c = avg((r) => r.costUsd)
  console.log(
    `| ${task} | ${arm} | ${p === null ? '—' : p.toFixed(2)} | ${t === null ? '—' : t.toFixed(1)} | ${c === null ? '—' : `$${c.toFixed(2)}`} |`,
  )
}
const total = rows.reduce((a, r) => a + (r.costUsd ?? 0), 0)
console.log(`\n总支出(有效 run,不含报废/试点作废):$${total.toFixed(2)},共 ${rows.length} runs`)
