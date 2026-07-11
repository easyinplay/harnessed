// run.ts — D-03 WIRED + D-04 PUSH + W0.2 (master detect + disciplines wedge) + W1.5
// (3 phase-level hook: before-spawn / after-output / before-commit per RESEARCH-disciplines § 4.4)。
// Phase v3.4.4 — _dispatchSkillStub.fn production default rewired to real sdkSpawn
// (was literal '<stub for X>'). DI seam preserved for tests.
// Phase v3.4.4 (Phase 3) — _dispatchSkillStub.fn now conditionally wraps sdkSpawn
// in ralphLoopWrap when phase opt-in (max_iterations / fallback / upstream='ralph-loop'
// signal); else single-shot per Phase 2. max-iter resolved via gateContext.maxIterations
// (CLI flag) → phase.max_iterations → 20, clamped 100.
// Phase v3.4.4 (Phase 4) — buildAgentDef enriched with role-prompts.yaml lookup
// + workflowName plumbed through MaxIterFallbackCtx (replaces hardcoded
// 'harnessed-run' literal at fallback site).
import { dirname, join, resolve as pathResolve } from 'node:path'
import { activatePhase, completePhase } from '../checkpoint/engineHook.js'
import { pause as statePause } from '../checkpoint/state.js'
import { loadRolePrompts, type RolePrompt } from '../cli/lib/generateCommands.js'
import { runAfterOutputHook } from '../discipline/enforcement/after-output.js'
import { runBeforeCommitHook } from '../discipline/enforcement/before-commit.js'
import { loadDisciplinesForPhase } from '../discipline/enforcement/before-phase-execute.js'
import { arbitrateBeforeSpawn } from '../discipline/enforcement/before-spawn.js'
import { isUndefinedVariableError } from './exprBuilder.js'
import { isVetoed } from './governance.js'
import { resolveJudgmentGate } from './judgmentResolver.js'
import type { AgentDefinition } from './lib/agentDefinition.js'
import {
  type FallbackMaxIterationsExceededConfig,
  handleMaxIterationsExceeded,
  MaxIterationsExceededError,
  ralphLoopWrap,
} from './lib/ralphLoop.js'
import { sdkSpawn } from './lib/sdkSpawn.js'
import { loadPhases } from './loadPhases.js'
import { type MasterName, runMasterOrchestrator } from './masterOrchestrator.js'

export type { FallbackMaxIterationsExceededConfig } from './lib/ralphLoop.js'

const MASTER_NAMES: readonly MasterName[] = ['discuss', 'plan', 'task', 'verify', 'auto']

/** Phase v3.4.4 (Phase 3) — ralph-loop default cap (sister src/routing/engine.ts:88). */
const RALPH_DEFAULT_MAX_ITER = 20
/** Phase v3.4.4 (Phase 3) — ralph-loop hard upper bound (sister workflows/defaults.yaml:103
 *  + Phase 2.2 STRIDE T-2.2-05 DoS mitigation). */
const RALPH_HARD_UPPER_LIMIT = 100

export interface WorkflowRunResult {
  status: 'complete' | 'paused-veto' | 'failed'
  phasesRun: number
  lastPhaseId?: string
  /** Phase ids whose `gate` resolved false → skipped (D-04 + D-11 v2 consume). */
  skippedPhases?: string[]
}

/** D-03 WIRED stub spawner;W1.5 — Optional target + triggers_commit additive default undefined。
 *  Exported for test injection (W1.5 fixture vi.spyOn override stub shape to fire hook path)。 */
export interface DispatchStubResult {
  status: 'ok' | 'fail'
  output: string
  decision?: string
  target?: 'chat' | 'file' | 'commit-message'
  triggers_commit?: boolean
  /** v3.5.0 Phase 2 — Option 1-Lite escalation signal from spawned subagent.
   *  When true, runWorkflow emits stderr hint suggesting user open Agent Teams
   *  in main Claude Code session (D3). */
  needsTeamsEscalation?: boolean
  escalationReason?: string
}
/** v3.5.0 Phase 2 — Option 1-Lite escalation rules injected via
 *  criticalSystemReminder_EXPERIMENTAL (already piped through sdkReconcile.ts
 *  L54-56 into spawned subagent prompt). Self-contained natural-language
 *  transcription of workflows/judgments/parallelism-gate.yaml agent-teams-upgrade
 *  fires_when. Spawned subagent CANNOT itself call TeamCreate (SDK v0.3.142 does
 *  not expose Team APIs); it ONLY signals via structured_output.needs_teams_escalation.
 *  See PHASE-2-SPEC.md § D2 for design rationale + spike result. */
export const ESCALATION_RULES = `If during this task you detect ANY of the following 5 conditions, set \`needs_teams_escalation: true\` in your structured output and fill \`escalation_reason\` with the trigger name + one-sentence specifics. These are signals to the human user in the main Claude Code session — do NOT attempt to call TeamCreate/SendMessage/TeamDelete yourself (those tools are not available to you).

Five triggers (any one suffices):

1. **teammate_send_message_needed** — the task requires two or more subagents to exchange messages mid-task (e.g., reconciling API contract proposals across frontend and backend), not just fan-out + report.

2. **subagent_context_overflow** — your context budget is filling and a separate subagent is needed to take over a portion of the work.

3. **shared_task_list** — multiple subagents need to coordinate self-assignment from a shared task list (not pre-partitioned work).

4. **opposing_hypothesis_debate** — the task requires two subagents to defend opposing hypotheses to a lead arbiter (e.g., root-cause debugging where two competing theories need separate evidence-gathering).

5. **fullstack_three_way** — the task is a synchronized fullstack push (frontend + backend + tests) requiring API contract alignment across three roles simultaneously.

If none of the five apply, omit \`needs_teams_escalation\` (defaults to false) and proceed normally.`

/** v3.6.0 Phase 3 — Transparent-skip rule injection (P0b 下半, Audit §
 *  fallback 三条铁律 "拿不准 → 倾向跳过 + 透明声明"). Sister to ESCALATION_RULES
 *  above, appended to the same `criticalSystemReminder_EXPERIMENTAL` field via
 *  `${ESCALATION_RULES}\n\n${TRANSPARENT_SKIP_RULES}` in buildAgentDef. Spawned
 *  subagent reads the rule + emits the verbatim skip message when gate context
 *  is ambiguous instead of silent execution.
 *  See workflows/disciplines/operational.yaml `transparent-skip-on-low-confidence`
 *  rule (check_method: prompt-inject) for the discipline-layer declaration. */
export const TRANSPARENT_SKIP_RULES = `When you encounter a phase gate or routing decision where the input context is missing key fields, default-valued, or contradictory, do NOT proceed silently. Instead, skip the phase and emit a one-line transparent explanation:

  "Skipped <phase>, because <reason>. Tell me if you actually need it."
  (中文: "这次跳过了 <phase>, 因为 <reason>. 如果你认为需要请明说.")

This applies to: strategic-layer review skip / phase-layer clarification skip / subtask-brainstorming skip / TDD enforcement skip / Agent Teams escalation skip. Chain-isolation rule: skipping one layer does NOT mandate skipping subsequent layers — each layer is independently evaluated.`

/** v3.6.0 Phase 4 — Agent Teams prevention checklist injection (P1b). Spawned
 *  subagent doesn't have Team APIs (SDK v0.3.142 doesn't expose them), so this
 *  is signal/discipline only — when subagent signals escalation via
 *  needs_teams_escalation, the user/main-session opens the team, and this
 *  checklist reminds spawned subagent (and by signal propagation, the user)
 *  of the 4 防呆 rules.
 *
 *  Source: ~/.claude/rules/agent-teams.md "防呆清单" (4 items) — paraphrased
 *  for prompt injection (NOT verbatim user-private file).
 *
 *  See PHASE-4-SPEC.md § D1 for design rationale + prompt-budget impact (~200
 *  tokens, total criticalSystemReminder_EXPERIMENTAL ~670 tokens). */
export const AGENT_TEAMS_PREVENTION_RULES = `If you signal needs_teams_escalation=true, ALSO advise the user on these 4 Agent Teams prevention rules in your escalation_reason or summary (the user will be the one calling TeamCreate / SendMessage / TeamDelete; remind them upfront):

1. **Session-scoped**: Teams live only in the current Claude Code session. \`/resume\` loses all teammates. Do not treat teams as persistent state — finish team work within one session.

2. **Cleanup mandatory**: Before session ends, send \`SendMessage(to=<teammate>, content="shutdown_request")\` to each teammate, then call \`TeamDelete\`. Orphan teammates consume resources. This is a hard rule, not advisory.

3. **Token cost estimation**: Before creating a team, estimate \`team_cost ≈ N_teammates × N_rounds × avg_tokens_per_round + N_teammates × initial_brief_tokens\`. Compare to subagent fan-out cost (\`≈ N_subagents × (initial_brief + summary_tokens)\`). Only open a team when \`team_cost < 2 × subagent_cost\` — otherwise prefer fan-out.

4. **Brief must be self-contained**: Each teammate launches WITHOUT main-session context. The Agent() prompt must include enough background, file paths, success criteria, and counter-positions so the teammate can work independently. Generic prompts produce shallow output.`

/** v3.6.0 Phase 4 — Combined critical-system-reminder string injected into
 *  spawned subagent prompt. Composition order (sister Phase 3 chain extended):
 *    1. ESCALATION_RULES (v3.5.0 Phase 2) — 5 Agent Teams escalation triggers
 *    2. TRANSPARENT_SKIP_RULES (v3.6.0 Phase 3) — fallback 三条铁律 transparent
 *       skip discipline (skip + explanation > silent execution on low-confidence)
 *    3. AGENT_TEAMS_PREVENTION_RULES (v3.6.0 Phase 4) — Agent Teams 防呆 4 项
 *       (session-scoped / cleanup mandatory / token-cost / self-contained brief)
 *  Both paths in buildAgentDef (rolePrompt found + conservative fallback) inject
 *  this combined string into criticalSystemReminder_EXPERIMENTAL.
 *  Logical order: 识别 (ESCALATION) → confidence judge (TRANSPARENT_SKIP) →
 *  prevention discipline (AGENT_TEAMS_PREVENTION). */
/** v3.8.0 P1 — Conditional RULES inject. Map rule name → RULES const for
 *  per-phase dynamic chain construction. Adding a new rule: add const above +
 *  entry here + (optional) default-list. Unknown names silently skipped at
 *  runtime for forward compatibility. */
const RULES_MAP: Record<string, string> = {
  escalation: ESCALATION_RULES,
  'transparent-skip': TRANSPARENT_SKIP_RULES,
  'agent-teams-prevention': AGENT_TEAMS_PREVENTION_RULES,
}

/** v3.8.0 P1 — Default RULES injected when phase yaml omits `injects_rules`.
 *  ~470 tokens (escalation ~320 + transparent-skip ~150). Agent Teams
 *  prevention (~200 tokens) opt-in for phases that genuinely involve Team
 *  escalation (task-deliver / task-test / verify-multispec — see their
 *  workflow.yaml). Weighted-avg across 24 sub-workflows ≈ 512 tokens/spawn
 *  vs v3.6.0 Phase 4 全 670 → ~24% reduction. */
const DEFAULT_INJECTS_RULES = ['escalation', 'transparent-skip'] as const

/** v3.8.0 P1 — Build `criticalSystemReminder_EXPERIMENTAL` string from rule
 *  name list. Empty/undefined list → DEFAULT_INJECTS_RULES. Unknown rule
 *  names silently filtered (forward-compat). */
function buildCriticalReminder(injectsRules?: readonly string[]): string {
  const rules = injectsRules ?? DEFAULT_INJECTS_RULES
  return rules
    .map((name) => RULES_MAP[name])
    .filter((rule): rule is string => rule !== undefined)
    .join('\n\n')
}

/** Phase v3.4.4 (Phase 4) — build an AgentDefinition for a workflow phase skill,
 *  enriched via `workflows/role-prompts.yaml` when a matching entry exists.
 *
 *  Lookup chain (D-3):
 *    1. rolePrompts[skillName] — phase id direct hit (e.g. '01-fan-out' on the
 *       rare case the phase id IS keyed in role-prompts.yaml).
 *    2. rolePrompts[workflowName] — sub-workflow name hit (e.g. phase id
 *       '01-review' inside `verify-paranoid/workflow.yaml` → 'verify-paranoid'
 *       keyed in role-prompts.yaml). This is the common path.
 *    3. Conservative 2-field stub fallback (Phase 2 behavior) — applies for
 *       standalone non-master phases that lack any role-prompt entry.
 *
 *  When found, splices `responsibility` + `checklist` + `severity` + `specialist`
 *  into the prompt body. `modelTierOverride` (B-10 escape hatch from
 *  `--model-tier inherit`) is applied to the AgentDefinition `model` field when
 *  set (sourced from `gateContext.modelTierOverride`).
 *
 *  v3.5.0 Phase 2 Wave 1 — BOTH code paths (rolePrompt found OR fallback stub)
 *  now also inject `criticalSystemReminder_EXPERIMENTAL: ESCALATION_RULES` so
 *  spawned subagents uniformly know when to signal Agent Teams escalation.
 *
 *  v3.6.0 Phase 3 Wave 3 — both code paths now inject CRITICAL_SYSTEM_REMINDER
 *  (= ESCALATION_RULES + TRANSPARENT_SKIP_RULES appended) so spawned subagents
 *  ALSO follow the fallback 三条铁律 "拿不准 → 倾向跳过 + 透明声明" discipline.
 *
 *  v3.6.0 Phase 4 Wave 1 — added AGENT_TEAMS_PREVENTION_RULES (P1b) so spawned
 *  subagents, when signaling needs_teams_escalation=true, ALSO remind the user
 *  of the 4 Agent Teams 防呆 rules.
 *
 *  v3.8.0 P1 — `criticalSystemReminder_EXPERIMENTAL` is now built dynamically via
 *  `buildCriticalReminder(injectsRules)`. Callers can pass phase-specific rule
 *  list; absent → DEFAULT_INJECTS_RULES (escalation + transparent-skip, ~470
 *  tokens). Phases declaring `injects_rules: [escalation, transparent-skip,
 *  agent-teams-prevention]` in workflow.yaml get the 670-token full chain.
 *  ~24% weighted-avg token reduction vs unconditional v3.6.0 Phase 4 behavior. */
export function buildAgentDef(
  skillName: string,
  rolePrompts?: Record<string, RolePrompt>,
  workflowName?: string,
  modelTierOverride?: string,
  injectsRules?: readonly string[],
): AgentDefinition {
  const rp = rolePrompts?.[skillName] ?? (workflowName ? rolePrompts?.[workflowName] : undefined)
  const criticalReminder = buildCriticalReminder(injectsRules)
  if (!rp) {
    // Conservative fallback (Phase 2 behavior) for phase ids not in role-prompts.yaml.
    return {
      description: `harnessed workflow phase: ${skillName}`,
      prompt: `You are executing the '${skillName}' workflow phase. Follow the phase intent and emit a structured COMPLETE signal when done.`,
      criticalSystemReminder_EXPERIMENTAL: criticalReminder,
      ...(modelTierOverride ? { model: modelTierOverride } : {}),
    } as AgentDefinition
  }
  const checklist = rp.checklist.length
    ? `\n\nChecklist:\n${rp.checklist.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}`
    : ''
  const prompt = [
    `You are a ${rp.specialist}.`,
    ``,
    rp.responsibility.trim(),
    checklist,
    ``,
    `Severity scale: ${rp.severity}`,
    ``,
    `Emit a structured COMPLETE signal when done.`,
  ].join('\n')
  return {
    description: rp.description,
    prompt,
    criticalSystemReminder_EXPERIMENTAL: criticalReminder,
    ...(modelTierOverride ? { model: modelTierOverride } : {}),
  } as AgentDefinition
}

/** Phase v3.4.4 (Phase 3) — ralph-loop opt-in detection per phase. Returns true when
 *  any of: phase.max_iterations declared, phase.fallback.max_iterations_exceeded
 *  declared, phase.upstream === 'ralph-loop'. Default OFF (single-shot sdkSpawn)
 *  for phases without any ralph-loop yaml signal — preserves Phase 2 behavior for
 *  the 7 phases that lack the signal (e.g. task-code/02-progress, verify-design/01).
 *
 *  Exported for unit-testability + so Phase 3 Commit 3's wrap-conditional inside
 *  `_dispatchSkillStub.fn` can reuse the same predicate (single source of truth). */
export function isRalphLoopOptIn(phase: unknown): boolean {
  if (!phase || typeof phase !== 'object') return false
  const p = phase as Record<string, unknown>
  if (p.max_iterations !== undefined && p.max_iterations !== null) return true
  if (p.upstream === 'ralph-loop') return true
  const fb = p.fallback as Record<string, unknown> | undefined
  if (fb?.max_iterations_exceeded !== undefined) return true
  return false
}

/** Phase v3.4.4 (Phase 3) — max-iter resolution chain (CLI flag → phase yaml → 20),
 *  clamped at hard_upper_limit 100. Reads gateContext.maxIterations (Number, set
 *  by src/cli/run.ts:84 from `--max-iterations <n>`) + phase.max_iterations (yaml
 *  Number OR pre-resolved JINJA String → coerce via parseInt).
 *
 *  Priority (high → low):
 *    1. gateContext.maxIterations (CLI flag)
 *    2. phase.max_iterations (yaml Number OR coerced String)
 *    3. RALPH_DEFAULT_MAX_ITER (hardcoded 20)
 *
 *  Result clamped to [1, RALPH_HARD_UPPER_LIMIT (100)] regardless of source.
 *
 *  Exported for unit-testability + so Phase 3 Commit 3's call-site at L183 can
 *  pass the resolved value down to `_dispatchSkillStub.fn` opts.maxIter. */
export function resolveMaxIterations(phase: unknown, gateContext: Record<string, unknown>): number {
  const fromCli =
    typeof gateContext.maxIterations === 'number' ? gateContext.maxIterations : undefined
  let fromYaml: number | undefined
  if (phase && typeof phase === 'object') {
    const raw = (phase as Record<string, unknown>).max_iterations
    if (typeof raw === 'number') fromYaml = raw
    else if (typeof raw === 'string') {
      const n = Number.parseInt(raw, 10)
      if (Number.isFinite(n) && n > 0) fromYaml = n
    }
  }
  const chosen = fromCli ?? fromYaml ?? RALPH_DEFAULT_MAX_ITER
  return Math.min(Math.max(1, chosen), RALPH_HARD_UPPER_LIMIT)
}

export const _dispatchSkillStub = {
  fn: async (
    skillName: string,
    phase?: unknown,
    opts?: {
      maxIter?: number
      fallback?: FallbackMaxIterationsExceededConfig
      workflowName?: string
      rolePrompts?: Record<string, RolePrompt>
      modelTierOverride?: string
    },
  ): Promise<DispatchStubResult> => {
    const optIn = isRalphLoopOptIn(phase)
    const spawnOnce = async (
      resumeSessionId?: string,
      onSessionId?: (id: string) => void,
    ): Promise<string> => {
      // v3.8.0 P1 — read optional phase.injects_rules (string[]) for conditional
      // RULES inject; absent → buildAgentDef applies DEFAULT_INJECTS_RULES.
      const injectsRules =
        phase &&
        typeof phase === 'object' &&
        'injects_rules' in phase &&
        Array.isArray((phase as Record<string, unknown>).injects_rules)
          ? ((phase as Record<string, unknown>).injects_rules as string[])
          : undefined
      return sdkSpawn(
        buildAgentDef(
          skillName,
          opts?.rolePrompts,
          opts?.workflowName,
          opts?.modelTierOverride,
          injectsRules,
        ),
        {
          expertName: skillName,
          ...(resumeSessionId ? { resumeSessionId } : {}),
          ...(onSessionId ? { onSessionId } : {}),
        },
      )
    }

    let envelopeJson: string
    try {
      if (optIn) {
        const maxIter = opts?.maxIter ?? RALPH_DEFAULT_MAX_ITER
        envelopeJson = await ralphLoopWrap(spawnOnce, maxIter)
      } else {
        envelopeJson = await spawnOnce()
      }
    } catch (err) {
      // R20.10 c — explicit halt path: phase fallback config present → UX text + process.exit
      if (err instanceof MaxIterationsExceededError && opts?.fallback) {
        // handleMaxIterationsExceeded calls process.exit(exit_code) — never returns
        handleMaxIterationsExceeded(err, opts.fallback, {
          subtaskSummary: `phase ${skillName}`,
          // Phase 4 — plumbed actual workflow name (was hardcoded 'harnessed-run'
          // pre-Phase 4); falls back to literal when opts.workflowName absent
          // (preserves Phase 3 behavior for callers that don't pass workflowName).
          workflowName: opts.workflowName ?? 'harnessed-run',
          phaseId: skillName,
          maxIterations: opts?.maxIter ?? RALPH_DEFAULT_MAX_ITER,
        })
      }
      // Fail-soft per ADR 0029 — runtime emits failure but doesn't crash run loop.
      return {
        status: 'fail',
        output:
          err instanceof MaxIterationsExceededError
            ? `ralph-loop max-iterations exceeded (${err.iterations}) for ${skillName}`
            : `sdkSpawn failed for ${skillName}: ${(err as Error).message}`,
      }
    }

    const env = JSON.parse(envelopeJson) as {
      structured_output?: {
        status?: string
        // v3.5.0 Phase 2 — Option 1-Lite escalation signal fields (D3).
        needs_teams_escalation?: boolean
        escalation_reason?: string
      }
      text?: string
      result?: string
      subtype?: string
    }
    const status: 'ok' | 'fail' =
      env.structured_output?.status === 'COMPLETE' || env.subtype === 'success' ? 'ok' : 'fail'
    const escalation = env.structured_output?.needs_teams_escalation === true
    return {
      status,
      output: env.text ?? env.result ?? '',
      ...(env.structured_output?.status ? { decision: env.structured_output.status } : {}),
      ...(escalation
        ? {
            needsTeamsEscalation: true,
            ...(env.structured_output?.escalation_reason
              ? { escalationReason: env.structured_output.escalation_reason }
              : {}),
          }
        : {}),
    }
  },
}

export interface RunWorkflowOpts {
  packageRoot?: string
  gateContext?: Record<string, unknown>
}

/** Run a workflow YAML to complete / paused-veto / failed (activate before veto per
 *  B-01)。W0.2: master detect → runMasterOrchestrator + disciplines wedge → gateContext。
 *  W1.5: 3 phase-level hook fire point (before-spawn / after-output / before-commit)。 */
export async function runWorkflow(
  yamlPath: string,
  vars: Record<string, string>,
  opts: RunWorkflowOpts = {},
): Promise<WorkflowRunResult> {
  const parsed = loadPhases(yamlPath, vars)
  // packageRoot fallback: infer from yaml's parent-of-parent (cwd-swap safe).
  const yamlDir = dirname(pathResolve(yamlPath))
  const inferredRoot = pathResolve(yamlDir, '..', '..')
  const packageRoot = opts.packageRoot ?? inferredRoot
  // shallow-clone gateContext 避免 mutate caller object (W0.2 加 disciplines)。
  const gateContext: Record<string, unknown> = { ...(opts.gateContext ?? {}) }

  // Phase 4 — load role-prompts.yaml ONCE per workflow run (cached map for all
  // phases — NOT per-phase). Fail-soft per ADR 0029: missing yaml or parse error
  // → empty map (buildAgentDef falls back to conservative 2-field stub).
  let rolePrompts: Record<string, RolePrompt> = {}
  try {
    rolePrompts = await loadRolePrompts(join(packageRoot, 'workflows'))
  } catch (err) {
    console.warn(
      `⚠️ loadRolePrompts failed (${(err as Error).message}); ` +
        'proceeding without role-prompt enrichment (ADR 0029 fail-soft).',
    )
  }

  // W0.2 — master vs sub detect: workflow ∈ 4 master + delegates_to non-empty → delegate。
  const workflowName = parsed.workflow
  const isMaster =
    'delegates_to' in parsed &&
    Array.isArray(parsed.delegates_to) &&
    parsed.delegates_to.length > 0 &&
    MASTER_NAMES.includes(workflowName as MasterName)
  if (isMaster) {
    const r = await runMasterOrchestrator(workflowName as MasterName, gateContext, packageRoot)
    return {
      status: 'complete',
      phasesRun: r.fired.length,
      ...(r.skipped.length > 0 ? { skippedPhases: r.skipped } : {}),
    }
  }

  // W0.2 — loadDisciplinesForPhase wedge: v3 sub yaml `disciplines_applied` 消费,
  // 6 default fallback;v1/v2 yaml 无 field 时 narrow 守 backwards-compat。Fail-soft 沿 ADR 0029。
  const disciplinesApplied =
    'disciplines_applied' in parsed && Array.isArray(parsed.disciplines_applied)
      ? (parsed.disciplines_applied as readonly string[])
      : undefined
  try {
    const disciplines = await loadDisciplinesForPhase(disciplinesApplied, packageRoot)
    gateContext.disciplines = disciplines
  } catch (err) {
    console.warn(
      `⚠️ loadDisciplinesForPhase failed (${(err as Error).message}); ` +
        'proceeding without disciplines map (sister ADR 0029 fail-soft).',
    )
  }

  const skippedPhases: string[] = []
  // v3 sub/standalone phases Optional → 守护 fallback;v1/v2 必有 phases (loadPhases validate)。
  const phases = parsed.phases ?? []
  for (let i = 0; i < phases.length; i++) {
    const ph = phases[i]
    if (!ph) continue
    await activatePhase(ph.id)

    // W1.5 — before-spawn arbitrate if `invokes_tools.length > 1` (K14 warn-not-halt)。
    const invokesTools =
      'invokes_tools' in ph && Array.isArray(ph.invokes_tools) ? ph.invokes_tools : undefined
    if (invokesTools && invokesTools.length > 1) {
      try {
        const firedCaps = invokesTools.map((c) => ({ name: c.tool, tier: c.tool }))
        await arbitrateBeforeSpawn(firedCaps, packageRoot)
      } catch (err) {
        console.warn(
          `⚠️ phase ${ph.id} before-spawn arbitrate failed (${(err as Error).message}); ` +
            'proceeding default tool order (K14 warn-not-halt).',
        )
      }
    }

    // D-04 lazy-read governance gate (1 read per phase boundary, NOT polling)。
    if (await isVetoed()) {
      await statePause()
      return { status: 'paused-veto', phasesRun: i, lastPhaseId: ph.id }
    }

    // v2 `phase.gate` 4-level ref pre-flight。Fail-soft per ADR 0029 (eval throw → warn + 视为 fired=true),
    // EXCEPT undefined-variable (static config bug) → fail-closed per ADR 0029 Amendment (4.23.2, issue #5).
    if ('gate' in ph && ph.gate) {
      let fires = true
      try {
        fires = await resolveJudgmentGate(ph.gate, gateContext, packageRoot)
      } catch (err) {
        if (isUndefinedVariableError(err)) {
          console.warn(
            `⚠️ phase ${ph.id} gate ${ph.gate} references a variable missing from the gate ` +
              `context (${(err as Error).message}). Treating as NOT fired (fail-closed for ` +
              `config errors) — fix the judgments yaml expression or supply the variable via ` +
              `--context / gateContext defaults.`,
          )
          fires = false
        } else {
          console.warn(
            `⚠️ phase ${ph.id} gate ${ph.gate} eval failed (${(err as Error).message}); ` +
              'proceeding with phase as if gate fired=true (ADR 0029 fail-soft).',
          )
        }
      }
      if (!fires) {
        skippedPhases.push(ph.id)
        await completePhase({
          phaseId: ph.id,
          status: 'complete',
          lastTask: `phase ${ph.id} skipped: gate ${ph.gate} evaluated false`,
        })
        continue
      }
    }

    // v1 skills[0] OR v2/v3 phase id 作 skill name dispatch (narrow 'skills' in ph)。
    const skillName = ('skills' in ph && ph.skills?.[0]) || ph.id
    // Phase v3.4.4 (Phase 3) — resolve max-iter + extract fallback config from phase yaml
    // before dispatch; both consumed by _dispatchSkillStub.fn opts to gate ralph-loop wrap.
    const maxIter = resolveMaxIterations(ph, gateContext)
    const fallback =
      'fallback' in ph && ph.fallback?.max_iterations_exceeded
        ? (ph.fallback.max_iterations_exceeded as FallbackMaxIterationsExceededConfig)
        : undefined
    const r = await _dispatchSkillStub.fn(skillName, ph, {
      maxIter,
      ...(fallback ? { fallback } : {}),
      workflowName,
      rolePrompts,
      ...(typeof gateContext.modelTierOverride === 'string'
        ? { modelTierOverride: gateContext.modelTierOverride }
        : {}),
    })
    if (r.status !== 'ok') {
      return { status: 'failed', phasesRun: i, lastPhaseId: ph.id }
    }

    // v3.5.0 Phase 2 — Option 1-Lite escalation hint to user (D4). spawned subagent
    // signaled one of 5 parallelism-gate.yaml agent-teams-upgrade triggers fired.
    // User in main Claude Code session decides whether to open Agent Teams
    // (TeamCreate not available to spawned subagents via SDK v0.3.142). Non-blocking;
    // English-only per D5 default (i18n deferred to v3.6 if user requests).
    if (r.needsTeamsEscalation === true) {
      const reason = r.escalationReason ?? 'unspecified trigger'
      console.error(
        `⚠️ phase ${ph.id} suggests Agent Teams escalation — ${reason}. ` +
          'Consider opening a team in your main Claude Code session (TeamCreate) ' +
          'if continuing this work benefits from teammate coordination. ' +
          'See workflows/judgments/parallelism-gate.yaml for the 5 upgrade triggers.',
      )
    }

    // W1.5 — after-output validate if r.target==='chat' (commit/file target 不应用 output-style)。
    if (r.target === 'chat') {
      try {
        await runAfterOutputHook({
          responseText: r.output,
          responseTarget: 'chat',
          userRequestedEmoji: false,
          packageRoot,
        })
      } catch (err) {
        console.warn(
          `⚠️ phase ${ph.id} after-output hook failed (${(err as Error).message}); ` +
            'proceeding (ADR 0029 fail-soft).',
        )
      }
    }

    // W1.5 — before-commit hook if r.triggers_commit===true (biome-preempt + no-skip-hooks)。
    // changedFiles + cmdArgs v3.0 WIRED 默认 empty (Phase 3.3+ dogfood 真接 spawn 时 fill)。
    if (r.triggers_commit === true) {
      try {
        await runBeforeCommitHook({
          changedFiles: [],
          cmdArgs: [],
          packageRoot,
          cmdType: 'git-commit',
          hasUserApproval: false,
        })
      } catch (err) {
        console.warn(
          `⚠️ phase ${ph.id} before-commit hook failed (${(err as Error).message}); ` +
            'proceeding (ADR 0029 fail-soft).',
        )
      }
    }

    await completePhase({
      phaseId: ph.id,
      status: 'complete',
      lastTask: `phase ${ph.id} complete: ${r.output}`,
    })
  }
  return {
    status: 'complete',
    phasesRun: phases.length,
    ...(skippedPhases.length > 0 ? { skippedPhases } : {}),
  }
}
