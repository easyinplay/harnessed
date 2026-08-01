// src/cli/facts.ts — `harnessed facts <master>` (T2.1 D-1).
//
// THE PROBLEM (audit S2). The three-tier clarification criteria, the TDD gate and
// the governance gates are all written out in full in workflows/judgments/ — and
// at runtime they had no discriminating power whatsoever. `buildDefaultGateContext`
// pinned every judgement-call fact to its firing side, and NOT ONE workflow ever
// passed `--context`, so "does this subtask need brainstorming?" was, in practice,
// hard-coded to yes. The criteria were decoration.
//
// THE FIX (D2 = mixed sourcing). Facts that can be derived deterministically are
// derived by harnessed; facts that are genuine judgement calls are handed to the
// model as explicit nulls with a one-line description of what to judge. This
// command is the single place that says which is which, for a given master.
//
// WHY A SUBCOMMAND AND NOT A SKILL TEMPLATE (OQ1 = A). The alternative was a
// hand-written facts block in each SKILL.md. Its failure mode is silent: rename
// or add a fact inside some `fires_when` and the template simply stops supplying
// it — the fact falls back to a default, the gate quietly changes meaning, and
// NO mechanism in the repo can detect it. This repo already has that exact bug
// living in it (stage-routing.yaml copied three *-gate.yaml expressions verbatim,
// and the masters read the copy — so those three judgment files are decoration
// too). Multiplying that pattern across 34 SKILLs × 2 locales was not acceptable.
// Deriving the set from the yaml at runtime cannot drift by construction.
//
// The command is READ-ONLY: it prints JSON and (with --out) writes one file.

import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import type { Command } from 'commander'
import { parse as parseYaml } from 'yaml'
import { checkPathSafe } from '../manifest/lib/path-guard.js'
import { getAssetsRoot } from '../platform/assetsRoot.js'
import { defaultRunDeps, type RunDeps } from '../platform/runDeps.js'
import { _parserSingleton } from '../workflow/exprBuilder.js'
import { resolveJudgmentExpression } from '../workflow/judgmentResolver.js'
import { GATE_MASTERS, resolveMasterYamlPath } from './gates.js'
import {
  type ChromeDevtoolsProbe,
  chromeDevtoolsAvailable,
  chromeDevtoolsFactSource,
  probeChromeDevtools,
} from './lib/probe-chrome-devtools.js'

const VALID_MASTERS = new Set<string>(GATE_MASTERS)

export interface DerivedFact {
  value: number | string | boolean | null
  /** Provenance, so a reader can audit the number rather than trust it. */
  source: string
}

export interface FactsEnvelope {
  master: string
  /** Nested gate-context shape — fill every null, then feed it to
   *  `harnessed gates --context-file`. */
  facts: Record<string, unknown>
  /** Dotted fact name → one-line description. Present for every null. */
  hints: Record<string, string>
  /** Dotted fact name → deterministically derived value + provenance. */
  derived: Record<string, DerivedFact>
  usage: string
}

interface DelegationClause {
  gate?: string
  skip_gate?: string
}

// ── D-2: deterministic derivations ────────────────────────────────────────────

export interface GitFacts {
  lines: number | null
  files_touched: number | null
}

/** Derive the two git-backed facts from an injected `git` runner (null = the
 *  invocation failed / there is no repo).
 *
 *  An empty diff yields null, NOT 0. That is the whole subtlety: 0 is a
 *  perfectly plausible-looking number that makes `subtask.lines < 20` true, and
 *  that expression is the brainstorming/TDD SKIP condition — so a clean tree
 *  (the normal state at the START of a subtask, before any code exists) would
 *  silently veto the very gates this slice is wiring up. Unknown must stay
 *  unknown and go to the model. */
export function deriveGitFacts(run: (args: string[]) => string | null): GitFacts {
  let lines = 0
  let sawNumstat = false
  for (const args of [
    ['diff', '--numstat'],
    ['diff', '--cached', '--numstat'],
  ]) {
    const out = run(args)
    if (out === null) continue
    sawNumstat = true
    for (const row of out.split(/\r?\n/)) {
      // `-\t-\tpath` marks a binary file: no line counts exist, skip the row
      // rather than Number('-') → NaN poisoning the whole sum.
      const m = /^(\d+)\t(\d+)\t/.exec(row)
      if (m) lines += Number(m[1]) + Number(m[2])
    }
  }

  const files = new Set<string>()
  let sawNames = false
  for (const args of [
    ['diff', '--name-only'],
    ['diff', '--cached', '--name-only'],
  ]) {
    const out = run(args)
    if (out === null) continue
    sawNames = true
    for (const row of out.split(/\r?\n/)) {
      const p = row.trim()
      if (p) files.add(p)
    }
  }

  return {
    lines: sawNumstat && lines > 0 ? lines : null,
    files_touched: sawNames && files.size > 0 ? files.size : null,
  }
}

function defaultGitRun(args: string[]): string | null {
  try {
    return execFileSync('git', args, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return null // no git / not a repo / any git error → unknown, never 0
  }
}

// ── D-1: which facts actually gate anything for this master ───────────────────

/** Dotted fact names an expr-eval expression reads (`withMembers` yields
 *  `subtask.approaches`, not just `subtask`). Uses the SAME locked-down parser
 *  singleton the gate evaluator uses, so what is enumerated here is exactly what
 *  gets evaluated there. */
function factNamesOf(expression: string): string[] {
  return _parserSingleton.parse(expression).variables({ withMembers: true })
}

async function readDelegates(master: string, packageRoot: string): Promise<DelegationClause[]> {
  const yamlPath = resolveMasterYamlPath(master, packageRoot)
  const parsed = parseYaml(await readFile(yamlPath, 'utf8')) as { delegates_to?: unknown }
  const delegates = parsed?.delegates_to
  return Array.isArray(delegates) ? (delegates as DelegationClause[]) : []
}

/** Sorted dotted fact names reachable from this master's `gate` / `skip_gate`
 *  refs. NOT all ~40 declared facts — only the ones that actually decide
 *  something here, so the model is asked the smallest honest set. A ref that
 *  cannot be resolved contributes nothing (the gate loop reports it loudly at
 *  eval time; this command must not turn a bad ref into a bogus question). */
export async function collectGatedFactNames(
  master: string,
  packageRoot: string,
): Promise<string[]> {
  const names = new Set<string>()
  for (const clause of await readDelegates(master, packageRoot)) {
    for (const ref of [clause.gate, clause.skip_gate]) {
      if (!ref) continue
      let expr: string
      try {
        expr = await resolveJudgmentExpression(ref, packageRoot)
      } catch {
        continue
      }
      try {
        for (const n of factNamesOf(expr)) names.add(n)
      } catch {
        // unparseable expression — a config bug the gate loop will surface
      }
    }
  }
  return [...names].sort()
}

// ── hints: what each judgement-call fact is actually asking ───────────────────
//
// English by design (this is model-facing machine output, not user-facing UI —
// no i18n surface). Keep in sync with the enum members in
// src/workflow/schema/phaseFactContext.ts when adding a fact.

const FACT_HINTS: Record<string, string> = {
  // phase tier
  'phase.type':
    "Phase kind: 'new_project' | 'new_milestone' | 'new_feature' | 'bug_fix' | 'tech_debt' | 'continuing_phase'. Only the first three open the strategic (office-hours / CEO-review) tier.",
  'phase.stage': 'Current stage name (derived from the invocation; do not edit).',
  'phase.open_decisions':
    'How many implementation decisions are still genuinely open for this phase (>=2 opens the phase-tier discussion).',
  'phase.scope_days': 'Estimated phase size in days (>1 opens the phase-tier discussion).',
  'phase.single_task': 'true if the phase is one self-contained task with no sub-structure.',
  'phase.scope_locked_in_history':
    'true if the scope was already decided in an earlier session / design doc, so re-litigating it is waste.',
  'phase.files_touched':
    'How many files this phase changes (derived from git when a diff exists; estimate it if the tree is still clean).',
  'phase.has_cross_phase_data_flow':
    'true if this phase shares a data flow, API contract or dependency with another phase.',
  'phase.is_complex_architecture':
    'true if the design has non-obvious structural choices (new layer / new seam / cross-cutting change), not just new code inside an existing pattern.',
  'phase.is_critical_module':
    'true if this touches a module where a regression is expensive (auth, payments, data migration, the release path).',
  'phase.is_major_release': 'true if this phase ships a major version / externally visible launch.',
  'phase.is_final_step': 'true if this is the last step of the phase (enables the simplify pass).',
  'phase.has_ui_changes': 'true if user-visible UI changed (opens the QA lane).',
  'phase.has_design_changes':
    'true if visual design / design-system tokens changed (opens the design-review lane).',
  'phase.has_auth_or_secrets':
    'true if auth, credentials, tokens or secret handling changed (opens the security lane).',
  'phase.has_ai_phase': 'true if this phase ships LLM/AI behaviour needing an eval-coverage audit.',
  'phase.requires_coverage_audit':
    'true if the phase needs a requirements-coverage audit rather than ordinary verification.',
  // subtask tier
  'subtask.type':
    "Subtask kind: 'crud' | 'core_logic' | 'algorithm' | 'ui_polish' | 'docs_only' | 'single_command_query' | 'standard_lib_call'. The first, last and 'ui_polish'/'docs_only' are what legitimately skip brainstorming / TDD.",
  'subtask.lines':
    'Rough size of the change in lines (derived from git when a diff exists; estimate it if nothing is written yet). <20 is the trivial-change skip.',
  'subtask.approaches':
    'How many genuinely different implementations you are choosing between (>=2 means the choice deserves a decision, not a coin flip).',
  'subtask.core_algorithm':
    'true if this designs an algorithm or data structure rather than wiring existing pieces together.',
  'subtask.has_api_contract':
    'true if this defines or changes an interface other code must conform to.',
  'subtask.error_cost':
    "Cost of getting this wrong: 'low' | 'medium' | 'high'. 'high' = data migration, concurrency, a performance-critical path, anything not cheaply reversible.",
  'subtask.is_core_business_logic': 'true if this is core domain logic rather than glue or config.',
  'subtask.is_algorithm': 'true if correctness depends on an algorithm you could get subtly wrong.',
  'subtask.is_data_processing': 'true if this transforms, parses or migrates data.',
  'subtask.regression_risk': "How likely a silent regression is here: 'low' | 'medium' | 'high'.",
  'subtask.reliability_required':
    'true if this must keep working unattended (hooks, CI gates, release path).',
  // root-flat
  is_critical_release:
    'true if this verification guards a critical release (escalates to the multi-specialist review team).',
  user_understanding_unclear:
    'true if YOU do not yet understand the request well enough to plan it (opens the research stage).',
}

function hintFor(name: string): string {
  return (
    FACT_HINTS[name] ??
    `Judgement call consumed by a gate expression in workflows/judgments/ — read the trigger that references '${name}' before filling it.`
  )
}

// ── envelope assembly ─────────────────────────────────────────────────────────

function setNested(target: Record<string, unknown>, dotted: string, value: unknown): void {
  const parts = dotted.split('.')
  if (parts.length === 1) {
    target[dotted] = value
    return
  }
  const [group, key] = parts as [string, string]
  let bucket = target[group] as Record<string, unknown> | undefined
  if (!bucket) {
    bucket = {}
    target[group] = bucket
  }
  bucket[key] = value
}

export function buildFactsEnvelope(
  master: string,
  gatedNames: readonly string[],
  derived: Record<string, DerivedFact>,
): FactsEnvelope {
  const facts: Record<string, unknown> = {}
  const hints: Record<string, string> = {}
  // Derived facts are included even when this master's gates do not (yet) read
  // them: they cost nothing, they are already true, and they make a newly-wired
  // gate arm work on the first run instead of silently seeing an absent fact.
  const all = [...new Set([...gatedNames, ...Object.keys(derived)])].sort()
  for (const name of all) {
    const value = derived[name]?.value ?? null
    setNested(facts, name, value)
    if (value === null) hints[name] = hintFor(name)
  }
  return {
    master,
    facts,
    hints,
    derived,
    usage:
      `Fill every null in \`facts\` with your honest judgement (leave a fact null to accept harnessed's default), ` +
      `write that object to a file, then run: harnessed gates ${master} --task "<locked spec>" --context-file <path>. ` +
      `The output of this command can be passed back verbatim — the envelope is unwrapped automatically.`,
  }
}

// ── command body ──────────────────────────────────────────────────────────────

export async function runFactsPlan(
  master: string,
  raw: { out?: string },
  deps: RunDeps = defaultRunDeps,
  gitRun: (args: string[]) => string | null = defaultGitRun,
  probeCdt: () => Promise<ChromeDevtoolsProbe> = () => probeChromeDevtools(),
): Promise<void> {
  if (!VALID_MASTERS.has(master)) {
    deps.error(
      `error: unknown master '${master}'. Expected one of: ${[...GATE_MASTERS].join(', ')}.`,
    )
    deps.exit(1)
    return
  }
  try {
    checkPathSafe(master)
  } catch {
    deps.error('error: invalid master name (path traversal rejected)')
    deps.exit(1)
    return
  }

  const packageRoot = getAssetsRoot()
  let gated: string[]
  try {
    gated = await collectGatedFactNames(master, packageRoot)
  } catch (err) {
    deps.error(
      `error: failed to read master workflow.yaml at ${resolveMasterYamlPath(master, packageRoot)} — ${(err as Error).message}`,
    )
    deps.exit(1)
    return
  }

  const git = deriveGitFacts(gitRun)
  // Environment fact, not a judgement call: whether ANY chrome-devtools MCP
  // provider is registered is a filesystem answer, so it is auto-filled here for
  // the same reason `subtask.lines` is — leaving it null would hand the model a
  // question it cannot answer honestly, and the gate that reads it
  // (judgments.web-testing-routing.chrome-devtools-mcp-diagnostic.fires) would
  // fall back to the seeded "unknown = available" default forever.
  const cdt = await probeCdt()
  const derived: Record<string, DerivedFact> = {
    // `harnessed gates` seeds phase.stage from the master argument, so facts MUST
    // report the same thing: deriving a stage from the ledger instead could hand
    // back a STALE stage that then overrides the real one through --context-file
    // and turn every `phase.stage == '<x>'` gate false.
    'phase.stage': {
      value: master,
      source: `master argument (mirrors \`harnessed gates ${master}\`)`,
    },
    'subtask.lines': {
      value: git.lines,
      source:
        'git diff --numstat + --cached --numstat (added+deleted; null when no repo / clean tree)',
    },
    'phase.files_touched': {
      value: git.files_touched,
      source:
        'git diff --name-only + --cached --name-only (unique paths; null when no repo / clean tree)',
    },
    // Root-flat (bare identifier), sister src/workflow/schema/phaseFactContext.ts.
    // `source` doubles as the SKIP REASON: when no provider is registered it
    // names BOTH enable paths, so losing the diagnostic lane is never silent.
    chrome_devtools_available: {
      value: chromeDevtoolsAvailable(cdt),
      source: chromeDevtoolsFactSource(cdt),
    },
  }

  const envelope = buildFactsEnvelope(master, gated, derived)
  const json = JSON.stringify(envelope, null, 2)
  if (raw.out) {
    try {
      await writeFile(raw.out, json, 'utf8')
    } catch (err) {
      deps.error(`error: failed to write --out ${raw.out} — ${(err as Error).message}`)
      deps.exit(1)
      return
    }
  }
  deps.log(json)
  deps.exit(0)
  return
}

export function registerFacts(program: Command): void {
  program
    .command('facts')
    .description(
      'List the gate facts a master actually consumes: deterministic ones filled in, judgement calls left null with a one-line hint. Feed the filled file to `harnessed gates --context-file`.',
    )
    .argument('<master>', 'master name: auto | discuss | plan | task | verify | ship')
    .option('--out <path>', 'also write the JSON envelope to this file')
    .action(async (master: string, raw: { out?: string }) => {
      await runFactsPlan(master, raw)
    })
}
