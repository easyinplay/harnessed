# Phase 1.4 PLAN — Routing Engine v1 + AgentDefinition Factory + Research Workflow E2E

> **Phase**: v0.1.0 Phase 1.4
> **Goal**: 把 phase 1.3 ship 的 schema layer + decision_rules.yaml + AgentDefinition contract draft 落地为 **可执行 routing engine** — main-process-driven 主流程 + factory 1:1 对应 contract + research workflow E2E + 30 真实样本 ≥ 85% v0.1 内部基线
> **状态**: ✅ Wave B.2 完成（plan-phase 蓝图 ready）
> **execute-phase 工作量**: 5-10 工作日（KICKOFF 第 6 行 honest budget — routing engine 实装 + ralph-loop wrap + 30 sample 命中率验收链路调试比 schema layer 重得多；H3 transparency 模式持续）

---

## § 1 Goal & Scope

### 1.1 Goal

落地 main-process-driven routing engine v1 + AgentDefinition factory invoke + research workflow E2E + 30 真实样本路由命中率 ≥ 85%（v0.1 内部基线）— 让 phase 1.5 DAG resolver + Semantic Router L2 实装时**只需读 engine.ts + agentDefinition.ts + systemPrompt.ts + 6 接口契约即可启动**，不再修订 wedge。

### 1.2 In Scope

- **Routing engine 主流程实装**: `src/routing/engine.ts` ≤ 200L — main-process-driven query → arbitrate → install missing → factory inject → spawn → ralph-loop wrap → verbatim COMPLETE 回流（C1）
- **AgentDefinition factory 实装**: `src/routing/agentDefinition.ts` ≤ 150L — 12 字段 1:1 对应 contract v1 + 4 错误处理路径（C2）
- **System prompt verbatim template**: `src/routing/systemPrompt.ts` ≤ 80L — F33 P1 mitigation + skills fail-fast 处理 + max-iterations × 50 兜底（C5）
- **research workflow E2E sub-routing**: `src/cli/research.ts` 独立子命令 + 9th register fn + integration test（C4）
- **30 真实查询样本 SAMPLES.md + sample-driven test**: 6 category × 5 sample = 30；Pattern P (≥ 85% tolerance threshold)（C6）
- **6 category routing rules MVP execute**: 4 category 实测命中（design/content/testing/search）+ meta；engineering 走 fallback_supervisor（C3）
- **ADR 0008 errata** 含 phase 1.3 deferred items inline (H1a perf transparency / M1 yaml path migration / phase 1.4 接口契约升级)（C8）
- **A7 守恒持续 + ci.yml A7 step iter 1-7 → 1-8**（C7）

### 1.3 Out of Scope（推 phase 1.5+）

- **DAG resolver + Semantic Router L2**（embedding kNN 升级 + 高频 workflow 模式编码）— phase 1.5 范围
- **engineering category routing rules + mattpocock 23 招式 phase routing**（discuss/plan/execute/verify 分阶段调度）— phase 1.5 范围（KICKOFF 第 38 行 explicit lock + R6 mitigation）
- **完整命中率验收 100+ sample × 多 model × stability**（v0.3.0 release 验收）— phase 3.4 范围
- **`initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` 2 新字段 contract errata**（fresh 2026 RESEARCH § 2 暴露）— phase 1.5 评估（D1.4-2 lock — 不动 v1 main body 守 A7）
- **`--add-plugin ralph-wiggum` 官方 plugin headless mode 切换**（v0.2+ 评估 — D1.4-3 lock；phase 1.4 自实装 ≤ 50L 是 wedge 原则）
- **decision_rules.yaml COLLECT / RULE_ORDER 等其他 DMN hit policy**（推 phase 1.5+ 评估）

---

## § 2 8-Wave 拓扑

```
Wave 0 (前置, 30 min)
  T1.1 ADR 0008 errata 起草 + adr-0008-accepted tag
       (含 phase 1.3 deferred H1a perf transparency reference + M1 yaml path
        migration 官方化 + routing engine 接口契约升级如 phase 1.4 实装中 emerge 微调)
  T1.2 ci.yml A7 step iterate 1-7 → 1-8

         │
         ▼

Wave 1 (Spike main-process query() API + AgentDefinition spawn, 60 min)
  T2.1 scripts/spike/routing-spawn-agent.sh
       (D1.4-1 实证 — bash claude plugin install + main-process spawn agent
        + verbatim COMPLETE 实测 + ralph-loop 时序)
  T2.2 .planning/phase-1.4/SPIKE-REPORT.md
       (实测路径 + verbatim COMPLETE feasibility + ralph-loop wrap 时序 +
        skill load filesystem scan 行为 — 后续实装 anchor)

         │
         ▼

Wave 2 (engine.ts + agentDefinition.ts + systemPrompt.ts 实装, 3-4h)
  T3.1 src/routing/engine.ts (≤ 200L Pattern N) — main-process-driven 主流程编排
       arbitrate → install missing → factory → spawn → ralph-loop → verbatim COMPLETE
  T3.2 src/routing/agentDefinition.ts (≤ 150L) — factory 实装 1:1 对应 contract
       12 字段 (D-14 throw-error path) + skills fail-fast + 4 心法 inject (D1.4-14)
  T3.3 src/routing/systemPrompt.ts (≤ 80L Pattern O) — verbatim instructional
       template (D-18 1:1 对齐 contract § 5.4)

         │
         ▼

Wave 3 (Tests engine + agentDefinition unit, 2-3h)
  T4.1 tests/unit/routing-engine.test.ts (≥ 10 cell)
  T4.2 tests/unit/routing-agentDefinition.test.ts (≥ 8 cell — V1 BLOCKER 12 字段
       shape + signature + 4 error paths assert)

         │
         ▼

Wave 4 (research workflow E2E sub-routing + integration test, 3-4h)
  T5.1 src/cli/research.ts (D-15 独立子命令) — sub-routing search category 端到端
  T5.2 src/cli.ts wire registerResearch (9th register fn)
  T5.3 tests/integration/routing-research-workflow.test.ts (≥ 3 cell E2E,
       env-gated HARNESSED_REAL_SPAWN=1 skipIf)

         │
         ▼

Wave 5 (30 sample SAMPLES.md + sample-driven test, 2-3h)
  T6.1 .planning/phase-1.4/SAMPLES.md (≥ 30 sample, 6 category × 5 / D1.4-5
       选取标准 + ≥ 3 ambiguous / engineering ≤ 5 走 fallback expected)
  T6.2 tests/integration/routing-30-samples.test.ts (≥ 30 cell + Pattern P
       ≥ 85% tolerance threshold + per-sample drill-down)

         │
         ▼

Wave 6 (Cross-OS CI verify, push verify)
  T7.1 push origin → CI 三平台全绿 + A7 step iter 1-8 verify
  T7.2 (可选 hotfix) CI red 时类 phase 1.2.1 / 1.3.1 模式
  T7.3 (可选 perf attribution) 续 phase 1.3 T7.3 — schema + routing engine
       叠加后 manifest validate 路径 perf 现状量化（如 H1b 持续 transparency 需要）

         │
         ▼

Wave 7 (Docs + ship, 60 min)
  T8.1 update STATE.md phase 1.4 SHIPPED + 进度 5/17 phases ≈ 29.4%
  T8.2 .planning/phase-1.4/VERIFICATION.md ≥ 150 行 (C1-C8 复现命令 +
       Phase 1.5 prereq + Findings 索引)
  T8.3 (main agent decide) push tag v0.1.0-alpha.4-routing-engine
  T8.4 phase 1.5 prereq notes (DAG resolver + Semantic Router L2 启动 prereq +
       engineering category routing 实装 + mattpocock_phases routing schema 实装)
       写到 STATE.md / ROADMAP.md
```

---

## § 3 任务表（detail in task_plan.md）

| Wave | Task ID 范围 | task 数 | 关键产出 |
|---|---|---|---|
| 0 | T1.1-T1.2 | 2 | ADR 0008 errata + adr-0008-accepted tag + ci.yml A7 iter 1-8 |
| 1 | T2.1-T2.2 | 2 | spike script + spike report (`SPIKE-REPORT.md`) |
| 2 | T3.1-T3.3 | 3 | engine.ts ≤ 200L + agentDefinition.ts ≤ 150L + systemPrompt.ts ≤ 80L |
| 3 | T4.1-T4.2 | 2 | engine unit test ≥ 10 cell + agentDefinition unit test ≥ 8 cell |
| 4 | T5.1-T5.3 | 3 | research.ts CLI + cli.ts wire (9th) + research workflow integration test ≥ 3 cell |
| 5 | T6.1-T6.2 | 2 | SAMPLES.md ≥ 30 sample + 30-sample integration test (Pattern P) |
| 6 | T7.1-T7.3 | 3 | CI verify + 可能 hotfix + 可选 perf attribution |
| 7 | T8.1-T8.4 | 4 | STATE.md / VERIFICATION.md / push tag 决策 / phase 1.5 prereq notes |

**总 task 数**: 21 atomic（含 Wave 6 可选 hotfix + 可选 perf attribution）+ 内部分子文件（T4.1 / T4.2 / T6.2 测试 cell 多）

---

## § 4 接口契约（phase 1.5 prereq — 8 个）

phase 1.5 DAG resolver + Semantic Router L2 实装时需要的契约 — phase 1.4 必须 ship 这些：

| 契约 | phase 1.4 ship | phase 1.5 消费 |
|---|---|---|
| `engine.route(task: TaskContext, opts: EngineOpts): Promise<EngineResult>` 主流程入口 | T3.1 `src/routing/engine.ts` | DAG resolver 替换 arbitrate；其余编排步骤同源 |
| `EngineResult` 三态 discriminated union (`{ok: true; result; matchedRule}` / `{ok: false; phase; error}` / `{aborted: true; reason}`) | T3.1 `src/routing/engine.ts` 类型 export | DAG resolver / Semantic Router L2 narrow 风格沿袭 |
| `agentFactory: (task, decision, opts) => Promise<AgentDefinition>` (contract § 3 锁定) | T3.2 `src/routing/agentDefinition.ts` | DAG step 各 spawn 复用 factory；Semantic Router L2 supervisor 走同 factory |
| `SkillNotInstalledError` / `InvalidDecisionError` / `MissingSkillsError` / `RestartRequiredError` 4 个 typed error class | T3.2 `src/routing/agentDefinition.ts` export | DAG resolver / supervisor handle install fail-fast 路径同源 |
| `systemPrompt: string` const + `{COMPLETE_TOKEN}` placeholder substitution semantics (D-18 1:1 contract § 5.4) | T3.3 `src/routing/systemPrompt.ts` | phase 1.5 supervisor LLM L2 fallback prompt template + DAG step prompt 沿袭风格 |
| `installResearchWorkflowDeps(): Promise<void>` install adapter (D1.4-4 sequential MCP + parallel ctx7) | T5.1 `src/cli/research.ts` 内部 helper（spillover 抽 `src/routing/lib/installAdapter.ts`） | phase 1.5 加 plan/execute/verify phase routing 时复用 adapter pattern |
| `routing/index.ts` barrel re-export `{ engine, agentDefinition, systemPrompt, arbitrate, loadDecisionRules }` | T3.1 / T3.2 / T3.3 末尾创建 `src/routing/index.ts` | Pattern G 复用 — phase 1.5 加新组件直接 re-export |
| `tests/integration/routing-30-samples.test.ts` SAMPLES inline truth table (Pattern P 30 sample × 6 category) | T6.2 | phase 3.4 v0.3.0 100+ sample 验收时 fixture 化迁移基线 |

---

## § 5 风险登记（来自 ASSUMPTIONS § E — 完整 6 风险见 ASSUMPTIONS.md）

| ID | 风险 | 严重度 | mitigation 一行摘要 |
|---|---|---|---|
| **R1** | main-process-driven `query()` API 真实形态未实证 | 🔴 P0 | Wave 1 Spike (T2.1+T2.2) 实证 + skeleton spawn 验证 + Wave 4 E2E env-gated skipIf + D-18 ADR 0008 errata 走 contract drift 路径 |
| **R2** | `/reload-plugins` skill bug + fresh subagent invoke 时序 | 🔴 P0 | 不调 reload (D1.4-1) — filesystem scan 路径 + sleep retry idempotent_check + RestartRequiredError 兜底 + IMPL NOTE engine.ts 头部 |
| **R3** | 30 sample 选取偏差 (cherry-pick / overfit) | 🟡 P1 | SAMPLES.md selection rationale + ≥ 3 ambiguous + plan-phase frozen execute 不可改样本 + v0.3.0 100+ sample 升级路径 |
| **R4** | research workflow install 链路 race + 依赖顺序 | 🟡 P1 | D1.4-4 串行 MCP add + 并行 ctx7 npm + 走 `harnessed install <name>` wrapper (复用 idempotency) |
| **R5** | AgentDefinition 12 字段 1:1 对齐 contract drift (W-5 V1 BLOCKER) | 🟡 P1 | T4.2 unit test ≥ 8 cell shape/signature/error path assert + plan-checker (Wave C) V1 BLOCKER 段 + D-18 contract drift 走 ADR 0008 errata + factory 头部 IMPL NOTE 引用 contract v1 |
| **R6** | engineering category 0 rules + mattpocock 23 招式 phase routing 推 phase 1.5 | 🟢 P2 | KICKOFF lock 严守 — engineering 走 fallback_supervisor + 30 sample 内 engineering ≤ 5 + ADR 0008 § Consequences R6 跟踪条目 |

---

## § 6 接受标准（goal-backward verify — C1-C8）

phase 1.4 ship 必须证明：

1. **C1** (engine.ts) — `wc -l src/routing/engine.ts` ≤ 200 + `corepack pnpm typecheck` 0 错误 + `corepack pnpm test -- --filter routing-engine` 全绿（≥ 10 cell）+ `grep -E "loadDecisionRules\|arbitrate\|agentFactory\|spawnSubagent\|verbatim.*COMPLETE\|ralphLoop" src/routing/engine.ts` 全 hit；engine.ts 头部 IMPL NOTE 引用 ADR 0006 § 1 + KICKOFF C1 + D1.2.5-3 + F33 (Pattern H 5+ 处之一)
2. **C2** (agentDefinition.ts) — `wc -l src/routing/agentDefinition.ts` ≤ 150 + `corepack pnpm test -- --filter routing-agentDefinition` 全绿（≥ 8 cell, 含 12 字段 shape + signature 类型 + 4 error paths assert）+ `grep -E "SkillNotInstalledError\|InvalidDecisionError\|MissingSkillsError\|description\|prompt\|tools\|model\|skills\|maxTurns" src/routing/agentDefinition.ts` 全 hit；factory 头部 IMPL NOTE 引用 contract v1 frozen + ADR 0008 cross-link
3. **C3** (6 category routing rules MVP execute) — Wave 5 30 sample test (T6.2) 验证 design / content / testing / search 4 category 命中（每 category ≥ 5 sample 命中率 ≥ 85%）；meta 命中率 ≥ 85%；engineering 5 sample 走 fallback_supervisor expected （expected_primary = "fallback_supervisor"）
4. **C4** (research workflow E2E) — `HARNESSED_REAL_SPAWN=1 corepack pnpm test -- --filter routing-research-workflow` 跑通 ≥ 3 cell（实测）+ 默认 mock 跑通；`node ./dist/cli.mjs research --help` 显示子命令 + flags
5. **C5** (systemPrompt.ts) — `wc -l src/routing/systemPrompt.ts` ≤ 80 + `grep -E "do NOT summarize\|paraphrase\|verbatim.*COMPLETE\|max-iterations.*50\|skill.*fail-fast" src/routing/systemPrompt.ts` 全 hit + IMPL NOTE 头部引用 contract § 5.4 verbatim 1:1 enforce
6. **C6** (30 sample ≥ 85% baseline) — `corepack pnpm test -- --filter routing-30-samples` 全绿 + 命中率 ≥ 85%（27 / 30 hit）+ SAMPLES.md ≥ 30 sample + selection rationale + ≥ 3 ambiguous + per-sample drill-down 可读
7. **C7** (CI 三平台 + A7 step iter 1-8) — 最新 CI run 三平台 success + A7 step iterate 1-8 全绿（含 ADR 0008）+ `git diff adr-0001-accepted -- docs/adr/0001-*.md` 输出空 + `git tag -l 'adr-*-accepted' | wc -l` = 8
8. **C8** (ADR 0008) — `wc -l docs/adr/0008-*.md` ≥ 100 + grep 6-section (Status / Context / Decision / Consequences / Compliance / References) 全 hit + Consequences 含 phase 1.3 deferred H1a + M1 inline + R6 跟踪条目 + `adr-0008-accepted` tag pushed

---

## § 7 Wave Acceptance Checkpoint

每个 wave 完成时跑下列子集验收：

| Wave | 完成验收子集 |
|------|--------------|
| Wave 0 | adr-0008-accepted tag + ci.yml A7 iter 1-8 + commits 干净 + `git diff adr-0001-accepted -- docs/adr/0001-*.md` 空 |
| Wave 1 | spike script executable + SPIKE-REPORT.md ≥ 80 行 + 实测 query() API 路径 + verbatim COMPLETE feasibility 结论 + skill load filesystem scan 行为 |
| Wave 2 | typecheck/lint 全绿 + engine ≤ 200L / factory ≤ 150L / systemPrompt ≤ 80L 三 hard limit 满足 + Pattern H IMPL NOTE 5+ 处分布 + `routing/index.ts` barrel re-export |
| Wave 3 | tests 228 + 1 → ≥ 246 + 1 skipped (+18 cell, 10 engine + 8 factory) + V1 BLOCKER 比对（手工 plan-checker 可视）+ 4 error paths 全覆盖 |
| Wave 4 | research.ts CLI 命令存在 + cli.ts 9th register fn + integration test ≥ 3 cell（默认 mock 全绿；env-gated real-spawn 可选验证）|
| Wave 5 | SAMPLES.md ≥ 30 sample + 30-sample test 命中率 ≥ 85% + per-sample drill-down 失败 sample 输出 + SAMPLES.md selection rationale + ≥ 3 ambiguous |
| Wave 6 | CI 三平台 success + A7 iter 1-8 全绿 + （可选 perf attribution 续 phase 1.3 T7.3 transparency）|
| Wave 7 | STATE.md / VERIFICATION.md update + C1-C8 8/8 ✅ + （可选）v0.1.0-alpha.4-routing-engine tag + phase 1.5 prereq notes 写到 STATE.md / ROADMAP.md |

---

## § 8 Phase 1.4 vs phase 1.5 边界（重申）

phase 1.4 = **engine layer + execution**（main-process-driven routing engine 实装 + AgentDefinition factory invoke + 6 category × decision rules **执行** + research workflow E2E + 30 真实样本 ≥ 85% v0.1 内部基线）

phase 1.5 = **optimization + DAG**（DAG resolver + 拓扑排序 + Semantic Router L2 升级 embedding kNN + 高频 workflow 模式编码 + engineering category routing rules + mattpocock 23 招式 phase routing schema 实装 + `initialPrompt` / `criticalSystemReminder_EXPERIMENTAL` contract v1.1 errata 评估）

**phase 1.4 不实装**:
- DAG resolver / Semantic Router L2（推 phase 1.5）
- engineering category routing rules（推 phase 1.5；走 fallback_supervisor 兜底）
- mattpocock 23 招式 phase routing schema（推 phase 1.5；KICKOFF 第 38 行 explicit lock + R6 mitigation）
- `--add-plugin ralph-wiggum` 官方 plugin headless mode 切换（v0.2+ 评估；phase 1.4 自实装 ≤ 50L 是 wedge 原则 — D1.4-3）
- 100+ sample × 多 model × stability 完整命中率验收（推 phase 3.4 v0.3.0 release）
