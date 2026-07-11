// v5.0 Spec 1 Phase 2 — unit tests for pure ledger functions (ADR-0033 D1).
// TDD: written RED against a stub (functions throw), then driven to GREEN.

import { describe, expect, it } from 'vitest'
import {
  findSerialBlockers,
  type GatesPlan,
  markSub,
  nextPending,
  seedLedger,
} from '../../src/checkpoint/ledger.js'
import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'

// ── seedLedger ────────────────────────────────────────────────────────────

describe('seedLedger', () => {
  it('maps each fire sub → pending entry with gate_fired:true', () => {
    const plan: GatesPlan = {
      master: 'task',
      fire: [{ sub: 'task-code' }, { sub: 'task-test', gate: 'tdd-gate' }],
      skip: [],
    }
    const led = seedLedger(plan)
    expect(led).toEqual([
      { sub: 'task-code', status: 'pending', gate_fired: true },
      { sub: 'task-test', status: 'pending', gate_fired: true },
    ])
  })

  it('maps each skip sub → skipped entry with gate_fired:false and reason', () => {
    const plan: GatesPlan = {
      master: 'task',
      fire: [],
      skip: [{ sub: 'task-clarify', reason: 'gate brainstorming-gate = false' }],
    }
    const led = seedLedger(plan)
    expect(led).toEqual([
      {
        sub: 'task-clarify',
        status: 'skipped',
        gate_fired: false,
        reason: 'gate brainstorming-gate = false',
      },
    ])
  })

  it('sorts fire entries by order; entries without order keep stable position', () => {
    const plan: GatesPlan = {
      master: 'task',
      fire: [
        { sub: 'task-deliver', order: 3 },
        { sub: 'task-code', order: 1 },
        { sub: 'task-test', order: 2 },
      ],
      skip: [],
    }
    const led = seedLedger(plan)
    expect(led.map((e) => e.sub)).toEqual(['task-code', 'task-test', 'task-deliver'])
  })

  it('keeps stable (input) order when no entry declares order', () => {
    const plan: GatesPlan = {
      master: 'task',
      fire: [{ sub: 'b' }, { sub: 'a' }, { sub: 'c' }],
      skip: [],
    }
    expect(seedLedger(plan).map((e) => e.sub)).toEqual(['b', 'a', 'c'])
  })

  it('emits fire entries (sorted) before skip entries', () => {
    const plan: GatesPlan = {
      master: 'task',
      fire: [
        { sub: 'task-code', order: 2 },
        { sub: 'task-clarify', order: 1 },
      ],
      skip: [{ sub: 'task-test', reason: 'gate = false' }],
    }
    const led = seedLedger(plan)
    expect(led.map((e) => e.sub)).toEqual(['task-clarify', 'task-code', 'task-test'])
    expect(led[2]?.status).toBe('skipped')
  })

  it('returns an empty ledger for an empty plan', () => {
    expect(seedLedger({ fire: [], skip: [] })).toEqual([])
  })
})

// ── seedLedger mode/order passthrough (4.26.0 A3 serial-order guard) ──────

describe('seedLedger mode/order passthrough (A3)', () => {
  it('persists mode + order from fire entries into the ledger', () => {
    const plan: GatesPlan = {
      master: 'verify',
      fire: [
        { sub: 'verify-progress', mode: 'serial', order: 1 },
        { sub: 'verify-code-review', mode: 'parallel' },
        { sub: 'verify-simplify', mode: 'serial', order: 99 },
      ],
      skip: [],
    }
    const led = seedLedger(plan)
    const bySub = new Map(led.map((e) => [e.sub, e]))
    expect(bySub.get('verify-progress')).toEqual({
      sub: 'verify-progress',
      status: 'pending',
      gate_fired: true,
      mode: 'serial',
      order: 1,
    })
    // NOTE: seedLedger sorts missing-order entries LAST (Infinity), so the
    // parallel entry lands after the serial tail in ARRAY position — which is
    // exactly why findSerialBlockers uses effective order, not position.
    expect(bySub.get('verify-code-review')).toEqual({
      sub: 'verify-code-review',
      status: 'pending',
      gate_fired: true,
      mode: 'parallel',
    })
    expect(bySub.get('verify-simplify')).toMatchObject({ mode: 'serial', order: 99 })
  })

  it('omits mode/order fields when the fire entry lacks them (byte-stable legacy shape)', () => {
    const led = seedLedger({ fire: [{ sub: 'task-code' }], skip: [] })
    expect(led[0]).toEqual({ sub: 'task-code', status: 'pending', gate_fired: true })
  })

  it('drops an unrecognized mode string instead of persisting it (schema is a 2-enum)', () => {
    const led = seedLedger({ fire: [{ sub: 'x', mode: 'weird' }], skip: [] })
    expect(led[0]).toEqual({ sub: 'x', status: 'pending', gate_fired: true })
  })
})

// ── findSerialBlockers (4.26.0 A3) ────────────────────────────────────────

describe('findSerialBlockers (A3 serial-order guard)', () => {
  // verify-master shape: serial(1) progress → parallel code-review/paranoid →
  // serial(99) simplify.
  const verifyLedger: SubProgressEntryType[] = [
    { sub: 'progress', status: 'pending', gate_fired: true, mode: 'serial', order: 1 },
    { sub: 'code-review', status: 'pending', gate_fired: true, mode: 'parallel' },
    { sub: 'paranoid', status: 'pending', gate_fired: true, mode: 'parallel' },
    { sub: 'simplify', status: 'pending', gate_fired: true, mode: 'serial', order: 99 },
  ]

  it('blocks a parallel sub while an earlier serial sub is pending', () => {
    expect(findSerialBlockers(verifyLedger, 'code-review')).toEqual(['progress'])
  })

  it('does NOT block parallel siblings on each other (any completion order)', () => {
    const led = markSub(verifyLedger, 'progress', 'done')
    expect(findSerialBlockers(led, 'paranoid')).toEqual([])
    expect(findSerialBlockers(led, 'code-review')).toEqual([])
  })

  it('blocks the serial tail while ANY known-mode predecessor is pending', () => {
    const led = markSub(verifyLedger, 'progress', 'done')
    expect(findSerialBlockers(led, 'simplify')).toEqual(['code-review', 'paranoid'])
  })

  it('unblocks the serial tail once all predecessors are resolved (done/failed/skipped)', () => {
    let led = markSub(verifyLedger, 'progress', 'done')
    led = markSub(led, 'code-review', 'done')
    led = markSub(led, 'paranoid', 'failed')
    expect(findSerialBlockers(led, 'simplify')).toEqual([])
  })

  it('returns [] for a sub not present in the ledger', () => {
    expect(findSerialBlockers(verifyLedger, 'nope')).toEqual([])
  })

  it('ignores predecessors without a mode field (pre-4.26.0 ledger, back-compat no-op)', () => {
    const legacy: SubProgressEntryType[] = [
      { sub: 'a', status: 'pending', gate_fired: true },
      { sub: 'b', status: 'pending', gate_fired: true },
    ]
    expect(findSerialBlockers(legacy, 'b')).toEqual([])
    // serial target: an unknown-mode predecessor still cannot be judged → no-op.
    const mixed: SubProgressEntryType[] = [
      { sub: 'a', status: 'pending', gate_fired: true },
      { sub: 'z', status: 'pending', gate_fired: true, mode: 'serial', order: 99 },
    ]
    expect(findSerialBlockers(mixed, 'z')).toEqual([])
  })
})

// ── markSub ───────────────────────────────────────────────────────────────

describe('markSub', () => {
  const base: SubProgressEntryType[] = [
    { sub: 'task-code', status: 'pending', gate_fired: true },
    { sub: 'task-test', status: 'pending', gate_fired: true },
  ]

  it('flips pending → done with evidence + evidence_status verified', () => {
    const out = markSub(base, 'task-code', 'done', {
      evidence: [{ path: 'progress.md', sha256: 'abc123' }],
      evidence_status: 'verified',
    })
    expect(out[0]).toEqual({
      sub: 'task-code',
      status: 'done',
      gate_fired: true,
      evidence: [{ path: 'progress.md', sha256: 'abc123' }],
      evidence_status: 'verified',
    })
    // untouched entry preserved.
    expect(out[1]).toEqual({ sub: 'task-test', status: 'pending', gate_fired: true })
  })

  it('flips pending → failed (no evidence opts)', () => {
    const out = markSub(base, 'task-test', 'failed')
    expect(out[1]).toEqual({ sub: 'task-test', status: 'failed', gate_fired: true, fail_count: 1 })
  })

  it('does NOT mutate the input array or its entries', () => {
    const snapshot = JSON.parse(JSON.stringify(base))
    const out = markSub(base, 'task-code', 'done', { evidence_status: 'verified' })
    // input array unchanged (deep equality vs pre-call snapshot).
    expect(base).toEqual(snapshot)
    // returned a new array reference + new entry object.
    expect(out).not.toBe(base)
    expect(out[0]).not.toBe(base[0])
    // the actual mutation target inside base stayed pending.
    expect(base[0]?.status).toBe('pending')
  })

  it('throws a descriptive Error for an unknown sub', () => {
    expect(() => markSub(base, 'task-nope', 'done')).toThrow(/task-nope/)
  })
})

// ── markSub fail_count + rejected (G6/G7-lite) ───────────────────────────

describe('markSub fail_count + rejected (G6/G7-lite)', () => {
  const base: SubProgressEntryType[] = [{ sub: 'a', status: 'pending', gate_fired: true }]

  it('sets fail_count=1 on first ->failed', () => {
    const next = markSub(base, 'a', 'failed')
    expect(next[0]).toMatchObject({ status: 'failed', fail_count: 1 })
  })

  it('increments fail_count on repeated ->failed', () => {
    let led = markSub(base, 'a', 'failed')
    led = markSub(led, 'a', 'failed')
    led = markSub(led, 'a', 'failed')
    expect(led[0]).toMatchObject({ status: 'failed', fail_count: 3 })
  })

  it('does NOT touch fail_count on ->done', () => {
    const failed = markSub(base, 'a', 'failed')
    const done = markSub(failed, 'a', 'done')
    expect(done[0]).toMatchObject({ status: 'done', fail_count: 1 })
  })

  it('accepts the rejected status', () => {
    const next = markSub(base, 'a', 'rejected')
    expect(next[0]?.status).toBe('rejected')
  })
})

// ── nextPending ───────────────────────────────────────────────────────────

describe('nextPending', () => {
  it('returns the first pending sub name', () => {
    const led: SubProgressEntryType[] = [
      { sub: 'task-code', status: 'done', gate_fired: true },
      { sub: 'task-test', status: 'pending', gate_fired: true },
      { sub: 'task-deliver', status: 'pending', gate_fired: true },
    ]
    expect(nextPending(led)).toBe('task-test')
  })

  it('skips skipped and done entries to find the first pending', () => {
    const led: SubProgressEntryType[] = [
      { sub: 'task-clarify', status: 'skipped', gate_fired: false, reason: 'r' },
      { sub: 'task-code', status: 'done', gate_fired: true },
      { sub: 'task-test', status: 'pending', gate_fired: true },
    ]
    expect(nextPending(led)).toBe('task-test')
  })

  it('returns null when nothing is pending', () => {
    const led: SubProgressEntryType[] = [
      { sub: 'task-code', status: 'done', gate_fired: true },
      { sub: 'task-clarify', status: 'skipped', gate_fired: false, reason: 'r' },
    ]
    expect(nextPending(led)).toBeNull()
  })

  it('returns null for an empty ledger', () => {
    expect(nextPending([])).toBeNull()
  })
})
