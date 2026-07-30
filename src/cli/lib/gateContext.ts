// src/cli/lib/gateContext.ts — single source of truth for the default gate
// evaluation context (v4.1.2 — extracted from gates.ts + run.ts to kill the
// verbatim-copy drift risk both reviewers flagged).
//
// The CLI can't infer real context from a free-form task string, so defaults
// bias toward "treat as important" → safety-net gates (brainstorming / tdd /
// paranoid) fire by default. Sub-workflow gate expressions reference phase.* /
// subtask.* — an undefined variable would throw at expr-eval, so every variable
// any judgments/*.yaml `fires_when` references MUST exist here.
//
// T2.1 OQ2 = (c) — that "bias toward important" was pinned so hard that the
// criteria had NO discriminating power: every judgement-call fact sat on its
// firing side and no workflow ever supplied --context, so the gates were
// equivalent to "always fire". Four are now withdrawn to their non-firing side
// (`phase.is_critical_module`, `phase.is_complex_architecture`,
// `subtask.core_algorithm`, `subtask.error_cost`); the rest of the safety net
// stays until `harnessed facts` produces real coverage data on which facts
// models actually fill. Withdrawn ≠ deleted: option (b) "leave them undefined
// and let ADR-0038 fail-closed decide" was rejected, because an absent fact
// silently DELETES a governance gate. `harnessed facts <master>` is how the
// real values now reach a run.

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
    // 4.23.2 (issue #5) — stage-routing.yaml verify-multispec-critical-release
    // references the BARE identifier (root-flat schema contract, sister
    // src/workflow/schema/phaseFactContext.ts). Missing here since the v4.1.2
    // extraction → eval threw undefined-variable → ADR 0029 fail-soft fired the
    // 4-specialist multispec team on EVERY verify. Opt-in via --context.
    is_critical_release: false,
    phase: {
      stage,
      // T2.1 OQ2(c) — withdrawn: gated stage-routing.verify-paranoid-critical,
      // which meant the paranoid staff-engineer review fired on EVERY verify.
      is_critical_module: false,
      is_final_step: true,
      is_major_release: false,
      has_auth_or_secrets: false,
      has_design_changes: false,
      has_ui_changes: false,
      // T2.1 gap-close — stage-routing verify-eval-review-aiphase /
      // verify-validate-phase-coverage read these; neither was declared here nor
      // in PhaseShape, so the member was absent and both gates evaluated to a
      // silent false forever. Default FALSE (the non-firing side) on purpose:
      // both subs are expensive retroactive audits that should be requested by a
      // filled fact, not defaulted on. `harnessed facts verify` lists them as
      // nulls with hints so the model supplies the real answer.
      has_ai_phase: false,
      requires_coverage_audit: false,
      requires_creative_polish: false,
      // T2.1 OQ2(c) — withdrawn: gated stage-routing.plan-architecture-delegate,
      // which meant /plan always spawned the eng-review architecture sub.
      is_complex_architecture: false,
      has_cross_phase_data_flow: true,
      open_decisions: 2,
      scope_days: 2,
      scope_locked_in_history: false,
      single_task: false,
      type: 'general',
    },
    subtask: {
      approaches: 2,
      // T2.1 OQ2(c) — withdrawn (both are subtask-gate.brainstorming OR-arms;
      // `approaches: 2` / `has_api_contract: true` stay as the safety net).
      core_algorithm: false,
      has_api_contract: true,
      error_cost: 'low',
      lines: 50,
      type: 'general',
      is_core_business_logic: true,
      is_algorithm: true,
      is_data_processing: true,
      regression_risk: 'high',
      reliability_required: true,
      communication_needed: false,
      needs_lib_docs: false,
      // T2.3 — web-search-routing.yaml declares Tavily/keyword THE default route,
      // and workflows/research/workflow.yaml now gates its 5 source lanes on those
      // triggers. Leaving needs_web_search=false + search_type='general' (not even
      // a member of the SearchType union in schema/phaseFactContext.ts) would make
      // every lane evaluate false → the research workflow would degrade to zero
      // sources, a regression vs the previously-unconditional fan-out step. The
      // non-default lanes (descriptive/academic → exa, site-crawl, lib-docs →
      // ctx7, single-url → WebFetch) stay opt-in via --context.
      needs_web_search: true,
      search_type: 'keyword',
      // T2.3 — `browse` capability + web-testing-routing browse-probe fact. Default
      // FALSE (opt-in): it is an OR-arm of the browser-probe route, and defaulting
      // it true would route a browser lane on every eval — the same "most expensive
      // sub became the default path" defect 4.23.2 fixed. Reachable via --context
      // or a facts-extraction chain.
      needs_browser_automation: false,
      parallel_count: 1,
      test_type: 'general',
    },
  }
}

/** Merge user `--context` / `--context-file` JSON over the defaults. Deep-merges
 *  the nested `phase` / `subtask` objects so a partial override (e.g. flip one
 *  phase fact) does NOT clobber the other defaults — the v4.1.1 shallow
 *  Object.assign bug.
 *
 *  T2.1 D-4 — a `null` value means NOT PROVIDED and is dropped, so the default
 *  survives. `harnessed facts` emits null for every judgement call it refuses to
 *  fake; a partially-filled facts file must therefore degrade to today's
 *  behaviour rather than (a) comparing null against a literal
 *  (`null == 'high'` → surprising falses) or (b) erasing a seeded default and
 *  turning a bare fact into an undefined-variable fail-closed skip. */
export function mergeGateContext(
  base: DefaultGateContext,
  extra: Record<string, unknown>,
): DefaultGateContext {
  const merged: DefaultGateContext = { ...base }
  for (const [k, v] of Object.entries(extra)) {
    if (v === null) continue
    if ((k === 'phase' || k === 'subtask') && v && typeof v === 'object' && !Array.isArray(v)) {
      const overrides = Object.fromEntries(
        Object.entries(v as Record<string, unknown>).filter(([, val]) => val !== null),
      )
      merged[k] = { ...(base[k] as Record<string, unknown>), ...overrides }
    } else {
      merged[k] = v
    }
  }
  return merged
}
