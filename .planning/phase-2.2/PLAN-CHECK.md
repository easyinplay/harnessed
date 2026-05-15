# Phase 2.2 — PLAN-CHECK

> **Verdict:** APPROVED WITH CONDITIONS (0/13 BLOCKER, 4 WARNING + 5 SUGGESTION advisory, miss: none) — 2026-05-15
> **Checker**: gsd-plan-checker (Claude Opus 4.7, 1M ctx)
> **Files audited**: KICKOFF / 2.2-CONTEXT / PATTERNS / RESEARCH / ASSUMPTIONS / PLAN / task_plan (7 files, ~1900L total)
> **Scope**: goal-backward verification — does the plan WILL achieve F1-F8 + 8 hard constraints + Karpathy simplicity + A7 守恒
> **Sister cadence**: 沿袭 phase 1.5 / 2.1 PLAN-CHECK 13-section structure

---

## § 1 Goal-backward F1-F8 achievability

每 acceptance bar 1:1 映射到 task,且 task 含 grep-verifiable acceptance criteria。逐项审计:

| Bar | Wave | Task(s) | Achievability | Notes |
|-----|------|---------|---------------|-------|
| **F1** (transparency 一次性根治) | W0 | T0.3 + T0.4 + T0.5 + T0.6 + T0.7 | HIGH | 5 task 覆盖 D-07 a/b/c 三子项 + B-14/B-15/B-16/B-18 4 lock。T0.3 acceptance 三层 verify (gate violations=0 + wc -l == 13 + N/N ratio grep) |
| **F2** (ADR errata draft) | W0+W6 | T0.2 + T6.1 | HIGH | 双 wave 设计明确;T0.2 acceptance grep level-3 numbered heading wc -l == 6;T6.1 加 Status: Accepted + ≥20 B-lock cite |
| **F3** (SDK 引入) | W1 | T1.1 + T1.2 + T1.3 + T1.4 | HIGH | T1.2 含 SC1/SC2/SC3 3 criterion;research valid 2026-06-15 (本 phase 2026-05-15 安全期) |
| **F4** (contract v1.2 + dual-signal 4-layer) | W2 | T2.1 + T2.2 + T2.3 + T2.4 + T2.5 | HIGH | T2.4 双 grep 验 4-layer 实装;T2.5 含 ≥4 test case 每 layer 1 case |
| **F5** (per-phase model tier schema) | W3 | T3.1 + T3.2 + T3.3 + T3.4 | HIGH | T3.3 命令显式验 opus,sonnet,sonnet,haiku 输出 (intel 第 4 条 1:1);T3.4 含 5 invariant test |
| **F6** (ralph-loop full integration) | W4 | T4.1 + T4.2 + T4.3 | HIGH | T4.2 acceptance grep placeholder wc -l == 0 强制 removed;T4.3 含 Win Git Bash sentinel |
| **F7** (CLI + 30 sample) | W5 | T5.1 + T5.2 + T5.3 + T5.4 + T5.5 | HIGH | T5.5 acceptance 30/30 100% 准确 (或 explicit known-miss enumeration sister phase 1.4 模式) |
| **F8** (ship) | W6 | T6.1 + T6.2 + T6.3 + T6.4 + T6.5 | HIGH | T6.3 acceptance A7 守恒 git diff wc -l == 0;T6.5 双 tag exist |

**F1-F8 全 HIGH achievability。** 8 bar / 33 task 全有 1:1 trace + grep-verifiable acceptance。

---

## § 2 Dependency check (Wave 0→1→2→3→4→5→6)

PLAN.md § 2 拓扑 + task_plan 顺序:

```
W0 (T0.1..T0.7) → W1 (T1.1..T1.4) → W2 (T2.1..T2.5) ─┬→ W4 (T4.1..T4.3) → W5 (T5.1..T5.5) → W6 (T6.1..T6.5)
                                  → W3 (T3.1..T3.4) ─┘
```

**Wave 0 真 block Wave 1+ 验证:**
- ENFORCE=true 在 T0.6 (W0 末) flip,W1+ 任何后续 commit CI 上必跑 gate (B-19 强制)
- T0.6 acceptance 含 node scripts/check-transparency-verdicts.mjs exit code == 0 — flip 时 gate 已绿
- T0.7 acceptance 含 gh run list Wave 0 ship 后 CI green sentinel

**W2 + W3 并行可行性:** OK — W2 改 routing/lib + agentDefinition + systemPrompt;W3 创 workflow/schema + loadPhases + yaml。无文件冲突;type import 仅 W4 sdkSpawn 同时引用 W2 completionSchema + sdkReconcile (W4 在 W2/W3 后,自然 OK)

**W4 真 block W5:** OK — T5.1 execute-task.ts import route from routing/engine.js (W4 T4.2 升级) + loadPhases from workflow/loadPhases.js (W3 T3.2)。两 dependency 都先于 W5 ready。

**W6 ship dependency 全 verify:** OK — T6.1 finalize 依赖 T0.2 draft + W1-W5 全 ship;T6.3 0 diff verify 全 commit history;T6.5 tag 依赖 T6.1-T6.4 全绿。

**No cycle / no forward-ref.** Wave 拓扑 clean。

**Task count 检查:** PLAN.md § 3 task table W0=7 + W1=4 + W2=5 + W3=4 + W4=3 + W5=5 + W6=5 = **33** (用户 prompt 33 atomic tasks 1:1 match)。

---

## § 3 Risk mitigation completeness (R1-R6 in ASSUMPTIONS § C)

| Risk | Mitigation? | Where |
|------|-------------|-------|
| **R1** SDK joint feature 组合不兼容 | OK | T1.2 spike 3 SC + B-07 Tier A degraded fallback;PLAN § 7 W1 checkpoint 写明 Tier B 升级路径 |
| **R2** sdkReconcile import 循环 | OK | T2.1 acceptance 含 npx tsc --noEmit pass (单向 type-only import) |
| **R3** 13 verdict manual migration 漏文件 | OK | T0.3 acceptance 三层 verify (gate violations=0 + wc -l == 13 + N/N ratio);T0.4 freshness gate 再 check |
| **R4** ENFORCE=true flip 后 CI red | OK | B-19 强制 W0 first;T0.6 单 file atomic commit easy revert;Wave 1-6 任何新增 verdict 文档须 marker 行 — 本文档头部 Verdict: 行已合规 |
| **R5** ADR 编号实占冲突 | OK | T0.1 第一步 ls docs/adr/ + max(NNNN)+1 (solo dev 无并发);沿袭 intel § 0 SSOT 引用纪律 |
| **R6** Win32 SDK spawn 兼容性 | OK partial | T1.2 spike Win 实跑 + T4.3 Win Git Bash sentinel + T6.5 3-OS CI;partial R5.3 ship + Phase 2.4 全兼容 |

**6 risk 全有 mitigation,no orphan risk。**

---

## § 4 Actionability spot check (5 representative tasks)

抽 5 task 跨 wave 各 1 个验 action concrete + acceptance grep-verifiable:

### 4.1 T0.4 (W0 transparency freshness ext)
- **Action concreteness:** HIGH — 6 step 编号 (import readFileSync / STATUS_MARKER regex literal / FRONT_MATTER_DOCS array / getLatestShippedToken fn / checkFreshness fn / main append) + 文件总长目标 45L → ~70L
- **Acceptance grep-verifiable:** HIGH — wc -l ≤ 75 + 4 symbol grep ≥ 4 + ENFORCE=false 状态下应报 missing Status: marker (为 T0.5 准备)

### 4.2 T1.3 (W1 SDK 引入 npm i)
- **Action concreteness:** HIGH — 4 step 编号 (npm i --save + version 验证 + lockfile integrity hash + typecheck)
- **Acceptance grep-verifiable:** HIGH — 3 grep + npx tsc --noEmit pass

### 4.3 T2.1 (W2 contract v1.2 — sdkReconcile.ts)
- **Action concreteness:** HIGH — full code block ~25L 包含完整 fn signature + 10 字段 inject 全 branch
- **Acceptance grep-verifiable:** HIGH — wc -l ≤ 80 + grep 2 export fn + npx tsc --noEmit + ADR fence grep

### 4.4 T3.3 (W3 model tier — phases.yaml 实例)
- **Action concreteness:** HIGH — full yaml block 4 phase × 6 字段 完整 instance + intel 第 4 条默认表 行内注释
- **Acceptance grep-verifiable:** HIGH — node -e 输出验 opus,sonnet,sonnet,haiku 精确字符串;grep model + grep id 各 == 4

### 4.5 T5.1 (W5 execute-task CLI)
- **Action concreteness:** HIGH — full code block ~60L 含 RawOpts interface + 9 flag option + H1 gate + dry-run/apply path + exit code 3-state
- **Acceptance grep-verifiable:** HIGH — wc -l ≤ 130 + 7 flag option grep + process.exit(2) ≥ 2 (H1 gate)

**5/5 spot check 全 PASS** (concrete action + grep-verifiable acceptance)。


---

## § 5 Decision trace (D-01~D-15 + D-WP-1~D-WP-7 + D2.2-1~D2.2-7 → 31 B-XX locks)

ASSUMPTIONS § B 31 lock 全消化 3 来源。

**CONTEXT D-01~D-15 (15 decisions) → ALL OK:**

| D | Lock | Resolved |
|---|------|----------|
| D-01 (14 字段 factory + 4 SDK input) | B-01 | OK |
| D-02 (dual-signal) | B-02 (refined 4-layer by RESEARCH D2.2-4) | OK |
| D-03 (SDK reconcile flow) | B-03 | OK |
| D-04 (model tier defaults + inherit) | B-08/B-09/B-10 | OK |
| D-05 (GSD vs harnessed namespace) | B-11 | OK |
| D-06 (agentFactory 读 phase.model) | B-12 | OK |
| D-07a/b/c (ENFORCE+迁移+freshness) | B-14/B-15/B-16/B-17 | OK |
| D-08 (W0 必最先) | B-19 | OK |
| D-09 (单 ADR) | B-20 | OK |
| D-10 (ADR 编号不预占) | B-21 | OK |
| D-11 (SDK INTRODUCE NOW) | B-04 | OK |
| D-12 (ralph-wiggum keep) | B-05 | OK |
| D-13 (SSOT 引用纪律) | B-21 复用 | OK |
| D-14 (4 phase model) | T5.4 SAMPLES + T3.3 yaml | OK |
| D-15 (A7 守恒) | B-22 | OK |

**PATTERNS D-WP-1~D-WP-7 (7 proposals) → ALL OK:**

| D-WP | Lock | Decision |
|------|------|----------|
| D-WP-1 (phases.yaml schema 位置) | B-13 | (b) 新文件 OK |
| D-WP-2 (workflow skill 双入路) | B-28 | (a) CLI only;trigger_phrases forward-looking OK |
| D-WP-3 (transparency migration script) | B-15 | manual 1-by-1 OK |
| D-WP-4 (freshness check 形态) | B-16 | (b) Status: marker OK |
| D-WP-5 (agentDefinition split) | B-24 | split to lib/sdkReconcile.ts OK |
| D-WP-6 (30 sample 选取) | B-29 | 15 复用 + 15 新增 OK |
| D-WP-7 (ADR 章节划分) | B-20 (6 章节) | OK |

**RESEARCH D2.2-1~D2.2-7 (7 locks) → ALL OK:**

| D2.2 | Mapped to | Resolved |
|------|-----------|----------|
| D2.2-1 (unified COMPLETION_SCHEMA) | T2.2 | OK |
| D2.2-2 (manual 1-by-1) | B-15 | OK |
| D2.2-3 (Status: marker) | B-16 | OK |
| D2.2-4 (4-layer dual-signal) | B-02 refined | OK |
| D2.2-5 (spike throwaway) | B-06 | OK |
| D2.2-6 (ENFORCE flip atomic commit) | B-18 | OK |
| D2.2-7 (STATUS_MARKER regex tolerance) | B-17 | OK |

**Conflict resolution chain (ASSUMPTIONS § B.7):** 5 conflict resolved:
- D-07c (planner discretion) → RESEARCH § 3 三候选 → B-16 (b) marker OK
- D-07b 三来源一致 → B-15 manual OK
- agentDefinition split → B-24 PATTERNS 推荐 OK
- phases.yaml 位置 → B-13 PATTERNS 推荐 OK
- 30 sample 来源 → B-29 PATTERNS 推荐 OK

**No unresolved cross-source conflicts.** Decision trace clean。

---

## § 6 Test coverage estimation

| Test artifact | Wave | Cells | Coverage scope |
|---------------|------|-------|----------------|
| tests/sdk-import.smoke.test.ts | W1 | 2 | SDK module resolve + query export |
| tests/routing/sdk-reconcile.test.ts | W2 | ≥3 | toSdkAgentDefinition + injectFactoryInternalFields + missing-field strip |
| tests/routing/isComplete.test.ts | W2 | ≥4 | 4-layer dual-signal each path |
| tests/workflow/load-phases.test.ts | W3 | ≥5 | valid + missing model + invalid enum + additionalProperties + inherit valid |
| tests/routing/sdk-spawn.test.ts | W4 | ≥3 | mock success → envelope + no result → throw + session_id callback |
| tests/routing/routing-engine.test.ts (upgrade) | W4 | ≥3 | end-to-end + max-iter exit + injection seam backward compat |
| tests/cli/execute-task.test.ts | W5 | ≥6 | H1 gate × 2 + dry-run + apply COMPLETE/PARTIAL + model-tier inherit |
| scripts/run-samples.mjs harness | W5 | 30 | F7 30/30 COMPLETE detection |

**Total estimated test cell count: ~26 unit/integration + 30 sample = ~56 verifications**

**Coverage adequacy:** HIGH — 4-layer dual-signal 每 layer 1 test (B-02 + B-07);model tier schema 5 invariant;Win sentinel via 3-OS CI;F7 30 sample 强制 100% (or known-miss enum, B-29)。

**No coverage gap.** F1-F8 全 bar 至少 1 unit + 1 integration 双层验证。

---

## § 7 接口契约 phase 2.3/2.4 prereq

PLAN.md § 4 table 列 6 consumer × surface × locked-by:

| Consumer | Surface | Task covered |
|----------|---------|--------------|
| Phase 2.3 extension category | dispatch + SKILL.md + phases.yaml schema | T5.3 + T3.1 + T3.3 OK |
| Phase 2.3 karpathy behavior-rule | COMPLETION_SCHEMA + KARPATHY_BASELINE prepend | T2.2 + T2.3 OK |
| Phase 2.4 doctor / audit | sdkSpawn async-iterable + session_id capture | T4.1 (含 onSessionId callback) OK |
| Phase 2.4 ralph-loop Win 全兼容 | ralphLoop resumeSessionId 闭包 + dual-signal | T2.4 + T4.3 sentinel OK |
| v0.3.0 checkpoint 完整版 | sdkSpawn session_id + ralphLoop resume + envelope | T4.1 + T2.4 OK |
| v0.3+ 动态 model routing | phases.yaml model + agentFactory 读 | T3.1 + T3.3 + T4.1 OK |

**6/6 prereq 全 task-covered + actionable。** Downstream phase 接口契约 clean 锁定。

---

## § 8 A7 conservation

| Check | Task | Status |
|-------|------|--------|
| ADR 编号 plan-phase 实占 (不预占) | T0.1 (ls docs/adr/ + max(NNNN)+1) | OK |
| 单 ADR errata path | T0.2 + T6.1 | OK |
| ADR 0001-0010 main body 0 diff | T6.3 (git diff wc -l == 0) | OK |
| baseline tag 1-10 → 1-N | T6.5 | OK |
| ci.yml A7 step iter seq 1 10 → 1-N | T6.2 | OK |
| AGENT-DEFINITION-FACTORY-CONTRACT.md main body 不动 | T6.1 § 4 explicit 声明 (acceptance grep 命中) | OK |
| INSTALLER-CONTRACT.md main body 不动 | 本 phase 不改 installer contract | OK |

**A7 守恒 7/7 PASS。** B-22 全 trace。


---

## § 9 Karpathy simplicity (5 hard limits)

| File | Limit | Estimate | Verify | Status |
|------|-------|----------|--------|--------|
| engine.ts | ≤200L | 199L → ≤200L (B-25 split sdkSpawn 后) | T4.2 wc -l ≤ 200 | OK split 已计划 |
| agentDefinition.ts | ≤200L (H3 errata cap) | 191L 不动 (B-24 split to sdkReconcile.ts) | T2.1 + 本 phase 不 modify 主体 | OK split 已计划 |
| systemPrompt.ts | ≤80L | 53L → ~78L (T2.3 +25L) | T2.3 wc -l ≤ 80 (B-27) | OK |
| ralphLoop.ts | ≤50L 主体 (D1.4-3) | 42L → ~48L (T2.4) | T2.4 wc -l ≤ 50 (B-26) | OK |
| promiseExtract.ts | ≤50L | 32L 不动 | (no modify task) | OK |

**5/5 hard limit 守住,2 split (B-24 + B-25) 已 plan。**

**New file size targets:**
- sdkReconcile.ts ≤80L (T2.1)
- completionSchema.ts ≤35L (T2.2)
- sdkSpawn.ts ≤120L (T4.1)
- phases.ts ≤100L (T3.1)
- loadPhases.ts ≤60L (T3.2)
- execute-task.ts ≤130L (T5.1 — 略超 research.ts 93L,因 4-phase chain orchestration 复杂)

**No hard-limit miss。** Karpathy simplicity compliance OK。

---

## § 10 Cross-phase consistency

| Boundary | Phase | Verify |
|----------|-------|--------|
| design/content/testing extension MVP | 2.3 (NOT 2.2) | KICKOFF § 1.3 + PLAN § 8 boundary table |
| doctor 完整版 + audit + ralph-loop Win 全兼容 | 2.4 (NOT 2.2) | 同上 + R6 mitigation |
| checkpoint 完整版 (harnessed resume) | v0.3.0 P3.1 (NOT 2.2) | 同上 |
| bundle-routing / extension category | 2.3 (Phase 2.1 D2.1-3 推后) | KICKOFF § 1.3 Out of Scope |
| karpathy-skills behavior-rule + CLAUDE.md merge | 2.3 (NOT 2.2 — B-28 forward-looking) | T5.3 SKILL.md note |
| 动态 model routing (signal→rules→scorer) | v0.3+ (NOT 2.2 — static 跑通后) | KICKOFF § 1.3 + B-08 + B-12 zero new engine |
| ralph-loop Win 全兼容 vs partial | 2.2 partial (R5.3) + 2.4 全 | R6 + PLAN § 7 W4 checkpoint fall-back |

**No contradiction with shipped v0.1.0 / v0.2.0 state:**
- v0.1.0 routing engine v1 + 6 installer + transparency infra 全沿用,不 break
- Phase 2.1 ship 的 6 install method dispatch + transparency CHECKLIST + Wave 0 infra 全是本 phase upgrade base
- promise COMPLETE XML wrapper 协议保留 (systemPrompt + promiseExtract 不动 verbatim contract,B-27 守 53→78L 仅 append schema 段)
- ADR 0001-0010 main body 0 diff (B-22 + T6.3 verify)

**Cross-phase consistency clean。**

---

## § 11 Findings

### Blockers (must fix before execute-phase)

**None.**

### Warnings (should fix)

**W1 — placeholder sed-replace operational gap**
- **Location:** PLAN.md frontmatter files_modified 列 ADR 文件名含字面 placeholder + task_plan 全文 ~30+ 字面 placeholder + ADR source code fence 注释含同款 placeholder
- **Issue:** Anti-pattern guard (intel § 0 + Phase 2.1 T1.9 CONTRIBUTING) 正确遵守 (不预占 0011)。但 execute-phase T0.1 resolve 编号后,后续 30+ task action 含字面 placeholder string,需要 token-replace。
- **Risk:** Low-Medium — 若 executor 忘 sed-replace → ADR 文件名字面写 placeholder (非法文件名) or source 含字面字符串 (grep 异常)
- **Fix hint:** task_plan 顶部 Resolved (T0.1) block 后加 1 行 warning ALL subsequent placeholder occurrences must be sed-replaced after T0.1 resolution before any commit。或考虑用 shell variable convention 让 executor 一目了然。
- **Repair cost:** ~5 min add 1 warning line in W0 opening

**W2 — 三层 fallback orchestration 术语漂移**
- **Location:** task_plan T4.2 action step 3-5
- **Issue:** Step 3 写 替换 L80-84 defaultSpawn placeholder fn → 新 defaultSpawn(def, opts) → sdkSpawn(def, opts)。But step 4 写 保留 三层 fallback orchestration (opts.spawn injection seam → defaultSpawn → real SDK)。三层 fallback 究竟是 (L1 opts.spawn → L2 fn-level defaultSpawn → L3 SDK call) 还是 (L1 opts.spawn → L2 internal lookup → L3 throw)?engine.ts L80-84 现状仅 defaultSpawn 单层 placeholder + opts.spawn injection seam (L1+L2 共 2 层)。术语漂移。
- **Risk:** Low — 实装时 executor 看 engine.ts 实际只 1 个 spawn seam 自然懂,但 sister review 觉得 unspecified。
- **Fix hint:** T4.2 action 加 1 行 explicit articulate 三层 含义:L1 = opts.spawn injection (caller);L2 = defaultSpawn (engine internal,接 sdkSpawn);L3 = SDK query() (sdkSpawn 内部)。或简化为 2 层 fallback (L1 injection seam + L2 SDK)。
- **Repair cost:** ~3 min in T4.2 action

**W3 — F2 reproduction command regex 章节标题不一致 (实测会 false-fail)**
- **Location:** PLAN.md § 6 F2 reproduction command 用 grep -E ^## (SDK 引入|...) wc -l == 6
- **Issue:** ADR T0.2 / T6.1 章节用 ### 1. SDK 引入 (heading level 3 + 编号);PLAN F2 reproduction 写 ^## (heading level 2,no 编号)。**章节 heading level + 编号 prefix mismatch** → F2 reproduction 会 grep 命中 0 而非 6 → F2 false-fail。
- **Risk:** Medium — ship 时跑 F2 reproduction 必 fail。
- **Fix hint:** PLAN.md § 6 F2 row 改 ^## → ^### [1-6]\. 与 T0.2 / T6.1 实际 form 一致 (task_plan T0.2 acceptance 已用正确 form)。
- **Repair cost:** ~1 min edit PLAN.md § 6 F2 row

**W4 — --model-tier inherit semantics underspec**
- **Location:** task_plan T5.1 code block model: raw.modelTier === inherit ? undefined : raw.model
- **Issue:** B-10 spec --model-tier inherit 不读 phase.model,继承调用方 model。Code 写 undefined 表不强制 model。但 继承调用方 model 是 SDK 默认 model 还是 process env / parent agent model?inherit 的 fallback 路径 underspec。task_plan T5.1 仅写 code,not articulate inherit 时 SDK 用什么 model。
- **Risk:** Low — SDK 默认 model 是 documented fallback (no model field → SDK use main agent model);executor 看 SDK doc 自然懂。但 spec articulation 缺。
- **Fix hint:** T5.1 加 1 行 comment inherit: do not pass model field → SDK uses parent agent model;或在 SKILL.md / ADR § 5 注明 inherit semantics: omit model field → SDK propagates parent invocation model。
- **Repair cost:** ~3 min add 1 comment

### Suggestions (advisory)

**S1 — engine.ts 199L → ≤200L 临界 1L safety margin**
- **Location:** task_plan T4.2
- **Issue:** engine.ts 199L,加 import + sdkSpawn call + 三层 fallback orchestration 改动估算 +1L 紧贴 200 hard limit。
- **Suggestion:** T4.2 内 proactively split orchestration helper 到 lib/engineOrchestration.ts (B-25 已 prefer 这条路径,plan 仅 conditional) — 改为 unconditional split,engine.ts target ≤185L。
- **Repair cost:** ~10 min plan + ~20 min execute extra split

**S2 — spike script rm step 后未防 future re-pollute**
- **Location:** task_plan T1.2 acceptance
- **Issue:** spike script throwaway (B-06)。若忘 rm 后 commit history 会含 spike artifact 污染 repo。
- **Suggestion:** 加 explicit pre-commit check:T1.2 末 step 5 run git status verify spike not staged + add scripts/spike-*.mjs to .gitignore permanent block。
- **Repair cost:** ~5 min add .gitignore line + verify

**S3 — mcpServers field inject 仅 name 不含 config**
- **Location:** task_plan T2.1 injectFactoryInternalFields 函数
- **Issue:** 仅 inject MCP server names 不含 config (URL/auth)。If subagent needs runtime MCP,name-only prompt 不够。但 Phase 2.2 scope mcpServers 可能尚未真用 — name-only 是 minimum-viable。
- **Suggestion:** ADR § 4 (contract v1.2 reconcile 章节) 注明 mcpServers field prompt-inject is name-only (Phase 2.2 minimum-viable);real MCP config wiring 推 Phase 2.3+ if MCP-using agent emerges。
- **Repair cost:** ~5 min add comment

**S4 — lib/skillInstall.ts (Phase 2.1 ship) 复用 verification 缺**
- **Location:** PATTERNS § 4 列 lib/skillInstall.ts Phase 2.1 ship,但 task_plan 无 task 显式 verify execute-task install adapter 真复用此 helper (D1.4-4 pattern)
- **Issue:** Phase 2.2 execute-task workflow harnessed install 调用链应复用 Phase 2.1 6 installer dispatch + skillInstall helper。但 task_plan 中 T5.x 全聚焦 execute-task CLI 主流程,无 task verify dispatch table 复用。
- **Suggestion:** T5.5 acceptance 加 1 个 integration test case execute-task workflow dry-run includes installer dispatch step (mock installer reuse from Phase 2.1)。
- **Repair cost:** ~10 min add 1 test case

**S5 — RETROSPECTIVE.md 续编 task (T6.4) 内容质量 underspec**
- **Location:** task_plan T6.4 action
- **Issue:** 5 dimension 列 + acceptance grep 仅验 heading exist,not 内容质量。
- **Suggestion:** T6.4 acceptance 加 1 行 each of 5 dimensions has ≥3 bullet points;或简化 沿袭 phase 1.5 / 2.1 RETROSPECTIVE bullet density。
- **Repair cost:** ~3 min add 1 acceptance line


---

## § 12 Final verdict

**APPROVED WITH CONDITIONS (0 BLOCKER / 4 WARNING / 5 SUGGESTION) — 2026-05-15**

**评分维度:**
- F1-F8 achievability: 8/8 HIGH
- Dependency topology: clean (no cycle / no forward-ref / Wave 0 真 block)
- Risk mitigation: 6/6 covered (R1-R6)
- Actionability: 5/5 spot check PASS (concrete + grep-verifiable)
- Decision trace: 31 B-XX lock 全消化,5 conflict resolved,zero unresolved
- Test coverage: ~26 unit/integration + 30 sample = ~56 verifications,4-layer dual-signal 每 layer 1 test
- 2.3/2.4 prereq: 6/6 task-covered + actionable
- A7 守恒: 7/7 PASS
- Karpathy 5 hard limit: 5/5 守 (2 split B-24/B-25 已 plan)
- Cross-phase consistency: clean,no shipped state contradiction

**Known watch-items 验证 (per user prompt):**

1. **ADR 编号不预占** OK — T0.1 ls docs/adr/ + max(NNNN)+1 实占;placeholder 全文使用,zero explicit ADR 0011 字面字符串 (W1 警告是 token-replace operational note,not 预占违规)。
2. **dual-signal 4-layer** OK — RESEARCH D2.2-4 + B-02 + task_plan T2.4 isComplete 显式 4 path 实装 + T2.5 4 test case 每 layer 1 个 + PATTERNS § 2.4 spec。outer PRIMARY/FALLBACK + inner PRIMARY/FALLBACK 4 row 表 RESEARCH § 1.3 清晰区分 main-agent vs subagent layer。
3. **transparency 全 13 verdict docs 手工迁移** OK — B-15 + RESEARCH D2.2-2 + task_plan T0.3 manual 1-by-1。**未发现任何 batch migrate script 引用** (PATTERNS § 1 row 8 候选 analog scripts/migrate-add-transparency-markers.mjs 在 ASSUMPTIONS B-15 完全 lock 为 manual 否决 batch,task_plan T0.3 1:1 体现 manual flow,RESEARCH § 2.2 三候选评估倾向 manual 一致)。
4. **Wave 0 必最先** OK — B-19 强制 + task_plan W0 在 W1 前 + T0.6/T0.7 acceptance CI green sentinel + R4 mitigation full。W1+ task 不含 gate bypass。

**Plan 质量评估:** 
- 33 atomic task 全有 file path + action concrete value + read_first + acceptance grep-verifiable + decision_source citation — sister phase 1.5 / 2.1 task_plan 模式一致
- 4 warning 全是 operational polish,非 architectural blocker
- 5 suggestion 全是 advisory,非 ship-blocker

**Sister review tier:** 沿袭 phase 1.5 H1+M1 / 2.1 H1+H2 pattern,本 phase 预期 ship 后 sister review 1 tier (0 BLOCKER / 1-2 WARNING) 是 healthy outcome。

---

## § 13 Recommended next step

**APPROVED WITH CONDITIONS → execute-phase 启动可进行,建议先 fix 2 个 medium-impact warning:**

1. **PRIORITY 1 (1 min fix):** PLAN.md § 6 F2 reproduction command 改 ^## → ^### [1-6]\. 与 T0.2 / T6.1 章节 heading 实际 form 一致 (W3) — 否则 F8 ship 时 F2 reproduction false-fail。
2. **PRIORITY 2 (5 min fix):** task_plan 顶部 Resolved block 后加 1 行 ALL subsequent placeholder occurrences must be sed-replaced after T0.1 resolution before any commit + W0 opening 注明 token-replace convention (W1) — 防 executor 漏 sed-replace 后 commit 含字面 placeholder ADR file。

完成上 2 处 fix (总 ~6 min) 后,execute-phase 可启动:

- **Wave 0 first** (T0.1~T0.7, ~2 工作日) — transparency 一次性根治 + ADR draft + ENFORCE=true atomic flip
- **Wave 1 GO/NO-GO** (T1.1~T1.4, ~1 工作日) — SDK spike pass on Win + Tier A degraded fallback verified
- **Wave 2 + Wave 3 parallel** (~3 工作日) — contract v1.2 + dual-signal 4-layer + per-phase model tier schema
- **Wave 4 + Wave 5** (~4 工作日) — ralph-loop full integration + execute-task CLI + 30 sample
- **Wave 6 ship** (~1 工作日) — ADR Accepted + baseline tag + v0.2.0-alpha.2-execute-task tag

Total estimated execute-phase: **~11 工作日** (PLAN.md § 5 一致)。

**No ship-blocker.** Phase 2.2 plan-phase Wave C check PASSED with conditional polish recommended.

---

*Phase 2.2 PLAN-CHECK complete — 13 sections / 0 BLOCKER / 4 WARNING / 5 SUGGESTION / final verdict APPROVED WITH CONDITIONS / next step execute-phase ready after 2 priority warning fixes (~6 min).*
