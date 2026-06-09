# Phase 1.5 PLAN — DAG Resolver + Semantic Router L2 + engineering 23 招式 phase routing

> **Authored**: 2026-05-13
> **Author**: gsd-planner (Wave B.2)
> **依赖**: KICKOFF.md / PATTERNS.md / RESEARCH.md / ASSUMPTIONS.md (Wave A + B.1 全套)
> **风格沿袭**: phase 1.4 PLAN.md 8 段结构（Goal & Scope / 8-Wave 拓扑 / 任务表 / 接口契约 / 风险 / 接受标准 / Wave Acceptance / phase 边界）

---

## § 1 Goal & Scope

### 1.1 Goal

phase 1.5 是 v0.1.0 wedge implementation 三步硬实装的 **enhancement layer 收官**：DAG resolver + Semantic Router L2 升级 (stub form, v0.2+ deferred) + engineering category 5 specific routing rules + mattpocock 23 招式 phase routing schema (`mattpocock_phases:` yaml v2) + 3 P1 + 1 fresh deferred items 决议 (D1.4-2 contract v1.1 / F40-2 SDK / F42 array semantic match / ralph-wiggum `<promise>` XML wrapper) + PERF-ATTRIBUTION-2.md transparency。

**ship 后 8 支柱 100% capture verify** — 完成 phase 1.3 schema layer + phase 1.4 engine layer + phase 1.5 enhancement layer 三步。

### 1.2 In Scope (D1-D8 8 acceptance bar — 详 KICKOFF / ASSUMPTIONS § A)

- **D1**: `src/routing/dag.ts` (≤ 200L Kahn + cycle detect) + `tests/unit/routing-dag.test.ts` (≥ 10 cell)
- **D2**: `src/routing/semanticRouter.ts` (≤ 150L stub return null v0.1) + `src/routing/lib/embedding.ts` (placeholder ≤ 30L interface only) + `tests/unit/routing-semanticRouter.test.ts` (≥ 8 cell)
- **D3**: `routing/decision_rules.yaml` v2 engineering 5 rules + 30 sample re-test ≥ 27/30 specific rule match
- **D4**: `mattpocock_phases:` yaml v2 段 (4 phase × 21 unique skills × 23 trigger entry) + `src/manifest/schema/spec.ts` 加 `phase` enum + `triggers` 字段
- **D5**: ADR 0009 errata 4 items inline (D1.4-2 v1.1 14 字段 / F40-2 SDK 推 v0.2+ / F42 array semantic match / ralph-wiggum XML wrapper)
- **D6**: `.planning/phase-1.5/PERF-ATTRIBUTION-2.md` (≥ 80L sister T3 transparency, DAG hot path bench, ≤ 5% regress)
- **D7**: `docs/adr/0009-routing-l2-engineering-23-shi-errata.md` accepted + `adr-0009-accepted` tag pushed
- **D8**: Cross-OS CI 三平台保持全绿 + A7 step iter 1-8 → 1-9 + ADR 0001-0008 main body 守恒

### 1.3 Out of Scope (推 phase 2.0+)

| 项 | 推迟到 | 触发条件 / Rationale |
|----|-------|---------------------|
| Semantic Router L2 ML embedding 真实启用 | phase 2.0+ (D1.5-2 lock) | 30 sample 升 100+ × 多 model × stability validation；用户日志 emerge 至少 10 个 L1 miss + L3 错命中 case；三平台 CI HF model fetch verify |
| `@anthropic-ai/claude-agent-sdk` deps 引入 | phase 2.0+ (D1.5-5 lock) | research workflow E2E spawn 频率 ≥ 100/day OR Semantic Router L2 真实启用；npm SDK stable 1.0 release (推 2026 H2) |
| ralph-loop full integration | phase 2.2+ (KICKOFF 边界) | execute-task workflow 主线 ship 后；A7' 8 支柱 100% 闭环 |
| 4 placeholder installer 实装 | phase 2.1+ (KICKOFF 边界) | execute-task workflow 复用真实 install adapter |
| design / content / testing extension installer | phase 2.3+ (KICKOFF 边界) | 真实候选 skill emerge + 三平台 sandbox install verify |
| `--add-plugin ralph-wiggum` 切换 | phase 2.1+ ADR 0010+ (D1.5-4 sub-item 3 备注) | stop-hook in-session loop vs 自实装 ralphLoop.ts 行为差异 evaluate；W-5 V1 BLOCKER 升级 path |

---

## § 2 8-Wave 拓扑

每 wave 含目标 / 输出 / 任务 ID 范围 / 验收信号。

### Wave 0 — ADR 0009 errata draft + ci.yml A7 step iter 1-9 (~30 min)

- **目标**: 起草 ADR 0009 errata + ci.yml A7 step iterate 1-8 → 1-9 (D7 + D8 baseline)
- **输出**: `docs/adr/0009-routing-l2-engineering-23-shi-errata.md` draft (≥ 100L 6-section 沿袭 ADR 0008) + `adr-0009-accepted` tag (Wave 7 push) + `.github/workflows/ci.yml` A7 step iter 1-9
- **任务**: T1.1 + T1.2
- **验收**: ADR 0009 draft ≥ 100L 含 4 errata items + Consequences 内联 release notes Known Limitations；ci.yml A7 step grep -c "adr-XX-accepted" 命中 9 次

### Wave 1 — Spike (Kahn DAG + ralph-wiggum XML wrapper) (~60 min)

- **目标**: Spike 实测 Kahn algorithm 5 manifest 图 + cycle detect verify + ralph-wiggum `<promise>COMPLETE</promise>` XML wrapper feasibility
- **输出**: `scripts/spike/dag-and-promise-xml.sh` + `.planning/phase-1.5/SPIKE-REPORT-2.md` (≥ 50L)
- **任务**: T2.1 + T2.2
- **验收**: Spike Kahn 5 manifest 拓扑顺序正确 + 1 cycle case detected；XML wrapper extract regex `<promise>([^<]+)</promise>` match group 1 = "COMPLETE" 在 think-out-loud 含 raw COMPLETE 文本时不 false positive (对照 phase 1.4 raw `^COMPLETE$/m` regex)

### Wave 2 — DAG resolver + Semantic Router stub + engine.route 升级 (~3-4h)

- **目标**: D1 + D2 ship — `dag.ts` (Kahn ≤ 200L) + `semanticRouter.ts` (stub ≤ 150L) + `lib/embedding.ts` (placeholder ≤ 30L) + `engine.ts` 升级 arbitrate 主流程
- **输出**: 4 个 src/routing 文件 + `src/routing/index.ts` barrel re-export
- **任务**: T3.1 ~ T3.5
- **验收**: `npm run typecheck` 通过；4 文件 LOC 不超 D-19/D-20/D-21 hard limit；engine.route 主流程编排 phase 1.4 6+ wave 风格沿袭 (无 spillover 主流程到 dag/semanticRouter 内)

### Wave 3 — decision_rules.yaml v2 + engineering 5 rules + mattpocock_phases 段 + migration script (~2-3h)

- **目标**: D3 + D4 ship — yaml v1 → v2 + engineering 5 specific rule + `mattpocock_phases:` 段 + migration script + arbitrate ≤ 30L 升级 (per F42)
- **输出**: `routing/decision_rules.yaml` v2 + `scripts/migrate-decision-rules-v1-to-v2.mjs` + `src/routing/decisionRules.ts` 升级
- **任务**: T4.1 ~ T4.3
- **验收**: yaml v2 schema parse 成功；engineering 5 rule id 全 grep 命中；migration script `node scripts/migrate-decision-rules-v1-to-v2.mjs` dry-run idempotent；`decisionRules.ts` arbitrate ≤ 30L

### Wave 4 — D5 ADR 0009 errata 4 items 实装 (systemPrompt + ralphLoop XML wrapper / agentDefinition 14 字段 / spec.ts phase enum) (~2-3h)

- **目标**: D4 + D5 ship — `<promise>` XML wrapper 升级 + 14 字段 1:1 binding + spec.ts `phase` enum + `triggers` 字段
- **输出**: `src/routing/systemPrompt.ts` + `src/routing/lib/ralphLoop.ts` + `src/routing/agentDefinition.ts` + `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 errata + `src/manifest/schema/spec.ts`
- **任务**: T5.1 ~ T5.5
- **验收**: systemPrompt prompt body 含 `<promise>COMPLETE</promise>` verbatim；ralphLoop regex `<promise>([^<]+)</promise>`；`agentDefinition.ts` 14 字段（含 `initialPrompt` Stable + `criticalSystemReminder_EXPERIMENTAL` Experimental 标注）；contract.md errata 6-section inline 不动 main body (A7 守恒)；spec.ts `phase` enum + `triggers` z.object schema 完整

### Wave 5 — Tests (routing-dag + routing-semanticRouter + routing-engine 升级 + 30 sample re-test + SAMPLES.md 升级) (~2-3h)

- **目标**: 全部 unit + integration tests 升级 / 新建；30 sample re-test ≥ 27/30
- **输出**: `tests/unit/routing-dag.test.ts` (≥ 10 cell) + `tests/unit/routing-semanticRouter.test.ts` (≥ 8 cell) + `tests/unit/routing-engine.test.ts` 升级 + `tests/integration/routing-30-samples.test.ts` 升级 + `.planning/phase-1.4/SAMPLES.md` v2 update（仅升级 9 sample expected_rule_id — engineering 5 + F42 array semantic 4）
- **任务**: T6.1 ~ T6.5
- **验收**: `npm test` 三平台全绿；routing-dag.test.ts ≥ 10 cell；routing-semanticRouter.test.ts ≥ 8 cell (含 stub null verify + interface contract assert)；30 sample test pass total ≥ 27/30 specific rule match (含 engineering 5/5 specific match + F42 array 4 升级 specific match)

### Wave 6 — PERF-ATTRIBUTION-2.md + Cross-OS CI verify (~60 min)

- **目标**: D6 + D8 ship — DAG resolver hot path bench；Cross-OS CI 三平台全绿 + A7 step iter 1-9 verify
- **输出**: `.planning/phase-1.5/PERF-ATTRIBUTION-2.md` (≥ 80L) + CI run 三平台全绿 GH artifact link
- **任务**: T7.1 ~ T7.3
- **验收**: PERF-ATTRIBUTION-2.md ≥ 80L 含 baseline 28ms phase 1.3 ship + DAG resolver 调用次数 (phase 1.4 hot path 0 vs phase 1.5 N) + 时间 ≤ 5% regress threshold；CI run ID 三平台全绿；ci.yml A7 step grep `adr-XX-accepted` count = 9

### Wave 7 — Docs + ship + tag (~60 min)

- **目标**: D7 ship — `adr-0009-accepted` tag pushed；STATE.md phase 1.5 SHIPPED + 6/17；VERIFICATION.md ≥ 150L；phase 2.0 prereq notes
- **输出**: `.planning/STATE.md` 更新 + `.planning/phase-1.5/VERIFICATION.md` (≥ 150L) + `git tag adr-0009-accepted` + `git tag v0.1.0-alpha.5-routing-l2-engineering` (main agent decide push) + ROADMAP.md 更新 phase 1.5 ship + phase 2.0 prereq notes
- **任务**: T8.1 ~ T8.4
- **验收**: STATE.md phase 1.5 SHIPPED 行 + 6/17 phase ≈ 35.3% + B-4 audit 持续；VERIFICATION.md D1-D8 复现命令 + Phase 2.0 prereq + Findings 索引；tag pushed (main agent decide)；ROADMAP.md 8 支柱 100% capture verify roadmap closure

---

## § 3 任务表 (~25-30 atomic 子任务 — 详 task_plan.md 各 task 验收 / 决策来源)

| Wave | Task ID | 文件 | 决策来源 |
|------|---------|------|---------|
| 0 | T1.1 | `docs/adr/0009-routing-l2-engineering-23-shi-errata.md` | D7 + D-22 + D-24 + D-26 + ADR 0008 6-section 风格 |
| 0 | T1.2 | `.github/workflows/ci.yml` A7 step iter 1-9 | D8 + A7 守恒 |
| 1 | T2.1 | `scripts/spike/dag-and-promise-xml.sh` | D1.5-1 + D1.5-4 sub-item 3 (R2 fresh) |
| 1 | T2.2 | `.planning/phase-1.5/SPIKE-REPORT-2.md` | Spike verdict 沿袭 phase 1.4 模式 |
| 2 | T3.1 | `src/routing/dag.ts` (≤ 200L Kahn) | D1 + D-19 + Pattern Q |
| 2 | T3.2 | `src/routing/semanticRouter.ts` (≤ 150L stub) | D2 + D-20 + Pattern R + D1.5-2 |
| 2 | T3.3 | `src/routing/lib/embedding.ts` (≤ 30L placeholder) | D-21 + Pattern E + D1.5-2 |
| 2 | T3.4 | `src/routing/engine.ts` 升级 (≤ 200L) | D1.5-11 + Pattern N |
| 2 | T3.5 | `src/routing/index.ts` barrel | Pattern N + 沿袭 phase 1.4 ship |
| 3 | T4.1 | `routing/decision_rules.yaml` v1 → v2 | D3 + D4 + D-22 + D-23 + Pattern S |
| 3 | T4.2 | `scripts/migrate-decision-rules-v1-to-v2.mjs` | D-22 + W-6 phase 1.3 sister review |
| 3 | T4.3 | `src/routing/decisionRules.ts` 升级 (arbitrate ≤ 30L) | D1.5-4 sub-item 2 + D1.5-12 + F42 |
| 4 | T5.1 | `src/routing/systemPrompt.ts` 升级 | D5 + D1.5-4 sub-item 3 + R2 fresh |
| 4 | T5.2 | `src/routing/lib/ralphLoop.ts` 升级 | D5 + D1.5-4 sub-item 3 |
| 4 | T5.3 | `src/routing/agentDefinition.ts` 12 → 14 字段 | D5 + D1.5-4 sub-item 1 + W-5 V1 BLOCKER |
| 4 | T5.4 | `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` v1.1 errata | D5 + A7 守恒 + ADR 0009 § Decision |
| 4 | T5.5 | `src/manifest/schema/spec.ts` 加 `phase` enum + `triggers` | D4 + D1.5-6 + D1.5-7 + Pattern L + Pattern T |
| 5 | T6.1 | `tests/unit/routing-dag.test.ts` (≥ 10 cell) | D1 + Pattern J |
| 5 | T6.2 | `tests/unit/routing-semanticRouter.test.ts` (≥ 8 cell) | D2 + Pattern J + Pattern K |
| 5 | T6.3 | `tests/unit/routing-engine.test.ts` 升级 | D5 (XML wrapper / 14 字段 / dag inject / array semantic) |
| 5 | T6.4 | `tests/integration/routing-30-samples.test.ts` 升级 | D3 + D1.5-9 + R5 mitigation |
| 5 | T6.5 | `.planning/phase-1.4/SAMPLES.md` v2 update (9 sample) | D-22 v1→v2 errata + D3 |
| 6 | T7.1 | `.planning/phase-1.5/PERF-ATTRIBUTION-2.md` (≥ 80L) | D6 + D-25 sister T3 |
| 6 | T7.2 | CI 三平台全绿 verify + push origin | D8 + A7 守恒 |
| 6 | T7.3 | (可选 hotfix) | phase 1.2.1 / 1.3.1 / 1.4.1 模式 |
| 7 | T8.1 | `.planning/STATE.md` 更新 phase 1.5 SHIPPED | KICKOFF § 8 支柱 100% capture verify |
| 7 | T8.2 | `.planning/phase-1.5/VERIFICATION.md` (≥ 150L) | D1-D8 复现命令 + Phase 2.0 prereq |
| 7 | T8.3 | `git tag adr-0009-accepted` + `git tag v0.1.0-alpha.5-routing-l2-engineering` | D7 + main agent decide push |
| 7 | T8.4 | `.planning/ROADMAP.md` phase 2.0 prereq notes | KICKOFF § 8 支柱 100% capture roadmap closure |

---

## § 4 接口契约 (phase 2.0 prereq) — 6-8 接口供 phase 2.0 v0.2.0 起点消费

phase 1.5 ship 后 frozen 接口（phase 2.0 execute-task workflow + ralph-loop full integration 实装时直接消费）：

1. **`resolveDag(nodes: DagNode[]) -> DagResolveResult`** (`src/routing/dag.ts`) — Kahn 拓扑排序，三态 `{ ok, order? cycle? }` 沿袭 EngineResult discriminated union 风格 (F41 takeaway)
2. **`semanticRouter.match(prompt: string, threshold: number = 0.85) -> Promise<SemanticMatchResult>`** (`src/routing/semanticRouter.ts`) — v0.1 stub return null；v0.2+ 启用时仅替换 stub body 不改 contract
3. **`SemanticMatchResult`** type — `{ matched: boolean; rule: Rule | null; confidence: number }` 三态 narrow
4. **`engine.route(task, opts) -> Promise<EngineResult>`** 升级 (`src/routing/engine.ts`) — arbitrate 前插 dag.resolve；arbitrate 后兜底 semanticRouter.match (v0.1 always null)；保留 fallback_supervisor 三层兜底 — 主流程接口契约 phase 1.4 frozen 不破
5. **`decision_rules.yaml v2 mattpocock_phases:`** 段 schema — 4 phase × skills array + triggers array；engineering category sub-rules `skills_overlay: { ref: mattpocock_phases.<phase>.skills }` cross-link
6. **`AgentDefinition` v1.1 14 字段** (`src/routing/agentDefinition.ts`) — phase 1.4 12 字段 + `initialPrompt: string` (Stable) + `criticalSystemReminder_EXPERIMENTAL: string` (Experimental — 字段名 suffix 不稳定标注 contract.md errata 内联)
7. **`ManifestSpec` 升级** (`src/manifest/schema/spec.ts`) — 加 `phase: z.enum(["discuss", "plan", "execute", "verify"]).optional()` + `triggers: z.object({ complexity_threshold? \| tdd_required? \| brainstorming_required? }).optional()`
8. **`<promise>COMPLETE</promise>` XML wrapper 协议** — systemPrompt const + ralphLoop regex `<promise>([^<]+)</promise>` extract — phase 2.1+ `--add-plugin ralph-wiggum` 切换时 prompt 不变 (1:1 顺滑切换)

---

## § 5 风险登记 (R1-R6 from ASSUMPTIONS § E + mitigation 一行总结)

| ID | 风险 | 等级 | mitigation 一行 |
|----|------|------|----------------|
| R1 | embedding 模型 deps 引入 (size + cold-start + 三平台) | 🔴 P0 | ✅ D1.5-2 推 v0.2+ deferred — 本 phase 风险归零；保留接口 stub return null |
| R2 | DAG cycle detection 算法选型 + Node.js stack 深度 | 🟡 P1 | ✅ D1.5-1 Kahn iterative + queue-based ≤ 30L core；schema validate 阶段 reject (R04 P0#4) |
| R3 | 23 招式 schema 设计粒度过细 / 过粗 | 🟡 P1 | ✅ D1.5-3 用户笔记 1:1 真理 source 不创新；engineering sub-rules `skills_overlay: { ref: ... }` cross-link 模式不内联避免 duplicate |
| R4 | D5 三 P1 + 1 fresh 决议路径混淆 | 🟡 P1 | ✅ D1.5-4 + D1.5-5 ADR 0009 § Decision 4 items inline 各 independent rationale |
| R5 | 30 sample re-test 命中率 < 27/30 | 🟡 P1 | SAMPLES.md frozen + 调 yaml v2；如反复 < 27/30 → blocker 触发 main agent pause + 二次 sister review |
| R6 | ralph-wiggum XML wrapper 升级 vs 切换路径 + yaml v1 → v2 兼容性 | 🟢 P2 | ~10L code change + yaml additive；切换官方 plugin 推 v0.2+ ADR 0010+；migration script W-6 落地 |

---

## § 6 接受标准 (goal-backward verify) — D1-D8 8/8 详细复现命令

```bash
# D1 — DAG resolver + 拓扑排序实装
wc -l src/routing/dag.ts                      # ≤ 200L
npm test -- tests/unit/routing-dag.test.ts    # ≥ 10 cell pass

# D2 — Semantic Router L2 stub
wc -l src/routing/semanticRouter.ts           # ≤ 150L
wc -l src/routing/lib/embedding.ts            # ≤ 30L (placeholder)
npm test -- tests/unit/routing-semanticRouter.test.ts  # ≥ 8 cell pass

# D3 — engineering 5 rules + 30 sample re-test
grep -c "id: engineering-" routing/decision_rules.yaml  # = 5
npm test -- tests/integration/routing-30-samples.test.ts  # specific match ≥ 27/30 + total = 30/30

# D4 — mattpocock_phases schema + manifest spec phase enum + triggers
grep -c "mattpocock_phases:" routing/decision_rules.yaml  # ≥ 1
grep -c "phase: z.enum" src/manifest/schema/spec.ts       # ≥ 1
grep -c "triggers: z.object" src/manifest/schema/spec.ts  # ≥ 1

# D5 — ADR 0009 errata 4 items + agentDefinition 14 字段 + XML wrapper
grep -c "## Decision" docs/adr/0009-routing-l2-engineering-23-shi-errata.md  # ≥ 1 (含 4 sub-item)
grep -c "initialPrompt" src/routing/agentDefinition.ts                        # ≥ 1
grep -c "criticalSystemReminder_EXPERIMENTAL" src/routing/agentDefinition.ts  # ≥ 1
grep -c "<promise>COMPLETE</promise>" src/routing/systemPrompt.ts             # ≥ 1
grep -c "<promise>(\[^<\]+)</promise>" src/routing/lib/ralphLoop.ts            # ≥ 1

# D6 — PERF-ATTRIBUTION-2.md ship
wc -l .planning/phase-1.5/PERF-ATTRIBUTION-2.md  # ≥ 80L

# D7 — ADR 0009 accepted + tag
git tag -l adr-0009-accepted                    # 命中
cat docs/adr/0009-routing-l2-engineering-23-shi-errata.md | head -1  # 含 status: Accepted

# D8 — Cross-OS CI 三平台全绿 + A7 step iter 1-9 + ADR 0001-0008 main body 守恒
gh run list --workflow ci.yml --limit 1         # 三平台全 success
grep -c "adr-.*-accepted" .github/workflows/ci.yml  # = 9
git diff origin/phase-1.4-ship..HEAD docs/adr/0001-*.md docs/adr/0008-*.md  # 0 行变更 (errata only A7 守恒)
```

---

## § 7 Wave Acceptance Checkpoint 表

| Wave | Acceptance | 触发条件 | Blocker 处理 |
|------|-----------|---------|-------------|
| 0 | ADR 0009 draft ≥ 100L + ci.yml A7 step iter 1-9 | T1.1 + T1.2 完成 | draft 缺 4 errata sub-item → revise；ci.yml grep < 9 → revise |
| 1 | Spike report verdict GO | T2.1 + T2.2 完成 | XML wrapper false positive → 调整 regex；Kahn cycle detect fail → revise algorithm |
| 2 | typecheck 通过 + 4 文件 LOC ≤ hard limit | T3.1 ~ T3.5 完成 | LOC 超 → split spillover 到 lib/；typecheck fail → revise interface |
| 3 | yaml v2 schema parse + engineering 5 rule + migration idempotent | T4.1 ~ T4.3 完成 | yaml schema fail → revise；migration non-idempotent → revise script |
| 4 | systemPrompt + ralphLoop XML wrapper + agentDefinition 14 字段 + spec.ts phase + triggers | T5.1 ~ T5.5 完成 | contract.md main body 动 → revert；14 字段 enum drift → revise W-5 V1 BLOCKER |
| 5 | 全部 unit + integration tests pass + 30 sample ≥ 27/30 | T6.1 ~ T6.5 完成 | < 27/30 → 调 yaml v2 (R5 mitigation)；如反复 fail → blocker 触发 sister review |
| 6 | PERF-ATTRIBUTION-2.md ≥ 80L + CI 三平台全绿 + A7 step iter 1-9 verify | T7.1 + T7.2 完成 | regress > 5% → revise dag.ts hot path；CI red → T7.3 hotfix |
| 7 | STATE.md phase 1.5 SHIPPED + VERIFICATION.md ≥ 150L + tag pushed + ROADMAP.md 更新 | T8.1 ~ T8.4 完成 | tag push fail → main agent retry；STATE.md 缺字段 → revise |

---

## § 8 phase 1.5 vs phase 2.0 边界

| 维度 | phase 1.5 (本 phase) | phase 2.0 (v0.2.0 起点) |
|------|---------------------|------------------------|
| **routing layer** | DAG resolver (Kahn) + Semantic Router L2 stub (return null) + L1 keyword + L3 LLM supervisor 二层兜底 | Semantic Router L2 真实启用 (ML embedding kNN) + research workflow E2E 真实 spawn |
| **engineering routing** | engineering category 5 specific rule + `mattpocock_phases:` schema | execute-task workflow 主线 + ralph-loop full integration |
| **deps** | 0 新引入 deps (D1.5-2 + D1.5-5 推 v0.2+) | `@xenova/transformers` (Semantic L2) + `@anthropic-ai/claude-agent-sdk` (D1.5-5 评估窗口) |
| **placeholder installer** | spec.ts `phase` enum + `triggers` 字段 schema 定义 (静态) | 4 placeholder installer 实装 (运行时) |
| **extension installer** | (推 phase 2.3+ — design / content / testing 真实候选 emerge 后) | execute-task workflow 复用 |
| **8 支柱 capture** | 100% capture 完成 (A1' / A5' / A7' 静态 schema + verify roadmap) | A7' ralph-loop full integration 完成 100% 闭环 (phase 2.2) |
| **Acceptance bar** | D1-D8 8/8 + 30 sample ≥ 27/30 specific match | (phase 2.0 KICKOFF 定义) |

---

**phase 1.5 PLAN complete** — Wave C plan-checker verify entry，Wave D execute-phase 启动准备 (main agent decide pause review or batch 1 直接 execute)。
