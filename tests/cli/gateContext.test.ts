// v4.1.2 — unit tests for the shared default gate context + deep-merge.

import { describe, expect, it } from 'vitest'
import { buildDefaultGateContext, mergeGateContext } from '../../src/cli/lib/gateContext.js'
import { evalGate } from '../../src/workflow/exprBuilder.js'

describe('buildDefaultGateContext', () => {
  it('seeds phase.stage + provides phase/subtask + team-routing facts', () => {
    const ctx = buildDefaultGateContext('do X', 'verify')
    expect(ctx.task).toBe('do X')
    expect((ctx.phase as { stage: string }).stage).toBe('verify')
    expect(ctx.user_understanding_unclear).toBe(false)
    // v4.1.2 — parallelism team facts present (were missing → gate threw)
    expect(ctx.teammate_send_message_needed).toBe(false)
    expect(ctx.fullstack_three_way).toBe(false)
    // a representative phase + subtask default (safety-net side, still on)
    expect((ctx.phase as Record<string, unknown>).has_cross_phase_data_flow).toBe(true)
    expect((ctx.subtask as Record<string, unknown>).is_core_business_logic).toBe(true)
  })

  it('T2.1 OQ2(c) — the four over-eager defaults are off the fire side', () => {
    // Audit S2: buildDefaultGateContext pinned every judgement-call fact to the
    // "will fire" side, and NO workflow ever passed --context — so the criteria
    // had zero discriminating power (equivalent to "always fire"). OQ2 resolved
    // to (c): withdraw exactly these four now, keep the rest of the safety net
    // until `harnessed facts` coverage data says otherwise.
    //   - phase.is_critical_module      → stage-routing.verify-paranoid-critical
    //   - phase.is_complex_architecture → stage-routing.plan-architecture-delegate
    //   - subtask.core_algorithm        → subtask-gate.brainstorming
    //   - subtask.error_cost            → subtask-gate.brainstorming
    // They are still PRESENT (option (b) "leave undefined and lean on
    // fail-closed" was rejected — a missing bare fact silently deletes a
    // governance gate); only their value moved to the non-firing side.
    const ctx = buildDefaultGateContext('do X', 'verify')
    const phase = ctx.phase as Record<string, unknown>
    const subtask = ctx.subtask as Record<string, unknown>
    expect(phase.is_critical_module).toBe(false)
    expect(phase.is_complex_architecture).toBe(false)
    expect(subtask.core_algorithm).toBe(false)
    expect(subtask.error_cost).toBe('low')
    for (const k of ['is_critical_module', 'is_complex_architecture']) {
      expect(k in phase, `${k} must stay declared`).toBe(true)
    }
    for (const k of ['core_algorithm', 'error_cost']) {
      expect(k in subtask, `${k} must stay declared`).toBe(true)
    }
  })

  it('4.23.2 (issue #5) — root-flat is_critical_release present, default false (opt-in)', () => {
    // stage-routing.yaml verify-multispec-critical-release references the BARE
    // identifier (phaseFactContext.ts root-flat schema contract). Missing since
    // the v4.1.2 extraction → eval threw → ADR 0029 fail-soft fired the
    // 4-specialist multispec team on every ordinary verify.
    const ctx = buildDefaultGateContext('do X', 'verify')
    expect(ctx.is_critical_release).toBe(false)
  })

  it('T2.3 — subtask.needs_browser_automation present, default false (opt-in)', () => {
    // workflows/judgments/web-testing-routing.yaml browse-probe references
    // subtask.needs_browser_automation (sister capabilities.yaml `browse`
    // fires_when). Default FALSE: it is an OR-arm of the browser-probe route, and
    // a true default would spawn a browser lane on every eval — the same
    // "most expensive sub became the default path" defect class as 4.23.2.
    // Sister facts needs_web_search / needs_lib_docs / needs_google_workspace
    // keep the same opt-in shape.
    const ctx = buildDefaultGateContext('do X', 'verify')
    const subtask = ctx.subtask as Record<string, unknown>
    expect('needs_browser_automation' in subtask).toBe(true)
    expect(subtask.needs_browser_automation).toBe(false)
  })

  it('T2.1 gap-close — has_ai_phase / requires_coverage_audit declared, default false', () => {
    // stage-routing.yaml verify-eval-review-aiphase (:83) and
    // verify-validate-phase-coverage (:89) read these two, but neither was
    // declared in PhaseShape (additionalProperties:false) nor seeded here — an
    // absent OBJECT MEMBER evaluates to a silent false (only bare identifiers
    // throw), so both verify subs were unreachable on the default path with no
    // signal anywhere. Declared now; the value stays on the NON-firing side
    // because both subs are expensive audits that should be requested, not
    // defaulted — `harnessed facts verify` lists them as nulls for the model.
    const phase = buildDefaultGateContext('do X', 'verify').phase as Record<string, unknown>
    expect('has_ai_phase' in phase).toBe(true)
    expect('requires_coverage_audit' in phase).toBe(true)
    expect(phase.has_ai_phase).toBe(false)
    expect(phase.requires_coverage_audit).toBe(false)
  })

  it('T2.1 gap-close — the two verify sub gates are reachable once the facts are filled', () => {
    const base = buildDefaultGateContext('do X', 'verify')
    const evalExpr = evalGate
    const aiPhase = "phase.stage == 'verify' and phase.has_ai_phase == true"
    const coverage = "phase.stage == 'verify' and phase.requires_coverage_audit == true"
    expect(evalExpr(aiPhase, base as unknown as Record<string, unknown>)).toBe(false)
    expect(evalExpr(coverage, base as unknown as Record<string, unknown>)).toBe(false)
    const filled = mergeGateContext(base, {
      phase: { has_ai_phase: true, requires_coverage_audit: true },
    }) as unknown as Record<string, unknown>
    expect(evalExpr(aiPhase, filled)).toBe(true)
    expect(evalExpr(coverage, filled)).toBe(true)
  })

  it('T2.3 — web-search default route is live (needs_web_search + keyword search_type)', () => {
    // Wiring workflows/research/workflow.yaml phases to the 5 web-search-routing
    // triggers turns the previously-unconditional fan-out step into 5 gated route
    // lanes. Without a live default the whole workflow would degrade to zero
    // sources; web-search-routing.yaml itself declares Tavily/keyword the default
    // route, and 'general' was not even a member of the SearchType union in
    // src/workflow/schema/phaseFactContext.ts (schema drift).
    const subtask = buildDefaultGateContext('do X', 'discuss').subtask as Record<string, unknown>
    expect(subtask.needs_web_search).toBe(true)
    expect(subtask.search_type).toBe('keyword')
    // Non-default lanes stay opt-in.
    expect(subtask.needs_lib_docs).toBe(false)
  })
})

describe('mergeGateContext — deep merge', () => {
  it('partial phase override preserves the other phase.* defaults', () => {
    const base = buildDefaultGateContext('t', 'plan')
    const merged = mergeGateContext(base, { phase: { is_major_release: true } })
    const phase = merged.phase as Record<string, unknown>
    expect(phase.is_major_release).toBe(true) // overridden
    expect(phase.stage).toBe('plan') // preserved
    expect(phase.has_cross_phase_data_flow).toBe(true) // preserved (shallow assign would wipe)
    expect(Object.keys(phase).length).toBe(Object.keys(base.phase).length)
  })

  it('partial subtask override preserves the other subtask.* defaults', () => {
    const base = buildDefaultGateContext('t', 'task')
    const merged = mergeGateContext(base, { subtask: { approaches: 1 } })
    const subtask = merged.subtask as Record<string, unknown>
    expect(subtask.approaches).toBe(1)
    expect(subtask.is_core_business_logic).toBe(true) // preserved
  })

  it('top-level scalar override replaces directly', () => {
    const base = buildDefaultGateContext('t', 'task')
    const merged = mergeGateContext(base, { user_understanding_unclear: true })
    expect(merged.user_understanding_unclear).toBe(true)
  })

  it('T2.1 D-4 — a null fact means NOT PROVIDED: the default survives', () => {
    // `harnessed facts` emits null for every judgement call it will not fake.
    // If the model hands the file back with some nulls unfilled, those must fall
    // back to the defaults — writing null INTO the context would make
    // `subtask.error_cost == 'high'` compare against null and, worse, silently
    // erase a seeded default.
    const base = buildDefaultGateContext('t', 'task')
    const merged = mergeGateContext(base, {
      subtask: { approaches: null, is_algorithm: true },
      user_understanding_unclear: null,
    })
    const subtask = merged.subtask as Record<string, unknown>
    expect(subtask.approaches).toBe((base.subtask as Record<string, unknown>).approaches)
    expect(subtask.is_algorithm).toBe(true)
    expect(merged.user_understanding_unclear).toBe(false)
  })
})
