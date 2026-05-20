# Phase v2.0-2.2 — Engineering Plan Review (gstack /plan-eng-review)

**Reviewer**: Claude Opus 4.7 acting as Paranoid Staff Engineer per `~/.claude/skills/gstack/plan-eng-review/SKILL.md` workflow
**Reviewed input**: `.planning/phase-v2.0-2.1/2.1-CONTEXT.md` (16 D-decision design doc) + `.planning/REQUIREMENTS.md § R20` (16 R20.x) + `.planning/ROADMAP.md § v2.0` (6 phase scope) + `.planning/phase-v2.0-2.2/RESEARCH.md` (Wave A 1058L)
**Date**: 2026-05-20
**Outcome**: 3 P1 findings (all confidence 8-9/10) **RESOLVED via Q-AUDIT-5 ALL Option A**

---

## Step 0 — Scope Challenge

### 1. Existing code partial coverage
- `routing/decision_rules.yaml` (Phase 3.4 SHIPPED 30/30 100% hit rate) — 已含 routing engine baseline, v2.0 capabilities.yaml 在此基础上扩展 (NOT 平行重建)
- `workflows/plan-feature/workflow.yaml` (v1.0 SHIPPED, 40L) + `workflows/execute-task/phases.yaml` (28L) — 已含 mock reference, v2.0 在此基础上加 gate / on / capability 字段
- `src/cli/lib/packagePath.ts` (v1.0.1 NEW `getPackageRoot()`) — Pure bundled distribution 解析基础, v2.0 直接复用

### 2. Minimum changes for stated goal
- 16 R20.x scope **理论可削减** (e.g., R20.14 special-purpose tools 可推 v2.1 patch per D-07 ADR cadence)
- 但 user Q-AUDIT-2/3 **明确 ALL 升 v2.0**, **不重新仲裁**
- 16 R20.x = "三层栈完整机器化" 最小可交付集 (用户原话: "我们的项目最终目的就是要实现大于等于我目前三层栈完整开发流程")

### 3. Complexity check ⚠️ TRIGGERS (8+ files OR 2+ new classes/services)
- **预计文件数**: 25+ (4 workflow.yaml v2 + 6 judgments/ yaml + capabilities.yaml + checkAgentTeams.ts + judgmentResolver.ts + setup.ts patch + doctor.ts patch + 4 ADR + CHANGELOG + README + 5+ test files)
- **新增类/服务**: judgmentResolver / exprBuilder / checkAgentTeams / planning-with-files invoke wrapper ≥ 4
- **Verdict**: 复杂度合理 — architectural refactor inherent。**不重提 scope reduction** (user Q-AUDIT-4 已锁 6 phase scope, 拆分以分摊复杂度)

### 4. Search check (Boring by default)
- **expr-eval** ✅ Layer 1 boring tech: 4M weekly, MIT, ~5KB, single-source-of-truth parser+eval。无 Node.js built-in 安全替代 (eval / Function constructor 安全风险高)。Verdict: ✅ 选型合理
- **planning-with-files** ⚠️ Layer 1 finding: Wave A research 显示 npm registry 404 — 实际是 Claude Code plugin slash cmd `/plan`, NOT npm SDK。Q-AUDIT-5a reframe 已 fix
- **Agent Teams settings.json** ✅ Layer 1: Claude Code first-party feature, env var schema `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 是 first-party 文档化路径 (sister `~/.claude/rules/agent-teams.md` L7 prereq)。Q-AUDIT-5b schema fix 已 amend
- **judgments/ multi-file expr-eval ref resolve**: 无 boring 替代 — TypeBox 解 JSON Schema 但不解 yaml file boundary。Q-AUDIT-5c judgmentResolver.ts ~60L NEW 是最小自实装合理

### 5. TODOS cross-reference
- `docs/WORKFLOW.md` v0.5+ 路线图 (3 entry: plan-feature 自动 gsd-* spawn / verify-work 自动 / 4-stage 完整自动) = v2.0 actual ship 反映, **无 conflict**
- `.planning/STATE.md § P1/P2 DEFERRED post-v1.0` carry-forward (#BC #BD #BE #BF #BJ #BK) — 全 post-v1.0 maintenance items, **v2.0 不阻塞** (推 organic clock end ~2026-11 evaluate per ADR 0020)

### 6. Completeness check (Boil the Lake)
- Phase v2.0-2.5 4-stage 机器化 dogfood end-to-end ✅ Boil the Lake (1 real harnessed phase 跑完 4 stage + 16 R20.x 全集触发)
- Q-AUDIT-5a planning-with-files reframe ✅ Boil the Lake (拒绝 fs.writeFile self-impl shortcut, 用 first-party plugin)
- Q-AUDIT-5b Agent Teams env check ✅ Boil the Lake (doctor + setup 两路径全 wire, 引导文案完整)

### 7. Distribution check
- npm publish + GitHub Releases existing path 沿袭 (v1.0 publish.yml + OIDC + sigstore provenance + NPM_TOKEN fallback per ADR 0023), v2.0 不引入新 artifact
- **Verdict**: ✅ 无新 distribution work

### Scope verdict
**复杂度合理, scope locked at 16 R20.x + 6 phase, NOT propose reduction**。User Q-AUDIT 已锁,sister skill "Once user accepts scope, commit fully。

---

## Section 1 — Architecture Review (3 findings, all RESOLVED Q-AUDIT-5)

### [P1] (confidence: 9/10) `planning-with-files` SDK terminology drift
**File ref**: `.planning/REQUIREMENTS.md § R20.15` + `phase-v2.0-2.1/2.1-CONTEXT.md § D-15`

**Issue**: R20.15 + D-15 acceptance text 写 "真接 planning-with-files **SDK** call (NOT mock)"。Wave A 实证: npm registry verified 404 — `planning-with-files` 是 Claude Code **plugin** with slash cmd `/plan` (sister https://github.com/OthmanAdi/planning-with-files), NOT npm package SDK。R20.15 acceptance text 字面**不可满足**。

**Blast radius**: Phase 2.4 plan-feature workflow.yaml v2 phase 05-persist 实装错向 — researcher 显式拒绝 fs.writeFile self-impl path (sister Wave A § 5.3)。如果 Phase 2.4 按错误 acceptance 实装, Wave C plan-check OR Phase 2.5 dogfood 必 reject 重做。

**Recommendation**: Reframe R20.15 acceptance:
- (a) capabilities.yaml planning-with-files entry `{impl: claude-code-plugin, cmd: /plan, requires: {plugin: planning-with-files >=2.2.0}}`
- (b) workflow.yaml phase 05-persist `invokes: '{{ capabilities.planning-with-files.cmd }}'` 模板插值
- (c) Claude Code plugin 真生成 3 file
- (d) dogfood test verify

**Resolution**: ✅ **Q-AUDIT-5a Option A LOCKED** — R20.15 + D-15 + CONTEXT.md amend applied 2026-05-20。

**Prior learning applied**: terminology drift pattern (sister Phase 1.2.5 SISTER-REVIEW.md 5-recurrence — 多次发现 schema text vs implementation reality drift)。confidence 9/10

---

### [P1] (confidence: 9/10) Agent Teams settings.json schema 错误
**File ref**: `.planning/phase-v2.0-2.1/2.1-CONTEXT.md § D-11 L101` + `.planning/REQUIREMENTS.md § R20.11`

**Issue**: D-11 + R20.11 文案写 `~/.claude/settings.json` 含 `"experimental": {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"}` (nested experimental key)。Wave A 实证本地 `~/.claude/settings.json`: 实际 schema 是 root-level `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS == "1"` (NOT nested experimental.*)。

**Blast radius**: Phase 2.3 实装 `harnessed doctor` + `harnessed setup` Agent Teams check 按错误 schema 路径 → **所有 user 收到 false-negative warning** ("Agent Teams 未启用") 即使已启用。

**Recommendation**: Amend R20.11 + D-11 schema text + capabilities.yaml entry `requires` field schema:
- check `~/.claude/settings.json` root-level `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS == "1"` (NOT nested experimental.*)
- 引导文案 `claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1` (verified syntax)
- NEW `src/cli/lib/checkAgentTeams.ts` ~30L + 5 fixture test (per Wave A § 4)

**Resolution**: ✅ **Q-AUDIT-5b Option A LOCKED** — R20.11 + D-11 + CONTEXT.md amend applied 2026-05-20。

---

### [P2] (confidence: 8/10) judgments/ multi-file 缺 judgmentResolver.ts
**File ref**: `.planning/REQUIREMENTS.md § R20.4` + `phase-v2.0-2.1/2.1-CONTEXT.md § D-04/D-16`

**Issue**: D-04 (Q4 RESET) + D-16 (Q-AUDIT-3 annotation) 假设 expr-eval 直接 eval `judgments.<file>.<gate>.fires` 4 层 ref (e.g., `judgments.strategic-gate.fires`)。expr-eval 实际 grammar: 只解 single namespace map (`{phase: {type: '...'}}`), 不理解 file boundary。

**Blast radius**: Phase 2.3 Wave 0 schema 实装 workflow.yaml gate 字段 runtime resolve 时, expr-eval `Parser.parse('judgments.strategic-gate.fires')` 求值会按 phase fact context 找 `judgments.strategic-gate.fires` 变量 (找不到 → undefined → false-negative gate 总是 skip)。

**Recommendation**: Phase 2.3 Wave 0 schema 拓扑**必含** `src/workflow/judgmentResolver.ts` ~60L NEW:
- input: workflow.yaml gate field e.g., `judgments.strategic-gate.fires`
- 4-level ref split: `['judgments', 'strategic-gate', 'fires']`
- read `judgments/strategic-gate.yaml` → resolve `triggers.strategic-gate.fires_when`
- output: resolved expression string → pass to expr-eval Parser
- TypeBox schema validate

**Resolution**: ✅ **Q-AUDIT-5c Option A LOCKED** — R20.4 acceptance (c) sub-item judgmentResolver.ts ~60L NEW added 2026-05-20。

---

## Section 2 — Code Quality Review (高层级 — code 未写, defer Phase 2.3 实装时 review)

**Anti-skip rule** sister: "If a section genuinely has zero findings, say 'No issues found' and move on — but you must evaluate it"。

**Finding**: 当前 phase = plan-phase pre-implementation, 实际 code 未写。Plan 文件 = output of plan-phase Wave B, 暂未存在。

**Defer to**: Phase 2.3 Wave 0+1+2 实装 mid-cycle code review (sister code-review skill OR /review slash cmd per CLAUDE.md Verify 阶段)。

**No issues found in section 2 — defer to Phase 2.3 execute mid-cycle code review。**

---

## Section 3 — Tests Review (高层级 — tests 未写, defer)

**Finding**: 16 R20.x acceptance criteria 全数显式包含 dogfood test:
- R20.10 (d) dogfood test: execute-task 触发 ralph-loop 子任务真转一圈 ≥1 iteration 至 COMPLETE
- R20.11 (f) dogfood test: 触发某 phase 升级 Agent Teams 路径全程 round-trip
- R20.12 (d) dogfood test 关键模块场景触发 gstack /review + 4-specialist Agent Team 全 round-trip
- R20.13 (d) dogfood test 核心算法子任务自动 invoke TDD workflow
- R20.14 (c) dogfood test UI/E2E/web search 场景触发对应 special tool
- R20.15 (d) dogfood test /plan-feature 后 .planning/<phase-id>/ 含 3 file
- R20.16 (f) dogfood test 3 fallback 触发场景验证

**Strong**: Phase 2.5 4-stage 机器化 dogfood 是 1 real harnessed phase 跑完 4 stage + 16 R20.x 全集触发 (sister Phase 4.3 v0.4.0 DOGFOOD-T2.X 60L pattern 沿袭)。**完整端到端 dogfood 覆盖 16 R20.x acceptance, sister "Well-tested code is non-negotiable, I'd rather have too many tests than too few" 评价标准达成。

**No additional test gaps identified in section 3。**

---

## Section 4 — Performance Review (高层级)

### [LOW] (confidence: 6/10) expr-eval AST 求值 hot path 性能
**Concern**: Phase 2.5 dogfood 端到端跑完 4 stage 触发 ≥16 R20.x gate eval × N workflow phase invoke = expr-eval Parser.parse + evaluate 总调用可能 100+ 次/dogfood

**Wave A research**: expr-eval ~5KB MIT 4M weekly, 性能 benchmark 无负面信号。Phase fact context inject 是 hot path — Parser cache + evaluate fast path 即可。

**Recommendation**: Phase 2.3 Wave 0 schema 实装 `src/workflow/exprBuilder.ts` 时:
- Parser 实例 cache (避免重复 Parse 同 expression)
- evaluate 用 prepared context object (NOT 每次 deep merge)

**Status**: Phase 2.3 实装时验证, dogfood Phase 2.5 收集 timing 数据 (sister R8.3 perf attribution pattern)。NO 当前 phase action。

---

## Section 5 — Distribution / DX (高层级)

### [PASS] npm publish 沿袭 (R20.9 release notes only)
- 沿袭 ADR 0023 OIDC + sigstore provenance + NPM_TOKEN fallback
- BREAKING CHANGES end-user 升级 = `npm install -g harnessed@2.0 && harnessed setup --apply` 一行 (per Q5 D-05)
- **No distribution-related architecture risk identified。**

### [LOW] Agent Teams enable 引导 UX
**Concern**: Missing `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 时 setup.ts warn 文案 should 友好 + actionable

**Recommendation**: Phase 2.3 实装 checkAgentTeams.ts warn 文案:
```
⚠️ Agent Teams 未启用 — parallelism-gate 升级路径不可用
   修复: claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1
   说明: harnessed v2.0 三层栈方法论 parallelism-gate 升级路径需 CC 2.1.133+ Agent Teams enable (sister ~/.claude/rules/agent-teams.md)
```

**Status**: Phase 2.3 实装时 wire。NO 当前 phase action。

---

## Implementation Tasks (input to Phase v2.0-2.2 Wave B planner)

由本次 eng review 浮出, Wave B planner **必须**纳入 PLAN.md task graph:

1. **Phase 2.3 Wave 0 task**: `src/workflow/judgmentResolver.ts` ~60L NEW (Q-AUDIT-5c) — 4 层 ref split + read judgments/<file>.yaml + resolve triggers.<gate>.fires_when + pass to expr-eval + TypeBox schema validate
2. **Phase 2.3 Wave 0 task**: `src/cli/lib/checkAgentTeams.ts` ~30L + 5 fixture test (Q-AUDIT-5b) — root-level `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` check
3. **Phase 2.3 Wave 0 task**: wire checkAgentTeams.ts 至 setup.ts (Step B 之前 OR 之后) — missing → warn + actionable 引导
4. **Phase 2.4 Wave task**: plan-feature workflow.yaml phase 05-persist `invokes: '{{ capabilities.planning-with-files.cmd }}'` 模板插值 (Q-AUDIT-5a) — NOT npm SDK call NOT fs.writeFile self-impl
5. **Phase 2.4 Wave task**: capabilities.yaml planning-with-files entry `{impl: claude-code-plugin, cmd: /plan, requires: {plugin: planning-with-files >=2.2.0}}` (Q-AUDIT-5a)
6. **Phase 2.4 Wave task**: capabilities.yaml agent-teams-enabled entry `{impl: claude-code-builtin, requires: {settings_env_var: env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS == "1"}}` (Q-AUDIT-5b)
7. **Phase 2.3 Wave 1 task**: `src/workflow/exprBuilder.ts` Parser cache (Section 4 LOW perf recommendation)
8. **Phase 2.6 close task**: ADR 0027+ errata 节 — planning-with-files SDK→plugin terminology drift fix history (sister ADR 0011 errata pattern)

---

## GSTACK REVIEW REPORT

**Reviewer**: Claude Opus 4.7 acting as Paranoid Staff Engineer
**Review depth**: Step 0 + Section 1-5 full (Section 2-3 defer per pre-implementation)
**Plan accepted**: ✅ YES (with 3 P1 finding RESOLVED + 8 implementation tasks added to Wave B input)
**Confidence**: 9/10 plan ready for Phase v2.0-2.2 Wave B planner spawn

**Critical recommendations preserved**:
- Q-AUDIT-5a planning-with-files terminology drift FIX (HIGH 9/10) ✅ LOCKED
- Q-AUDIT-5b Agent Teams settings.json schema FIX (HIGH 9/10) ✅ LOCKED
- Q-AUDIT-5c judgmentResolver.ts NEW (MED 8/10) ✅ LOCKED

**Boring by default verdict**: ✅ all 3 P1 fix path 选 boring tech (Claude Code plugin first-party / first-party settings.json env / TypeScript self-impl 最小 60L resolver)。

**Blast radius mitigation**: 3 P1 finding 已 resolve via Q-AUDIT-5 amend Phase 2.1 artifacts, **不再 propagate Phase 2.3+ 实装**。

---

## Next Steps — Review Chaining

- ✅ Phase 2.1 amend commit (REQUIREMENTS + CONTEXT.md + DISCUSSION-LOG.md + STATE.md per Q-AUDIT-5 fix)
- ✅ PLAN-ENG-REVIEW.md ship (本文件) 写入 `.planning/phase-v2.0-2.2/` (Phase 2.2 prep artifact)
- ⏳ Phase v2.0-2.2 Wave B planner spawn (gsd-planner) — input: CONTEXT.md (amended) + REQUIREMENTS R20 (amended) + RESEARCH.md (Wave A) + PLAN-ENG-REVIEW.md (本文件)
- ⏳ Phase v2.0-2.2 Wave C plan-checker (gsd-plan-checker) iter max 3
- ⏳ Phase v2.0-2.3+ execute (4 phase 拆包)

---

## Capture Learnings

**Operational learning (1)**: gstack /plan-eng-review skill SKILL.md 40K+ token 不能整 Read, 必须 Grep 提取 BEFORE YOU START + Review Sections + Required Outputs 关键段 — sister technique 沿袭 manifests/skill-packs/ui-ux-pro-max.yaml Read 40K+ 错误处理。
- confidence 9/10 (操作复用)

**Architectural learning (1)**: 三层栈 strict cadence 不仅 Phase 启动前 mandatory, Wave A research 浮出 risk 触发 mid-cycle gstack /plan-eng-review 也 mandatory (sister CLAUDE.md "复杂架构前 ⚠️ 必须" 双触发判据 — 启动 OR research surfaced)。
- confidence 8/10 (用户透明声明 ack)

---

*Reviewer: Claude Opus 4.7 Paranoid Staff Eng*
*Phase: v2.0-2.2 Wave A → eng-review intermediate ship*
*Date: 2026-05-20*
*Outcome: 3 P1 finding all RESOLVED Q-AUDIT-5 ALL Option A — plan accepted, ready for Wave B planner*
