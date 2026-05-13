# Phase 1.5 task_plan.md — Atomic 子任务清单 (planning-with-files 标准)

> **Maintained**: 2026-05-13 (Wave B.3 by gsd-planner)
> **依赖**: KICKOFF.md + RESEARCH.md + PATTERNS.md + ASSUMPTIONS.md + PLAN.md (Wave A + B.1 + B.2)
> **风格沿袭**: phase 1.4 task_plan.md (~570L / 21 atomic / 7 wave) 1:1 mirror — 含 8 wave / 28 atomic 子任务 / 各 task 含 目标 / 文件 / 内容大纲 / 后置命令 / 验收 / 决策来源
> **共 28 atomic task** (T1.1-T1.2 / T2.1-T2.2 / T3.1-T3.5 / T4.1-T4.3 / T5.1-T5.5 / T6.1-T6.5 / T7.1-T7.3 / T8.1-T8.4)

---

## Header — 维护规则

### A. Commit message 格式 (沿袭 phase 1.4)

```
phase-1.5: T<W>.<N> <一句话目标>
```

例: `phase-1.5: T3.1 src/routing/dag.ts (Kahn ≤ 200L) + IMPL NOTE`

特殊 commit (沿袭 phase 1.3 / 1.4 模式):
- `phase-1.5: progress.md F<N> <一句话>` — progress 滚动更新
- `phase-1.5: T1.1 ADR 0009 errata draft + adr-0009-accepted tag` — Wave 0
- `phase-1.5: T7.1 PERF-ATTRIBUTION-2.md ship sister T3` — Wave 6
- `phase-1.5: T8.3 git tag v0.1.0-alpha.5-routing-l2-engineering` — Wave 7

### B. ralph-loop wrap (子任务交付保证)

子任务执行用 ralph-loop wrap (沿袭 phase 1.4 模式 + R2 fresh `<promise>COMPLETE</promise>` XML wrapper 升级 — execute 阶段实测 phase 1.5 升级版本可用性，phase 1.4 自实装 raw `^COMPLETE$` regex 仍兼容):

```
/ralph-loop "实现 [子任务描述]。完成标准：[验收 checkbox]、符合 karpathy simplicity 原则、A7 守恒 (ADR 0001-0008 main body 不动)。完成后输出 <promise>COMPLETE</promise>" --max-iterations 20 --completion-promise "COMPLETE"
```

### C. A7 守恒持续 (D8 acceptance bar)

ADR 0001-0008 main body 不动；本 phase 加 ADR 0009 errata 而非 0001-0008 修改。`ci.yml` A7 step iterate 1-8 → 1-9 (新加 `adr-0009-accepted` baseline tag — 4 处 sed-style sync L34-L38 + L42 + L53 + L64)。

每次 commit 前自检:
```bash
grep -c "adr-.*-accepted" .github/workflows/ci.yml      # = 9 (Wave 0 之后)
git diff origin/phase-1.4-ship..HEAD docs/adr/0001-*.md docs/adr/0008-*.md  # 应 0 行
```

### D. D1-D8 8 acceptance bar checklist (phase 1.5 ship 前必 8/8 ✅)

- [ ] D1 — `src/routing/dag.ts` (≤ 200L Kahn) + `tests/unit/routing-dag.test.ts` (≥ 10 cell)
- [ ] D2 — `src/routing/semanticRouter.ts` (≤ 150L stub) + `lib/embedding.ts` (≤ 30L) + `tests/unit/routing-semanticRouter.test.ts` (≥ 8 cell)
- [ ] D3 — engineering 5 specific rule + 30 sample re-test ≥ 27/30 specific match
- [ ] D4 — `mattpocock_phases:` yaml v2 段 (4 phase × 21 unique skills × 23 trigger entry) + spec.ts `phase` enum + `triggers` 字段
- [ ] D5 — ADR 0009 errata 4 items inline (D1.4-2 v1.1 14 字段 / F40-2 SDK 推 v0.2+ / F42 array semantic match / ralph-wiggum XML wrapper)
- [ ] D6 — `PERF-ATTRIBUTION-2.md` ≥ 80L sister T3 transparency + DAG hot path + ≤ 5% regress
- [ ] D7 — ADR 0009 accepted + `adr-0009-accepted` tag pushed
- [ ] D8 — Cross-OS CI 三平台全绿 + A7 step iter 1-8 → 1-9 + ADR 0001-0008 main body 守恒

---

## Task Graph — 8 Wave / 28 atomic 子任务

### Wave 0 — ADR 0009 errata draft + ci.yml A7 step iter 1-9 (~30 min)

#### T1.1 — 起草 ADR 0009 errata + adr-0009-accepted tag

- [ ] **目标**: 起草 ADR 0009 errata 6-section 风格沿袭 ADR 0008 (172L) — 含 D1.4-2 contract v1.1 + F42 array semantic match + ralph-wiggum `<promise>` XML wrapper + R6 ship transparency 4 items
- **文件**: `docs/adr/0009-routing-l2-engineering-23-shi-errata.md` (≥ 100L draft Wave 0；Wave 7 status: Accepted + tag)
- **内容大纲** (6-section ADR 0008 风格 1:1 沿袭):
  1. **Status**: `Draft → Accepted` (Wave 0 → Wave 7)；YYYY-MM-DD: 2026-05-13
  2. **Context**: phase 1.5 wedge enhancement layer 收官；3 P1 deferred from phase 1.4 (D1.4-2 / F40-2 / F42) + 1 fresh from R2 调研 (ralph-wiggum `<promise>` XML wrapper) — 引用 RESEARCH § 4 + ASSUMPTIONS § B D1.5-4
  3. **Decision** (4 sub-item independent rationale):
     - **Errata 1 — D1.4-2 contract v1.1 (12 → 14 字段)**: 加 `initialPrompt: string` (Stable 2026-05) + `criticalSystemReminder_EXPERIMENTAL: string` (Experimental — 字段名 `_EXPERIMENTAL` suffix 不稳定)；W-5 V1 BLOCKER drift detector enum 同步扩展 12 → 14 enum value；contract.md errata 内联不动 main body (A7 守恒)
     - **Errata 2 — F42 array semantic match 升级**: arbitrate ≤ 7L → ≤ 30L 加 priority 内 array element substring match (`task.prompt.toLowerCase().includes(trigger.toLowerCase())` + `task.signals?.some(s => s.includes(trigger))`)；不引入 regex / embedding deps (karpathy YAGNI)；30 sample 4 SAMPLES.md `expected_rule_id` 同步升级 fallback → specific match
     - **Errata 3 — ralph-wiggum `<promise>COMPLETE</promise>` XML wrapper 升级 (R2 fresh 2026-05-13 发现)**: systemPrompt prompt template 升级 raw `^COMPLETE$/m` regex → `<promise>([^<]+)</promise>` XML extract；ralphLoop regex 同步 `match[1] === "COMPLETE"`；30 sample test prompt body 同步加 `<promise>COMPLETE</promise>`；~10L code change 不破 phase 1.4 12 字段 contract、不破 phase 1.4 30 sample test 命中；切换官方 plugin 仍推 v0.2+ ADR 0010+ evaluation window
     - **Errata 4 — 接口契约升级**: phase 1.5 实装中 emerge 微调 (如 dag.ts EngineResult 三态 narrow 风格沿袭 / 接口扩展) — 列出 phase 1.5 ship 8 接口契约 (PLAN § 4 1:1)
  4. **Consequences** (含 v0.1.0-alpha.4 release notes Known Limitations inline — sister T2 transparency D-26):
     - 14 字段 contract v1.1 后 W-5 V1 BLOCKER 持续 enforce
     - F42 array element substring match v1.1 后 30 sample re-test ≥ 27/30 specific match
     - `<promise>` XML wrapper 切换 phase 2.1+ 官方 plugin 时 prompt 不变 (1:1 顺滑)
     - **Known Limitations** (v0.1.0-alpha.4 release notes inline — R6 transparency):
       - Semantic Router L2 仍是 stub return null (推 v0.2+)
       - 4 placeholder installer 未实装 (推 phase 2.1)
       - design / content / testing extension installer 未实装 (推 phase 2.3+)
       - ralph-loop full integration 未落地 (推 phase 2.2)
       - `--add-plugin ralph-wiggum` 切换未启用 (推 phase 2.1+ ADR 0010+ evaluation)
  5. **Compliance** (沿袭 ADR 0008 风格): A7 守恒 / A8 LF / B1 security gate / D1.2.5-3 main-process-driven / F33 verbatim COMPLETE 持续；contract v1.1 14 字段 1:1 binding；W-5 V1 BLOCKER drift detector enum 同步
  6. **References** (引用全套):
     - phase 1.4 sister review T1+T2+T3 (commit `df01ff7`)
     - phase 1.5 KICKOFF + RESEARCH (HIGH conf) + PATTERNS + ASSUMPTIONS + PLAN
     - code.claude.com/docs Agent SDK fresh 2026-05-13
     - anthropics/claude-code/plugins/ralph-wiggum 官方 plugin docs fresh 2026-05-13
     - ADR 0001-0008 (main body 守恒 — A7 持续)
     - phase 1.2.5 GRAY-AREA-1 + GRAY-AREA-3 草案
     - 用户笔记 CLAUDE.md mattpocock 23 招式真理 source 行 8 + 38-39 + 148
- **后置命令** (Wave 0 仅 draft；Wave 7 才 status: Accepted + tag):
  ```bash
  wc -l docs/adr/0009-routing-l2-engineering-23-shi-errata.md  # ≥ 100L
  grep -c "## Decision" docs/adr/0009-routing-l2-engineering-23-shi-errata.md  # ≥ 1
  grep -c "Errata [1-4]" docs/adr/0009-routing-l2-engineering-23-shi-errata.md  # = 4
  grep -c "Known Limitations" docs/adr/0009-routing-l2-engineering-23-shi-errata.md  # ≥ 1
  ```
- **验收**:
  - [ ] ADR 0009 draft ≥ 100L 6-section 完整
  - [ ] Decision 段 4 errata items independent rationale
  - [ ] Consequences 段 inline Known Limitations (R6 + D-26 transparency)
  - [ ] References 引用 phase 1.5 全套 + ADR 0001-0008 + 用户笔记真理 source
- **决策来源**: D7 + D-22 + D-24 + D-26 + ADR 0008 6-section 风格沿袭 + ASSUMPTIONS § B D1.5-4 + PATTERNS § 4 D-22~D-26

#### T1.2 — ci.yml A7 step iter 1-8 → 1-9

- [ ] **目标**: 4 处 sed-style sync `.github/workflows/ci.yml` A7 step (iterate 1-8 → 1-9 — 新加 `adr-0009-accepted` baseline tag)
- **文件**: `.github/workflows/ci.yml` (4 处编辑 — phase 1.3 T1.2 + phase 1.4 T1.2 模式 1:1 沿袭)
- **内容大纲**:
  - L34-L38: A7 step `for tag in adr-0001-accepted ... adr-0008-accepted` → `... adr-0009-accepted`
  - L42: comment `# A7 baseline 1-8` → `# A7 baseline 1-9`
  - L53: workflow name 描述 `(ADR 0001-0008)` → `(ADR 0001-0009)`
  - L64: status badge / report `1-8` → `1-9`
- **后置命令**:
  ```bash
  grep -c "adr-.*-accepted" .github/workflows/ci.yml  # = 9
  yamllint .github/workflows/ci.yml                    # 无 error
  ```
- **验收**:
  - [ ] 4 处 sed-style sync 全完成
  - [ ] yamllint 通过无 error
  - [ ] grep adr-XX-accepted count = 9
- **决策来源**: D8 + A7 守恒 + KICKOFF § "8 baseline tag" + phase 1.3 T1.2 + phase 1.4 T1.2 模式

---

### Wave 1 — Spike (Kahn DAG + ralph-wiggum XML wrapper) (~60 min)

#### T2.1 — Spike script: dag-and-promise-xml.sh

- [ ] **目标**: Spike 实测 Kahn 5 manifest 拓扑 + cycle detect + `<promise>COMPLETE</promise>` XML wrapper extract feasibility
- **文件**: `scripts/spike/dag-and-promise-xml.sh` (≤ 80L sh script — phase 1.4 spike 风格沿袭)
- **内容大纲**:
  - **Part 1 — Kahn DAG manual case** (5 manifest 图):
    - 5 acyclic case (deps `[]` → `["a"]` → `["a","b"]` → `["c"]` → `["d"]`) → 输出拓扑顺序 `a,b,c,d,e`
    - 1 cycle case (`a → b → c → a`) → 输出 cycle nodes `[a,b,c]`
  - **Part 2 — ralph-wiggum `<promise>COMPLETE</promise>` XML wrapper extract test**:
    - Input 1: `<promise>COMPLETE</promise>` → match group 1 = "COMPLETE" ✅
    - Input 2: `Working on the task. <promise>COMPLETE</promise>` → match group 1 = "COMPLETE" ✅ (think-out-loud 末尾 COMPLETE)
    - Input 3: `I think the task is COMPLETE in nature, let me continue.` (raw COMPLETE 中段段落) → no match ✅ (false positive 规避对照 phase 1.4 raw `^COMPLETE$/m` regex)
    - Input 4: `<promise>PARTIAL</promise>` → match group 1 = "PARTIAL" (扩展性验证 — phase 1.5 仍 only accept "COMPLETE"，但 wrapper schema 支持未来扩展)
- **后置命令**:
  ```bash
  bash scripts/spike/dag-and-promise-xml.sh
  # expect: all 4 XML wrapper test pass + Kahn 5 acyclic + 1 cycle case correct
  ```
- **验收**:
  - [ ] Spike script bash 执行无 error
  - [ ] Kahn 5 acyclic 输出顺序正确 + 1 cycle case 输出 cycle nodes 正确
  - [ ] XML wrapper 4 test case 全 pass (含 false positive 规避 verify)
- **决策来源**: D1.5-1 (Kahn algorithm) + D1.5-4 sub-item 3 (XML wrapper R2 fresh) + phase 1.4 spike script 风格

#### T2.2 — Spike report: SPIKE-REPORT-2.md

- [ ] **目标**: Spike verdict 落地 — Kahn algorithm 5 manifest 实测 + cycle detect verify + ralph-wiggum XML wrapper feasibility verdict + Semantic Router stub return null behavior + engine.ts 升级 anchor decisions ≥ 5 项
- **文件**: `.planning/phase-1.5/SPIKE-REPORT-2.md` (≥ 50L)
- **内容大纲**:
  - **§ 1 Spike 目标 & 范围** — verify 4 P0 灰色地带前 2 项 (D1.5-1 DAG / D1.5-4 XML wrapper)
  - **§ 2 Kahn algorithm 5 manifest 实测** — input 5 manifest acyclic + 1 cycle；output 拓扑顺序 + cycle nodes；时间 < 5ms；verdict GO
  - **§ 3 ralph-wiggum `<promise>COMPLETE</promise>` XML wrapper feasibility** — 4 test case (含 false positive 规避)；regex `<promise>([^<]+)</promise>` 鲁棒性 vs phase 1.4 raw `^COMPLETE$/m` regex 对照表；verdict GO (升级 ~10L code change 不破 contract)
  - **§ 4 Semantic Router stub return null behavior** — `match(prompt, threshold) -> Promise<{ matched: false, rule: null, confidence: 0 }>`；engine.route 主流程调用 L1 miss → L2 stub null → L3 fallback_supervisor LLM；verdict GO (D1.5-2 lock — 推 v0.2+ deferred)
  - **§ 5 engine.ts 升级 anchor decisions** (≥ 5 项):
    1. arbitrate 前插 `dag.resolve(allManifests)` 验证 — schema validate 阶段 reject cycle (R04 P0#4 lock 沿袭)
    2. arbitrate 后兜底 `semanticRouter.match()` (v0.1 always null) — fallback path 设计 phase 1.4 模式沿袭
    3. 保留 `fallback_supervisor` LLM 三层兜底 — L3 不破 phase 1.4 systemPrompt const + verbatim COMPLETE 风格
    4. EngineResult 三态 discriminated union narrow 风格 — F41 takeaway 沿袭 (`{ ok: true, decision }` / `{ ok: false, error }` / `{ ok: false, fallback }`)
    5. arbitrate ≤ 30L 升级 (per F42 D1.5-12) — `decisionRules.ts` 内修改不分裂新文件
  - **§ 6 verdict & next** — Wave 2 entry GO；T3.1-T3.5 实装明细 (LOC budget / IMPL NOTE / interface frozen)；T6.1-T6.5 test budget (cell count + fixture-driven)
- **后置命令**:
  ```bash
  wc -l .planning/phase-1.5/SPIKE-REPORT-2.md  # ≥ 50L
  grep -c "verdict GO" .planning/phase-1.5/SPIKE-REPORT-2.md  # ≥ 3 (Kahn / XML wrapper / stub)
  ```
- **验收**:
  - [ ] SPIKE-REPORT-2.md ≥ 50L
  - [ ] § 5 engine.ts 升级 anchor decisions ≥ 5 项
  - [ ] verdict GO 3 处 (Kahn / XML wrapper / Semantic stub)
- **决策来源**: D1.5-1 + D1.5-2 + D1.5-4 + Pattern N + Pattern Q + Pattern R + phase 1.4 SPIKE-REPORT 风格沿袭

---

### Wave 2 — DAG resolver + Semantic Router stub + engine.route 升级 (~3-4h)

#### T3.1 — src/routing/dag.ts (Kahn ≤ 200L)

- [ ] **目标**: Kahn algorithm 自实装 + cycle detect + friendly error；≤ 200L hard limit (D-19)
- **文件**: `src/routing/dag.ts` (新建 ≤ 200L)
- **内容大纲** (Pattern Q + Pattern N + Pattern H IMPL NOTE 顶部):
  - **IMPL NOTE block (顶部 ≤ 30L)** — 引用 ADR 0009 + D1.5-1 + Pattern Q + LOC budget ≤ 200L hard limit + RESEARCH § 1.2 推 Kahn rationale (4 项: iterative 安全 / queue-based 调试日志 / cycle detect 时机自然 / karpathy simplicity)
  - **types**: `NodeId = string` / `DagNode = { id, deps[] }` / `DagResolveResult = { ok, order? cycle? }` (三态 discriminated union 沿袭 EngineResult F41 takeaway)
  - **resolveDag(nodes) -> DagResolveResult**: indegree map + adj map + queue + while loop iterative + cycle detect (indegree ≠ 0 残留 nodes)
  - **friendly error helper**: `formatCycleError(cycle: NodeId[]): string` — `Circular dependency detected in skills: a → b → c\n  hint: check 'deps:' field in manifest spec; cycle members above must form acyclic graph.\n  see docs/adr/0009-routing-l2-engineering-23-shi-errata.md § DAG resolver friendly error.` (phase 1.1 manifest validate 风格)
  - **export**: `resolveDag` + `formatCycleError` + types
- **后置命令**:
  ```bash
  wc -l src/routing/dag.ts  # ≤ 200L
  npm run typecheck         # 通过
  npm run lint              # 通过
  ```
- **验收**:
  - [ ] LOC ≤ 200L
  - [ ] typecheck + lint 通过
  - [ ] IMPL NOTE 顶部含 ADR 0009 + D1.5-1 + Pattern Q + LOC budget reference
- **决策来源**: D1 + D-19 + Pattern Q + Pattern N + Pattern H + RESEARCH § 1.2 + ASSUMPTIONS D1.5-1

#### T3.2 — src/routing/semanticRouter.ts (≤ 150L stub return null)

- [ ] **目标**: Semantic Router L2 stub interface — v0.1 return null；v0.2+ 启用时仅替换 stub body 不改 contract；≤ 150L hard limit (D-20)
- **文件**: `src/routing/semanticRouter.ts` (新建 ≤ 150L)
- **内容大纲** (Pattern R + Pattern I + Pattern N):
  - **IMPL NOTE block (顶部)** — 引用 ADR 0009 + D1.5-2 + Pattern R + LOC budget ≤ 150L + RESEARCH § 2.4 fallback path 设计 (v0.1 stub return null；v0.2+ 启用条件 30 → 100+ sample × 多 model × stability)
  - **types**: `SemanticMatchResult = { matched: boolean; rule: Rule | null; confidence: number }` (三态 narrow 沿袭 EngineResult F41)
  - **match(prompt, threshold = 0.85) -> Promise<SemanticMatchResult>**: v0.1 always return `{ matched: false, rule: null, confidence: 0 }`；v0.2+ 启用时实装 BGE-small kNN cosine similarity (注释占位)
  - **lib/embedding placeholder import** (T3.3 spillover) — interface only consumption
  - **export**: `match` + `SemanticMatchResult` types
- **后置命令**:
  ```bash
  wc -l src/routing/semanticRouter.ts  # ≤ 150L
  npm run typecheck                     # 通过
  ```
- **验收**:
  - [ ] LOC ≤ 150L
  - [ ] match() 返回 stub null 三态 narrow
  - [ ] IMPL NOTE 含 ADR 0009 + D1.5-2 + Pattern R + v0.2+ 启用触发条件
- **决策来源**: D2 + D-20 + Pattern R + Pattern I + RESEARCH § 2.4 + ASSUMPTIONS D1.5-2

#### T3.3 — src/routing/lib/embedding.ts (placeholder ≤ 30L interface only)

- [ ] **目标**: Embedding lib placeholder — interface only for future Pattern R 实装；v0.1 ≤ 30L
- **文件**: `src/routing/lib/embedding.ts` (新建 ≤ 30L)
- **内容大纲** (Pattern E spillover lib/ + D1.4-3 ralphLoop.ts 模式):
  - **IMPL NOTE block** — 引用 ADR 0009 + D1.5-2 + D-21 + Pattern E + v0.2+ 实装条件 + 推 model BGE-small + runtime @xenova/transformers WASM 路径
  - **interface EmbeddingProvider**: `embed(text: string): Promise<number[]>` + `cosine(a: number[], b: number[]): number`
  - **export**: `EmbeddingProvider` type only (v0.1 不 export 实装)
- **后置命令**:
  ```bash
  wc -l src/routing/lib/embedding.ts  # ≤ 30L
  npm run typecheck                    # 通过
  ```
- **验收**:
  - [ ] LOC ≤ 30L
  - [ ] interface only no impl
  - [ ] IMPL NOTE 含 ADR 0009 + D-21 + v0.2+ 启用条件
- **决策来源**: D-21 + Pattern E + RESEARCH § 2.2 + ASSUMPTIONS D1.5-2

#### T3.4 — src/routing/engine.ts 升级 (≤ 200L)

- [ ] **目标**: engine.route 主流程升级 — arbitrate 前插 `dag.resolve(allManifests)` 验证；arbitrate 后兜底 `semanticRouter.match()` (v0.1 always null)；保留 fallback_supervisor 三层兜底；engine.ts 200L → ≤ 200L (不破 phase 1.4 LOC budget)
- **文件**: `src/routing/engine.ts` (修改 ≤ 200L)
- **内容大纲** (Pattern N 主流程编排沿袭):
  - **IMPL NOTE 升级** (顶部 ≤ 30L) — 引用 ADR 0009 + D1.5-11 + 升级路径 (arbitrate 前插 dag + 后插 semanticRouter)
  - **route(task, opts) -> Promise<EngineResult>** 主流程:
    1. (新加) `dag.resolve(allManifests)` — 失败 throw `InvalidDecisionError` (cycle nodes friendly error)
    2. L1 `arbitrate(task, rules)` — keyword + array element substring match (T4.3 升级)
    3. (新加) L2 `semanticRouter.match(task.prompt, 0.85)` — v0.1 always null
    4. L3 `fallback_supervisor` LLM systemPrompt const + COMPLETE_TOKEN placeholder spawn
  - 保留 EngineResult 三态 discriminated union (F41 takeaway 沿袭) + 4 typed error class (`SkillNotInstalledError` / `InvalidDecisionError` / `MissingSkillsError` / `RestartRequiredError`)
- **后置命令**:
  ```bash
  wc -l src/routing/engine.ts  # ≤ 200L
  npm run typecheck             # 通过
  npm run lint                  # 通过
  ```
- **验收**:
  - [ ] LOC ≤ 200L (不破 phase 1.4 LOC budget)
  - [ ] route 主流程含 dag.resolve + semanticRouter.match + fallback_supervisor 三层
  - [ ] IMPL NOTE 含升级路径 + ADR 0009 + D1.5-11
- **决策来源**: D1.5-11 + Pattern N + RESEARCH § 2.4 + KICKOFF "8 接口契约 (phase 1.5 直接消费 — frozen)"

#### T3.5 — src/routing/index.ts barrel 加 dag + semanticRouter export

- [ ] **目标**: barrel re-export 加 `dag` + `semanticRouter` (KICKOFF 8 接口契约 #7 沿袭)
- **文件**: `src/routing/index.ts` (修改)
- **内容大纲**:
  - 加 `export { resolveDag, formatCycleError } from './dag';`
  - 加 `export type { DagNode, DagResolveResult, NodeId } from './dag';`
  - 加 `export { match as semanticMatch } from './semanticRouter';`
  - 加 `export type { SemanticMatchResult } from './semanticRouter';`
- **后置命令**:
  ```bash
  npm run typecheck  # 通过
  ```
- **验收**:
  - [ ] barrel re-export 4 个新增 (resolveDag / formatCycleError / semanticMatch / SemanticMatchResult)
  - [ ] typecheck 通过
- **决策来源**: KICKOFF 8 接口契约 #7 + Pattern N

---

### Wave 3 — decision_rules.yaml v2 + engineering 5 rules + mattpocock_phases 段 + migration script (~2-3h)

#### T4.1 — routing/decision_rules.yaml v1 → v2 升级

- [ ] **目标**: yaml v1 → v2 — engineering 5 specific rule + `mattpocock_phases:` 段 + version 1 → 2 + 头部 IMPL NOTE 引用 ADR 0009
- **文件**: `routing/decision_rules.yaml` (修改 v1 → v2)
- **内容大纲**:
  - **头部 IMPL NOTE block** (yaml comment) — 引用 ADR 0009 + D1.5-3 + D1.5-8 + D-22 + version 1 → 2 升级路径 + 用户笔记真理 source
  - **version**: `1` → `2`
  - **rules** (保留 v1 12 rules + 新增 engineering 5 specific rule — RESEARCH § 3.3 1:1 sample):
    1. `engineering-discuss-feature` — keywords: `["新功能", "feature 启动", "discuss feature"]`；workflow: `gstack-decision-gate`；skills_overlay: `{ ref: mattpocock_phases.discuss.skills }`；gstack_gates: `["office-hours", "plan-ceo-review"]`
    2. `engineering-plan-architecture` — keywords: `["架构 plan", "architecture plan", "design"]`；workflow: `gsd-plan-phase`；skills_overlay: `{ ref: mattpocock_phases.plan.skills }`；gstack_gates: `["plan-eng-review"]`
    3. `engineering-execute-tdd` — keywords: `["TDD", "test first", "core logic", "algorithm"]`；workflow: `gsd-execute-task`；skills_overlay: `{ ref: mattpocock_phases.execute.skills }`；triggers: `{ complexity_threshold: 5, category_match: ["core_business_logic", "algorithm", "high_reliability"], tdd_required: true }`
    4. `engineering-execute-debug` — keywords: `["debug", "bug", "diagnose", "排错"]`；workflow: `gsd-execute-task`；skills_overlay: `{ ref: mattpocock_phases.execute.skills }`；primary_skills: `[diagnose, zoom-out]`
    5. `engineering-verify-pr` — keywords: `["PR review", "code review", "ship", "release"]`；workflow: `gsd-verify-work`；skills_overlay: `{ ref: mattpocock_phases.verify.skills }`；gstack_gates: `["review", "code-review"]`
  - **mattpocock_phases:** 段新增 (RESEARCH § 3.2 1:1 sample) — 4 phase × 21 unique skills × 23 trigger entry:
    - `discuss`: triggers `["/grill-with-docs", "/to-prd", "/grill-me", "/explore", "澄清规格", "沉淀 PRD", "拷问我", "探索方案"]` + skills `[grill-with-docs, to-prd, grill-me, explore]`
    - `plan`: triggers `["/to-issues", "/grill-me", "/design-review", "拆任务", "design review"]` + skills `[to-issues, grill-me, design-review]`
    - `execute`: triggers `["/tdd", "/diagnose", "/zoom-out", "/caveman", "/grill-with-docs", "/playwright-cli", "/improve-codebase-architecture", "TDD", "诊断", "陌生模块", "架构健康"]` + skills `[tdd, diagnose, zoom-out, caveman, grill-with-docs, playwright-cli, improve-codebase-architecture]`
    - `verify`: triggers `["/qa", "/review", "/code-review", "/cso", "/security-review", "/retro", "/ship", "QA", "Paranoid Staff Engineer", "code review", "安全审查", "ship"]` + skills `[qa, review, code-review, cso, security-review, retro, ship]`
- **后置命令**:
  ```bash
  grep -c "id: engineering-" routing/decision_rules.yaml  # = 5
  grep -c "mattpocock_phases:" routing/decision_rules.yaml  # ≥ 1
  grep "version:" routing/decision_rules.yaml             # 含 version: 2
  npm run build:schema                                     # parse yaml v2 schema 通过
  ```
- **验收**:
  - [ ] engineering 5 rule id 全 grep 命中
  - [ ] mattpocock_phases: 段 4 phase 完整
  - [ ] version: 2
  - [ ] yaml v2 schema parse 成功 (build:schema 通过)
- **决策来源**: D3 + D4 + D-22 + D-23 + Pattern S + Pattern I + RESEARCH § 3 + ASSUMPTIONS D1.5-3 + D1.5-8 + D1.5-10

#### T4.2 — scripts/migrate-decision-rules-v1-to-v2.mjs (W-6 phase 1.3 sister review 落地)

- [ ] **目标**: yaml v1 → v2 migration script — additive 升级 (v1 rules 全部保留 + 新增 engineering rules + mattpocock_phases 段)；idempotent (重复执行 no-op)
- **文件**: `scripts/migrate-decision-rules-v1-to-v2.mjs` (新建 ≤ 50L)
- **内容大纲** (`scripts/migrate-manifest-v1-to-v2.mjs` phase 1.3 风格 1:1 沿袭):
  - **IMPL NOTE 顶部** — 引用 ADR 0009 + D-22 + W-6 phase 1.3 sister review + idempotent 性质 + dry-run flag (`--dry-run`)
  - **main()**: `js-yaml` parse → 检查 version (1 → 升级；2 → no-op idempotent)；additive merge (engineering 5 rule + mattpocock_phases 段)；dump back yaml；dry-run 时只 stdout 不写文件
- **后置命令**:
  ```bash
  node scripts/migrate-decision-rules-v1-to-v2.mjs --dry-run  # stdout v2 yaml；exit 0
  node scripts/migrate-decision-rules-v1-to-v2.mjs            # 实际写入 (T4.1 已写则 idempotent no-op)
  node scripts/migrate-decision-rules-v1-to-v2.mjs            # 二次执行 idempotent — version 仍 = 2 + 不重复加 rules
  ```
- **验收**:
  - [ ] script ≤ 50L
  - [ ] dry-run + 二次执行 idempotent
  - [ ] IMPL NOTE 含 ADR 0009 + D-22 + W-6 phase 1.3 sister review
- **决策来源**: D-22 + W-6 phase 1.3 sister review + `scripts/migrate-manifest-v1-to-v2.mjs` 风格沿袭

#### T4.3 — src/routing/decisionRules.ts 升级 (arbitrate ≤ 30L per F42)

- [ ] **目标**: load v2 yaml + parse mattpocock_phases 段 + arbitrate 升级 ≤ 7L → ≤ 30L (per F42 D1.5-12 array element substring match)
- **文件**: `src/routing/decisionRules.ts` (修改 — phase 1.4 ship 108L → ≤ 150L)
- **内容大纲**:
  - **IMPL NOTE 升级** (顶部) — 引用 ADR 0009 + D1.5-12 + F42 + array element substring match 升级
  - **load v2 yaml** — `js-yaml` parse + Ajv schema validate (含 mattpocock_phases 段 schema)
  - **parse mattpocock_phases 段** — 提取 4 phase × skills array + triggers array
  - **arbitrate(task, rules) -> Decision | null** 升级 (≤ 7L → ≤ 30L) — RESEARCH § 4.3 sample 1:1:
    ```typescript
    for (const rule of rulesPriority(rules)) {
      for (const trigger of rule.when.keywords) {
        if (typeof trigger === "string") {
          if (task.prompt.toLowerCase().includes(trigger.toLowerCase())) return rule.decision;
          if (task.signals?.some(s => s.toLowerCase().includes(trigger.toLowerCase()))) return rule.decision;
        }
      }
      for (const trigger of (rule.when.signals_like ?? [])) {
        if (task.signals?.some(s => s.includes(trigger))) return rule.decision;
      }
    }
    return null;
    ```
  - 不引入 regex / embedding deps (karpathy YAGNI)
- **后置命令**:
  ```bash
  npm run typecheck       # 通过
  npm run lint            # 通过
  wc -l src/routing/decisionRules.ts  # ≤ 150L
  ```
- **验收**:
  - [ ] arbitrate function 实装 array element substring match 升级
  - [ ] mattpocock_phases 段 parse 成功
  - [ ] LOC ≤ 150L (不破 phase 1.4 ship 108L baseline 太多)
- **决策来源**: D1.5-4 sub-item 2 + D1.5-12 + F42 + RESEARCH § 4.3 + Pattern I

---

### Wave 4 — D5 ADR 0009 errata 4 items 实装 (~2-3h)

#### T5.1 — src/routing/systemPrompt.ts 升级 (`<promise>` XML wrapper)

- [ ] **目标**: prompt template 升级 raw `^COMPLETE$/m` regex → `<promise>COMPLETE</promise>` XML wrapper
- **文件**: `src/routing/systemPrompt.ts` (修改 — phase 1.4 ship 80L → ≤ 80L 不破)
- **内容大纲**:
  - **IMPL NOTE 升级** — 引用 ADR 0009 + D1.5-4 sub-item 3 + R2 fresh + ralph-wiggum 官方 plugin 切换 v0.2+ ADR 0010+ evaluation window
  - **SYSTEM_PROMPT_FALLBACK_SUPERVISOR const** — phase 1.4 80L body 不动 + § "RULE: COMPLETE marker" 段升级:
    ```
    ## RULE: COMPLETE marker

    When you finish the task, emit verbatim:

    <promise>COMPLETE</promise>

    (Do NOT emit any other variant — not "completed", not "DONE", not "✅". Verbatim XML wrapper.)
    ```
- **后置命令**:
  ```bash
  grep -c "<promise>COMPLETE</promise>" src/routing/systemPrompt.ts  # ≥ 1
  wc -l src/routing/systemPrompt.ts  # ≤ 80L 不破 phase 1.4 ship LOC budget
  ```
- **验收**:
  - [ ] systemPrompt 含 `<promise>COMPLETE</promise>` verbatim
  - [ ] LOC ≤ 80L
  - [ ] IMPL NOTE 含 ADR 0009 + D1.5-4 sub-item 3 + R2 fresh
- **决策来源**: D5 + D1.5-4 sub-item 3 + R2 fresh + RESEARCH § 4.4

#### T5.2 — src/routing/lib/ralphLoop.ts 升级 (XML wrapper extract regex)

- [ ] **目标**: regex `^COMPLETE$/m` → `<promise>([^<]+)</promise>` XML extract；match[1] === "COMPLETE" 判定
- **文件**: `src/routing/lib/ralphLoop.ts` (修改 — phase 1.4 ship 66L → ≤ 66L 不破)
- **内容大纲**:
  - **IMPL NOTE 升级** — 引用 ADR 0009 + D1.5-4 sub-item 3
  - **COMPLETE_PATTERN const** 升级:
    ```typescript
    const COMPLETE_PATTERN = /<promise>([^<]+)<\/promise>/;
    function isComplete(output: string): boolean {
      const match = output.match(COMPLETE_PATTERN);
      return match !== null && match[1] === "COMPLETE";
    }
    ```
- **后置命令**:
  ```bash
  grep -c "<promise>" src/routing/lib/ralphLoop.ts  # ≥ 1
  npm run typecheck  # 通过
  ```
- **验收**:
  - [ ] regex 升级为 XML wrapper extract
  - [ ] match[1] === "COMPLETE" 判定 (扩展性支持未来 PARTIAL / BLOCKED status)
  - [ ] IMPL NOTE 含 ADR 0009 + D1.5-4 sub-item 3
- **决策来源**: D5 + D1.5-4 sub-item 3 + R2 fresh + RESEARCH § 4.4

#### T5.3 — src/routing/agentDefinition.ts 12 → 14 字段 (W-5 V1 BLOCKER 1:1 contract enforce)

- [ ] **目标**: 12 字段 → 14 字段 (D1.4-2 evaluate — `initialPrompt` Stable + `criticalSystemReminder_EXPERIMENTAL` Experimental)；W-5 V1 BLOCKER drift detector enum 同步扩展
- **文件**: `src/routing/agentDefinition.ts` (修改 — phase 1.4 ship 148L → ≤ 200L)
- **内容大纲** (Pattern O verbatim 1:1 binding 沿袭):
  - **IMPL NOTE 升级** — 引用 ADR 0009 + D1.5-4 sub-item 1 + W-5 V1 BLOCKER + 14 字段 1:1 contract enforce + `_EXPERIMENTAL` suffix 标注 (字段名不稳定)
  - **AgentDefinition interface** 12 → 14 字段:
    - 保留 phase 1.4 12 字段 (V1 BLOCKER 沿袭)
    - 加 `initialPrompt: string` (Stable 2026-05) — 注释 `// Stable: spawn 时 inject 进 subagent 首条 user message`
    - 加 `criticalSystemReminder_EXPERIMENTAL: string` (Experimental — 字段名 suffix 不稳定) — 注释 `// EXPERIMENTAL: 字段名 _EXPERIMENTAL suffix 不稳定 — code.claude.com/docs Agent SDK 2026-05`
  - **W-5 V1 BLOCKER drift detector enum** 扩展 12 → 14 enum value (T6.3 cell 1 同步)
- **后置命令**:
  ```bash
  grep -c "initialPrompt" src/routing/agentDefinition.ts                        # ≥ 1
  grep -c "criticalSystemReminder_EXPERIMENTAL" src/routing/agentDefinition.ts  # ≥ 1
  npm run typecheck                                                              # 通过
  wc -l src/routing/agentDefinition.ts                                           # ≤ 200L
  ```
- **验收**:
  - [ ] 14 字段完整
  - [ ] `_EXPERIMENTAL` suffix 字段名注释标注
  - [ ] W-5 V1 BLOCKER drift detector enum 同步扩展 14 value (T6.3 cell 1 verify)
- **决策来源**: D5 + D1.5-4 sub-item 1 + W-5 V1 BLOCKER + Pattern O + RESEARCH § 4.1

#### T5.4 — docs/AGENT-DEFINITION-FACTORY-CONTRACT.md v1 → v1.1 errata 内联

- [ ] **目标**: contract.md v1.1 errata 内联 ADR 0009 § Decision (不动 main body — A7 守恒)
- **文件**: `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` (修改 — main body 不动，仅末尾加 § Errata Log v1.1)
- **内容大纲**:
  - 末尾加 § Errata Log v1.1 段:
    ```markdown
    ---

    ## § Errata Log v1.1 (2026-05-13 — phase 1.5 ADR 0009 § Decision Errata 1)

    **Errata 1 — D1.4-2 contract v1.1 (12 → 14 字段)**:
    - 加 `initialPrompt: string` (Stable 2026-05)
    - 加 `criticalSystemReminder_EXPERIMENTAL: string` (Experimental — 字段名 _EXPERIMENTAL suffix 不稳定)
    - W-5 V1 BLOCKER drift detector enum 同步扩展 12 → 14 enum value
    - **A7 守恒**: contract.md main body 不动；本 Errata Log 内联升级路径

    Source: ADR 0009 § Decision Errata 1 + RESEARCH § 4.1 + ASSUMPTIONS D1.5-4 sub-item 1
    ```
- **后置命令**:
  ```bash
  grep -c "Errata Log v1.1" docs/AGENT-DEFINITION-FACTORY-CONTRACT.md  # ≥ 1
  git diff docs/AGENT-DEFINITION-FACTORY-CONTRACT.md | grep -c "^-"     # 应 = 0 (main body 不动)
  ```
- **验收**:
  - [ ] § Errata Log v1.1 段加在末尾
  - [ ] main body 0 行删除 (A7 守恒)
  - [ ] 引用 ADR 0009 + RESEARCH + ASSUMPTIONS
- **决策来源**: D5 + A7 守恒 + ADR 0009 § Decision Errata 1

#### T5.5 — src/manifest/schema/spec.ts 加 phase enum + triggers 字段 (Pattern L + Pattern T)

- [ ] **目标**: spec.ts 加 `phase` enum optional + `triggers` 字段 optional (D1.5-6 + D1.5-7)
- **文件**: `src/manifest/schema/spec.ts` (修改 — phase 1.3 ship 含 13 字段 → 14-15 字段)
- **内容大纲** (Pattern L spec-level metadata 加法 1:1 沿袭 phase 1.3 加 category/install_type/decision_rules):
  - **IMPL NOTE 升级** — 引用 ADR 0009 + D1.5-6 + D1.5-7 + Pattern L + Pattern T + A7' 8 支柱 enforcement
  - 加 `phase: z.enum(["discuss", "plan", "execute", "verify"]).optional()` (RESEARCH § 3.4 1:1)
  - 加 `triggers: z.object({ complexity_threshold: z.number().int().positive().optional(), tdd_required: z.boolean().optional(), brainstorming_required: z.boolean().optional() }).optional()` (RESEARCH § 3.4 1:1)
- **后置命令**:
  ```bash
  grep -c "phase: z.enum" src/manifest/schema/spec.ts       # ≥ 1
  grep -c "triggers: z.object" src/manifest/schema/spec.ts  # ≥ 1
  npm run build:schema                                       # JSON Schema artifact 生成成功
  npm run typecheck                                          # 通过
  ```
- **验收**:
  - [ ] phase enum z 字段加成功
  - [ ] triggers z.object 字段加成功
  - [ ] JSON Schema artifact 含 phase + triggers
  - [ ] IMPL NOTE 含 ADR 0009 + D1.5-6 + D1.5-7 + Pattern L + Pattern T
- **决策来源**: D4 + D1.5-6 + D1.5-7 + Pattern L + Pattern T + RESEARCH § 3.4

---

### Wave 5 — Tests + 30 sample re-test + SAMPLES.md 升级 (~2-3h)

#### T6.1 — tests/unit/routing-dag.test.ts (≥ 10 cell)

- [ ] **目标**: routing-dag unit tests ≥ 10 cell (Pattern J fixture-driven BASE+modifier)
- **文件**: `tests/unit/routing-dag.test.ts` (新建)
- **内容大纲** (10+ cell):
  1. `resolveDag([])` 空图 → `{ ok: true, order: [] }`
  2. 单节点 `[{ id: "a", deps: [] }]` → `{ ok: true, order: ["a"] }`
  3. 2 节点 acyclic `a → b` → `{ ok: true, order: ["a", "b"] }`
  4. 5 节点 acyclic chain → 拓扑顺序正确
  5. 5 节点 acyclic DAG (双向 deps + diamond) → 拓扑顺序合法
  6. 2 节点 cycle `a → b → a` → `{ ok: false, cycle: ["a", "b"] }`
  7. 3 节点 cycle `a → b → c → a` → `{ ok: false, cycle: ["a", "b", "c"] }`
  8. self-loop `a → a` → `{ ok: false, cycle: ["a"] }`
  9. 部分 cycle (acyclic + cycle 子图) → `{ ok: false, cycle: cycle nodes only }`
  10. `formatCycleError(["a", "b", "c"])` → 含 "Circular dependency detected" + arrow "→" + hint + ADR § ref
- **后置命令**:
  ```bash
  npm test -- tests/unit/routing-dag.test.ts  # ≥ 10 cell pass
  ```
- **验收**:
  - [ ] ≥ 10 cell 全 pass
  - [ ] cycle detect 3+ case (含 self-loop + 部分 cycle)
  - [ ] friendly error format 含 ADR § ref
- **决策来源**: D1 + Pattern J + Pattern Q

#### T6.2 — tests/unit/routing-semanticRouter.test.ts (≥ 8 cell)

- [ ] **目标**: routing-semanticRouter unit tests ≥ 8 cell — stub null verify + interface contract assert (Pattern J + Pattern K env-gated skipIf future v0.2+ ML model load slow)
- **文件**: `tests/unit/routing-semanticRouter.test.ts` (新建)
- **内容大纲** (8+ cell):
  1. `match("test prompt")` → `{ matched: false, rule: null, confidence: 0 }` (v0.1 stub return null)
  2. `match("", 0)` 空 prompt → `{ matched: false, ... }`
  3. `match("test", 0.5)` 任意 threshold → `{ matched: false, ... }` (v0.1 stub 不依赖 threshold)
  4. SemanticMatchResult type narrow — `{ matched: false }` discriminated union narrow check
  5. `await Promise<SemanticMatchResult>` 返回 Promise (async 接口 contract)
  6. interface contract assert — `match` function signature 1:1 binding (interface drift detector)
  7. 多次调用 idempotent (v0.1 stub 不持久状态)
  8. v0.2+ 启用占位 cell — `it.skip("v0.2+ ML embedding kNN match", ...)` (Pattern K env-gated future cell)
- **后置命令**:
  ```bash
  npm test -- tests/unit/routing-semanticRouter.test.ts  # ≥ 8 cell pass (含 1 skip future cell)
  ```
- **验收**:
  - [ ] ≥ 8 cell pass
  - [ ] stub return null verify (v0.1)
  - [ ] interface contract assert
  - [ ] v0.2+ 占位 it.skip cell (Pattern K)
- **决策来源**: D2 + Pattern J + Pattern K + RESEARCH § 2.4

#### T6.3 — tests/unit/routing-engine.test.ts 升级 (Wave 4+5 升级 cells)

- [ ] **目标**: routing-engine unit tests 升级 — XML wrapper extract / 14 字段 enum / dag inject / array semantic match
- **文件**: `tests/unit/routing-engine.test.ts` (修改 — phase 1.4 ship 12 cell → ≥ 16 cell)
- **内容大纲** (新增 4+ cell):
  - **cell 13 — W-5 V1 BLOCKER drift detector 14 enum value** (T5.3 sync) — assert `Object.keys(AgentDefinition).length === 14` + 含 `initialPrompt` + `criticalSystemReminder_EXPERIMENTAL`
  - **cell 14 — `<promise>COMPLETE</promise>` XML wrapper extract** (T5.1 + T5.2 sync) — assert `isComplete("<promise>COMPLETE</promise>")` 真 + `isComplete("I think the task is COMPLETE in nature")` 假 (false positive 规避)
  - **cell 15 — dag.resolve inject 主流程** (T3.4 sync) — engine.route 收到 cycle manifest 时 throw `InvalidDecisionError` 含 cycle nodes friendly error
  - **cell 16 — array element substring match** (T4.3 + F42 sync) — task.signals = ["new feature spike"]，rule.when.signals_like = ["spike"] → match (substring includes)
- **后置命令**:
  ```bash
  npm test -- tests/unit/routing-engine.test.ts  # ≥ 16 cell pass
  ```
- **验收**:
  - [ ] ≥ 16 cell (新增 4 cell)
  - [ ] W-5 V1 BLOCKER 14 enum value drift detector verify
  - [ ] XML wrapper false positive 规避 verify
  - [ ] dag.resolve cycle InvalidDecisionError verify
  - [ ] array element substring match verify
- **决策来源**: D5 + D1.5-4 + D1.5-12 + D1.5-11 + W-5 V1 BLOCKER

#### T6.4 — tests/integration/routing-30-samples.test.ts 升级 (engineering 5/5 specific + total ≥ 27/30)

- [ ] **目标**: 30 sample re-test ≥ 27/30 specific match (engineering 5/5 不再 fallback expected — 改为 specific rule match — R5 mitigation)
- **文件**: `tests/integration/routing-30-samples.test.ts` (修改 — Pattern P inline truth table 升级 v2)
- **内容大纲**:
  - phase 1.4 ship 30 sample 21 specific + 9 fallback (100% 命中)
  - phase 1.5 升级:
    - engineering 5 sample expected_rule_id 升级 fallback_supervisor → engineering-{discuss-feature, plan-architecture, execute-tdd, execute-debug, verify-pr} 各 1
    - F42 array semantic 4 sample expected_rule_id 升级 default fallthrough → array element match (D-22 v1→v2 errata 路径 R3 phase 1.4 sister review 沿袭)
    - 升级后预计: 21 + 5 (engineering) + 4 (F42 array) = 30 specific match (但保留 ≥ 3 fallback expected for fallback_supervisor verify)
    - **acceptance**: total specific match ≥ 27/30 + total = 30/30 100%
- **后置命令**:
  ```bash
  npm test -- tests/integration/routing-30-samples.test.ts  # specific ≥ 27/30 + total = 30/30
  ```
- **验收**:
  - [ ] total = 30/30 命中 (含 fallback expected ≥ 3)
  - [ ] specific match ≥ 27/30 (含 engineering 5 + F42 array 4)
  - [ ] engineering 5 sample 全 specific match (R5 mitigation)
- **决策来源**: D3 + D1.5-9 + R5 + R3 phase 1.4 sister review 模式 + D-22

#### T6.5 — SAMPLES.md update (engineering 5 + F42 array 4 expected_rule_id 升级)

- [ ] **目标**: `.planning/phase-1.4/SAMPLES.md` v2 update (frozen body 不动 + 9 sample expected_rule_id 升级条目 § 8.2 v2 errata 内联)
- **文件**: `.planning/phase-1.4/SAMPLES.md` (修改 — frozen 30 sample body 不动 + 末尾 § 8.2 v2 errata 内联)
- **内容大纲**:
  - frozen body 不动 (R3 phase 1.4 sister review 锁定原则)
  - 末尾加 § 8.2 v2 errata 段:
    ```markdown
    ---

    ## § 8.2 v2 errata 升级映射 (2026-05-13 — phase 1.5 D-22 v1 → v2 errata)

    | sample # | original expected_rule_id (phase 1.4 ship) | v2 expected_rule_id (phase 1.5) | rationale |
    |---|---|---|---|
    | 5  | fallback_supervisor      | engineering-discuss-feature | engineering 5 specific rule (D3) |
    | 11 | fallback_supervisor      | engineering-plan-architecture | engineering 5 specific rule (D3) |
    | 17 | fallback_supervisor      | engineering-execute-tdd | engineering 5 specific rule (D3) |
    | 22 | fallback_supervisor      | engineering-execute-debug | engineering 5 specific rule (D3) |
    | 28 | fallback_supervisor      | engineering-verify-pr | engineering 5 specific rule (D3) |
    | 8  | (default fallthrough)    | array-element-substring-match | F42 array semantic match 升级 (D1.5-4 sub-item 2) |
    | 14 | (default fallthrough)    | array-element-substring-match | F42 array semantic match 升级 (D1.5-4 sub-item 2) |
    | 20 | (default fallthrough)    | array-element-substring-match | F42 array semantic match 升级 (D1.5-4 sub-item 2) |
    | 26 | (default fallthrough)    | array-element-substring-match | F42 array semantic match 升级 (D1.5-4 sub-item 2) |

    Source: ADR 0009 § Decision Errata 2 + RESEARCH § 4.3 + ASSUMPTIONS D1.5-4 sub-item 2 + D-22 v1→v2 errata 路径
    ```
- **后置命令**:
  ```bash
  grep -c "## § 8.2" .planning/phase-1.4/SAMPLES.md  # ≥ 1
  git diff .planning/phase-1.4/SAMPLES.md | grep -c "^-"  # 应 = 0 (frozen body 不动)
  ```
- **验收**:
  - [ ] § 8.2 v2 errata 段加在末尾
  - [ ] 9 sample expected_rule_id 升级映射表完整
  - [ ] frozen body 0 行删除 (A7 守恒)
- **决策来源**: D-22 + D3 + D1.5-4 sub-item 2 + R3 phase 1.4 sister review

---

### Wave 6 — PERF-ATTRIBUTION-2.md + Cross-OS CI verify (~60 min)

#### T7.1 — .planning/phase-1.5/PERF-ATTRIBUTION-2.md (sister T3 transparency)

- [ ] **目标**: PERF-ATTRIBUTION-2.md ≥ 80L sister T3 transparency — DAG resolver hot path bench + manifest validate baseline + 时间 ≤ 5% regress
- **文件**: `.planning/phase-1.5/PERF-ATTRIBUTION-2.md` (新建 ≥ 80L)
- **内容大纲** (phase 1.3 PERF-ATTRIBUTION.md 177L 风格 1:1 沿袭):
  - **§ 1 Goal & Scope** — sister T3 transparency；DAG resolver hot path bench；时间 ≤ 5% regress threshold
  - **§ 2 Methodology** — Node.js `process.hrtime.bigint()` micro-bench；warm cache 5 iteration；100 ms wall clock per case
  - **§ 3 Baseline (phase 1.4 ship)** — manifest validate 单 28 ms (phase 1.3 ship)；engine.route hot path 0 dag call
  - **§ 4 Phase 1.5 measurement** — engine.route + dag.resolve(allManifests) 含 cycle detect；预期 N call (≤ 50 manifest 图 < 5ms 累计)；新 hot path 时间 ≤ 5% regress vs 28ms baseline
  - **§ 5 Result table** — measure: phase 1.4 baseline / phase 1.5 measured / regress %
  - **§ 6 Verdict** — ≤ 5% regress threshold pass / fail；如 fail → revise dag.ts hot path optimization
  - **§ 7 References** — phase 1.3 PERF-ATTRIBUTION.md sister + ADR 0009 + D6 acceptance bar + D-25
- **后置命令**:
  ```bash
  wc -l .planning/phase-1.5/PERF-ATTRIBUTION-2.md  # ≥ 80L
  ```
- **验收**:
  - [ ] PERF-ATTRIBUTION-2.md ≥ 80L 7-section 完整
  - [ ] §3 Baseline 含 phase 1.4 ship 28 ms baseline
  - [ ] §6 Verdict ≤ 5% regress threshold
  - [ ] §7 引用 sister T3 + ADR 0009 + D6 + D-25
- **决策来源**: D6 + D-25 + sister T3 + phase 1.3 PERF-ATTRIBUTION.md 177L 风格

#### T7.2 — push origin → CI 三平台全绿 + A7 step iter 1-9 verify

- [ ] **目标**: git push origin → GitHub Actions CI 三平台 (Win/Mac/Linux) 全绿 verify + A7 step iter 1-9 verify
- **文件**: (无新文件 — git push + CI verify)
- **内容大纲**:
  - `git push origin <phase-1.5-ship-branch>` 触发 CI
  - GH Actions ci.yml 三平台 matrix (windows-latest / macos-latest / ubuntu-latest) 全绿
  - A7 step iter 1-9 verify (T1.2 sync) — `grep -c "adr-.*-accepted" .github/workflows/ci.yml` = 9
- **后置命令**:
  ```bash
  git push origin <phase-1.5-ship-branch>
  gh run list --workflow ci.yml --limit 1  # 查最新 run
  gh run view <run-id>                      # 三平台 status: success
  ```
- **验收**:
  - [ ] CI 三平台 status: success
  - [ ] A7 step iter 1-9 命中 (grep adr-XX-accepted = 9)
- **决策来源**: D8 + A7 守恒 + KICKOFF "8 baseline tag" + phase 1.3 + 1.4 ship 模式

#### T7.3 — (可选 hotfix) — CI red 时类 phase 1.2.1 / 1.3.1 / 1.4.1 模式

- [ ] **目标** (可选): CI red 时 hotfix branch + cherry-pick 修复 + 二次 push verify
- **文件**: 视具体 red 原因 emerge
- **内容大纲**: 沿袭 phase 1.2.1 / 1.3.1 / 1.4.1 hotfix 模式 — main agent decide
- **后置命令**: hotfix-specific
- **验收**:
  - [ ] (可选) hotfix CI 二次 push 三平台全绿
- **决策来源**: phase 1.2.1 / 1.3.1 / 1.4.1 ship 模式

---

### Wave 7 — Docs + ship + tag (~60 min)

#### T8.1 — STATE.md phase 1.5 SHIPPED + 6/17 phase ≈ 35.3% + B-4 audit

- [ ] **目标**: STATE.md 更新 phase 1.5 SHIPPED + 当前进度 6/17 phase ≈ 35.3% + B-4 audit 持续 + Phase 2.0 Prereq Notes
- **文件**: `.planning/STATE.md` (修改)
- **内容大纲** (phase 1.4 ship 后 STATE.md 风格沿袭):
  - phase 1.5 status: ⏳ in-progress → ✅ SHIPPED 2026-05-NN
  - completed phases: 5 → 6 (phase 1.5 加入)
  - total phase: 17
  - progress: ≈ 35.3%
  - B-4 audit 持续 row 加 phase 1.5 entry
  - Phase 2.0 Prereq Notes 段 (新加):
    - 8 接口契约 frozen (PLAN § 4 1:1)
    - 8 支柱 100% capture verify roadmap closure (KICKOFF § 8 支柱 + PATTERNS § 7)
    - phase 2.0 entry: execute-task workflow 主线 + ralph-loop full integration + 4 placeholder installer
- **后置命令**:
  ```bash
  grep "phase-1.5" .planning/STATE.md | grep -c "SHIPPED"  # ≥ 1
  grep -c "Phase 2.0 Prereq Notes" .planning/STATE.md       # ≥ 1
  ```
- **验收**:
  - [ ] phase 1.5 SHIPPED row 加成
  - [ ] progress ≈ 35.3%
  - [ ] B-4 audit row 持续
  - [ ] Phase 2.0 Prereq Notes 段加成
- **决策来源**: KICKOFF § 8 支柱 100% capture verify + phase 1.4 ship 模式 + ASSUMPTIONS D1.5-13~D1.5-15

#### T8.2 — VERIFICATION.md ≥ 150L (D1-D8 复现命令 + Phase 2.0 prereq + Findings 索引)

- [ ] **目标**: VERIFICATION.md ≥ 150L — D1-D8 8 acceptance bar 复现命令 + Phase 2.0 prereq + Findings 索引
- **文件**: `.planning/phase-1.5/VERIFICATION.md` (新建 ≥ 150L)
- **内容大纲** (phase 1.4 VERIFICATION.md 风格沿袭):
  - **§ 1 D1-D8 8 acceptance bar 复现命令** (PLAN § 6 1:1 sample) — 8 个 acceptance bar 各 verify command
  - **§ 2 Phase 2.0 prereq** — 8 接口契约 (PLAN § 4) + 8 支柱 100% capture verify roadmap closure + phase 2.0 entry
  - **§ 3 Findings 索引** — F<N> phase 1.5 specific findings (如 R2 fresh ralph-wiggum XML wrapper 升级 / D1.5-12 array element substring match 升级 / engineering 5 specific rule 命中映射 / etc.)
  - **§ 4 Sister review references** — phase 1.4 sister T1+T2+T3 模式持续 (W-6 phase 1.3 sister review T4.2 落地 / sister T3 transparency T7.1 落地 / sister T2 transparency Known Limitations T1.1 落地)
  - **§ 5 ADR 0009 引用 + Tag verify** — `git tag -l adr-0009-accepted` + `git tag -l v0.1.0-alpha.5-routing-l2-engineering`
- **后置命令**:
  ```bash
  wc -l .planning/phase-1.5/VERIFICATION.md  # ≥ 150L
  ```
- **验收**:
  - [ ] VERIFICATION.md ≥ 150L 5-section 完整
  - [ ] §1 D1-D8 8 复现命令完整
  - [ ] §2 Phase 2.0 prereq 8 接口契约 + 8 支柱 closure
  - [ ] §3 Findings 索引 ≥ 5 项
- **决策来源**: D1-D8 + KICKOFF § 8 支柱 + PLAN § 4 + phase 1.4 VERIFICATION.md 风格

#### T8.3 — git tag adr-0009-accepted + git tag v0.1.0-alpha.5-routing-l2-engineering (main agent decide push)

- [ ] **目标**: tag pushed (main agent decide push 时机)
- **文件**: (git tag — 无文件)
- **内容大纲**:
  - `git tag adr-0009-accepted -m "ADR 0009 errata accepted — D1.4-2 v1.1 + F42 array semantic match + ralph-wiggum XML wrapper + R6 ship transparency"`
  - `git tag v0.1.0-alpha.5-routing-l2-engineering -m "phase 1.5 ship — DAG resolver + Semantic Router L2 stub + engineering 5 routing rules + mattpocock 23 招式 phase routing + ADR 0009 errata"`
  - `git push origin adr-0009-accepted v0.1.0-alpha.5-routing-l2-engineering` (main agent decide)
- **后置命令**:
  ```bash
  git tag -l adr-0009-accepted                                       # 命中
  git tag -l v0.1.0-alpha.5-routing-l2-engineering                    # 命中
  git push origin adr-0009-accepted v0.1.0-alpha.5-routing-l2-engineering  # main agent decide
  ```
- **验收**:
  - [ ] adr-0009-accepted tag 创建
  - [ ] v0.1.0-alpha.5-routing-l2-engineering tag 创建
  - [ ] (main agent decide) push 成功
- **决策来源**: D7 + KICKOFF § "8 baseline tag" + phase 1.4 ship 模式

#### T8.4 — ROADMAP.md 更新 phase 1.5 ship + phase 2.0 prereq notes

- [ ] **目标**: `.planning/ROADMAP.md` 更新 — phase 1.5 ship row 加 ✅ + phase 2.0 prereq notes (含 8 支柱 100% capture verify roadmap closure)
- **文件**: `.planning/ROADMAP.md` (修改)
- **内容大纲**:
  - phase 1.5 row status: ⏳ in-progress → ✅ SHIPPED 2026-05-NN
  - phase 2.0 prereq notes 段 (新加):
    - 8 接口契约 frozen (PLAN § 4)
    - 8 支柱 100% capture verify roadmap closure
    - phase 2.0 entry: execute-task workflow 主线 + ralph-loop full integration
- **后置命令**:
  ```bash
  grep "phase-1.5" .planning/ROADMAP.md | grep -c "SHIPPED"  # ≥ 1
  grep -c "phase 2.0 prereq" .planning/ROADMAP.md            # ≥ 1
  ```
- **验收**:
  - [ ] phase 1.5 row SHIPPED
  - [ ] phase 2.0 prereq notes 段加成
- **决策来源**: KICKOFF § 8 支柱 100% capture roadmap closure + ASSUMPTIONS D1.5-13~D1.5-15 + ROADMAP v3 重排

---

## Footer — 维护检查清单

### 每次 commit 前自检 (沿袭 phase 1.4 + 加 D-22 v1→v2 yaml migration check)

```bash
# 1. typecheck + lint
npm run typecheck
npm run lint

# 2. test pass
npm test

# 3. A7 守恒 (ADR 0001-0008 main body 不动)
git diff origin/phase-1.4-ship..HEAD docs/adr/0001-*.md docs/adr/0008-*.md | grep -c "^-"  # 应 = 0

# 4. ci.yml A7 step iter 1-9
grep -c "adr-.*-accepted" .github/workflows/ci.yml  # = 9 (Wave 0 之后)

# 5. D-22 v1→v2 yaml migration idempotent
node scripts/migrate-decision-rules-v1-to-v2.mjs --dry-run  # exit 0 + idempotent

# 6. LOC budget hard limit (D-19 / D-20 / D-21)
wc -l src/routing/dag.ts                  # ≤ 200L
wc -l src/routing/semanticRouter.ts        # ≤ 150L
wc -l src/routing/lib/embedding.ts         # ≤ 30L
wc -l src/routing/engine.ts                # ≤ 200L (不破 phase 1.4 ship)
wc -l src/routing/agentDefinition.ts       # ≤ 200L
wc -l src/routing/systemPrompt.ts          # ≤ 80L (不破 phase 1.4 ship)
wc -l src/routing/lib/ralphLoop.ts         # ≤ 66L (不破 phase 1.4 ship)

# 7. W-5 V1 BLOCKER drift detector enum (T6.3 cell 1)
npm test -- tests/unit/routing-engine.test.ts -t "drift detector"

# 8. 30 sample re-test (R5 mitigation)
npm test -- tests/integration/routing-30-samples.test.ts  # ≥ 27/30 specific + total = 30/30
```

### Wave-Level Acceptance Checkpoint 表 (PLAN § 7 1:1 mirror)

| Wave | Acceptance | Blocker 处理 |
|------|-----------|-------------|
| 0 | ADR 0009 draft ≥ 100L + ci.yml A7 iter 1-9 | draft 缺 4 errata sub-item → revise；ci.yml grep < 9 → revise |
| 1 | Spike report verdict GO 3 处 | XML wrapper false positive → 调整 regex；Kahn cycle detect fail → revise |
| 2 | typecheck + 4 文件 LOC ≤ hard limit | LOC 超 → split spillover；typecheck fail → revise |
| 3 | yaml v2 schema parse + engineering 5 rule + migration idempotent | yaml schema fail → revise；migration non-idempotent → revise |
| 4 | systemPrompt + ralphLoop XML wrapper + agentDefinition 14 字段 + spec.ts phase + triggers | contract.md main body 动 → revert；14 字段 enum drift → revise W-5 |
| 5 | tests pass + 30 sample ≥ 27/30 | < 27/30 → 调 yaml v2 (R5)；如反复 fail → blocker sister review |
| 6 | PERF ≥ 80L + CI 三平台全绿 + A7 iter 1-9 verify | regress > 5% → revise dag.ts hot path；CI red → T7.3 hotfix |
| 7 | STATE.md SHIPPED + VERIFICATION.md ≥ 150L + tag pushed + ROADMAP.md 更新 | tag push fail → main agent retry；STATE.md 缺字段 → revise |

### 完成 phase 1.5 的最后一行 commit message 模板

```
phase-1.5: T8.4 ROADMAP.md phase 1.5 ✅ SHIPPED + phase 2.0 prereq notes (8 支柱 100% capture closure)
```

---

**phase 1.5 task_plan.md complete** — 28 atomic 子任务 / 8 wave / D1-D8 8/8 acceptance bar 1:1 task mapping verify。
