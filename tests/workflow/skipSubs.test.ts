// 4.23.2 (issue #5 defect 2) — skip-sub matching helpers (TDD red-first).
//
// `harnessed gates verify --skip-sub verify-paranoid` silently did nothing:
// delegates_to[].sub are BARE names (paranoid/multispec) while the user-facing
// fire[] list and slash commands use the FLATTENED `<master>-<sub>` name
// (verify-paranoid). matchSkipSub accepts both; warnUnmatchedSkips surfaces
// requested names that matched no clause instead of ignoring them silently.

import { describe, expect, it } from 'vitest'
import { matchSkipSub, warnUnmatchedSkips } from '../../src/workflow/skipSubs.js'

describe('matchSkipSub', () => {
  it('exact clause name matches (auto lite path: --skip-sub verify,retro / clarify)', () => {
    expect(matchSkipSub(new Set(['clarify']), 'clarify', 'task')).toBe('clarify')
    expect(matchSkipSub(new Set(['verify', 'retro']), 'verify', 'auto')).toBe('verify')
    expect(matchSkipSub(new Set(['verify', 'retro']), 'retro', 'auto')).toBe('retro')
  })

  it('flattened <master>-<sub> alias matches (issue #5: verify-paranoid → paranoid)', () => {
    expect(matchSkipSub(new Set(['verify-paranoid']), 'paranoid', 'verify')).toBe('verify-paranoid')
    expect(matchSkipSub(new Set(['verify-multispec']), 'multispec', 'verify')).toBe(
      'verify-multispec',
    )
  })

  it('exact name wins over alias when both are requested', () => {
    expect(matchSkipSub(new Set(['paranoid', 'verify-paranoid']), 'paranoid', 'verify')).toBe(
      'paranoid',
    )
  })

  it('no match → null', () => {
    expect(matchSkipSub(new Set(['verify-bogus']), 'paranoid', 'verify')).toBe(null)
    expect(matchSkipSub(new Set(), 'paranoid', 'verify')).toBe(null)
  })

  it("alias uses the calling master's own prefix only (auto does not strip verify-)", () => {
    // requested `verify-paranoid` under master auto (clauses: discuss/plan/task/verify/…)
    // must NOT match clause `verify` — it names a sub of the verify master, not auto's.
    expect(matchSkipSub(new Set(['verify-paranoid']), 'verify', 'auto')).toBe(null)
  })
})

describe('warnUnmatchedSkips', () => {
  it('warns each unmatched requested name with master + valid subs', () => {
    const msgs: string[] = []
    warnUnmatchedSkips(
      new Set(['clarify', 'verify-bogus']),
      new Set(['clarify']),
      'verify',
      ['progress', 'paranoid', 'multispec'],
      (m) => msgs.push(m),
    )
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toContain('--skip-sub "verify-bogus" ignored: not a sub of master verify')
    expect(msgs[0]).toContain('progress')
    expect(msgs[0]).toContain('multispec')
  })

  it('silent when every requested name matched', () => {
    const msgs: string[] = []
    warnUnmatchedSkips(
      new Set(['paranoid']),
      new Set(['paranoid']),
      'verify',
      ['progress', 'paranoid'],
      (m) => msgs.push(m),
    )
    expect(msgs).toEqual([])
  })

  it('silent when nothing was requested', () => {
    const msgs: string[] = []
    warnUnmatchedSkips(new Set(), new Set(), 'verify', ['progress'], (m) => msgs.push(m))
    expect(msgs).toEqual([])
  })
})

describe('SKIP_SYNONYMS — clarify→discuss (4.31.0 eval 首日战果)', () => {
  it('clarify matches the discuss clause (auto SOP compat)', () => {
    expect(matchSkipSub(new Set(['clarify']), 'discuss', 'auto')).toBe('clarify')
  })
  it('clarify does NOT match unrelated subs', () => {
    expect(matchSkipSub(new Set(['clarify']), 'verify', 'auto')).toBeNull()
  })
  it('warnUnmatchedSkips stays silent when clarify matched via synonym', () => {
    const warnings: string[] = []
    warnUnmatchedSkips(
      new Set(['clarify']),
      new Set(['clarify']),
      'auto',
      ['research', 'discuss', 'plan', 'task', 'verify', 'retro'],
      (m) => warnings.push(m),
    )
    expect(warnings).toEqual([])
  })
})
