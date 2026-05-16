# Phase 2.4 — PLAN-CHECK

> **Verdict:** APPROVED WITH CONDITIONS (2 BLOCKER / 6 WARNING / 5 SUGGESTION, miss: none) — 2026-05-16
> **Checker**: gsd-plan-checker (Claude Opus 4.7, 1M ctx)
> **Files audited**: KICKOFF (222L) / 2.4-CONTEXT (280L) / 2.4-DISCUSSION-LOG (116L) / PATTERNS (492L) / RESEARCH (848L) / ASSUMPTIONS (204L) / PLAN (440L) / task_plan (1137L) — 8 files, ~3739L total
> **Scope**: goal-backward verification — F1-F8 + 4 D-decisions + 43 B-locks + 5 D-WP + 20 D2.4-* + Karpathy MIN + A7 + SSOT + v0.2.0 4/4 close
> **Sister cadence**: 沿袭 Phase 2.3 PLAN-CHECK 13-section structure

---

## Summary

Phase 2.4 plan-phase 全产物 (8 files / 7 Waves / 29 atomic tasks / 43 B-locks) goal-backward 审计:
- **2 BLOCKER**: B1 README counter pre-flight 现状 SHIPPED=4 / BARS=3 / L44=3 三者不一致 (T0.3 push CI 必 red); B2 PLAN frontmatter R2.4.1~R2.4.7 七 ID 全不存在于 .planning/REQUIREMENTS.md (实测仅 R2.4 audit log 单 ID, scope v0.4)
- **6 WARNING**: W1 tests/installers/ + tests/scripts/ 目录不存 plan 未含 mkdir; W2 PATTERNS § 2.6 import 字面 ccHookInstaller.js 与 B-20 lock ccHookAdd.ts 不一致残留; W3 doctor.ts ≤215L reactive split vs proactive (沿袭 Phase 2.3 W4 sister); W4 task_plan 顶部无 Resolved 区设 (T0.1/T2.0/T3.4 三 fill 块无栖); W5 dashboard.mjs L11 zero-dep promise 未显式 reconcile; W6 T2.2 scoreSourceRefs regex 不分行界 fragility
- **5 SUGGESTION**: SSE reconnect 期 event 补偿 / uninstall 4 step 详细 / v0.2.0 fallback decision tree / phase-2.2 task_plan path verify / F8 + R12 fallback acceptance reconcile

**Plan 内核质量**: 43 B-lock 全消化 5 来源 (CONTEXT 4 + RESEARCH 20 + PATTERNS 5 + STATE backlog 5 + planner inference 9) 0 unresolved conflict; F1-F8 全 HIGH achievability; A7 守恒 verify T6.2 显式; Karpathy MIN scope 严守; 6 R2 critical finding 全 absorb; intel L74-82 + L286 + dashboard-handoff § 3 + § 0 SSOT 引用纪律 全 trace.

**Blocker root causes**:
- **B1** README counter: 实测 `grep -cE "Phase 2\.[0-9]+ shipped" README.md` = 4 (Phase 2.3+2.2+2.1+1.5 4 行 ship marker, 但 L44 enumeration "Phase 2.1+2.2+2.3/2.4 = 3/4 完成" 行内额外命中); plan T0.3 pre-flight wording 写 "实际值是 3+3+3/4" 假设错误
- **B2** R2.4.* IDs: REQUIREMENTS.md L341 仅 `R2.4 audit log` 单 ID, R2.4.1~R2.4.7 七细分 ID 全 stale; plan-checker 自检 `file_references_verified` 维度自反 BLOCKER

**Recommendation**: 2 BLOCKER fix (~45 min) + 6 WARNING fix (~25 min) 后 execute-phase ready.

---

## 10 Verification Dimensions

### Check 1 — F1-F8 bar mapping → tasks + reproduction + B-lock

| Bar | Wave | Tasks | B-lock | Status |
|-----|------|-------|--------|--------|
| F1 (Wave 0 5 项根治 + ADR draft) | W0 | T0.1~T0.6 (6 task) | B-32~B-37 | PASS |
| F2 (doctor 5 check MIN) | W1 | T1.1~T1.3 (3 task) | B-01~B-07 | PASS |
| F3 (EE-4 plan-checker quant + manual rerun) | W2 | T2.0~T2.4 (5 task) | B-08~B-15 | PASS |
| F4 (dashboard C 路径 3 子 + cc-hook installer) | W3 | T3.1~T3.4 (4 task) | B-18~B-27 | PASS |
| F5 (audit 完整版扩 + Win sentinel) | W4 | T4.1~T4.3 (3 task) | B-28~B-30 | PASS |
| F6 (30 doctor + 30 plan-checker + e2e) | W5 | T5.1~T5.3 (3 task) | B-31 | PASS |
| F7 (A7 守恒 + ADR errata 9 章节) | W6 | T6.1~T6.2 (2 task) | B-35~B-37 | PASS |
| F8 (ship + v0.2.0 4/4 close milestone) | W6 | T6.3~T6.5 (3 task) | B-42~B-43 | PASS (R12 + S5) |

**8/8 acceptance bars 全 HIGH achievability**; 每 bar ≥1:1 trace 到 task + reproduction command grep-verifiable + B-lock cite.

### Check 2 — 4 D-decisions → B-lock trace

| D | Decision | B-lock | Status |
|---|----------|--------|--------|
| D-01 doctor MIN 5 check | B-01~B-07 | OK |
| D-02 EE-4 ABSORB-2.4 | B-08~B-15 | OK |
| D-03 README B 路径 CI counter gate | B-16~B-17 | OK |
| D-04 dashboard C 路径 FULL absorb | B-18~B-27 | OK |

**4/4 D-decisions 全 trace.**

### Check 3 — 20 D2.4-* RESEARCH locks → B-lock 吸收

D2.4-1~D2.4-20 全 absorbed (见 ASSUMPTIONS § B mapping); 6 R2 critical finding 全 RESOLVED (B.10 conflict resolution chain). **20/20 PASS.**

### Check 4 — 5 D-WP-* PATTERNS proposals → resolution

| D-WP | B-lock 选 | Status |
|------|----------|--------|
| D-WP-1 dashboard.mjs split → (a) 单文件 + (c) T3.4 fallback | B-26 + B-39 | RESOLVED |
| D-WP-2 plan-review-schema → (a) yaml-only | B-10 | RESOLVED |
| D-WP-3 doctor.ts → (a) 维持 single-file | B-03 | RESOLVED (subject to W3) |
| D-WP-4 cc-hook naming → (b) cc-hook-add | B-20 | RESOLVED (subject to W2) |
| D-WP-5 WebSocket → (c) SSE | B-23 | RESOLVED |

**5/5 D-WP 全 resolved.** W2 surface PATTERNS § 2.6 sed-replace 漏改 (D-WP-4 RESEARCH winner ccHookAdd 但 PATTERNS body 残留 ccHookInstaller import 字面).

### Check 5 — 29 atomic tasks coherence (spot check)

| Task | Files concrete? | Action 含具体值? | Acceptance grep-verifiable? | decision_source 引? |
|------|----------------|------------------|------------------------------|---------------------|
| T0.1 ADR 编号实占 + sed-replace | OK | OK (5 step + literal sed) | OK (3 grep) | B-36 |
| T0.3 README counter gate | OK | OK (~15L yaml + pre-flight) | OK (grep + local verify) | B-16+B-17+R10 |
| T0.4 schemaVersion long-tail | OK | OK (1 行 import + consumer) | OK (grep wc ≥1) | B-33 |
| T1.2 doctor.ts MODIFY | OK | OK (4 step + ~30L excerpt) | OK (6 grep + wc ≤215) | B-02~B-07 |
| T2.2 run-plan-checker.mjs | OK | OK (~80L excerpt) | OK (4 grep + ENFORCE) | B-11+B-14 |
| T3.1 cc-hook installer 7 file | OK | OK (full excerpt + literal cmd) | OK (10 grep + 3 enum) | B-20~B-22+R9 |
| T4.3 ralph-loop Win sentinel | OK | OK (5 fixture + 10L yaml) | OK (5 fixture grep + Win-only) | B-30+D2.4-18 |

**7/7 actionability spot check PASS.** 29 atomic task 全有 file path + action concrete + read_first + acceptance + decision_source (沿袭 Phase 2.3 task_plan 模式).

### Check 6 — Hard limits enforcement

15/16 PASS (subject to W3 reactive vs proactive doctor.ts split). doctor.ts ~210L (5% 超 ≤200L 容忍 per B-03); audit.ts split helper ≤50L 默认 ship; dashboard.mjs ≤700L soft cap (dev tool 不计 hard limit, T3.4 split fallback if >650L); 其余全 under hard limit (origin-check ≤80L / ccHookAdd ≤100L / run-plan-checker ≤100L / plan-review-schema ≤60L / installMethods/ccHookAdd ≤40L / dashboard-autospawn fixture ≤40L / ralph-loop-win-sentinel test ≤80L). engine.ts / agentDefinition.ts / systemPrompt.ts / ralphLoop.ts / promiseExtract.ts 5 Karpathy 主体 hard limit 不动.

### Check 7 — A7 守恒

9/9 PASS: ADR 编号 plan-phase 实占 (T0.1) + sed-replace discipline (zero `<实占` 残留) + ADR 0001-0012 main body 0 diff verify (T6.2 git diff wc == 0) + baseline tag iter 1-12 → 1-N (T6.2 + T6.4) + ci.yml A7 step iter 同步 (T6.2 explicit MODIFY) + AGENT-DEFINITION-FACTORY-CONTRACT.md / INSTALLER-CONTRACT.md 不动 + Phase 2.3 decisionRules.ts arbitrate legacy 保留 + 3-OS CI A7 全绿 verify. 现 ci.yml L56-81 实测 iter 1-12 范围已存 (Phase 2.3 ship), T6.2 扩 1-N 实占.

### Check 8 — SSOT 引用纪律

8/8 PASS: ADR 编号绝不预占 (intel § 0 + CONTRIBUTING.md 项目级 anchor) + sed-replace discipline (沿袭 Phase 2.1 W1 + Phase 2.3 T0.1 plan-check fix) + Phase 编号语义锚定 (KICKOFF § 6 + PLAN § 8) + intel L74-82 + L286 引用一致 + dashboard-handoff § 3 ~160L 全 absorb + ROADMAP L113-115 引用 + STATE.md L601+ Phase 2.4 Prereq 5 项全 trace + 现 docs/adr/ ls 实测 0009-0012 4 ADR, T0.1 max+1 = 0013 但不预占 (sed-replace `0013` placeholder 全文).

### Check 9 — 7 Wave coverage + dependency graph + 29 task count

Task count: W0=6 + W1=3 + W2=5 + W3=4 + W4=3 + W5=3 + W6=5 = **29** (一致 PLAN § 3); Wave 拓扑 clean (W0 真 block W1+ via README + ADR + schemaVersion; W1 + W2 并行 file scope 不重叠; W3 3 sub-task 并行 + merge 顺序 T3.2 先 T3.3 rebase per B-19; W3 depends on W1 via doctor sister cluster; W4 depends on W1 via origin-check helper sister-share per B-05+B-28; W5 depends on W1-W4 全; W6 ship 最后). No cycle / no forward-ref.

### Check 10 — Wave B 6 open issues resolution

详 § 6 Open Issues Resolution.


---

## 6 Open Issues Resolution

### O-PC1 — T2.0 spike outcome pending execute-phase

- **Status**: ACTIVE (Wave 2 executor 必 fill Resolved block before T2.1 ship)
- **Evidence**: task_plan T2.0 action step 4 + acceptance "task_plan 顶部 Resolved block" — 但 task_plan 当前**无** Resolved 区设. Wave 2 plan-checker (execute-phase 内 self-check) 必 verify Resolved block fill 后才 ship T2.1.
- **Recommendation**: W4 mitigation — task_plan 顶部加 Resolved 区设 skeleton (3 placeholder T0.1/T2.0/T3.4) executor fill in-place + commit. 沿袭 Phase 2.3 T0.10 spike-then-ship 先例.
- **Severity**: WARNING (sequencing visibility)

### O-PC2 — T3.4 conditional ship pending wc count (split fallback gate visibility)

- **Status**: RESOLVED (per B-26 + B-39 + R5 + D-WP-1 (c))
- **Evidence**: T3.4 explicit mid-wave gate `if wc > 650 then split else SKIP + Resolved block`; PLAN § 7 Wave Acceptance Checkpoint table row 3 含 T3.4 fallback rule; dashboard.mjs 现 505L + ~130L = ~635L 预期 SKIP path.
- **Severity**: PASS

### O-PC3 — R12 v0.2.0 tag pre-flight check (T6.4 first step `git tag --list v0.2.0` fallback `v0.2.0-final`)

- **Status**: RESOLVED via R12 mitigation
- **Evidence**: T6.4 action step 1 explicit pre-flight + R12 mitigation LOW. 实测 `git tag --list 'v0.2.0*'` = 3 alpha tag (alpha.1-installers / alpha.2-execute-task / alpha.3-extension-mvp), v0.2.0 大里程碑 tag **不存** → proceed create path 可走 (不踩 fallback).
- **Severity**: PASS (R12 mitigation 完备)

### O-PC4 — ADR errata 9 章节 sketch vs final fill split (T0.2 sketch + T6.1 finalize)

- **Status**: RESOLVED via T0.2 sketch + T6.1 finalize
- **Evidence**: T0.2 action 含 9 章节 sketch 完整 (`### 1. doctor 5 check MIN ... ### 9. Wave 0 backlog`); T6.1 详细 fill 每章节 (B-01~B-43 lock 全 cite); acceptance `grep -E "^### [1-9]\. " | wc -l == 9` 双 task 一致. 沿袭 Phase 2.3 ADR 0012 9 章节 fill 模式.
- **Severity**: PASS

### O-PC5 — B-33 schemaVersion long-tail land 1 consumer 不 bump grep gate ≥2 (T0.5 acceptance stays ≥2 honest baseline)

- **Status**: RESOLVED (honest baseline 沿袭 Phase 2.3 B-29 sister precedent)
- **Evidence**: B-33 + T0.4 action step 3 注 "Phase 2.3 W0 T0.5 grep ≥2 仍 honest baseline (这 1 加未达 bump threshold)"; 现 grep 实测 `branchOnSchemaVersion` 命中 2 (helper definition + 1 self-reference), Phase 2.4 T0.4 加 1 consumer → 3 命中 ≥2 仍 PASS.
- **Severity**: PASS

### O-PC6 — Win sentinel subagent-spawn fixture mock complexity (T4.3 fixture 4 mock subagent not real CC SDK; ANTHROPIC_API_KEY OOS)

- **Status**: RESOLVED via B-30 + O5 explicit mock anchor + R13 mitigation
- **Evidence**: B-30 + task_plan T4.3 action step 1 fixture 4 explicit "mock subagent per B-30 + O5 (real CC SDK 需 ANTHROPIC_API_KEY OOS)" + R13 mitigation "Phase 2.4 MIN: mock; v0.3.0 prep T1.1 real SDK 升级".
- **Severity**: PASS


---

## Findings

### BLOCKER (must fix before execute-phase)

**B1 — README counter pre-flight 现状三计数不一致 (SHIPPED=4, BARS=3, L44=3) → T0.3 Wave 0 push CI 必 red**

- **Location**: task_plan T0.3 + PLAN F1 reproduction + 现 README.md
- **Issue**: 实测 grep -cE Phase shipped marker = 4 (Phase 2.1/2.2/2.3 三 ship marker + L44 enumeration 行); grep -cE Acceptance bar = 3; sed L44 cut = 3. T0.3 pre-flight wording 假设 3+3+3/4 错误.
- **Root cause**: regex Phase 2\.[0-9]+ shipped 边界不严格 — L44 行内 Phase 2.X 多次出现 与 ship marker 行同 regex 命中.
- **Fix hint**:
  1. (推荐 a) T0.3 action step 0 加 README pre-flight FIX + grep regex 精度提升 line-start + bold 排除 enumeration line
  2. (alt b) T0.3 local pre-flight 必先 fix README drift 再 push CI
  3. (alt c) README 模板修, BARS ≥ SHIPPED 等价约束
- **Repair cost**: ~30 min Wave 0 T0.3 plan rewrite + local README pre-flight fix

**B2 — PLAN.md frontmatter requirements 引用 R2.4.1~R2.4.7 七 ID 全不存在于 .planning/REQUIREMENTS.md**

- **Location**: PLAN.md L46-52 frontmatter requirements block
- **Issue**: PLAN 引 7 个 R2.4.* 细分 ID (R2.4.1 doctor / R2.4.2 audit / R2.4.3 ralph-loop Win / R2.4.4 EE-4 / R2.4.5 dashboard / R2.4.6 README / R2.4.7 Wave 0), 但 REQUIREMENTS.md L341 实测仅 R2.4 audit log 单 ID 且 scope v0.4 Pending. 影响:
  1. scripts/run-plan-checker.mjs (T2.2 ship) 自检 Phase 2.4 PLAN 时 file_references_verified + reference_sources_real 维度自反 BLOCKER (引 ID 不存在 = stale ref)
  2. ROADMAP L113-115 描述性 prose 不是细分 ID — PLAN 应引 anchor OR 单 R2.4 ID OR REQUIREMENTS expand 7 sub-ID
- **Fix hint**:
  1. (推荐 a) Wave 0 T0.5 加 step REQUIREMENTS.md Phase 2.4 行下 expand R2.4.1~R2.4.7 (沿袭 R6.1-R6.5 + R7.1-R7.6 expand 模式)
  2. (alt b) PLAN frontmatter 改引 ROADMAP L113-115 anchor only
  3. (alt c) PLAN frontmatter 全删 R2.4.* + 改写引 D-01~D-04 + F1-F8
- **Repair cost**: ~10 min Wave 0 T0.5 plan rewrite + REQUIREMENTS.md expand

### WARNING (should fix)

**W1 — tests/installers/ + tests/scripts/ 目录不存在, plan 未含 mkdir step**

- **Location**: task_plan T3.1 + T3.2 + T3.3 (files_modified 含 tests/installers/ + tests/scripts/ NEW files)
- **Issue**: 实测 ls tests/installers/ + ls tests/scripts/ 均 No such file or directory. 现 tests/ 仅 cli/ integration/ routing/ 子目录. Wave 3 executor 必 mkdir 否则 vitest 写 NEW test file fail.
- **Fix hint**: T3.1 + T3.2 + T3.3 action step 0 加 mkdir -p tests/installers tests/scripts
- **Repair cost**: ~3 min

**W2 — PATTERNS.md § 2.6 import 字面 ./ccHookInstaller.js 与 B-20 lock ccHookAdd.ts 不一致 (sed-replace 漏改)**

- **Location**: PATTERNS.md § 2.6 L213-214 import 行 + dispatch entry
- **Issue**: B-20 lock + task_plan T3.1 全 ccHookAdd.ts + installCcHookAdd + cc-hook-add method (sister mcpStdioAdd / mcpHttpAdd -add verb 模式). PATTERNS sed-replace 漏改, Wave 3 executor copy PATTERNS § 2.6 import 行会引文件不存 import error.
- **Fix hint**: PATTERNS.md sed-replace ccHookInstaller → ccHookAdd + installCcHook → installCcHookAdd + cc-hook key → cc-hook-add (同步 § 1 row 6+7+8 + § 2.6 全 cleanup)
- **Repair cost**: ~5 min

**W3 — T1.2 doctor.ts ≤215L reactive split, 应 proactive split 沿袭 Phase 2.3 W4 sister precedent**

- **Location**: task_plan T1.2 acceptance + B-03 + R1 mitigation
- **Issue**: doctor.ts 现 152L + ~55-65L → ~210L 紧贴 ≤215L 容忍上限. R1 fallback split reactive 决策在 executor 端. 沿袭 Phase 2.3 W4 decisionRules.ts + Phase 2.2 sdkReconcile.ts proactive split 先例, 推 proactive split 抽 status enum 进 src/cli/lib/check-result.ts (~20L) + doctor.ts ~180L 主体不动.
- **Fix hint**: T1.2 action 加 proactive split step (RESEARCH D2.4-1 已 anchor proactive split path 推 plan-phase 容忍 OR 抽 src/cli/lib/check-helpers.ts)
- **Repair cost**: ~5 min plan rewrite

**W4 — task_plan 顶部无 Resolved 区设, T0.1 + T2.0 + T3.4 三 Resolved block 无栖**

- **Location**: task_plan T0.1 + T2.0 + T3.4 acceptance 全引 task_plan 顶部 Resolved block
- **Issue**: task_plan.md 当前无 Resolved 区设. 3 task fill block 但 plan 未 set up 区设. 沿袭 Phase 2.3 T0.10 always_active spike Resolved 模式 (实测 Phase 2.3 task_plan 有 Resolved 区). Wave 0/2/3 executor fill 无栖.
- **Fix hint**: task_plan.md 顶部 (L10 placeholder discipline warning 后) proactive 加 ## Resolved Blocks (executor fill in-place) skeleton + 3 placeholder
- **Repair cost**: ~3 min

**W5 — dashboard.mjs L11 Zero external deps 注释未在 plan 显式 reconcile SSE 改造维持 zero-dep promise**

- **Location**: scripts/dashboard.mjs L11 + B-23 SSE lock + task_plan T3.2
- **Issue**: Phase 2.2 ship 立项原则 Zero external deps (only node built-ins). SSE (text/event-stream HTTP 内建 + node fs.watch + node:os) 完美维持 zero-dep 但 task_plan T3.2 未在 sub-step 显式 reconcile — Wave 3 executor 若 mistakenly import ws 破 promise.
- **Fix hint**: T3.2 action step 0 加 维持 dashboard.mjs L11 zero-dep promise anchor + grep gate negate import.*from ws Wave 3 pre-commit verify
- **Repair cost**: ~3 min

**W6 — T2.2 walker scoreSourceRefs regex decision_source see ref 不分行界 fragility**

- **Location**: task_plan T2.2 code excerpt L435-438 + T2.0 baseline spike pseudocode
- **Issue**: regex 仅 capture 同行 .md path. Phase 2.3 + 2.2 task_plan 实存 multi-line decision_source 块 (e.g. - **decision_source**: B-32 + KICKOFF § 3) — multi-line + 非 .md 后缀. T2.0 baseline spike grep refs 命中数极少 → score 0/0 = 1.0 (RESEARCH § 2.2.2 edge case) → false-pass reference_sources_real 维度.
- **Fix hint**: T2.2 regex 扩 multi-line + 加 B-NN / Phase X.Y 引用 anchor pattern; OR T2.0 spike outcome template explicit 显示 ref count 验是否 false-pass
- **Repair cost**: ~5 min

### SUGGESTION (advisory)

**S1 — dashboard.mjs SSE reconnect 期 state-changed event 丢失补偿 path 未 anchor**

- **Location**: task_plan T3.2 + RESEARCH § 3.2.2
- **Issue**: SSE EventSource 内建 reconnect, 但 reconnect 期 STATE.md 若变 client 错过 event. RESEARCH 未 anchor Last-Event-ID replay buffer OR client-side reconnect 后 force re-fetch.
- **Suggestion**: T3.2 加 reconnect 后 loadPage(currentPage) re-fetch 强制 refresh
- **Repair cost**: ~5 min

**S2 — T3.1 cc-hook installer uninstall 主体 ~20L 注释 symmetric 留 executor 实占**

- **Location**: task_plan T3.1 L629 uninstallCcHookAdd skeleton
- **Issue**: sister 6 installer uninstall pattern 各异 (npxSkillInstaller reverse + provenance 撤销, mcpStdioAdd spawn claude mcp remove). cc-hook uninstall 是 JSON deep-delete + idempotent + backup + verify, 不精确 sister. Wave 3 executor 实占可能漏 step.
- **Suggestion**: T3.1 action 加 uninstall 4 step 详细 (find hooks block by hook_command match → splice → backup → write → re-verify removed)
- **Repair cost**: ~10 min

**S3 — T6.4 v0.2.0 tag fallback decision tree 未引证 Phase 1.5 sister 模板**

- **Location**: task_plan T6.4 + R12 mitigation
- **Issue**: R12 fallback v0.2.0-final 命名未 verify Phase 1.5 v0.1.0 close sister 走过 fallback path (实测 v0.1.0 大 tag 存 — sister 模板成功 proceed create, 未踩 fallback).
- **Suggestion**: T6.4 加 fallback decision tree explicit (-d + re-push vs final suffix; planner 决)
- **Repair cost**: ~3 min

**S4 — T2.0 spike phase-2.2 task_plan.md 路径未存验证 (multi-plan-NN 模式风险)**

- **Location**: task_plan T2.0 action step 2 read_first
- **Issue**: 不确定 phase-2.2 是单 task_plan.md 还是 multi-plan 模式. T2.0 spike 应 verify file 存在 + 多 plan 处理.
- **Suggestion**: T2.0 action step 1.5 ls .planning/phase-2.{2,3}/task_plan.md verify + multi-plan 处理 (选最完整 1 个 OR 全跑 average)
- **Repair cost**: ~3 min

**S5 — F8 reproduction git tag --list v0.2.0 与 R12 fallback v0.2.0-final 冲突时 acceptance count ≥ 3 不可达**

- **Location**: PLAN § 6 F8 reproduction + task_plan T6.4 acceptance + R12
- **Issue**: 若 R12 fallback 触发 (v0.2.0 已存 → v0.2.0-final), git tag --list v0.2.0 仅命中 1 (旧 v0.2.0), 新 tag 在 v0.2.0-final — acceptance count 不真 represent v0.2.0 4/4 close
- **Suggestion**: F8 reproduction + T6.4 acceptance 改 list 含 v0.2.0-final (若 fallback path 走)
- **Repair cost**: ~3 min


---

## Watch-items for Execute-Phase

execute-phase Wave 0~6 executor 必验:

1. **Wave 0 first**: T0.1 ADR 编号实占 + sed-replace placeholder 全文 zero 字面残留 (grep gate inline task_plan L24); **BLOCKER B1 + B2 fix 完成** (T0.3 README pre-flight + T0.5 REQUIREMENTS expand) 后才 push, 否则 CI immediate red.
2. **Wave 0 spike sequencing**: T0.1 + T2.0 + T3.4 三 Resolved block executor fill in-place (W4 surface — task_plan 顶部 Resolved 区设 add).
3. **Wave 0 README pre-flight FIX**: T0.3 first commit 修 README L44 enumeration token 准确 OR 改 grep regex 精度 (per B1 fix path a).
4. **Wave 0 REQUIREMENTS expand**: T0.5 加 step REQUIREMENTS.md Phase 2.4 行下 expand R2.4.1~R2.4.7 (per B2 fix path a; sister R6.1-R6.5 + R7.1-R7.6 expand 模式).
5. **Wave 1 proactive split**: T1.2 直接 split status enum 进 src/cli/lib/check-result.ts (~20L) + doctor.ts ~180L 主体不动 (W3 surface).
6. **Wave 2 spike fill**: T2.0 跑 Phase 2.3 + 2.2 task_plan baseline + Resolved block fill in-place; 若 ≥1 plan 落 BLOCKER → 阈值放宽 concrete_acceptance 0.9 → 0.8 per R3 mitigation; T2.2 regex 扩 multi-line (W6 fix).
7. **Wave 3 mkdir + PATTERNS sed**: T3.1 + T3.2 + T3.3 action step 0 加 mkdir tests/installers tests/scripts (W1 fix); PATTERNS § 2.6 ccHookInstaller → ccHookAdd sed-replace (W2 fix).
8. **Wave 3 zero-dep grep gate**: T3.2 ship pre-commit verify grep import ws == 0 (W5 fix); T3.4 dashboard.mjs wc + 决断 (推 ≤650L SKIP path).
9. **Wave 4 audit + Win sentinel**: T4.1 helper split 默认 ship + audit.ts ≤200L; T4.3 Win sentinel 5 fixture (mock subagent per B-30 + O5).
10. **Wave 5 anti-redo discipline**: T5.1 30 doctor fixture + T5.2 30 plan-checker fixture (anti-redo Phase 2.3 30 routing per D2.4-19); 全 pass 3-OS CI matrix.
11. **Wave 6 ship**: T6.4 R12 pre-flight git tag --list v0.2.0 (proceed create path OK 实测 v0.2.0 大 tag 不存); F8 reproduction acceptance reconcile fallback path (S5 fix); T6.2 A7 verify git diff adr-0012-accepted..HEAD docs/adr/0001-0012 wc == 0.

---

## Final Verdict

**APPROVED WITH CONDITIONS (2 BLOCKER / 6 WARNING / 5 SUGGESTION) — 2026-05-16**

**评分维度**:
- F1-F8 achievability: 8/8 HIGH
- 4 D-decisions + 20 D2.4-* + 5 D-WP-*: 29/29 trace clean
- 43 B-locks: consolidated 5-source (CONTEXT 4 + RESEARCH 20 + PATTERNS 5 + STATE backlog 5 + planner inference 9) zero unresolved
- 29 atomic tasks: 7/7 spot check PASS (file + action + acceptance + decision_source)
- 7 Wave coverage: clean (no cycle / no forward-ref / W0 真 block W1+)
- 15/16 hard limits enforce (W3 reactive vs proactive doctor.ts split)
- A7 守恒: 9/9 PASS (T6.2 + B-37 显式 + ADR 0001-0012 0 diff + ci.yml iter 1-12 → 1-N + arbitrate legacy 保留)
- SSOT 引用纪律: 8/8 PASS (zero 字面 0013 残留 + sed-replace discipline embedded + intel § 0 全文 absorb)
- Karpathy MIN scope: 严守 (doctor MIN 5 check 不 weekly cron / upstream_health / uninstall 4 步; EE-4 BLOCKER manual rerun NOT auto-spawn per B-12)
- intel 必上 absorb: EE-4 L74-82 + L286 + dashboard-handoff § 3 + ROADMAP L113-115 全 ship trace

**Blocker root causes**:
- **B1** README counter pre-flight 三计数不一致 (SHIPPED=4 / BARS=3 / L44=3) — Wave 0 T0.3 push CI 必 red, 需 plan-phase T0.3 wording rewrite + README pre-flight fix step add
- **B2** PLAN frontmatter R2.4.1~R2.4.7 7 ID 全不存在于 REQUIREMENTS.md — plan-checker self-check file_references_verified 维度自反 BLOCKER, 需 Wave 0 T0.5 加 REQUIREMENTS expand step OR PLAN frontmatter 改引 ROADMAP anchor

**Sister review tier expectation**: 沿袭 phase 1.5 H1+M1 / 2.1 H1+H2 / 2.2 H1+H2+H3 / 2.3 H1+H2+H3+M1+M2+T3 全闭环 pattern, Phase 2.4 ship 后预期 sister review 1-2 tier (0 BLOCKER / 1-3 WARNING) 是 healthy outcome. 本 PLAN-CHECK 已 surface 6 WARNING + 5 SUGGESTION preventively (W1 mkdir / W2 PATTERNS sed / W3 proactive split / W4 Resolved 区设 / W5 zero-dep grep gate / W6 multi-line regex 六项尤其需 sister review attention).

**Plan 质量评估**:
- 29 atomic task 全有 file path + action concrete value + read_first + acceptance grep-verifiable + decision_source citation — sister phase 1.5/2.1/2.2/2.3 task_plan 模式一致
- 6 WARNING 全是 operational polish (mkdir / sed cleanup / proactive split / Resolved 区设 / grep gate / multi-line regex), 非 architectural blocker
- 5 SUGGESTION 全是 advisory, 非 ship-blocker
- 2 BLOCKER 是 plan-phase Wave 0 README + REQUIREMENTS 自检 gap (real-state check 暴露), Wave 0 fix 即解, 非 Phase 2.4 plan-phase architectural failure

**与 Phase 2.3 PLAN-CHECK 对比** (sister precedent):
- Phase 2.3 PLAN-CHECK: 1 BLOCKER (T0.5 schemaVersion gate ≥7 vs 实测 2) + 5 WARNING + 4 SUGGESTION
- Phase 2.4 PLAN-CHECK: 2 BLOCKER (B1 README + B2 REQUIREMENTS) + 6 WARNING + 5 SUGGESTION
- 沿袭模式: 均 APPROVED WITH CONDITIONS verdict; BLOCKER 均 plan-phase Wave 0 real-state check 暴露; WARNING 均 operational polish; SUGGESTION 均 advisory.

---

## Recommended Next Step

**APPROVED WITH CONDITIONS → execute-phase 启动 ready, but 必须先 fix 2 BLOCKER (~45 min):**

**PRIORITY 0 (BLOCKER, ~45 min total):**
- **B1** README counter pre-flight fix (~30 min) — 推荐 (a) T0.3 action step 0 加 README L44 enumeration token 修 + grep regex 精度 (line-start + bold) 校准排除 enumeration line 命中.
- **B2** REQUIREMENTS R2.4.* expand (~15 min) — 推荐 (a) T0.5 加 step REQUIREMENTS.md Phase 2.4 行下 expand R2.4.1~R2.4.7 (沿袭 R6.1-R6.5 + R7.1-R7.6 expand 模式).

**PRIORITY 1 (WARNING fixes, ~25 min total):**
- W1: T3.1+T3.2+T3.3 加 mkdir -p tests/installers tests/scripts (~3 min)
- W2: PATTERNS § 2.6 sed-replace ccHookInstaller → ccHookAdd cleanup (~5 min)
- W3: T1.2 proactive split status enum 进 src/cli/lib/check-result.ts (~5 min)
- W4: task_plan 顶部加 Resolved Blocks 区设 skeleton + 3 placeholder (~3 min)
- W5: T3.2 加 zero-dep grep gate (~3 min)
- W6: T2.2 regex 扩 multi-line + T2.0 spike outcome template ref count anchor (~5 min)

**PRIORITY 2 (SUGGESTION, optional, ~25 min total):**
- S1: T3.2 SSE reconnect 后 re-fetch (~5 min)
- S2: T3.1 uninstall 4 step 详细 (~10 min)
- S3: T6.4 fallback decision tree (~3 min)
- S4: T2.0 spike phase-2.2 task_plan path verify (~3 min)
- S5: F8 + T6.4 acceptance reconcile fallback path (~3 min)

完成 P0 + P1 fix (总 ~70 min, P2 optional ~25 min) 后, execute-phase 可启动:

- **Wave 0 first** (T0.1~T0.6, ~1 工作日) — STATE.md 5 项 prereq backlog + ADR draft + README pre-flight FIX + REQUIREMENTS expand + 3-OS CI gate verify
- **Wave 1 + Wave 2 parallel** (~2 工作日) — doctor 5 check + EE-4 plan-checker schema + spike baseline + project-local agent override
- **Wave 3** (~2 工作日) — cc-hook installer + dashboard SSE + 多项目 + 3 sub-task 并行 (T3.2 先 merge T3.3 rebase per B-19)
- **Wave 4** (~1 工作日) — audit 完整版扩 + Win sentinel 5 fixture
- **Wave 5** (~1 工作日) — 30 doctor + 30 plan-checker + e2e
- **Wave 6 ship** (~0.5 工作日) — ADR 0013 Accepted + 3 tag + v0.2.0 milestone close

Total estimated execute-phase: **~7-8 工作日** (PLAN § 3 ~8d 一致).

**2 ship-blocker (B1 + B2) surface 通过 PLAN-CHECK gate, plan-phase 责任完整.** Phase 2.4 plan-phase Wave C check verdict APPROVED WITH CONDITIONS; execute-phase 启动 ready after 2 BLOCKER fix + 6 priority warning fixes (~70 min total).

---

*Phase 2.4 PLAN-CHECK complete — 10 verification dimensions + 6 open issues resolution + 2 BLOCKER / 6 WARNING / 5 SUGGESTION / final verdict APPROVED WITH CONDITIONS / next step execute-phase ready after BLOCKER fix + 6 priority warning fixes (~70 min total). v0.2.0 末 phase plan-phase 完成 — 沿袭 Phase 2.3 PLAN-CHECK 13-section structure; 1 → 2 BLOCKER 增量反 dashboard C 路径 + EE-4 ABSORB + doctor MIN sister cluster 复杂度 vs Phase 2.3 extension category MVP scope.*
