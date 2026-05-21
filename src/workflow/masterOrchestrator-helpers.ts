// masterOrchestrator-helpers.ts — v3.1.0 split from masterOrchestrator.ts (karpathy ≤200L hard
// limit per project memory). v3.2.0 extend — adds /auto super-master pre-flight hook
// (complexity assessment + understanding check) + retro mandatory invariant note.
//
// Sister masterOrchestrator.ts orchestration core stays focused on:gate eval + serial/parallel
// split + arbitrate + spawn loop。Default IO helpers (fs spawn driver / stdin pause prompt /
// yaml path resolver / pre-flight hook) live here for test DI override clarity。

import { resolve } from 'node:path'
import {
  arbitrateBeforeSpawn,
  type FiredCapability,
} from '../discipline/enforcement/before-spawn.js'
import type {
  GateEvaluation,
  MasterName,
  MasterRunOpts,
  SpawnDriver,
} from './masterOrchestrator.js'
import { runWorkflow } from './run.js'
import type { DelegationClauseT, WorkflowSchemaV3T } from './schema/workflow.js'

/** v3.1.0 — Super-master `/auto` 走 top-level standalone `workflows/auto/workflow.yaml`
 *  (sister research/retro layout); 4 stage-master 仍 走 `workflows/<name>/auto/workflow.yaml`。 */
export function resolveMasterYamlPath(masterName: MasterName, packageRoot: string): string {
  return masterName === 'auto'
    ? resolve(packageRoot, 'workflows', 'auto', 'workflow.yaml')
    : resolve(packageRoot, 'workflows', masterName, 'auto', 'workflow.yaml')
}

/** v3.1.0 — Super-master `/auto` recursive spawn: sub ∈ {discuss,plan,task,verify} spawn to
 *  stage-master `workflows/<sub>/auto/workflow.yaml` (一层抽象 verbatim); 其他 master spawn to
 *  `workflows/<masterName>/<subName>/workflow.yaml` (原 sub-workflow 行为)。
 *  v3.2.0 — `research` / `retro` sub spawn to standalone top-level `workflows/<sub>/workflow.yaml`. */
export function resolveSubYamlPath(
  masterName: MasterName,
  subName: string,
  packageRoot: string,
): string {
  if (masterName === 'auto') {
    // v3.2.0 — research + retro are top-level standalone (NOT stage-master nested)
    if (subName === 'research' || subName === 'retro') {
      return resolve(packageRoot, 'workflows', subName, 'workflow.yaml')
    }
    // 4 stage-master nested at workflows/<sub>/auto/workflow.yaml
    return resolve(packageRoot, 'workflows', subName, 'auto', 'workflow.yaml')
  }
  return resolve(packageRoot, 'workflows', masterName, subName, 'workflow.yaml')
}

export const defaultSpawnDriver: SpawnDriver = async (
  masterName,
  subName,
  _context,
  packageRoot,
) => {
  const subYamlPath = resolveSubYamlPath(masterName, subName, packageRoot)
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

/** v3.1.0 — Default pause hook: prompt user via stdin to confirm continuation between stages
 *  (super-master `/auto --staged` opt-in, alias `--pause-between-stages`). Test DI override
 *  via opts.pauseFn。 */
export const defaultPauseFn = async (stageName: string): Promise<void> => {
  const readline = await import('node:readline/promises')
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    await rl.question(
      `\n[--staged] Stage '${stageName}' complete. Press Enter to continue (Ctrl+C to abort)... `,
    )
  } finally {
    rl.close()
  }
}

/** v3.2.0 — Default complexity assessment (Phase 0). 1-shot AI judge 需求 size returns
 *  'small' | 'medium' | 'large'. Default impl 保守 — 无 AI 上下文时返回 'medium' (skip prompt
 *  path)。真接 AI call 应由 caller (slash cmd impl) override via opts.assessComplexity。 */
export const defaultAssessComplexity = async (
  _taskDescription: string,
): Promise<'small' | 'medium' | 'large'> => {
  // Conservative default — 'medium' bypasses the large-prompt branch.
  // Real AI-driven judge should be injected via opts.assessComplexity by caller.
  return 'medium'
}

/** v3.2.0 — Default understanding check (Phase 0.5). Prompt user via stdin "对需求有清晰认知吗?
 *  [Y/n]"。Returns true if user is clear (skip research), false if unclear (spawn research)。 */
export const defaultPromptUserUnderstanding = async (
  prompter = defaultPrompter,
): Promise<boolean> => {
  const answer = await prompter(
    '\n[Phase 0.5] 对需求有清晰认知吗? [Y/n] (n = 先跑 /research 多源调研): ',
  )
  const a = answer.trim().toLowerCase()
  // Default Y (clear) on empty / 'y' / 'yes' / unknown; only 'n' / 'no' set unclear=true
  return !(a === 'n' || a === 'no')
}

/** v3.2.0 — readline stdin prompter (DI-friendly, sister defaultPauseFn pattern)。 */
export const defaultPrompter = async (question: string): Promise<string> => {
  const readline = await import('node:readline/promises')
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    return await rl.question(question)
  } finally {
    rl.close()
  }
}

/** v3.2.0 — /auto super-master pre-flight hook: Phase 0 complexity assessment + Phase 0.5
 *  understanding check. Returns updated opts (auto-staged on large+y) + mutates ctx with
 *  user_understanding_unclear fact (consumed by research gate)。
 *
 *  Returns { proceed: false } when user aborts on large-complexity (n)。 */
export async function runAutoPreFlight(
  ctx: Record<string, unknown>,
  opts: MasterRunOpts,
): Promise<{ proceed: boolean; opts: MasterRunOpts }> {
  const assess = opts.assessComplexity ?? defaultAssessComplexity
  const prompter = opts.prompter ?? defaultPrompter
  const taskDesc = typeof ctx.task_description === 'string' ? ctx.task_description : ''

  // Phase 0 — complexity assessment
  const size = await assess(taskDesc)
  console.log(`[/auto Phase 0] Complexity assessment: ${size}`)
  let nextOpts = opts
  if (size === 'large') {
    const a = (
      await prompter(
        '\n[Phase 0] 需求复杂度较大,全程 auto 可能时间过长 / 上下文超限。建议 `--staged` 模式 (每 stage 完停 review)。是否切换? [Y/n]: ',
      )
    )
      .trim()
      .toLowerCase()
    if (a === 'n' || a === 'no') {
      console.log(
        '\n[/auto Phase 0] User declined --staged. Aborting auto mode — 建议手动 `/discuss` 启动。',
      )
      return { proceed: false, opts }
    }
    console.log('[/auto Phase 0] Switching to --staged mode.')
    nextOpts = { ...opts, pauseBetweenStages: true }
  }

  // Phase 0.5 — understanding check (mandatory prompt even on small/medium)
  const promptUnderstanding = opts.promptUserUnderstanding ?? defaultPromptUserUnderstanding
  const isClear = await promptUnderstanding(prompter)
  ctx.user_understanding_unclear = !isClear
  console.log(
    `[/auto Phase 0.5] user_understanding_unclear=${!isClear} (research will ${isClear ? 'skip' : 'fire'})`,
  )

  return { proceed: true, opts: nextOpts }
}

/** v3.2.0 — Emit transparency block for gate evaluations (RESEARCH-workflows § Area 3).
 *  Split from masterOrchestrator.ts core per karpathy ≤200L hard limit. */
export function emitGateTransparency(
  masterName: MasterName,
  totalGates: number,
  gateEvalled: GateEvaluation[],
): void {
  console.log(`[${masterName} master] Evaluating ${totalGates} sub-workflow gates:`)
  for (const g of gateEvalled) {
    const mark = g.passes ? '✓' : '⊘'
    const tail = g.passes
      ? g.clause.gate
        ? ` (${g.clause.gate} == true)`
        : ' (unconditional)'
      : ` skipped — ${g.reason}`
    console.log(`  ${mark} ${g.clause.sub}${tail}`)
  }
}

/** v3.2.0 — Arbitrate fired clauses when >1 (K14 warn-not-halt mitigation per
 *  RESEARCH-disciplines § 3.2.3)。Split from masterOrchestrator.ts core per karpathy
 *  ≤200L hard limit。 */
export async function maybeArbitrate(
  firedClauses: DelegationClauseT[],
  packageRoot: string,
): Promise<void> {
  if (firedClauses.length <= 1) return
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

// Re-export for backward-compat dogfood static-verify (cycle-4-verify.dogfood.test.ts F9
// reads both files concatenated). Anchor markers kept verbatim in helper functions above.
export type { WorkflowSchemaV3T }
