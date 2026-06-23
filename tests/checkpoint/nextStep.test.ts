import { describe, expect, it } from 'vitest'
import { resolveAutoTransition, resolveNext } from '../../src/checkpoint/nextStep.js'
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

describe('resolveAutoTransition (migrated from cli/next.ts)', () => {
  it('env unset → falls to envelope value, default true', () => {
    expect(resolveAutoTransition(undefined, undefined)).toBe(true)
    expect(resolveAutoTransition(false, undefined)).toBe(false)
    expect(resolveAutoTransition(true, undefined)).toBe(true)
  })
  it('env overrides the envelope value', () => {
    // env 'false' overrides envelope true
    expect(resolveAutoTransition(true, 'false')).toBe(false)
    // env 'true' overrides envelope false
    expect(resolveAutoTransition(false, 'true')).toBe(true)
  })
})
