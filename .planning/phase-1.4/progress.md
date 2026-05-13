# Phase 1.4 Progress & Findings Tracker

> **本文件合并 progress + findings 双重职责**（沿袭 phase 1.1/1.2/1.2.5/1.3 同款）
> **完整规划与依赖图**：见 `task_plan.md` + `PLAN.md`
> **Section A** — 进度日志（happy path）
> **Section B** — Findings & Decision Log（异常 / 决策修订 / blocker）
> **Finding 编号续接**：phase 1.3 结束在 F39；phase 1.4 新 finding 从 **F40** 开始

---

## Section A — 进度

### A.1 维护规则

- 每完成一个 task → § A.4 追加一行 `YYYY-MM-DD | <task-id> | <result> | <commit-shorthash>`
- C1-C8 8 acceptance bar 进度同步 § A.2 状态
- Wave 完成时 § A.3 标记 ✅ + 跑 Wave-Level Acceptance Checkpoint（task_plan § Wave-Level Acceptance Checkpoint）
- Blocker / 异常 / 决策修订写到 § B（不进 § A），事后 § A 用一行引用 `see § B Fxx`
- A7 守恒约束：commit 前 paranoid check `git diff adr-NNNN-accepted -- docs/adr/NNNN-*.md` 必须为空（ADR 0001-0008）

### A.2 Acceptance Bar Snapshot — C1-C8 8 acceptance bar

- ⏳ **C1** main-process-driven routing engine 实装 — engine.ts 170L ≤ 200L ✅; ≥10 unit cell (12 实测 ✅); verbatim COMPLETE 回流验证 ✅ (Wave 6 CI verify 推 batch 3+)
- ⏳ **C2** AgentDefinition factory 实装 — agentDefinition.ts 148L ≤ 150L ✅; 12 字段 1:1 contract ✅; 4 错误处理路径 ✅ (Wave 6 CI verify 推 batch 3+)
- ⏳ **C3** 6 category routing rules MVP execute (推 Wave 5 30-sample test)
- ⏳ **C4** research workflow E2E (推 Wave 4)
- ⏳ **C5** systemPrompt verbatim COMPLETE — systemPrompt.ts 43L ≤ 80L ✅; 1:1 对齐 contract § 5.4 ✅; D-18 enforce ✅
- ⏳ **C6** 30 真实查询样本路由命中率 ≥ 85% (推 Wave 5)
- ⏳ **C7** Cross-OS CI 三平台保持全绿 + A7 step iter 1-8 ✅ (本地 verify 全 0; push verify 推 Wave 6)
- ✅ **C8** ADR 0008 errata accepted + adr-0008-accepted tag (T1.1 ✅ — 本地 push 推 Wave 6 batch with tag)

### A.3 Wave Status

- ✅ **Wave 0** (前置 — ADR 0008 errata + ci.yml A7 iter 1-8) — T1.1 + T1.2 done
- ✅ **Wave 1** (Spike — main-process query() API 实证) — T2.1 + T2.2 done; SPIKE-REPORT § 7 7 anchor decisions ready
- ✅ **Wave 2** (engine.ts + agentDefinition.ts + systemPrompt.ts 实装) — T3.1 + T3.2 + T3.3 done
- ✅ **Wave 3** (Tests engine + agentDefinition unit) — T4.1 + T4.2 done
- ⏳ **Wave 4** (research workflow E2E sub-routing) — T5.1 + T5.2 + T5.3 推 batch 3
- ⏳ **Wave 5** (30 sample SAMPLES.md + sample-driven test) — T6.1 + T6.2 推 batch 3
- ⏳ **Wave 6** (Cross-OS CI verify) — T7.x 推 batch 3
- ⏳ **Wave 7** (Docs + ship) — T8.x 推 batch 3+

### A.4 进度日志

| Date | Task | Result | Commit |
|------|------|--------|--------|
| 2026-05-13 | T1.1 | ADR 0008 errata + adr-0008-accepted tag (172L 6-section) | `490d29f` |
| 2026-05-13 | T1.2 | ci.yml A7 step iter 1-7 → 1-8 (含 ADR 0008) | `736e0e9` |
| 2026-05-13 | T2.1 | spike script 47L on Win Git Bash claude v2.1.133 — 4 PASS + 1 NEEDS_TWEAK + 0 FAIL | `d57c903` |
| 2026-05-13 | T2.2 | SPIKE-REPORT.md 262L; verbatim COMPLETE FEASIBLE; engine.ts § 7 anchor decisions ≥5 | `d9f7208` |
| 2026-05-13 | T3.3 | systemPrompt.ts 43L ≤ 80L; Pattern O verbatim 1:1 contract § 5.4 D-18 | `d002975` |
| 2026-05-13 | T3.2 | agentDefinition.ts 148L ≤ 150L; 1:1 contract 12 字段 + 4 typed error + 4 心法 prepend | `f2b032b` |
| 2026-05-13 | T3.1 | engine.ts 170L ≤ 200L; 7 anchor decisions 落地; src/routing/lib/ralphLoop.ts spillover; src/routing/index.ts barrel | `1e0d613` |
| 2026-05-13 | T4.1 | routing-engine.test.ts +12 cell (含 S-3 cell 11 SYSTEM_PROMPT 1:1 contract verify); tests 235+1 → 247+1 | `2c87a6d` |
| 2026-05-13 | T4.2 | routing-agentDefinition.test.ts +9 cell (含 W-5 V1 BLOCKER 12 字段 + B-1/B-2 enum value lock); tests 247+1 → 256+1; engine.test 'ok' in result narrow guard fix | `d28b626` |

---

## Section B — Findings & Decision Log

### F40-2: SDK type alias deferred — agentDefinition.ts 改用本地 structural interface

**Date**: 2026-05-13 (Wave 2 T3.2 实装时刻)
**Severity**: Low (transparency / decision-record only — 无 acceptance bar 阻塞)
**Trigger**: T3.2 src/routing/agentDefinition.ts 实装时

**Background**:
- task_plan T3.2 (line 168) + contract § 3 prescribe `import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk'` (S-2 sister patch — "TypeScript-derived type alias 自动追随官方 SDK 升级")
- 实测 `package.json`：`@anthropic-ai/claude-agent-sdk` **不在** dependencies 也不在 devDependencies
- npm registry verify (`pnpm view @anthropic-ai/claude-agent-sdk version`) 返回 `0.2.140` — package 真实存在于 npm

**Decision (executor 2026-05-13)**:
- **不引入** SDK runtime dep 作为 phase 1.4 mid-execute 决策（karpathy YAGNI + 不引入未审议的架构变更）
- 改为 inline declare `interface AgentDefinition` 1:1 contract § 2 (12 字段) — drift 由 T4.2 cell 1 (B-1 memory + B-2 permissionMode enum value assert) 锁定
- IMPL NOTE 头部已透明标注此偏离 + 推 phase 1.5 D1.4-2 errata window 时同步评估 SDK 引入

**Why Rule 3 not Rule 4**:
- 这不是 architectural change（不引入新 service / lib / 数据流）— 是局部类型声明选择
- contract § 2 12 字段 schema 完全 frozen at phase 1.3 ship — local interface 1:1 镜像不会 drift（T4.2 cell 1 enum value assert + 整 12 字段 toHaveProperty 锁定）
- karpathy simplicity wins — package.json 不污染额外 dep
- 如未来需要 SDK 双向 contract（spawn 调用真实 query() API），phase 1.5 + ADR 0008+ errata 可顺势引入

**Impact**: 0 acceptance bar 阻塞；C2 全绿。Phase 1.5 prereq notes 加一条 "evaluate `@anthropic-ai/claude-agent-sdk` runtime dep 引入 if research workflow E2E (T5.x) 需要 query() 真实调用"。

**References**:
- task_plan.md T3.2 (line 168) S-2 sister patch
- docs/AGENT-DEFINITION-FACTORY-CONTRACT.md § 3 (factory signature)
- src/routing/agentDefinition.ts L11-L21 (IMPL NOTE F40-2 透明标注)
- tests/unit/routing-agentDefinition.test.ts cell 1 (W-5 V1 BLOCKER drift detector)
- commit `f2b032b`

---

### F41: engine.test.ts narrow guard fix — TS strict union narrowing across no-discriminator variant

**Date**: 2026-05-13 (Wave 3 T4.2 实装时刻)
**Severity**: Trivial (Rule 3 auto-fix — typecheck blocking issue)
**Trigger**: T4.2 实装并入完整 test suite 后跑 `pnpm typecheck` 报 `Property 'error' does not exist on type 'EngineResult'` at engine.test.ts:254

**Background**:
- `EngineResult` 三态 discriminated union: `{ok: true; ...}` | `{ok: false; phase; error}` | `{aborted: true; reason}`
- TS 严格 narrow: `if (result.ok === false)` 在 `aborted: true` variant 下会失败 — 该 variant **没有** `ok` 属性，narrow 不能消除它
- 单跑 T4.1 test file pass 是因为 isolatedModules / 单文件 emit 时刻 narrow 较宽容

**Decision (executor 2026-05-13)**:
- 6 处 narrow site 改为 `if ('ok' in result && result.ok === false)` — 显式 `'ok' in result` 排除 `aborted: true` variant 后再 narrow
- 写到 T4.2 commit message (Rule 3 auto-fix 透明声明 — 不另起新 commit；同 Wave 3 atomic 范围)

**Impact**: typecheck 0 错误恢复；tests 全绿；no behavior change。

**References**:
- src/routing/engine.ts L45-L48 EngineResult 定义
- tests/unit/routing-engine.test.ts L84/L111/L148/L206/L218/L253 narrow 6 处
- commit `d28b626`

---
