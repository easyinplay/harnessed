# Phase 1.5 — Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 12 (9 new + 3 modified)
**Analogs found:** 12 / 12
**Reuse rate:** 67% (8 reused / 12 total) — wedge enhancement layer 自然产物，4 新生 pattern 来自 phase 1.4 ship 后扩展（DAG / Semantic L2 / 23 招式 / triggers）

---

## § 1 New file → existing analog 映射表

| New / Modified file | Closest analog | 复用 pattern | Diff |
|---|---|---|---|
| `src/routing/dag.ts` (≤200L) | `src/routing/engine.ts` (170L Pattern N) | Pattern N (主流程编排) + Pattern H (IMPL NOTE 顶部) + EngineResult-style 三态 narrow | 加 Kahn topological sort + cycle detection (Pattern Q 新生) |
| `src/routing/semanticRouter.ts` (≤150L) | `src/routing/decisionRules.ts` (108L) + `arbitrate ≤7L` | Pattern I (yaml load + Ajv validate) + Pattern N inline 主流程 | 加 embedding kNN top-1 match + L1→L2→L3 三层 fallback (Pattern R 新生) |
| `src/routing/lib/embedding.ts` (spillover) | `src/routing/lib/ralphLoop.ts` (66L spillover) | Pattern E (spillover lib/) + D1.4-3 模式 | 加 OnnxRuntime / @xenova/transformers model load + cosine kNN (Pattern R lib half) |
| `routing/decision_rules.yaml` v1 → v2 | v1 (12 rules + version 1 + fallback_supervisor + deprecated) | Pattern I (yaml schema parse) | 加 engineering 5 rules + `mattpocock_phases:` 段 + version bump 1→2 (Pattern S 新生) |
| `src/manifest/schema/spec.ts` (修改) | phase 1.3 加 3 字段 (Pattern L spec-level metadata) | Pattern L 1:1 复用 | 加 `phase` enum (discuss/plan/execute/verify optional) + `triggers` 字段 (Pattern T 新生) |
| `src/routing/agentDefinition.ts` (修改 D5 evaluate) | phase 1.4 ship 148L 12 字段 V1 BLOCKER | Pattern O verbatim 1:1 binding 沿袭 | D1.4-2 evaluate 12 → 14 字段 (走 ADR 0009 errata) |
| `tests/unit/routing-dag.test.ts` (≥10 cell) | `tests/unit/routing-engine.test.ts` (12 cell) | Pattern J (BASE+modifier) | 加 cycle detect / topological order / Kahn correctness cells |
| `tests/unit/routing-semanticRouter.test.ts` (≥8 cell) | `tests/unit/routing-agentDefinition.test.ts` (9 cell) | Pattern J (fixture-driven) + Pattern K (env-gated skipIf if model load slow) | 加 ≥3 phrase 识别 + kNN match 准确度 + L1→L2 fallback path cells |
| `tests/integration/routing-30-samples.test.ts` (update v2) | phase 1.4 ship Pattern P inline truth table | Pattern P 升级 v2 | engineering 5/5 specific match + total ≥27/30 命中 (≥85% 不再 fallback) |
| `docs/adr/0009-routing-l2-engineering-23-shi-errata.md` | phase 1.4 ADR 0008 (172L 6-section errata) | ADR 0005/0007/0008 errata 6-section 风格 | 加 D1.4-2 v1.1 contract + F40-2 SDK + F42 array semantic match + 23 招式 schema + R6 ship transparency |
| `.planning/phase-1.5/PERF-ATTRIBUTION-2.md` (≥80L) | `.planning/phase-1.3/PERF-ATTRIBUTION.md` (177L) | PERF-ATTRIBUTION 风格沿袭 sister T3 | DAG resolver hot path bench (validate 调用次数 + 时间 ≤5% regress vs phase 1.4 baseline) |
| `scripts/migrate-decision-rules-v1-to-v2.mjs` (W-6 sister) | `scripts/migrate-manifest-v1-to-v2.mjs` (phase 1.3) | scripts/migrate-* 沿袭 | yaml additive: v1 rules 全部保留 + 新增 engineering rules + mattpocock_phases 段；version 1 → 2 |

---

## § 2 Pattern reuse rate 统计

**老 pattern 复用 (8 项)**:
- **Pattern E** (spillover lib/) — `src/routing/lib/embedding.ts` 沿袭 D1.4-3 ralphLoop.ts 模式
- **Pattern H** (IMPL NOTE 顶部) — `dag.ts` 顶部 ≤30L IMPL NOTE block 沿袭
- **Pattern I** (yaml load + Ajv validate) — `decision_rules.yaml` v2 + `semanticRouter.ts` schema parse
- **Pattern J** (fixture-driven BASE+modifier) — `routing-dag.test.ts` + `routing-semanticRouter.test.ts`
- **Pattern K** (env-gated skipIf) — embedding model load slow 时 CI matrix skip
- **Pattern L** (spec-level metadata 字段添加) — `spec.ts` 加 `phase` + `triggers` 沿袭 phase 1.3 加 category/install_type/decision_rules 模式
- **Pattern N** (engine 主流程编排 ≤200L) — `dag.ts` 沿袭 `engine.ts` 170L 内联编排
- **Pattern O** (verbatim 1:1 binding V1 BLOCKER) — `agentDefinition.ts` 12 → 14 字段 enforce 沿袭 phase 1.4 W-5 ship
- **Pattern P** (inline truth table 30 sample) — `routing-30-samples.test.ts` v2 升级

**新生 4 pattern (Q/R/S/T)** — 详见 § 3。

**复用率计算**: 老 8 / (老 8 + 新 4) = **67%**

> 备注: 67% 低于 phase 1.4 (~85%)，但属合理 — phase 1.5 wedge enhancement layer 引入 4 个全新概念 (DAG resolver + Semantic L2 fallback + 23 招式 schema + trigger-based 调度)，每个都是首次落地。新生 pattern 编号续 phase 1.4 P → Q/R/S/T。

---

## § 3 New patterns needed (Q / R / S / T)

### Pattern Q — DAG topological sort + cycle detect

- **位置**: `src/routing/dag.ts`
- **算法**: Kahn algorithm (BFS-based topological sort + 0-indegree queue)
- **作用**: solve manifest dependency 顺序 + cycle 在 schema 阶段 reject (R04 P0#4 lock)
- **与最近 pattern diff**: Pattern N 仅是主流程编排，无图算法；Q 引入 DAG 数据结构 + 循环检测 invariant
- **复杂度**: O(V+E)；≤50 manifest 图 expected V≤50 / E≤200，runtime <5ms

### Pattern R — Semantic Router embedding kNN match

- **位置**: `src/routing/semanticRouter.ts` + `src/routing/lib/embedding.ts`
- **依赖**: OnnxRuntime / @xenova/transformers (轻量 quantized model, ~50MB ondisk)
- **流程**: arbitrate L1 keyword miss → L2 embedding fallback (cosine top-1 match) → L3 LLM supervisor 兜底
- **与最近 pattern diff**: Pattern I 只做 yaml schema parse + 关键词匹配；R 引入 vector embedding + kNN 近似匹配
- **风险**: 模型加载冷启动 + 三平台兼容 (R1 P0)；mitigation 见 § 5

### Pattern S — mattpocock_phases routing schema

- **位置**: `routing/decision_rules.yaml` v2 新增 `mattpocock_phases:` 段
- **结构**: 4 phase × 23 招式 = 92 mapping point；engineering category sub-rules (gstack / GSD / superpowers TDD / brainstorming) reference 招式 ID
- **与最近 pattern diff**: Pattern I yaml schema 是 flat rules array；S 引入嵌套 phase × 招式 二维 mapping table
- **真理 source**: 用户笔记 mattpocock 23 招式 1:1 binding，**不创新**

### Pattern T — Trigger-based 调度 schema

- **位置**: `src/manifest/schema/spec.ts` 加 `triggers` 字段 + A7' 8 支柱 enforcement
- **规则**: task complexity ≥ N → brainstorming required；core business logic / algorithm / high-reliability → TDD required
- **与最近 pattern diff**: Pattern L 是静态 metadata；T 引入条件触发 (runtime evaluate manifest spec 决定是否激活某 skill)
- **schema 形态**: yaml `triggers:` array of `{ condition, required_skill }` objects

---

## § 4 D-19 ~ D-26 decision proposals

沿袭 phase 1.4 D-13 ~ D-18 编号续接：

| ID | 决策 | Rationale |
|---|---|---|
| **D-19** | `dag.ts` ≤ 200L hard limit | 沿袭 D-13 engine.ts 170L 模式 (Pattern N) |
| **D-20** | `semanticRouter.ts` ≤ 150L hard limit | 沿袭 D1.4-7 agentDefinition.ts 148L 模式 (Pattern O) |
| **D-21** | `embedding.ts` spillover lib/ | 沿袭 D1.4-3 ralphLoop.ts 66L spillover 模式 (Pattern E) |
| **D-22** | `decision_rules.yaml` v1 → v2 走 errata 路径 | 沿袭 D-17 ADR errata；version bump 1→2 + `scripts/migrate-decision-rules-v1-to-v2.mjs` (W-6 phase 1.3 sister review 落地) |
| **D-23** | `mattpocock_phases` schema 粒度 = 4 phase × 23 招式 + engineering sub-rules | Pattern S 新生；用户笔记真理 source 1:1 mapping，不创新 |
| **D-24** | D5 三 P1 deferred items 决议 inline ADR 0009 errata | D1.4-2 contract v1.1 / F40-2 SDK / F42 array semantic match 各 independent rationale |
| **D-25** | `PERF-ATTRIBUTION-2.md` acceptance bar D6 sister T3 transparency | 续 phase 1.3 T7.3 模式；DAG resolver hot path bench |
| **D-26** | v0.1.0-alpha.4 release notes Known Limitations inline ADR 0009 § Consequences | sister T2 transparency；R6 ship 透明度 |

---

## § 5 Risk 登记 (R1 ~ R6 phase 1.5 specific)

| ID | 风险 | 严重度 | Mitigation |
|---|---|---|---|
| **R1** | embedding 模型 deps 引入风险 — OnnxRuntime / @xenova/transformers Win/Mac/Linux 兼容性 + cold-start latency + bundle size 50MB+ | 🔴 P0 | Wave 1 Spike 实测三平台兼容；karpathy YAGNI 评估 fallback path (二层 keyword + LLM supervisor)；如 Spike fail 则推迟 L2 至 phase 1.6 |
| **R2** | DAG cycle detection 算法选型 — Kahn vs DFS 对比 | 🟡 P1 | R2 RESEARCH HIGH confidence 推 Kahn (≤50 manifest 图 BFS 队列实现 ~30L 简洁；DFS 递归栈深度可控但需要颜色标记) |
| **R3** | 23 招式 schema 设计粒度过细 / 过粗 — 92 mapping point 是否值得 schema 化 | 🟡 P1 | GRAY-AREA-3 草案沿袭；用户笔记真理 source 1:1 mapping 不创新；如 schema 实测过重则降级为 inline rules array |
| **R4** | D5 三 P1 决议路径混淆 — D1.4-2 / F40-2 / F42 三项各有评估窗口 | 🟡 P1 | ADR 0009 § Decision 段独立 4 items + 每 item independent rationale + transparent ship |
| **R5** | 30 sample re-test 命中率不达 ≥85% engineering 不再 fallback | 🟡 P1 | SAMPLES.md frozen execute 不可改样本，只能调 `decision_rules.yaml` v2 直到 ≥85%；走 D-22 v1→v2 errata 路径；engineering 5 rules 设计需 R3 RESEARCH 兜底 |
| **R6** | `mattpocock_phases` 与 v1 yaml 兼容性 — phase 1.4 ship v1 12 rules + fallback_supervisor + deprecated；phase 1.5 v2 加 mattpocock_phases 段 | 🟢 P2 | yaml schema additive (不动 v1 rules + 新增 mattpocock_phases optional 段)；走 D-22 errata + migration script；ADR 0009 transparency |

---

## § 6 References

**Phase 1.4 全套依赖** (8 prereq from KICKOFF):
- `.planning/phase-1.4/KICKOFF.md`
- `.planning/phase-1.4/PATTERNS.md` (347L — 本文档风格 source)
- `.planning/phase-1.4/RESEARCH.md`
- `.planning/phase-1.4/ASSUMPTIONS.md`
- `.planning/phase-1.4/PLAN.md`
- `.planning/phase-1.4/task_plan.md`
- `.planning/phase-1.4/PLAN-CHECK-round-1.md` + `round-2.md`
- `.planning/phase-1.4/SPIKE-REPORT.md`
- `.planning/phase-1.4/SAMPLES.md` (30 sample frozen)
- `.planning/phase-1.4/VERIFICATION.md`
- `.planning/phase-1.4/progress.md`

**Phase 1.3 sister 模式**:
- `.planning/phase-1.3/PERF-ATTRIBUTION.md` (177L) — sister T3 风格 source

**Phase 1.2.5 GRAY-AREA 草案**:
- `.planning/phase-1.2.5/GRAY-AREA-1.md` (routing engine v1 schema 草案)
- `.planning/phase-1.2.5/GRAY-AREA-3.md` (`mattpocock_phases` routing 草案 — phase 1.5 D4 直接源头)

**ADR 链 (含 0008 errata 6-section 风格沿袭)**:
- `docs/adr/0001-*.md` ~ `docs/adr/0008-*.md`

**用户笔记 (真理 source)**:
- mattpocock 23 招式 1:1 binding (Pattern S source)
- gstack / GSD / superpowers / planning-with-files / andrej-karpathy-skills / ralph-loop 路由层级 (Pattern T source)

---

## § 7 8 支柱 100% capture verify roadmap (phase 1.5 ship 后)

参 KICKOFF § "8 支柱 100% capture verify (phase 1.5 ship 后)" 表完整 8 行 mapping：

| 支柱 ID | 名称 | Phase 1.5 ship 后状态 | 命中 acceptance bar |
|---|---|---|---|
| **A1'** | gstack 决策层关卡 | engineering category L1 keyword 命中 → routing engine 路由至 gstack `/office-hours` `/plan-ceo-review` `/review` | D2 (engineering 5 rules) |
| **A2'** | GSD orchestration | install_type=cli + phase enum 落地；CLI 路由至 GSD `/gsd-discuss-phase` `/gsd-execute-phase` `/gsd-verify-work` | D3 (phase enum + triggers) |
| **A3'** | superpowers 子任务执行 | triggers 字段 evaluate (complexity ≥ N → brainstorming；core logic → TDD) | D3 (Pattern T) |
| **A4'** | planning-with-files 持久化 | DAG resolver 强制 manifest 依赖顺序 + cycle reject；planning 文件结构 schema 化 | D1 (Pattern Q) |
| **A5'** | andrej-karpathy 心法 | spec.ts ≤200L hard limit + surgical changes invariant；karpathy 简洁原则 enforce in CI | D5 (codebase A7' 8 支柱 step) |
| **A6'** | mattpocock 招式 | `mattpocock_phases:` schema 4 phase × 23 招式 mapping；engineering sub-rules reference 招式 ID | D4 (Pattern S) |
| **A7'** | ralph-loop 交付保证 | manifest spec triggers 字段 ralph-loop required for completion-promise 任务；A7 step iterate 1-7→1-8 if needed | D5 + ci.yml |
| **A8'** | UI / 前端工具栈 (ui-ux-pro-max / playwright-cli / @playwright/test / webapp-testing / chrome-devtools-mcp) | install_type 扩展 web 类；routing engine 识别 UI 任务 → 路由至工具链 | D2 + D3 |

**总结**: phase 1.5 ship 后 **8 支柱 100% capture verify**，wedge implementation 三步硬实装收官：
- **Phase 1.3** schema layer (manifest + decision_rules v1 schema 化)
- **Phase 1.4** engine layer (routing engine + decision_rules v1 + 30 sample baseline)
- **Phase 1.5** enhancement layer (DAG + Semantic L2 + 23 招式 schema + triggers + ≥85% 命中)

ADR 0009 errata transparently document D5 三 P1 deferred items 决议路径 + 23 招式 schema 设计 + R6 ship 透明度，确保 v0.1.0-alpha.4 release notes Known Limitations 与 § Consequences 段对齐。
