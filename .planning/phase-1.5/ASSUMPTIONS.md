# Phase 1.5 ASSUMPTIONS — DAG Resolver + Semantic Router L2 + engineering 23 招式 phase routing

> **Locked**: 2026-05-13
> **Author**: gsd-planner (Wave B.1)
> **依赖**: KICKOFF.md / PATTERNS.md / RESEARCH.md (Wave A 全套 HIGH conf)
> **风格沿袭**: phase 1.4 ASSUMPTIONS.md 5 段结构（A 状态表 / B P0 lock / C reuse decisions / D 决策追溯 / E 风险登记 / F References）

本文件锁定 phase 1.5 plan-phase 进入 execute-phase 前所有灰色地带，确保 Wave C plan-checker + Wave D execute-phase 启动无认知歧义。

---

## § A 8 Acceptance Bar 状态表 (phase 1.5 ship 前必 8/8 ✅)

| ID | Acceptance Bar | 当前状态 | Capture 文档 |
|----|----------------|---------|--------------|
| **D1** | DAG resolver + 拓扑排序实装 (`src/routing/dag.ts` ≤ 200L Kahn + cycle detect) | ⏳ pending | PLAN § 2 W2 + task_plan T3.1 + RESEARCH § 1 + PATTERNS Q |
| **D2** | Semantic Router L2 升级 stub (`src/routing/semanticRouter.ts` ≤ 150L return null v0.1) | ⏳ pending | PLAN § 2 W2 + task_plan T3.2-T3.3 + RESEARCH § 2 + PATTERNS R |
| **D3** | engineering category 5 rules + 30 sample re-test ≥ 27/30 specific match | ⏳ pending | PLAN § 2 W3 + task_plan T4.1+T6.4+T6.5 + RESEARCH § 3.3 |
| **D4** | mattpocock 23 招式 phase routing schema (`mattpocock_phases:` yaml v2) + manifest spec `phase` enum + `triggers` 字段 | ⏳ pending | PLAN § 2 W3+W4 + task_plan T4.1+T5.5 + RESEARCH § 3 + PATTERNS S+T |
| **D5** | 3 P1 + 1 fresh deferred 决议 (D1.4-2 v1.1 14 字段 / F40-2 SDK 推 v0.2+ / F42 array semantic match / ralph-wiggum `<promise>` XML wrapper) | ⏳ pending | PLAN § 2 W4 + task_plan T1.1+T5.1+T5.2+T5.3 + RESEARCH § 4 |
| **D6** | PERF-ATTRIBUTION-2.md ship (≥ 80L sister T3 transparency) DAG hot path + ≤ 5% regress | ⏳ pending | PLAN § 2 W6 + task_plan T7.1 + PATTERNS § 4 D-25 |
| **D7** | ADR 0009 errata + accepted + `adr-0009-accepted` tag | ⏳ pending | PLAN § 2 W0+W7 + task_plan T1.1+T8.3 + PATTERNS § 4 D-22+D-24+D-26 |
| **D8** | Cross-OS CI 三平台全绿 + A7 step iter 1-8 → 1-9 + ADR 0001-0008 main body 守恒 | ⏳ pending | PLAN § 2 W0+W6 + task_plan T1.2+T7.2 + KICKOFF § "关键约束 A7 守恒" |

---

## § B 5 P0 灰色地带 Lock (D1.5-1 ~ D1.5-5 from RESEARCH § 5)

每条 lock decision 1:1 引用 RESEARCH HIGH conf source。

### D1.5-1 — DAG resolver 算法选型 + 循环依赖 detection

**Lock**: **Kahn's algorithm (BFS + indegree queue) 自实装** ≤ 200L hard limit (D-19 沿袭 phase 1.4 D-13 engine.ts 170L 模式)；**不引入** `graphlib` / `@dagrejs/graphlib` / `toposort` (karpathy YAGNI — phase 1.5 ≤ 50 manifest 图 30L 自实装够用)；循环依赖在 schema validate 阶段 reject (R04 P0#4 lock 沿袭) — friendly error message 仿 phase 1.1 manifest validate 风格 (`InvalidDecisionError` + cycle nodes 列表 + hint + ADR § reference)。

**理由**:
1. iterative 安全 — Node.js default stack ~10K frame 深图风险规避
2. queue-based 调试日志友好 — BFS 层级 visit order 与 routing engine wave 风格一致
3. 循环 detection 时机自然 — Kahn 跑完后 indegree ≠ 0 即 cycle 成员
4. karpathy simplicity — 30L Kahn vs 50L+ DFS（DFS 需手写 visited + recur stack + cycle detection 三个状态）
5. ≤ 200L hard limit 远未触顶（实测 ~30L core + 注释 + IMPL NOTE ≤ 80L）

**Source**: RESEARCH § 1.1-1.5 (CLRS 22.4 + Tavily fresh 2026 + npm view graphlib 评估) — Conf HIGH。

### D1.5-2 — Semantic Router L2 embedding 模型选型

**Lock**: **phase 1.5 推 v0.2+ deferred — 不引入 ML embedding deps**；走 keyword (L1) + LLM supervisor (L3) 二层兜底（L1 miss → fallback_supervisor LLM 直接走，不抽 L2）；保留 `semanticRouter.match(prompt, threshold) -> Promise<SemanticMatchResult>` 接口 stub return null + interface 完整（v0.2+ 启用时仅替换 stub body，不改 contract）。

**ML embedding 评估触发条件 (v0.2+ window)**:
1. 30 sample 升 100+ sample × 多 model × stability validation 数据收集
2. 用户日志 / SAMPLES.md emerge 至少 10 个 keyword L1 miss + LLM L3 也命中错误 rule 的 case
3. 三平台 CI sandbox + HF model fetch verify 通过

**如未来必引入则 v0.2+ lock**: runtime `@xenova/transformers` (WASM 路径优先，Win 兼容 best) + model BGE-small-en-v1.5 (英文场景) / all-MiniLM-L6-v2 (多语言场景) + cache `~/.cache/huggingface/transformers/`。

**Source**: RESEARCH § 2.1-2.4 (HuggingFace fresh 2026-05-13 model card + npm view + karpathy YAGNI 评估) — Conf HIGH。

### D1.5-3 — mattpocock 23 招式 phase routing schema 设计

**Lock**: **`mattpocock_phases:` yaml v2 4 phase × 21 unique skills × 23 trigger entry mapping table** (discuss 4 + plan 3 + execute 7 + verify 7) + engineering category 5 sub-rules `rule.decision.skills_overlay: { ref: mattpocock_phases.<phase>.skills }` cross-link 模式 + manifest spec 顶层 `phase` enum 字段 optional (`discuss | plan | execute | verify`) + `triggers` 字段 (`complexity_threshold` / `tdd_required` / `brainstorming_required`)。

**真理 source**: 用户笔记 CLAUDE.md 行 8 + 行 38-39 + 行 148 mattpocock 23 招式定义 1:1 提取，**不创新真理 source**；phase 1.2.5 GRAY-AREA-3 草案 cross-verify。

**Source**: RESEARCH § 3.1-3.4 + PATTERNS Pattern S + GRAY-AREA-3 草案 — Conf HIGH。

### D1.5-4 — D5 三 P1 deferred items 决议 + ralph-wiggum `<promise>` XML wrapper 升级

**Lock**: **ADR 0009 errata 4 items inline**:

1. **D1.4-2 contract v1.1**: `agentDefinition.ts` 12 → 14 字段加 `initialPrompt: string` (Stable 2026-05) + `criticalSystemReminder_EXPERIMENTAL: string` (Experimental — 字段名 `_EXPERIMENTAL` suffix 不稳定，文档明示标注)；W-5 V1 BLOCKER drift detector enum 同步扩展 12 → 14 enum value。

2. **F42 array semantic match 升级**: `arbitrate` ≤ 7L → ≤ 30L (D-19 ≤ 200L hard limit 远未触顶) — priority 内 array element substring match (`task.prompt.toLowerCase().includes(trigger.toLowerCase())` + `task.signals?.some(s => s.includes(trigger))`)；不引入 regex / embedding deps (karpathy YAGNI)。

3. **ralph-wiggum `<promise>COMPLETE</promise>` XML wrapper 升级 (R2 fresh 2026-05-13 发现)**: `systemPrompt.ts` prompt template 升级 `^COMPLETE$/m` raw regex → `<promise>([^<]+)</promise>` XML extract；`ralphLoop.ts` regex 同步 `match[1] === "COMPLETE"`；30 sample test prompt body 同步加 `<promise>COMPLETE</promise>`；~10L code change 不破 phase 1.4 12 字段 contract、不破 phase 1.4 30 sample test 命中。

4. **接口契约升级**: phase 1.5 实装中 emerge 微调（如 dag.ts EngineResult 三态 narrow 风格沿袭 / 接口扩展）— inline ADR 0009 § Decision 段。

**Source**: RESEARCH § 4.1-4.4 (code.claude.com/docs Agent SDK fresh 2026-05-13 + ralph-wiggum 官方 plugin docs fresh + W-5 V1 BLOCKER 沿袭) — Conf HIGH。

### D1.5-5 — F40-2 `@anthropic-ai/claude-agent-sdk` deps 引入评估

**Lock**: **phase 1.5 仍推 phase 2.0+ evaluation window**；phase 1.5 用 inline structural interface 1:1 contract § 2 (D-18 1:1 contract 沿袭) + W-5 V1 BLOCKER drift detector 续 + `agentDefinition.ts` 14 字段 v1.1。

**deps 引入触发条件 (phase 2.0+ window)**:
- research workflow E2E 真实 spawn 频率 ≥ 100/day OR Semantic Router L2 真实启用（都不在 phase 1.5 范围）
- npm `@anthropic-ai/claude-agent-sdk` 出 stable 1.0 release（推 2026 H2）

**Source**: RESEARCH § 4.2 (npm view fresh 2026-05-13) — Conf HIGH。

---

## § C D-19 ~ D-26 PATTERNS reuse decisions Lock (from PATTERNS § 4)

沿袭 phase 1.4 D-13 ~ D-18 编号续接：

| ID | Lock | Rationale (引用 PATTERNS § 1-3) |
|----|------|--------------------------------|
| **D-19** | `dag.ts` ≤ 200L hard limit | 沿袭 D-13 engine.ts 170L 模式 (Pattern N) |
| **D-20** | `semanticRouter.ts` ≤ 150L hard limit | 沿袭 D1.4-7 agentDefinition.ts 148L 模式 (Pattern O) |
| **D-21** | `embedding.ts` spillover lib/ (placeholder ≤ 30L interface only) | 沿袭 D1.4-3 ralphLoop.ts 66L spillover 模式 (Pattern E) — v0.1 stub，v0.2+ 实装 |
| **D-22** | `decision_rules.yaml` v1 → v2 走 errata 路径 + `scripts/migrate-decision-rules-v1-to-v2.mjs` (W-6 phase 1.3 sister review 落地) | 沿袭 D-17 ADR errata；version bump 1→2；yaml additive (不动 v1 12 rules + 新增 engineering 5 rules + `mattpocock_phases:` 段) |
| **D-23** | `mattpocock_phases` schema 粒度 = 4 phase × 21 unique skills × 23 trigger entry + engineering sub-rules `skills_overlay: { ref: ... }` cross-link | Pattern S 新生；用户笔记 CLAUDE.md 真理 source 1:1 mapping，**不创新** |
| **D-24** | D5 三 P1 + 1 fresh items 决议 inline ADR 0009 errata | D1.4-2 contract v1.1 / F40-2 SDK / F42 array semantic match / ralph-wiggum XML wrapper 各 independent rationale |
| **D-25** | `PERF-ATTRIBUTION-2.md` acceptance bar D6 sister T3 transparency | 续 phase 1.3 T7.3 模式；DAG resolver hot path bench；manifest validate 调用次数 phase 1.4 baseline (0 hot path) vs phase 1.5 (DAG resolver 调用 N 次)；时间 ≤ 5% regress |
| **D-26** | v0.1.0-alpha.4 release notes Known Limitations inline ADR 0009 § Consequences | sister T2 transparency；R6 ship 透明度 |

---

## § D Phase 1.5 决策追溯表 D1.5-6 ~ D1.5-15 (~10 决策续 D1.5-1~5)

| ID | 决策 | 来源 |
|----|------|------|
| **D1.5-6** | manifest spec 顶层加 `phase: discuss\|plan\|execute\|verify` enum optional 字段 | RESEARCH § 3.4 + PATTERNS Pattern L 1:1 复用 |
| **D1.5-7** | manifest spec 加 `triggers: { complexity_threshold? \| tdd_required? \| brainstorming_required? }` 字段 (A7' 8 支柱 enforcement) | RESEARCH § 3.4 + PATTERNS Pattern T 新生 |
| **D1.5-8** | engineering category 5 specific rule (engineering-discuss-feature / -plan-architecture / -execute-tdd / -execute-debug / -verify-pr) | RESEARCH § 3.3 + KICKOFF D3 + R6 mitigation |
| **D1.5-9** | 30 sample re-test ≥ 27/30 specific match (engineering 5/30 不再 fallback expected — 改为 specific rule match)；SAMPLES.md frozen，只调 yaml v2 | RESEARCH § 5 R5 + KICKOFF D3 |
| **D1.5-10** | `decision_rules.yaml` version 1 → 2 头部加 IMPL NOTE block 引用 ADR 0009 + 版本说明 | PATTERNS § 4 D-22 + 风格沿袭 phase 1.3 spec.ts IMPL NOTE |
| **D1.5-11** | `engine.route()` 主流程升级 — arbitrate 步骤前插 `dag.resolve(allManifests)` 验证；arbitrate 后兜底 `semanticRouter.match()` (v0.1 always null)；保留 fallback_supervisor 三层兜底 | RESEARCH § 2.4 fallback path 设计 + Pattern N 沿袭 |
| **D1.5-12** | `arbitrate()` 升级 ≤ 7L → ≤ 30L 加 array element substring match (per F42) — `decisionRules.ts` 内修改不分裂新文件 | RESEARCH § 4.3 + D1.5-4 sub-item 2 |
| **D1.5-13** | A1' 8 支柱 100% capture verify — engineering category 5 rules ship 后命中 D3 acceptance bar | KICKOFF § "8 支柱 100% capture verify" + PATTERNS § 7 |
| **D1.5-14** | A5' 8 支柱 100% capture verify — `mattpocock_phases:` schema ship 后命中 D4 + 30 sample re-test engineering 招式触发 | KICKOFF § "8 支柱 100% capture verify" + RESEARCH § 3.2 |
| **D1.5-15** | A7' 8 支柱 100% capture verify — manifest spec `triggers:` 字段 ship 后命中 D5 (phase 2.2 ralph-loop full integration 完成 A7' 100%) | KICKOFF § "8 支柱 100% capture verify" + PATTERNS § 7 |

---

## § E Paranoid 风险登记 R1-R6 (PATTERNS § 5 + RESEARCH § 6 合并)

| ID | 风险 | 等级 | mitigation (locked) |
|----|------|------|--------------------|
| **R1** | embedding 模型 deps 引入风险（dep size ~30-55MB / cold-start ~3-7s / 三平台 sandbox HF model fetch verify 通过率 / Win MSVC runtime missing onnxruntime-node issue #21100） | 🔴 P0 | ✅ **mitigated by D1.5-2** — phase 1.5 推 v0.2+ deferred；保留接口 stub return null；评估触发条件 (30 → 100+ sample × 多 model × stability) 都不在 phase 1.5 范围 — **本 phase 风险归零** |
| **R2** | DAG cycle detection 算法选型 + 循环依赖 friendly error 风格不一致 + Node.js stack frame 深图风险 | 🟡 P1 | ✅ **resolved by D1.5-1** — Kahn's algorithm iterative + queue-based ≤ 30L core；循环依赖 schema validate 阶段 reject (R04 P0#4 lock 沿袭)；friendly error 仿 phase 1.1 manifest validate 风格；`InvalidDecisionError` + cycle nodes + hint + ADR § ref |
| **R3** | 23 招式 schema 设计粒度过细 / 过粗（不创新真理 source / 1:1 用户笔记 mattpocock 23 招式定义） | 🟡 P1 | ✅ **mitigated by D1.5-3** — 1:1 用户笔记 CLAUDE.md routing rules 真理 source，不创新；4 phase × 21 unique skills × 23 trigger entry mapping table 完整；engineering category sub-rules `skills_overlay: { ref: ... }` cross-link 模式不内联避免 duplicate；30 sample re-test ≥ 27/30 命中 verify schema 设计正确 |
| **R4** | D5 三 P1 + 1 fresh 决议路径混淆（D1.4-2 v1.1 / F40-2 SDK / F42 / ralph-wiggum XML wrapper 各评估窗口） | 🟡 P1 | ✅ **mitigated by D1.5-4 + D1.5-5** — ADR 0009 § Decision 4 items inline 每 item independent rationale；F40-2 SDK deps 单独 D1.5-5 lock 推 phase 2.0+；ralph-wiggum XML wrapper 升级单独 D1.5-4 sub-item 3 inline rationale |
| **R5** | 30 sample re-test 命中率不达 ≥ 85% engineering 不再 fallback expected baseline（含 specific rule match 升级 21/30 → ≥ 27/30） | 🟡 P1 | mitigation: **SAMPLES.md frozen + 调 yaml v2 直到 ≥ 27/30 hit**（R3 phase 1.4 sister review 沿袭 — yaml v1 调到 21/30 specific rule + 9/30 fallback expected = 30/30 100% 模式继承）；如反复 < 27/30 → 走 § C blocker 触发 main agent pause + 二次 sister review |
| **R6** | ralph-wiggum XML wrapper 升级 vs `--add-plugin ralph-wiggum` 切换路径选择 + `mattpocock_phases` 与 v1 yaml 兼容性 | 🟢 P2 | mitigation: phase 1.5 升级 raw `^COMPLETE$` regex → `<promise>COMPLETE</promise>` XML wrapper（~10L code change 不破 contract）；切换官方 plugin 仍推 v0.2+ ADR 0010+ evaluation window；yaml schema additive (不动 v1 12 rules + 新增 mattpocock_phases optional 段)；走 D-22 errata + migration script (W-6 phase 1.3 sister review 落地)；ADR 0009 transparency |

---

## § F References

### 用户笔记真理 source (1:1 提取，不创新)

- `~/.claude/CLAUDE.md` 行 8 + 行 38-39 + 行 148 — mattpocock 23 招式 4 phase × 招式 mapping 真理 source（discuss `/grill-with-docs` `/to-prd` `/grill-me` `/explore` 4 + plan `/to-issues` `/grill-me` `/design-review` 3 + execute `/tdd` `/diagnose` `/zoom-out` `/caveman` `/grill-with-docs` `/playwright-cli` `/improve-codebase-architecture` 7 + verify `/qa` `/review` `/code-review` `/cso` `/security-review` `/retro` `/ship` 7 = 21 unique × 23 trigger entry）

### Phase 1.5 Wave A (本 phase 调研全套)

- `.planning/phase-1.5/KICKOFF.md` (166L — 8 acceptance bar D1-D8 + 8 phase 1.4 prereq + Wave 分解 + 8 支柱 100% capture roadmap)
- `.planning/phase-1.5/RESEARCH.md` (571L HIGH conf — 4 P0 + 1 fresh lock + 6 风险 + ralph-wiggum XML wrapper fresh 发现)
- `.planning/phase-1.5/PATTERNS.md` (165L — 9 新文件 mapping + 4 新生 pattern Q/R/S/T + 8 决策提案 D-19~D-26 + 6 风险)

### Phase 1.4 全套（8 prereq from KICKOFF）

- `.planning/phase-1.4/KICKOFF.md` / `PATTERNS.md` / `RESEARCH.md` / `ASSUMPTIONS.md` / `PLAN.md` / `task_plan.md` / `PLAN-CHECK-round-1.md` + `round-2.md` / `SPIKE-REPORT.md` / `SAMPLES.md` (30 sample frozen) / `VERIFICATION.md` / `progress.md`

### Phase 1.2.5 GRAY-AREA 草案

- `.planning/phase-1.2.5/GRAY-AREA-1.md` (routing engine v1 schema 草案)
- `.planning/phase-1.2.5/GRAY-AREA-3.md` (`mattpocock_phases` routing schema 草案 — phase 1.5 D4 直接源头)

### Phase 1.3 sister 模式 source

- `.planning/phase-1.3/PERF-ATTRIBUTION.md` (177L sister T3 风格 source — phase 1.5 PERF-ATTRIBUTION-2.md 沿袭)

### ADR 链 (含 0008 errata 6-section 风格沿袭)

- `docs/adr/0001-*.md` ~ `docs/adr/0008-*.md` (phase 1.5 加 ADR 0009 errata)

### Fresh 2026-05-13 sources (RESEARCH § 7 完整列表)

- code.claude.com/docs Agent SDK (D1.4-2 contract v1.1 fresh shape) / anthropics/claude-code/plugins/ralph-wiggum 官方 plugin docs (`<promise>` XML wrapper 推荐) / HuggingFace BGE-small-en-v1.5 + all-MiniLM-L6-v2 model card / npm view @xenova/transformers + onnxruntime-node + @anthropic-ai/claude-agent-sdk

---

**phase 1.5 ASSUMPTIONS lock 完成** — Wave C plan-checker 进场审验，Wave D execute-phase 启动准备。
