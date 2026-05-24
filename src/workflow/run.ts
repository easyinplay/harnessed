// run.ts — D-03 WIRED + D-04 PUSH + W0.2 (master detect + disciplines wedge) + W1.5
// (3 phase-level hook: before-spawn / after-output / before-commit per RESEARCH-disciplines § 4.4)。
// Phase v3.4.4 — _dispatchSkillStub.fn production default rewired to real sdkSpawn
// (was literal '<stub for X>'). DI seam preserved for tests.
import { dirname, resolve as pathResolve } from 'node:path'
import { activatePhase, completePhase } from '../checkpoint/engineHook.js'
import { pause as statePause } from '../checkpoint/state.js'
import { runAfterOutputHook } from '../discipline/enforcement/after-output.js'
import { runBeforeCommitHook } from '../discipline/enforcement/before-commit.js'
import { loadDisciplinesForPhase } from '../discipline/enforcement/before-phase-execute.js'
import { arbitrateBeforeSpawn } from '../discipline/enforcement/before-spawn.js'
import type { AgentDefinition } from '../routing/agentDefinition.js'
import { isVetoed } from './governance.js'
import { resolveJudgmentGate } from './judgmentResolver.js'
import { sdkSpawn } from './lib/sdkSpawn.js'
import { loadPhases } from './loadPhases.js'
import { type MasterName, runMasterOrchestrator } from './masterOrchestrator.js'

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
}
/** Phase v3.4.4 — build a minimal AgentDefinition for a workflow phase skill.
 *  Conservative default (description + prompt only); Phase 4 will enrich with
 *  role-prompts.yaml lookup + capabilities.yaml model tier. */
function buildAgentDef(skillName: string): AgentDefinition {
  return {
    description: `harnessed workflow phase: ${skillName}`,
    prompt: `You are executing the '${skillName}' workflow phase. Follow the phase intent and emit a structured COMPLETE signal when done.`,
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
  fn: async (skillName: string): Promise<DispatchStubResult> => {
    try {
      const envelopeJson = await sdkSpawn(buildAgentDef(skillName), {
        expertName: skillName,
      })
      const env = JSON.parse(envelopeJson) as {
        structured_output?: { status?: string }
        text?: string
        result?: string
        subtype?: string
      }
      const status: 'ok' | 'fail' =
        env.structured_output?.status === 'COMPLETE' || env.subtype === 'success' ? 'ok' : 'fail'
      return {
        status,
        output: env.text ?? env.result ?? '',
        ...(env.structured_output?.status ? { decision: env.structured_output.status } : {}),
      }
    } catch (err) {
      // Fail-soft per ADR 0029 — runtime emits failure but doesn't crash run loop.
      return {
        status: 'fail',
        output: `sdkSpawn failed for ${skillName}: ${(err as Error).message}`,
      }
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

    // v2 `phase.gate` 4-level ref pre-flight。Fail-soft per ADR 0029 (eval throw → warn + 视为 fired=true)。
    if ('gate' in ph && ph.gate) {
      let fires = true
      try {
        fires = await resolveJudgmentGate(ph.gate, gateContext, packageRoot)
      } catch (err) {
        console.warn(
          `⚠️ phase ${ph.id} gate ${ph.gate} eval failed (${(err as Error).message}); ` +
            'proceeding with phase as if gate fired=true (ADR 0029 fail-soft).',
        )
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
    const r = await _dispatchSkillStub.fn(skillName)
    if (r.status !== 'ok') {
      return { status: 'failed', phasesRun: i, lastPhaseId: ph.id }
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
