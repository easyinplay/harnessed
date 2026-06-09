// Phase 4.1 W1 T1.6 -- benchmark integrity gate (D-01 + D-02 + D-04 sneak-block守门).
//
// Sister tests/routing/phase-3.4-routing-hit-rate.test.ts schema + describe
// structure. Verifies docs/benchmarks/v0.4.md is a faithful FULL D-02 projection
// of SAMPLES.md 30-row REAL HISTORICAL single SoT (D-01 LOCKED).
//
// Gates:
// - Row count: v0.4.md `### T##` sections == 30 (matches SAMPLES.md row count)
// - Source commits: each v0.4.md T## section cites SAMPLES.md row's source_commit
// - Per-tier breakdown: 10 Haiku + 10 Sonnet + 10 Opus (matches SAMPLES.md frozen distribution)
// - D-02 5-element schema: per-task Raw prompt / Routing decision / Manual review verdict
// - D-04 sneak block: NO 'benchmark' literal in .github/workflows/ci.yml (no CI cron sneak)
// - D-04 sneak block: NO benchmark.yml in .github/workflows/

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = process.cwd()
const BENCHMARK_PATH = join(REPO_ROOT, 'docs', 'benchmarks', 'v0.4.md')
const SAMPLES_PATH = join(
  REPO_ROOT,
  '.planning',
  'milestones',
  'v0.3.0-phases',
  'phase-3.4',
  'SAMPLES.md',
)
const CI_YML_PATH = join(REPO_ROOT, '.github', 'workflows', 'ci.yml')
const WORKFLOWS_DIR = join(REPO_ROOT, '.github', 'workflows')

const benchmarkMd = readFileSync(BENCHMARK_PATH, 'utf8')
const samplesMd = readFileSync(SAMPLES_PATH, 'utf8')

describe('Phase 4.1 W1 T1.6 -- benchmark integrity gate (D-01 + D-02)', () => {
  it('docs/benchmarks/v0.4.md has exactly 30 task sections (D-01 SAMPLES.md row count match)', () => {
    const taskSectionRe = /^### T(0[1-9]|[12][0-9]|30) /gm
    const matches = benchmarkMd.match(taskSectionRe) ?? []
    expect(matches.length).toBe(30)
  })

  it('SAMPLES.md has exactly 30 rows (D-01 single SoT frozen invariant)', () => {
    const rowRe = /^\|\s*(0[1-9]|[12][0-9]|30)\s*\|\s*T\d{2}\s*\|/gm
    const matches = samplesMd.match(rowRe) ?? []
    expect(matches.length).toBe(30)
  })

  it('per-tier breakdown matches SAMPLES.md frozen 10/10/10 distribution', () => {
    // Count tier labels in v0.4.md section headers `### T## (Haiku | Sonnet | Opus / ...) ...`
    const haikuCount = (benchmarkMd.match(/^### T\d{2} \(Haiku /gm) ?? []).length
    const sonnetCount = (benchmarkMd.match(/^### T\d{2} \(Sonnet /gm) ?? []).length
    const opusCount = (benchmarkMd.match(/^### T\d{2} \(Opus /gm) ?? []).length
    expect(haikuCount).toBe(10)
    expect(sonnetCount).toBe(10)
    expect(opusCount).toBe(10)
  })

  it('every benchmark T## section cites its SAMPLES.md source_commit (D-01 single SoT守门)', () => {
    // Extract all source_commit values from SAMPLES.md (7-10 hex backtick-fenced)
    const commitRe = /\|\s*`([0-9a-f]{7,10})`\s*\|/g
    const sampleCommits: string[] = []
    for (const m of samplesMd.matchAll(commitRe)) {
      if (m[1]) sampleCommits.push(m[1])
    }
    expect(sampleCommits.length).toBe(30)
    // Each SAMPLES commit must appear at least once in benchmark v0.4.md
    for (const sha of sampleCommits) {
      expect(benchmarkMd.includes(sha)).toBe(true)
    }
  })

  it('every T## section has Raw prompt + Routing decision + Manual review verdict (D-02 FULL 5-element)', () => {
    const rawPromptCount = (benchmarkMd.match(/\*\*Raw prompt\*\*/g) ?? []).length
    const routingCount = (benchmarkMd.match(/\*\*Routing decision\*\*/g) ?? []).length
    const verdictCount = (benchmarkMd.match(/\*\*Manual review verdict\*\*/g) ?? []).length
    const recoveryCount = (benchmarkMd.match(/\*\*Miss recovery path\*\*/g) ?? []).length
    expect(rawPromptCount).toBeGreaterThanOrEqual(30)
    expect(routingCount).toBeGreaterThanOrEqual(30)
    expect(verdictCount).toBeGreaterThanOrEqual(30)
    expect(recoveryCount).toBeGreaterThanOrEqual(30)
  })

  it('aggregate footer declares 30/30 verdict (anti-vanity transparency)', () => {
    expect(benchmarkMd).toMatch(/30\/30/)
    expect(benchmarkMd).toMatch(/Haiku:.*10\/10/)
    expect(benchmarkMd).toMatch(/Sonnet:.*10\/10/)
    expect(benchmarkMd).toMatch(/Opus:.*10\/10/)
  })
})

describe('Phase 4.1 W1 T1.6 -- D-04 MANUAL CI sneak-block守门', () => {
  it('no benchmark.yml in .github/workflows/ (D-04 sneak block守门 no cron sneak)', () => {
    const files = readdirSync(WORKFLOWS_DIR)
    const benchmarkWorkflows = files.filter((f) => f.toLowerCase().includes('benchmark'))
    expect(benchmarkWorkflows).toEqual([])
  })

  it('no "benchmark" literal in .github/workflows/ci.yml (D-04 sneak block守门 no per-PR step)', () => {
    const ciYml = readFileSync(CI_YML_PATH, 'utf8')
    // The literal "benchmark" must not appear in ci.yml (we use routing harness instead)
    const benchmarkMatches = ciYml.match(/benchmark/gi) ?? []
    expect(benchmarkMatches.length).toBe(0)
  })
})
