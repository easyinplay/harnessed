#!/usr/bin/env node
// B1 evidence-pack runner (W1). One run = one (task, arm, rep) cell:
//   node scripts/evidence-pack/run.mjs --task bugfix-todo-api --arm bare --rep 1 [--dry-run]
//
// Protocol per run:
//   1. isolate  — copy the fixture to a fresh tmp workspace (never run in-tree)
//   2. dispatch — arm `bare`: `claude -p "<task.md>" --output-format stream-json`
//                 arm `harnessed`: same entry, prompt wrapped as /auto "<task.md>"
//                 (workflow skills assumed installed globally; W2 pilot calibrates
//                 flags — permission mode, max turns — and freezes them here)
//   3. capture  — raw stream-json transcript → runs/<task>-<arm>-r<N>.jsonl
//   4. measure  — turns + token usage summed from the transcript
//   5. accept   — node acceptance.mjs inside the workspace → checklist JSON
//   6. record   — runs/<task>-<arm>-r<N>.result.json (exact command included)
//
// --dry-run exercises 1, prints the exact command for 2, runs 5 against the
// pristine copy (initial-state checklist), and records a result marked dryRun —
// zero tokens spent. W1 acceptance = dry-run works end-to-end on all cells.

import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..', '..')
const TASKS_DIR = join(REPO, 'fixtures', 'evidence-tasks')
const RUNS_DIR = join(HERE, 'runs')
const ARMS = new Set(['bare', 'harnessed'])

function usage(msg) {
  if (msg) console.error(`error: ${msg}`)
  console.error(
    'usage: node scripts/evidence-pack/run.mjs --task <name> --arm bare|harnessed --rep <n> [--dry-run]',
  )
  process.exit(2)
}

function parseArgs(argv) {
  const opts = { task: null, arm: null, rep: null, dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--task') opts.task = argv[++i]
    else if (a === '--arm') opts.arm = argv[++i]
    else if (a === '--rep') opts.rep = Number(argv[++i])
    else if (a === '--dry-run') opts.dryRun = true
    else usage(`unknown flag: ${a}`)
  }
  if (!opts.task) usage('--task is required')
  if (!opts.arm || !ARMS.has(opts.arm)) usage('--arm must be bare|harnessed')
  if (!Number.isInteger(opts.rep) || opts.rep < 1) usage('--rep must be a positive integer')
  return opts
}

/** Build the exact dispatch command for an arm. Calibrated in W2 (pilot run
 *  2026-07-13), frozen after: headless needs permissions pre-granted (isolated
 *  temp workspace — the agent only ever sees the fixture copy) and a turn cap
 *  so a wedged run cannot burn unbounded tokens. */
function buildCommand(arm, prompt) {
  const base = [
    'claude',
    '-p',
    '--output-format',
    'stream-json',
    '--verbose',
    '--dangerously-skip-permissions',
    '--max-turns',
    '40',
  ]
  // bare arm: same machine state (ceteris paribus — the ONLY variable is the
  // /auto entry), but the Skill tool is disallowed so ambient installed skills
  // cannot leak orchestration into the bare run. NOTE --disallowedTools is
  // VARIADIC — it must come AFTER the positional prompt or it swallows it
  // (W3 calibration: two bare runs failed with "Input must be provided").
  if (arm === 'bare') return [...base, prompt, '--disallowedTools', 'Skill']
  // harnessed arm: same headless entry; the /auto skill routes through the
  // engine (gates → checkpoint → prompt → evidence guard).
  return [...base, `/auto "${prompt.replace(/"/g, '\\"')}"`]
}

/** Sum turns + token usage from a stream-json transcript. Fail-soft: absent
 *  fields count as zero (schema drift must not crash the recorder). */
function summarizeTranscript(jsonlPath) {
  const sums = { turns: 0, inputTokens: 0, outputTokens: 0, costUsd: null, resultSubtype: null }
  let text = ''
  try {
    text = readFileSync(jsonlPath, 'utf8')
  } catch {
    return sums
  }
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    let msg
    try {
      msg = JSON.parse(line)
    } catch {
      continue
    }
    if (msg.type === 'assistant') sums.turns += 1
    const u = msg.usage ?? msg.message?.usage
    if (u) {
      sums.inputTokens += u.input_tokens ?? 0
      sums.outputTokens += u.output_tokens ?? 0
    }
    if (msg.type === 'result') {
      sums.resultSubtype = msg.subtype ?? null
      if (typeof msg.total_cost_usd === 'number') sums.costUsd = msg.total_cost_usd
      if (typeof msg.num_turns === 'number') sums.turns = msg.num_turns
    }
  }
  return sums
}

function runAcceptance(workspace) {
  const r = spawnSync('node', ['acceptance.mjs'], { cwd: workspace, encoding: 'utf8' })
  try {
    return { exitCode: r.status ?? -1, checklist: JSON.parse(r.stdout) }
  } catch {
    return { exitCode: r.status ?? -1, checklist: null, stderr: (r.stderr ?? '').slice(0, 500) }
  }
}

const opts = parseArgs(process.argv.slice(2))
const fixture = join(TASKS_DIR, opts.task)
let prompt
try {
  prompt = readFileSync(join(fixture, 'task.md'), 'utf8').trim()
} catch {
  usage(`no such task fixture: ${opts.task} (expected ${fixture}/task.md)`)
}

// 1. isolate
const workspace = mkdtempSync(join(tmpdir(), `evidence-${opts.task}-${opts.arm}-`))
cpSync(fixture, workspace, { recursive: true })
mkdirSync(RUNS_DIR, { recursive: true })

const stem = `${opts.task}-${opts.arm}-r${opts.rep}`
const transcriptPath = join(RUNS_DIR, `${stem}.jsonl`)
const resultPath = join(RUNS_DIR, `${stem}.result.json`)
const command = buildCommand(opts.arm, prompt)

console.log(`[evidence-pack] task=${opts.task} arm=${opts.arm} rep=${opts.rep}`)
console.log(`[evidence-pack] workspace: ${workspace}`)
console.log(`[evidence-pack] transcript: ${transcriptPath}`)
console.log(`[evidence-pack] command: ${JSON.stringify(command)}`)

let transcript = null
if (opts.dryRun) {
  console.log('[evidence-pack] --dry-run: skipping agent dispatch (zero tokens)')
} else {
  // 2-3. dispatch + capture. stdout IS the stream-json transcript.
  const out = execFileSync(command[0], command.slice(1), {
    cwd: workspace,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  writeFileSync(transcriptPath, out)
  transcript = summarizeTranscript(transcriptPath)
}

// 5. accept (dry-run: initial-state checklist of the pristine copy)
const acceptance = runAcceptance(workspace)

// 6. record
const record = {
  task: opts.task,
  arm: opts.arm,
  rep: opts.rep,
  dryRun: opts.dryRun,
  timestamp: new Date().toISOString(),
  command,
  workspace,
  transcript: opts.dryRun ? null : transcriptPath,
  metrics: transcript,
  acceptance,
}
writeFileSync(resultPath, `${JSON.stringify(record, null, 2)}\n`)
console.log(`[evidence-pack] result: ${resultPath}`)
console.log(
  `[evidence-pack] acceptance passRate: ${acceptance.checklist?.passRate ?? 'n/a'}${opts.dryRun ? ' (initial state — dry-run)' : ''}`,
)

rmSync(workspace, { recursive: true, force: true })
