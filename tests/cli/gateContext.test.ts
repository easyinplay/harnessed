// v4.1.2 — unit tests for the shared default gate context + deep-merge.

import { describe, expect, it } from 'vitest'
import { buildDefaultGateContext, mergeGateContext } from '../../src/cli/lib/gateContext.js'

describe('buildDefaultGateContext', () => {
  it('seeds phase.stage + provides phase/subtask + team-routing facts', () => {
    const ctx = buildDefaultGateContext('do X', 'verify')
    expect(ctx.task).toBe('do X')
    expect((ctx.phase as { stage: string }).stage).toBe('verify')
    expect(ctx.user_understanding_unclear).toBe(false)
    // v4.1.2 — parallelism team facts present (were missing → gate threw)
    expect(ctx.teammate_send_message_needed).toBe(false)
    expect(ctx.fullstack_three_way).toBe(false)
    // a representative phase + subtask default
    expect((ctx.phase as Record<string, unknown>).is_critical_module).toBe(true)
    expect((ctx.subtask as Record<string, unknown>).core_algorithm).toBe(true)
  })

  it('4.23.2 (issue #5) — root-flat is_critical_release present, default false (opt-in)', () => {
    // stage-routing.yaml verify-multispec-critical-release references the BARE
    // identifier (phaseFactContext.ts root-flat schema contract). Missing since
    // the v4.1.2 extraction → eval threw → ADR 0029 fail-soft fired the
    // 4-specialist multispec team on every ordinary verify.
    const ctx = buildDefaultGateContext('do X', 'verify')
    expect(ctx.is_critical_release).toBe(false)
  })
})

describe('mergeGateContext — deep merge', () => {
  it('partial phase override preserves the other phase.* defaults', () => {
    const base = buildDefaultGateContext('t', 'plan')
    const merged = mergeGateContext(base, { phase: { is_major_release: true } })
    const phase = merged.phase as Record<string, unknown>
    expect(phase.is_major_release).toBe(true) // overridden
    expect(phase.stage).toBe('plan') // preserved
    expect(phase.is_critical_module).toBe(true) // preserved (shallow assign would wipe)
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
})
