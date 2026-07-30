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

// 4.32.22 — the synonym table must match in BOTH directions. 4.32.20 renamed the
// SOP text `--skip-sub clarify` → `--skip-sub discuss`, which is correct for /auto
// (its delegates clause IS named `discuss`) but broke /task, whose clause is still
// named `clarify` (workflows/task/auto/workflow.yaml:42). The one-way table only
// covered requested-synonym → canonical-clause, so `gates task --skip-sub discuss`
// fired task-clarify → a brainstorming subagent for work the main session already
// did interactively (the exact behaviour ~/.claude/CLAUDE.md forbids).
describe('SKIP_SYNONYMS bidirectionality — discuss↔clarify (4.32.22)', () => {
  it('requested `discuss` matches the `clarify` clause (/task SOP text after 4.32.20)', () => {
    expect(matchSkipSub(new Set(['discuss']), 'clarify', 'task')).toBe('discuss')
  })

  it('requested `clarify` still matches the `discuss` clause (installed old SKILL text)', () => {
    expect(matchSkipSub(new Set(['clarify']), 'discuss', 'auto')).toBe('clarify')
  })

  it('returns the REQUESTED name, not the clause name (warnUnmatchedSkips contract)', () => {
    // matched-set entries are compared against `requested`, so a synonym hit must
    // report the spelling the user typed or the unmatched warning misfires.
    const hit = matchSkipSub(new Set(['discuss']), 'clarify', 'task')
    expect(hit).toBe('discuss')
    const warnings: string[] = []
    warnUnmatchedSkips(
      new Set(['discuss']),
      new Set([hit as string]),
      'task',
      ['clarify', 'code', 'test', 'deliver'],
      (m) => warnings.push(m),
    )
    expect(warnings).toEqual([])
  })

  it('warnUnmatchedSkips stays silent for the legacy `clarify` spelling on /task too', () => {
    const hit = matchSkipSub(new Set(['clarify']), 'clarify', 'task')
    expect(hit).toBe('clarify')
    const warnings: string[] = []
    warnUnmatchedSkips(
      new Set(['clarify']),
      new Set([hit as string]),
      'task',
      ['clarify', 'code', 'test', 'deliver'],
      (m) => warnings.push(m),
    )
    expect(warnings).toEqual([])
  })

  it('no regression: exact name and <master>-<sub> alias still win first', () => {
    expect(matchSkipSub(new Set(['code']), 'code', 'task')).toBe('code')
    expect(matchSkipSub(new Set(['task-clarify']), 'clarify', 'task')).toBe('task-clarify')
    expect(matchSkipSub(new Set(['task-discuss']), 'discuss', 'task')).toBe('task-discuss')
  })

  it('bidirectionality is PER-PAIR — a synonym never leaks onto an unrelated sub', () => {
    // Both directions must stay scoped to the declared pair members. Neither
    // spelling may match any other clause name of any master (guards against a
    // future second table entry sharing a canonical value from becoming a
    // transitive synonym of this pair).
    for (const requested of ['discuss', 'clarify']) {
      for (const sub of ['code', 'test', 'deliver', 'plan', 'verify', 'retro', 'research']) {
        expect(matchSkipSub(new Set([requested]), sub, 'task')).toBeNull()
        expect(matchSkipSub(new Set([requested]), sub, 'auto')).toBeNull()
      }
    }
  })
})
