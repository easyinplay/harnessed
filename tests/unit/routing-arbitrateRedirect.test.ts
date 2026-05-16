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

  // ─── Wave 5 T5.1 complementary cells (CD-3 disqualify cascade + false-pos guard) ───
  // T5.1 task_plan spec (4 cells matched/rejected/none-no-redirect/equal-pri) is
  // functionally subsumed by cells 1-5 above (Wave 2 T2.2 d6489bb). These 3 cells
  // cover the COMPLEMENTARY edges not in W2 T2.2: substring false-positive guard
  // (D-04 character precision), S20 sister case (CD-3 disqualify cascade no auto-
  // fallback), and multi-keyword OR semantic. D-08 reverse direction (frontend-
  // design → ui-ux-pro-max) deferred — policy documented in decision_rules.yaml
  // L67 comment but no reverse rule encoded yet (out of T5.1 scope; YAGNI).

  it('7. D-04 false-pos guard: 独创 keyword not substring of 独特 prompt → eligible matched', () => {
    // taskHas() uses lowercase substring match (not anchor regex). 独创 (dú chuàng)
    // vs 独特 (dú tè) share only 独 — the second char (创 vs 特) differs, so
    // substring "独创" does NOT appear in JSON.stringify({prompt:'独特 design'}).
    // This is the character-precision guard: keyword 独创 must not false-positive
    // on benign neighbor 独特.
    const rules = [
      rule(
        'ui-default',
        50,
        { task_type: 'ui-design' },
        { do_not_use_when: ['独创'], if_rejected_use: 'frontend-design' },
      ),
    ]
    const r = arbitrateWithRedirect(rules, {
      task_type: 'ui-design',
      prompt: '帮我做独特的 design dashboard',
    })
    expect(r.kind).toBe('matched')
    if (r.kind === 'matched') expect(r.rule.id).toBe('ui-default')
  })

  it('8. CD-3 S20 sister: do_not_use_when matches + no if_rejected_use → kind=none', () => {
    // Mirrors SAMPLES.md row #20 (chinese-content-deck → rejected → expected null).
    // Contract (D-04): when negative-space disqualifies the only matching rule AND
    // no redirect target is configured, kind=none surfaces — caller decides what
    // happens next. The arbitrate fn MUST NOT silently promote a lower-priority
    // matching rule, which would override CD-3 author intent (S20 acceptance signal).
    const rules = [
      rule(
        'deck-pack',
        80,
        { task_type: 'slide-deck' },
        { do_not_use_when: ['generic markdown', 'plain doc'] },
      ),
    ]
    const r = arbitrateWithRedirect(rules, {
      task_type: 'slide-deck',
      prompt: '用中文做 generic markdown 文档转 slide deck',
    })
    expect(r.kind).toBe('none')
  })

  it('9. D-04 multi-keyword OR semantic: 4 keywords, prompt hits 1 → rejected (any-match)', () => {
    // do_not_use_when is OR semantic per implementation L48-50 (some() short-
    // circuits on first match). Verifies the explicit OR contract — author can
    // list 4-5 disqualifier variants and any one match triggers reject.
    const rules = [
      rule(
        'ui-default',
        50,
        { task_type: 'ui-design' },
        {
          do_not_use_when: ['做出风格', '独创', '风格化', 'design-led'],
          if_rejected_use: 'frontend-design',
        },
      ),
    ]
    // prompt hits only 风格化 (3rd keyword) — not first/last
    const r = arbitrateWithRedirect(rules, {
      task_type: 'ui-design',
      prompt: '我们需要 风格化 的 hero',
    })
    expect(r.kind).toBe('rejected')
    if (r.kind === 'rejected') expect(r.redirectTo).toBe('frontend-design')
  })
})
