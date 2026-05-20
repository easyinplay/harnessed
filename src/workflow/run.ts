// src/workflow/run.ts — Phase 3.2 W2 T2.3 (D-03 WIRED LOCKED + D-04 PUSH consume).
// Sister Phase 3.1 W3 engineHook.ts wedge pattern (workflow runner 二代消费者 of
// checkpoint engine). WIRED 中庸: 5-phase 桩跑 governance + checkpoint 真 wire,
// 不接外部 spawn (Phase 3.3+ dogfood 时换真 gsd-discuss/plan/execute spawn).
//
// PLANNER-REVISION ITER 1:
//  - B-01 fix: activate-BEFORE-veto-check inside for-loop ensures every paused-veto
//    path writes valid paused current-workflow.json that Phase 3.1 resume.ts can
//    consume (sister Phase 3.1 D-02 contract: pause transitions from active).
//  - W-01 fix: sessionId dead variable removed (dispatchSkillStub returns no
//    sessionId per D-03 WIRED stub; sister Phase 3.1 W-04 dead-var lesson
//    [BLOCKER]); sessionId propagation deferred to Phase 3.3+ dogfood true spawn.
import { activatePhase, completePhase } from '../checkpoint/engineHook.js'
import { pause as statePause } from '../checkpoint/state.js'
import { isVetoed } from './governance.js'
import { loadPhases } from './loadPhases.js'

export interface WorkflowRunResult {
  status: 'complete' | 'paused-veto' | 'failed'
  phasesRun: number
  lastPhaseId?: string
}

/** 5-phase stub spawner — D-03 WIRED LOCKED. Phase 3.3+ dogfood 时换真 spawn
 *  (gsd-discuss / gsd-plan / gstack-office-hours via dispatchSpawn). */
async function dispatchSkillStub(
  skillName: string,
): Promise<{ status: 'ok' | 'fail'; output: string; decision?: string }> {
  // RESEARCH § 6.2 minimal 3-field mock (Karpathy YAGNI; elapsed_ms dropped)
  return {
    status: 'ok',
    output: `<stub for ${skillName}>`,
    decision: 'mock-approved',
  }
}

/** Run a workflow YAML to completion OR governance veto OR skill failure.
 *  - activatePhase writes 'active' current-workflow.json BEFORE veto-check (B-01 fix).
 *  - lazy isVetoed() PUSH gate AFTER activate (1 read per phase boundary, NOT polling).
 *  - If vetoed: statePause() transitions active→paused (Phase 3.1 D-02 contract).
 *  - completePhase via Phase 3.1 engineHook (二代消费者).
 *  - WIRED mode: NO sessionId propagation (stub returns none); Phase 3.3+ dogfood true
 *    spawn 时 sessionId 字段加 (W-01 deferred per planner-revision iter 1). */
export async function runWorkflow(
  yamlPath: string,
  vars: Record<string, string>,
): Promise<WorkflowRunResult> {
  const parsed = loadPhases(yamlPath, vars) // interpolates {{ var }} per T2.1
  for (let i = 0; i < parsed.phases.length; i++) {
    const ph = parsed.phases[i]
    if (!ph) continue
    // B-01 fix: activatePhase BEFORE isVetoed — guarantees current-workflow.json
    // 'active' state exists for statePause() to transition; covers veto-at-i=0
    // scenario (T2.6 fixture 3) where no prior phase exists to seed state.
    await activatePhase(ph.id)
    // D-04 PUSH lazy-read governance gate (1 read per phase boundary, NOT polling).
    // Phase 3.1 resume.ts can now consume the paused state written by statePause().
    if (await isVetoed()) {
      await statePause()
      return { status: 'paused-veto', phasesRun: i, lastPhaseId: ph.id }
    }
    // T2.4.W1.1: loadPhases returns v1 OR v2 union — v1 phase has `skills?`, v2
    // does NOT (capability/on/invoke replace skills). Narrow via `'skills' in ph`
    // — v1 path uses skills[0], v2 / no-skills path falls back to phase id.
    const skillName = ('skills' in ph && ph.skills?.[0]) || ph.id
    const r = await dispatchSkillStub(skillName)
    if (r.status !== 'ok') {
      return { status: 'failed', phasesRun: i, lastPhaseId: ph.id }
    }
    // W-01 fix: NO sessionId spread (dead var removed); WIRED stub returns no
    // sessionId per D-03; Phase 3.3+ dogfood true spawn 时 add session_id field.
    await completePhase({
      phaseId: ph.id,
      status: 'complete',
      lastTask: `phase ${ph.id} complete: ${r.output}`,
    })
  }
  return { status: 'complete', phasesRun: parsed.phases.length }
}
