// src/eval/runner.ts — deterministic scenario runner (4.31.0 Slice A, T3).
//
// Drives the wave-0 EXTRACTED orchestration functions (runGatesPlan /
// runCheckpointStart/Complete/Fail) so trap scenarios exercise the REAL guard
// paths — serial-order guard, evidence three-state, 4.23.2 fail-closed/
// fail-soft split, --skip-sub alias matching — not a reimplementation.
//
// Isolation per scenario (CEO plan): fresh tmpdirs (realpath'd) for the
// harnessed state root (HARNESSED_ROOT_OVERRIDE) and the repo cwd (chdir —
// checkArtifacts/checkPlanningSync read process.cwd()); judgments cache
// cleared; scenarios run SERIALLY (cwd is process-global). Error triage
// (locked F2): CONFIG-ERROR (bad yaml/schema, named, not a FAIL) /
// MISSING-GOLDEN (first run → --update-golden) / ERROR (engine threw, stack)
// vs FAIL (golden mismatch) vs PASS / UPDATED.

import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { captureRunDeps, ExitError } from '../cli/lib/runDeps.js'
import { diffGolden, loadGolden, normalizeGolden, writeGolden } from './golden.js'
import { type EvalScenarioType, validateScenario } from './schema.js'

export type ScenarioStatus =
  | 'PASS'
  | 'FAIL'
  | 'ERROR'
  | 'CONFIG-ERROR'
  | 'MISSING-GOLDEN'
  | 'UPDATED'

export interface StepRecord {
  kind: 'gates' | 'checkpoint' | 'file'
  exitCode: number | null
  stdout: string[]
  stderr: string[]
}

export interface ScenarioResult {
  name: string
  dir: string
  status: ScenarioStatus
  detail?: string[]
  /** judgments refs evaluated by this scenario's gates steps (coverage feed). */
  evaluatedGateRefs: string[]
}

export interface RunOptions {
  updateGolden?: boolean
}

export interface SuiteSummary {
  pass: number
  fail: number
  error: number
  configError: number
  missingGolden: number
  updated: number
}

export interface SuiteResult {
  results: ScenarioResult[]
  summary: SuiteSummary
}

const GATE_REF_RE = /judgments\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.(?:fires|skips)/g

/** Deep-merge b over a (plain objects only; arrays/scalars replace). */
function deepMerge(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const prev = out[k]
    if (
      prev &&
      typeof prev === 'object' &&
      !Array.isArray(prev) &&
      v &&
      typeof v === 'object' &&
      !Array.isArray(v)
    ) {
      out[k] = deepMerge(prev as Record<string, unknown>, v as Record<string, unknown>)
    } else {
      out[k] = v
    }
  }
  return out
}

/** Compose the effective --context payload for a gates step: seed_context
 *  deep-merged with the step's context, then `$unset` keys removed (bare or
 *  dot paths). Note: the engine re-adds its defaults inside runGatesPlan —
 *  $unset removes keys from the PAYLOAD; reproducing a variable missing from
 *  the DEFAULT context is done via assets_dir doctoring (see schema header). */
export function composeContext(
  seed: Record<string, unknown> | undefined,
  step: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  const { $unset, ...seedRest } = (seed ?? {}) as Record<string, unknown> & { $unset?: unknown }
  const merged = deepMerge(seedRest, step ?? {})
  const unsetList = Array.isArray($unset) ? ($unset as string[]) : []
  for (const keyPath of unsetList) {
    const parts = keyPath.split('.')
    let cursor: Record<string, unknown> | undefined = merged
    for (let i = 0; i < parts.length - 1 && cursor; i++) {
      const next: unknown = cursor[parts[i] as string]
      cursor =
        next && typeof next === 'object' && !Array.isArray(next)
          ? (next as Record<string, unknown>)
          : undefined
    }
    if (cursor) delete cursor[parts[parts.length - 1] as string]
  }
  if (Object.keys(merged).length === 0) return undefined
  return merged
}

async function execStep(
  scenario: EvalScenarioType,
  step: EvalScenarioType['steps'][number],
  repoDir: string,
): Promise<StepRecord> {
  if ('file' in step) {
    const target = resolve(repoDir, step.file.path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, step.file.content ?? '', 'utf8')
    if (step.file.mtime) {
      const t = new Date(step.file.mtime)
      utimesSync(target, t, t)
    }
    return { kind: 'file', exitCode: null, stdout: [], stderr: [] }
  }

  const { deps, stdout, stderr } = captureRunDeps()
  let exitCode: number | null = null
  try {
    if ('gates' in step) {
      const { runGatesPlan } = await import('../cli/gates.js')
      const ctx = composeContext(scenario.seed_context, step.gates.context)
      await runGatesPlan(
        step.gates.master,
        {
          ...(step.gates.task !== undefined ? { task: step.gates.task } : {}),
          ...(step.gates.skip_sub !== undefined ? { skipSub: step.gates.skip_sub } : {}),
          ...(ctx !== undefined ? { context: JSON.stringify(ctx) } : {}),
        },
        deps,
      )
    } else {
      const { runCheckpointStart, runCheckpointComplete, runCheckpointFail } = await import(
        '../cli/checkpoint.js'
      )
      const c = step.checkpoint
      if (c.action === 'start') {
        await runCheckpointStart(
          c.sub,
          {
            ...(c.summary !== undefined ? { summary: c.summary } : {}),
            ...(c.plan !== undefined ? { plan: JSON.stringify(c.plan) } : {}),
          },
          deps,
        )
      } else if (c.action === 'complete') {
        await runCheckpointComplete(
          c.sub,
          {
            ...(c.summary !== undefined ? { summary: c.summary } : {}),
            ...(c.force !== undefined ? { force: c.force } : {}),
            ...(c.tokens !== undefined ? { tokens: c.tokens } : {}),
          },
          deps,
        )
      } else {
        await runCheckpointFail(
          c.sub,
          {
            ...(c.summary !== undefined ? { summary: c.summary } : {}),
            ...(c.force !== undefined ? { force: c.force } : {}),
          },
          deps,
        )
      }
    }
  } catch (e) {
    if (e instanceof ExitError) {
      exitCode = e.code
    } else {
      throw e // engine fault → ERROR triage at the scenario layer
    }
  }
  return { kind: 'gates' in step ? 'gates' : 'checkpoint', exitCode, stdout, stderr }
}

/** Run one scenario directory (contains scenario.yaml [+ golden.json]). */
export async function runScenarioDir(dir: string, opts: RunOptions): Promise<ScenarioResult> {
  const scenarioPath = join(dir, 'scenario.yaml')
  let parsed: unknown
  try {
    parsed = parseYaml(readFileSync(scenarioPath, 'utf8'))
  } catch (e) {
    return {
      name: dir,
      dir,
      status: 'CONFIG-ERROR',
      detail: [`failed to read/parse ${scenarioPath}: ${(e as Error).message}`],
      evaluatedGateRefs: [],
    }
  }
  const v = validateScenario(parsed)
  if (!v.ok) {
    return {
      name:
        typeof (parsed as { name?: unknown })?.name === 'string'
          ? String((parsed as { name: string }).name)
          : dir,
      dir,
      status: 'CONFIG-ERROR',
      detail: [`invalid scenario.yaml (${scenarioPath}):`, ...v.errors],
      evaluatedGateRefs: [],
    }
  }
  const scenario = v.scenario

  // ── isolation setup ────────────────────────────────────────────────────
  const stateRoot = realpathSync(mkdtempSync(join(tmpdir(), 'eval-run-root-')))
  const repoDir = realpathSync(mkdtempSync(join(tmpdir(), 'eval-run-repo-')))
  const prevCwd = process.cwd()
  const prevRoot = process.env.HARNESSED_ROOT_OVERRIDE
  const prevAssets = process.env.HARNESSED_ASSETS_OVERRIDE
  process.env.HARNESSED_ROOT_OVERRIDE = stateRoot
  if (scenario.assets_dir) {
    process.env.HARNESSED_ASSETS_OVERRIDE = isAbsolute(scenario.assets_dir)
      ? scenario.assets_dir
      : resolve(dir, scenario.assets_dir)
  }
  process.chdir(repoDir)
  const { _clearJudgmentCache } = await import('../workflow/judgmentResolver.js')
  _clearJudgmentCache()

  const steps: StepRecord[] = []
  const evaluatedGateRefs = new Set<string>()
  let engineError: Error | null = null
  let workflow: unknown = null
  try {
    for (const step of scenario.steps) {
      const rec = await execStep(scenario, step, repoDir)
      steps.push(rec)
      if (rec.kind === 'gates') {
        for (const line of [...rec.stdout, ...rec.stderr]) {
          for (const m of line.matchAll(GATE_REF_RE)) evaluatedGateRefs.add(m[0])
        }
      }
    }
    // Capture the final envelope while cwd + root override are STILL active —
    // readCurrentWorkflow keys off repoKey(process.cwd()); reading after the
    // finally-restore always missed (Wave 2 fix of a Wave 1 defect: goldens
    // previously recorded `workflow: null` unconditionally).
    try {
      const { readCurrentWorkflow } = await import('../checkpoint/state.js')
      workflow = await readCurrentWorkflow()
    } catch {
      workflow = null
    }
  } catch (e) {
    engineError = e as Error
  } finally {
    process.chdir(prevCwd)
    if (prevRoot === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
    else process.env.HARNESSED_ROOT_OVERRIDE = prevRoot
    if (prevAssets === undefined) delete process.env.HARNESSED_ASSETS_OVERRIDE
    else process.env.HARNESSED_ASSETS_OVERRIDE = prevAssets
    _clearJudgmentCache()
  }

  const cleanup = (): void => {
    rmSync(stateRoot, { recursive: true, force: true })
    rmSync(repoDir, { recursive: true, force: true })
  }

  if (engineError) {
    cleanup()
    return {
      name: scenario.name,
      dir,
      status: 'ERROR',
      detail: [engineError.message, ...(engineError.stack ?? '').split('\n').slice(1, 6)],
      evaluatedGateRefs: [...evaluatedGateRefs],
    }
  }

  cleanup()

  const actual = normalizeGolden({ steps, workflow }, [stateRoot, repoDir, tmpdir()])

  const goldenPath = join(dir, scenario.expect?.golden ?? 'golden.json')
  if (opts.updateGolden) {
    const before = loadGolden(goldenPath)
    writeGolden(goldenPath, actual)
    const detail = before ? diffGolden(before, actual) : ['(new golden recorded)']
    return {
      name: scenario.name,
      dir,
      status: 'UPDATED',
      detail,
      evaluatedGateRefs: [...evaluatedGateRefs],
    }
  }

  const golden = loadGolden(goldenPath)
  if (golden === null) {
    return {
      name: scenario.name,
      dir,
      status: 'MISSING-GOLDEN',
      detail: [`no golden at ${goldenPath} — record it with \`harnessed eval --update-golden\``],
      evaluatedGateRefs: [...evaluatedGateRefs],
    }
  }

  const diff = diffGolden(golden, actual)
  if (diff.length > 0) {
    return {
      name: scenario.name,
      dir,
      status: 'FAIL',
      detail: diff,
      evaluatedGateRefs: [...evaluatedGateRefs],
    }
  }
  return { name: scenario.name, dir, status: 'PASS', evaluatedGateRefs: [...evaluatedGateRefs] }
}

/** Run every scenario under `suiteDir` (each subdir with a scenario.yaml),
 *  SERIALLY (cwd/env are process-global). */
export async function runEvalSuite(
  suiteDir: string,
  opts: RunOptions & { filter?: string },
): Promise<SuiteResult> {
  const results: ScenarioResult[] = []
  let entries: string[] = []
  try {
    entries = readdirSync(suiteDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => join(suiteDir, d.name))
      .sort()
  } catch {
    entries = []
  }
  for (const dir of entries) {
    try {
      readFileSync(join(dir, 'scenario.yaml'))
    } catch {
      continue
    }
    if (opts.filter && !dir.includes(opts.filter)) {
      // cheap pre-filter on dir name; name-level filter re-checked below
    }
    const r = await runScenarioDir(dir, opts)
    if (opts.filter && !r.name.includes(opts.filter) && !dir.includes(opts.filter)) continue
    results.push(r)
  }
  const summary: SuiteSummary = {
    pass: results.filter((r) => r.status === 'PASS').length,
    fail: results.filter((r) => r.status === 'FAIL').length,
    error: results.filter((r) => r.status === 'ERROR').length,
    configError: results.filter((r) => r.status === 'CONFIG-ERROR').length,
    missingGolden: results.filter((r) => r.status === 'MISSING-GOLDEN').length,
    updated: results.filter((r) => r.status === 'UPDATED').length,
  }
  return { results, summary }
}

export interface CoverageEntry {
  ref: string
  covered: boolean
}

/** Enumerate every judgments trigger (`judgments.<file>.<trigger>.fires`) from
 *  the assets root and mark which were evaluated by the suite (E2 — derived
 *  from gates plan output; zero engine change, per OV3 ruling). */
export function computeCoverage(evaluatedRefs: string[], assetsRoot: string): CoverageEntry[] {
  const evaluated = new Set(evaluatedRefs)
  const out: CoverageEntry[] = []
  const dir = join(assetsRoot, 'workflows', 'judgments')
  let files: string[] = []
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.yaml'))
  } catch {
    return out
  }
  for (const f of files) {
    let parsed: Record<string, unknown> | null = null
    try {
      parsed = parseYaml(readFileSync(join(dir, f), 'utf8')) as Record<string, unknown>
    } catch {
      continue
    }
    const triggers = parsed?.triggers as Record<string, unknown> | undefined
    if (!triggers) continue
    const base = f.replace(/\.yaml$/, '')
    for (const key of Object.keys(triggers)) {
      const ref = `judgments.${base}.${key}.fires`
      out.push({ ref, covered: evaluated.has(ref) })
    }
  }
  return out
}
