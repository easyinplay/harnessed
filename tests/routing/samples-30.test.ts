// Phase 2.3 W4 T4.3 — 30-sample arbitrateWithRedirect routing harness (D-05 ≥85%).
//
// IMPL NOTE — B-21 + D-05 + S1 plan-check fix (vitest parallel race avoidance via
// pre-compute pattern, NOT mutate `hits` across `it()` cells). Parses
// `.planning/phase-2.3/SAMPLES.md` § 2 truth table (FRESH-30 = 10 design + 10
// content + 10 testing) 1:1 → runs each sample through `arbitrateWithRedirect()`
// (Phase 2.3 W2 T2.2 ship, sister to legacy `arbitrate()` per ADR 0012 errata) →
// derives actualExpert from matched | rejected+redirect | none discriminated
// union → asserts per-sample hit + per-category breakdown + overall ≥26/30.
//
// SAMPLES.md table schema (8 cols):
//   | # | category | task_type | prompt | expected_route | expected_primary_expert | acceptance_signal | rationale |
//
// TaskContext field injection (S1 plan-check fix — simple heuristic, karpathy YAGNI):
//   - prompt 含 "中文" → inject `language: 'zh'` (S15/S17/S20 chinese-content-deck 第二键)
//   - prompt 含 "Python" (case-insensitive) AND task_type='e2e-test' →
//     inject `backend_language: 'python'` (S23/S24/S29 e2e-with-python-backend 第二键)
// 其他 sample 仅 `{ task_type, prompt }`; CD-3 redirect 路径与 matched 路径终态一致 (D-08).

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  arbitrateWithRedirect,
  loadDecisionRules,
  type Rule,
  type TaskContext,
} from '../../src/routing/decisionRules.js'

interface Sample {
  id: string
  category: 'design' | 'content' | 'testing' | 'search'
  task_type: string
  prompt: string
  expected_primary_expert: string | null
}

const SAMPLES_PATH = join(process.cwd(), '.planning', 'phase-2.3', 'SAMPLES.md')
const RULES_PATH = join(process.cwd(), 'routing', 'decision_rules.yaml')

/** Parse SAMPLES.md § 2 8-column truth table. Row pattern: `| ## | category |
 *  task_type | prompt | expected_route | expected_primary_expert | signal | rationale |`.
 *  Lines starting with `| 01 ` ... `| 30 ` (zero-padded 2-digit id). */
function loadSamples(path: string): Sample[] {
  const md = readFileSync(path, 'utf8')
  const rowRe =
    /^\|\s*(0[1-9]|[12][0-9]|30)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm
  const out: Sample[] = []
  for (const m of md.matchAll(rowRe)) {
    const rawExpert = (m[6] ?? '').trim()
    const expected_primary_expert =
      rawExpert === '' || rawExpert.toLowerCase() === 'null' ? null : rawExpert
    out.push({
      id: m[1] ?? '',
      category: (m[2] ?? '').trim() as Sample['category'],
      task_type: (m[3] ?? '').trim(),
      prompt: (m[4] ?? '').trim(),
      expected_primary_expert,
    })
  }
  return out
}

/** Build TaskContext from sample + simple heuristic field injection. */
function buildTask(sample: Sample): TaskContext {
  const task: TaskContext = { task_type: sample.task_type, prompt: sample.prompt }
  if (/中文/.test(sample.prompt)) task.language = 'zh'
  if (sample.task_type === 'e2e-test' && /python/i.test(sample.prompt)) {
    task.backend_language = 'python'
  }
  return task
}

/** Derive actualExpert from arbitrateWithRedirect's discriminated union. */
function deriveExpert(rules: Rule[], task: TaskContext): string | null {
  const result = arbitrateWithRedirect(rules, task)
  if (result.kind === 'matched') {
    return (result.rule.decision.primary_expert as string | null) ?? null
  }
  if (result.kind === 'rejected') return result.redirectTo
  return null // kind === 'none'
}

// ---- Pre-compute (S1 plan-check fix — vitest parallel race avoidance) -------

const SAMPLES = loadSamples(SAMPLES_PATH)
const RULES: Rule[] = loadDecisionRules(RULES_PATH).rules
const RESULTS = SAMPLES.map((sample) => {
  const actualExpert = deriveExpert(RULES, buildTask(sample))
  return { sample, actualExpert, hit: actualExpert === sample.expected_primary_expert }
})

// ---- Per-sample cells -------------------------------------------------------

describe('Phase 2.3 30-sample arbitrateWithRedirect harness (D-05 ≥85%)', () => {
  it('parses exactly 30 samples from SAMPLES.md § 2', () => {
    expect(SAMPLES.length).toBe(30)
  })

  for (const { sample, actualExpert, hit } of RESULTS) {
    it(`#${sample.id} ${sample.category} ${sample.task_type} — expected ${sample.expected_primary_expert ?? '<null>'} actual ${actualExpert ?? '<null>'}`, () => {
      if (!hit) {
        // Failure drill-down — debug aid (sister phase 1.4 routing-30-samples pattern)
        console.error(
          `[MISS] #${sample.id} ${sample.category}: expected=${sample.expected_primary_expert ?? 'null'} actual=${actualExpert ?? 'null'} prompt="${sample.prompt}"`,
        )
      }
      expect(actualExpert).toBe(sample.expected_primary_expert)
    })
  }
})

// ---- Per-category breakdown + overall ≥26/30 -------------------------------

describe('Routing accuracy v0.2 summary — per-category breakdown + ≥85% total (D-05)', () => {
  it('computes per-category breakdown + total accuracy', () => {
    const byCategory = new Map<string, { hit: number; total: number }>()
    for (const { sample, hit } of RESULTS) {
      const cat = sample.category
      const acc = byCategory.get(cat) ?? { hit: 0, total: 0 }
      acc.total += 1
      if (hit) acc.hit += 1
      byCategory.set(cat, acc)
    }

    console.log('\n  === Routing Accuracy v0.2 (30 sample baseline) ===')
    for (const [cat, { hit, total }] of byCategory) {
      const pct = ((hit / total) * 100).toFixed(1)
      console.log(`  ${cat.padEnd(10)} ${hit}/${total}  (${pct}%)`)
      // Cherry-pick 防御 (sister phase 1.4 pattern): 单 category < 60% 视为预警 (不 fail)
      if (hit / total < 0.6) console.warn(`  WARN: category '${cat}' below 60% — cherry-pick risk`)
    }
    const totalHit = RESULTS.filter((r) => r.hit).length
    const accuracy = totalHit / RESULTS.length
    console.log(`  TOTAL      ${totalHit}/${RESULTS.length}  (${(accuracy * 100).toFixed(1)}%)`)

    const specificHit = RESULTS.filter(
      (r) => r.hit && r.sample.expected_primary_expert !== null,
    ).length
    console.log(`  SPECIFIC   ${specificHit}/${RESULTS.length}  (non-null expected hits)`)

    // Hard gate — D-05 acceptance bar ≥85% (≥26/30)
    expect(totalHit).toBeGreaterThanOrEqual(26)
  })
})

afterAll(() => {
  // Sanity — SAMPLES.md frozen at 30 (R3 phase 1.4 sister precedent)
  expect(SAMPLES.length).toBe(30)
})
