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

import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { compactLedger } from '../../src/checkpoint/compact.js'

describe('compactLedger — evict resolved sub-progress entries', () => {
  const makeEntry = (sub: string, status: SubProgressEntryType['status']): SubProgressEntryType => ({
    sub,
    status,
    gate_fired: true,
  })

  it('keeps only pending entries, evicts resolved', () => {
    const entries = [
      makeEntry('a', 'done'),
      makeEntry('b', 'pending'),
      makeEntry('c', 'skipped'),
      makeEntry('d', 'failed'),
      makeEntry('e', 'pending'),
      makeEntry('f', 'rejected'),
    ]
    const result = compactLedger(entries)
    expect(result.kept.map(e => e.sub)).toEqual(['b', 'e'])
    expect(result.evicted).toBe(4)
    expect(result.pct_saved).toBeGreaterThanOrEqual(50)
  })

  it('all pending → evicted=0, pct_saved=0', () => {
    const entries = [makeEntry('a', 'pending'), makeEntry('b', 'pending')]
    const result = compactLedger(entries)
    expect(result.kept).toHaveLength(2)
    expect(result.evicted).toBe(0)
    expect(result.pct_saved).toBe(0)
  })

  it('empty input → evicted=0, pct_saved=0', () => {
    const result = compactLedger([])
    expect(result.kept).toHaveLength(0)
    expect(result.evicted).toBe(0)
    expect(result.pct_saved).toBe(0)
  })

  it('all resolved → evicted=all, pct_saved=100', () => {
    const entries = [makeEntry('a', 'done'), makeEntry('b', 'skipped')]
    const result = compactLedger(entries)
    expect(result.kept).toHaveLength(0)
    expect(result.evicted).toBe(2)
    expect(result.pct_saved).toBe(100)
  })
})

import { vi, beforeEach } from 'vitest'

vi.mock('../../src/checkpoint/state.js', () => ({
  readCurrentWorkflow: vi.fn(),
  writeCurrentWorkflow: vi.fn().mockResolvedValue(undefined),
}))

import { readCurrentWorkflow, writeCurrentWorkflow } from '../../src/checkpoint/state.js'
import { compactWorkflow } from '../../src/checkpoint/compact.js'

describe('compactWorkflow — integration (mocked state)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no active workflow → evicted=0, phase=(none), no write', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue(null as any)
    const result = await compactWorkflow()
    expect(result.evicted).toBe(0)
    expect(result.phase).toBe('(none)')
    expect(writeCurrentWorkflow).not.toHaveBeenCalled()
  })

  it('4 resolved + 2 pending → evicted=4, writes back kept=2', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue({
      schemaVersion: 'currentWorkflow.v1',
      phase: 'test-phase',
      status: 'active',
      last_checkpoint_path: null,
      started_at: new Date().toISOString(),
      sub_progress: [
        { sub: 'a', status: 'done', gate_fired: true },
        { sub: 'b', status: 'pending', gate_fired: true },
        { sub: 'c', status: 'skipped', gate_fired: false, reason: 'skip' },
        { sub: 'd', status: 'failed', gate_fired: true },
        { sub: 'e', status: 'pending', gate_fired: true },
        { sub: 'f', status: 'rejected', gate_fired: true },
      ],
    } as any)
    const result = await compactWorkflow()
    expect(result.evicted).toBe(4)
    expect(result.pct_saved).toBe(67)
    expect(result.kept.map((e: any) => e.sub)).toEqual(['b', 'e'])
    expect(writeCurrentWorkflow).toHaveBeenCalledOnce()
  })

  it('all pending → evicted=0, does NOT write back', async () => {
    vi.mocked(readCurrentWorkflow).mockResolvedValue({
      schemaVersion: 'currentWorkflow.v1',
      phase: 'p',
      status: 'active',
      last_checkpoint_path: null,
      started_at: new Date().toISOString(),
      sub_progress: [{ sub: 'a', status: 'pending', gate_fired: true }],
    } as any)
    const result = await compactWorkflow()
    expect(result.evicted).toBe(0)
    expect(writeCurrentWorkflow).not.toHaveBeenCalled()
  })
})
