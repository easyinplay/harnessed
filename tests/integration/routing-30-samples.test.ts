// Phase 1.4 T6.2 — Sample-driven routing accuracy integration test (Pattern P 新生).
//
// IMPL NOTE — D-16 inline truth table NOT fixtures/ (PATTERNS § 4 反驳 cite:
// fixture 化迁移 trigger ≥ 50 sample OR ≥ 8KB inline; 30 sample × 6 字段 ~3KB
// 远低于阈值，inline 方便 IDE go-to-definition 单文件 review). KICKOFF C6 +
// D1.4-5 (v0.1 内部基线锁定) + D1.4-10 (≥ 0.85 LangChain industry alignment)
// + Pattern P (新生 — sample-driven accuracy test pattern, phase 1.5+ DAG
// resolver 升级 expected 时复用本 cell 结构). R3 mitigation: SAMPLES.md
// frozen at plan-phase Wave B；本 inline truth table 1:1 对应
// .planning/phase-1.4/SAMPLES.md § 2，任何修改必走 ADR 0009+ errata.
//
// Test 设计:
//   - 30 per-sample cell — 每 sample 一 cell (Vitest 单 cell fail 不影响其他)
//   - per-category breakdown describe block — 防 cherry-pick (单 category < 60% 预警)
//   - total accuracy assertion ≥ 0.85 (≥ 27/30) — D1.4-10 lock
//   - failure drill-down: 每 miss sample 打印 actual vs expected (debug aid)

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { arbitrate, loadDecisionRules, type Rule } from '../../src/routing/decisionRules.js'

interface Sample {
  id: string
  category: 'design' | 'content' | 'testing' | 'search' | 'meta' | 'engineering'
  task: Record<string, unknown>
  expected_rule_id: string | null
  expected_primary_expert: string | null
}

// ---- Inline truth table — 30 sample 1:1 对应 SAMPLES.md § 2 ----------------

const SAMPLES: Sample[] = [
  // 2.1 Design (5)
  {
    id: 'design-1',
    category: 'design',
    task: { task_type: 'ui-design' },
    expected_rule_id: 'ui-task-default',
    expected_primary_expert: 'ui-ux-pro-max',
  },
  {
    id: 'design-2',
    category: 'design',
    task: { task_type: 'ui-design' },
    expected_rule_id: 'ui-task-default',
    expected_primary_expert: 'ui-ux-pro-max',
  },
  {
    id: 'design-3',
    category: 'design',
    task: { task_type: 'ui-design', override_keywords: ['做出风格', 'design-led', '创意'] },
    // Phase 1.5 T6.4 — F42 array semantic match upgrade (ADR 0009 § Decision
    // Errata 2): arbitrate v2 substring-matches the `override_keywords` array
    // trigger → priority=100 ui-task-bold-style-override now hits (was v1
    // fallthrough to ui-task-default). SAMPLES.md § 8.1/§ 8.2 v2 errata mapping.
    expected_rule_id: 'ui-task-bold-style-override',
    expected_primary_expert: 'frontend-design',
  },
  {
    id: 'design-4',
    category: 'design',
    task: { task_type: 'ui-design' },
    expected_rule_id: 'ui-task-default',
    expected_primary_expert: 'ui-ux-pro-max',
  },
  {
    id: 'design-5',
    category: 'design',
    task: { task_type: 'ui-design', override_keywords: ['experimental', 'distinctive'] },
    // Phase 1.5 T6.4 — F42 array semantic match upgrade (same as design-3):
    // `experimental` / `distinctive` are override_keywords on
    // ui-task-bold-style-override (priority=100) → now hits.
    expected_rule_id: 'ui-task-bold-style-override',
    expected_primary_expert: 'frontend-design',
  },

  // 2.2 Content (5)
  {
    id: 'content-1',
    category: 'content',
    task: { task_type: 'pptx-file-operation' },
    expected_rule_id: 'pptx-file-task',
    expected_primary_expert: 'anthropics-skills-pptx',
  },
  {
    id: 'content-2',
    category: 'content',
    task: { task_type: 'pptx-file-operation' },
    expected_rule_id: 'pptx-file-task',
    expected_primary_expert: 'anthropics-skills-pptx',
  },
  {
    id: 'content-3',
    category: 'content',
    task: { task_type: 'slide-deck', language: 'zh' },
    expected_rule_id: 'chinese-content-deck',
    expected_primary_expert: 'jimliu-baoyu-skills-baoyu-slide-deck',
  },
  {
    id: 'content-4',
    category: 'content',
    task: { task_type: 'slide-deck', language: 'zh' },
    expected_rule_id: 'chinese-content-deck',
    expected_primary_expert: 'jimliu-baoyu-skills-baoyu-slide-deck',
  },
  {
    id: 'content-5',
    category: 'content',
    task: { task_type: 'slide-deck' }, // no language=zh
    expected_rule_id: null,
    expected_primary_expert: null,
  },

  // 2.3 Testing (5)
  {
    id: 'testing-1',
    category: 'testing',
    task: { task_type: 'performance' },
    // Phase 1.5 T6.4 — F42 array semantic match upgrade (ADR 0009 § Decision
    // Errata 2 / SAMPLES.md § 8.1): `task_type: performance` ∈ perf-a11y-memory
    // rule's task_type array → now hits (was v1 array-trigger miss).
    expected_rule_id: 'perf-a11y-memory',
    expected_primary_expert: 'chrome-devtools-mcp',
  },
  {
    id: 'testing-2',
    category: 'testing',
    task: { task_type: 'e2e-test', backend_language: 'python' },
    expected_rule_id: 'e2e-with-python-backend',
    expected_primary_expert: 'webapp-testing',
  },
  {
    id: 'testing-3',
    category: 'testing',
    task: { task_type: 'e2e-test' },
    expected_rule_id: 'e2e-default',
    expected_primary_expert: 'playwright-test',
  },
  {
    id: 'testing-4',
    category: 'testing',
    task: { task_type: 'e2e-test' },
    expected_rule_id: 'e2e-default',
    expected_primary_expert: 'playwright-test',
  },
  {
    id: 'testing-5',
    category: 'testing',
    task: { task_type: 'ai-explore' },
    // Phase 1.5 T6.4 — F42 array semantic match upgrade (SAMPLES.md § 8.1):
    // `task_type: ai-explore` ∈ ai-explore-debug rule's task_type array → now
    // hits (was v1 array-trigger miss).
    expected_rule_id: 'ai-explore-debug',
    expected_primary_expert: 'playwright-cli',
  },

  // 2.4 Search (5)
  {
    id: 'search-1',
    category: 'search',
    task: { task_type: 'search' },
    expected_rule_id: 'search-default',
    expected_primary_expert: 'tavily-mcp',
  },
  {
    id: 'search-2',
    category: 'search',
    task: { task_type: 'search' },
    expected_rule_id: 'search-default',
    expected_primary_expert: 'tavily-mcp',
  },
  {
    id: 'search-3',
    category: 'search',
    task: { task_type: 'search' },
    expected_rule_id: 'search-default',
    expected_primary_expert: 'tavily-mcp',
  },
  {
    id: 'search-4',
    category: 'search',
    task: { task_type: 'search', signals: ['学术', '论文'] },
    // Phase 1.5 T6.4 — F42 array semantic match upgrade (ADR 0009 § Decision
    // Errata 2): arbitrate v2 substring-matches the `signals` array trigger →
    // priority=80 search-academic-or-batch-or-token-sensitive now hits (was v1
    // fallthrough to search-default). SAMPLES.md § 8.1 v2 errata mapping.
    expected_rule_id: 'search-academic-or-batch-or-token-sensitive',
    expected_primary_expert: 'exa-mcp',
  },
  {
    id: 'search-5',
    category: 'search',
    task: { task_type: 'search', signals: ['批量 URL', 'token-sensitive'] },
    // Phase 1.5 T6.4 — F42 array semantic match upgrade (same as search-4):
    // `批量 URL` / `token-sensitive` are signals on the priority=80 academic
    // rule → now hits.
    expected_rule_id: 'search-academic-or-batch-or-token-sensitive',
    expected_primary_expert: 'exa-mcp',
  },

  // 2.5 Meta (5)
  {
    id: 'meta-1',
    category: 'meta',
    task: { task_type: 'skill-creation' },
    expected_rule_id: 'meta-create-skill',
    expected_primary_expert: 'anthropics-skills-skill-creator',
  },
  {
    id: 'meta-2',
    category: 'meta',
    task: { task_type: 'skill-creation' },
    expected_rule_id: 'meta-create-skill',
    expected_primary_expert: 'anthropics-skills-skill-creator',
  },
  {
    id: 'meta-3',
    category: 'meta',
    task: { task_type: 'skill-discovery' },
    expected_rule_id: 'meta-find-skill',
    expected_primary_expert: 'vercel-labs-skills-find-skills',
  },
  {
    id: 'meta-4',
    category: 'meta',
    task: { task_type: 'skill-discovery' },
    expected_rule_id: 'meta-find-skill',
    expected_primary_expert: 'vercel-labs-skills-find-skills',
  },
  {
    id: 'meta-5',
    category: 'meta',
    task: { task_type: 'skill-cleanup' }, // no rule → fallback
    expected_rule_id: null,
    expected_primary_expert: null,
  },

  // 2.6 Engineering (5) — Phase 1.5 T6.4: engineering 5 specific rules (ADR
  // 0009 § Decision / D3). v1 baseline had 0 engineering rules → all fallback;
  // v2 yaml ships 5 specific rules keyed on `task_type: engineering` + a
  // `keywords` array trigger (F42 substring match). Each sample's prompt
  // carries exactly one rule's keyword. expected_primary_expert is null —
  // engineering rules carry `workflow` / `skills_overlay`, not a
  // `primary_expert` (base layer already installed; routing is phase-overlay).
  // SAMPLES.md § 8.2 v2 errata mapping.
  {
    id: 'eng-1',
    category: 'engineering',
    // discuss-feature keyword: 新功能
    task: {
      task_type: 'engineering',
      prompt: '实现登录接口 + JWT token refresh，这是个新功能启动',
    },
    expected_rule_id: 'engineering-discuss-feature',
    expected_primary_expert: null,
  },
  {
    id: 'eng-2',
    category: 'engineering',
    // execute-debug keywords: diagnose, 排错
    task: { task_type: 'engineering', prompt: '用 /diagnose 系统化排错 production 502' },
    expected_rule_id: 'engineering-execute-debug',
    expected_primary_expert: null,
  },
  {
    id: 'eng-3',
    category: 'engineering',
    // plan-architecture keyword: 架构 plan
    task: {
      task_type: 'engineering',
      prompt: '用 /improve-codebase-architecture 做架构 plan 健康检查',
    },
    expected_rule_id: 'engineering-plan-architecture',
    expected_primary_expert: null,
  },
  {
    id: 'eng-4',
    category: 'engineering',
    // verify-pr keyword: PR review
    task: {
      task_type: 'engineering',
      prompt: '重构 user service 模块后做 PR review，按 surgical changes 心法小步提交',
    },
    expected_rule_id: 'engineering-verify-pr',
    expected_primary_expert: null,
  },
  {
    id: 'eng-5',
    category: 'engineering',
    // execute-tdd keyword: TDD
    task: { task_type: 'engineering', prompt: 'TDD 实现 password validator (red-green-refactor)' },
    expected_rule_id: 'engineering-execute-tdd',
    expected_primary_expert: null,
  },
]

// ---- Test infrastructure ----------------------------------------------------

const RULES_PATH = join(process.cwd(), 'routing', 'decision_rules.yaml')

interface SampleResult {
  sample: Sample
  actual_rule_id: string | null
  actual_primary_expert: string | null
  hit: boolean
}

const results: SampleResult[] = []
let rules: Rule[] = []

function runSample(sample: Sample): SampleResult {
  const matched = arbitrate(rules, sample.task)
  const actual_rule_id = matched ? matched.id : null
  const actual_primary_expert = matched
    ? ((matched.decision.primary_expert as string | null) ?? null)
    : null
  const hit =
    actual_rule_id === sample.expected_rule_id &&
    actual_primary_expert === sample.expected_primary_expert
  return { sample, actual_rule_id, actual_primary_expert, hit }
}

// ---- Load production rules (single time) -----------------------------------

describe('Sample-driven routing accuracy — 30 sample (Pattern P)', () => {
  it('loads production routing/decision_rules.yaml', () => {
    const file = readFileSync(RULES_PATH, 'utf8')
    expect(file.length).toBeGreaterThan(0)
    rules = loadDecisionRules(RULES_PATH).rules
    expect(rules.length).toBeGreaterThan(0)
  })

  // Per-sample cells — 30 cell
  for (const sample of SAMPLES) {
    it(`${sample.id} (${sample.category}) → expected ${sample.expected_rule_id ?? '<fallback>'}`, () => {
      const r = runSample(sample)
      results.push(r)
      if (!r.hit) {
        // Failure drill-down — debug aid (Pattern P R3 mitigation Step 4)
        console.error(
          `[MISS] ${sample.id}: actual_rule_id=${r.actual_rule_id ?? 'null'} (expected=${sample.expected_rule_id ?? 'null'}); actual_primary=${r.actual_primary_expert ?? 'null'} (expected=${sample.expected_primary_expert ?? 'null'})`,
        )
      }
      expect(r.actual_rule_id).toBe(sample.expected_rule_id)
      expect(r.actual_primary_expert).toBe(sample.expected_primary_expert)
    })
  }
})

// ---- Per-category breakdown + total accuracy summary ------------------------

describe('Routing accuracy summary — per-category breakdown + ≥85% total (D1.4-10)', () => {
  // Re-compute results synchronously so summary doesn't depend on test ordering
  // (per-sample cells above push to `results` but ordering is loose).
  it('computes per-category breakdown + total accuracy', () => {
    rules = loadDecisionRules(RULES_PATH).rules
    const fresh = SAMPLES.map(runSample)
    const byCategory = new Map<string, { hit: number; total: number }>()
    for (const r of fresh) {
      const c = r.sample.category
      const acc = byCategory.get(c) ?? { hit: 0, total: 0 }
      acc.total += 1
      if (r.hit) acc.hit += 1
      byCategory.set(c, acc)
    }

    // Per-category accuracy report (R3 mitigation — cherry-pick defense)
    console.log('\n  === Routing Accuracy v0.1 (30 sample baseline) ===')
    for (const [cat, { hit, total }] of byCategory) {
      const pct = ((hit / total) * 100).toFixed(1)
      console.log(`  ${cat.padEnd(12)} ${hit}/${total}  (${pct}%)`)
      // Cherry-pick 防御: 单 category < 60% 视为预警 (但不 fail — total ≥ 0.85 是 hard gate)
      if (hit / total < 0.6) {
        console.warn(`  WARN: category '${cat}' below 60% — cherry-pick risk`)
      }
    }
    const totalHit = fresh.filter((r) => r.hit).length
    const accuracy = totalHit / fresh.length
    console.log(`  TOTAL        ${totalHit}/${fresh.length}  (${(accuracy * 100).toFixed(1)}%)`)

    // Hard gate — D1.4-10 lock
    expect(accuracy).toBeGreaterThanOrEqual(0.85)

    // Phase 1.5 T6.4 — specific rule match gate (D3 / R5). A "specific" match
    // is a sample whose expected_rule_id is a real rule (non-null) AND the
    // sample hit it. v1 baseline = 21/30; v2 (engineering 5 rules + F42 array
    // semantic match) target ≥ 27/30.
    const specificHit = fresh.filter((r) => r.hit && r.sample.expected_rule_id !== null).length
    console.log(`  SPECIFIC     ${specificHit}/${fresh.length}  (engineering 5 + F42 array)`)
    expect(specificHit).toBeGreaterThanOrEqual(27)
    // Total must still be a perfect 30/30 (fallback samples hit their null).
    expect(totalHit).toBe(30)
  })
})

afterAll(() => {
  // Sanity — inline truth table count must equal 30 (R3 frozen)
  expect(SAMPLES.length).toBe(30)
})
