// T2.1 D-3/D-4/D-5 — `harnessed gates --context-file` + `delegates_to[].skip_gate`.
//
// Runs the REAL gate stack (no judgmentResolver mock): a temp assets root holds a
// synthetic master + judgment file, so the truth table is exact and the
// fail-closed / no-veto branches are exercised end to end.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { runGatesPlan } from '../../src/cli/gates.js'
import { captureRunDeps, ExitError } from '../../src/platform/runDeps.js'
import { _clearJudgmentCache } from '../../src/workflow/judgmentResolver.js'

let root: string
let prevOverride: string | undefined
let seq = 0

interface GatesPlanJson {
  master: string
  fire: { sub: string; gate?: string }[]
  skip: { sub: string; reason: string }[]
}

function nextJudgment(): string {
  seq += 1
  return `t21-ctxfile-${seq}`
}

function writeJudgment(base: string, body: string): void {
  const dir = join(root, 'workflows', 'judgments')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${base}.yaml`), body, 'utf8')
}

function writeMaster(master: string, delegatesYaml: string): void {
  const dir = join(root, 'workflows', master, 'auto')
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'workflow.yaml'),
    `schema_version: harnessed.workflow.v3\nworkflow: ${master}\ndelegates_to:\n${delegatesYaml}\n`,
    'utf8',
  )
}

async function runGates(
  master: string,
  raw: Parameters<typeof runGatesPlan>[1],
): Promise<{ code: number; plan: GatesPlanJson | null; stderr: string }> {
  const { deps, stdout, stderr } = captureRunDeps()
  let code = 0
  try {
    await runGatesPlan(master, raw, deps)
  } catch (e) {
    if (e instanceof ExitError) code = e.code
    else throw e
  }
  const text = stdout.join('\n').trim()
  return {
    code,
    plan: text ? (JSON.parse(text) as GatesPlanJson) : null,
    stderr: stderr.join('\n'),
  }
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'harnessed-gates-ctx-'))
  prevOverride = process.env.HARNESSED_ASSETS_OVERRIDE
  process.env.HARNESSED_ASSETS_OVERRIDE = root
  _clearJudgmentCache()
})

afterEach(() => {
  if (prevOverride === undefined) delete process.env.HARNESSED_ASSETS_OVERRIDE
  else process.env.HARNESSED_ASSETS_OVERRIDE = prevOverride
  rmSync(root, { recursive: true, force: true })
})

// ── D-3: --context-file ───────────────────────────────────────────────────────

describe('--context-file (D-3)', () => {
  function setupSimple(judgment: string): void {
    writeJudgment(
      judgment,
      `schema_version: harnessed.judgment.v1
triggers:
  demo:
    fires_when: "subtask.approaches >= 2"
`,
    )
    writeMaster('task', `  - sub: code\n    gate: judgments.${judgment}.demo.fires\n`)
  }

  it('merges the file over the defaults (fact from file wins)', async () => {
    const j = nextJudgment()
    setupSimple(j)
    const p = join(root, 'ctx.json')
    writeFileSync(p, JSON.stringify({ subtask: { approaches: 1 } }), 'utf8')
    const { plan } = await runGates('task', { contextFile: p })
    expect(plan?.fire.map((f) => f.sub)).toEqual([])
    expect(plan?.skip[0]?.reason).toContain('= false')
  })

  it('--context is applied AFTER --context-file (command line overrides the file)', async () => {
    const j = nextJudgment()
    setupSimple(j)
    const p = join(root, 'ctx.json')
    writeFileSync(p, JSON.stringify({ subtask: { approaches: 1 } }), 'utf8')
    const { plan } = await runGates('task', {
      contextFile: p,
      context: JSON.stringify({ subtask: { approaches: 5 } }),
    })
    expect(plan?.fire.map((f) => f.sub)).toEqual(['task-code'])
  })

  it('a null fact means NOT PROVIDED — the default is kept, not overwritten (D-4)', async () => {
    const j = nextJudgment()
    writeJudgment(
      j,
      `schema_version: harnessed.judgment.v1
triggers:
  demo:
    fires_when: "subtask.error_cost == 'high'"
`,
    )
    writeMaster('task', `  - sub: code\n    gate: judgments.${j}.demo.fires\n`)
    const p = join(root, 'ctx.json')
    // model left it unfilled; null must NOT become `null == 'high'` nor clobber
    writeFileSync(p, JSON.stringify({ subtask: { error_cost: null, approaches: 4 } }), 'utf8')
    const { plan, code } = await runGates('task', { contextFile: p })
    expect(code).toBe(0)
    // default error_cost is not 'high' post-OQ2, so it stays skipped — the point
    // is that it evaluated cleanly instead of throwing / firing on a null.
    expect(plan?.skip[0]?.reason).toContain('= false')
  })

  it('accepts the `harnessed facts` envelope (unwraps a top-level `facts` object)', async () => {
    const j = nextJudgment()
    setupSimple(j)
    const p = join(root, 'facts.json')
    writeFileSync(
      p,
      JSON.stringify({ master: 'task', facts: { subtask: { approaches: 7 } }, hints: {} }),
      'utf8',
    )
    const { plan } = await runGates('task', { contextFile: p })
    expect(plan?.fire.map((f) => f.sub)).toEqual(['task-code'])
  })

  it('invalid JSON → exit 1, wording mirrors --context', async () => {
    const j = nextJudgment()
    setupSimple(j)
    const p = join(root, 'bad.json')
    writeFileSync(p, '{not json', 'utf8')
    const file = await runGates('task', { contextFile: p })
    const inline = await runGates('task', { context: '{not json' })
    expect(file.code).toBe(1)
    expect(inline.code).toBe(1)
    expect(file.stderr).toContain('error: --context-file is not valid JSON —')
    expect(inline.stderr).toContain('error: --context is not valid JSON —')
  })

  it('unreadable file → exit 1 with the path in the message', async () => {
    const j = nextJudgment()
    setupSimple(j)
    const missing = join(root, 'nope.json')
    const { code, stderr } = await runGates('task', { contextFile: missing })
    expect(code).toBe(1)
    expect(stderr).toContain('--context-file')
    expect(stderr).toContain(missing)
  })
})

// ── D-5: skip_gate, four combination states ───────────────────────────────────

describe('delegates_to[].skip_gate (D-5) — four combination states', () => {
  function setup(judgment: string, opts: { fires: string; skips?: string }): void {
    writeJudgment(
      judgment,
      `schema_version: harnessed.judgment.v1
triggers:
  demo:
    fires_when: "${opts.fires}"
${opts.skips ? `    skips_when: "${opts.skips}"\n` : ''}`,
    )
  }

  it('1. gate fires + NO skip_gate → runs (today’s behaviour, unchanged)', async () => {
    const j = nextJudgment()
    setup(j, { fires: 'subtask.approaches >= 2', skips: 'subtask.lines < 20' })
    writeMaster('task', `  - sub: code\n    gate: judgments.${j}.demo.fires\n`)
    const { plan } = await runGates('task', {
      context: JSON.stringify({ subtask: { approaches: 4, lines: 5 } }),
    })
    expect(plan?.fire.map((f) => f.sub)).toEqual(['task-code'])
  })

  it('2. gate fires + skip_gate TRUE → vetoed, recorded with the skip_gate reason', async () => {
    const j = nextJudgment()
    setup(j, { fires: 'subtask.approaches >= 2', skips: 'subtask.lines < 20' })
    writeMaster(
      'task',
      `  - sub: code\n    gate: judgments.${j}.demo.fires\n    skip_gate: judgments.${j}.demo.skips\n`,
    )
    const { plan } = await runGates('task', {
      context: JSON.stringify({ subtask: { approaches: 4, lines: 5 } }),
    })
    expect(plan?.fire).toEqual([])
    expect(plan?.skip[0]?.sub).toBe('code')
    expect(plan?.skip[0]?.reason).toContain(`judgments.${j}.demo.skips`)
  })

  it('3. gate does NOT fire → skipped for the gate reason; skip_gate is never consulted', async () => {
    const j = nextJudgment()
    setup(j, { fires: 'subtask.approaches >= 2', skips: 'subtask.lines < 20' })
    writeMaster(
      'task',
      `  - sub: code\n    gate: judgments.${j}.demo.fires\n    skip_gate: judgments.${j}.demo.skips\n`,
    )
    const { plan } = await runGates('task', {
      context: JSON.stringify({ subtask: { approaches: 1, lines: 5 } }),
    })
    expect(plan?.fire).toEqual([])
    expect(plan?.skip[0]?.reason).toContain(`gate judgments.${j}.demo.fires = false`)
    expect(plan?.skip[0]?.reason).not.toContain('.skips')
  })

  it('4. skip_gate hits an UNDEFINED variable → no veto, the sub still runs', async () => {
    const j = nextJudgment()
    setup(j, { fires: 'subtask.approaches >= 2', skips: 'never_declared_flag == true' })
    writeMaster(
      'task',
      `  - sub: code\n    gate: judgments.${j}.demo.fires\n    skip_gate: judgments.${j}.demo.skips\n`,
    )
    const { plan } = await runGates('task', {
      context: JSON.stringify({ subtask: { approaches: 4 } }),
    })
    expect(plan?.fire.map((f) => f.sub)).toEqual(['task-code'])
  })
})
