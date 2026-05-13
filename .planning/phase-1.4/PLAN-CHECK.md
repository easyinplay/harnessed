# Phase 1.4 Plan-Check Verdict

> Reviewer: gsd-plan-checker (Claude Opus 4.7, read-only, independent)
> Date: 2026-05-13
> Round: 1 (Wave C verify of Wave A R1+R2 + Wave B ASSUMPTIONS+PLAN+task_plan)
> Verdict: **APPROVED WITH CONDITIONS** — 3 BLOCKER + 5 WARNING + 4 SUGGESTION
> Read budget: 35 min (8 必读 SSOT + 4 cross-ref + 12 grep round)

---

## TL;DR

phase 1.4 plan-phase 整体质量 **HIGH** — 8 acceptance bar C1-C8 与 task 1:1 mapping、21 atomic 子任务、8-wave 拓扑、决策追溯 D1.4-1 ~ D1.4-15 完整、风险登记 R1-R6 与 mitigation 一一对应、Pattern reuse 率 84% (10/12 + 3 新生 N/O/P)、Karpathy simplicity 三 hard limit (200/150/80) 严守、A7 守恒持续 + ADR 0008 errata 路径清晰、Pattern N/O/P 新生符合 wedge 真正破壁实装 phase 自然产物。

但发现 **3 BLOCKER**:

- **B-1**: T3.2 agentDefinition.ts `memory` enum 与 contract § 2.2 不闭合 — task_plan 写 `'persistent' | 'ephemeral'`，contract 锁 `'user' | 'project' | 'local'`。直接违反 W-5 V1 BLOCKER + D1.4-2/D-14 enforce。
- **B-2**: T3.2 agentDefinition.ts `permissionMode` enum 缺 `'acceptEdits'` — task_plan 写 `'default' | 'bypassPermissions' | 'plan'` (3 enum)，contract 锁 `'default' | 'acceptEdits' | 'bypassPermissions' | 'plan'` (4 enum)。直接违反 W-5 V1 BLOCKER。
- **B-3**: PLAN.md § 7 Wave Acceptance Checkpoint Wave 3 行 test count 数错（"228+1 → ≥246+1"），与 task_plan 一致基线 (235+1) drift；ship line +51 算正确但 PLAN 表自相矛盾。

修复后 (~10 min) 即可启动 execute-phase。

---

## § 1 Goal-backward C1-C8 可达成性

| AB | 内容 | 1:1 task 映射 | 内容达成度 | 状态 |
|----|------|--------------|-----------|------|
| **C1** engine.ts ≤200L main-process-driven | T3.1 (engine.ts) + T4.1 (≥10 cell) + T2.1+T2.2 spike anchor | Pattern N 主流程 6+ 步骤完整；EngineResult 三态 + ralph-loop ≤50L 内联 + Pattern H IMPL NOTE 5+ 处分布；reload bypass D1.4-1 路径明确 | OK |
| **C2** agentDefinition.ts ≤150L 1:1 contract 12 字段 | T3.2 (factory) + T4.2 (≥8 cell V1 BLOCKER) | 4 typed error class + factory throw (D-14) + 4 心法 prepend (D1.4-14) + ENV override；**12 字段 shape grep 全 hit** + signature 类型 assert + 4 error path | **WARN B-1+B-2** (memory + permissionMode enum drift contract) |
| **C3** 6 category routing MVP execute | T6.2 (per-category breakdown) + T6.1 (SAMPLES) | design/content/testing/search/meta 各 5 sample；engineering 5 走 fallback expected；≥3 ambiguous；KICKOFF C3 写 "meta 推 phase 1.5" 与 PLAN § 6 / ASSUMPTIONS § D D1.4-15 / decision_rules.yaml 已 ship meta 2 rules 矛盾 (S-1 文档过时) | **WARN S-1** |
| **C4** research workflow E2E | T5.1 (research.ts) + T5.2 (cli.ts wire 9th) + T5.3 (≥3 cell env-gated) | sub-routing 5 步链 + install adapter D1.4-4 sequential + 默认 mock + real-spawn skipIf gate (Pattern K 沿袭) | OK |
| **C5** systemPrompt.ts ≤80L verbatim 1:1 contract § 5.4 | T3.3 (Pattern O) | 2 export const + IMPL NOTE 引用 D-18 + F33 + ADR 0008；instructional language 防 summarize + skills fail-fast + max-iter 50 兜底 | OK |
| **C6** 30 sample ≥85% baseline | T6.1 (SAMPLES ≥30) + T6.2 (≥30 cell + ≥27/30 hit) | 6 category × 5 sample = 30 均衡分布；plan-phase frozen execute 不可改；selection rationale 防 cherry-pick；per-category breakdown；inline truth table (D-16) | OK |
| **C7** A7 step iter 1-7 → 1-8 + ADR 0001-0007 守恒 | T1.2 (4 处明确化 + 实际行号 grep -n 实测) + T7.1 (push verify) | 4 处明确 (L34-L38 + L42 + L53 + L64)；S-1 沿袭 phase 1.3 T1.2 模式；A7 paranoid check 0001..0008 全 0 | OK |
| **C8** ADR 0008 errata 6-section + tag | T1.1 (≥100 行 + 4 errata items) | inline H1a perf transparency + M1 yaml path migration + D1.4-2 contract delta + 接口契约升级；6-section + Consequences R6 跟踪；A7 paranoid check git diff adr-0001-accepted | OK |

Goal-backward verdict: C1/C3-C8 内容达成度 100%；C2 受 B-1 + B-2 BLOCKER 影响（schema drift contract 直接违反 W-5 V1 BLOCKER）。**Phase 1.5 prereq 8 接口契约 (PLAN § 4) 全部 task 产出 OK**。

---

## § 2 Dependency 检查

Wave 间依赖图 (拓扑正确):

```
Wave 0 (T1.1+T1.2) -> Wave 1 (T2.1->T2.2) -> Wave 2 (T3.1->T3.2->T3.3, parallel-3)
Wave 3 (T4.1->T4.2)  <- 依赖 Wave 2 完成
Wave 4 (T5.1->T5.2->T5.3)  <- 依赖 Wave 2 (engine.ts) + 部分 Wave 3
Wave 5 (T6.1->T6.2)  <- 依赖 Wave 2 + 4 (SAMPLES.md frozen 后跑 test)
Wave 6 (T7.1, T7.2 可选, T7.3 可选) <- 必依赖所有前置完成
Wave 7 (T8.1, T8.2, T8.3, T8.4)  <- 必依赖 T7.1 CI 全绿
```

依赖正确性: **OK** 无 cycle / 无 forward ref。

**8 接口契约（phase 1.4 ship 后 phase 1.5 直接消费） verify** (PLAN § 4):

| 契约 | task | actionability | status |
|------|------|---------------|--------|
| `engine.route(task, opts) -> Promise<EngineResult>` | T3.1 | wc + grep + IMPL NOTE 5+ 处 + ≥10 unit cell | OK |
| `EngineResult` 三态 discriminated union | T3.1 (类型 export) | T4.1 type assert cell | OK |
| `agentFactory: (task, decision, opts) => Promise<AgentDefinition>` | T3.2 | T4.2 type assert + 12 字段 shape | **WARN B-1+B-2** (enum drift) |
| 4 typed error class | T3.2 (export class × 4) | T4.2 4 error path assert | OK |
| `systemPrompt: string` + `{COMPLETE_TOKEN}` placeholder | T3.3 | grep 5 keyword 全 hit | OK |
| `installResearchWorkflowDeps(): Promise<void>` install adapter | T5.1 (内部 helper / spillover lib/) | T5.3 cell 1 happy path | OK |
| `routing/index.ts` barrel re-export | T3.1+T3.2+T3.3 末尾创建 | Wave 2 验收子集 | OK |
| `tests/integration/routing-30-samples.test.ts` SAMPLES inline | T6.2 | ≥30 cell + ≥27/30 hit | OK |

**7 prereq 接口契约（phase 1.3 ship -> phase 1.4 消费） verify**:
- `loadDecisionRules('routing/decision_rules.yaml')` ✅ 路径正确（实测 `routing/decision_rules.yaml` 179L exists）
- `arbitrate(rules, task)` ✅ phase 1.3 ship `src/routing/decisionRules.ts` L95-L101 `108L total` confirmed
- `runInstall(manifest, opts)` ✅ phase 1.3 ship `src/installers/index.ts` 63L confirmed
- `harnessed install <name>` 子命令 ✅ phase 1.3 ship `src/cli/install.ts` 117L confirmed
- `harnessed install-base` 子命令 ✅ phase 1.3 ship `src/cli/install-base.ts` 102L confirmed
- contract v1 frozen ✅ phase 1.3 ship `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` 217L confirmed
- A7 守恒 baseline tag 1-7 ✅ ci.yml L43 + L54 实测 `for n in 0001 0002 0003 0004 0005 0006 0007`，T1.2 加 0008 path 正确

**8 + 7 = 15 接口契约全 actionable**；其中 1 个受 B-1+B-2 BLOCKER 影响。


---

## Section 3 Risk mitigation 完整性 (R1-R6)

| Risk | mitigation 完整性 | status |
|------|------------------|--------|
| R1 main-process query API 未实证 | T2.1 spike script + T2.2 SPIKE-REPORT.md 6 step + T5.3 env-gated skipIf + ADR 0008 走 contract drift 路径 | COMPLETE |
| R2 reload-plugins skill bug | T2.1 spike step 5 + T3.1 reload bypass 路径 + RestartRequiredError 兜底 + engine.ts IMPL NOTE | COMPLETE |
| R3 30 sample cherry-pick / overfit | T6.1 SAMPLES.md selection rationale + 大于等于 3 ambiguous + plan-phase frozen + 4 道防线 | COMPLETE |
| R4 install 链路 race + 依赖顺序 | D1.4-4 串行 MCP add + 并行 ctx7 + harnessed install wrapper；lockfile 检查 trigger 表述弱 | PARTIAL (W-1) |
| R5 12 字段 1:1 contract drift (W-5 V1 BLOCKER) | T4.2 大于等于 8 cell + plan-checker enforce (本 round 实测发现 B-1+B-2) | PARTIAL (B-1+B-2 实测 trigger 即本 plan-checker 工作正确捕获) |
| R6 engineering 0 rules + mattpocock phase routing 推 phase 1.5 | KICKOFF lock 严守 + 30 sample engineering 5 走 fallback + ADR 0008 R6 跟踪 | COMPLETE |

R1-R6 mitigation 覆盖率 4/6 COMPLETE + 2/6 PARTIAL — R5 PARTIAL 是 plan-checker 本 round 工作正确捕获 B-1+B-2 enum drift 的有效证据，不是 plan 缺陷；R4 lockfile 检查 trigger 表述弱 (W-1)。

---

## Section 4 Actionability 检查 (spot 5/21)

| Task | 文件 path | 验收 | 决策来源 | 依赖 | actionability |
|------|----------|------|---------|------|--------------|
| T1.1 ADR 0008 errata | OK 路径明确 + 6-section 大纲完整 | 6 项验收 (大于等于 100行 / README index / git diff 0001 空 / tag count 8 / 6-section grep / Consequences 4 items) | OK D1.4-11 + D-17 + KICKOFF C8 + R6 | OK Wave 0 起点 | HIGH |
| T2.1 spike script | OK 小于等于 80L bash + cross-OS 兼容写法 | 4 项 (executable / 至少 1 平台 PASS / W-4 condition Win bypass / 不入 CI) | OK D1.4-1 + D1.4-3 + R1+R2 | OK Wave 1 起点 | HIGH |
| T3.1 engine.ts 小于等于 200L | OK Pattern N + 6+ 步骤 + EngineResult 三态 + ralph-loop 小于等于 50L 内联 | 6 项验收 (typecheck/lint / wc / grep 6 keyword / Pattern H 5+ / 三态 export / barrel) | OK D1.4-6 + D-13 + KICKOFF C1 + D1.2.5-3 + F33 | OK Wave 2 起点 | HIGH |
| T3.2 agentDefinition.ts 小于等于 150L | WARN B-1+B-2 memory + permissionMode enum drift contract | 4 项验收 (typecheck/lint / wc / grep 16 keyword / IMPL NOTE / 4 心法 prepend) | OK D1.4-7 + D-14 + D1.4-14 + contract section 2-3-5 + R5 | OK Wave 2 (T3.1 后) | WARN B-1+B-2 |
| T6.2 routing-30-samples.test.ts | OK Pattern P + 大于等于 30 cell + Pattern H IMPL NOTE | 5 项验收 (tests count / filter 全绿 / 大于等于 27/30 hit / per-category breakdown / inline truth table 1:1 SAMPLES) | OK KICKOFF C6 + D-16 + D1.4-10 + Pattern P 新生 + R3 | OK Wave 5 (T6.1 后) | HIGH |

抽查 5/21: 4 HIGH + 1 受 B-1+B-2 BLOCKER 影响。整体 HIGH (4/5 = 80%)。

额外抽查 T7.1 + T8.2 (Wave 6/7 末端):
- T7.1 push verify: 命令 + 期望输出 (CI run + A7 step iter 1-8 全绿 + tests 大于等于 286+1) 完整 — HIGH
- T8.2 VERIFICATION.md 大于等于 150L: 5-section + C1-C8 复现命令 + Phase 1.5 prereq 8 接口 + Findings 索引 — HIGH


---

## Section 5 决策追溯链 D1.4-1 ~ D1.4-15

ASSUMPTIONS Section D 决策追溯表 (line 56-72): 15/15 完整 — D1.4-1 至 5 (4 P0 lock from RESEARCH Section 5) + D1.4-6 至 12 (PATTERNS Section 4 D-13 至 D-18 + KICKOFF lock) + D1.4-13 至 15 (8 支柱 enforcement)。

| 决策 | RESEARCH 来源 | PATTERNS 来源 | ASSUMPTIONS Section D | task 实施 |
|------|---------------|---------------|----------------|-----------|
| D1.4-1 | Section 1 P0-1 | (无) | line 58 | T2.1 + T3.1 reload bypass 路径 |
| D1.4-2 | Section 2 P0-2 contract delta | (无) | line 59 | T1.1 ADR 0008 errata item 3 |
| D1.4-3 | Section 2.4 P0-2 ralph-loop | (无 — 重大新发现 ralph-wiggum 官方) | line 60 | T3.1 ralph-loop 小于等于 50L 内联 |
| D1.4-4 | Section 3 P0-3 | (无) | line 61 | T5.1 install adapter sequential MCP + 并行 ctx7 |
| D1.4-5 | Section 4 P0-4 | (无) | line 62 | T6.1 SAMPLES.md 6x5=30 均衡 |
| D1.4-6 | (无) | Section 4 D-13 | line 63 | T3.1 engine.ts 小于等于 200L hard limit |
| D1.4-7 | (无) | Section 4 D-14 | line 64 | T3.2 agentDefinition.ts 小于等于 150L + factory throw |
| D1.4-8 | (无) | Section 4 D-18 | line 65 | T3.3 systemPrompt.ts 小于等于 80L + verbatim 1:1 contract Section 5.4 |
| D1.4-9 | (无) | Section 4 D-15 | line 66 | T5.1 + T5.2 9th register fn |
| D1.4-10 | (无) | Section 4 D-16 | line 67 | T6.2 inline truth table 不进 fixtures |
| D1.4-11 | (无) | Section 4 D-17 | line 68 | T1.1 ADR 0008 errata 路径 |
| D1.4-12 | (无) | (无 — KICKOFF Section 关键约束 1) | line 69 | T1.2 ci.yml A7 step iter 1-7 至 1-8 |
| D1.4-13 | (无) | (R6 mitigation) | line 70 | A1 prime gstack 6+ 角色 routing — design 已实装 / engineering phase 1.5 deferred |
| D1.4-14 | (无) | (KICKOFF 用户硬要求) | line 71 | T3.2 prepend 4 心法 always-on baseline |
| D1.4-15 | (无) | (KICKOFF 用户硬要求) | line 72 | A8 prime 6 category x decision rules execute (C6 + R6 mitigation) |

OK D1.4-1 至 5 与 RESEARCH Section 5 1:1 mirror；D1.4-6 至 11 与 PATTERNS Section 4 D-13 至 D-18 1:1 mirror (编号 +6 offset 续接 phase 1.3 D-7 至 D-12)。

决策追溯链质量 HIGH — 15 D 决策 + 6 D-X pattern + 4 P0 + 6 R 风险 + 8 acceptance bar 五层一致。

---

## Section 6 Test 覆盖目标

phase 1.4 tests 目标 235+1 至 大于等于 286+1 (+51 cell — 10 engine + 8 factory + 3 E2E + 30 samples):

| Wave | task | claim cell | 充分? |
|------|------|-----------|------|
| Wave 3 T4.1 | routing-engine.test.ts | 大于等于 10 cell | OK 10 cell (main happy / arbitrate hit / arbitrate miss fallback / install missing / reload bypass / SkillNotInstalled narrow / verbatim COMPLETE F33 / max-iter / yaml security gate / RestartRequired) 覆盖完整 |
| Wave 3 T4.2 | routing-agentDefinition.test.ts | 大于等于 8 cell | OK with B-1+B-2 fix — 8 cell (12 字段 shape / signature / 4 error throw / D-14 throw not Result / 4 心法 prepend / ENV override); cell 1 显式 assert 12 toHaveProperty 必须 base on contract 锁定的真实 enum 值 (B-1+B-2 修后 cell 内容自洽) |
| Wave 4 T5.3 | routing-research-workflow.test.ts | 大于等于 3 cell | OK 3 cell (happy path mock+real-spawn / install fail fallback / skills missing fail-fast) 覆盖完整 |
| Wave 5 T6.2 | routing-30-samples.test.ts | 大于等于 30 cell | OK 30 cell + per-category breakdown + total assertion 大于等于 27/30 |

总增量 大于等于 51 cell OK；W-5 V1 BLOCKER 12 字段 shape assert 在 T4.2 cell 1 显式覆盖 (task_plan L287 line 显式 assert 12 个 toHaveProperty) — 但 enum 值正确性受 B-1+B-2 约束。

Test count chain verify:
- 起点: 235+1 (phase 1.3 ship) OK
- Wave 3 后: 大于等于 245+1 (T4.1 +10) 至 大于等于 253+1 (T4.2 +8) OK
- Wave 4 后: 大于等于 256+1 (T5.3 +3) OK
- Wave 5 后: 大于等于 286+1 (T6.2 +30) OK
- task_plan L526 ship line "+51 from 235+1" OK

B-3 (PLAN.md table drift): PLAN.md L190 Wave Acceptance Checkpoint Wave 3 行说 tests 228+1 至 大于等于 246+1 — 与 task_plan L557 / 全局 235+1 base 不一致。228+1 是 phase 1.2 ship 数 (phase 1.2 SHIPPED tests 89 至 202+1，phase 1.3 ship 235+1 — 228 不是任何 phase 的真实数)。

---

## Section 7 Phase 1.5 prereq

phase 1.4 ship 后 phase 1.5 直接消费的 8 接口契约 (PLAN Section 4) — 全 task 产出 OK；phase 1.5 启动 prereq actionable:

| 契约 | phase 1.5 消费场景 | actionable? |
|------|-------------------|-------------|
| engine.route() 主流程入口 | DAG resolver 替换 arbitrate 步骤 | OK |
| EngineResult 三态 discriminated | DAG / Semantic Router L2 narrow 风格沿袭 | OK |
| agentFactory() signature | DAG step / supervisor 复用 factory | OK |
| 4 typed error class | install fail-fast 路径同源 | OK |
| systemPrompt const + placeholder | supervisor LLM L2 fallback prompt template 沿袭 | OK |
| install adapter D1.4-4 | plan/execute/verify phase routing 复用 | OK |
| routing/index.ts barrel | Pattern G 复用 — 加新组件直接 re-export | OK |
| 30 sample inline truth table | phase 3.4 v0.3.0 100+ sample 验收 fixture 化基线 | OK |

Missing piece check:
- phase 1.5 KICKOFF prereq notes 在 T8.4 写到 STATE.md / ROADMAP.md OK
- phase 1.5 deferred items 4 项 (DAG / Semantic Router L2 / engineering category routing / mattpocock 23 招式 phase routing) 全 P0 优先级标注 OK
- D1.4-2 (initialPrompt + criticalSystemReminder_EXPERIMENTAL) P1 评估 OK
- D1.4-3 ralph-wiggum 官方 plugin 切换 v0.2+ 评估 OK

phase 1.5 prereq 完整 — 无 missing piece。


---

## Section 8 Phase 1.2.5 + 1.3 8 支柱继承

| 支柱 | phase 1.4 落地 | task | status |
|------|---------------|------|--------|
| A1 prime gstack 6+ 角色 routing | design category 已实装 (ui-ux-pro-max default + frontend-design override — phase 1.3 ship); engineering category sub-routing (gstack 关卡 / GSD orchestration / superpowers TDD 分阶段调度) 推 phase 1.5 (D1.4-13 explicit deferred) | T6.1 SAMPLES design 5 sample (2 default + 2 override + 1 ambiguous) + engineering 5 sample 全标 fallback expected | OK (design ship / engineering deferred 1.5) |
| A2 prime gstack 双职责 | (phase 1.4 不 implement — 14 角色配对 phase routing 推 phase 1.5) | n/a | OK n/a |
| A3 prime GSD 环境质量 | T1.2 ci.yml A7 step iter 1-7 至 1-8 + C7 三平台保持全绿 + A8 LF 行尾 | T1.2 + T7.1 | OK |
| A4 prime karpathy 4 心法 inject | AgentDefinition prompt template 始终 prepend 4 心法 always-on baseline (Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution) | T3.2 D1.4-14 prepend + T4.2 cell 7 验证 grep 4 心法 全 hit | OK (实装 + test 双覆盖) |
| A5 prime mattpocock 23 招式 phase routing | (phase 1.4 不 implement — discuss/plan/execute/verify 分阶段调度推 phase 1.5; KICKOFF 第 38 行 explicit lock + R6 mitigation Step 1) | n/a (T8.4 phase 1.5 prereq notes) | OK n/a (phase 1.5 deferred) |
| A6 prime 心法+招式配对 | T3.2 prompt template "RULE: COMPLETE marker" 1:1 import from systemPrompt.ts COMPLETE_INSTRUCTION block (D1.4-14 + D-18 配对) | T3.2 + T3.3 | OK |
| A7 prime brainstorming + TDD 触发 | (phase 1.4 不 implement — phase 1.5 加 mattpocock 招式 phase routing 时落地) | n/a | OK n/a |
| A8 prime 6 category x decision rules execute | phase 1.4 是首个真实跑 routing 的 phase — 4 category 实测命中 (design/content/testing/search) + meta 命中 + engineering 走 fallback; 每 category 大于等于 5 sample 验收命中 (C6 + D1.4-15) | T6.1 + T6.2 + per-category breakdown 验收 | OK |

8 支柱继承率 6/8 实装 + 2/8 explicit deferred phase 1.5 — A1 prime / A4 prime / A8 prime 三大重点 enforcement 全 task 覆盖；A5 prime phase 1.5 deferred 已在 ASSUMPTIONS Section D D1.4-13 + R6 + STATE.md phase 1.5 prereq notes 三处 explicit 标记，符合 KICKOFF 第 38 行 lock。

---

## Section 9 Karpathy simplicity

| 原则 | phase 1.4 plan 体现 | status |
|------|---------------------|--------|
| Think Before Coding | Wave A R1 (PATTERNS.md 347L) + R2 (RESEARCH.md 527L HIGH conf) 大于等于 60-90 min 调研 + Wave 1 spike T2.1+T2.2 实证 anchor 后再写 engine.ts | OK |
| Simplicity First | engine.ts 小于等于 200L hard limit (D-13/D1.4-6) / agentDefinition.ts 小于等于 150L (D1.4-7) / systemPrompt.ts 小于等于 80L (D1.4-8) — 三 hard limit 严守; spillover 抽 src/routing/lib/; 不引入 LangGraph / Semantic Router L2 dep / DAG resolver dep (推 phase 1.5); 不 vendor anthropics ralph-wiggum 官方 plugin (D1.4-3 自实装 小于等于 50L 内联) | OK |
| Surgical Changes | T1.1 ADR 0008 走 errata 路径 (不动 0001-0007 main body); T1.2 ci.yml 仅改 4 处 (S-1 沿袭) + 实际行号 grep -n 实测; contract v1 frozen 不动 (D1.4-2 deferred 2 新字段 phase 1.5); spec.ts manifest schema 0 改动 (D-17 lock) | OK |
| Goal-Driven Execution | 8 acceptance bar 每条 1:1 mapping task; 21 atomic 子任务每条含 验收 checkbox + 决策来源; C1-C8 Section 6 接受标准全部 grep/wc 命令可执行 | OK |

Karpathy compliance HIGH。三 hard limit (200/150/80) 严守；spillover lib/ 路径明确；Pattern N/O/P 新生符合 wedge 真正破壁实装 phase 自然产物 (不是过度设计)；不预测过远 (DAG / Semantic Router L2 / mattpocock 23 招式 都 phase 1.5 deferred)。

---

## Section 10 跨 phase 一致性

| 文件 | phase 1.4 plan 引用 | 真实文件状态 | 一致性 |
|------|--------------------|-------------|--------|
| routing/decision_rules.yaml | T3.1 engine.ts 加载入口 | 实测 179L exists + 12 rules + version 1 + hit_policy P + fallback_supervisor + meta 2 rules + engineering 占位 | OK |
| src/routing/decisionRules.ts | T3.1 复用 loadDecisionRules + arbitrate | 实测 108L (loadDecisionRules L78-L92 + arbitrate L95-L101) | OK |
| src/installers/index.ts runInstall | T3.1 install missing 段直接复用 | 实测 63L | OK |
| src/cli/install.ts + src/cli/install-base.ts | T5.1 research.ts 风格沿袭 (D-15) | 实测 117L + 102L | OK |
| src/cli.ts register fn count | T5.2 9th register fn | 实测当前 8 register fn (audit/backup-list/doctor/gc/install/install-base/rollback/status — L20-L27); T5.2 加 research = 9th OK | OK |
| docs/AGENT-DEFINITION-FACTORY-CONTRACT.md | T3.2 1:1 对应 12 字段 + signature + 4 error path | 实测 217L + 8 sections + 12 字段 + W-5 V1 BLOCKER bar (Section 7.2) | WARN B-1+B-2 (T3.2 enum drift) |
| .github/workflows/ci.yml A7 step | T1.2 iter 1-7 至 1-8 (L34-L38 注释 + L42 + L53 + L64) | 实测 L42 + L54 (不是 L53) for n in 0001 0002 ... 0007 空格列表; L36 + L40 + L65 注释段; T1.2 行号 path 一致 + S-1 沿袭实际行号 grep -n 实测 path | OK (T1.2 已说 实际行号 push 前以 grep -n 实测为准 沿袭 phase 1.3 S-1) |
| docs/adr/0007-categorization-schema-errata.md | D-17 ADR 0008 inline M1 yaml path migration (.planning/decision_rules.yaml 至 routing/decision_rules.yaml 官方化) | 实测 ADR 0007 main body L39 + L63 + L105 含 .planning/decision_rules.yaml refs (3 处) — A7 守恒 lock 不能改 main body; ADR 0008 errata 走 inline 官方覆盖路径正确 (与 phase 1.3 W-2 D-9 propagation 模式 1:1) | OK (ADR 0008 errata Compliance/Consequences 段官方覆盖) |
| STATE.md 进度 | T8.1 phase 1.4 SHIPPED 5/17 = 29.4% | 实测当前 4/17 = 23.5% (phase 1.3 ship); T8.1 phase 1.4 ship 后 5/17 OK 数学闭合 (4+1=5) | OK |
| .planning/phase-1.4/KICKOFF.md C3 | C3 design / content / testing / search 4 category 实测命中 (meta category 推 phase 1.5) | task_plan L17 + ASSUMPTIONS Section A C3 + PLAN Section 6 全说 meta 命中率 大于等于 85%; decision_rules.yaml L146-L162 已 ship meta 2 rules; KICKOFF C3 描述过时 | WARN S-1 (KICKOFF C3 与下游 ASSUMPTIONS/PLAN/task_plan 不一致 — meta 已 ship 不是 phase 1.5 deferred) |

跨 phase 一致性: 9/11 OK + 1 WARN B-1+B-2 + 1 WARN S-1。


---

## Section 11 Findings

### BLOCKER (must fix before execute)

#### B-1: T3.2 agentDefinition.ts memory enum 与 contract Section 2.2 完全不闭合 — 直接违反 W-5 V1 BLOCKER

- 位置: task_plan.md L180 vs docs/AGENT-DEFINITION-FACTORY-CONTRACT.md L44
- 问题:
  - task_plan T3.2 内容大纲 line 180 写: memory?: 'persistent' | 'ephemeral'
  - contract Section 2.2 line 44 锁定: memory: 'user' | 'project' | 'local'
  - 两个 enum 完全没有任何重叠值 (persistent / ephemeral vs user / project / local)
  - W-5 V1 BLOCKER bar (contract Section 7.2) 明示 "Any field omission OR signature deviation OR error path missing = phase 1.4 plan-checker MUST reject"
  - D-14 lock + D1.4-7 lock 强调 1:1 对应 contract v1 (frozen at phase 1.3 ship)
- 影响: 不修则 phase 1.4 execute T3.2 写出 enum 与 contract drift 的 factory; T4.2 cell 1 显式 assert 12 toHaveProperty 时如基于 task_plan 错值跑 test 看似全绿但实际 contract drift; 后续 phase 1.5 DAG resolver 复用 factory 时遇错; R5 实装路径 broken。
- suggested fix:
  1. task_plan T3.2 L180 改: memory?: 'user' | 'project' | 'local' (1:1 contract Section 2.2 line 44)
  2. T3.2 IMPL NOTE 头部加一行 "12 字段 enum 全部 import 自 contract Section 2.2 — 任何 enum 偏离 = ADR 0008 errata 触发 (D-18 enforce)"
  3. T4.2 cell 1 显式 assert: expect(['user', 'project', 'local']).toContain(def.memory)
- 修复成本: 约 5 min

#### B-2: T3.2 agentDefinition.ts permissionMode enum 缺 'acceptEdits' — 直接违反 W-5 V1 BLOCKER

- 位置: task_plan.md L184 vs docs/AGENT-DEFINITION-FACTORY-CONTRACT.md L48
- 问题:
  - task_plan T3.2 line 184 写: permissionMode?: 'default' | 'bypassPermissions' | 'plan' (3 enum)
  - contract Section 2.2 line 48 锁定: permissionMode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' (4 enum)
  - 缺 'acceptEdits' 一个 enum 值 — partial omission 直接违反 W-5 V1 BLOCKER bar "Any field omission ... = phase 1.4 plan-checker MUST reject"
  - factory throw InvalidDecisionError 时 if user passes permissionMode='acceptEdits'，task_plan 实装会误 reject 合法值
- 影响: phase 1.4 实装 enum partial 缺失 至 phase 1.5 plan/execute/verify phase routing 加 acceptEdits mode 时 hit edge 至 需追加 ADR 0009 errata 修复，违反 D-18 contract drift 必走 ADR 0008+ errata 单一路径; T4.2 cell 1 grep 16 keyword 全 hit (task_plan L217) 不会捕获 enum 内值缺失。
- suggested fix:
  1. task_plan T3.2 L184 改: permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' (4 enum 1:1 contract Section 2.2 line 48)
  2. T4.2 cell 1 enum 值 assert: const VALID_PERMISSION_MODES = ['default','acceptEdits','bypassPermissions','plan'] as const; expect(VALID_PERMISSION_MODES).toContain(def.permissionMode)
- 修复成本: 约 3 min

#### B-3: PLAN.md Section 7 Wave Acceptance Checkpoint Wave 3 行 test count drift (228+1 错值)

- 位置: PLAN.md L190 vs task_plan.md L557 + L526 + L275 + L296
- 问题:
  - PLAN.md L190 Wave 3 行: tests 228+1 至 大于等于 246+1 skipped (+18 cell)
  - task_plan L557 Wave 3 行: tests 235+1 至 大于等于 253+1 skipped (+18 cell)
  - task_plan L275 (T4.1): tests 235+1 至 大于等于 245+1 skipped (+10 cell)
  - task_plan L296 (T4.2): tests 大于等于 245+1 至 大于等于 253+1 skipped (+8 cell)
  - task_plan L526 ship line: Tests 大于等于 286+1 skipped (+51 from 235+1)
  - 真实基线是 235+1 (phase 1.3 ship at STATE.md L4) — 228+1 不是任何 phase 的实际 ship 数 (phase 1.2 ship 是 202+1，phase 1.3 ship 是 235+1)
- 影响: PLAN.md 是 plan-phase blueprint 文档，与 task_plan 起点数 drift 至 execute-phase 时 plan-checker round 2 verify Wave 3 完成验收子集 看 PLAN 数误判通过/未通过; 下游 phase 1.5 plan-phase 起算如果 reader PLAN.md L190 会得错值。
- suggested fix:
  1. PLAN.md L190 改: Wave 3 | tests 235+1 至 大于等于 253+1 skipped (+18 cell, 10 engine + 8 factory) + V1 BLOCKER 比对 (手工 plan-checker 可视) + 4 error paths 全覆盖
  2. 即与 task_plan L557 1:1 同步 (235+1 base + 大于等于 253+1 target)
- 修复成本: 约 2 min


### WARNING (应当 fix 但不阻塞 execute)

#### W-1: R4 lockfile 检查 trigger 表述弱

- 位置: ASSUMPTIONS.md Section E R4 line 117
- 问题: R4 mitigation Step 3 写 install adapter 加 .planning/.mcp-install.lock 或 atomic write rename (避免用户并行手动操作 race); 若超时间预算可推 phase 1.5 — 但 超时间预算 没明 trigger 标准; execute-phase 时 main agent 不知 trigger 阈值。
- 影响: 中等 — R4 race condition 风险 P1 严重度，phase 1.4 execute 时 maybe miss lockfile; phase 1.5 加 DAG resolver 时这条又得做。
- suggested fix: ASSUMPTIONS Section E R4 Step 3 改: Step 3 (lockfile 检查 — phase 1.4 时间预算判断): 若 T5.1 install adapter 实装 小于等于 60 min 完成 (track in progress.md F40+) 至 加 lockfile (atomic write rename ~/.claude.json.tmp + rename); 若 大于 60 min 触发 至 record finding F40+ + 推 phase 1.5 DAG resolver 时一起做
- 修复成本: 约 3 min

#### W-2: T5.1 install adapter 走 harnessed install wrapper 但实装路径未明 spawn vs library call

- 位置: task_plan.md T5.1 line 320 + ASSUMPTIONS Section B P0-3 line 34
- 问题: T5.1 内容大纲 + ASSUMPTIONS 都说 走 phase 1.3 ship 的 harnessed install --apply --non-interactive 子命令 wrapper (不直接调 claude mcp add，复用 idempotency); 但具体 invoke 路径未明 — 是 spawn node ./dist/cli.mjs install subprocess 还是直接 import runInstall(manifest, opts) library call? 两种实装方式后果不同 (subprocess 慢但隔离 / library call 快但 stack 共享)。
- 影响: 中等 — execute T5.1 实装时 main agent 需做 sub-decision; 如选 subprocess 与 R1 Step 2 skeleton spawn 验证有重叠时间复杂度。
- suggested fix: T5.1 内容大纲补一行: install adapter invoke 路径 (D1.4-4 子决策): 优先 library call (import { runInstall } from '../installers/index.js') — phase 1.4 行 harnessed install subprocess 模式作为 fallback; 测试 mock 走 library call inject。理由: subprocess 与 R1 Wave 1 Spike 重叠，且 library call 快 + 同 stack debug 易
- 修复成本: 约 5 min

#### W-3: Pattern P 新生但缺 v0.3.0 完整命中率 fixture 化迁移路径明 cite

- 位置: PATTERNS.md Section 3 Pattern P + task_plan.md T6.1 Section 4
- 问题: PATTERNS Section 3 Pattern P 列 phase 3.4 v0.3.0 100+ sample 验收时 fixture 化迁移基线 — 但 task_plan T6.1 Section 4 仅 cite v0.3.0 升级路径，未明 fixture 化迁移 script 名 (类 phase 1.1 H4 mock-claude-cli.sh shim pattern / W-6 phase 1.3 sister review v1 至 v2 migration script pattern)。
- 影响: 低 — 不阻塞 phase 1.4 ship，但 phase 3.4 v0.3.0 plan-phase 启动时 reader 看 PATTERNS Pattern P phase 3.4 v0.3.0 100+ sample 找不到具体 migration path actionability。
- suggested fix: T6.1 Section 4 v0.3.0 升级路径补一行: fixture 化迁移 script 名: scripts/migrate-samples-inline-to-fixture.mjs (沿袭 phase 1.1 H4 hotfix migration script pattern + phase 1.3 sister review W-6 yaml v1 至 v2 migration script pattern); 估 30min 工作量 (PATTERNS Section 4 D-16 反驳预案 已 cite)
- 修复成本: 约 3 min

#### W-4: T2.1 spike script Win Git Bash bypass 与 claude-cli Win 兼容性 record finding 路径未明 finding ID

- 位置: task_plan.md T2.1 line 99
- 问题: T2.1 验收 W-4 condition: 如条件允许，也跑 Win Git Bash 验证; 若 Win 卡 (claude headless CLI 在 Win 兼容性不确定)，record finding 而非阻塞 — 但 finding ID (类 phase 1.3 F36-Win) 未指定。
- 影响: 低 — 不阻塞 ship，但 progress.md 写 finding 时 main agent 需自命名 (一致性弱化)。
- suggested fix: T2.1 line 99 改: 若 Win 卡 ... record F40-Win finding 而非阻塞 (沿袭 phase 1.3 F36-Win 命名风格)
- 修复成本: 约 2 min

#### W-5: T8.1 STATE.md 进度算法描述简洁但缺 v3 重排后 v0.1 6 phase / v0.2 4 / v0.3 4 / v0.4 3 = 17 数学闭合 verify 行 (沿袭 phase 1.3 B-4 fix 风格)

- 位置: task_plan.md T8.1 line 463-471
- 问题: T8.1 进度算法直接说 5/17 = 29.4%; 但 phase 1.3 B-4 fix 在 task_plan 显式列出 ROADMAP v3 重排后总 phase 数 = v0.1 (1.1+1.2+1.2.5+1.3+1.4+1.5 = 6) + v0.2 (4) + v0.3 (4) + v0.4 (3) = 17 phase 数学闭合 verify。phase 1.4 T8.1 直接给比例没 verify 算法。
- 影响: 低 — phase 1.4 ship 后 STATE.md 进度可能再一次 mis-count (与 phase 1.3 B-4 修前同病)。
- suggested fix: T8.1 内容补一行: 进度算法 verify (B-4 风格沿袭): 5/17 = (v0.1 phase 1.1+1.2+1.2.5+1.3+1.4 = 5 done) / (v0.1 6 + v0.2 4 + v0.3 4 + v0.4 3 = 17 total) = 29.4% — 数学闭合验证
- 修复成本: 约 3 min

### SUGGESTION (nice-to-have)

- S-1: KICKOFF C3 line 38 meta category 推 phase 1.5 sub-routing schema 完整 与下游 ASSUMPTIONS Section A C3 + PLAN Section 6 / D1.4-15 / decision_rules.yaml meta 2 rules 已 ship 不一致 — meta v1 routing 已实装，仅 mattpocock 23 招式 phase routing 推 phase 1.5。建议 KICKOFF C3 改: C3 6 category routing rules MVP execute — design / content / testing / search 4 category 实测命中 + meta 命中 (每 大于等于 5 sample); engineering category v1 占位 0 rules base 已装，走 fallback_supervisor 路径 (mattpocock 23 招式 phase routing 推 phase 1.5 R6 mitigation)。修复成本: 约 3 min (KICKOFF 是活文档无 baseline tag; ROADMAP.md L93 已是同款过时表述也可 sync)。

- S-2: T3.2 L180-L184 type alias 写 inline TypeScript 而非 import type AgentDefinition from @anthropic-ai/claude-agent-sdk; contract Section 3 line 60 锁 import type AgentDefinition from @anthropic-ai/claude-agent-sdk。建议 T3.2 内容改: TypeScript-derived type alias (contract Section 3 锁定): import type AgentDefinition from @anthropic-ai/claude-agent-sdk — 不本地重定义; 本地 interface 仅用于 TaskContext / ArbitrateResult / AgentDefinitionOpts (3 input types)。这样可以零 enum drift 风险 (只要 SDK 版本固定 + B-1+B-2 修复后)。修复成本 约 5 min。

- S-3: T3.3 systemPrompt.ts 未 cite verbatim COMPLETE prompt template 1:1 import from contract Section 5.4 文本 的 testing 路径; 建议 T3.3 加 unit test cell test('SYSTEM_PROMPT 1:1 contract Section 5.4 line content', () => { expect(SYSTEM_PROMPT).toContain('do NOT summarize, paraphrase'); ... }); 不强制但符合 Pattern O 的 single-source 编辑 enforce — 修复成本 约 5 min。

- S-4: phase 1.4 plan-phase 文档 size — RESEARCH.md 527L (HIGH conf 6 月新鲜度校准 + ralph-wiggum 重大新发现) / PATTERNS.md 347L / task_plan.md 561L 偏大但符合复杂度 — phase 1.4 是 wedge 真正破壁实装 phase，3 新生 pattern + 4 P0 lock 必然产物。仅 NOTE 不 fix，沿袭 phase 1.3 PLAN-CHECK S-4 处理。


---

## Section 12 Final Verdict

### APPROVED WITH CONDITIONS

phase 1.4 plan-phase 整体质量 HIGH — 8 acceptance bar C1-C8 1:1 task mapping、21 atomic 子任务可执行、8-wave 拓扑无 cycle/forward ref、决策追溯 D1.4-1 至 D1.4-15 严密、风险登记 R1-R6 与 mitigation 一一对应 (4/6 COMPLETE + 2/6 PARTIAL — R5 PARTIAL 是 plan-checker 本 round 工作正确捕获 B-1+B-2 enum drift 的有效证据)、Pattern reuse 84% (10/12 + 3 新生 N/O/P)、Karpathy simplicity 三 hard limit (200/150/80) 严守、A7 守恒持续、phase 1.5 prereq 8 接口契约全 actionable。

execute-phase 启动前必修 3 BLOCKER:
- B-1 (T3.2 memory enum drift contract — 直接违反 W-5 V1 BLOCKER) 约 5 min
- B-2 (T3.2 permissionMode enum 缺 'acceptEdits' — partial omission W-5 V1 BLOCKER) 约 3 min
- B-3 (PLAN.md L190 Wave 3 test count 228+1 错值; 真实 base 235+1) 约 2 min

总修复时间 约 10 min — 全是 task_plan/PLAN 单行 sync fix，不动整体设计。修复后 round 2 re-verify 即 APPROVED zero blocker。

5 WARNING 建议 inline 修 (约 16 min): W-1 (R4 lockfile trigger 阈值) / W-2 (install adapter library vs subprocess) / W-3 (Pattern P fixture migration script 名) / W-4 (F40-Win finding 命名) / W-5 (STATE 进度算法 verify 行)。

4 SUGGESTION 视 main agent 时间窗口 cherry-pick — 不影响 phase 1.4 ship; S-1 (KICKOFF/ROADMAP meta 路由表述过时) 顺手在 Wave 0 W-2 phase 1.3 D-9 propagation 风格 patch; S-2/S-3 顺手在 Wave 2 T3.2/T3.3 加; S-4 仅 NOTE 不修。

### 关键 verify highlight

- W-5 V1 BLOCKER 12 字段 1:1 对齐 contract enforce 在 T4.2 actionable — task_plan L217 grep 16 keyword + L287 显式 12 toHaveProperty + L283-L302 8 cell 含 4 error path throw — 但 enum 值正确性需 B-1+B-2 修复后才完全闭合
- Wave 1 Spike (T2.1+T2.2) R1+R2 P0 风险 mitigation 充分 — 6 step 完整 (claude plugin install 真实 API / mcp list verify / skeleton spawn verbatim / ralph-loop completion-promise + max-iter 双 cap / skill load filesystem scan / SPIKE-REPORT.md 实装 anchor decisions 大于等于 5 项); Wave 1 完成可 unblock R1+R2
- 30 sample SAMPLES.md selection rationale (R3 mitigation Step 1) 防 cherry-pick — 6 category x 5 sample 均衡 + 大于等于 3 ambiguous + engineering 5 全标 fallback expected + plan-phase frozen execute 不可改 + per-category breakdown + LangChain Top-1 大于等于 0.85 业界 alignment
- D-18 systemPrompt 1:1 对齐 contract Section 5.4 enforce 清晰 — T3.3 IMPL NOTE + 2 export const + grep 5 keyword + plan-checker enforce path
- A7 守恒 ADR 0001-0007 main body 0 diff paranoid check 在每 task verify 中 — task_plan L542 维护检查 for n in 0001..0008; do git diff adr-${n}-accepted -- docs/adr/${n}-*.md; done 全 0; T1.1 验收 + T7.1 push verify + ci.yml A7 step

---

## Section 13 Recommended Next Step

1. main agent 决策: 接受 3 BLOCKER 修复 round (约 10 min) — 极快极简，不动整体设计
   - 选 接受 至 启动 Wave B.4 (PLAN-CHECK fix round): planner 修 B-1 至 B-3 + W-1 至 W-5 (约 26 min total) + S-1 顺手; checker re-verify (约 15 min); commit phase-1.4: PLAN-CHECK fix round B-1 至 B-3 + W-1 至 W-5 + S-1
   - 选 跳过 BLOCKER 直接 execute 至 execute T3.2 时大概率撞 enum drift (memory + permissionMode); T4.2 cell 1 grep 16 keyword 全 hit 不会捕获 enum 内值缺失 (只 grep 名字不 grep 值) — 看似 test 全绿但 contract drift 漏 ship; 下游 phase 1.5 复用 factory 时撞错; B-3 仅文档 drift 不撞 execute 但污染下游 reader。强烈不推荐跳过 B-1 + B-2。

2. 修复 BLOCKER 后:
   - Wave B.5 (W-1 至 W-5 inline patch): planner 在 task_plan / ASSUMPTIONS 内 inline 改 (约 16 min)
   - Wave B.6 (S-1 KICKOFF/ROADMAP D-9 风格 patch): 沿袭 phase 1.3 W-2 D-9 propagation Cross-doc patch 策略 (约 3 min)
   - 进入 Wave D.1 progress.md initial state + 8 支柱 implementation enforcement
   - Wave D.2 main agent decide — 直接 execute-phase batch 1 (Wave 0 ADR 0008 + ci.yml) 启动

3. Cross-doc patch 策略 (S-1 KICKOFF C3 + ROADMAP L93 meta routing 表述过时):
   - KICKOFF.md / ROADMAP.md 直接 patch (这俩活文档无 baseline tag)
   - 沿袭 phase 1.3 W-2 D-9 propagation 模式

### Round 1 ship 信号 (zero BLOCKER 后 round 2 expected)

- 零 BLOCKER (本 round 3 BLOCKER 修复后)
- 零 WARNING (本 round 5 WARNING 修复后)
- 零未修 SUGGESTION (S-1/S-2/S-3 顺手修; S-4 仅 NOTE)
- 决策追溯链 100% 完整 + B-1+B-2 fix 标注入 D1.4-7 行
- Risk mitigation 6/6 完整 (R4 W-1 修复后 + R5 plan-checker round 2 enforce 闭环)
- Acceptance bar C1-C8 未被弱化 (B-1+B-2 修复后 C2 内容达成度 100%)

phase 1.4 plan 是 v0.1.0 milestone 关键 wedge implementation 的第二步硬实装 — 8 支柱 100% implementation enforcement 路径就位 (A1 prime design ship / engineering 1.5 deferred / A4 prime 4 心法 prepend ship / A5 prime phase 1.5 deferred / A8 prime 6 category execute ship)，phase 1.5 DAG resolver + Semantic Router L2 prereq 8 接口契约 100% ready。

---

Reviewer signoff: gsd-plan-checker @ 2026-05-13 (Round 1)
Review duration: 约 35 min
Files read: 8 必读 SSOT (KICKOFF / PATTERNS / RESEARCH / ASSUMPTIONS / PLAN / task_plan / contract / decision_rules.yaml) + 4 cross-ref (PLAN-CHECK round 1+2 phase 1.3 / decisionRules.ts / STATE.md / ROADMAP.md)
Grep rounds: 12
B-1 至 B-3 + W-1 至 W-5 + S-1 至 S-4 fix coverage: 0/3 + 0/5 + 0/4 (await main agent decide round)
