// run.ts — D-03 WIRED + D-04 PUSH + W0.2 (master detect + disciplines wedge) + W1.5
// (3 phase-level hook: before-spawn / after-output / before-commit per RESEARCH-disciplines § 4.4)。
import { dirname, resolve as pathResolve } from 'node:path'
import { activatePhase, completePhase } from '../checkpoint/engineHook.js'
import { pause as statePause } from '../checkpoint/state.js'
import { runAfterOutputHook } from '../discipline/enforcement/after-output.js'
import { runBeforeCommitHook } from '../discipline/enforcement/before-commit.js'
import { loadDisciplinesForPhase } from '../discipline/enforcement/before-phase-execute.js'
import { arbitrateBeforeSpawn } from '../discipline/enforcement/before-spawn.js'
import { isVetoed } from './governance.js'
import { resolveJudgmentGate } from './judgmentResolver.js'
import { loadPhases } from './loadPhases.js'
import { type MasterName, runMasterOrchestrator } from './masterOrchestrator.js'

const MASTER_NAMES: readonly MasterName[] = ['discuss', 'plan', 'task', 'verify']

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
export const _dispatchSkillStub = {
  fn: async (skillName: string): Promise<DispatchStubResult> => ({
    status: 'ok',
    output: `<stub for ${skillName}>`,
    decision: 'mock-approved',
  }),
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
