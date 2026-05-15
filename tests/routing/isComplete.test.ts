// Phase 2.2 Wave 2 T2.5 — unit tests for src/routing/lib/ralphLoop.ts
// `isComplete` 4-layer dual-signal (RESEARCH § 1.3 / SC3 PRIMARY + B-07 FALLBACK).
//
// 4-layer table (RESEARCH § 1.3):
//   layer 1 — outer PRIMARY    : JSON envelope w/ structured_output.status='COMPLETE'
//   layer 2 — outer FALLBACK   : JSON envelope w/ <promise>COMPLETE</promise> in text/result
//   layer 3 — inner FALLBACK   : raw string (non-JSON envelope) carries <promise>COMPLETE</promise>
//   layer 4 — all-signals-fail : neither structured_output nor <promise> present → false

import { describe, expect, it } from 'vitest'
import { isComplete } from '../../src/routing/lib/ralphLoop.js'

describe('isComplete — layer 1: outer PRIMARY (structured_output.status=COMPLETE)', () => {
  it('returns true for {subtype:success, structured_output:{status:COMPLETE}}', () => {
    const env = JSON.stringify({
      subtype: 'success',
      structured_output: { status: 'COMPLETE', phase: '02-code' },
    })
    expect(isComplete(env)).toBe(true)
  })

  it('returns false when structured_output.status is PARTIAL (no other signal)', () => {
    const env = JSON.stringify({
      subtype: 'success',
      structured_output: { status: 'PARTIAL' },
    })
    expect(isComplete(env)).toBe(false)
  })

  it('returns false when subtype is not success (even if status=COMPLETE)', () => {
    const env = JSON.stringify({
      subtype: 'error_max_turns',
      structured_output: { status: 'COMPLETE' },
    })
    expect(isComplete(env)).toBe(false)
  })
})

describe('isComplete — layer 2: outer FALLBACK (<promise> in env.text or env.result)', () => {
  it('returns true for JSON envelope with <promise>COMPLETE</promise> in text field', () => {
    const env = JSON.stringify({
      subtype: 'success',
      text: 'did the work\n<promise>COMPLETE</promise>',
    })
    expect(isComplete(env)).toBe(true)
  })

  it('returns true for JSON envelope with <promise>COMPLETE</promise> in result field', () => {
    const env = JSON.stringify({
      subtype: 'success',
      result: 'final summary <promise>COMPLETE</promise>',
    })
    expect(isComplete(env)).toBe(true)
  })

  it('prefers env.text over env.result when both present (?? short-circuit)', () => {
    const env = JSON.stringify({
      subtype: 'success',
      text: '<promise>COMPLETE</promise>',
      result: 'unused',
    })
    expect(isComplete(env)).toBe(true)
  })
})

describe('isComplete — layer 3: inner FALLBACK (raw string carries <promise>)', () => {
  it('returns true for raw string with <promise>COMPLETE</promise> (non-JSON envelope)', () => {
    expect(isComplete('<promise>COMPLETE</promise>')).toBe(true)
  })

  it('returns true for raw string with <promise>COMPLETE</promise> embedded mid-text', () => {
    expect(isComplete('did the work\n<promise>COMPLETE</promise>\nend')).toBe(true)
  })

  it('returns false for raw string with bare COMPLETE (no XML wrapper — F33 P1 mitigation)', () => {
    expect(isComplete('COMPLETE')).toBe(false)
  })

  it('returns false for think-out-loud raw string ("I think the task is COMPLETE")', () => {
    expect(isComplete('I think the task is COMPLETE in nature, continuing.')).toBe(false)
  })
})

describe('isComplete — layer 4: all signals fail → false', () => {
  it('returns false for JSON envelope status=PARTIAL + no <promise> in text', () => {
    const env = JSON.stringify({
      subtype: 'success',
      structured_output: { status: 'PARTIAL' },
      text: 'still working',
    })
    expect(isComplete(env)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isComplete('')).toBe(false)
  })

  it('returns false for JSON envelope with no structured_output and no text/result fields', () => {
    const env = JSON.stringify({ subtype: 'success' })
    expect(isComplete(env)).toBe(false)
  })

  it('returns false for malformed JSON-like string with no <promise> wrapper', () => {
    expect(isComplete('{ not valid json,COMPLETE')).toBe(false)
  })
})
