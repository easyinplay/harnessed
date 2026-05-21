// masterOrchestrator.ts — T3.5.W0.1 Master Orchestrator Hybrid Option C per RESEARCH-workflows
// § Area 3:yaml `delegates_to[]` 声明 + engine consume + judgmentResolver pre-resolve gate +
// sub spawn。4 master 共享 dispatcher (D-13 declarative SoT)。K8: ctx 共享 snapshot(无 re-snapshot)。
// K14: arbitrate warn-not-halt。Path A default = in-process recursive runWorkflow;Path B
// fallback = try/catch SDK error → warn (sub-shell exec defer v3.x per K-mitigation)。

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { parse as parseYaml } from 'yaml'
import {
  arbitrateBeforeSpawn,
  type FiredCapability,
} from '../discipline/enforcement/before-spawn.js'
import { resolveJudgmentGate } from './judgmentResolver.js'
import { runWorkflow } from './run.js'
import {
  type DelegationClauseT,
  WorkflowSchemaV3,
  type WorkflowSchemaV3T,
} from './schema/workflow.js'

export type MasterName = 'discuss' | 'plan' | 'task' | 'verify'

export interface MasterRunResult {
  master: MasterName
  /** Sub names that gate-evaluated to fire (spawned in arbitration-sorted order). */
  fired: string[]
  /** Sub names that gate-evaluated to skip (透明声明 per fallback.yaml 铁律 1). */
  skipped: string[]
}

interface GateEvaluation {
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

const defaultSpawnDriver: SpawnDriver = async (masterName, subName, _context, packageRoot) => {
  const subYamlPath = resolve(packageRoot, 'workflows', masterName, subName, 'workflow.yaml')
  // Path A — SDK query recursive call runWorkflow at sub yaml(in-process)。
  // K8:engine 共享 1 context snapshot,passed unchanged(`gateContext`)。
  // Path B fallback hook:try/catch SDK error → sub-shell `harnessed` CLI invoke。
  try {
    await runWorkflow(subYamlPath, {}, { packageRoot, gateContext: _context })
  } catch (err) {
    // Path B sub-shell fallback(sister Phase 2.5 W2.3 error 降级 pattern)
    // — T3.5.W2.1 dogfood LOCK 时收紧 cmd surface;v3.0 default 仅记 warn 不真 exec
    // sub-shell(避免 spawn 调用栈 unintended side-effect)。
    console.warn(
      `⚠️ master spawnSubWorkflow Path A failed for ${masterName}/${subName} ` +
        `(${(err as Error).message});Path B sub-shell fallback deferred T3.5.W2.1.`,
    )
  }
}

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
): Promise<MasterRunResult> {
  const yamlPath = resolve(packageRoot, 'workflows', masterName, 'auto', 'workflow.yaml')
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

  // Transparency block — Evaluating <N> sub-workflow gates(per RESEARCH-workflows § Area 3)
  console.log(`[${masterName} master] Evaluating ${master.delegates_to.length} sub-workflow gates:`)
  for (const g of gateEvalled) {
    const mark = g.passes ? '✓' : '⊘'
    const tail = g.passes
      ? g.clause.gate
        ? ` (${g.clause.gate} == true)`
        : ' (unconditional)'
      : ` skipped — ${g.reason}`
    console.log(`  ${mark} ${g.clause.sub}${tail}`)
  }

  // Phase 2: split serial leading/trailing 夹住 parallel (Cycle 4 dogfood bug catch — yaml
  // order 数字大小编码 leading/trailing 意图,simplify order=99 必跑在 parallel verify 后)。
  // PARALLEL_MID_ANCHOR=50 split: order<50 → leading, order≥50 → trailing。
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

  // Phase 2.5: arbitrate fired capabilities(T3.5.W0.3 priority hierarchy wire,K14
  // warn-not-halt mitigation per RESEARCH-disciplines § 3.2.3)。
  //
  // v3.0 sub-name 用作 tier placeholder(未天然属 priority_hierarchy 7-tier);因 master sub
  // 是 stage segment 而非 capability tier name,real cross-tier reorder 实际不发生
  // (arbitrate fall-back unknown-tier MAX_SAFE_INTEGER rank → preserved order)。
  // 真 priority sort 在下游 sub workflow phase-execute capability fire 层做 — defer v3.x
  // 当 sub yaml 显式 declared `tier` 字段 or capabilities.yaml 加 `tier` field 时。
  //
  // K14 essence: fired.length > 1 → emit warn 透明声明 + arbitrate sort callable + NOT halt。
  // sub yaml 元数据驱动 真 priority sort 的 schema extension defer。
  if (firedClauses.length > 1) {
    const firedCaps: FiredCapability[] = firedClauses.map((c) => ({ name: c.sub, tier: c.sub }))
    try {
      await arbitrateBeforeSpawn(firedCaps, packageRoot)
      console.warn(
        `⚠️ multi-capability fires (${firedClauses.length} sub), arbitrating by priority hierarchy ` +
          '(K14 warn-not-halt; v3.0 sub-as-tier placeholder, real cross-tier sort defer v3.x)',
      )
    } catch (e) {
      console.warn(`⚠️ arbitrate failed (${(e as Error).message}) — proceeding default order`)
    }
  }

  // Phase 3: spawn leading serial → parallel fan-out → trailing serial (yaml order intent)。
  const modeLabel =
    serialN > 0 && parallelN > 0 ? 'serial+parallel' : serialN > 0 ? 'serial' : 'parallel'
  console.log(`Firing ${firedClauses.length} sub in ${modeLabel}:`)
  const fired: string[] = []
  for (const clause of serialLeading) {
    console.log(`  → ${clause.sub} (serial order=${clause.order ?? 0})`)
    await spawnDriver(masterName, clause.sub, context, packageRoot)
    fired.push(clause.sub)
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
  }

  // Phase 5: skipped — 透明声明 sister fallback.yaml 铁律 1
  const skipped = gateEvalled.filter((g) => !g.passes).map((g) => g.clause.sub)
  console.log(`[${masterName} master] Complete: ${fired.length} fired, ${skipped.length} skipped.`)

  return { master: masterName, fired, skipped }
}
