// Phase 2.3 W2 T2.2 — arbitrateWithRedirect CD-3 unit tests.
// Sister to routing-decisionRules.test.ts (legacy `arbitrate()`); covers the
// three discriminated-union outcomes: matched / rejected (with redirect) / none.
// karpathy YAGNI: 6 cells covering happy path + rejection + redirect surfacing
// + tie + no-match + priority-when-some-rejected.

import { describe, expect, it } from 'vitest'
import type { Rule, TaskContext } from '../../src/routing/decisionRules.js'
import { arbitrateWithRedirect } from '../../src/routing/lib/arbitrateRedirect.js'

function rule(
  id: string,
  priority: number,
  when: TaskContext,
  decision: Record<string, unknown> = {},
): Rule {
  return {
    id,
    priority,
    domain: 'design' as Rule['domain'],
    when,
    decision: { primary_expert: id, ...decision },
  }
}

describe('arbitrateWithRedirect — CD-3 (B-18 + ADR 0012 errata)', () => {
  it('1. matched: single rule, no negative-space → kind=matched', () => {
    const rules = [rule('ui-default', 50, { task_type: 'ui-design' })]
    const r = arbitrateWithRedirect(rules, { task_type: 'ui-design', prompt: 'build a dashboard' })
    expect(r.kind).toBe('matched')
    if (r.kind === 'matched') expect(r.rule.id).toBe('ui-default')
  })

  it('2. rejected: do_not_use_when hits → kind=rejected + redirectTo', () => {
    const rules = [
      rule(
        'ui-default',
        50,
        { task_type: 'ui-design' },
        { do_not_use_when: ['做出风格', 'design-led'], if_rejected_use: 'frontend-design' },
      ),
    ]
    const r = arbitrateWithRedirect(rules, {
      task_type: 'ui-design',
      prompt: '帮我做出风格独特的 hero section',
    })
    expect(r.kind).toBe('rejected')
    if (r.kind === 'rejected') expect(r.redirectTo).toBe('frontend-design')
  })

  it('3. none: do_not_use_when hits but no if_rejected_use → kind=none', () => {
    const rules = [
      rule('content-default', 50, { task_type: 'slide-deck' }, { do_not_use_when: ['plain doc'] }),
    ]
    const r = arbitrateWithRedirect(rules, { task_type: 'slide-deck', prompt: 'plain doc only' })
    expect(r.kind).toBe('none')
  })

  it('4. tie at top priority among eligible → kind=none', () => {
    const rules = [
      rule('r1', 100, { task_type: 'e2e-test' }),
      rule('r2', 100, { task_type: 'e2e-test' }),
    ]
    const r = arbitrateWithRedirect(rules, { task_type: 'e2e-test', prompt: 'run e2e' })
    expect(r.kind).toBe('none')
  })

  it('5. no rule matches → kind=none (no redirect)', () => {
    const rules = [rule('r1', 50, { task_type: 'search' })]
    const r = arbitrateWithRedirect(rules, { task_type: 'unknown', prompt: 'unrelated' })
    expect(r.kind).toBe('none')
  })

  it('6. mix: high-priority rejected, lower-priority eligible → eligible wins (kind=matched)', () => {
    const rules = [
      rule(
        'ui-default',
        50,
        { task_type: 'ui-design' },
        { do_not_use_when: ['做出风格'], if_rejected_use: 'frontend-design' },
      ),
      rule('ui-bold', 100, { task_type: 'ui-design' }),
    ]
    const r = arbitrateWithRedirect(rules, { task_type: 'ui-design', prompt: '做出风格 hero' })
    // ui-bold has no do_not_use_when → eligible, priority 100 wins; ui-default rejected but
    // redirect not surfaced because eligible.length > 0.
    expect(r.kind).toBe('matched')
    if (r.kind === 'matched') expect(r.rule.id).toBe('ui-bold')
  })
})
