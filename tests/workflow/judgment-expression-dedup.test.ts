// Guard — no two judgment triggers may declare the SAME fires_when / skips_when
// expression (whitespace-normalized).
//
// Why this class of defect needs a test and not a review habit: a copied
// expression has no mechanism linking the copy to its原文. The copy is a second
// source of truth that silently rots the moment someone edits one side. That
// happened for real: `phase.files_touched > 5` was added as a 4th OR-arm to
// judgments/phase-gate.yaml, but workflows/discuss/auto/workflow.yaml gated its
// `phase` delegate on a stage-routing.yaml COPY of the 3-arm predicate, so the
// new criterion could not change any master-tier decision — "加了等于没加".
//
// The fix was to point the delegate at the canonical trigger. This test is the
//防线 that stops the next copy from being introduced: duplicate expression →
// fail, with the exact offending trigger pair named.
//
// Legitimate collisions go in EXEMPT_DUPLICATE_GROUPS with a reason. Only one
// class qualifies: an ATOMIC single-fact predicate (`phase.has_ui_changes ==
// true`) that two independent tiers happen to read. Those carry no drift risk —
// there are no arms to fall out of sync, and merging them would force unrelated
// tiers to share one trigger name. A COMPOUND predicate (any `and` / `or`) is
// never exempt: that is the copy this test exists to prevent.

import { readdir, readFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const JUDGMENTS_DIR = resolve(__dirname, '..', '..', 'workflows', 'judgments')

/** Key = the group's members joined by ' + ' (sorted). Value = why it is allowed. */
const EXEMPT_DUPLICATE_GROUPS = new Map<string, string>([
  [
    'stage-phase-gate.gsd-ui-phase.fires_when + web-design-routing.design-taste-polish.fires_when + web-design-routing.ui-ux-pro-max-structure.fires_when',
    'atomic single-fact predicate `phase.has_ui_changes == true` read by 3 independent tiers ' +
      '(GSD ui design-contract + the 2 stages of the web-design routing pipeline). No arms → no drift ' +
      'surface; merging would couple unrelated tiers to one trigger name.',
  ],
])

interface TriggersFile {
  triggers?: Record<string, { fires_when?: string; skips_when?: string }>
}

/** Whitespace-normalized so `a  or\n  b` and `a or b` collide. */
function normalize(expr: string): string {
  return expr.trim().replace(/\s+/g, ' ')
}

async function collectExpressions(): Promise<Map<string, string[]>> {
  const byExpr = new Map<string, string[]>()
  const files = (await readdir(JUDGMENTS_DIR)).filter((f) => f.endsWith('.yaml'))
  for (const f of files) {
    const parsed = parseYaml(await readFile(join(JUDGMENTS_DIR, f), 'utf8')) as TriggersFile
    // fallback.yaml (`rules`) / user-overrides.yaml (`overrides`) carry no expressions.
    if (!parsed?.triggers) continue
    const base = basename(f, '.yaml')
    for (const [name, trig] of Object.entries(parsed.triggers)) {
      for (const field of ['fires_when', 'skips_when'] as const) {
        const raw = trig?.[field]
        if (typeof raw !== 'string' || raw.trim().length === 0) continue
        const key = normalize(raw)
        const owners = byExpr.get(key) ?? []
        owners.push(`${base}.${name}.${field}`)
        byExpr.set(key, owners)
      }
    }
  }
  return byExpr
}

describe('judgments/*.yaml — one expression, one home (no copied fires_when / skips_when)', () => {
  it('declares no duplicate expression across all judgment triggers', async () => {
    const byExpr = await collectExpressions()
    expect(byExpr.size, 'no judgment expressions found — collector is broken').toBeGreaterThan(20)

    const offenders: string[] = []
    for (const [expr, owners] of byExpr) {
      if (owners.length < 2) continue
      const groupKey = [...owners].sort().join(' + ')
      if (EXEMPT_DUPLICATE_GROUPS.has(groupKey)) continue
      offenders.push(`  "${expr}"\n    → ${[...owners].sort().join('\n    → ')}`)
    }

    if (offenders.length > 0) {
      throw new Error(
        `${offenders.length} duplicated judgment expression(s) — each expression must have ONE home.\n` +
          `Point every consumer at the canonical trigger (gate refs are cross-file: ` +
          `judgments.<file>.<trigger>.fires), delete the copy, or add the group to ` +
          `EXEMPT_DUPLICATE_GROUPS with a reason.\n${offenders.join('\n')}`,
      )
    }
  })

  it('every exemption is still a live duplicate group (no stale exemptions)', async () => {
    const byExpr = await collectExpressions()
    const liveGroups = new Set(
      [...byExpr.values()].filter((o) => o.length > 1).map((o) => [...o].sort().join(' + ')),
    )
    const stale = [...EXEMPT_DUPLICATE_GROUPS.keys()].filter((k) => !liveGroups.has(k))
    expect(
      stale,
      `stale EXEMPT_DUPLICATE_GROUPS entries — delete them:\n${stale.join('\n')}`,
    ).toEqual([])
  })

  it('rejects compound (and/or) predicates as exemption candidates', async () => {
    // A compound expression is exactly the copied-criteria shape this guard exists
    // to stop; an exemption for one would defeat the test.
    const byExpr = await collectExpressions()
    const compoundExempt: string[] = []
    for (const [expr, owners] of byExpr) {
      const groupKey = [...owners].sort().join(' + ')
      if (!EXEMPT_DUPLICATE_GROUPS.has(groupKey)) continue
      if (/\b(and|or)\b/.test(expr)) compoundExempt.push(`${expr} → ${groupKey}`)
    }
    expect(
      compoundExempt,
      `compound predicates must never be exempt (they are the copied-criteria class):\n${compoundExempt.join('\n')}`,
    ).toEqual([])
  })
})
