// T2.1 D-1/D-2 — `harnessed facts <master>` TDD.
//
// The command answers one question a model cannot answer reliably from prose:
// "which facts actually gate anything for THIS master, which of them can
// harnessed derive deterministically, and which are left for me to judge?"
//
// The fact set is derived at runtime from the master yaml's `delegates_to[].gate`
// / `skip_gate` refs → the referenced judgment expression. That is the whole
// point of OQ1=A: a hand-written SKILL template would drift silently (a renamed
// fact in a fires_when would just stop being supplied, and NOTHING would report
// it). So the reconciliation test below recomputes the expected set straight
// from the shipped yaml with an independent (regex) extractor.

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import {
  collectGatedFactNames,
  deriveGitFacts,
  type FactsEnvelope,
  runFactsPlan,
} from '../../src/cli/facts.js'
import { captureRunDeps, ExitError } from '../../src/platform/runDeps.js'
import { _clearJudgmentCache } from '../../src/workflow/judgmentResolver.js'

const REPO_ROOT = resolve(process.cwd())

let prevOverride: string | undefined
let tmp: string

beforeEach(() => {
  prevOverride = process.env.HARNESSED_ASSETS_OVERRIDE
  process.env.HARNESSED_ASSETS_OVERRIDE = REPO_ROOT
  tmp = mkdtempSync(join(tmpdir(), 'harnessed-facts-'))
  _clearJudgmentCache()
})

afterEach(() => {
  if (prevOverride === undefined) delete process.env.HARNESSED_ASSETS_OVERRIDE
  else process.env.HARNESSED_ASSETS_OVERRIDE = prevOverride
  rmSync(tmp, { recursive: true, force: true })
})

/** Deterministic git stub: maps a joined argv to canned stdout. */
function gitStub(map: Record<string, string | null>): (args: string[]) => string | null {
  return (args) => {
    const key = args.join(' ')
    return key in map ? (map[key] ?? null) : null
  }
}

const NO_GIT = () => null

async function runFacts(
  master: string,
  raw: Parameters<typeof runFactsPlan>[1] = {},
  git: (args: string[]) => string | null = NO_GIT,
): Promise<{ code: number; envelope: FactsEnvelope | null; stderr: string[] }> {
  const { deps, stdout, stderr } = captureRunDeps()
  let code = 0
  try {
    await runFactsPlan(master, raw, deps, git)
  } catch (e) {
    if (e instanceof ExitError) code = e.code
    else throw e
  }
  const text = stdout.join('\n').trim()
  return { code, envelope: text ? (JSON.parse(text) as FactsEnvelope) : null, stderr }
}

// ── D-2 derivation set ────────────────────────────────────────────────────────

describe('deriveGitFacts (D-2 deterministic derivations)', () => {
  it('sums added+deleted across worktree AND index, counts the file union', () => {
    const got = deriveGitFacts(
      gitStub({
        'diff --numstat': '10\t2\tsrc/a.ts\n5\t0\tsrc/b.ts\n',
        'diff --cached --numstat': '1\t1\tsrc/b.ts\n',
        'diff --name-only': 'src/a.ts\nsrc/b.ts\n',
        'diff --cached --name-only': 'src/b.ts\nsrc/c.ts\n',
      }),
    )
    expect(got.lines).toBe(19) // 12 + 5 + 2
    expect(got.files_touched).toBe(3) // {a,b} ∪ {b,c}
  })

  it('ignores binary numstat rows (`-\\t-\\tpath`) instead of NaN-poisoning the sum', () => {
    const got = deriveGitFacts(
      gitStub({
        'diff --numstat': '-\t-\tassets/logo.png\n4\t1\tsrc/a.ts\n',
        'diff --name-only': 'assets/logo.png\nsrc/a.ts\n',
      }),
    )
    expect(got.lines).toBe(5)
    expect(got.files_touched).toBe(2)
  })

  it('EMPTY diff → null, NOT 0 (0 would make `subtask.lines < 20` fire spuriously)', () => {
    const got = deriveGitFacts(
      gitStub({
        'diff --numstat': '',
        'diff --cached --numstat': '\n',
        'diff --name-only': '',
        'diff --cached --name-only': '',
      }),
    )
    expect(got.lines).toBeNull()
    expect(got.files_touched).toBeNull()
  })

  it('NO git (every invocation fails) → null, NOT 0', () => {
    const got = deriveGitFacts(NO_GIT)
    expect(got.lines).toBeNull()
    expect(got.files_touched).toBeNull()
  })
})

// ── D-1 fact-set reconciliation (no hardcoded list) ───────────────────────────

/** Independent extractor: read the master yaml, follow every gate/skip_gate ref
 *  into workflows/judgments/, and pull dotted identifiers out of the referenced
 *  expression with a regex. Deliberately NOT the implementation's expr-eval
 *  walk — the point is to catch drift, and two copies of one algorithm cannot. */
function expectedFactNames(master: string): string[] {
  const yamlPath =
    master === 'auto'
      ? join(REPO_ROOT, 'workflows', 'auto', 'workflow.yaml')
      : join(REPO_ROOT, 'workflows', master, 'auto', 'workflow.yaml')
  const parsed = parseYaml(readFileSync(yamlPath, 'utf8')) as {
    delegates_to?: { gate?: string; skip_gate?: string }[]
  }
  const out = new Set<string>()
  for (const clause of parsed.delegates_to ?? []) {
    for (const ref of [clause.gate, clause.skip_gate]) {
      if (!ref) continue
      const [, file, trigger, field] = ref.split('.')
      const jud = parseYaml(
        readFileSync(join(REPO_ROOT, 'workflows', 'judgments', `${file}.yaml`), 'utf8'),
      ) as { triggers?: Record<string, { fires_when?: string; skips_when?: string }> }
      const trig = jud.triggers?.[trigger as string]
      const expr = field === 'fires' ? trig?.fires_when : trig?.skips_when
      if (!expr) continue
      // identifiers, minus string literals and the operator keywords
      const literals = expr.replace(/'[^']*'/g, '')
      for (const m of literals.matchAll(/[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/g)) {
        const id = m[0]
        if (id === 'and' || id === 'or' || id === 'not' || id === 'in') continue
        if (id === 'true' || id === 'false') continue
        out.add(id)
      }
    }
  }
  return [...out].sort()
}

describe('collectGatedFactNames — derived from the shipped yaml, never hardcoded', () => {
  for (const master of ['task', 'discuss', 'plan', 'verify', 'auto', 'ship']) {
    it(`${master}: matches the facts its gate/skip_gate refs actually reference`, async () => {
      const got = await collectGatedFactNames(master, REPO_ROOT)
      expect([...got].sort()).toEqual(expectedFactNames(master))
    })
  }

  it('task requires the brainstorming + tdd facts (and only ~a dozen, not all 40)', async () => {
    const got = await collectGatedFactNames('task', REPO_ROOT)
    expect(got).toContain('subtask.approaches')
    expect(got).toContain('subtask.error_cost')
    expect(got).toContain('subtask.is_core_business_logic')
    // skip_gate wiring (D-5) makes the skips_when facts required too
    expect(got).toContain('subtask.type')
    expect(got).toContain('subtask.lines')
    expect(got.length).toBeLessThan(20)
  })
})

// ── envelope shape ────────────────────────────────────────────────────────────

describe('harnessed facts <master> envelope', () => {
  it('nests facts under phase/subtask, nulls the judgement calls, hints every null', async () => {
    const { code, envelope } = await runFacts('task')
    expect(code).toBe(0)
    const env = envelope as FactsEnvelope
    expect(env.master).toBe('task')
    const subtask = env.facts.subtask as Record<string, unknown>
    expect(subtask.approaches).toBeNull()
    expect(subtask.error_cost).toBeNull()
    // every null fact carries a one-line hint so the model knows what to judge
    for (const [group, values] of Object.entries(env.facts)) {
      if (values === null || typeof values !== 'object') continue
      for (const [k, v] of Object.entries(values as Record<string, unknown>)) {
        if (v === null) expect(env.hints[`${group}.${k}`], `${group}.${k}`).toBeTruthy()
      }
    }
    expect(env.usage).toContain('--context-file')
  })

  it('derived facts carry a value + provenance and are NOT left for the model', async () => {
    const { envelope } = await runFacts(
      'task',
      {},
      gitStub({
        'diff --numstat': '30\t7\tsrc/a.ts\n',
        'diff --name-only': 'src/a.ts\nsrc/b.ts\n',
      }),
    )
    const env = envelope as FactsEnvelope
    expect(env.derived['subtask.lines']?.value).toBe(37)
    expect(env.derived['subtask.lines']?.source).toMatch(/numstat/)
    expect(env.derived['phase.files_touched']?.value).toBe(2)
    expect(env.derived['phase.stage']?.value).toBe('task')
    // derived values land IN facts (so the filled file can be passed straight through)
    expect((env.facts.subtask as Record<string, unknown>).lines).toBe(37)
    expect((env.facts.phase as Record<string, unknown>).files_touched).toBe(2)
    // and they are not re-asked as hints
    expect(env.hints['subtask.lines']).toBeUndefined()
  })

  it('no git → the derived facts are null (model fills), never 0', async () => {
    const { envelope } = await runFacts('task', {}, NO_GIT)
    const env = envelope as FactsEnvelope
    expect(env.derived['subtask.lines']?.value).toBeNull()
    expect(env.derived['phase.files_touched']?.value).toBeNull()
    expect((env.facts.subtask as Record<string, unknown>).lines).toBeNull()
    // a null derived fact DOES get a hint — the model has to supply it now
    expect(env.hints['subtask.lines']).toBeTruthy()
  })

  it('--out writes the same JSON to disk', async () => {
    const out = join(tmp, 'facts.json')
    const { code, envelope } = await runFacts('task', { out })
    expect(code).toBe(0)
    expect(existsSync(out)).toBe(true)
    expect(JSON.parse(readFileSync(out, 'utf8'))).toEqual(envelope)
  })

  it('unknown master → exit 1 with the same wording as `harnessed gates`', async () => {
    const { code, stderr } = await runFacts('bogus')
    expect(code).toBe(1)
    expect(stderr.join('\n')).toContain("unknown master 'bogus'")
  })
})
