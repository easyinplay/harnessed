// Main-process routing engine (Pattern N). ADR 0006/0008/0009. Phase 1.4 T3.1
// → 1.5 T3.4 → 2.2 W4 T4.2 → 3.1 W3 T3.2 → 2.4 W1 T2.4.W1.2 (fallback handlers
// delegate, R20.10 c). Karpathy ≤200L hard limit守住.

import { homedir } from 'node:os'
import { join } from 'node:path'
import { emitAudit } from '../audit/hook.js'
import { activatePhase, completePhase } from '../checkpoint/engineHook.js'
import {
  type AgentDefinition,
  type AgentDefinitionOpts,
  type ArbitrateResult,
  createAgent,
  InvalidDecisionError,
  MissingSkillsError,
  SkillNotInstalledError,
  type TaskContext,
} from './agentDefinition.js'
import { type DagNode, resolveDag } from './dag.js'
import { arbitrate, loadDecisionRules, type Rule } from './decisionRules.js'
import {
  type FallbackMaxIterationsExceededConfig,
  handleMaxIterationsExceeded,
  handleVerbatimCompleteFail,
} from './lib/fallbackHandlers.js'
import {
  MaxIterationsExceededError,
  ralphLoopWrap,
  VerbatimCompleteFailError,
} from './lib/ralphLoop.js'
import { sdkSpawn } from './lib/sdkSpawn.js'
import { ensureSkillsInstalled } from './lib/skillInstall.js'
import { match as semanticMatch } from './semanticRouter.js'

export { MaxIterationsExceededError, VerbatimCompleteFailError } from './lib/ralphLoop.js'

/** Engine three-state discriminated union (PLAN.md § 4 接口契约 1+2). */
export type EngineResult =
  | { ok: true; result: string; matchedRule: Rule | null }
  | { ok: false; phase: 'arbitrate' | 'install' | 'spawn' | 'verbatim'; error: Error }
  | { aborted: true; reason: string }

/** Routing engine entry options. T2.4.W1.2: fallback* fields wire R20.10 c. */
export interface RoutingOpts {
  rulesPath?: string
  skillsRoot?: string
  spawn?: (agentDef: AgentDefinition) => Promise<string>
  maxIterations?: number
  spawnTimeoutMs?: number
  fallbackSupervisor?: (task: TaskContext) => Promise<string>
  agentOpts?: AgentDefinitionOpts
  dagNodes?: DagNode[]
  semanticThreshold?: number
  fallbackConfig?: FallbackMaxIterationsExceededConfig
  fallbackPhaseId?: string
}

/** Anchor 6 — production spawn = real sdkSpawn (T4.2). Replaces phase 1.4
 *  placeholder; backward-compat test seam preserved via opts.spawn (1-arg). */
const defaultSpawn = (
  def: AgentDefinition,
  ctx: { expertName: string; resumeSessionId?: string; onSessionId?: (id: string) => void },
) => sdkSpawn(def, ctx)

function buildDecision(matched: Rule | null): ArbitrateResult {
  if (!matched) {
    return {
      matched_rule_id: null,
      primary_expert: null,
      secondary_expert: null,
      category: 'meta',
    }
  }
  return {
    matched_rule_id: matched.id,
    primary_expert: (matched.decision.primary_expert as string | null) ?? null,
    secondary_expert: (matched.decision.secondary_expert as string | null) ?? null,
    category: matched.domain as ArbitrateResult['category'],
    forbidden_skills: matched.decision.forbidden as string[] | undefined,
    required_skills: matched.decision.required_skills as string[] | undefined,
  }
}

/** Pattern N — main-process-driven routing engine entry point (≤200L). */
export async function runRouting(task: TaskContext, opts: RoutingOpts = {}): Promise<EngineResult> {
  const rulesPath = opts.rulesPath ?? join('routing', 'decision_rules.yaml')
  const skillsRoot = opts.skillsRoot ?? join(homedir(), '.claude', 'skills')
  const maxIter = opts.maxIterations ?? 20
  const userSpawn = opts.spawn

  // Step 0 — DAG pre-check (T3.4, ADR 0009 § DAG Kahn cycle reject).
  if (opts.dagNodes && opts.dagNodes.length > 0) {
    const dag = resolveDag(opts.dagNodes)
    if (!dag.ok) {
      const error = new InvalidDecisionError(
        `skill dependency cycle: ${dag.cycle.join(' → ')} (see ADR 0009 § DAG resolver)`,
      )
      return { ok: false, phase: 'arbitrate', error }
    }
  }

  // Step 1 — arbitrate (Anchor 1 step 1, L1 keyword routing)
  let rules: Rule[]
  try {
    rules = loadDecisionRules(rulesPath).rules
  } catch (error) {
    return { ok: false, phase: 'arbitrate', error: error as Error }
  }
  const taskCtx = {
    task_type: task.task_type,
    ...(task.override_keywords ? { override_keywords: task.override_keywords } : {}),
  }
  const matched = arbitrate(rules, taskCtx)
  const decision = buildDecision(matched)

  if (!matched) {
    // Step 1b — L2 Semantic Router stub (T3.4 v0.1 always null pass-through to L3).
    const semantic = await semanticMatch(task.task, opts.semanticThreshold)
    void semantic.rule // v0.2+ feeds rule
    if (opts.fallbackSupervisor) {
      const result = await opts.fallbackSupervisor(task)
      return { ok: true, result, matchedRule: null }
    }
    return {
      ok: false,
      phase: 'arbitrate',
      error: new InvalidDecisionError('no rule matched and no fallbackSupervisor provided'),
    }
  }

  // Step 2 — install missing skills (Anchor 3)
  try {
    await ensureSkillsInstalled(decision.required_skills ?? [], skillsRoot)
  } catch (error) {
    return { ok: false, phase: 'install', error: error as Error }
  }

  // Step 3 — factory (T3.2 createAgent)
  let agentDef: AgentDefinition
  try {
    agentDef = await createAgent(task, decision, { ...opts.agentOpts, skillsRoot })
  } catch (error) {
    if (error instanceof SkillNotInstalledError || error instanceof MissingSkillsError) {
      return { ok: false, phase: 'install', error }
    }
    if (error instanceof InvalidDecisionError) {
      return { ok: false, phase: 'arbitrate', error }
    }
    return { ok: false, phase: 'spawn', error: error as Error }
  }

  const phaseId = task.phaseId ?? 'unknown' // Phase 3.1 W3 T3.2 (W-04 fix path a)
  await activatePhase(phaseId)

  // Step 4+5 spawn + ralph-loop. userSpawn = test seam (B-02 1-arg); defaultSpawn captures session_id.
  const expertName = (matched.decision.primary_expert as string | null) ?? 'unknown'
  let capturedSessionId: string | undefined
  const wrappedSpawn = async (
    resumeSessionId?: string,
    onSessionIdInner?: (id: string) => void,
  ): Promise<string> =>
    userSpawn
      ? userSpawn(agentDef)
      : defaultSpawn(agentDef, {
          expertName,
          ...(resumeSessionId ? { resumeSessionId } : {}),
          onSessionId: (id) => {
            capturedSessionId = id
            onSessionIdInner?.(id)
          },
        })
  const fbCtx = {
    subtaskSummary: task.task,
    workflowName: task.task_type ?? 'unknown',
    phaseId: opts.fallbackPhaseId ?? task.phaseId ?? 'unknown',
  }
  try {
    const result = await ralphLoopWrap(wrappedSpawn, maxIter)
    await completePhase({ phaseId, sessionId: capturedSessionId, status: 'complete' })
    emitAudit(task, decision, matched, 'complete', capturedSessionId)
    return { ok: true, result, matchedRule: matched }
  } catch (error) {
    if (error instanceof MaxIterationsExceededError) {
      emitAudit(task, decision, matched, 'max-iter', capturedSessionId)
      if (opts.fallbackConfig)
        handleMaxIterationsExceeded(error, opts.fallbackConfig, {
          ...fbCtx,
          maxIterations: maxIter,
        })
      return { aborted: true, reason: error.message }
    }
    if (error instanceof VerbatimCompleteFailError) {
      emitAudit(task, decision, matched, 'verbatim-fail', capturedSessionId)
      if (opts.fallbackConfig) handleVerbatimCompleteFail(error, opts.fallbackConfig, fbCtx)
      return { ok: false, phase: 'verbatim', error }
    }
    emitAudit(task, decision, matched, 'spawn-err', capturedSessionId)
    return { ok: false, phase: 'spawn', error: error as Error }
  }
}
