// Phase 1.5 T6.2 — Semantic Router L2 unit tests (≥8 cell, Pattern J + K).
//
// IMPL NOTE — covers ADR 0009 § Decision (D1.5-2 semantic L2 deferred v0.2+
// stub) + RESEARCH § 2.4 fallback-path design. v0.1 `match()` is a guaranteed
// no-match stub; these cells lock the interface contract so v0.2+ can swap the
// body in without an interface change. Cells exercise: stub no-match return /
// empty-prompt + arbitrary threshold invariance / SemanticMatchResult
// discriminated-union narrowing / Promise (async) contract / function
// signature drift / idempotency / createSemanticRouter v0.1 throw-loud seam +
// a Pattern K it.skip placeholder for the v0.2+ ML embedding kNN cell.

import { describe, expect, it } from 'vitest'
import {
  createSemanticRouter,
  DEFAULT_SEMANTIC_THRESHOLD,
  type SemanticMatchResult,
  semanticMatch,
} from '../../src/routing/index.js'

describe('semanticMatch — v0.1 stub (always no-match)', () => {
  it('1. match("test prompt") → { matched: false, rule: null, confidence: 0 }', async () => {
    const result = await semanticMatch('test prompt')
    expect(result).toEqual({ matched: false, rule: null, confidence: 0 })
  })

  it('2. empty prompt + threshold 0 → still no-match', async () => {
    const result = await semanticMatch('', 0)
    expect(result.matched).toBe(false)
    expect(result.rule).toBeNull()
    expect(result.confidence).toBe(0)
  })

  it('3. arbitrary threshold does not change v0.1 stub output', async () => {
    const low = await semanticMatch('anything', 0.1)
    const high = await semanticMatch('anything', 0.99)
    expect(low).toEqual(high)
    expect(low.matched).toBe(false)
  })

  it('4. DEFAULT_SEMANTIC_THRESHOLD is 0.85 (LangChain industry baseline)', () => {
    expect(DEFAULT_SEMANTIC_THRESHOLD).toBe(0.85)
  })

  it('5. SemanticMatchResult discriminated union narrows on `matched`', async () => {
    const result: SemanticMatchResult = await semanticMatch('narrow check')
    if (result.matched) {
      // v0.2+ branch — rule present, confidence ≥ threshold.
      expect(result.rule).not.toBeNull()
    } else {
      // v0.1 branch — always taken.
      expect(result.rule).toBeNull()
      expect(result.confidence).toBe(0)
    }
  })

  it('6. match() returns a Promise (async interface contract)', () => {
    const p = semanticMatch('promise check')
    expect(p).toBeInstanceOf(Promise)
    return expect(p).resolves.toMatchObject({ matched: false })
  })

  it('7. interface contract — match is a 1-or-2-arg function (drift detector)', () => {
    // Signature drift detector: `match(prompt, threshold?)` — arity 1 (the
    // optional threshold has a default so .length counts only required args).
    expect(typeof semanticMatch).toBe('function')
    expect(semanticMatch.length).toBe(1)
  })

  it('8. idempotent — repeated calls return equal results (no persistent state)', async () => {
    const a = await semanticMatch('same prompt')
    const b = await semanticMatch('same prompt')
    const c = await semanticMatch('same prompt')
    expect(a).toEqual(b)
    expect(b).toEqual(c)
  })

  it('9. createSemanticRouter throws loudly in v0.1 (deferred seam)', () => {
    // v0.1 — ML embedding deferred; accidental early use must be loud, not a
    // silent degrade. Provider arg is unused (cast for the type contract).
    expect(() => createSemanticRouter({} as never)).toThrow(/v0\.1 stub|deferred/i)
  })

  // Pattern K — v0.2+ env-gated future cell. Skipped until ML embedding lands.
  it.skip('10. v0.2+ ML embedding kNN cosine-similarity match (deferred)', async () => {
    // When v0.2+ activates: embed prompt via lib/embedding.ts (BGE-small),
    // kNN against pre-embedded rule triggers, return best rule ≥ threshold.
    const result = await semanticMatch('实现登录接口 + JWT token refresh', 0.85)
    expect(result.matched).toBe(true)
  })
})
