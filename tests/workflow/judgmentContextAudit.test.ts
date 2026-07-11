// 4.23.2 (issue #5 D4) — judgments × default-gate-context static audit.
//
// Contract (gateContext.ts header): every variable any judgments/*.yaml
// fires_when/skips_when references MUST exist in buildDefaultGateContext.
// A BARE identifier missing from the context makes expr-eval throw
// "undefined variable: <name>" at gate eval; pre-4.23.2 the ADR 0029
// fail-soft then FIRED the sub as if gate=true — issue #5: verify-multispec
// (4-specialist Agent Team, the most expensive sub) fired on every ordinary
// verify because root-flat `is_critical_release` was dropped in the v4.1.2
// context extraction. This test is the static guard that would have been red
// at v4.1.2. Note: missing OBJECT MEMBERS (phase.foo) evaluate to a silent
// false — only bare identifiers throw, so this audit targets exactly the
// fail-open class.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { buildDefaultGateContext } from '../../src/cli/lib/gateContext.js'
import { evalGate } from '../../src/workflow/exprBuilder.js'

const JUDGMENTS_DIR = join(process.cwd(), 'workflows', 'judgments')

interface TriggerEntry {
  fires_when?: string
  skips_when?: string
}

function collectExpressions(): { ref: string; expr: string }[] {
  const out: { ref: string; expr: string }[] = []
  for (const file of readdirSync(JUDGMENTS_DIR)) {
    if (!file.endsWith('.yaml')) continue
    const parsed = parseYaml(readFileSync(join(JUDGMENTS_DIR, file), 'utf8')) as Record<
      string,
      unknown
    >
    // fallback.yaml uses top-level `rules` (runtime lexical match, not expr-eval'd);
    // user-overrides.yaml has no triggers either — both skip.
    const triggers = parsed?.triggers as Record<string, TriggerEntry> | undefined
    if (!triggers) continue
    for (const [name, trig] of Object.entries(triggers)) {
      if (typeof trig?.fires_when === 'string') {
        out.push({ ref: `${file}#${name}.fires_when`, expr: trig.fires_when })
      }
      if (typeof trig?.skips_when === 'string') {
        out.push({ ref: `${file}#${name}.skips_when`, expr: trig.skips_when })
      }
    }
  }
  return out
}

describe('judgments × default gate context audit (issue #5, 4.23.2)', () => {
  it('every fires_when/skips_when evals against buildDefaultGateContext without throwing', () => {
    const ctx = buildDefaultGateContext('audit-task', 'verify') as unknown as Record<
      string,
      unknown
    >
    const exprs = collectExpressions()
    // Sanity: the yaml discovery actually found the corpus (43 expressions at
    // 4.23.2 — a collapse to near-zero means the glob/parse broke, not clean).
    expect(exprs.length).toBeGreaterThan(20)
    const failures: string[] = []
    for (const { ref, expr } of exprs) {
      try {
        evalGate(expr, ctx)
      } catch (e) {
        failures.push(`${ref}: ${(e as Error).message}`)
      }
    }
    expect(
      failures,
      `gate expressions not evaluable against the default context:\n${failures.join('\n')}`,
    ).toEqual([])
  })
})
