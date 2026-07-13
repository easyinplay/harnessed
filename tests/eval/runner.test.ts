// 4.31.0 eval Slice A (T3) — runner: real orchestration drive + error triage
// (CONFIG-ERROR / MISSING-GOLDEN / ERROR vs FAIL vs PASS) + $unset + coverage.
//
// The runner MUST call the wave-0 extracted run* orchestration functions
// (runGatesPlan / runCheckpoint*) — trap scenarios exercise the REAL guard
// paths (serial-order / evidence three-state / fail-closed split), not a
// reimplementation. Isolation: per-scenario tmpdir via HARNESSED_ROOT_OVERRIDE
// + chdir + _clearJudgmentCache; scenarios run serially.

import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { computeCoverage, runEvalSuite, runScenarioDir } from '../../src/eval/runner.js'

const cleanups: string[] = []
afterEach(() => {
  for (const d of cleanups.splice(0)) rmSync(d, { recursive: true, force: true })
})

function scenarioDir(yaml: string, golden?: unknown): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'eval-fix-')))
  cleanups.push(dir)
  writeFileSync(join(dir, 'scenario.yaml'), yaml, 'utf8')
  if (golden !== undefined) {
    writeFileSync(join(dir, 'golden.json'), `${JSON.stringify(golden, null, 2)}\n`, 'utf8')
  }
  return dir
}

const GATES_ONLY = `
name: smoke-gates
steps:
  - gates:
      master: verify
      task: eval smoke
`

describe('runScenarioDir (T3)', () => {
  it('MISSING-GOLDEN on first run; --update-golden records then PASS on rerun', async () => {
    const dir = scenarioDir(GATES_ONLY)
    const first = await runScenarioDir(dir, {})
    expect(first.status).toBe('MISSING-GOLDEN')
    expect(first.detail?.join('\n')).toMatch(/--update-golden/)

    const rec = await runScenarioDir(dir, { updateGolden: true })
    expect(rec.status).toBe('UPDATED')
    const g = JSON.parse(readFileSync(join(dir, 'golden.json'), 'utf8'))
    expect(g).toBeTruthy()

    const second = await runScenarioDir(dir, {})
    expect(second.status).toBe('PASS')
  })

  it('golden is normalized: no absolute tmp paths, no timestamps, no backslashes', async () => {
    const dir = scenarioDir(
      `
name: norm
steps:
  - file:
      path: .planning/STATE.md
      content: "# STATE"
  - gates:
      master: verify
  - checkpoint:
      action: start
      sub: verify
      plan:
        fire:
          - sub: progress
            mode: serial
            order: 1
        skip: []
  - checkpoint:
      action: complete
      sub: progress
`,
    )
    const rec = await runScenarioDir(dir, { updateGolden: true })
    expect(rec.status).toBe('UPDATED')
    const raw = readFileSync(join(dir, 'golden.json'), 'utf8')
    expect(raw).not.toMatch(/started_at|completed_at/)
    expect(raw).not.toMatch(/\\\\/) // no windows separators survive normalization
    expect(raw).not.toMatch(/eval-run-/) // tmp roots replaced by <TMP>
  })

  it('FAIL with diff lines when actual diverges from golden', async () => {
    const dir = scenarioDir(GATES_ONLY)
    await runScenarioDir(dir, { updateGolden: true })
    // poison the golden
    const g = JSON.parse(readFileSync(join(dir, 'golden.json'), 'utf8'))
    g.steps[0].exitCode = 99
    writeFileSync(join(dir, 'golden.json'), JSON.stringify(g, null, 2), 'utf8')
    const r = await runScenarioDir(dir, {})
    expect(r.status).toBe('FAIL')
    expect(r.detail?.length).toBeGreaterThan(0)
  })

  it('CONFIG-ERROR for invalid scenario yaml (named, not counted as FAIL)', async () => {
    const dir = scenarioDir('name: broken\nsteps: []\n')
    const r = await runScenarioDir(dir, {})
    expect(r.status).toBe('CONFIG-ERROR')
    expect(r.detail?.join('\n')).toMatch(/scenario\.yaml/)
  })

  it('drives the REAL serial-order guard: completing a serial successor while predecessor pending → step exit 1 captured', async () => {
    const dir = scenarioDir(
      `
name: serial-guard
steps:
  - checkpoint:
      action: start
      sub: verify
      plan:
        fire:
          - sub: progress
            mode: serial
            order: 1
          - sub: simplify
            mode: serial
            order: 99
        skip: []
  - checkpoint:
      action: complete
      sub: simplify
`,
    )
    const rec = await runScenarioDir(dir, { updateGolden: true })
    expect(rec.status).toBe('UPDATED')
    const g = JSON.parse(readFileSync(join(dir, 'golden.json'), 'utf8'))
    const completeStep = g.steps[1]
    expect(completeStep.exitCode).toBe(1)
    expect(completeStep.stderr.join('\n')).toMatch(/serial-order guard|BLOCKED/)
  })

  it('seed_context $unset + doctored assets tree reproduces the 4.23.2 undefined-variable fail-closed path', async () => {
    // assets_dir points at a fixture assets tree whose verify master has a
    // gate referencing a variable ABSENT from the default context — the
    // 4.23.2 fail-closed skip (not fail-open fire) is asserted through the
    // REAL runGatesPlan.
    const dir = scenarioDir(
      `
name: undefined-var
assets_dir: assets
steps:
  - gates:
      master: verify
`,
    )
    const assets = join(dir, 'assets')
    mkdirSync(join(assets, 'workflows', 'verify', 'auto'), { recursive: true })
    mkdirSync(join(assets, 'workflows', 'judgments'), { recursive: true })
    writeFileSync(
      join(assets, 'workflows', 'verify', 'auto', 'workflow.yaml'),
      [
        'schema_version: harnessed.workflow.v3',
        'workflow: verify',
        'delegates_to:',
        '  - sub: progress',
        '    mode: serial',
        '    order: 1',
        '  - sub: multispec',
        '    gate: judgments.stage-routing.verify-multispec-critical-release.fires',
        '    mode: parallel',
        '',
      ].join('\n'),
      'utf8',
    )
    writeFileSync(
      join(assets, 'workflows', 'judgments', 'stage-routing.yaml'),
      [
        'schema_version: harnessed.judgment.v1',
        'triggers:',
        '  verify-multispec-critical-release:',
        '    fires_when: "totally_unknown_variable == true"',
        '',
      ].join('\n'),
      'utf8',
    )
    const rec = await runScenarioDir(dir, { updateGolden: true })
    expect(rec.status).toBe('UPDATED')
    const g = readFileSync(join(dir, 'golden.json'), 'utf8')
    expect(g).toMatch(/fail-closed, not fired/)
    expect(g).not.toMatch(/"sub":\s*"verify-multispec",[\s\S]*?"fire"/) // not fail-open fired
  })

  it('runEvalSuite: serial over a directory, summary counts + evaluated gate refs collected', async () => {
    const parent = realpathSync(mkdtempSync(join(tmpdir(), 'eval-suite-')))
    cleanups.push(parent)
    const s1 = join(parent, 's1')
    mkdirSync(s1)
    writeFileSync(join(s1, 'scenario.yaml'), GATES_ONLY, 'utf8')
    const s2 = join(parent, 's2')
    mkdirSync(s2)
    writeFileSync(join(s2, 'scenario.yaml'), 'name: bad\nsteps: []\n', 'utf8')

    const suite = await runEvalSuite(parent, { updateGolden: true })
    expect(suite.results.length).toBe(2)
    expect(suite.summary.updated).toBe(1)
    expect(suite.summary.configError).toBe(1)
    const refs = suite.results.flatMap((r) => r.evaluatedGateRefs)
    expect(refs.some((r) => r.startsWith('judgments.stage-routing.'))).toBe(true)
  })
})

describe('computeCoverage (T4/E2)', () => {
  it('marks evaluated triggers covered and the rest bare', () => {
    const cov = computeCoverage(
      ['judgments.stage-routing.verify-paranoid-critical.fires'],
      process.cwd(),
    )
    const hit = cov.find((c) => c.ref === 'judgments.stage-routing.verify-paranoid-critical.fires')
    expect(hit?.covered).toBe(true)
    expect(cov.some((c) => !c.covered)).toBe(true)
    // enumeration comes from the real judgments yaml set
    expect(cov.length).toBeGreaterThan(10)
  })
})
