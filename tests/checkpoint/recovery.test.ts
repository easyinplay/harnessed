import { describe, expect, it } from 'vitest'
import { recoveryActions } from '../../src/checkpoint/recovery.js'
import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'

describe('recoveryActions', () => {
  it('emits run instruction for a pending sub', () => {
    const led: SubProgressEntryType[] = [{ sub: 'a', status: 'pending', gate_fired: true }]
    expect(recoveryActions(led)).toEqual(['run sub a'])
  })
  it('emits investigate instruction with fail count for a failed sub', () => {
    const led: SubProgressEntryType[] = [
      { sub: 'a', status: 'failed', gate_fired: true, fail_count: 2 },
    ]
    expect(recoveryActions(led)).toEqual(['sub a failed 2x — investigate before retry'])
  })
  it('emits the all-resolved sentinel when nothing is pending/failed', () => {
    const led: SubProgressEntryType[] = [{ sub: 'a', status: 'done', gate_fired: true }]
    expect(recoveryActions(led)).toEqual(['all subs resolved — run: harnessed next'])
  })
  it('returns the sentinel for an empty ledger', () => {
    expect(recoveryActions([])).toEqual(['all subs resolved — run: harnessed next'])
  })
})
