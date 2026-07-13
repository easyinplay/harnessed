// 4.31.0 eval Slice A (T3) — golden normalization + diff.
// CEO plan locked semantics: normalize BEFORE write/compare — abs paths →
// <TMP> placeholder (fs.realpath applied by the runner so Windows 8.3 short
// paths like EASYI~1 can't miss the replacement), `\` → `/` separators,
// timestamp fields stripped (state.ts new Date() is not injectable without
// engine change — determinism fallback documented in the CEO plan).

import { describe, expect, it } from 'vitest'
import { diffGolden, normalizeGolden } from '../../src/eval/golden.js'

describe('normalizeGolden (T3)', () => {
  it('replaces tmp roots with <TMP> and unifies separators', () => {
    const out = normalizeGolden(
      {
        p: 'C:\\Users\\x\\AppData\\Local\\Temp\\eval-abc\\repo\\.planning\\findings.md',
        nested: [{ q: 'C:/Users/x/AppData/Local/Temp/eval-abc/root/state.json' }],
      },
      ['C:\\Users\\x\\AppData\\Local\\Temp\\eval-abc'],
    ) as { p: string; nested: [{ q: string }] }
    expect(out.p).toBe('<TMP>/repo/.planning/findings.md')
    expect(out.nested[0].q).toBe('<TMP>/root/state.json')
  })

  it('replaces roots given in either separator form (8.3-realpath contract: caller passes realpath roots)', () => {
    const out = normalizeGolden({ p: '/tmp/eval-xyz/a/b' }, ['/tmp/eval-xyz']) as { p: string }
    expect(out.p).toBe('<TMP>/a/b')
  })

  it('strips timestamp fields recursively (started_at/completed_at/paused_at/timestamp)', () => {
    const out = normalizeGolden(
      {
        started_at: '2026-07-13T00:00:00.000Z',
        keep: 1,
        inner: { completed_at: 'x', paused_at: 'y', timestamp: 'z', sub: 'task-code' },
      },
      [],
    ) as Record<string, unknown>
    expect(out.started_at).toBeUndefined()
    expect((out.inner as Record<string, unknown>).completed_at).toBeUndefined()
    expect((out.inner as Record<string, unknown>).timestamp).toBeUndefined()
    expect((out.inner as Record<string, unknown>).sub).toBe('task-code')
    expect(out.keep).toBe(1)
  })

  it('leaves non-string primitives and arrays intact', () => {
    const out = normalizeGolden({ n: 3, b: true, arr: [1, 'x\\y - not a temp path'] }, []) as {
      n: number
      b: boolean
      arr: unknown[]
    }
    expect(out.n).toBe(3)
    // non-path backslash strings are still separator-normalized (documented:
    // golden values are engine outputs — windows paths are the only `\` source)
    expect(out.arr[1]).toBe('x/y - not a temp path')
  })
})

describe('diffGolden (T3)', () => {
  it('equal objects → empty diff', () => {
    expect(diffGolden({ a: 1 }, { a: 1 })).toEqual([])
  })

  it('mismatch → human-readable diff lines naming the path', () => {
    const d = diffGolden({ a: { b: 1 } }, { a: { b: 2 } })
    expect(d.length).toBeGreaterThan(0)
    expect(d.join('\n')).toMatch(/a\.b/)
    expect(d.join('\n')).toMatch(/expected/i)
  })
})
