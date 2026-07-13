// src/cli/evalCmd.ts — `harnessed eval` (30th subcommand; 4.31.0 Slice A, T4).
//
// Orchestrator-behavior regression trap suite runner. Exit code is the CI
// gate: any FAIL / ERROR / CONFIG-ERROR / MISSING-GOLDEN (without
// --update-golden) → non-zero. Under GITHUB_ACTIONS, failures additionally
// emit `::error` annotations (E1). --coverage prints the judgments-trigger ×
// scenario hit matrix with bare (uncovered) triggers highlighted (E2, derived
// from gates plan output — OV3). --json is the machine face (E4; the mock
// report experiment and the C-phase recorder consume it).
//
// Execution artifact: production runs go through dist (build → eval in CI);
// the local inner loop is the vitest thin shell over the same engine (OV4).

import { resolve } from 'node:path'
import type { Command } from 'commander'
import { computeCoverage, runEvalSuite } from '../eval/runner.js'
import { getAssetsRoot } from './lib/assetsRoot.js'
import { defaultRunDeps, type RunDeps } from './lib/runDeps.js'

interface EvalOpts {
  dir?: string
  json?: boolean
  coverage?: boolean
  updateGolden?: boolean
  filter?: string
}

export async function runEvalCommand(raw: EvalOpts, deps: RunDeps = defaultRunDeps): Promise<void> {
  const suiteDir = resolve(raw.dir ?? resolve(process.cwd(), 'fixtures', 'eval'))
  const suite = await runEvalSuite(suiteDir, {
    ...(raw.updateGolden !== undefined ? { updateGolden: raw.updateGolden } : {}),
    ...(raw.filter !== undefined ? { filter: raw.filter } : {}),
  })

  const failures = suite.results.filter(
    (r) => r.status === 'FAIL' || r.status === 'ERROR' || r.status === 'CONFIG-ERROR',
  )
  const missing = suite.results.filter((r) => r.status === 'MISSING-GOLDEN')
  const failing = failures.length + missing.length

  if (raw.json) {
    deps.log(JSON.stringify({ results: suite.results, summary: suite.summary }, null, 2))
  } else {
    if (suite.results.length === 0) {
      deps.log(`[harnessed eval] 0 scenarios under ${suiteDir}`)
    }
    for (const r of suite.results) {
      deps.log(`${r.status.padEnd(14)} ${r.name}`)
      if (r.status !== 'PASS' && r.detail) {
        for (const line of r.detail.slice(0, 20)) deps.log(`    ${line}`)
      }
    }
    const s = suite.summary
    deps.log(
      `[harnessed eval] pass ${s.pass} / fail ${s.fail} / error ${s.error} / ` +
        `config-error ${s.configError} / missing-golden ${s.missingGolden} / updated ${s.updated}`,
    )
  }

  if (raw.coverage) {
    const refs = suite.results.flatMap((r) => r.evaluatedGateRefs)
    const cov = computeCoverage(refs, getAssetsRoot())
    const bare = cov.filter((c) => !c.covered)
    deps.log(`[harnessed eval] trigger coverage: ${cov.length - bare.length}/${cov.length}`)
    for (const c of cov) {
      deps.log(`  ${c.covered ? 'covered   ' : 'BARE      '} ${c.ref}`)
    }
  }

  // E1 — CI annotations (stdout; GitHub Actions parses ::error lines).
  if (process.env.GITHUB_ACTIONS && failing > 0) {
    for (const r of [...failures, ...missing]) {
      deps.log(
        `::error title=harnessed eval ${r.status}::${r.name} — ${(r.detail ?? []).slice(0, 3).join(' | ')}`,
      )
    }
  }

  deps.exit(failing > 0 ? 1 : 0)
  return
}

export function registerEval(program: Command): void {
  program
    .command('eval')
    .description(
      'run the orchestrator-behavior regression trap suite (deterministic replay; CI gate)',
    )
    .option('--dir <path>', 'scenario suite directory (default: ./fixtures/eval)')
    .option('--json', 'machine-readable results')
    .option('--coverage', 'print judgments-trigger coverage matrix (bare triggers highlighted)')
    .option('--update-golden', 're-record goldens (prints the diff — review it, never blind-bless)')
    .option('--filter <substr>', 'run only scenarios whose name/dir matches')
    .action(async (raw: EvalOpts) => {
      await runEvalCommand(raw)
    })
}
