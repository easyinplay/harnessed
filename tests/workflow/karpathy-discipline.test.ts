// tests/workflow/karpathy-discipline.test.ts — T2.7 karpathy internalization guard.
//
// `karpathy-guidelines` is `impl: harnessed-bundled`: its ONLY substance is
// workflows/disciplines/karpathy.yaml (loaded by buildDisciplinesSection and
// referenced by all 28 workflows via `disciplines_applied`), and its capability
// `description` is the human-facing summary of that file. Pre-4.34.x the
// description over-claimed — `trust-internal-code` and `no-comments-default`
// were advertised but had no rule behind them, so the summary promised behavior
// nothing enforced. That drift is what made the upstream `karpathy-skills`
// plugin look load-bearing when it was already redundant.
//
// These cells reconcile the two directions (rules ⊆ description AND
// description ⊆ rules) so an over-claim (or an under-claim) can never reappear
// silently after the upstream manifest is gone.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const ROOT = join(__dirname, '..', '..')

interface Rule {
  id: string
  description: string
  enforcement: string
  trigger: string | string[]
  check_method: string
  auto_fix_cmd?: string
}
interface DisciplineDoc {
  rules: Rule[]
}

function readDiscipline(file: string): DisciplineDoc {
  return parseYaml(
    readFileSync(join(ROOT, 'workflows', 'disciplines', file), 'utf8'),
  ) as DisciplineDoc
}

const en = readDiscipline('karpathy.yaml')
const zh = readDiscipline('karpathy.zh-Hans.yaml')

const caps = parseYaml(readFileSync(join(ROOT, 'workflows', 'capabilities.yaml'), 'utf8')) as {
  capabilities: Record<string, { description?: string; discipline_ref?: string }>
}

/** The 7 rules the discipline must carry after T2.7 (5 original + the 2 that
 *  were only ever claimed in prose). */
const EXPECTED_RULES = [
  'think-before-coding',
  'simplicity-first',
  'surgical-changes',
  'goal-driven-execution',
  'file-length-200-hard-limit',
  'trust-internal-code',
  'no-comments-default',
]

describe('karpathy discipline — rule set (T2.7 5 → 7)', () => {
  it('carries exactly the 7 expected rules', () => {
    expect(en.rules.map((r) => r.id).sort()).toEqual([...EXPECTED_RULES].sort())
  })

  it('zh-Hans sibling carries the identical rule id set', () => {
    expect(zh.rules.map((r) => r.id).sort()).toEqual(en.rules.map((r) => r.id).sort())
  })

  // The 2 new rules are judgment calls with no deterministic check, so they must
  // stay advisory. A `halt` here would exit non-zero on an unverifiable heuristic
  // (only file-length-200-hard-limit earns halt — it has an external-cmd check).
  it('the 2 new heuristic rules are advisory (warn), never halt', () => {
    for (const id of ['trust-internal-code', 'no-comments-default']) {
      const r = en.rules.find((x) => x.id === id)
      expect(r, `${id} missing`).toBeDefined()
      expect(r?.enforcement, `${id} must not halt on an unverifiable heuristic`).toBe('warn')
    }
  })

  // Rule descriptions are injected VERBATIM into every subagent prompt
  // (buildDisciplinesSection), so the en base must be English-only.
  it('en base rule descriptions carry no CJK (they go straight into the prompt)', () => {
    for (const r of en.rules) {
      expect(r.description, `rule '${r.id}' description has CJK`).not.toMatch(/[一-鿿]/)
    }
  })
})

describe('karpathy-guidelines capability ↔ discipline reconciliation', () => {
  const entry = caps.capabilities['karpathy-guidelines']

  it('the capability points at the bundled discipline (no upstream plugin)', () => {
    expect(entry?.discipline_ref).toBe('workflows/disciplines/karpathy.yaml')
  })

  // Contract: the description ends with `<N> rules: <id> / <id> / ...`. That
  // suffix is the machine-checkable claim; everything before it is free prose.
  it('description claims reconcile 1:1 with the rule ids (no over/under-claim)', () => {
    const desc = entry?.description ?? ''
    const m = /(\d+)\s+rules:\s*(.+)$/.exec(desc.replace(/\s+/g, ' ').trim())
    expect(
      m,
      `description must end with "<N> rules: <id> / <id> / ...", got: ${desc}`,
    ).not.toBeNull()
    if (!m) return
    const claimed = (m[2] ?? '').split('/').map((s) => s.trim())
    const actual = en.rules.map((r) => r.id)
    expect(Number(m[1]), 'claimed rule count').toBe(actual.length)
    expect([...claimed].sort(), 'claimed ids must equal actual rule ids').toEqual(
      [...actual].sort(),
    )
  })

  it('description is English-only (en base asset)', () => {
    expect(entry?.description ?? '').not.toMatch(/[一-鿿]/)
  })
})
