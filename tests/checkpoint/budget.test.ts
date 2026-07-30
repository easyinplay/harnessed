// T2.7 D-2 — iteration budget EXECUTED in the ledger.
//
// `workflows/defaults.yaml:11 ralph_max_iterations` shipped as a template value with
// no executor on the live path: its only consumers were `harnessed run` (which every
// SKILL forbids) and the `harnessed prompt --json` payload handed to the ralph-loop
// plugin. This resolves the same table against the ledger's per-sub attempt counter
// (`fail_count`, the counting source BREAK-LOOP already uses).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_ATTEMPT_BUDGET,
  isBudgetExhausted,
  resolveAttemptBudget,
} from '../../src/checkpoint/budget.js'

const REPO_ROOT = resolve(__dirname, '..', '..')

describe('resolveAttemptBudget against the REAL workflows/defaults.yaml', () => {
  it('resolves the per-phase table to a sub-level ceiling (task-test → 15)', async () => {
    expect(await resolveAttemptBudget('task-test', REPO_ROOT)).toBe(15)
  })

  it('takes the MAX phase value for a multi-phase sub (verify-progress → 3)', async () => {
    expect(await resolveAttemptBudget('verify-progress', REPO_ROOT)).toBe(3)
  })

  // The live path passes the LEAF name: `delegates_to` names the sub `test` / `progress`
  // (workflows/task/auto/workflow.yaml:54, workflows/verify/auto/workflow.yaml:53) and
  // that is what lands in the ledger, while the table is keyed by the full workflow
  // name. Without the leaf fallback every real sub silently resolved to the generic
  // default and the table stayed as unexecuted as it was before D-2.
  it('resolves the LEAF name the ledger actually carries (test → task-test → 15)', async () => {
    expect(await resolveAttemptBudget('test', REPO_ROOT)).toBe(15)
    expect(await resolveAttemptBudget('progress', REPO_ROOT)).toBe(3)
    expect(await resolveAttemptBudget('code', REPO_ROOT)).toBe(20)
  })

  it('takes the MAX over an ambiguous leaf (phase = discuss-phase | plan-phase → 5)', async () => {
    expect(await resolveAttemptBudget('phase', REPO_ROOT)).toBe(5)
  })

  it('does not suffix-match a longer key (code must not pick up verify-code-review)', async () => {
    // `verify-code-review`.endsWith('-code') is false — the guard is the leading dash.
    expect(await resolveAttemptBudget('code-review', REPO_ROOT)).toBe(5)
  })

  it('falls back to the default for an unknown sub (fail-open, never a false hard stop)', async () => {
    expect(await resolveAttemptBudget('no-such-sub', REPO_ROOT)).toBe(DEFAULT_ATTEMPT_BUDGET)
  })

  it('falls back to the default when defaults.yaml is unreadable', async () => {
    expect(await resolveAttemptBudget('task-test', join(REPO_ROOT, 'no', 'such', 'root'))).toBe(
      DEFAULT_ATTEMPT_BUDGET,
    )
  })
})

describe('resolveAttemptBudget — synthetic tables', () => {
  let root: string
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'harnessed-budget-'))
    mkdirSync(join(root, 'workflows'), { recursive: true })
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  const write = (yaml: string) => writeFileSync(join(root, 'workflows', 'defaults.yaml'), yaml)

  it('accepts a plain number entry', async () => {
    write('ralph_max_iterations:\n  solo: 7\n')
    expect(await resolveAttemptBudget('solo', root)).toBe(7)
  })

  it('takes the max across phases', async () => {
    write('ralph_max_iterations:\n  multi:\n    01-a: 3\n    02-b: 11\n    03-c: 5\n')
    expect(await resolveAttemptBudget('multi', root)).toBe(11)
  })

  it('clamps to hard_upper_limit (STRIDE T-2.2-05 DoS mitigation)', async () => {
    write('ralph_max_iterations:\n  huge: 9999\nhard_upper_limit: 100\n')
    expect(await resolveAttemptBudget('huge', root)).toBe(100)
  })

  it('ignores a non-numeric table and degrades to the default', async () => {
    write('ralph_max_iterations:\n  weird:\n    01-a: "lots"\n')
    expect(await resolveAttemptBudget('weird', root)).toBe(DEFAULT_ATTEMPT_BUDGET)
  })
})

describe('isBudgetExhausted', () => {
  it('is inclusive: attempts === budget is exhausted', () => {
    expect(isBudgetExhausted(2, 3)).toBe(false)
    expect(isBudgetExhausted(3, 3)).toBe(true)
    expect(isBudgetExhausted(4, 3)).toBe(true)
  })
})
