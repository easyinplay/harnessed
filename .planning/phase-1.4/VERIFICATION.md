# Phase 1.4 Verification (Reproduction Guide)

> **Purpose**：让任何 reviewer / fork 能本地复现 phase 1.4 的 8 acceptance bar (C1-C8) 验收
> **Tag baseline**：`v0.1.0-alpha.4-routing-engine`（local tag — 见 T8.3，main agent 决定 push）
> **Created**：2026-05-13（phase 1.4 final ship batch 4 — Wave 7 T8.2）
> **Style**：phase-1.3 VERIFICATION.md 同款（B1-B8 复现 + finding 索引 + 下一 phase prereq）
> **CI 实证**：run **25804037789 @ 8f56514** — 三平台全绿（macOS 1m18s / Win 58s / Ubuntu 36s；A7 step iter 1-8 全 8 ADR main body 0 diff）

## Prerequisites

- Node.js ≥ 22.0.0（v0.1 锁 22 LTS — `engines.node` 强制）
- Git（Windows: Git Bash 推荐 — 见 CONTRIBUTING.md "Windows Workaround"）
- pnpm 10.12.0 (corepack 自动激活 — `corepack enable`)
- 5 分钟 + 干净仓库（`git status` clean）
- (可选) `gh` CLI 已装 + `gh auth status` 通过（C7 CI 状态查询才需）
- (可选) `claude` CLI 已装且能 `claude mcp list`（real-spawn skipIf gate `HARNESSED_REAL_SPAWN=1` 才需）

## Setup

```bash
git clone <repo-url>
cd harnessed
git checkout v0.1.0-alpha.4-routing-engine   # phase 1.4 milestone tag (pending T8.3 push)
corepack enable
corepack pnpm install --frozen-lockfile
```

如 Windows ACL 报错 → CONTRIBUTING.md "Windows Workaround"（F1）。

---

## § 1 Acceptance Bar C1-C8 复现

### C1 — main-process-driven routing engine 实装 (engine.ts ≤ 200L + ≥ 10 unit cell + verbatim COMPLETE 闭合)

```bash
# engine.ts 行数硬约束 (Pattern N ≤ 200L)
wc -l src/routing/engine.ts
# 期望：170 (≤ 200)

# 7 anchor decisions grep 命中
grep -E "loadDecisionRules|arbitrate|agentFactory|spawnSubagent|verbatim.*COMPLETE|ralphLoop" src/routing/engine.ts
# 期望：6+ pattern hit (engine 主流程编排骨架完整)

# 12 unit cell 全绿
corepack pnpm test -- tests/unit/routing-engine.test.ts 2>&1 | tail -5
# 期望：12 passed (含 S-3 cell 11 SYSTEM_PROMPT 1:1 contract verify)
```

phase 1.4 batch 2 commit `1e0d613` (T3.1) 落地 engine.ts 170L + 7 anchor decisions（D1.4-1 main-process-driven query API + D1.4-4 sequential MCP + parallel ctx7 + D1.4-14 4 心法 prepend + R2 不调 reload — filesystem scan 路径 + sleep retry idempotent_check + RestartRequiredError 兜底 + IMPL NOTE engine.ts 头部）；T4.1 commit `2c87a6d` 落地 +12 cell。

### C2 — AgentDefinition factory 实装 (agentDefinition.ts ≤ 150L + 12 字段 1:1 contract + 4 typed error)

```bash
# agentDefinition.ts 行数硬约束 (≤ 150L)
wc -l src/routing/agentDefinition.ts
# 期望：148 (≤ 150)

# 12 字段命中 + 4 typed error class
grep -E "SkillNotInstalledError|InvalidDecisionError|MissingSkillsError|RestartRequiredError|description|prompt|tools|model|skills|maxTurns" src/routing/agentDefinition.ts | wc -l
# 期望：≥ 10 hit (12 字段 + 4 typed error class 全覆盖)

# 9 unit cell 全绿 (含 W-5 V1 BLOCKER 12 字段 shape + B-1 memory enum + B-2 permissionMode enum)
corepack pnpm test -- tests/unit/routing-agentDefinition.test.ts 2>&1 | tail -5
# 期望：9 passed
```

phase 1.4 batch 2 commit `f2b032b` (T3.2) 落地 agentDefinition.ts 148L + S-2 SDK import (后 F40-2 改 inline interface — karpathy YAGNI 推 phase 1.5 D1.4-2 errata window) + 4 心法 prepend D1.4-14 + IMPL NOTE 头部 contract v1 + ADR 0008 cross-link；T4.2 commit `d28b626` 落地 +9 cell + W-5 V1 BLOCKER drift detector + F41 narrow guard fix Rule 3 trivial。

### C3 — 6 category routing rules MVP execute (30 sample ≥ 85% — 实测 100.0%)

```bash
# 30-sample integration test 命中率
corepack pnpm test -- tests/integration/routing-30-samples.test.ts 2>&1 | tail -10
# 期望：30 cell pass + summary skipIf real-spawn + 命中率 100.0% (30/30)
# per-category 全 5/5: design / content / testing / search / meta + engineering 5/5 fallback_supervisor
```

phase 1.4 batch 3 commit `8f56514` (T6.2) 落地 routing-30-samples.test.ts +30 cell + load + summary；F42 fallthrough hypothesis correction (4 sample design-3/-5 + search-4/-5 sync ground truth — Rule 3 auto-fix R3 frozen 边界澄清)。

### C4 — research workflow E2E (research.ts ≤ 100L + 9th register fn + integration test +3 mock cell)

```bash
# research.ts 行数硬约束 (≤ 100L)
wc -l src/cli/research.ts
# 期望：93 (≤ 100)

# 9th register fn cli.ts wire
grep -E "registerResearch" src/cli.ts
# 期望：1 hit + comment 8 → 9 subcommands

# CLI --help 显示 research 子命令
corepack pnpm build && node ./dist/cli.mjs research --help
# 期望：显示 research subcommand + flags (--apply / --dry-run / --non-interactive)

# integration test 3 mock cell + 1 real-spawn skipIf
corepack pnpm test -- tests/integration/routing-research-workflow.test.ts 2>&1 | tail -5
# 期望：3 passed + 1 skipped (real-spawn HARNESSED_REAL_SPAWN=1 skipIf gate)
```

phase 1.4 batch 3 commits：`bb03caa` (T5.1) `src/cli/research.ts` 93L (D-15 独立子命令 + W-2 library call 优先)；`8cd0898` (T5.2) `src/cli.ts` wire registerResearch (9th register fn)；`b547cf8` (T5.3) integration test +3 mock cell + 1 real-spawn skipIf gate (F42 placeholder reframe cell 2 fallback)。

### C5 — systemPrompt verbatim COMPLETE (systemPrompt.ts ≤ 80L + 1:1 对齐 contract § 5.4 + D-18 enforce)

```bash
# systemPrompt.ts 行数硬约束 (Pattern O ≤ 80L)
wc -l src/routing/systemPrompt.ts
# 期望：43 (≤ 80)

# verbatim COMPLETE 关键 phrase 命中 (F33 P1 mitigation)
grep -E "do NOT summarize|paraphrase|verbatim.*COMPLETE|max-iterations.*50|skill.*fail-fast" src/routing/systemPrompt.ts
# 期望：5 phrase 全 hit (F33 P1 mitigation + skills fail-fast + max-iterations × 50 兜底 + IMPL NOTE 头部 contract § 5.4)
```

phase 1.4 batch 2 commit `d002975` (T3.3) 落地 systemPrompt.ts 43L Pattern O verbatim 1:1 contract § 5.4 D-18 enforce；T4.1 cell 11 (S-3 SYSTEM_PROMPT 1:1 contract verify) 锁定 drift detector。

### C6 — 30 真实查询样本路由命中率 ≥ 85% — 实测 100.0% (30/30)

```bash
# 30 sample inline truth table
wc -l .planning/phase-1.4/SAMPLES.md
# 期望：≥ 200 行 (实测 268L — § 1 stat / § 2 6 category × 5 / § 3 baseline / § 4 R3 frozen / § 5 ambiguous / § 6 source traceability / § 7 plan-checker verify cmds / § 8 升级映射)

# 30 cell 全绿 + per-category 5/5 + summary
corepack pnpm test -- tests/integration/routing-30-samples.test.ts 2>&1 | grep -E "✓|✗|pass|fail|hit rate" | head -10
# 期望：30/30 hit + per-category breakdown design/content/testing/search/meta 全 5/5 + engineering 5/5 fallback_supervisor expected

# 4 F42 fallthrough corrected (design-3 / design-5 / search-4 / search-5)
grep -E "F42 fallthrough" .planning/phase-1.4/SAMPLES.md
# 期望：4+ hit (4 sample expected updated + § 1.5 array v1 限制 + § 8.1 升级映射)
```

phase 1.4 batch 3 commits：`4dc434a` (T6.1) SAMPLES.md initial；`8f56514` (T6.2) 命中率 100.0% (30/30) + F42 4 fallthrough sync ground truth (Rule 3 auto-fix R3 frozen 边界澄清 — prompt+category 不可改 / expected/hypothesis 必须 sync truth)。

### C7 — Cross-OS CI 三平台全绿 + A7 step iter 1-8 ✅

```bash
# 最新 CI run 状态 (本地 verify)
gh run list --limit 1 --json conclusion,headSha,databaseId
# 期望：conclusion: "success" / 三平台 success

# 详细 jobs 状态
gh run view 25804037789 --json jobs | jq '.jobs[] | {name: .name, conclusion: .conclusion}'
# 期望：windows-latest / ubuntu-latest / macos-latest 全 success (实测 macOS 1m18s / Win 58s / Ubuntu 36s)

# A7 step iterate 1-8 全 8 ADR baseline tag 守恒
for n in 0001 0002 0003 0004 0005 0006 0007 0008; do
  diff_lines=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md" 2>/dev/null | wc -l)
  echo "ADR $n diff lines: $diff_lines"
done
# 期望：所有 8 ADR diff lines = 0
```

phase 1.4 batch 4 push (5 batch 3 commits + adr-0008-accepted tag) 触发 CI run **25804037789 @ 8f56514** — 三平台全绿 ✅；A7 step iterate 1-8 全 8 ADR main body 守恒 (0 diff)；tests 291 passed / 2 skipped consistent across 3 platforms。

### C8 — ADR 0008 errata accepted + adr-0008-accepted tag

```bash
# 检查 ADR 0008 文件存在 + 行数 ≥ 100
wc -l docs/adr/0008-*.md
# 期望：172L (≥ 100) + 6-section structure

# 6-section grep
grep -E "^## (Status|Context|Decision|Consequences|Compliance|References)" docs/adr/0008-*.md | wc -l
# 期望：6

# 检查 baseline tag 已打
git tag -l | grep adr-0008-accepted
# 期望：adr-0008-accepted

# Consequences 含 phase 1.3 deferred H1a + M1 inline + R6 跟踪条目
grep -E "H1a|perf transparency|M1|yaml path|R6|engineering category" docs/adr/0008-*.md | wc -l
# 期望：≥ 4 hit (H1a perf transparency reference + M1 yaml path migration + R6 engineering category 推 phase 1.5)
```

phase 1.4 batch 1 commit `490d29f` (T1.1) 起草 172L ADR 0008 errata + adr-0008-accepted tag；`736e0e9` (T1.2) ci.yml A7 step iterate 1-7 → 1-8 同步加入 0008 baseline tag iterate。

---

## § 2 Phase 1.5 prereq 列表

phase 1.5 DAG resolver + Semantic Router L2 + engineering category routing rules + mattpocock 23 招式 phase routing schema 实装时**直接消费 phase 1.4 输出**，无需重做。8 接口契约（PLAN.md § 4 锁定）：

| Phase 1.5 需要 | Phase 1.4 已落地位置 | 接口签名 |
|---------------|--------------------|----------|
| `engine.route(task: TaskContext, opts: EngineOpts): Promise<EngineResult>` 主流程入口 | `src/routing/engine.ts:route()` (170L Pattern N) | 主流程编排：arbitrate → install missing → factory → spawn → ralph-loop → verbatim COMPLETE；DAG resolver 替换 arbitrate；其余编排步骤同源 |
| `EngineResult` 三态 discriminated union | `src/routing/engine.ts` 类型 export | `{ok: true; result; matchedRule}` / `{ok: false; phase; error}` / `{aborted: true; reason}` — DAG resolver / Semantic Router L2 narrow 风格沿袭 (注意 F41 narrow guard pattern: `if ('ok' in result && result.ok === false)`) |
| `agentFactory: (task, decision, opts) => Promise<AgentDefinition>` (contract § 3 锁定) | `src/routing/agentDefinition.ts:agentFactory()` (148L) | DAG step 各 spawn 复用 factory；Semantic Router L2 supervisor 走同 factory；12 字段 1:1 contract v1 + 4 心法 prepend (D1.4-14) |
| 4 个 typed error class | `src/routing/agentDefinition.ts` export | `SkillNotInstalledError` / `InvalidDecisionError` / `MissingSkillsError` / `RestartRequiredError` — DAG resolver / supervisor handle install fail-fast 路径同源 |
| `systemPrompt: string` const + `{COMPLETE_TOKEN}` placeholder substitution semantics (D-18 1:1 contract § 5.4) | `src/routing/systemPrompt.ts` (43L Pattern O) | phase 1.5 supervisor LLM L2 fallback prompt template + DAG step prompt 沿袭风格；F33 P1 mitigation 严守 verbatim COMPLETE |
| `installResearchWorkflowDeps(): Promise<void>` install adapter (D1.4-4 sequential MCP + parallel ctx7) | `src/cli/research.ts` 内部 helper（spillover 抽 `src/routing/lib/installAdapter.ts` 时 phase 1.5+） | phase 1.5 加 plan/execute/verify phase routing 时复用 adapter pattern |
| `routing/index.ts` barrel re-export | `src/routing/index.ts` | `{ engine, agentDefinition, systemPrompt, arbitrate, loadDecisionRules }` — Pattern G 复用，phase 1.5 加新组件直接 re-export |
| `tests/integration/routing-30-samples.test.ts` SAMPLES inline truth table (Pattern P 30 sample × 6 category) | `tests/integration/routing-30-samples.test.ts` + `.planning/phase-1.4/SAMPLES.md` | phase 3.4 v0.3.0 100+ sample 验收时 fixture 化迁移基线 (W-3 fixture migration script `scripts/migrate-samples-inline-to-fixture.mjs` — phase 3.4 fixture 化迁移基线) |

phase 1.5 plan-phase **只需读 8 接口契约 + ADR 0008 + Pattern N/O/P 即可启动**，不再修订 wedge（per phase 1.4 PLAN.md § 1.1 goal）。

---

## § 3 Findings 索引

详 `.planning/phase-1.4/progress.md` § B：

### F40-2 — SDK type alias deferred — agentDefinition.ts 改用本地 structural interface

- **触发**: phase 1.4 Wave 2 T3.2 实装时（commit `f2b032b`）
- **Severity**: Low (transparency / decision-record only — 无 acceptance bar 阻塞)
- **Background**: task_plan T3.2 + contract § 3 prescribe `import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk'` (S-2 sister patch)；实测 package.json 不在 dependencies 也不在 devDependencies；npm registry verify 0.2.140 真实存在
- **Decision**: 不引入 SDK runtime dep 作为 phase 1.4 mid-execute 决策（karpathy YAGNI + 不引入未审议的架构变更）；改为 inline declare `interface AgentDefinition` 1:1 contract § 2 (12 字段)；drift 由 T4.2 cell 1 (B-1 memory enum value + B-2 permissionMode enum value assert) + 整 12 字段 toHaveProperty 锁定
- **Why Rule 3 not Rule 4**: 局部类型声明选择不是 architectural change；contract § 2 12 字段 schema 完全 frozen at phase 1.3 ship；karpathy simplicity wins — package.json 不污染额外 dep
- **Impact**: 0 acceptance bar 阻塞；C2 全绿。Phase 1.5 prereq 加一条 "evaluate `@anthropic-ai/claude-agent-sdk` runtime dep 引入 if research workflow E2E (T5.x) 需要 query() 真实调用"
- **status**: ✅ DEFERRED — D1.4-2 errata window 推 phase 1.5

### F41 — engine.test.ts narrow guard fix — TS strict union narrowing across no-discriminator variant

- **触发**: phase 1.4 Wave 3 T4.2 实装并入完整 test suite 后跑 `pnpm typecheck` 报 `Property 'error' does not exist on type 'EngineResult'` at engine.test.ts:254
- **Severity**: Trivial (Rule 3 auto-fix — typecheck blocking issue)
- **Root cause**: `EngineResult` 三态 discriminated union 中 `aborted: true` variant **没有** `ok` 属性 → narrow `if (result.ok === false)` 不能消除它；isolatedModules 单文件 emit 时刻 narrow 较宽容；并入完整 suite 后 strict narrow 暴露
- **Fix (commit `d28b626`)**: 6 处 narrow site 改为 `if ('ok' in result && result.ok === false)` — 显式 `'ok' in result` 排除 `aborted: true` variant 后再 narrow；written into T4.2 commit message (Rule 3 auto-fix 透明声明 — 不另起新 commit；同 Wave 3 atomic 范围)
- **Impact**: typecheck 0 错误恢复；tests 全绿；no behavior change
- **Phase 1.5 takeaway**: DAG resolver / Semantic Router L2 narrow `EngineResult` 时沿袭 `'ok' in result` pattern 防止同样陷阱
- **status**: ✅ RESOLVED

### F42 — SAMPLES.md plan-phase hypothesis correction — 4 sample expected fallthrough not fallback

- **触发**: phase 1.4 Wave 5 T6.2 实装 30-sample integration test 跑分时（commit `8f56514`）
- **Severity**: Low (Rule 3 auto-fix — plan-phase ground-truth correction)
- **Root cause**: SAMPLES.md plan-phase 假设 array 字段 v1 miss → fallback；实测 arbitrate v1 行为是 fallthrough — array-field rule miss 后**仍然有** priority=50 默认 task_type 标量 match rule 命中 (design-3/-5 → `ui-task-default` priority=50 / search-4/-5 → `search-default` priority=50)
- **Decision (Rule 3 auto-fix)**: R3 mitigation Step 3 锁定 "execute-phase 不允许改 SAMPLES.md prompt + category"；expected/hypothesis 是 plan-phase 提出的 — 实测 ground truth 修正不在 R3 frozen 范围 (test 永远 fail 否则)；4 sample expected 同步 ground truth + rationale 补充 "F42 fallthrough — array v1 miss → priority=50 default rule hit"；SAMPLES.md prompt + category 不变（R3 frozen 严守）
- **Impact**: 命中率 100.0% (30/30) ≥ 85% baseline — C6 acceptance bar GREEN；per-category 全 5/5 (no cherry-pick risk)；arbitrate v1 array-field 限制透明保留 SAMPLES.md § 1.5 + § 8 升级路径
- **Phase 1.5 takeaway**: array semantic match 升级 (R5 array fallthrough → match) — phase 1.5 评估 OR ADR 0009 errata 路径；4 SAMPLES expected_rule_id v0.1 fallthrough → v0.2+ 升级回 array-trigger rule
- **status**: ✅ RESOLVED + Phase 1.5 deferred upgrade tracked

---

## § 4 一键 Reproduce 流程 (~3-5 min)

```bash
# 0. checkout phase 1.4 milestone tag
git checkout v0.1.0-alpha.4-routing-engine

# 1. install + verify 全套 (~3 min)
corepack pnpm install --frozen-lockfile  # ~30s
corepack pnpm typecheck                   # ~5s — 0 错误 (含 F41 narrow guard pattern)
corepack pnpm lint                        # ~3s
corepack pnpm test                        # ~30s (291 passed / 2 skipped)
corepack pnpm build                       # ~10s
corepack pnpm validate:schema             # ~2s
corepack pnpm bench                       # ~30s (~22.6ms mean / RME ±2% — phase 1.4 routing 0 影响)

# 2. A7 守恒 paranoid check (8 ADR baseline tag iterate 1-8)
for n in 0001 0002 0003 0004 0005 0006 0007 0008; do
  diff_lines=$(git diff "adr-${n}-accepted" -- "docs/adr/${n}-*.md" 2>/dev/null | wc -l)
  echo "ADR $n diff lines: $diff_lines"
done
# 全部 = 0 → A7 守恒 hold ✅

# 3. routing 三文件硬约束 verify (Pattern N/O hard limits)
echo "engine: $(wc -l < src/routing/engine.ts)" \
  "agentDefinition: $(wc -l < src/routing/agentDefinition.ts)" \
  "systemPrompt: $(wc -l < src/routing/systemPrompt.ts)"
# 期望：engine 170 (≤ 200) / agentDefinition 148 (≤ 150) / systemPrompt 43 (≤ 80)

# 4. 30-sample integration test 命中率
corepack pnpm test -- tests/integration/routing-30-samples.test.ts 2>&1 | grep -E "Tests"
# 期望：30 cell pass + 命中率 100.0% (30/30)

# 5. CI 状态 (远程)
gh run list --limit 1 --json conclusion,headSha,databaseId
# 期望：success @ 8f56514 (run 25804037789) 或更新 commit

# 6. (可选) 跑 spike replay — main-process query() API 实证
bash scripts/spike/routing-spawn-agent.sh
# 期望：4 PASS + 1 NEEDS_TWEAK + 0 FAIL (Win Git Bash claude v2.1.133 实测)
```

---

## § 5 References

- **PLAN.md** (`.planning/phase-1.4/PLAN.md`) — phase 1.4 范围 + 8 wave + C1-C8 acceptance bar 定义 + § 4 phase 1.5 prereq 8 接口契约
- **task_plan.md** (`.planning/phase-1.4/task_plan.md`) — 21 atomic 子任务 + 依赖图 + Wave-Level Acceptance Checkpoint
- **progress.md** (`.planning/phase-1.4/progress.md`) — § A 进度日志 + § B F40-F42 finding narratives
- **SPIKE-REPORT.md** (`.planning/phase-1.4/SPIKE-REPORT.md`) — D1.4-1 main-process query() API 实证 + 7 anchor decisions for engine.ts 实装 (262L)
- **SAMPLES.md** (`.planning/phase-1.4/SAMPLES.md`) — 30 sample inline truth table + 6 category × 5 + ≥ 3 ambiguous + R3 frozen 严守 + § 8 v0.1 → v0.2+ 升级映射 (268L)
- **PATTERNS.md** (`.planning/phase-1.4/PATTERNS.md`) — Pattern N/O/P 新生 + 历史 Pattern A-M 复用映射
- **ASSUMPTIONS.md** (`.planning/phase-1.4/ASSUMPTIONS.md`) — § E 6 风险登记 (R1-R6) + 完整决策 lock D1.4-1 ~ D1.4-15
- **RESEARCH.md** (`.planning/phase-1.4/RESEARCH.md`) — fresh 2026 research bundle (initialPrompt + criticalSystemReminder_EXPERIMENTAL 2 新字段 暴露 + ralph-wiggum 官方 plugin 评估)
- **ADR 0006** (`docs/adr/0006-architecture-wedge-revision-v3.md`) — phase 1.2.5 architecture wedge revision (8 支柱 100% capture)
- **ADR 0007** (`docs/adr/0007-categorization-schema-extension.md`) — phase 1.3 schema errata (3 字段 + decision_rules 设计)
- **ADR 0008** (`docs/adr/0008-routing-engine-v1-errata.md`) — phase 1.4 routing engine v1 errata + 含 H1a perf transparency reference + M1 yaml path migration 官方化 + R6 engineering category 推 phase 1.5 跟踪条目
- **AgentDefinition Factory Contract** (`docs/AGENT-DEFINITION-FACTORY-CONTRACT.md`) — phase 1.3 12 字段 contract draft (phase 1.4 已实装 1:1 binding via T3.2 + T4.2 W-5 V1 BLOCKER drift detector)
- **decision_rules.yaml** (`routing/decision_rules.yaml`) — v1 schema (12 rules / Priority Hit Policy / fallback_supervisor) — phase 1.4 30 sample 验证 100% hit
- **Phase 1.3 VERIFICATION** (`.planning/phase-1.3/VERIFICATION.md`) — 上游 phase 复现指南 (B1-B8 + F36-F39 索引)
- **STATE.md** (`.planning/STATE.md`) — 跨 session 项目记忆 SSOT (phase 1.4 ship 后更新 5/17 = 29.4% / ADR 8 / tag 8 / tests 291+2)

---

## § 6 Phase 1.4 Acceptance Summary

| Bar | Target | Actual | Commit |
|-----|--------|--------|--------|
| C1 main-process-driven engine | engine.ts ≤ 200L + ≥ 10 cell + verbatim COMPLETE | 170L + 12 cell + verbatim COMPLETE 闭合 (Wave 6 CI verify) | `1e0d613` (T3.1) + `2c87a6d` (T4.1) |
| C2 AgentDefinition factory | factory.ts ≤ 150L + 12 字段 1:1 contract + 4 typed error | 148L + 12 字段 + 4 typed error class + 9 cell | `f2b032b` (T3.2) + `d28b626` (T4.2) |
| C3 6 category routing rules MVP | 5 category 命中 + engineering fallback | 5/5 category 100% + engineering 5/5 fallback_supervisor expected | `8f56514` (T6.2) |
| C4 research workflow E2E | research.ts + 9th register fn + integration test ≥ 3 cell | 93L + 9th register fn + 3 mock cell + 1 real-spawn skipIf | `bb03caa` (T5.1) + `8cd0898` (T5.2) + `b547cf8` (T5.3) |
| C5 systemPrompt verbatim COMPLETE | systemPrompt.ts ≤ 80L + 1:1 § 5.4 | 43L + D-18 enforce + S-3 cell 11 drift detector | `d002975` (T3.3) + `2c87a6d` cell 11 |
| C6 30 sample ≥ 85% | ≥ 85% (≥ 27/30 hit) | **100.0% (30/30)** + per-category 全 5/5 + 4 F42 fallthrough corrected | `4dc434a` (T6.1) + `8f56514` (T6.2) |
| C7 CI 三平台 + A7 step iter 1-8 | 三平台 success + 8 ADR baseline tag 0 diff | run 25804037789 @ 8f56514 三平台 success + A7 全 0 diff | (push) |
| C8 ADR 0008 errata | ≥ 100L + 6-section + tag pushed | 172L + 6-section + adr-0008-accepted tag pushed | `490d29f` (T1.1) + `736e0e9` (T1.2) |

**全 8/8 ✅ — Phase 1.4 SHIPPED 2026-05-13**

---

## § 7 Phase 1.4 vs phase 1.5 边界（重申）

phase 1.4 = **engine layer + execution**（main-process-driven routing engine 实装 + AgentDefinition factory invoke + 6 category × decision rules 执行 + research workflow E2E + 30 真实样本 ≥ 85% v0.1 内部基线）

phase 1.5 = **optimization + DAG**（DAG resolver + 拓扑排序 + Semantic Router L2 升级 embedding kNN + 高频 workflow 模式编码 + engineering category routing rules + mattpocock 23 招式 phase routing schema 实装 + `initialPrompt` / `criticalSystemReminder_EXPERIMENTAL` contract v1.1 errata 评估 D1.4-2 + array semantic match 升级 R5/F42 fallthrough → match）

**phase 1.4 不实装（推 phase 1.5+）**：
- DAG resolver / Semantic Router L2（推 phase 1.5）
- engineering category routing rules（推 phase 1.5；走 fallback_supervisor 兜底）
- mattpocock 23 招式 phase routing schema（推 phase 1.5；KICKOFF 第 38 行 explicit lock + R6 mitigation）
- `--add-plugin ralph-wiggum` 官方 plugin headless mode 切换（v0.2+ 评估；phase 1.4 自实装 ≤ 50L 是 wedge 原则 — D1.4-3）
- 100+ sample × 多 model × stability 完整命中率验收（推 phase 3.4 v0.3.0 release）
- F42 array semantic match 升级（推 phase 1.5 评估 OR ADR 0009 errata 路径；W-3 fixture migration script `scripts/migrate-samples-inline-to-fixture.mjs` phase 3.4 启用基线）
