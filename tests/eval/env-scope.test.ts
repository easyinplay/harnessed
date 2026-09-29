// v16.0 Phase 65 T13 — scenario-scoped `env`.
//
// Two properties, and the second is only meaningful because of the first:
//   1. the override REACHES the engine (otherwise "it was restored" is vacuous —
//      a field nobody applies restores perfectly);
//   2. it does NOT survive the scenario. The suite is one process running
//      scenarios serially against a global process.env, so a leak would silently
//      re-key every later scenario and every later test file in the same worker.
//
// The probe is HARNESSED_ASSETS_OVERRIDE, chosen because getAssetsRoot() trusts
// it verbatim (src/platform/assetsRoot.ts) and `harnessed gates` fails loudly on
// a root with no workflows/ tree — so "env applied" shows up as a step exitCode
// flip (1 vs 0), which is golden-visible and path-normalization-proof.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runEvalSuite, runScenarioDir } from '../../src/eval/runner.js'
import { validateScenario } from '../../src/eval/schema.js'

const PROBE_KEYS = ['HARNESSED_ASSETS_OVERRIDE', 'HARNESSED_PLATFORM'] as const
const saved = new Map<string, string | undefined>()
const tmpDirs: string[] = []

function rememberEnv(): void {
  for (const k of PROBE_KEYS) saved.set(k, process.env[k])
}

afterEach(() => {
  for (const [k, v] of saved) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  saved.clear()
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** A scenario dir under a fresh temp suite root. */
function writeScenario(suite: string, dirName: string, doc: string): string {
  const dir = join(suite, dirName)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'scenario.yaml'), doc, 'utf8')
  return dir
}

function freshSuite(): string {
  const d = mkdtempSync(join(tmpdir(), 'eval-env-suite-'))
  tmpDirs.push(d)
  return d
}

/** First gates step's exitCode out of a recorded golden. */
function firstStepExit(goldenPath: string): unknown {
  const g = JSON.parse(readFileSync(goldenPath, 'utf8')) as {
    steps?: { kind: string; exitCode: number | null }[]
  }
  return g.steps?.[0]?.exitCode
}

describe('eval scenario `env` — schema', () => {
  it('accepts a string map and rejects a non-string value', () => {
    expect(
      validateScenario({ name: 'x', env: { A: 'b' }, steps: [{ gates: { master: 'verify' } }] }).ok,
    ).toBe(true)
    expect(
      validateScenario({ name: 'x', env: { A: 1 }, steps: [{ gates: { master: 'verify' } }] }).ok,
    ).toBe(false)
    expect(
      validateScenario({
        name: 'x',
        env: 'HARNESSED_PLATFORM=codex',
        steps: [{ gates: { master: 'verify' } }],
      }).ok,
    ).toBe(false)
  })

  it('a scenario without `env` still validates (the 11 committed fixtures)', () => {
    expect(validateScenario({ name: 'x', steps: [{ gates: { master: 'verify' } }] }).ok).toBe(true)
  })
})

describe('eval scenario `env` — scope', () => {
  it('applies to the scenario and does NOT leak into the next one in the suite', async () => {
    rememberEnv()
    // Start from "unset" so the delete branch of the restore is the one exercised.
    for (const k of PROBE_KEYS) delete process.env[k]

    const suite = freshSuite()
    const bogus = join(suite, 'no-such-assets-root')
    writeScenario(
      suite,
      '1-pinned',
      `name: env-pinned\nenv:\n  HARNESSED_PLATFORM: codex\n  HARNESSED_ASSETS_OVERRIDE: ${JSON.stringify(bogus)}\nsteps:\n  - gates:\n      master: verify\n`,
    )
    writeScenario(suite, '2-plain', 'name: env-plain\nsteps:\n  - gates:\n      master: verify\n')

    const res = await runEvalSuite(suite, { updateGolden: true })
    expect(res.results.map((r) => r.name)).toEqual(['env-pinned', 'env-plain'])

    // 1 — the override reached the engine: gates could not read the master yaml.
    expect(firstStepExit(join(suite, '1-pinned', 'golden.json'))).toBe(1)
    // 2 — the NEXT scenario saw the real assets root again (no leak).
    expect(firstStepExit(join(suite, '2-plain', 'golden.json'))).toBe(0)

    // 3 — keys absent before the run are DELETED afterwards, not set to ''.
    for (const k of PROBE_KEYS) {
      expect(process.env[k], `${k} must be restored to absent`).toBeUndefined()
      expect(k in process.env, `${k} must not linger as an empty string`).toBe(false)
    }
  }, 60_000)

  it('restores a pre-existing value verbatim', async () => {
    rememberEnv()
    process.env.HARNESSED_PLATFORM = 'claude'

    const suite = freshSuite()
    const dir = writeScenario(
      suite,
      'pinned',
      'name: env-restore\nenv:\n  HARNESSED_PLATFORM: codex\nsteps:\n  - gates:\n      master: verify\n',
    )
    const r = await runScenarioDir(dir, { updateGolden: true })
    expect(r.status).toBe('UPDATED')
    expect(process.env.HARNESSED_PLATFORM).toBe('claude')
  }, 60_000)

  it('restores even when the scenario throws mid-run', async () => {
    rememberEnv()
    for (const k of PROBE_KEYS) delete process.env[k]

    const suite = freshSuite()
    // A file step escaping the repo dir throws inside execStep (not an ExitError),
    // so the run leaves through the catch — the finally is the only thing that can
    // put the env back.
    const dir = writeScenario(
      suite,
      'thrower',
      'name: env-throw\nenv:\n  HARNESSED_PLATFORM: codex\nsteps:\n  - file:\n      path: ../escape.txt\n      content: x\n',
    )
    const r = await runScenarioDir(dir, {})
    expect(r.status).toBe('ERROR')
    expect(process.env.HARNESSED_PLATFORM).toBeUndefined()
    expect('HARNESSED_PLATFORM' in process.env).toBe(false)
  }, 60_000)
})
