// tests/audit/hook.test.ts — Phase 4.3 W1 T1.5 (R8.1 audit hook integration unit test).
// 3 fixture cells: compose smoke + routeLayer derive branch + outcome enum pass-through.
// hook.ts T1.3 refactored signature: positional (outcome, sessionId?) with routeLayer derived
// from `matched` inside hook + iterCount=null hardcoded Phase 4.3 YAGNI.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const appendedLines: string[] = []
const mkdirSyncCalls: string[] = []

vi.mock('node:fs', () => ({
  appendFileSync: (_p: string, data: string) => void appendedLines.push(data),
  mkdirSync: (_p: string, _opts?: unknown) => void mkdirSyncCalls.push(String(_p)),
}))

import { type AuditOutcome, emitAudit } from '../../src/audit/hook.js'
import type { ArbitrateResult, TaskContext } from '../../src/routing/agentDefinition.js'
import type { Rule } from '../../src/routing/decisionRules.js'

const makeFixture = (
  matched: Rule | null = {
    id: 'test-rule',
    domain: 'engineering',
    decision: {},
  } as unknown as Rule,
) => ({
  task: { task: 'test task', task_type: 'engineering', phaseId: 'phase-4.3' } as TaskContext,
  decision: {
    matched_rule_id: 'test-rule',
    primary_expert: 'expert-a',
    secondary_expert: null,
    category: 'engineering',
  } as ArbitrateResult,
  matched,
})

beforeEach(() => {
  appendedLines.length = 0
  mkdirSyncCalls.length = 0
})
afterEach(() => vi.clearAllMocks())

describe('audit/hook — engine integration wrapper (Phase 4.3 W1 T1.5)', () => {
  it('1. emitAudit composes buildAuditRecord + emitAuditRecord (smoke)', () => {
    const f = makeFixture()
    emitAudit(f.task, f.decision, f.matched, 'complete', 'sess-1')
    expect(appendedLines).toHaveLength(1)
    const parsed = JSON.parse((appendedLines[0] ?? '').trim())
    expect(parsed.outcome).toBe('complete')
    expect(parsed.route_layer).toBe('L1-keyword')
    expect(parsed.session_id).toBe('sess-1')
    expect(parsed.iter_count).toBeNull()
  })

  it('2. routeLayer "L1-keyword" when matched non-null vs "L3-fallback" when matched null (branch derivation)', () => {
    const fMatched = makeFixture()
    const fNull = makeFixture(null)
    emitAudit(fMatched.task, fMatched.decision, fMatched.matched, 'complete')
    emitAudit(fNull.task, fNull.decision, fNull.matched, 'complete')
    const rec0 = JSON.parse((appendedLines[0] ?? '').trim())
    const rec1 = JSON.parse((appendedLines[1] ?? '').trim())
    expect(rec0.route_layer).toBe('L1-keyword')
    expect(rec1.route_layer).toBe('L3-fallback')
    expect(rec1.matched_rule_id).toBeNull()
  })

  it('3. outcome enum 6-value discriminated union pass-through', () => {
    const f = makeFixture()
    const outcomes: AuditOutcome[] = [
      'complete',
      'max-iter',
      'verbatim-fail',
      'spawn-err',
      'install-err',
      'arbitrate-err',
    ]
    for (const outcome of outcomes) {
      emitAudit(f.task, f.decision, f.matched, outcome)
    }
    expect(appendedLines).toHaveLength(6)
    const parsed = appendedLines.map((l) => JSON.parse(l.trim()).outcome)
    expect(parsed).toEqual(outcomes)
  })
})
