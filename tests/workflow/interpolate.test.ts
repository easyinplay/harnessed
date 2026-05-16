// Phase 3.2 W1 T1.6 — interpolate.ts 6 fixture unit test (D-02 JINJA LOCKED).
// Sister tests/checkpoint/state.test.ts (Phase 3.1 W1 T1.4) vi pattern.
// 6 fixtures per RESEARCH § 2.3 table + D-02 zero-dep grep guard.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { InterpolationError, interpolate } from '../../src/workflow/interpolate.js'

describe('interpolate — JINJA {{ var }} replacement (D-02 LOCKED)', () => {
  it('1. happy single var — {{ prefix }}office-hours → gstack-office-hours', () => {
    expect(interpolate('{{ prefix }}office-hours', { prefix: 'gstack-' })).toBe(
      'gstack-office-hours',
    )
  })

  it('2. happy multi var — {{ a }}/{{ b }} → x/y', () => {
    expect(interpolate('{{ a }}/{{ b }}', { a: 'x', b: 'y' })).toBe('x/y')
  })

  it('3. undefined var → throws InterpolationError with diagnostic message', () => {
    expect(() => interpolate('{{ unknown }}', { prefix: 'gstack-' })).toThrow(InterpolationError)
    try {
      interpolate('{{ unknown }}', { prefix: 'gstack-' })
    } catch (e) {
      expect((e as Error).message).toContain('undefined template variable')
      expect((e as Error).message).toContain('unknown')
    }
  })

  it('4. empty string value valid — {{ prefix }}cmd → cmd (--no-prefix scenario, R7.4)', () => {
    expect(interpolate('{{ prefix }}cmd', { prefix: '' })).toBe('cmd')
  })

  it('5. nested {{ a.b }} unsupported → throws (\\w 不命中 .)', () => {
    expect(() => interpolate('{{ a.b }}', { a: 'x' })).toThrow(InterpolationError)
  })

  it('6. empty template + empty vars → empty string', () => {
    expect(interpolate('', {})).toBe('')
  })

  it('7. D-02 zero-dep guard — no template lib import in source', () => {
    const src = readFileSync('src/workflow/interpolate.ts', 'utf8')
    expect(/mustache|handlebars|nunjucks|ejs/i.test(src)).toBe(false)
  })
})
