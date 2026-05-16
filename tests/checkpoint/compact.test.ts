// Phase 3.1 W4 T4.5 — compact.test.ts: 4 fixtures (shouldCompact threshold).
// Sister: tests/checkpoint/state.test.ts vi.mock pattern (no fs needed — pure fn).

import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONTEXT_WINDOW,
  DEFAULT_THRESHOLD_PCT,
  shouldCompact,
} from '../../src/checkpoint/compact.js'

describe('compact — shouldCompact threshold (T4.5 fixtures 14-17, RESEARCH § 7 75%)', () => {
  it('14. under threshold (50% of 200k = 100k) → returns false', () => {
    expect(shouldCompact(100_000)).toBe(false)
  })

  it('15. at threshold (75% of 200k = 150k) → returns true', () => {
    expect(shouldCompact(150_000)).toBe(true)
  })

  it('16. over threshold (90% of 200k = 180k) → returns true', () => {
    expect(shouldCompact(180_000)).toBe(true)
  })

  it('17. custom override thresholdPct=50 + contextWindow=100k → at 50k returns true', () => {
    expect(shouldCompact(50_000, { contextWindow: 100_000, thresholdPct: 50 })).toBe(true)
    expect(shouldCompact(49_999, { contextWindow: 100_000, thresholdPct: 50 })).toBe(false)
  })

  it('18. zero/negative contextWindow → returns false (no division by zero)', () => {
    expect(shouldCompact(1, { contextWindow: 0 })).toBe(false)
    expect(shouldCompact(1, { contextWindow: -1 })).toBe(false)
  })

  it('sanity — DEFAULT exports match RESEARCH § 7 推 75% + sonnet/opus 200k', () => {
    expect(DEFAULT_THRESHOLD_PCT).toBe(75)
    expect(DEFAULT_CONTEXT_WINDOW).toBe(200_000)
  })
})
