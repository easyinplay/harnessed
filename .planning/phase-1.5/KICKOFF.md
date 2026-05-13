# Phase 1.5 Plan-Phase KICKOFF

> **Phase**: v0.1.0 Phase 1.5 — DAG Resolver + Semantic Router L2 + engineering category routing + mattpocock 23 招式 phase routing schema
> **触发**: phase 1.4 ✅ SHIPPED (v0.1.0-alpha.4-routing-engine tag pushed; CI run 25804037789 + 25805032247 三平台全绿; sister review T1+T2+T3 transparency strengthening apply commit `df01ff7`)
> **启动日期**: 2026-05-13
> **预计工作量**: plan-phase 2-3 hour + execute-phase **7-12 工作日 (1.5-2 周)** — honest budget per phase 1.4 H3 transparency 模式（DAG resolver + Semantic Router L2 + engineering 23 招式 schema + 3 P1 deferred items 决议 — 比 phase 1.4 routing engine 重得多；新引入 embedding kNN 模型 deps 风险 + 30 sample re-test 命中率 ≥85% engineering 不再 fallback expected baseline）
> **状态**: 🔄 in-progress (Wave A 调研启动)

---

## 触发原因

Phase 1.4 routing engine v1 + research workflow E2E + 30 sample 100.0% hit (specific rule 21/30 = 70%) 全部落地 ship。Phase 1.5 是 wedge implementation 的**第三步硬实装** — DAG resolver + Semantic Router L2 (embedding kNN) + engineering category routing rules + mattpocock 23 招式 phase routing schema + 3 P1 deferred items 决议 (D1.4-2 v1.1 contract / F40-2 SDK deps / F42 array semantic match)。

**核心 wedge 节点 (phase 1.4 ship 后扩展)**:
- D1.2.5-3 routing engine main-process-driven (phase 1.4 已 ship — phase 1.5 DAG resolver 复用 engine.route 主流程编排)
- F33 P1 verbatim COMPLETE (phase 1.4 已 ship — phase 1.5 supervisor LLM L2 fallback prompt template 沿袭风格)
- ADR 0006 § 6 ROADMAP v3 重排定义 phase 1.5 = DAG resolver + Semantic Router 语义增强 + engineering category routing + mattpocock 23 招式 phase routing
- Phase 1.4 KICKOFF 第 38 行 explicit lock + R6 mitigation: engineering category v1 占位 0 rules + mattpocock 23 招式 phase routing 推 phase 1.5

**Phase 1.4 ship 的 8 接口契约（phase 1.5 直接消费 — frozen）**:
1. `engine.route(task, opts) -> Promise<EngineResult>` 主流程入口 — DAG resolver 替换 arbitrate 步骤；其余编排同源
2. `EngineResult` 三态 discriminated union — DAG resolver / Semantic Router L2 narrow 风格沿袭 (F41 takeaway)
3. `agentFactory: (task, decision, opts) => Promise<AgentDefinition>` (contract § 3 锁定) — DAG step 各 spawn 复用；Semantic Router L2 supervisor 走同 factory
4. `SkillNotInstalledError` / `InvalidDecisionError` / `MissingSkillsError` / `RestartRequiredError` 4 个 typed error class — DAG / supervisor handle install fail-fast 同源
5. `systemPrompt: string` const + `{COMPLETE_TOKEN}` placeholder semantics (D-18 1:1 contract § 5.4) — phase 1.5 supervisor LLM L2 fallback prompt template 沿袭
6. `installResearchWorkflowDeps(): Promise<void>` install adapter (D1.4-4 sequential MCP + parallel ctx7) — phase 1.5 加 plan/execute/verify phase routing 时复用 adapter
7. `routing/index.ts` barrel re-export — phase 1.5 加新组件直接 re-export
8. `tests/integration/routing-30-samples.test.ts` SAMPLES inline truth table (Pattern P) — phase 1.5 engineering rules 实装后 30 sample re-test 升级，phase 3.4 v0.3.0 完整命中率 100+ sample fixture 化迁移基线

**Phase 1.4 ship 时刻 frozen 的 lock**:
- contract v1 12 字段 (W-5 V1 BLOCKER enforce) — phase 1.5 D1.4-2 评估走 ADR 0009 errata 加 2 字段 → 14 字段 1:1 binding
- W-5 V1 BLOCKER 1:1 contract enforce 机制 frozen — phase 1.5 plan-checker V1 BLOCKER 段沿袭风格

---

## Acceptance Bar D1-D8

每条必须通过 plan-phase verify + execute-phase ship。**A7 守恒持续**（ADR 0001-0008 main body 不动；本 phase 加 ADR 0009 errata，baseline tag 加到 9）。

- [ ] **D1** DAG resolver + 拓扑排序实装 — `src/routing/dag.ts`（≤ 200L）：解析全图 → 拓扑排序 → 循环依赖 schema 阶段 reject (R04 P0#4 lock)；engine.route 路径升级 arbitrate → arbitrate + DAG resolve (兼容 phase 1.4 单 manifest 主流程)
- [ ] **D2** Semantic Router L2 升级 (embedding kNN) — `src/routing/semanticRouter.ts`（≤ 150L）：能识别 ≥ 3 phrase ("做出风格" → frontend-design override / "research" → search category / "plan-feature" → plan-feature workflow)；fallback_supervisor LLM L2 supervisor 调用统一 systemPrompt const + COMPLETE_TOKEN placeholder
- [ ] **D3** engineering category routing rules + 30 sample re-test — `routing/decision_rules.yaml` engineering 5 rules (R6 mitigation 落地)；30 sample re-test 命中率 ≥ 85% (engineering 5/5 不再 fallback expected — 改为 specific rule match)；total ≥ 27/30 (含 specific rule match 升级 21/30 → ≥ 27/30)
- [ ] **D4** mattpocock 23 招式 phase routing schema — `routing/decision_rules.yaml` 加 `mattpocock_phases:` 段（discuss/plan/execute/verify 4 phase × 招式映射；engineering category sub-rules 调用）+ manifest spec 顶层 `phase` enum 字段（`discuss \| plan \| execute \| verify` optional）
- [ ] **D5** 3 P1 deferred items 决议 — D1.4-2 v1.1 contract errata (initialPrompt + criticalSystemReminder_EXPERIMENTAL 2 字段 → 14 字段) / F40-2 SDK deps 引入评估 / F42 array semantic match 升级 (R5 array fallthrough → match 行为)
- [ ] **D6** PERF-ATTRIBUTION-2.md ship (sister T3 transparency) — `.planning/phase-1.5/PERF-ATTRIBUTION-2.md` (≥ 80L)：DAG resolver hot path bench；manifest validate 调用次数 baseline (phase 1.4: 0 hot path) vs phase 1.5 (DAG resolver 调用 N 次)；单 validate 时间 baseline (28ms phase 1.3 ship) regression ≤ 5% threshold
- [ ] **D7** ADR 0009 errata + accepted + `adr-0009-accepted` tag — 含 D1.4-2 contract v1.1 + F42 array semantic match + 接口契约升级（如 phase 1.5 实装中 emerge 微调）+ R6 ship transparency；v0.1.0-alpha.4 release notes Known Limitations (sister T2 transparency) 内联到 ADR 0009 § Consequences
- [ ] **D8** Cross-OS CI 三平台保持全绿 + A7 step iter 1-8 → 1-9（新加 ADR 0009 baseline tag）+ ADR 0001-0008 main body 守恒持续

---

## 关键约束（守恒）

1. **A7 守恒**: ADR 0001-0008 main body 不动；本 phase 加 ADR 0009 errata 而非 0001-0008 修改 — baseline tag 加到 9（adr-0001~0009-accepted iterate）
2. **A8 LF 行尾**: 所有新文件 LF
3. **B1 security gate**: DAG resolver yaml load + Semantic Router embedding 输入 → 必须走 phase 1.1.1 H7 `checkCmdString` shell-escape 过滤；防 yaml/embedding 输入注入
4. **D1.2.5-3 main-process-driven 严守**: DAG resolver + Semantic Router L2 必须主进程跑；不引入 subagent 嵌套 spawn
5. **F33 verbatim COMPLETE 强制**: supervisor LLM L2 spawn 时 systemPrompt const inline 沿袭 phase 1.4 模式
6. **Karpathy simplicity**: dag.ts ≤ 200L / semanticRouter.ts ≤ 150L / 不引入 LangGraph (推 v0.2+)；embedding 模型选 OnnxRuntime + small model (BGE-small / all-MiniLM-L6-v2 候选 — RESEARCH 实测决定)
7. **W-5 V1 BLOCKER enforce**: phase 1.5 D1.4-2 evaluate window — 如 D5 决议 add `initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` 2 字段，contract v1 → v1.1 走 ADR 0009 errata；agentDefinition.ts 14 字段 1:1 binding；T4.2 cell 1 enum value drift detector 同步扩展
8. **三角色横切持续**: phase 1.5 implementation 走 GSD plan → execute → verify orchestration；execute 阶段子任务用 superpower brainstorming + ralph-loop wrap

---

## Wave 分解（plan-phase）

### Wave A — Research (90-120 min, parallel agents)

| Research | Agent | Output |
|---|---|---|
| **R1** Phase 1.5 implementation patterns | gsd-pattern-mapper | `PATTERNS.md` (mapping 新文件到 phase 1.1-1.4 已 ship pattern analogs — engine spillover 模式 / arbitrate 升级 / Semantic Router 嵌套 inside engine.route / 23 招式 schema 类比 mattpocock_phases / array semantic match 升级 path / 30 sample inline truth re-test) |
| **R2** Phase 1.5 实装 specific 调研 | gsd-phase-researcher | `RESEARCH.md` (DAG resolver 实装策略 + 循环依赖 detection 算法选型 / embedding 模型选型 (BGE-small vs all-MiniLM-L6-v2 vs OpenAI ada-002) + OnnxRuntime / Transformers.js 选型 / mattpocock 23 招式 phase routing schema 设计 (per CLAUDE.md 笔记 23 招式定义) / D1.4-2 contract v1.1 errata 评估 (initialPrompt + criticalSystemReminder_EXPERIMENTAL 真实 SDK 形态) / F40-2 SDK deps 评估 / F42 array semantic match 升级 (priority 内 array element match v1 fallthrough → match)) |

### Wave B — Plan (120-150 min, gsd-planner + main agent)

- **B.1** ASSUMPTIONS.md (phase 1.5 — 锁定 P0 灰色地带：embedding 模型选型 / DAG resolver 算法选型 / 23 招式 schema 设计 / 3 P1 deferred items 决议路径)
- **B.2** PLAN.md (phase 1.5 蓝图 + 8 wave 分解 + 任务表 + 风险登记 + 接口契约 phase 2.0 prereq)
- **B.3** task_plan.md (planning-with-files 标准 — N 个 atomic 子任务 / 每 task 验收 / 决策来源)

### Wave C — Plan-checker (35-45 min, gsd-plan-checker agent)

- **C.1** PLAN-CHECK.md verdict (APPROVED / APPROVED WITH CONDITIONS / REJECT) + 10 维度 verify
- **C.2** apply patches (if needed) — sister review patches 沿用 phase 1.2.5/1.3/1.4 standard

### Wave D — execute-phase 启动准备

- **D.1** progress.md initial state（phase 1.5 起步 + 8 支柱 implementation enforcement 持续）
- **D.2** main agent decide：直接 execute-phase batch 1 启动 / pause review

---

## 输出 Artifacts 清单

```
.planning/phase-1.5/
├── KICKOFF.md                          # 本文件
├── RESEARCH.md                         # W A.R2
├── PATTERNS.md                         # W A.R1
├── ASSUMPTIONS.md                      # W B.1
├── PLAN.md                             # W B.2
├── task_plan.md                        # W B.3
├── PLAN-CHECK.md                       # W C.1
├── PERF-ATTRIBUTION-2.md               # D6 ship (W execute — sister T3)
└── progress.md                          # 滚动进度（execute-phase 启动后追加）

docs/adr/0009-routing-l2-engineering-23-shi-errata.md  # D7 ship (W execute)
src/routing/dag.ts                                      # D1 ship (W execute, ≤200L)
src/routing/semanticRouter.ts                           # D2 ship (W execute, ≤150L)
src/routing/lib/embedding.ts                            # D2 spillover (model load + kNN)
routing/decision_rules.yaml v2 (engineering rules + mattpocock_phases)  # D3 + D4
src/manifest/schema/spec.ts                             # D4 加 phase 字段 (D1.4-2 evaluate window)
tests/unit/routing-dag.test.ts                          # D1 cell ≥10
tests/unit/routing-semanticRouter.test.ts               # D2 cell ≥8
tests/integration/routing-30-samples.test.ts            # D3 update +5 engineering specific rule + ≥27/30 hit
docs/CHANGELOG.md (or release notes inline ADR 0009)    # D5+D7 ship — sister T2 Known Limitations
```

---

## Phase 1.5 与 phase 2.0 边界

**Phase 1.5** = DAG resolver + Semantic Router L2 升级 + engineering category routing 完整 + mattpocock 23 招式 phase routing schema + 3 P1 deferred 决议 + PERF-ATTRIBUTION-2.md transparency

**Phase 2.0** (v0.2.0 起点) = execute-task workflow + ralph-loop full integration + 4 个 phase-2.1 placeholder installer 实装 + design / content / testing 3 个 extension category 真实候选 install adapter

phase 1.5 不实装 ralph-loop full integration（推 phase 2.2）/ 4 placeholder installer（推 phase 2.1）/ design/content/testing extension installer（推 phase 2.3）/ `--add-plugin ralph-wiggum` 切换（推 phase 2.1+ ADR 0010+ evaluation window）

---

## 8 baseline tag (phase 1.5 起会加到 9)

当前: adr-0001 ~ 0008-accepted (含 retag adr-0006-accepted → 3e24c16 + adr-0007 + adr-0008)

phase 1.5 ship: + adr-0009-accepted (DAG resolver + Semantic Router L2 + engineering rules + mattpocock_phases + D1.4-2 contract v1.1 + F42 array semantic match errata)

ci.yml A7 step iterate 1-8 → 1-9（D8 acceptance bar）

---

## 用户硬要求持续 enforce

> "必须在整体上保证笔记里角色主要职责和核心理念的 100% 实现"

phase 1.5 implementation 完成 8 支柱（A1'-A8'）从静态 capture 到动态 execution 的 **最后转换 phase**。phase 1.4 ship 后 5/8 支柱 (A3' / A4' / A6' / A8' + design A1') 已 ship；phase 1.5 完成 A1' (engineering 6+ 角色 sub-routing) + A5' (mattpocock 23 招式 phase routing) + A7' (brainstorming + TDD 触发 — phase 2.2 完成 ralph-loop full integration 后)。

**重点 enforcement 持续**:
- **A1' gstack 6+ 角色 routing**: phase 1.5 engineering category 必须能 dispatch gstack 关卡 (ceo-review / eng-manager-review / paranoid-staff-engineer-review) + GSD orchestration (discuss/plan/execute/verify) + superpowers TDD/brainstorming sub-rules
- **A5' mattpocock 23 招式 phase routing**: phase 1.5 落地 — discuss phase → /grill-with-docs / /to-prd / /to-issues；plan phase → /grill-me / /design；execute phase → /tdd / /diagnose / /zoom-out / /caveman；verify phase → /qa / /review / /code-review；engineering category sub-rules
- **A7' brainstorming + TDD 触发规则**: phase 1.5 加触发 schema (manifest spec `triggers:` 字段 — task complexity ≥ N → brainstorming required；core business logic / algorithm / high-reliability → TDD required)；phase 2.2 加 ralph-loop wrap full integration

---

## 8 支柱 100% capture verify (phase 1.5 ship 后)

| 支柱 | phase 1.5 ship 后状态 | acceptance bar |
|---|---|---|
| A1' gstack 6+ 角色 routing | engineering category 6+ 角色 sub-rules ship (D3) + design / content / testing / search / meta 已 ship (phase 1.4) | D3 命中 |
| A2' gstack 双职责 (Strategy vs Governance) | engineering category sub-rules schema 区分 (D4 mattpocock_phases discuss/plan = governance；execute/verify = execution) | D4 schema |
| A3' GSD 环境质量 | A7 守恒 + Cross-OS CI 三平台 + ADR 0001-0009 baseline tag iter 1-9 (D8) | D8 命中 |
| A4' karpathy 4 心法 inject | phase 1.4 已 ship (D1.4-14 prepend 4 心法) | (continued) |
| A5' mattpocock 23 招式 phase routing | mattpocock_phases routing schema 实装 (D4) + 23 招式 mapping 完整 | D4 实装 + 30 sample 含 engineering 招式触发 |
| A6' 心法+招式配对 | phase 1.4 已 ship (D1.4-14 + D-18 配对) | (continued) |
| A7' brainstorming + TDD 触发规则 | manifest spec `triggers:` 字段 (D5 evaluate or D4 schema 内含) | D4 schema 含触发 |
| A8' 6 category × decision rules execute | engineering rules ship (D3) + 6 category 全 specific rule match (≥27/30) | D3 命中 |

phase 1.5 ship 后 **8 支柱 100% capture verify** — 完成 wedge implementation 三步硬实装 (phase 1.3 schema layer + phase 1.4 engine layer + phase 1.5 enhancement layer)。
