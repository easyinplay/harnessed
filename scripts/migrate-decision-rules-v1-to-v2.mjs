#!/usr/bin/env node
// Phase 1.5 T4.2 — decision_rules.yaml v1 → v2 migration (idempotent, additive).
//
// IMPL NOTE — ADR 0009 § Decision + D-22 + W-6 phase 1.3 sister review. Mirrors
// scripts/migrate-manifest-v1-to-v2.mjs style. Additive-only: keeps every v1
// rule byte-for-identical, appends the 5 engineering rules + mattpocock_phases
// section + bumps `version` 1 → 2. IDEMPOTENT — re-running detects `version: 2`
// (with both additions present) and is a no-op. `--dry-run` prints to stdout
// without writing. Uses the `yaml` dep (parseDocument, comment-preserving) — no
// new dependency (D1.5-2 / D1.5-5). Preserves LF line endings (A8).
import { readFileSync, writeFileSync } from 'node:fs'
import { parseDocument } from 'yaml'

const FILE = 'routing/decision_rules.yaml'
const DRY = process.argv.includes('--dry-run')

// v2 additive payload — engineering 5 rules + mattpocock_phases (D1.5-3 真理
// source: ~/.claude/CLAUDE.md). Kept as plain JS so the merge stays declarative.
const ENGINEERING_RULES = [
  {
    id: 'engineering-discuss-feature',
    priority: 60,
    domain: 'engineering',
    when: { task_type: 'engineering', keywords: ['新功能', 'feature 启动', 'discuss feature'] },
    decision: {
      workflow: 'gstack-decision-gate',
      skills_overlay: { ref: 'mattpocock_phases.discuss.skills' },
      gstack_gates: ['office-hours', 'plan-ceo-review'],
      rationale: '新功能启动 — gstack 决策关卡先行 + discuss 阶段招式 overlay',
    },
  },
  {
    id: 'engineering-plan-architecture',
    priority: 60,
    domain: 'engineering',
    when: { task_type: 'engineering', keywords: ['架构 plan', 'architecture plan', 'design'] },
    decision: {
      workflow: 'gsd-plan-phase',
      skills_overlay: { ref: 'mattpocock_phases.plan.skills' },
      gstack_gates: ['plan-eng-review'],
      rationale: '架构 plan — gsd plan-phase + 复杂架构 gstack eng review',
    },
  },
  {
    id: 'engineering-execute-tdd',
    priority: 60,
    domain: 'engineering',
    when: { task_type: 'engineering', keywords: ['TDD', 'test first', 'core logic', 'algorithm'] },
    decision: {
      workflow: 'gsd-execute-task',
      skills_overlay: { ref: 'mattpocock_phases.execute.skills' },
      triggers: {
        complexity_threshold: 5,
        category_match: ['core_business_logic', 'algorithm', 'high_reliability'],
        tdd_required: true,
      },
      rationale: '核心逻辑/算法 — gsd execute-task + TDD red-green-refactor 强制',
    },
  },
  {
    id: 'engineering-execute-debug',
    priority: 60,
    domain: 'engineering',
    when: { task_type: 'engineering', keywords: ['debug', 'bug', 'diagnose', '排错'] },
    decision: {
      workflow: 'gsd-execute-task',
      skills_overlay: { ref: 'mattpocock_phases.execute.skills' },
      primary_skills: ['diagnose', 'zoom-out'],
      rationale: '系统化排错 — gsd execute-task + diagnose/zoom-out 招式主导',
    },
  },
  {
    id: 'engineering-verify-pr',
    priority: 60,
    domain: 'engineering',
    when: { task_type: 'engineering', keywords: ['PR review', 'code review', 'ship', 'release'] },
    decision: {
      workflow: 'gsd-verify-work',
      skills_overlay: { ref: 'mattpocock_phases.verify.skills' },
      gstack_gates: ['review', 'code-review'],
      rationale: 'PR 审查/ship — gsd verify-work + gstack Paranoid Staff Engineer review',
    },
  },
]
const MATTPOCOCK_PHASES = {
  discuss: {
    skills: ['grill-with-docs', 'to-prd', 'grill-me', 'explore'],
    triggers: [
      '/grill-with-docs',
      '/to-prd',
      '/grill-me',
      '/explore',
      '澄清规格',
      '沉淀 PRD',
      '拷问我',
      '探索方案',
    ],
  },
  plan: {
    skills: ['to-issues', 'grill-me', 'design-review'],
    triggers: ['/to-issues', '/grill-me', '/design-review', '拆任务', 'design review'],
  },
  execute: {
    skills: [
      'tdd',
      'diagnose',
      'zoom-out',
      'caveman',
      'grill-with-docs',
      'playwright-cli',
      'improve-codebase-architecture',
    ],
    triggers: [
      '/tdd',
      '/diagnose',
      '/zoom-out',
      '/caveman',
      '/grill-with-docs',
      '/playwright-cli',
      '/improve-codebase-architecture',
      'TDD',
      '诊断',
      '陌生模块',
      '架构健康',
    ],
  },
  verify: {
    skills: ['qa', 'review', 'code-review', 'cso', 'security-review', 'retro', 'ship'],
    triggers: [
      '/qa',
      '/review',
      '/code-review',
      '/cso',
      '/security-review',
      '/retro',
      '/ship',
      'QA',
      'Paranoid Staff Engineer',
      'code review',
      '安全审查',
      'ship',
    ],
  },
}

const doc = parseDocument(readFileSync(FILE, 'utf8'))
const version = doc.get('version')
const rules = doc.get('rules')
const hasEng = rules?.items?.some((r) => String(r.get?.('id') ?? '').startsWith('engineering-'))
const hasPhases = doc.has('mattpocock_phases')

if (version === 2 && hasEng && hasPhases) {
  console.log(
    `[migrate] ${FILE} already v2 (engineering rules + mattpocock_phases present) — no-op (idempotent).`,
  )
  process.exit(0)
}

doc.set('version', 2)
if (!hasEng) for (const rule of ENGINEERING_RULES) rules.add(doc.createNode(rule))
if (!hasPhases) doc.set('mattpocock_phases', doc.createNode(MATTPOCOCK_PHASES))

const out = doc.toString()
if (DRY) {
  console.log(out)
  console.log('[migrate] --dry-run — no file written.')
} else {
  writeFileSync(FILE, out, 'utf8')
  console.log(
    `[migrate] ${FILE} migrated v1 → v2 (additive: ${ENGINEERING_RULES.length} engineering rules + mattpocock_phases).`,
  )
}
