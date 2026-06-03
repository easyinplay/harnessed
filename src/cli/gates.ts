// src/cli/gates.ts — `harnessed gates <master>` plan command.
//
// Evaluates which sub-workflows fire for a master orchestrator and prints a
// JSON plan to stdout. NO spawning — pure gate evaluation (mirror of
// src/workflow/masterOrchestrator.ts gate eval loop, lines 121-165) so callers
// (slash commands / main CC session) can decide spawn order themselves.
//
// Fail-soft per ADR 0029: gate eval THROW → fire the sub (operational fault is
// not a judgment to skip), emit console.warn. Parallelism eval THROW →
// escalate_to_teams=false (conservative default).

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Command } from 'commander'
import { parse as parseYaml } from 'yaml'
import { resolveJudgmentGate } from '../workflow/judgmentResolver.js'
import { getPackageRoot } from './lib/packagePath.js'

const VALID_MASTERS = new Set(['auto', 'discuss', 'plan', 'task', 'verify'])

// v4.1 — stage masters (recursable). `auto` is the super-master; its fired subs
// that are themselves stage masters must be recursed (harnessed gates <sub>),
// not prompt+spawned. research/retro are standalone leaves (not masters).
const STAGE_MASTERS = new Set(['discuss', 'plan', 'task', 'verify'])

const PARALLELISM_GATE = 'judgments.parallelism-gate.agent-teams-upgrade.fires'

interface RawOpts {
  task?: string
  skipSub?: string
  context?: string
}

interface DelegationClause {
  sub: string
  gate?: string
  mode?: string
  order?: number
}

interface FireEntry {
  sub: string
  order?: number
  mode?: string
  gate?: string
  // v4.1 — true when this sub is itself a stage master (has its own auto/workflow.yaml).
  // The CC main session must RECURSE (harnessed gates <sub>) instead of prompt+spawn,
  // since `harnessed prompt <master>` returns a dispatcher prompt, not leaf work.
  is_master?: boolean
}

interface SkipEntry {
  sub: string
  reason: string
}

interface GatesPlan {
  master: string
  fire: FireEntry[]
  skip: SkipEntry[]
  parallelism: { escalate_to_teams: boolean; reason: string | null }
}

/** v3.9.22 / v3.9.24 — full default phase + subtask context (verbatim copy of
 *  src/cli/run.ts gateContext defaults). CLI can't infer real context from a
 *  free-form task string, so defaults bias toward "treat as important" →
 *  safety-net gates fire by default. Sub-workflow gate expressions reference
 *  phase.* / subtask.* — undefined variable would throw at eval. */
function defaultContext(task: string, stage: string): Record<string, unknown> {
  return {
    task,
    user_understanding_unclear: false,
    phase: {
      stage,
      is_critical_module: true,
      is_final_step: true,
      is_major_release: false,
      has_auth_or_secrets: false,
      has_design_changes: false,
      has_ui_changes: false,
      requires_creative_polish: false,
      is_complex_architecture: true,
      has_cross_phase_data_flow: true,
      open_decisions: 2,
      scope_days: 2,
      scope_locked_in_history: false,
      single_task: false,
      type: 'general',
    },
    subtask: {
      approaches: 2,
      core_algorithm: true,
      has_api_contract: true,
      error_cost: 'high',
      lines: 50,
      type: 'general',
      is_core_business_logic: true,
      is_algorithm: true,
      is_data_processing: true,
      regression_risk: 'high',
      reliability_required: true,
      communication_needed: false,
      needs_lib_docs: false,
      needs_web_search: false,
      parallel_count: 1,
      search_type: 'general',
      test_type: 'general',
    },
  }
}

function resolveMasterYamlPath(master: string, packageRoot: string): string {
  return master === 'auto'
    ? resolve(packageRoot, 'workflows', 'auto', 'workflow.yaml')
    : resolve(packageRoot, 'workflows', master, 'auto', 'workflow.yaml')
}

export function registerGates(program: Command): void {
  program
    .command('gates')
    .description(
      'Evaluate which sub-workflows fire for a master orchestrator (JSON plan, no spawn).',
    )
    .argument('<master>', 'master name: auto | discuss | plan | task | verify')
    .option('--task <text>', 'task description (injected as gateContext.task)')
    .option('--skip-sub <names>', 'comma-separated sub names to skip without gate eval')
    .option('--context <json>', 'JSON object merged over the default gate context')
    .action(async (master: string, raw: RawOpts) => {
      if (!VALID_MASTERS.has(master)) {
        console.error(
          `error: unknown master '${master}'. Expected one of: auto, discuss, plan, task, verify.`,
        )
        process.exit(1)
        return
      }

      const packageRoot = getPackageRoot()
      const yamlPath = resolveMasterYamlPath(master, packageRoot)

      let raw_yaml: string
      try {
        raw_yaml = await readFile(yamlPath, 'utf8')
      } catch (err) {
        console.error(
          `error: failed to read master workflow.yaml at ${yamlPath} — ${(err as Error).message}`,
        )
        process.exit(1)
        return
      }

      let parsed: unknown
      try {
        parsed = parseYaml(raw_yaml)
      } catch (err) {
        console.error(`error: failed to parse ${yamlPath} — ${(err as Error).message}`)
        process.exit(1)
        return
      }

      const delegates = (parsed as { delegates_to?: unknown })?.delegates_to
      if (!Array.isArray(delegates) || delegates.length === 0) {
        console.error(`error: master '${master}' workflow.yaml missing delegates_to[]`)
        process.exit(1)
        return
      }
      const clauses = delegates as DelegationClause[]

      const task = typeof raw.task === 'string' ? raw.task : ''
      const stage = master

      // Build gate context: default object → merge --context → add skip_subs + task.
      const ctx = defaultContext(task, stage)
      if (typeof raw.context === 'string' && raw.context.length > 0) {
        let extra: unknown
        try {
          extra = JSON.parse(raw.context)
        } catch (err) {
          console.error(`error: --context is not valid JSON — ${(err as Error).message}`)
          process.exit(1)
          return
        }
        if (extra && typeof extra === 'object') {
          Object.assign(ctx, extra as Record<string, unknown>)
        }
      }
      const skipSubs = new Set(
        typeof raw.skipSub === 'string' && raw.skipSub.length > 0
          ? raw.skipSub
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
          : [],
      )
      ctx.skip_subs = [...skipSubs]
      ctx.task = task

      const fire: FireEntry[] = []
      const skip: SkipEntry[] = []

      // Gate eval loop — mirror masterOrchestrator.ts:121-165 (no spawn).
      for (const clause of clauses) {
        if (skipSubs.has(clause.sub)) {
          skip.push({
            sub: clause.sub,
            reason: 'skipped via skip_subs (done interactively in main session)',
          })
          continue
        }
        if (!clause.gate) {
          fire.push(fireEntry(clause))
          continue
        }
        try {
          const passes = await resolveJudgmentGate(clause.gate, ctx, packageRoot)
          if (passes) {
            fire.push(fireEntry(clause))
          } else {
            skip.push({ sub: clause.sub, reason: `gate ${clause.gate} = false` })
          }
        } catch (e) {
          // ADR 0029 fail-soft — eval error is operational fault, not a judgment
          // to skip. Fire the sub as if the gate returned true; emit warn.
          console.warn(
            `⚠️ master ${master} sub ${clause.sub} gate ${clause.gate} eval failed ` +
              `(${(e as Error).message}); firing sub as if gate=true (ADR 0029 fail-soft).`,
          )
          fire.push(fireEntry(clause))
        }
      }

      // Parallelism — agent-teams-upgrade routing gate (try/catch → conservative false).
      let parallelism: GatesPlan['parallelism'] = { escalate_to_teams: false, reason: null }
      try {
        const escalate = await resolveJudgmentGate(PARALLELISM_GATE, ctx, packageRoot)
        parallelism = escalate
          ? { escalate_to_teams: true, reason: 'agent-teams-upgrade gate fired' }
          : { escalate_to_teams: false, reason: null }
      } catch {
        parallelism = { escalate_to_teams: false, reason: null }
      }

      const result: GatesPlan = { master, fire, skip, parallelism }
      console.log(JSON.stringify(result, null, 2))
      process.exit(0)
    })
}

function fireEntry(clause: DelegationClause): FireEntry {
  const entry: FireEntry = { sub: clause.sub }
  if (clause.order !== undefined) entry.order = clause.order
  if (clause.mode !== undefined) entry.mode = clause.mode
  if (clause.gate !== undefined) entry.gate = clause.gate
  // v4.1 — stage master detection (recurse instead of prompt+spawn).
  if (STAGE_MASTERS.has(clause.sub)) {
    entry.is_master = true
  }
  return entry
}
