// src/cli/lib/gateContext.ts — single source of truth for the default gate
// evaluation context (v4.1.2 — extracted from gates.ts + run.ts to kill the
// verbatim-copy drift risk both reviewers flagged).
//
// The CLI can't infer real context from a free-form task string, so defaults
// bias toward "treat as important" → safety-net gates (brainstorming / tdd /
// paranoid) fire by default. Sub-workflow gate expressions reference phase.* /
// subtask.* — an undefined variable would throw at expr-eval, so every variable
// any judgments/*.yaml `fires_when` references MUST exist here.

export interface DefaultGateContext {
  task: string
  user_understanding_unclear: boolean
  phase: Record<string, unknown>
  subtask: Record<string, unknown>
  // v4.1.2 — team-routing facts referenced by judgments.parallelism-gate.
  // agent-teams-upgrade.fires. Without these the parallelism gate throws on
  // every eval → escalate_to_teams silently hard-false. Default false (opt-in).
  teammate_send_message_needed: boolean
  subagent_context_overflow: boolean
  shared_task_list: boolean
  opposing_hypothesis_debate: boolean
  fullstack_three_way: boolean
  [key: string]: unknown
}

/** Build the full default gate context. `stage` seeds `phase.stage`. */
export function buildDefaultGateContext(task: string, stage: string): DefaultGateContext {
  return {
    task,
    user_understanding_unclear: false,
    // v4.1.2 — parallelism-gate.agent-teams-upgrade team-routing facts (default off).
    teammate_send_message_needed: false,
    subagent_context_overflow: false,
    shared_task_list: false,
    opposing_hypothesis_debate: false,
    fullstack_three_way: false,
    phase: {
      stage,
      is_critical_module: true,
      is_final_step: true,
      is_major_release: false,
      has_auth_or_secrets: false,
      has_design_changes: false,
      has_ui_changes: false,
      requires_creative_polish: false,
      is_complex_architecture: true,
      has_cross_phase_data_flow: true,
      open_decisions: 2,
      scope_days: 2,
      scope_locked_in_history: false,
      single_task: false,
      type: 'general',
    },
    subtask: {
      approaches: 2,
      core_algorithm: true,
      has_api_contract: true,
      error_cost: 'high',
      lines: 50,
      type: 'general',
      is_core_business_logic: true,
      is_algorithm: true,
      is_data_processing: true,
      regression_risk: 'high',
      reliability_required: true,
      communication_needed: false,
      needs_lib_docs: false,
      needs_web_search: false,
      parallel_count: 1,
      search_type: 'general',
      test_type: 'general',
    },
  }
}

/** Merge user `--context` JSON over the defaults. Deep-merges the nested
 *  `phase` / `subtask` objects so a partial override (e.g. flip one phase fact)
 *  does NOT clobber the other defaults — the v4.1.1 shallow Object.assign bug. */
export function mergeGateContext(
  base: DefaultGateContext,
  extra: Record<string, unknown>,
): DefaultGateContext {
  const merged: DefaultGateContext = { ...base }
  for (const [k, v] of Object.entries(extra)) {
    if ((k === 'phase' || k === 'subtask') && v && typeof v === 'object' && !Array.isArray(v)) {
      merged[k] = { ...(base[k] as Record<string, unknown>), ...(v as Record<string, unknown>) }
    } else {
      merged[k] = v
    }
  }
  return merged
}
