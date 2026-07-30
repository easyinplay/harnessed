// T2.1 D-2 follow-up — wire `phase.files_touched` into the phase-tier criterion.
//
// D-2 derived the fact (`harnessed facts` counts `git diff --name-only` ∪
// `--cached`) explicitly to make the "phase scope > 5 files" half of the
// phase-tier trigger expressible. The fact shipped; the expression did not, so
// the derived number decided nothing — a produced-but-unread fact, the mirror
// image of the built-but-unwired class this phase exists to close.
//
// The arm has to be an OR next to `scope_days > 1` (both are "this phase is too
// big to wing it" signals), and it must stay silent when the count is unknown:
// buildDefaultGateContext deliberately does NOT seed files_touched (a seeded 0
// would be a manufactured signal), so an absent member must evaluate to a plain
// false rather than throw or flip the verdict.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { buildDefaultGateContext } from '../../src/cli/lib/gateContext.js'
import { evalGate } from '../../src/workflow/exprBuilder.js'

interface Trigger {
  fires_when: string
  skips_when?: string
}

const TRIGGER: Trigger = (() => {
  const parsed = parseYaml(
    readFileSync(join(process.cwd(), 'workflows', 'judgments', 'phase-gate.yaml'), 'utf8'),
  ) as { triggers: Record<string, Trigger> }
  const t = parsed.triggers['gsd-discuss-phase']
  if (!t) throw new Error('phase-gate.yaml lost its gsd-discuss-phase trigger')
  return t
})()

/** A phase context in which every OTHER `fires_when` arm is false, so the only
 *  thing that can flip the verdict is the file count. */
function quietPhase(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    phase: {
      stage: 'discuss',
      open_decisions: 0,
      has_cross_phase_data_flow: false,
      scope_days: 0.5,
      single_task: false,
      ...extra,
    },
  }
}

describe('phase-gate.gsd-discuss-phase — the "> 5 files" scope arm', () => {
  it('a wide change fires the phase-tier discussion on file count alone', () => {
    expect(evalGate(TRIGGER.fires_when, quietPhase({ files_touched: 6 }))).toBe(true)
  })

  it('a narrow change does not fire on file count', () => {
    expect(evalGate(TRIGGER.fires_when, quietPhase({ files_touched: 3 }))).toBe(false)
    expect(evalGate(TRIGGER.fires_when, quietPhase({ files_touched: 5 }))).toBe(false)
  })

  it('an UNKNOWN file count (no repo / clean tree) neither throws nor fires', () => {
    // buildDefaultGateContext never seeds files_touched — the member is absent.
    // expr-eval only throws on missing BARE identifiers, so this must be a quiet
    // false, not an ADR-0038 fail-closed skip and not a fail-soft fire.
    expect(evalGate(TRIGGER.fires_when, quietPhase())).toBe(false)
  })

  it('the default gate context verdict is unchanged (no behaviour drift)', () => {
    // Regression guard for the behaviour-change claim: with no --context the
    // phase tier still fires via open_decisions >= 2, and files_touched stays
    // unseeded so the new arm contributes nothing to the default plan.
    const ctx = buildDefaultGateContext('t', 'discuss') as unknown as Record<string, unknown>
    expect('files_touched' in (ctx.phase as Record<string, unknown>)).toBe(false)
    expect(evalGate(TRIGGER.fires_when, ctx)).toBe(true)
    expect(evalGate(TRIGGER.skips_when as string, ctx)).toBe(false)
  })

  it('skips_when keeps no file-count arm (the criterion has no "few files ⇒ skip" half)', () => {
    expect(TRIGGER.skips_when).not.toContain('files_touched')
  })
})
