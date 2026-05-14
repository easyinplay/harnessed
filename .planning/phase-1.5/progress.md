# Phase 1.5 Progress

> 最后更新: 2026-05-14 — Wave D.1 initial state (plan-phase complete, execute-phase 启动准备)
> Phase: v0.1.0 Phase 1.5 — DAG Resolver + Semantic Router L2 + engineering 23 招式 phase routing
> 状态: 🔄 execute-phase 待启动

---

## § A Current Status

### Plan-phase 完成情况

| Wave | 产出 | 状态 | commit |
|------|------|------|--------|
| A.R1 PATTERNS.md | 165L — 9 新文件 mapping + 4 新生 Pattern Q/R/S/T + 8 决策提案 D-19~D-26 | ✅ | `09fd1a6` |
| A.R2 RESEARCH.md | 571L HIGH conf — 5 P0 lock + ralph-wiggum XML wrapper fresh 发现 | ✅ | `09fd1a6` |
| B.1 ASSUMPTIONS.md | 173L — 5 P0 lock + D-19~D-26 reuse + D1.5-1~15 追溯 + R1-R6 风险 | ✅ | `99b1c2d` |
| B.2 PLAN.md | 240L — 8-Wave 拓扑 + 29 atomic + 8 接口契约 + D1-D8 复现命令 | ✅ | `99b1c2d` |
| B.3 task_plan.md | 851L — 29 atomic 子任务 / 8 wave / 每 task 验收 + 决策来源 | ✅ | `99b1c2d` |
| C.1 PLAN-CHECK.md | APPROVED zero BLOCKER / W-1+W-2 WARNING / S-1+S-2 SUGGESTION | ✅ | pending |

**PLAN-CHECK verdict**: APPROVED — 零 BLOCKER。W-1/W-2 由 T8.1/T5.2 execute 阶段自然吸收（AA 全 accept 决定）。

### Execute-phase 启动状态

- **Batch 1**: Wave 0 (T1.1 ADR 0009 draft + T1.2 ci.yml A7 iter 1-9) + Wave 1 (T2.1 dag spike + T2.2 SPIKE-REPORT-2.md) — **待启动**
- **基线**: tests 291+2 skipped / ralphLoop.ts 66L / systemPrompt.ts 43L / engine.ts 170L / agentDefinition.ts 148L

---

## § B.1 8 支柱 Implementation Enforcement (持续)

| 支柱 | phase 1.5 实装目标 | execute 阶段 enforce |
|------|-------------------|---------------------|
| A1' gstack 6+ 角色 routing | engineering 5 rules (T4.1) | D3 acceptance bar verify |
| A2' gstack 双职责 | mattpocock_phases discuss/plan vs execute/verify 分段 (T4.1) | D4 schema verify |
| A3' GSD 环境质量 | A7 守恒 + CI 三平台 + iter 1-9 (T1.2 + T7.2) | D8 acceptance bar |
| A4' karpathy 4 心法 | phase 1.4 已 ship — continued | (continued) |
| A5' mattpocock 23 招式 phase routing | mattpocock_phases yaml v2 (T4.1) + spec.ts (T5.5) | D4 verify |
| A6' 心法+招式配对 | phase 1.4 已 ship — continued | (continued) |
| A7' brainstorming + TDD 触发规则 | spec.ts triggers 字段 (T5.5) | D5 verify |
| A8' 6 category × decision rules | engineering 5 rules + 30 sample ≥27/30 (T4.1+T6.4+T6.5) | D3 verify |

---

## § B.2 Findings Tracker

| ID | 来源 | 内容 | 状态 |
|----|------|------|------|
| W-1 | PLAN-CHECK | STATE.md line 11 "7 接口契约" → "8 接口契约" | ⏳ T8.1 自然吸收 |
| W-2 | PLAN-CHECK | ralphLoop.ts 66L + T5.2 XML wrapper → 预测 ~76L；需 hard split lib/promiseExtract.ts | ⏳ T5.2 自然吸收 |
| S-1 | PLAN-CHECK | systemPrompt.ts ≤80L budget → ≤60L (actual 43L) | ⏳ T5.1 cherry-pick |
| S-2 | PLAN-CHECK | T6.4/T6.5 action outline 补 3 步骤 | ⏳ execute 时 inline |

---

## § A.4 Batch 执行进度

### Batch 1 — Wave 0+1 (T1.1 + T1.2 + T2.1 + T2.2)

| Task | 文件 | 状态 | Notes |
|------|------|------|-------|
| T1.1 | `docs/adr/0009-routing-l2-engineering-23-shi-errata.md` | ⏳ | Draft ≥100L 6-section 含 4 errata items |
| T1.2 | `.github/workflows/ci.yml` A7 step iter 1-9 | ⏳ | grep `adr-.*-accepted` = 9 |
| T2.1 | `scripts/spike/dag-and-promise-xml.sh` | ⏳ | Spike Kahn 5 manifest + XML wrapper |
| T2.2 | `.planning/phase-1.5/SPIKE-REPORT-2.md` | ⏳ | ≥50L verdict GO |

### Batch 2 — Wave 2+3 (T3.1~T4.3)

| Task | 文件 | 状态 |
|------|------|------|
| T3.1 | `src/routing/dag.ts` (≤200L Kahn) | ⏳ |
| T3.2 | `src/routing/semanticRouter.ts` (≤150L stub) | ⏳ |
| T3.3 | `src/routing/lib/embedding.ts` (≤30L placeholder) | ⏳ |
| T3.4 | `src/routing/engine.ts` 升级 | ⏳ |
| T3.5 | `src/routing/index.ts` barrel | ⏳ |
| T4.1 | `routing/decision_rules.yaml` v1→v2 | ⏳ |
| T4.2 | `scripts/migrate-decision-rules-v1-to-v2.mjs` | ⏳ |
| T4.3 | `src/routing/decisionRules.ts` 升级 (arbitrate ≤30L) | ⏳ |

### Batch 3 — Wave 4+5 (T5.1~T6.5)

| Task | 文件 | 状态 |
|------|------|------|
| T5.1 | `src/routing/systemPrompt.ts` XML wrapper | ⏳ |
| T5.2 | `src/routing/lib/ralphLoop.ts` XML wrapper (+ lib/promiseExtract.ts W-2) | ⏳ |
| T5.3 | `src/routing/agentDefinition.ts` 12→14 字段 | ⏳ |
| T5.4 | `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 errata | ⏳ |
| T5.5 | `src/manifest/schema/spec.ts` phase enum + triggers | ⏳ |
| T6.1 | `tests/unit/routing-dag.test.ts` (≥10 cell) | ⏳ |
| T6.2 | `tests/unit/routing-semanticRouter.test.ts` (≥8 cell) | ⏳ |
| T6.3 | `tests/unit/routing-engine.test.ts` 升级 | ⏳ |
| T6.4 | `tests/integration/routing-30-samples.test.ts` 升级 | ⏳ |
| T6.5 | `.planning/phase-1.4/SAMPLES.md` v2 update (9 sample) | ⏳ |

### Batch 4 — Wave 6+7 final ship (T7.1~T8.4)

| Task | 文件 | 状态 |
|------|------|------|
| T7.1 | `.planning/phase-1.5/PERF-ATTRIBUTION-2.md` (≥80L) | ⏳ |
| T7.2 | CI 三平台全绿 verify + push | ⏳ |
| T7.3 | (可选 hotfix) | — |
| T8.1 | `.planning/STATE.md` 更新 phase 1.5 SHIPPED (W-1 fix inline) | ⏳ |
| T8.2 | `.planning/phase-1.5/VERIFICATION.md` (≥150L) | ⏳ |
| T8.3 | `git tag adr-0009-accepted` + `git tag v0.1.0-alpha.5-routing-l2-engineering` | ⏳ |
| T8.4 | `.planning/ROADMAP.md` phase 2.0 prereq notes | ⏳ |
