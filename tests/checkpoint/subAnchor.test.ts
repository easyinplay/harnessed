import { describe, expect, it } from 'vitest'
import { findSerialBlockers } from '../../src/checkpoint/ledger.js'
import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { PARALLEL_MID_ANCHOR } from '../../src/checkpoint/subAnchor.js'

// architecture review #11 — the mid anchor was copy-pasted into masterOrchestrator,
// ledger, and eval/record (each with a "mirror of …" comment). Now hoisted to one
// dep-free leaf. This pins the shared value and the behavior it drives.
describe('subAnchor.PARALLEL_MID_ANCHOR (#11 single source)', () => {
  it('is the 50 mid anchor all three consumers now import', () => {
    expect(PARALLEL_MID_ANCHOR).toBe(50)
  })

  it('ledger.findSerialBlockers uses it as the effective order for unordered subs', () => {
    // A serial-trailing target (order 60) waits for an unordered (parallel) sub,
    // which lands at the anchor (50) < 60 → counts as a preceding blocker.
    const entries: SubProgressEntryType[] = [
      { sub: 'para', status: 'pending', gate_fired: true, mode: 'parallel' },
      { sub: 'tail', status: 'pending', gate_fired: true, mode: 'serial', order: 60 },
    ]
    expect(findSerialBlockers(entries, 'tail')).toContain('para')
  })
})
