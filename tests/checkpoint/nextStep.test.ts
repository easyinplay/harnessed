import { describe, expect, it } from 'vitest'
import { resolveNext } from '../../src/checkpoint/nextStep.js'
import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'

const pending: SubProgressEntryType[] = [
  { sub: 'a', status: 'done', gate_fired: true },
  { sub: 'b', status: 'pending', gate_fired: true },
]
const allDone: SubProgressEntryType[] = [{ sub: 'a', status: 'done', gate_fired: true }]

describe('resolveNext', () => {
  it('auto + next sub when pending exists and autoTransition true', () => {
    expect(resolveNext(pending, true)).toEqual({ next: 'auto', sub: 'b' })
  })
  it('manual + hint when pending exists and autoTransition false', () => {
    const r = resolveNext(pending, false)
    expect(r.next).toBe('manual')
    expect(r.sub).toBe('b')
    expect(r.hint).toContain('b')
  })
  it('done when no pending remain', () => {
    expect(resolveNext(allDone, true)).toEqual({ next: 'done' })
  })
})
