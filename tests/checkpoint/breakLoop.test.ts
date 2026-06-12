import { describe, expect, it } from 'vitest'
import { detectLoop } from '../../src/checkpoint/breakLoop.js'
import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'

describe('detectLoop', () => {
  it('empty when no sub has fail_count >= 3', () => {
    const led: SubProgressEntryType[] = [
      { sub: 'a', status: 'failed', gate_fired: true, fail_count: 2 },
    ]
    expect(detectLoop(led)).toEqual([])
  })
  it('flags subs with fail_count >= 3', () => {
    const led: SubProgressEntryType[] = [
      { sub: 'a', status: 'failed', gate_fired: true, fail_count: 3 },
      { sub: 'b', status: 'pending', gate_fired: true },
      { sub: 'c', status: 'failed', gate_fired: true, fail_count: 5 },
    ]
    expect(detectLoop(led)).toEqual([
      { sub: 'a', count: 3 },
      { sub: 'c', count: 5 },
    ])
  })
})
