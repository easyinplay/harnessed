// Phase 1.4 T3.1 — main-process-driven routing engine v1 (Pattern N).
// Phase 1.5 T3.4 upgrade — DAG resolver pre-check + Semantic Router L2 fallthrough.
// Phase 2.2 W4 T4.2 upgrade — defaultSpawn = real sdkSpawn (lib/sdkSpawn.ts).
//
// IMPL NOTE — ADR 0006 § 1 双层架构 + KICKOFF C1 (main-process orchestrator).
// D1.2.5-3 lock: routing engine runs in the main session, spawns subagents
// via `query({ options: { agents: { name: agentDef } } })` (Anchor 6) — never
// recursive (Fact D / RESEARCH-1 § 1.1). F33 P1 mitigation: verbatim
// <promise>COMPLETE</promise> (Anchor 2). D1.4-1 reload bypass via fresh
// query() (Anchor 3 / lib/ralphLoop.ts) — never /reload-plugins (#35641/#46594).
// D1.4-3 wedge: ralphLoopWrap ≤50L. ADR 0008 § Decision 4 tracks 8 接口契约
// upgrade points (PLAN.md § 4). createAgent honors contract § 3.
// Phase 1.5 T3.4 (ADR 0009 / D1.5-11): PRE-arbitrate resolveDag() cycle
// pre-check + POST-arbitrate-miss semanticRouter.match() L2 (v0.1 stub —
// null pass-through to L3 fallback_supervisor); EngineResult stays 三态 union.

import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  type AgentDefinition,
  type AgentDefinitionOpts,
  type ArbitrateResult,
  createAgent,
  InvalidDecisionError,
  MissingSkillsError,
  RestartRequiredError,
  SkillNotInstalledError,
  type TaskContext,
} from './agentDefinition.js'
import { type DagNode, resolveDag } from './dag.js'
import { arbitrate, loadDecisionRules, type Rule } from './decisionRules.js'
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

/** Routing engine entry options. */
export interface RoutingOpts {
  rulesPath?: string // defaults to ./routing/decision_rules.yaml
  skillsRoot?: string // fs root for skill probes; injected by tests/e2e
  spawn?: (agentDef: AgentDefinition) => Promise<string> // test mock seam
  maxIterations?: number // ralph-loop limit (D1.4-3 lock 20)
  spawnTimeoutMs?: number // per-spawn timeout in ms (Anchor 7)
  fallbackSupervisor?: (task: TaskContext) => Promise<string> // L3 兜底
  agentOpts?: AgentDefinitionOpts // factory overrides forwarded into createAgent
  dagNodes?: DagNode[] // optional skill DAG (Kahn pre-check, T3.4)
  semanticThreshold?: number // L2 semanticRouter stub threshold (v0.1 unused)
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

  // Step 0 — DAG pre-check (T3.4, ADR 0009). Resolve the optional skill
  // dependency graph via Kahn; a cycle is rejected before arbitrate.
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
    // Step 1b — L2 Semantic Router (T3.4). v0.1 stub always returns no-match
    // (rule stays null), so v0.1 is a guaranteed pass-through to L3 below;
    // v0.2+ swaps the stub body only and may resolve `semantic.rule` here.
    const semantic = await semanticMatch(task.task, opts.semanticThreshold)
    void semantic.rule // v0.2+ feeds a matched rule into install + factory.
    // Step 1c — L3 fallback_supervisor LLM (phase 1.4 三层兜底 contract).
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

  // Step 2 — install missing (Anchor 3, lib/ralphLoop.ts)
  try {
    await ensureSkillsInstalled(decision.required_skills ?? [], skillsRoot)
  } catch (error) {
    if (
      error instanceof RestartRequiredError ||
      error instanceof SkillNotInstalledError ||
      error instanceof MissingSkillsError
    ) {
      return { ok: false, phase: 'install', error }
    }
    return { ok: false, phase: 'install', error: error as Error }
  }

  // Step 3 — factory (Anchor 1 step 3, T3.2 createAgent)
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

  // Step 4 + 5 — spawn + ralph-loop wrap (Anchor 4 / T4.2 sdkSpawn wire-up).
  // userSpawn (test seam, 1-arg) ignores resumeSessionId; defaultSpawn=sdkSpawn
  // consumes it. CD-4 closure-ready (T4.4 deferred to v0.3.0 per B-35).
  const expertName = (matched.decision.primary_expert as string | null) ?? 'unknown'
  let capturedSessionId: string | undefined
  const wrappedSpawn = async (resumeSessionId?: string): Promise<string> =>
    userSpawn
      ? userSpawn(agentDef)
      : defaultSpawn(agentDef, {
          expertName,
          ...(resumeSessionId ? { resumeSessionId } : {}),
          onSessionId: (id) => {
            capturedSessionId = id
          },
        })
  void capturedSessionId
  try {
    const result = await ralphLoopWrap(wrappedSpawn, maxIter)
    return { ok: true, result, matchedRule: matched }
  } catch (error) {
    if (error instanceof MaxIterationsExceededError) {
      return { aborted: true, reason: error.message }
    }
    if (error instanceof VerbatimCompleteFailError) {
      return { ok: false, phase: 'verbatim', error }
    }
    return { ok: false, phase: 'spawn', error: error as Error }
  }
}
