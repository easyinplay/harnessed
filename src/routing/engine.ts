// Phase 1.4 T3.1 — main-process-driven routing engine v1 (Pattern N).
//
// IMPL NOTE — implements ADR 0006 § 1 双层架构 + KICKOFF C1 (main-process
// orchestrator). D1.2.5-3 lock: routing engine runs in the main session,
// spawns subagents via `query({ options: { agents: { name: agentDef } } })`
// (Anchor 6) — never recursive (Fact D / RESEARCH-1 § 1.1 hard ceiling).
// F33 P1 mitigation: subagent final message must contain verbatim COMPLETE
// (`^COMPLETE$` multiline regex, Anchor 2 — SPIKE-REPORT.md § 3.1 实测
// FEASIBLE on Win Git Bash claude CLI v2.1.133). D1.4-1 reload bypass:
// install via library call (W-2) → sleep + retry idempotent_check (Anchor 3,
// extracted to lib/ralphLoop.ts to honor ≤200L) → fresh subagent via
// query() (CC runtime auto-loads `~/.claude/skills/<name>/SKILL.md`); we
// **never** call `/reload-plugins` (GitHub #35641 / #46594 still open Q1-Q2
// 2026). D1.4-3 wedge: ralphLoopWrap is self-implemented ≤50L (Anchor 4,
// lib/ralphLoop.ts) — verbatim grep + iteration counter; no anthropics/
// claude-code/plugins/ralph-wiggum dep. ADR 0008 § Decision 4 cross-link
// tracks the 8 接口契约 upgrade points (PLAN.md § 4). Contract § 3
// agentFactory signature is honored 1:1 by createAgent (T3.2). Default
// per-spawn timeout 60s (Anchor 7, ENV `HARNESSED_SPAWN_TIMEOUT_MS`).

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
import { arbitrate, loadDecisionRules, type Rule } from './decisionRules.js'
import {
  ensureSkillsInstalled,
  MaxIterationsExceededError,
  ralphLoopWrap,
  VerbatimCompleteFailError,
} from './lib/ralphLoop.js'

export { MaxIterationsExceededError, VerbatimCompleteFailError } from './lib/ralphLoop.js'

/** Engine three-state discriminated union (PLAN.md § 4 接口契约 1+2). */
export type EngineResult =
  | { ok: true; result: string; matchedRule: Rule | null }
  | { ok: false; phase: 'arbitrate' | 'install' | 'spawn' | 'verbatim'; error: Error }
  | { aborted: true; reason: string }

/** Routing engine entry options. */
export interface RoutingOpts {
  /** Path to decision_rules.yaml (defaults to ./routing/decision_rules.yaml). */
  rulesPath?: string
  /** Filesystem root for skill probes; injected by tests/e2e wrapper. */
  skillsRoot?: string
  /** Mock spawn callback — production wires `query()`; tests pass mocks. */
  spawn?: (agentDef: AgentDefinition) => Promise<string>
  /** External ralph-loop max iterations (D1.4-3 lock 20). */
  maxIterations?: number
  /** Per-spawn timeout in ms (Anchor 7 cold-start margin). */
  spawnTimeoutMs?: number
  /** Fallback supervisor invocation hook (returns result string when no rule hits). */
  fallbackSupervisor?: (task: TaskContext) => Promise<string>
  /** AgentDefinition factory overrides forwarded into createAgent. */
  agentOpts?: AgentDefinitionOpts
}

/** Anchor 6 — production spawn wrapper. Tests inject `opts.spawn` directly;
 *  the real `query({ allowedTools: [...,'Agent'], agents })` wiring lands
 *  in T5.1 research.ts adapter. The shape here documents the contract. */
async function defaultSpawn(_def: AgentDefinition): Promise<string> {
  throw new Error(
    'engine.defaultSpawn is a placeholder — pass opts.spawn or use harnessed-research wrapper (T5.1).',
  )
}

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
  const spawnFn = opts.spawn ?? defaultSpawn

  // Step 1 — arbitrate (Anchor 1 step 1)
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

  // Step 4 + 5 — spawn + ralph-loop wrap (Anchor 4, lib/ralphLoop.ts)
  try {
    const result = await ralphLoopWrap(() => spawnFn(agentDef), maxIter)
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
