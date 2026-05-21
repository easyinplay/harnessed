// masterOrchestrator.ts — T3.5.W0.1 Master Orchestrator Hybrid Option C per RESEARCH-workflows
// § Area 3:yaml `delegates_to[]` 声明 + engine consume + judgmentResolver pre-resolve gate +
// sub spawn。4 master 共享 dispatcher (D-13 declarative SoT)。K8: ctx 共享 snapshot(无 re-snapshot)。
// K14: arbitrate warn-not-halt。Path A default = in-process recursive runWorkflow;Path B
// fallback = try/catch SDK error → warn (sub-shell exec defer v3.x per K-mitigation)。

import { readFile } from 'node:fs/promises'
import { Value } from '@sinclair/typebox/value'
import { parse as parseYaml } from 'yaml'
import { resolveJudgmentGate } from './judgmentResolver.js'
import {
  type DelegationClauseT,
  WorkflowSchemaV3,
  type WorkflowSchemaV3T,
} from './schema/workflow.js'

export type MasterName = 'discuss' | 'plan' | 'task' | 'verify' | 'auto'

export interface MasterRunResult {
  master: MasterName
  /** Sub names that gate-evaluated to fire (spawned in arbitration-sorted order). */
  fired: string[]
  /** Sub names that gate-evaluated to skip (透明声明 per fallback.yaml 铁律 1). */
  skipped: string[]
}

/** v3.1.0 / v3.2.0 — Opts for runMasterOrchestrator.
 *  `pauseBetweenStages` (v3.1.0): opt-in stage gate mode for super-master `/auto` (alias
 *    `--staged` v3.2.0 primary flag, `--pause-between-stages` backward-compat alias).
 *  v3.2.0 NEW hooks (super-master `/auto` only, pre-flight before spawn loop):
 *    `assessComplexity`: AI 1-shot judge 需求 size (small/medium/large) — large prompts
 *      user 切 `--staged` OR abort 建议手动
 *    `promptUserUnderstanding`: prompt 对需求有清晰认知吗 — n sets ctx fact
 *      `user_understanding_unclear=true` (research gate consumes)
 *    `prompter`: low-level stdin prompter DI override (sister pauseFn pattern) */
export interface MasterRunOpts {
  pauseBetweenStages?: boolean
  pauseFn?: (stageName: string) => Promise<void>
  /** v3.2.0 — AI 1-shot complexity judge for /auto Phase 0 gate. */
  assessComplexity?: (taskDescription: string) => Promise<'small' | 'medium' | 'large'>
  /** v3.2.0 — Phase 0.5 understanding check (returns true if user is clear). */
  promptUserUnderstanding?: (prompter: (q: string) => Promise<string>) => Promise<boolean>
  /** v3.2.0 — low-level stdin prompter DI override. */
  prompter?: (question: string) => Promise<string>
}

export interface GateEvaluation {
  clause: DelegationClauseT
  passes: boolean
  reason?: string
}

/** Spawn driver — Path A (in-process SDK recursive) with Path B (sub-shell) fallback.
 *  T3.5.W2.1 dogfood LOCK 决策延后;两路径都实现 + default Path A。 */
export type SpawnDriver = (
  masterName: MasterName,
  subName: string,
  context: Record<string, unknown>,
  packageRoot: string,
) => Promise<void>

import {
  defaultPauseFn,
  defaultSpawnDriver,
  emitGateTransparency,
  maybeArbitrate,
  resolveMasterYamlPath,
  runAutoPreFlight,
} from './masterOrchestrator-helpers.js'

/** Run a master orchestrator yaml — load `workflows/<masterName>/auto/workflow.yaml`,
 *  evaluate delegates_to[] gates,split serial/parallel,arbitrate(K14 warn-not-halt),
 *  spawn sub(Path A default),emit Transparency block。
 *
 *  K8:engine 共享 1 context snapshot — `context` arg passed unchanged 到 sub spawn。 */
export async function runMasterOrchestrator(
  masterName: MasterName,
  context: Record<string, unknown>,
  packageRoot: string,
  spawnDriver: SpawnDriver = defaultSpawnDriver,
  opts: MasterRunOpts = {},
): Promise<MasterRunResult> {
  // v3.1.0 — super-master `/auto` 走 top-level standalone `workflows/auto/workflow.yaml`
  // (sister research/retro layout); 4 stage-master 仍 走 `workflows/<name>/auto/workflow.yaml`。
  const yamlPath = resolveMasterYamlPath(masterName, packageRoot)
  const raw = await readFile(yamlPath, 'utf8')
  const parsed = parseYaml(raw) as unknown
  if (!Value.Check(WorkflowSchemaV3, parsed)) {
    const errors = [...Value.Errors(WorkflowSchemaV3, parsed)]
      .slice(0, 3)
      .map((e) => `${e.path} ${e.message}`)
      .join('; ')
    throw new Error(`Invalid master workflow.yaml at ${yamlPath}: ${errors}`)
  }
  const master = parsed as WorkflowSchemaV3T
  if (!master.delegates_to || master.delegates_to.length === 0) {
    throw new Error(`Master workflow ${masterName} missing delegates_to`)
  }

  // v3.2.0 — /auto super-master pre-flight (Phase 0 complexity + Phase 0.5 understanding)。
  // Hooks set ctx fact `user_understanding_unclear` consumed by research gate; large
  // complexity → auto-switch to --staged OR abort (user-elected manual /discuss path)。
  // Pre-flight 仅当 assessComplexity OR prompter OR promptUserUnderstanding 任一显式传入
  // 才激活 — 保护 sister v3.1.0 fixture (无 hooks) backward-compat (避免 readline 阻塞)。
  let effectiveOpts = opts
  const preflightActive =
    masterName === 'auto' &&
    (opts.assessComplexity !== undefined ||
      opts.prompter !== undefined ||
      opts.promptUserUnderstanding !== undefined)
  if (preflightActive) {
    const pre = await runAutoPreFlight(context, opts)
    if (!pre.proceed) {
      console.log(`[${masterName} master] Aborted by user (complexity gate decline).`)
      return { master: masterName, fired: [], skipped: master.delegates_to.map((c) => c.sub) }
    }
    effectiveOpts = pre.opts
  }

  // Phase 1: gate eval per delegation clause(unconditional fire 当 clause.gate undefined)
  const gateEvalled: GateEvaluation[] = []
  for (const clause of master.delegates_to) {
    if (!clause.gate) {
      gateEvalled.push({ clause, passes: true })
      continue
    }
    try {
      const passes = await resolveJudgmentGate(clause.gate, context, packageRoot)
      gateEvalled.push({
        clause,
        passes,
        reason: passes ? undefined : `gate ${clause.gate} = false`,
      })
    } catch (e) {
      gateEvalled.push({
        clause,
        passes: false,
        reason: `gate eval error: ${(e as Error).message}`,
      })
    }
  }

  // Transparency block + Phase 2 split + Phase 2.5 arbitrate (helpers split per karpathy ≤200L)
  emitGateTransparency(masterName, master.delegates_to.length, gateEvalled)
  const PARALLEL_MID_ANCHOR = 50
  const firedClauses = gateEvalled.filter((g) => g.passes).map((g) => g.clause)
  const serialLeading = firedClauses
    .filter((c) => c.mode === 'serial' && (c.order ?? 0) < PARALLEL_MID_ANCHOR)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const serialTrailing = firedClauses
    .filter((c) => c.mode === 'serial' && (c.order ?? 0) >= PARALLEL_MID_ANCHOR)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const parallelClauses = firedClauses.filter((c) => (c.mode ?? 'parallel') === 'parallel')
  const serialN = serialLeading.length + serialTrailing.length
  const parallelN = parallelClauses.length
  await maybeArbitrate(firedClauses, packageRoot)

  // Phase 3: spawn leading serial → parallel fan-out → trailing serial (yaml order intent)。
  const modeLabel =
    serialN > 0 && parallelN > 0 ? 'serial+parallel' : serialN > 0 ? 'serial' : 'parallel'
  console.log(`Firing ${firedClauses.length} sub in ${modeLabel}:`)
  const fired: string[] = []
  // v3.1.0 / v3.2.0 — staged opt-in (super-master `/auto` UX, alias --pause-between-stages).
  // pauseFn defaults to readline stdin prompt at runtime (test DI override via opts.pauseFn)。
  // effectiveOpts may have auto-flipped pauseBetweenStages=true via pre-flight large complexity。
  const pauseHook = effectiveOpts.pauseBetweenStages
    ? (effectiveOpts.pauseFn ?? defaultPauseFn)
    : undefined
  for (const clause of serialLeading) {
    console.log(`  → ${clause.sub} (serial order=${clause.order ?? 0})`)
    await spawnDriver(masterName, clause.sub, context, packageRoot)
    fired.push(clause.sub)
    if (pauseHook) await pauseHook(clause.sub)
  }
  const parallelResults = await Promise.allSettled(
    parallelClauses.map(async (clause) => {
      console.log(`  → ${clause.sub} (parallel)`)
      await spawnDriver(masterName, clause.sub, context, packageRoot)
      return clause.sub
    }),
  )
  for (const r of parallelResults) {
    if (r.status === 'fulfilled') fired.push(r.value)
  }
  for (const clause of serialTrailing) {
    console.log(`  → ${clause.sub} (serial order=${clause.order ?? 0})`)
    await spawnDriver(masterName, clause.sub, context, packageRoot)
    fired.push(clause.sub)
    if (pauseHook) await pauseHook(clause.sub)
  }

  // Phase 5: skipped — 透明声明 sister fallback.yaml 铁律 1
  const skipped = gateEvalled.filter((g) => !g.passes).map((g) => g.clause.sub)
  console.log(`[${masterName} master] Complete: ${fired.length} fired, ${skipped.length} skipped.`)

  return { master: masterName, fired, skipped }
}
