# Phase 2.3 — PLAN-CHECK

> **Verdict:** APPROVED WITH CONDITIONS (1 BLOCKER / 5 WARNING / 4 SUGGESTION, miss: none) — 2026-05-16
> **Checker**: gsd-plan-checker (Claude Opus 4.7, 1M ctx)
> **Files audited**: KICKOFF / 2.3-CONTEXT / 2.3-DISCUSSION-LOG / PATTERNS / RESEARCH / ASSUMPTIONS / PLAN / task_plan (8 files, ~3200L total)
> **Scope**: goal-backward verification — does the plan WILL achieve F1-F8 + 8 D-decisions + 39 B-locks + Karpathy MIN scope + A7 守恒
> **Sister cadence**: 沿袭 phase 1.5 / 2.1 / 2.2 PLAN-CHECK 13-section structure

---

## Summary

Phase 2.3 plan-phase 全产物 (8 files / 7 Waves / 34 atomic tasks / 39 B-locks consolidated) goal-backward 审计结果: **1 BLOCKER** (T0.5 schemaVersion consumer gate 现状 codebase 仅 2 命中 vs ≥7 要求, Wave 0 push CI 即 red) + **5 WARNING** (decisionRules.ts ≤200L 紧贴临界 / T4.2 spike 反序 / T2.4 sed -i Win-Mac 兼容 / T1.5 + T1.1 upstream URL placeholder 未实占 / KICKOFF § 7 EE-5 self-instance 缺) + **4 SUGGESTION** (samples-30.test.ts hits 累积模式 / EE-5 provenance write 路径 underspec / T2.5 互镜射一致性 / T6.4 final A7 re-verify).

**Plan 内核质量**: 39 B-lock 全消化 4 来源 (CONTEXT 8 + RESEARCH 7 + PATTERNS 8 + planner inference 推导) 无 unresolved conflict; F1-F8 全 HIGH achievability; A7 守恒 verify task T5.4 显式; Karpathy MIN scope discipline 严守 (5 NEW manifest + 1 REWRITE + arbitrate ~20L 增量 + 单文件 SKILL.md ≤80L); intel 必上两项 (EE-5 L92 + CD-3 L130-135) 全 absorbed.

**Blocker root cause**: Phase 2.2 W2 claim 7 surface schemaVersion adoption, 但真实 grep `branchOnSchemaVersion(` 仅 2 命中 (`src/types/schemaVersion.ts` helper 定义 + 1 self-reference). Phase 2.3 Wave 0 T0.5 gate (`grep -r ... | wc -l ≥ 7`) 在当前 codebase push CI 即 red. Wave 0 executor 需补足 ≥7 consumer call sites, 或 plan-phase 修正 gate 阈值配合 ADR errata 解释.

**Recommendation**: 1 BLOCKER fix 后可进 execute-phase (~30 min fix); 5 WARNING + 4 SUGGESTION 是 operational polish 非 architectural blocker.

---

## 10 Verification Dimensions

### Check 1 — F1-F8 bar mapping → tasks + reproduction + B-lock

| Bar | Wave | Tasks | B-lock | Status |
|-----|------|-------|--------|--------|
| F1 (Wave 0 6 项根治) | W0 | T0.3-T0.8 + T0.9 verify | B-25~B-32 | PASS |
| F2 (3 category 6-7 adapter) | W1 | T1.1-T1.5 + T1.6 e2e | B-01~B-05 | PASS |
| F3 (decision_rules CD-3 + arbitrate) | W2 | T2.1 + T2.2 | B-15~B-19 | PASS |
| F4 (karpathy SKILL-ONLY) | W2 | T2.3 + T2.4 (REWRITE) + T2.5 | B-06~B-10 | PASS |
| F5 (EE-5 5 题双层) | W3 | T3.1 + T3.2 + T3.3 | B-11~B-14 | PASS |
| F6 (30 SAMPLES + ≥85%) | W4 | T4.1 + T4.2 spike + T4.3 harness | B-20~B-24 | PASS |
| F7 (A7 守恒 + integration) | W5 | T5.1-T5.4 | B-35 + B-18 | PASS |
| F8 (ship) | W6 | T6.1-T6.4 | B-33 + B-35 | PASS |

**8/8 acceptance bars 全 HIGH achievability**; 每 bar 至少 1:1 trace 到 task + reproduction command grep-verifiable + B-lock cite.

---

### Check 2 — 8 D-decisions (D-01~D-08) → B-lock trace

| D | Lock | Wave/Task | Status |
|---|------|-----------|--------|
| D-01 (3 category MIN) | B-01~B-05 | W1 T1.1-T1.5 | OK |
| D-02 (SKILL-ONLY) | B-06~B-10 | W2 T2.3 + T2.4 | OK |
| D-03 (EE-5 BOTH) | B-11~B-14 | W3 T3.1-T3.3 | OK |
| D-04 (CD-3 DR-only) | B-15~B-19 | W2 T2.1 + T2.2 | OK |
| D-05 (FRESH-30) | B-20~B-22 | W4 T4.1 + T4.3 | OK |
| D-06 (EE-4 DEFER-2.4) | (no Phase 2.3 lock) | (out of scope) | OK |
| D-07 (ALL-W0) | B-25~B-32 | W0 T0.3-T0.8 | OK |
| D-08 (FE-DESIGN 主导) | B-23 + B-24 | W2 T2.1 + W4 T4.1 | OK |

**8/8 D-decisions 全 trace.**

---

### Check 3 — 7 D2.3-* RESEARCH locks → B-lock 吸收

| D2.3 | Lock | B-lock | Status |
|------|------|--------|--------|
| D2.3-1 (M3 perf 移 critical path) | B-28 | W0 T0.3 perf-bench.yml | OK |
| D2.3-2 (单文件 SKILL.md + always_active) | B-07 + B-08 | W2 T2.3 | OK |
| D2.3-3 (git-clone-with-setup karpathy install) | B-09 | W2 T2.4 REWRITE | OK |
| D2.3-4 (9 keyword 高精度词集) | B-23 | W2 T2.1 + W4 T4.1 | OK |
| D2.3-5 (anchor priority + CD-3 冗余) | B-24 | W2 T2.5 per-manifest hint | OK |
| D2.3-6 (复用现 3 category 段) | (KICKOFF F3 wording RESOLVED B.9) | W2 T2.1 incremental | OK |
| D2.3-7 (arbitrateWithRedirect 三阶段) | B-18 + B-19 | W2 T2.2 | OK |

**7/7 D2.3-* locks 全 absorbed.**

---

### Check 4 — 8 D-WP-* PATTERNS proposals → resolution

| D-WP | Resolution | B-lock | Status |
|------|-----------|--------|--------|
| D-WP-1 (CD-3 schema) → (b) open record do nothing | B-16 | RESOLVED |
| D-WP-2 (skill 形态) → (a) 单文件 SKILL.md | B-07 + D2.3-2 | RESOLVED |
| D-WP-3 (M3 perf 策略) → (a) 移 critical path | B-28 + D2.3-1 | RESOLVED |
| D-WP-4 (rejected path) → (b) redirectTo 作 primary | B-19 | RESOLVED |
| D-WP-5 (arbitrate 升级) → (b) legacy 保留 + new fn | B-18 | RESOLVED |
| D-WP-6 (T5 deferred-items) → (b) markdown + warn-only CI | B-31 | RESOLVED |
| D-WP-7 (SAMPLES 时机) → (a) Wave B frozen | B-22 | RESOLVED |
| D-WP-8 (ADR 编号) → 不预占 + sed-replace placeholder | B-34 | RESOLVED |

**8/8 D-WP proposals 全 resolved.** ASSUMPTIONS § B.9 conflict resolution chain 显式记录, no unresolved cross-source conflicts.

---

### Check 5 — 34 atomic tasks coherence

抽 6 task 跨 wave actionable spot-check:

| Task | Files concrete? | Action 含具体值? | Acceptance grep-verifiable? | decision_source 引? |
|------|----------------|------------------|------------------------------|---------------------|
| T0.1 ADR 编号实占 | OK (read-only) | OK (5 step + sed-replace cmd) | OK (3 grep) | B-34 + KICKOFF § 3.2 |
| T0.5 schemaVersion gate | OK (ci.yml) | OK (10L yaml literal) | OK (grep + local verify) | B-29 + D-07 |
| T1.1 frontend-design.yaml | OK (manifest path) | OK (full 50L yaml) | OK (4 grep + schema validate) | B-01 + B-02 |
| T2.2 arbitrateWithRedirect | OK (decisionRules.ts) | OK (full ~25L TS) | OK (6 grep + tsc + ≤200L) | B-18 + B-19 + RESEARCH D2.3-7 |
| T3.1 manifest-add.ts | OK (cli/manifest-add.ts) | OK (full ~70L TS) | OK (6 grep + tsc) | B-11~B-13 + PATTERNS § 2.6 |
| T4.3 samples-30.test.ts | OK (test file) | OK (full vitest harness) | OK (npm test ≥26/30) | B-20 + B-22 + R4 |

**6/6 actionability spot check PASS.** 34 atomic task 全有 file path + action + read_first + acceptance + decision_source (沿袭 phase 2.2 task_plan 模式).

---

### Check 6 — Hard limits enforcement

Karpathy 5 hard limit + Phase 2.3 new limits 全表:

| File | Limit | Plan Target | Verify | Status |
|------|-------|-------------|--------|--------|
| engine.ts | ≤200L | (不动) | n/a | OK |
| agentDefinition.ts | ≤200L | (不动) | n/a | OK |
| systemPrompt.ts | ≤80L | (不动) | n/a | OK |
| ralphLoop.ts | ≤50L 主体 | (不动) | n/a | OK |
| promiseExtract.ts | ≤50L | (不动) | n/a | OK |
| decisionRules.ts | ≤200L | 现 183L + ~25L = **~208L 临界超** | T2.2 wc -l 校 + 条件 split | **WARN W4** |
| arbitrateRedirect.ts (条件 split) | n/a | NEW ≤80L if split | n/a | OK |
| manifest yaml each | ≤60L | 5 NEW + 1 REWRITE | T1.x wc -l ≤60 | OK |
| karpathy-baseline/SKILL.md | ≤80L | NEW ~60L body | T2.3 wc -l ≤80 | OK |
| manifest-add.ts | ≤90L | NEW ~70-80L | T3.1 wc -l ≤90 | OK |
| perf-bench.yml | ≤50L | NEW ~20L | T0.3 wc -l ≤50 | OK |
| check-deferred-items.mjs | ≤80L | NEW ~60-70L | T0.8 wc -l ≤80 | OK |
| SAMPLES.md | ≤250L | NEW ~220-240L | T4.1 wc -l ≤250 | OK |

**11/13 PASS.** WARN W4 = decisionRules.ts 现 183L + arbitrateWithRedirect ~20L + helper ~5L ≈ 208L 紧贴超 200, B-36 已 plan conditional split path (acceptance 含 OR split 双路径), 但 reactive split 决策点位于 executor 端 — 建议改 proactive split (详 W4).

---

### Check 7 — A7 守恒

| Check | Task | Status |
|-------|------|--------|
| ADR 编号 plan-phase 实占 (不预占 0012) | T0.1 ls + max(NNNN)+1 | OK |
| ADR placeholder discipline (sed-replace) | T0.1 inline grep gate | OK |
| ADR 0001-0011 main body 0 diff | T5.4 git diff verify wc -l == 0 | OK |
| baseline tag iter 1-11 → 1-N | T6.4 git tag | OK |
| ci.yml A7 step iter 1-11 → 1-N | T6.2 | OK |
| AGENT-DEFINITION-FACTORY-CONTRACT.md main body 不动 | T5.4 + 本 phase 不改 contract | OK |
| INSTALLER-CONTRACT.md main body 不动 | (本 phase 不改) | OK |
| arbitrate() legacy 保留 (byte-stable 测试) | B-18 + T2.2 | OK |

**8/8 A7 守恒 PASS.** B-35 全 trace + T5.4 显式 git diff verify.

---

### Check 8 — SSOT 引用纪律

| Aspect | Implementation | Status |
|--------|---------------|--------|
| ADR 编号绝不预占 | 所有产物用 placeholder, zero 字面 0012 | OK |
| T0.1 sed-replace discipline | task_plan L10 + L24 显式 inline warning + grep gate | OK |
| Phase 编号语义锚定 | KICKOFF § 6 + PLAN § 8 phase 2.2/2.3/2.4 边界表 | OK |
| intel 引用 (L86/L92/L130-135) | KICKOFF + CONTEXT + RESEARCH 一致 cite | OK |

**4/4 SSOT 引用纪律 PASS.** 沿袭 Phase 2.1 W1 plan-check fix sed-replace 模式.

---

### Check 9 — 7 Wave coverage + dependency graph

Wave 拓扑:

- W0 (T0.1..T0.9) — 6 项 prereq backlog + ADR draft
- W1 (T1.1..T1.6) — 5 NEW manifest + install e2e (depends on W0)
- W2 (T2.1..T2.5) — decision_rules CD-3 + karpathy SKILL-ONLY (depends on W1)
- W3 (T3.1..T3.3) — EE-5 双层 gate (parallel with W2, depends on W1)
- W4 (T4.1..T4.3) — 30 SAMPLES + arbitrate ≥85% (depends on W1+W2+W3)
- W5 (T5.1..T5.4) — integration + A7 verify (depends on W4)
- W6 (T6.1..T6.4) — ship (depends on W5)

**Task count check:** PLAN § 3 W0=9 + W1=6 + W2=5 + W3=3 + W4=3 + W5=4 + W6=4 = **34** (user prompt 34 atomic tasks 1:1 match).

**Dependency 验:**
- W0 真 block W1+: M3 perf gate 移出 + M1 schema regen 都是 CI infra, W1+ commit push 时 CI 不再 perf flap; T0.9 acceptance 3-OS CI gate verify ensure W0 完整.
- W2 + W3 并行: W2 改 decisionRules.ts + decision_rules.yaml + skills/ + manifests/skill-packs/karpathy-skills.yaml + manifests/skill-packs/ui-ux-pro-max.yaml; W3 改 src/cli/manifest-add.ts + src/cli.ts + .planning/_templates/. 无文件冲突.
- W4 依赖 W1+W2+W3 全 ship (SAMPLES.md ≥85% harness 需 adapter 装配 + CD-3 字段 + arbitrateWithRedirect 全在位).
- W5 → W6: T5.4 A7 verify + T6.x ship.

**No cycle / no forward-ref.** Wave 拓扑 clean (PLAN § 2 / task_plan 顺序一致).

---

### Check 10 — Wave B 7 open issues resolution

详 § 7 Open Issues Resolution.

---

## 7 Open Issues Resolution

### O1 — decisionRules.ts hard limit 临界 (~180L + ~25L = ~208L)

- **Status**: PARTIALLY RESOLVED (条件 split path 已 plan, 但 reactive)
- **Evidence**: ASSUMPTIONS B-36 写 decisionRules.ts 现 ~180L + arbitrateWithRedirect ~20L + helper ~5L ≈ ~205L → 可能超 → split 到 src/routing/lib/arbitrateRedirect.ts; task_plan T2.2 acceptance 含 wc -l ≤ 200 OR split if > 200; 实际 wc -l = 183L, 加 ~25L 后 ~208L → 必 trigger split.
- **Recommendation**: WARNING — 改为 proactive split (T2.2 action step 1 直接 split arbitrateWithRedirect + helper → src/routing/lib/arbitrateRedirect.ts ≤80L, 不留 200L 临界 reactive 决策给 executor). 沿袭 Phase 2.2 sdkReconcile.ts proactive split 先例.
- **Severity**: WARNING (not BLOCKER, 因 acceptance 已含 OR split 双路径)

### O2 — T0.5 schemaVersion consumer call site gate (Phase 2.2 ship 实际 consumer 未验)

- **Status**: BLOCKER — 现状 codebase 仅 2 命中 vs gate ≥7 要求
- **Evidence**: grep -r branchOnSchemaVersion( on src/ 真实命中仅 2 (src/types/schemaVersion.ts:2, 内部 helper 定义 + 1 self-reference). Phase 2.2 W2 T2.0 claim 的 7 surface 各 ≥ 1 consumer call site 真实 grep 命中 ≪ 7. task_plan T0.5 acceptance 已 hedge 此条件 (否则 Wave 0 executor 补 consumer 至 ≥ 7), 但**未 schedule 补 consumer 的 task**; T0.5 直接 push CI 会 immediate red (exit 1 from count -lt 7).
- **Recommendation**: BLOCKER FIX — 三选一:
  1. (a) 新加 task T0.5-pre or 扩 T0.5 action: Wave 0 first step scan 7 schemaVersion surface (cliWiringV2 / agentDefinitionFactory / decisionRules / engine / ralphLoopWrap / promiseExtract / systemPromptCompiler 详 Phase 2.2 RESEARCH/SUMMARY 列表) 各加 ≥1 真实 branchOnSchemaVersion(...) consumer call site, after ci.yml gate step add.
  2. (b) 修 gate 阈值: T0.5 acceptance 改 ≥ 2 反映现状 + ADR errata 解释 Phase 2.2 W2 helper-only ship 真相, sister review 透明承认 helper-only ship.
  3. (c) rename gate: 改 import surface count, grep -rE import 关键字 验 import surface 而非 call site.

  推荐 (a) 真根治 (符合 Phase 2.2 W2 ship claim), 或 (b) 透明承认 + ADR errata.
- **Severity**: BLOCKER — Wave 0 push CI 即 red, 需 plan-phase 修正后才进 execute-phase

### O3 — T4.2 always_active spike Wave 序反 (Wave 4 但 Wave 2 ship 之前需 spike)

- **Status**: ACTIVE (sequential dependency 反序)
- **Evidence**: T2.3 (Wave 2) ship skills/karpathy-baseline/SKILL.md 含 always_active: true frontmatter; T4.2 (Wave 4) 才 spike 验证字段是否被 Claude Code skill registry 真支持. 若 T4.2 spike 不通过 → T2.3 ship 产物需 revise (改 description-keyword 路径) → Wave 3 全部 re-test → 节奏混乱. R1 mitigation 标 LOW risk 但 sequential order is reverse.
- **Recommendation**: WARNING — 把 T4.2 spike 提前到 Wave 0 末 (T0.10) 或 Wave 1 首, T2.3 ship 前 SKILL.md frontmatter 已经 spike-validated. 沿袭 Phase 2.2 T1.2 spike-then-ship 先例 (B-06 spike throwaway 后 W2 ship).
- **Severity**: WARNING — 不阻 ship 但反序提高 rework 风险

### O4 — T4.1 SAMPLES.md ≤250L 边界

- **Status**: RESOLVED (within budget)
- **Evidence**: 30 行 truth table × 8 column ≈ 60-90L + § 1.1-1.4 三约束 + 分布 + cherry-pick 防御 + § 2 truth table 标题 ≈ 80-120L 元数据 + 30 row content ≈ 100L, 总和 ~200-220L. Phase 1.4 / 2.2 SAMPLES.md 都 ≤200L 实证模式, Phase 2.3 沿袭 OK.
- **Recommendation**: 无 — 沿袭 Phase 1.4 / 2.2 SAMPLES.md 模式 + Wave B planner R3 frozen + Wave C 不审 sample 选取 (D-WP-7 (a)).
- **Severity**: PASS

### O5 — karpathy-skills.yaml migration sed-injection Win/macOS 兼容

- **Status**: ACTIVE (Win/macOS sed -i 兼容性 gap)
- **Evidence**: T2.4 install cmd 含 sed -i ... karpathy-skills:start ... d ~/.claude/CLAUDE.md. macOS BSD sed 需 sed -i 加空字符串 (empty string arg after -i), Linux GNU sed 直接 sed -i, Win Git Bash 是 GNU 兼容 sed -i. macOS install 会 fail. R3 mitigation 写 migration cleanup script 一次性清旧 但未指 macOS sed -i 兼容. Phase 2.3 manifest platforms: [linux, darwin, win32] 全 list, 但 install 在 darwin 必 fail.
- **Recommendation**: WARNING — 改 T2.4 install cmd 用 portable POSIX sed (sed -i.bak 模式 + 后续 rm -f bak file) OR 改 node script (沿袭 scripts/check-transparency-verdicts.mjs). 架构层先定 — portable sed vs node migration script, 不要 ad-hoc 补 darwin-only branch.
- **Severity**: WARNING — macOS install path real bug, 需 Wave 2 fix

### O6 — EE-5 5-question CLI provenance integration (Phase 2.2 B-33 4 字段映射)

- **Status**: UNDERSPEC (executor 实占 path 未 articulate)
- **Evidence**: task_plan T3.1 action step 含 // Persist manifest stub + log answers to provenance (D-03 audit trail; B-33 sibling .provenance.json) + // ... (executor 实占 provenance JSON write path). Phase 2.2 B-33 provenance.schema.json 4 字段 (source/created_at/confidence/author) 是 manifest 装配级 provenance, non-trivial map 到 EE-5 5 answer (answer 不是 confidence; source 是 upstream 不是 author; 5 answer 应进 manifest spec.ee5_audit 或独立 sibling file). task_plan 未明示 mapping, 仅留 executor 实占.
- **Recommendation**: SUGGESTION — T3.1 action 加 explicit: answers 写入 manifests/skill-packs/NAME.ee5-answers.json sibling file (5 named field q1_reusable_surface / q2_name_fit / q3_overlap / q4_concept_vs_identity / q5_user_understanding), 不进 provenance.schema.json 4 字段 (provenance 是 manifest 全局 metadata, EE-5 是 author audit, 语义不同).
- **Severity**: SUGGESTION — operational polish, non-blocking

### O7 — chrome-devtools-mcp upstream URL pinning

- **Status**: ACTIVE (placeholder unresolved)
- **Evidence**: T1.5 yaml literal cmd 含 claude mcp add chrome-devtools-mcp --transport http upstream-url-placeholder — placeholder 是字面字符串, Wave 1 executor 必须实占否则 install 跑 literal placeholder 必 fail. schema validate 不会 catch placeholder (URL field 是 string). 同款 placeholder frontend-design-upstream 在 T1.1 manifests/skill-packs/frontend-design.yaml upstream.source / upstream.repository 字段.
- **Recommendation**: WARNING — task_plan T1.1 + T1.5 action 加 explicit Wave 1 executor 须 resolve URL placeholder; 或 plan-phase 直接实占. 沿袭 T0.1 placeholder sed-replace discipline 模式 — placeholder 必加 grep gate (negate 字面 placeholder string remaining) 作 Wave 1 pre-commit gate.
- **Severity**: WARNING — install fail risk, 需 Wave 1 fix

---

## Findings

### BLOCKER (must fix before execute-phase)

**B1 — T0.5 schemaVersion consumer gate >=7 现状 codebase 仅 2 命中**
- **Location**: task_plan.md T0.5 + PLAN.md section 6 F1 reproduction + .github/workflows/ci.yml (Wave 0 commit 产物)
- **Issue**: grep -r branchOnSchemaVersion paren in src wc -l 当前 = 2, T0.5 gate 要求 >= 7, Wave 0 push CI 必 red (exit 1).
- **Root cause**: Phase 2.2 W2 ship claim 7 surface schemaVersion adoption, 但真实 grep 显示 helper-only introduce 阶段 (src/types/schemaVersion.ts 内部 definition + 1 self-reference).
- **Fix hint**:
  1. (推荐 a) 新加 task T0.5-pre or 扩 T0.5 action: Wave 0 先 scan 7 schemaVersion surface (cliWiringV2 / agentDefinitionFactory / decisionRules / engine / ralphLoopWrap / promiseExtract / systemPromptCompiler) 各加 >=1 真实 branchOnSchemaVersion consumer call site, after ci.yml gate step add.
  2. (alt b) gate 阈值改 >= 2 反映现状 + ADR errata 解释 Phase 2.2 W2 helper-introduce 真相.
  3. (alt c) gate 改 import surface count grep -rE import 验 import surface 而非 call site.
- **Repair cost**: ~30 min for (a) — 7 surface 各 add 1 call site; ~10 min for (b)/(c).

### WARNING (should fix)

**W1 — T4.2 always_active spike Wave 4 反序, 应提前到 Wave 0/1**
- **Location**: task_plan.md T4.2 (Wave 4)
- **Issue**: T2.3 (Wave 2) ship SKILL.md always_active true frontmatter, 但 T4.2 (Wave 4) 才 spike 验证字段是否真支持. spike 不通过 -> T2.3 ship 产物需 revise -> Wave 3 全部 re-test.
- **Fix hint**: 把 T4.2 改 T0.10 (Wave 0 末 spike <30 min) + spike outcome 进 task_plan Resolved block + T2.3 frontmatter 字段名根据 outcome 实占.
- **Repair cost**: ~5 min plan re-sequence

**W2 — T2.4 karpathy migration sed -i macOS 兼容性 gap**
- **Location**: task_plan.md T2.4 install cmd
- **Issue**: sed -i ...d 在 macOS BSD sed 必 fail (需 sed -i 加空字符串 arg); Phase 2.3 manifest platforms 含 darwin, install darwin 必 fail.
- **Fix hint**: 改 portable POSIX (sed -i.bak 后续 rm -f bak 模式) OR 改 node script (沿袭 check-transparency-verdicts.mjs). 架构层先定 — portable sed vs node migration script.
- **Repair cost**: ~10 min Wave 2 fix

**W3 — T1.1 + T1.5 manifest yaml upstream URL placeholder 未 resolve**
- **Location**: task_plan.md T1.1 + T1.5
- **Issue**: yaml literal 字面 placeholder (frontend-design-upstream / chrome-devtools-mcp upstream-url), Wave 1 executor 须 resolve 否则 install 跑 literal string 必 fail.
- **Fix hint**: plan-phase 直接 resolve URL 或加 grep gate (negate 字面 placeholder remaining) 作 Wave 1 pre-commit.
- **Repair cost**: ~10 min URL research + commit

**W4 — decisionRules.ts <=200L hard limit reactive split, 应 proactive split**
- **Location**: task_plan.md T2.2 + ASSUMPTIONS.md B-36
- **Issue**: 现 183L + ~25L = ~208L 必 trigger split, reactive split 在 acceptance 是 OK but plan should commit proactively.
- **Fix hint**: T2.2 action step 1 强制 split arbitrateWithRedirect + helper to src/routing/lib/arbitrateRedirect.ts <=80L; decisionRules.ts 主体不动. 沿袭 Phase 2.2 sdkReconcile.ts proactive split.
- **Repair cost**: ~5 min plan rewrite

**W5 — Phase 2.3 KICKOFF.md 本 phase self-instance section 7 EE-5 节缺**
- **Location**: .planning/phase-2.3/KICKOFF.md (Phase 2.3 自身) + T3.3 action
- **Issue**: Phase 2.3 本 phase 列 5 NEW upstream adapter (frontend-design / anthropics-skills-pptx / slide-deck / playwright-test / chrome-devtools-mcp), 按 D-03 BOTH + B-14 BLOCKER rule (若 KICKOFF 列新 upstream adapter 且 section 7 任一题未答 -> BLOCKER), Phase 2.3 KICKOFF.md 本身应 self-instance 已答 5 题 (meta-self-application). 现 KICKOFF.md 无 section 7 节, 违 B-14 rule applied to self.
- **Fix hint**: T3.3 action 加一步: 在 .planning/phase-2.3/KICKOFF.md 加 section 7 节, 5 题各填 5 adapter 答案 (5 adapter x 5 题合并答 1 表).
- **Repair cost**: ~10 min Wave 3 fix

### SUGGESTION (advisory)

**S1 — T4.3 samples-30.test.ts hits 累积模式潜在 race condition**
- **Location**: task_plan.md T4.3 vitest harness code
- **Issue**: hits 在 describe block scope, 每 sample it 内 mutate; final it overall hit rate >=85 假设所有 sample it 已运行后 hits accumulated. Vitest 默认 sequential OK, 但 parallel mode 或 explicit it.concurrent 触发时 race.
- **Suggestion**: 改 harness 用 explicit pre-compute (results.map -> results.filter -> expect hits >= 26), 不依赖 mutate-across-it 累积.
- **Repair cost**: ~5 min Wave 4 harness rewrite

**S2 — T3.1 EE-5 provenance write path underspec (B-33 map 未 articulate)**
- **Location**: task_plan.md T3.1 action step (executor 实占 provenance JSON write path)
- **Issue**: 5 answer 与 Phase 2.2 B-33 provenance.schema.json 4 字段语义不同 (provenance = manifest metadata, EE-5 = author audit), map 留 executor 实占增 ad-hoc 风险.
- **Suggestion**: T3.1 action 加 explicit: answers 写入 manifests/skill-packs/NAME.ee5-answers.json sibling file (5 named field).
- **Repair cost**: ~5 min add 1 paragraph

**S3 — T2.5 per-manifest hint 冗余字段 vs T1.1 frontend-design.yaml 路径不一致**
- **Location**: task_plan.md T1.1 + T2.5
- **Issue**: T1.1 frontend-design.yaml 直接含 decision_rules.do_not_use_when + if_rejected_use; T2.5 才加 ui-ux-pro-max.yaml 同字段. task ordering 中间无 sample harness 检验.
- **Suggestion**: T2.5 acceptance 加 grep-verifiable 互镜射 check (frontend-design redirects to ui-ux-pro-max, ui-ux-pro-max redirects to frontend-design).
- **Repair cost**: ~3 min add 1 acceptance line

**S4 — T6.4 baseline tag push 顺序 risk vs A7 verify (T5.4)**
- **Location**: task_plan.md T5.4 + T6.4
- **Issue**: T5.4 git diff verify 取 baseline adr-0011-accepted (Phase 2.2 tag), T6.4 push 新 tag adr-N-accepted. 若 T6.4 push 前任何 commit unintentionally touch ADR 0001-0011 main body, T5.4 未 re-run.
- **Suggestion**: T6.4 acceptance 加 final A7 re-verify (git diff adr-0011-accepted..HEAD docs/adr/0001 to 0011 wc -l == 0) 作 ship-time gate.
- **Repair cost**: ~3 min add 1 acceptance line

---

## Watch-items for Execute-Phase

execute-phase Wave 0~6 executor 必验:

1. **Wave 0 first**: T0.1 ADR 编号实占 + sed-replace placeholder 全文 zero 字面残留 (grep gate inline task_plan.md L24); T0.5 schemaVersion gate **必须 BLOCKER fix B1 完成** (补 consumer 或修阈值) 后才 push, 否则 CI immediate red.
2. **Wave 0 spike sequencing**: 若 W1 fix 后, 把 T4.2 always_active spike 提前到 T0.10 (~30 min), outcome 进 Resolved block.
3. **Wave 1**: 5 NEW manifest yaml upstream URL placeholder 必先 resolve; harnessed install NAME --dry-run --apply 5 NEW 全 exit 0 才 push.
4. **Wave 2 macOS install path**: T2.4 sed -i 须用 portable POSIX 模式 (或 node migration script); Phase 2.3 manifest platforms [linux, darwin, win32] 三平台 install 均须可跑.
5. **Wave 2 decisionRules.ts proactive split**: 直接 split arbitrateWithRedirect + helper 到 src/routing/lib/arbitrateRedirect.ts <=80L, 不留 200L 临界 (W4).
6. **Wave 3 self-instance**: T3.3 加 section 7 EE-5 节后, 先 self-instance Phase 2.3 KICKOFF.md 本身 5 adapter x 5 答案 (W5).
7. **Wave 4 samples-30 harness**: 若用 hit-累积模式 (S1) 跑通则 OK; 若 vitest parallel mode trigger race, 改 explicit pre-compute (S1 fix).
8. **Wave 4 SAMPLES.md frozen**: Wave B planner 已 R3 frozen (D-WP-7 a), execute-phase 不允许改 sample 选取; 若 < 26/30 -> known miss 节追加 + R4 fallback 9 keywords 微调 (sister precedent Phase 1.4).
9. **Wave 5 A7 verify**: T5.4 git diff wc -l == 0; allow errata fence comment add only (B-38 fence pattern).
10. **Wave 6 ship**: T6.4 加 final A7 re-verify (S4) 作 ship-time gate; gh run list 3-OS 全绿 success.

---

## Final Verdict

**APPROVED WITH CONDITIONS (1 BLOCKER / 5 WARNING / 4 SUGGESTION) — 2026-05-16**

**评分维度:**
- F1-F8 achievability: 8/8 HIGH
- 8 D-decisions + 7 D2.3-* + 8 D-WP-*: 23/23 trace clean
- 39 B-locks: consolidated 4-source (CONTEXT 8 + RESEARCH 7 + PATTERNS 8 + planner inference) zero unresolved
- 34 atomic tasks: 6/6 spot check PASS (file + action + acceptance + decision_source)
- 7 Wave coverage: clean (no cycle / no forward-ref / W0 真 block W1+)
- 11/13 hard limits enforce (W4 reactive vs proactive)
- A7 守恒: 8/8 PASS (T5.4 + B-35 显式 + arbitrate legacy 保留)
- SSOT 引用纪律: 4/4 PASS (zero 0012 字面残留 + sed-replace discipline embedded)
- Karpathy MIN scope: 严守 (5 NEW + 1 REWRITE + ~20L arbitrate + <=80L SKILL.md + <=90L manifest-add)
- intel 必上 absorb: EE-5 + CD-3 全 ship trace

**Blocker root cause**: T0.5 schemaVersion gate 现状 codebase 仅 2 命中 vs >=7 要求 (Phase 2.2 W2 helper-only ship 真相暴露). 1 BLOCKER fix 后 (~30 min) execute-phase 启动 ready.

**Sister review tier expectation**: 沿袭 phase 1.5 H1+M1 / 2.1 H1+H2 / 2.2 H1+H2+H3 pattern, Phase 2.3 ship 后预期 sister review 1 tier (0 BLOCKER / 1-2 WARNING) 是 healthy outcome, 本 PLAN-CHECK 已 surface 5 WARNING preventively (W2 macOS sed-i / W3 upstream URL placeholder / W5 KICKOFF self-instance 三项尤其需 sister review attention).

**Plan 质量评估**:
- 34 atomic task 全有 file path + action concrete value + read_first + acceptance grep-verifiable + decision_source citation — sister phase 1.4 / 2.1 / 2.2 task_plan 模式一致
- 5 WARNING 全是 operational polish (sed-i / URL / spike sequencing / proactive split / self-instance), 非 architectural blocker
- 4 SUGGESTION 全是 advisory, 非 ship-blocker
- 1 BLOCKER 是 Phase 2.2 ship 真实 gap 暴露 (Phase 2.2 W2 helper-only vs T0.5 gate >=7 不一致), Phase 2.3 W0 fix 即解, 非 Phase 2.3 plan-phase failure

---

## Recommended Next Step

**APPROVED WITH CONDITIONS -> execute-phase 启动 ready, but 必须先 fix BLOCKER B1 (~30 min):**

**PRIORITY 0 (BLOCKER, ~30 min):**
- 选择路径 (a)/(b)/(c) — 推荐 (a) 新加 task T0.5-pre: Wave 0 first step scan Phase 2.2 7 schemaVersion surface 各加 >=1 真实 branchOnSchemaVersion consumer call site, 补足 >=7 -> T0.5 gate green 后 push.

**PRIORITY 1 (WARNING fixes, ~30 min total):**
- W1: T4.2 spike 提前到 T0.10 (~5 min plan re-sequence)
- W2: T2.4 sed -i 改 portable POSIX 或 node migration script (~10 min Wave 2; 架构层先定)
- W3: T1.1 + T1.5 upstream URL placeholder 实占 (~10 min)
- W4: T2.2 proactive split (~5 min plan rewrite)
- W5: T3.3 section 7 self-instance Phase 2.3 KICKOFF.md (~10 min Wave 3)

**PRIORITY 2 (SUGGESTION, optional):**
- S1~S4 advisory polish (~20 min total)

完成 P0 + P1 fix (总 ~60 min) 后, execute-phase 可启动:

- **Wave 0 first** (T0.1~T0.10, ~2 工作日) — STATE.md 6 项 prereq backlog 一次根治 + ADR draft + always_active spike + 3-OS CI gate verify
- **Wave 1** (T1.1~T1.6, ~1 工作日) — 5 NEW manifest + install dry-run e2e
- **Wave 2 + Wave 3 parallel** (~2.5 工作日) — decision_rules CD-3 + karpathy SKILL-ONLY + EE-5 双层 gate
- **Wave 4** (~1 工作日) — 30 FRESH SAMPLES + arbitrate >=85% harness
- **Wave 5** (~1 工作日) — integration tests + A7 verify
- **Wave 6 ship** (~0.5 工作日) — ADR placeholder Accepted + baseline tag + v0.2.0-alpha.3-extension-mvp tag

Total estimated execute-phase: **~8 工作日** (PLAN section 3 一致).

**1 ship-blocker (B1) surface 通过 PLAN-CHECK gate, plan-phase 责任完整.** Phase 2.3 plan-phase Wave C check verdict APPROVED WITH CONDITIONS; execute-phase 启动 ready after BLOCKER + 4-5 WARNING fix (~60 min).

---

*Phase 2.3 PLAN-CHECK complete — 10 verification dimensions + 7 open issues resolution + 1 BLOCKER / 5 WARNING / 4 SUGGESTION / final verdict APPROVED WITH CONDITIONS / next step execute-phase ready after BLOCKER fix + 5 priority warning fixes (~60 min total).*
