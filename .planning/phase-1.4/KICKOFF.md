# Phase 1.4 Plan-Phase KICKOFF

> **Phase**: v0.1.0 Phase 1.4 — Routing Engine v1 实装 + research workflow E2E
> **触发**: phase 1.3 ✅ SHIPPED (8/8 acceptance bar / tag `v0.1.0-alpha.3-base-profile` / CI run 25792715807 三平台全绿)
> **启动日期**: 2026-05-13
> **预计工作量**: plan-phase 1.5-2.5 hour + execute-phase **5-10 工作日 (1-2 周)** — honest budget per phase 1.3 H3 transparency 模式（routing engine 实装比 schema layer 重得多；30 样本命中率 ≥ 85% 验收 + research workflow E2E + AgentDefinition factory invoke 链路调试）
> **状态**: 🔄 in-progress (Wave A 调研启动)

---

## 触发原因

Phase 1.3 schema layer + base profile + decision_rules.yaml v1 + AgentDefinition factory contract draft 全部落地 ship。Phase 1.4 是 wedge implementation 的**第二步硬实装** — main-process-driven routing engine 实装 + research workflow E2E 跑通 + 30 真实查询样本命中率 ≥ 85% 验收。

**核心 wedge 节点 (phase 1.2.5 lock)**:
- D1.2.5-3 routing engine 必须 main-process-driven（subagent 不能动态 install/reload skill — F33 实证）
- D1.2.5-9 main agent factory inject 路径（path b - revised；非 subagent 自填字段）
- F33 P1 verbatim COMPLETE marker 强制（main agent system prompt enforce）
- ADR 0006 § 6 ROADMAP v3 重排定义 phase 1.4 = routing engine v1 + research workflow E2E

**Phase 1.3 ship 的 7 接口契约（phase 1.4 直接消费）**:
1. `manifest.spec.category` 6 enum (meta/engineering/design/content/testing/search) — routing engine category match
2. `manifest.spec.install_type` 4 enum (skill/mcp/npm/git, 1:N → 6 install method) — install adapter 选择
3. `manifest.spec.decision_rules` optional Object — per-manifest hint backup
4. `routing/decision_rules.yaml` v1 schema (12 rules + Priority hit policy + fallback_supervisor) — routing engine load + parse
5. `arbitrate(rules, taskContext): Rule | null` (src/routing/decisionRules.ts) — L1 router
6. `harnessed install-base` 子命令 (D-9) — 用户 setup 入口
7. `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` 12 字段 schema + W-5 V1 BLOCKER 检查机制 — phase 1.4 factory implementation 1:1 对应

---

## Acceptance Bar C1-C8

每条必须通过 plan-phase verify + execute-phase ship。**A7 守恒持续**（ADR 0001-0007 main body 不动；本 phase 加 ADR 0008 errata，baseline tag 加到 8）。

- [ ] **C1** main-process-driven routing engine 实装 — `src/routing/engine.ts`（≤ 200 行）：query `routing/decision_rules.yaml` → arbitrate → install missing skill/mcp + `/reload-plugins`/restart hint → AgentDefinition factory inject skills/prompt → spawn subagent → ralph-loop wrap COMPLETE → verbatim 回流 main agent (F33 mitigation)
- [ ] **C2** AgentDefinition factory 实装 1:1 对应 phase 1.3 contract draft — `src/routing/agentDefinition.ts`（≤ 150 行）：12 字段完整 schema + factory function signature + 4 错误处理路径 + skills fail-fast SkillNotInstalledError + verbatim COMPLETE prompt template
- [ ] **C3** 6 category routing rules MVP execute — design / content / testing / search **+ meta** 5 category 实测命中（每 ≥ 5 sample；engineering category v1 占位 0 rules base 已装，走 fallback_supervisor 路径 — mattpocock 23 招式 phase routing 推 phase 1.5 R6 mitigation）— **S-1 sister patch**: meta v1 routing 已 ship (decision_rules.yaml 2 rules 落地)，仅 mattpocock 23 招式 phase routing 推 phase 1.5
- [ ] **C4** research workflow E2E — search category 端到端跑通：用户 prompt → arbitrate 命中 search rule → install Tavily + Exa + ctx7 (idempotent skip) → spawn subagent with skills inject → subagent invoke ctx7/Tavily/Exa → ralph-loop wrap → verbatim COMPLETE 回流 → 主流程返回结果
- [ ] **C5** main agent system prompt verbatim COMPLETE 强制 — `src/routing/systemPrompt.ts`（≤ 80 行）：明确 instructional language 防 subagent final message summarize 风险（F33 P1 mitigation）+ skills fail-fast 处理 + max-iterations × 50 兜底
- [ ] **C6** 30 真实查询样本路由命中率 ≥ 85% — `tests/integration/routing-30-samples.test.ts` 或 `.planning/phase-1.4/SAMPLES.md`：覆盖 Haiku/Sonnet/Opus 各 ≥ 8（v0.1 内部基线 — 完整命中率验收推 phase 3.4 v0.3.0）
- [ ] **C7** Cross-OS CI 三平台保持全绿 + A7 step iterate 1-7 → 1-8（新加 0008 baseline tag）+ ADR 0001-0007 main body 守恒持续
- [ ] **C8** ADR 0008 errata 起草 + accepted + `adr-0008-accepted` tag — 把 phase 1.3 deferred items inline:
  - H1a perf cost transparency (Consequences 节加 PERF-ATTRIBUTION findings reference)
  - M1 yaml path migration `.planning/decision_rules.yaml` → `routing/decision_rules.yaml` (官方更新 ADR 0007 path references)
  - phase 1.4 routing engine 接口契约升级（如 phase 1.4 实装中 emerge schema 微调）

---

## 关键约束（守恒）

1. **A7 守恒**: ADR 0001-0007 main body 不动；本 phase 加 ADR 0008 errata 而非 0001-0007 修改 — baseline tag 加到 8（adr-0001~0008-accepted iterate）
2. **A8 LF 行尾**: 所有新文件 LF
3. **B1 security gate**: routing engine 加载 yaml + AgentDefinition prompt template 拼接 → 必须走 phase 1.1.1 H7 `checkCmdString` shell-escape 过滤；防 yaml/prompt 注入
4. **D1.2.5-3 main-process-driven 严守**: routing engine 必须主进程跑；subagent 内部不允许 嵌套 spawn（F33 实证）
5. **F33 verbatim COMPLETE 强制**: main agent system prompt 必须 instructional inline subagent COMPLETE marker 原文回流；禁 summarize
6. **Karpathy simplicity**: routing engine ≤ 200L / agentDefinition ≤ 150L / systemPrompt ≤ 80L / 不引入 LangGraph / Semantic Router L2 dep（推 phase 1.5）
7. **三角色横切持续**: phase 1.4 implementation 走 GSD plan → execute → verify orchestration；execute 阶段子任务用 superpower brainstorming + ralph-loop wrap

---

## Wave 分解（plan-phase）

### Wave A — Research (60-90 min, parallel agents)

| Research | Agent | Output |
|---|---|---|
| **R1** Phase 1.4 implementation patterns | gsd-pattern-mapper | `PATTERNS.md` (mapping 新文件到 phase 1.1-1.3 已 ship pattern analogs — TypeBox schema / Ajv / fixture-driven test / cli flag 添加 / dispatcher 模式 / installer-runtime / arbitrate function / routing/ 目录布局) |
| **R2** Routing engine 实装 specific 调研 | gsd-phase-researcher | `RESEARCH.md` (CC plugin install + /reload-plugins fresh subagent invoke 实测路径 / AgentDefinition factory 真实 spawn API / ralph-loop subagent wrap completion-promise verbatim 回流验证 / 30 样本 routing 命中率 baseline 估算 / Tavily+Exa+ctx7 install adapter dependency 顺序) |

### Wave B — Plan (90-120 min, main agent + gsd-planner)

- **B.1** ASSUMPTIONS.md (phase 1.4 — 锁定 P0 灰色地带：CC plugin install 真实 API / `/reload-plugins` skill bug fallback / AgentDefinition spawn 实测 / 30 样本 SAMPLES 选取标准)
- **B.2** PLAN.md (phase 1.4 蓝图 + 8 wave 分解 + 任务表 + 风险登记)
- **B.3** task_plan.md (planning-with-files 标准 — N 个 atomic 子任务 / 每 task 验收 / 决策来源 / W-5 V1 BLOCKER 检查 enforce 12 字段对齐 phase 1.3 contract)

### Wave C — Plan-checker (30-40 min, gsd-plan-checker agent)

- **C.1** PLAN-CHECK.md verdict (APPROVED / APPROVED WITH PATCHES / REJECT)
- **C.2** apply patches (if needed) — sister review patches 沿用 phase 1.2.5 / 1.3 standard

### Wave D — execute-phase 启动准备

- **D.1** progress.md initial state（phase 1.4 起步 + 8 支柱 implementation enforcement 持续）
- **D.2** main agent decide：直接 execute-phase batch 1 启动 / pause review

---

## 输出 Artifacts 清单

```
.planning/phase-1.4/
├── KICKOFF.md                          # 本文件
├── RESEARCH.md                         # W A.R2
├── PATTERNS.md                         # W A.R1
├── ASSUMPTIONS.md                      # W B.1
├── PLAN.md                             # W B.2
├── task_plan.md                        # W B.3
├── PLAN-CHECK.md                       # W C.1
├── SAMPLES.md                          # W execute (C6 30 样本 routing 命中率)
└── progress.md                          # 滚动进度（execute-phase 启动后追加）

docs/adr/0008-routing-engine-v1-errata.md         # C8 ship (W execute)
src/routing/engine.ts                              # C1 ship (W execute, ≤200L)
src/routing/agentDefinition.ts                     # C2 ship (W execute, ≤150L)
src/routing/systemPrompt.ts                        # C5 ship (W execute, ≤80L)
src/cli/research.ts (or sub-routing/)              # C4 research workflow E2E (W execute)
tests/unit/routing-engine.test.ts                  # C1 cell ≥10
tests/unit/routing-agentDefinition.test.ts         # C2 cell ≥8
tests/integration/routing-research-workflow.test.ts # C4 E2E ≥3 cell
tests/integration/routing-30-samples.test.ts       # C6 ≥30 cell
```

---

## Phase 1.4 与 phase 1.5 边界

**Phase 1.4** = engine layer + execution（main-process-driven routing engine 实装 + AgentDefinition factory invoke + 6 category × decision rules **执行** + research workflow E2E + 30 真实样本路由命中率 ≥ 85% v0.1 内部基线）

**Phase 1.5** = optimization + DAG（DAG resolver + 拓扑排序 + Semantic Router L2 升级 embedding kNN + 高频 workflow 模式编码）

phase 1.4 不实装 DAG resolver / Semantic Router L2（推 phase 1.5）。phase 1.4 仅 L1 关键词路由（DMN Priority Hit Policy）+ supervisor fallback。

---

## 7 baseline tag (phase 1.4 起会加到 8)

当前: adr-0001-accepted / adr-0002-accepted / adr-0003-accepted / adr-0004-accepted / adr-0005-accepted / adr-0006-accepted (retag → 3e24c16) / adr-0007-accepted

phase 1.4 ship: + adr-0008-accepted (routing engine v1 errata + phase 1.3 deferred items inline)

ci.yml A7 step iterate 1-7 → 1-8（C7 acceptance bar）

---

## 用户硬要求持续 enforce

> "必须在整体上保证笔记里角色主要职责和核心理念的 100% 实现"

phase 1.4 implementation 是 8 支柱（A1'-A8'）从静态 capture 到动态 execution 的 **关键 transformation phase**。任何字段 / 验证 / routing 路径偏离 phase 1.2.5 / 1.3 lock 都是 P0 blocker。

**重点 enforcement**:
- **A1' gstack 6+ 角色 routing**: phase 1.4 routing engine 必须能 dispatch 到 frontend-design / ui-ux-pro-max / paranoid-staff-engineer 等角色（design / engineering category 内部 sub-routing）
- **A4' karpathy 4 心法 inject**: AgentDefinition prompt template 必须始终包含 4 心法 always-on baseline（Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution）
- **A5' mattpocock 23 招式 phase routing**: research workflow E2E 必须能识别 discuss/plan/execute/verify phase 自动调用对应招式（如 plan phase → /to-issues / /grill-with-docs；execute → /tdd / /diagnose / /zoom-out）
- **A8' 6 category × decision rules execute**: phase 1.4 是首个真实跑 routing 的 phase；每 category ≥ 5 样本验收命中
