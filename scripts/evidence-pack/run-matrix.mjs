// W3 driver — runs the remaining evidence matrix sequentially with a cumulative
// cost abort (user-approved cap $100, 2026-07-13). One-off; reads costUsd from
// each run's result.json. Detached execution: logs to runs/matrix.log.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const CAP_USD = 100
const ALREADY_SPENT = 9.93 // pilots: bare-r1(pre-setup, superseded) + harnessed 0-token misfire + harnessed-r1
const RUNS = [
  ['bugfix-todo-api', 'bare', 1], // redo post-setup (env consistency)
  ['bugfix-todo-api', 'bare', 2],
  ['bugfix-todo-api', 'harnessed', 2],
  ['feature-cli-stats', 'bare', 1],
  ['feature-cli-stats', 'bare', 2],
  ['feature-cli-stats', 'harnessed', 1],
  ['feature-cli-stats', 'harnessed', 2],
  ['refactor-parser', 'bare', 1],
  ['refactor-parser', 'bare', 2],
  ['refactor-parser', 'harnessed', 1],
  ['refactor-parser', 'harnessed', 2],
]

let spent = ALREADY_SPENT
for (const [task, arm, rep] of RUNS) {
  if (spent >= CAP_USD) {
    console.log(
      `[matrix] COST CAP REACHED ($${spent.toFixed(2)} >= $${CAP_USD}) — aborting before ${task}/${arm}/r${rep}`,
    )
    process.exit(2)
  }
  console.log(`[matrix] > ${task} x ${arm} x r${rep} (spent so far: $${spent.toFixed(2)})`)
  try {
    execFileSync(
      'node',
      ['scripts/evidence-pack/run.mjs', '--task', task, '--arm', arm, '--rep', String(rep)],
      { stdio: 'inherit', timeout: 30 * 60 * 1000 },
    )
  } catch (e) {
    console.log(`[matrix] run FAILED (${e.message}) — continuing (failure is data)`)
  }
  try {
    const r = JSON.parse(
      readFileSync(
        join('scripts/evidence-pack/runs', `${task}-${arm}-r${rep}.result.json`),
        'utf8',
      ),
    )
    spent += r.metrics?.costUsd ?? 0
    const pass = r.acceptance?.checklist?.passRate ?? r.acceptance?.passRate ?? '?'
    console.log(
      `[matrix] OK cost $${(r.metrics?.costUsd ?? 0).toFixed(2)} | pass ${pass} | cumulative $${spent.toFixed(2)}`,
    )
  } catch {
    console.log('[matrix] (no result.json — skipping cost accrual)')
  }
}
console.log(`[matrix] DONE — total spent $${spent.toFixed(2)}`)
