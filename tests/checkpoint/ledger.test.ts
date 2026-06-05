// v5.0 Spec 1 Phase 2 — unit tests for pure ledger functions (ADR-0033 D1).
// TDD: written RED against a stub (functions throw), then driven to GREEN.

import { describe, expect, it } from 'vitest'
import { type GatesPlan, markSub, nextPending, seedLedger } from '../../src/checkpoint/ledger.js'
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
    expect(out[1]).toEqual({ sub: 'task-test', status: 'failed', gate_fired: true })
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
