// Phase 3.1 W4 T4.5 — compact.test.ts: 4 fixtures (shouldCompact threshold).
// Sister: tests/checkpoint/state.test.ts vi.mock pattern (no fs needed — pure fn).

import { mkdtempSync, rmSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { detectLoop } from '../../src/checkpoint/breakLoop.js'
import {
  compactLedger,
  compactWorkflow,
  DEFAULT_CONTEXT_WINDOW,
  DEFAULT_THRESHOLD_PCT,
  shouldAutoCompact,
  shouldCompact,
} from '../../src/checkpoint/compact.js'
import {
  CurrentWorkflowV1,
  type SubProgressEntryType,
} from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { readCurrentWorkflow, writeCurrentWorkflow } from '../../src/checkpoint/state.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

// Phase 14 test helpers
const entry = (
  sub: string,
  status: SubProgressEntryType['status'],
  fail_count?: number,
): SubProgressEntryType => ({
  sub,
  status,
  gate_fired: true,
  ...(fail_count != null ? { fail_count } : {}),
})

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

// ── Phase 14: compactLedger (pure — summarize+evict resolved, preserve G6) ──

describe('compactLedger', () => {
  it('evicts ONLY done/skipped/rejected with fail_count==0', () => {
    const r = compactLedger([
      entry('a-done', 'done'),
      entry('b-skipped', 'skipped'),
      entry('c-rejected', 'rejected'),
      entry('d-pending', 'pending'),
      entry('e-failed', 'failed'),
    ])
    expect(r.kept.map((e) => e.sub).sort()).toEqual(['d-pending', 'e-failed'])
    expect(r.evicted).toBe(3)
    expect(r.by_status).toEqual({ done: 1, skipped: 1, rejected: 1 })
  })

  it('G6 (F1 regression): a done entry with fail_count>0 is NOT evicted; breakLoop still fires', () => {
    const led = [entry('loopy', 'done', 3), entry('clean', 'done', 0)]
    const r = compactLedger(led)
    // clean evicted, loopy preserved
    expect(r.kept.map((e) => e.sub)).toEqual(['loopy'])
    expect(r.evicted).toBe(1)
    // breakLoop must still detect the loop from the KEPT ledger
    expect(detectLoop(r.kept).map((l) => l.sub)).toContain('loopy')
  })

  it('preserves every pending and every failed entry', () => {
    const r = compactLedger([
      entry('p1', 'pending'),
      entry('f1', 'failed'),
      entry('f2', 'failed', 1),
    ])
    expect(r.evicted).toBe(0)
    expect(r.kept).toHaveLength(3)
  })

  it('reports a real token reduction (Buffer/4), not entry-count, with before>after', () => {
    const r = compactLedger([entry('a', 'done'), entry('b', 'done'), entry('c', 'pending')])
    expect(r.before_tokens).toBeGreaterThan(r.after_tokens)
    expect(r.pct_saved).toBeGreaterThan(0)
    expect(r.pct_saved).toBeLessThanOrEqual(100)
    expect(r.digest).toMatch(/2/) // 2 evicted reflected in the digest line
  })

  it('empty ledger → no-op result, no throw', () => {
    const r = compactLedger([])
    expect(r).toMatchObject({ evicted: 0, pct_saved: 0 })
    expect(r.kept).toEqual([])
  })
})

// ── Phase 14: shouldAutoCompact (auto-trigger gating) ──

describe('shouldAutoCompact', () => {
  it('true only when tokens given AND shouldCompact fires', () => {
    expect(shouldAutoCompact(180_000)).toBe(true) // 90% of 200k
  })
  it('false when tokens given but under threshold', () => {
    expect(shouldAutoCompact(100_000)).toBe(false) // 50%
  })
  it('false (silent no-op) when tokens undefined', () => {
    expect(shouldAutoCompact(undefined)).toBe(false)
  })
})

// ── Phase 14: compactWorkflow (impure — real fs round-trip) ──

describe('compactWorkflow', () => {
  let tmp: string
  let original: string | undefined
  beforeEach(async () => {
    tmp = mkdtempSync(join(tmpdir(), 'compact-wf-'))
    original = process.env.HARNESSED_ROOT_OVERRIDE
    process.env.HARNESSED_ROOT_OVERRIDE = join(tmp, '.claude', 'harnessed')
    await mkdir(join(tmp, '.claude', 'harnessed'), { recursive: true })
  })
  afterEach(() => {
    if (original === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
    else process.env.HARNESSED_ROOT_OVERRIDE = original
    rmSync(tmp, { recursive: true, force: true })
  })

  const seed = (subs: SubProgressEntryType[]) =>
    writeCurrentWorkflow({
      schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
      phase: 'task',
      status: 'active',
      last_checkpoint_path: null,
      started_at: '2026-06-13T00:00:00.000Z',
      sub_progress: subs,
    })

  it('evicts resolved, writes back kept, accumulates compacted_summary', async () => {
    await seed([entry('a', 'done'), entry('b', 'skipped'), entry('c', 'pending')])
    const r = await compactWorkflow()
    expect(r.evicted).toBe(2)
    expect(r.phase).toBe('task')
    const wf = await readCurrentWorkflow()
    expect(wf?.sub_progress?.map((e) => e.sub)).toEqual(['c'])
    expect(wf?.compacted_summary?.evicted).toBe(2)
    expect(wf?.compacted_summary?.by_status).toMatchObject({ done: 1, skipped: 1 })
    expect(typeof wf?.compacted_summary?.last_at).toBe('string')
  })

  it('second call accumulates compacted_summary.evicted monotonically', async () => {
    await seed([entry('a', 'done'), entry('c', 'pending')])
    await compactWorkflow()
    // mark c done then compact again
    const wf1 = await readCurrentWorkflow()
    await writeCurrentWorkflow({
      ...(wf1 as NonNullable<typeof wf1>),
      sub_progress: [entry('c', 'done')],
    })
    await compactWorkflow()
    const wf2 = await readCurrentWorkflow()
    expect(wf2?.compacted_summary?.evicted).toBe(2) // 1 + 1
  })

  it('no-op when nothing evictable (all pending/failed)', async () => {
    await seed([entry('a', 'pending'), entry('b', 'failed', 1)])
    const r = await compactWorkflow()
    expect(r.evicted).toBe(0)
    const wf = await readCurrentWorkflow()
    expect(wf?.sub_progress).toHaveLength(2)
    expect(wf?.compacted_summary).toBeUndefined()
  })

  it('no active workflow → no-throw zero result', async () => {
    const r = await compactWorkflow()
    expect(r.evicted).toBe(0)
  })
})

// ── Phase 14: schema additive compacted_summary (no schemaVersion bump) ──

describe('compacted_summary schema (additive-optional)', () => {
  const base = {
    schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
    phase: 'task',
    status: 'active' as const,
    last_checkpoint_path: null,
    started_at: '2026-06-13T00:00:00.000Z',
  }
  it('old file WITHOUT compacted_summary still Value.Check-passes (back-compat)', () => {
    expect(Value.Check(CurrentWorkflowV1, base)).toBe(true)
  })
  it('new file WITH compacted_summary Value.Check-passes', () => {
    expect(
      Value.Check(CurrentWorkflowV1, {
        ...base,
        compacted_summary: { evicted: 2, by_status: { done: 1, skipped: 1 }, last_at: 'x' },
      }),
    ).toBe(true)
  })
})
