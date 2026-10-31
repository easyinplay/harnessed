import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { testExcludes } from '../../vitest.config.js'

type AdrBaseline = { number: string; ref: string }
type AdrResult = { ok: boolean; errors: string[] }
type BiomeClassification = { ok: boolean; allowed: unknown[]; unexpected: unknown[] }

const importScript = (path: string): Promise<unknown> => import(path)
const { checkAdrBaselines } = (await importScript('../../scripts/ci/check-adr-baselines.mjs')) as {
  checkAdrBaselines: (root?: string, baselines?: AdrBaseline[]) => AdrResult
}
const { biomeGateFailed, classifyBiomeReport } = (await importScript(
  '../../scripts/ci/check-biome.mjs',
)) as {
  biomeGateFailed: (status: number | null, classified: BiomeClassification) => boolean
  classifyBiomeReport: (report: { diagnostics?: unknown[] }) => BiomeClassification
}
const { selectPlanCheckTargets } = (await importScript(
  '../../scripts/ci/plan-check-scope.mjs',
)) as {
  selectPlanCheckTargets: (options: { root: string; changedFiles: string[] }) => string[]
}

type Step = {
  id?: string
  name?: string
  if?: string
  run?: string
  uses?: string
  with?: Record<string, unknown>
  env?: Record<string, unknown>
  'continue-on-error'?: boolean
}

type Job = {
  'runs-on': string
  'timeout-minutes'?: number
  outputs?: Record<string, unknown>
  strategy?: { matrix?: { os?: string[] } }
  steps: Step[]
}

type Workflow = { jobs: Record<string, Job> }

const ROOT = process.cwd()
const load = (name: string) =>
  parseYaml(readFileSync(join(ROOT, '.github', 'workflows', name), 'utf8')) as Workflow
const step = (job: Job, name: string) => job.steps.find((candidate) => candidate.name === name)
const job = (workflow: Workflow, name: string): Job => {
  const value = workflow.jobs[name]
  if (!value) throw new Error(`missing workflow job: ${name}`)
  return value
}
const firstStep = (job: Job): Step => {
  const value = job.steps[0]
  if (!value) throw new Error('missing workflow step')
  return value
}

describe('CI gate contracts', () => {
  it('separates Ubuntu quality from macOS and Windows tests', () => {
    const ci = load('ci.yml')
    const quality = job(ci, 'quality')
    const test = job(ci, 'test')
    expect(quality['runs-on']).toBe('ubuntu-latest')
    expect(test.strategy?.matrix?.os).toEqual(['macos-latest', 'windows-latest'])

    const qualityRuns = quality.steps.map((candidate) => candidate.run).filter(Boolean)
    expect(qualityRuns).toContain('corepack pnpm typecheck')
    expect(qualityRuns).toContain('corepack pnpm build')
    expect(qualityRuns).toContain('corepack pnpm test:coverage')
    expect(qualityRuns).toContain('node scripts/ci/check-biome.mjs')
    expect(qualityRuns).toContain('corepack pnpm validate:schema')
  })
  it('runs the ralph-loop Windows sentinel only in the Windows test matrix', () => {
    const ci = load('ci.yml')
    const quality = job(ci, 'quality')
    const test = job(ci, 'test')
    const sentinel = test.steps.find((candidate) =>
      candidate.name?.includes('ralph-loop Win sentinel'),
    )

    expect(
      quality.steps.some((candidate) => candidate.name?.includes('ralph-loop Win sentinel')),
    ).toBe(false)
    expect(test.strategy?.matrix?.os).toContain('windows-latest')
    expect(sentinel).toMatchObject({
      if: "runner.os == 'Windows'",
      run: 'corepack pnpm exec vitest run tests/workflow/ralph-loop-win-sentinel.test.ts',
    })
  })

  it('keeps A7, deferred items, and scoped plan checks hard', () => {
    const ci = load('ci.yml')
    const quality = job(ci, 'quality')
    const a7 = step(quality, 'A7 acceptance bar - ADR 0001-0032 main body conservation')
    const deferred = step(quality, 'Deferred items review')
    const plan = step(quality, 'EE-4 plan-checker quant gate')

    expect(a7?.run).toBe('node scripts/ci/check-adr-baselines.mjs')
    expect(a7?.['continue-on-error']).not.toBe(true)
    expect(deferred?.run).toBe('node scripts/check-deferred-items.mjs')
    expect(deferred?.['continue-on-error']).not.toBe(true)
    expect(plan?.run).toBe('node scripts/run-plan-checker.mjs --ci')
    expect(plan?.env?.PLAN_CHECK_BASE).toBe(
      `\${{ github.event.pull_request.base.sha || github.event.before }}`,
    )
    expect(plan?.env?.ENFORCE).not.toBe('false')
    expect(plan?.['continue-on-error']).not.toBe(true)
  })

  it('verifies real local A7 baselines and fails a missing required ref', () => {
    expect(checkAdrBaselines(ROOT).ok).toBe(true)
    expect(checkAdrBaselines(ROOT, [{ number: '0001', ref: 'adr-9999-accepted' }])).toMatchObject({
      ok: false,
      errors: [expect.stringContaining('missing baseline ref')],
    })
  })

  it('selects active and changed plans without scanning historical plans', () => {
    const root = mkdtempSync(join(tmpdir(), 'harnessed-plan-scope-'))
    try {
      mkdirSync(join(root, '.planning', 'phases', '01-old'), { recursive: true })
      mkdirSync(join(root, '.planning', 'phases', '02-changed'), { recursive: true })
      mkdirSync(join(root, '.planning', 'phases', '03-active'), { recursive: true })
      writeFileSync(
        join(root, '.planning', 'STATE.md'),
        '## Current Position\n- Phase 3 implementation in progress\n',
      )
      for (const phase of ['01-old', '02-changed', '03-active']) {
        writeFileSync(join(root, '.planning', 'phases', phase, 'task_plan.md'), '# plan\n')
      }

      const selected = selectPlanCheckTargets({
        root,
        changedFiles: ['.planning/phases/02-changed/task_plan.md'],
      })
      expect(selected).toEqual([
        '.planning/phases/02-changed/task_plan.md',
        '.planning/phases/03-active/task_plan.md',
      ])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('rejects every Biome warning except the exact forbidden diagnostic', () => {
    const exact = {
      code: { value: 'lint/style/useTemplate' },
      message: 'Template literals are preferred over string concatenation.',
      location: { path: 'src/cli/facts.ts', range: { start: { line: 134 } } },
    }
    const allowed = classifyBiomeReport({ diagnostics: [exact] })
    expect(allowed).toMatchObject({ ok: true })
    expect(biomeGateFailed(0, allowed)).toBe(false)
    expect(biomeGateFailed(1, allowed)).toBe(true)
    expect(
      classifyBiomeReport({
        diagnostics: [{ ...exact, location: { path: 'src/cli/other.ts', start: { line: 1 } } }],
      }),
    ).toMatchObject({ ok: false, unexpected: [expect.anything()] })
  })

  it('excludes perf tests by default and allows the advisory workflow to opt in', () => {
    expect(testExcludes({ CI: 'true' })).toContain('tests/**/*.perf.test.ts')
    expect(testExcludes({ CI: 'true', RUN_PERF_TESTS: '1' })).not.toContain(
      'tests/**/*.perf.test.ts',
    )
    const perfStep = step(job(load('perf-bench.yml'), 'perf'), 'perf threshold (advisory)')
    expect(perfStep?.env?.RUN_PERF_TESTS).toBe('1')
  })

  it('sets timeouts and pnpm caching on every applicable job', () => {
    for (const workflowName of ['ci.yml', 'publish.yml', 'perf-bench.yml', 'stale.yml']) {
      const workflow = load(workflowName)
      for (const [jobName, job] of Object.entries(workflow.jobs)) {
        expect(job['timeout-minutes'], `${workflowName}:${jobName}`).toBeGreaterThan(0)
        const installsPnpm = job.steps.some((candidate) => candidate.run?.includes('pnpm install'))
        if (!installsPnpm) continue
        const setupNode = job.steps.find((candidate) =>
          candidate.uses?.startsWith('actions/setup-node@'),
        )
        expect(setupNode?.with?.cache, `${workflowName}:${jobName}`).toBe('pnpm')
        expect(setupNode?.with?.['cache-dependency-path'], `${workflowName}:${jobName}`).toBe(
          'pnpm-lock.yaml',
        )
      }
    }
  })

  it('uses one advisory layer for perf and an immutable stale action', () => {
    const perf = job(load('perf-bench.yml'), 'perf')
    const perfStep = step(perf, 'perf threshold (advisory)')
    expect(perfStep?.['continue-on-error']).toBe(true)
    expect(perfStep?.run).not.toMatch(/\|\||::warning/)

    const stale = firstStep(job(load('stale.yml'), 'stale'))
    expect(stale.uses).toMatch(/^actions\/stale@[0-9a-f]{40}$/)
  })

  it('validates release tags before checkout and keeps dispatch input out of shell', () => {
    const publishWorkflow = load('publish.yml')
    const publish = job(publishWorkflow, 'publish')
    const binaries = job(publishWorkflow, 'binaries')
    const validation = step(publish, 'Validate release tag')
    const releaseCommit = step(publish, 'Resolve immutable release commit')

    expect(validation).toMatchObject({
      id: 'release',
      env: { TAG: `\${{ inputs.tag || github.ref_name }}` },
    })
    expect(validation?.run).toContain('^v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$')
    const tagPattern = /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/
    expect('v1.2.3').toMatch(tagPattern)
    expect('v01.02.03').not.toMatch(tagPattern)
    expect(validation?.run).toContain(`printf 'ref=refs/tags/%s\\n' "$TAG"`)
    expect(validation?.run).toContain(`printf 'package_version=%s\\n' "\${TAG#v}"`)

    for (const workflowJob of [publish, binaries]) {
      for (const candidate of workflowJob.steps) {
        expect(candidate.run ?? '').not.toContain(`\${{ inputs.tag }}`)
      }
    }

    const publishCheckout = publish.steps.find((candidate) =>
      candidate.uses?.startsWith('actions/checkout@'),
    )
    const binaryCheckout = binaries.steps.find((candidate) =>
      candidate.uses?.startsWith('actions/checkout@'),
    )
    const distTag = publish.steps.find((candidate) => candidate.run?.includes('npm dist-tag add'))

    expect(publishCheckout?.with?.ref).toBe(`\${{ steps.release.outputs.ref }}`)
    expect(releaseCommit).toMatchObject({
      id: 'release_commit',
      run: `printf 'commit_sha=%s\\n' "$(git rev-parse HEAD)" >> "$GITHUB_OUTPUT"`,
    })
    expect(publish.steps.at(publish.steps.indexOf(publishCheckout as Step) + 1)).toBe(releaseCommit)
    expect(binaryCheckout?.with?.ref).toBe(`\${{ needs.publish.outputs.commit_sha }}`)
    expect(distTag).toMatchObject({
      run: 'npm dist-tag add "harnessed@$PACKAGE_VERSION" latest',
      env: { PACKAGE_VERSION: `\${{ steps.release.outputs.package_version }}` },
    })
    expect(publish.outputs).toMatchObject({
      release_tag: `\${{ steps.release.outputs.tag }}`,
      commit_sha: `\${{ steps.release_commit.outputs.commit_sha }}`,
      package_version: `\${{ steps.release.outputs.package_version }}`,
    })
  })
})
