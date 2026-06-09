# Phase v2.0-2.2 PLAN — v2.0 Architecture Refactor Execution

---
status: ready-to-execute
phase: v2.0-2.2 plan
target_phases: [v2.0-2.3, v2.0-2.4, v2.0-2.5, v2.0-2.6]
created: 2026-05-20
created_by: gsd-planner Wave B
total_tasks: 32
total_waves_per_phase: variable (W0-W3 per phase)
estimated_duration_days: 7-14 (target window 2026-05-20 ~ 2026-06-05)
inputs:
  - .planning/phase-v2.0-2.1/2.1-CONTEXT.md (16 D-decision LOCKED + Q-AUDIT-5 3 schema fix)
  - .planning/phase-v2.0-2.1/2.1-DISCUSSION-LOG.md (Q1-Q8 + Q-AUDIT 4-batch + Q-AUDIT-5 3-batch + 22 Locked Outcomes)
  - .planning/REQUIREMENTS.md § R20.1-R20.16 (16 R20.x; R20.6 DROPPED)
  - .planning/phase-v2.0-2.2/RESEARCH.md (1058L Wave A, 8 focus area)
  - .planning/phase-v2.0-2.2/PLAN-ENG-REVIEW.md (gstack /plan-eng-review, 3 P1 RESOLVED + 8 implementation tasks)
  - .planning/ROADMAP.md § v2.0 chapter (6 phase + 16 必含项 + 5 关键风险)
  - .planning/STATE.md (v2.0 milestone 1/6 IN PROGRESS)
  - docs/adr/0011-execute-task-sdk-ralph.md (sister ralph-loop 9-section pattern)
  - docs/adr/0023-npm-publish-release-process.md (sister v1.0 publish.yml + OIDC + sigstore)
---

## Goal

v2.0 完成 4 项 architectural shift:
(1) **Pure bundled SoT distribution** (D-01): `<packageRoot>/workflows/` readonly end-user share-only, maintainer ship 三层栈方法论给其他 user via bundled defaults, 升级走 ADR + npm patch release 2-3 day cycle 取代 1-2 week major cycle。
(2) **Capability abstraction + judgment engine** (D-02 + D-03 + D-04 + D-16): capabilities.yaml flat yaml map (~35 entry) + judgments/ 6 file 分类 (strategic / phase / subtask / parallelism / tdd / fallback) + expr-eval npm dep 解析 yaml-eval gate + judgmentResolver.ts 4 层 ref 预解析 + TypeBox schema validate。
(3) **4 workflows 完整 4-stage 三层栈机器化** (D-08 + D-10 + D-12 + D-15): 在原有 plan-feature + execute-task 基础上 ship 2 NEW workflows (research + verify-work full 4-stage), plan-feature phase 05-persist 真接 planning-with-files plugin slash cmd `/plan` (NOT npm SDK per Q-AUDIT-5a), execute-task 真接 ralph-loop completion-promise gate, verify-work 7+ phase serial + 并行 + conditional 升级 4-specialist Agent Team (sister agent-teams.md Pattern C)。
(4) **三层栈完整 dogfood + 端到端 verification** (R20.10-R20.16): parallelism-gate + Agent Teams 路由 (root-level env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS per Q-AUDIT-5b) + tdd-gate + special-purpose tools (13+ entry) + fallback 3 铁律 runtime 实装 + 1 个真实 phase 跑完 4 stage 触发 16 R20.x 全集。

**16 R20.x → task mapping**: 每条 R20.x 至少 1 task 实装 + 1 task acceptance verify (详 § Acceptance Backward Mapping)。

## Risks & Mitigations

| # | Risk | Source | Mitigation |
|---|------|--------|-----------|
| **R1** | planning-with-files terminology drift (HIGH 9/10 per PLAN-ENG-REVIEW) — npm registry 404 verified, 是 Claude Code plugin NOT npm SDK | Q-AUDIT-5a + RESEARCH § 5 + § 9.1 | D-15 reframe LOCKED: `{impl: claude-code-plugin, cmd: /plan, requires: {plugin: planning-with-files >=2.2.0}}` + workflow.yaml `invokes: '{{ capabilities.planning-with-files.cmd }}'` 模板插值 + Phase 2.4 T2.4.W1.3 显式拒绝 fs.writeFile self-impl |
| **R2** | Agent Teams settings.json schema 错误 (HIGH 9/10) — CONTEXT.md L101 旧写 nested `experimental.*`, 本地实测是 root-level `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS == "1"` | Q-AUDIT-5b + RESEARCH § 4 + § 9.4 | D-11 schema fix LOCKED + Phase 2.3 T2.3.W0.5 NEW `src/cli/lib/checkAgentTeams.ts` ~30L + 5 fixture test + setup.ts (Phase 2.3) + doctor.ts (Phase 2.4 MIN 5→MIN 7) 双 wire |
| **R3** | judgments/ 多 file expr-eval reference path 4 层深 — expr-eval 不理解 file boundary, `judgments.<file>.<gate>.fires` native eval undefined → silent NOOP | Q-AUDIT-5c + RESEARCH § 6.3 + § 9.3 | Phase 2.3 T2.3.W0.4 NEW `src/workflow/judgmentResolver.ts` ~60L: split 4 段 → readFile `judgments/<file>.yaml` → resolve `triggers.<gate>.fires_when` → pass to expr-eval Parser + TypeBox validate |
| **R4** | ralph-loop max-iterations 耗尽 fallback path silent abort 风险 (R20.10 acceptance 'explicit NOT silent') | RESEARCH § 7.2 + ADR 0011 D-04 | Phase 2.4 T2.4.W1.2 workflow engine catch handler `MaxIterationsExceededError` + stderr UX text (4 manual options A/B/C + exit 1) + `tests/workflow/ralph-fallback.test.ts` 5 fixture verify |
| **R5** | upstream capability drift (Pure bundled D-07) — 上游升级 cadence ~1-2/week 需 patch release follow, ADR 0024+ + ci.yml A7 step iter 失控风险 | RESEARCH + ROADMAP v2.0 关键风险 | Phase 2.6 ADR 0024-0029 backfill template 沿袭 ADR 0023 9-section pattern + ci.yml A7 step iter 0023→0029 (single extend NOT retroactive sister Phase 5.2 W2 T2.7 0021→0022 + Phase 6.1 W2 T2.2 0022→0023 pattern) |

## Dependencies Graph

```
Phase v2.0-2.2 plan-phase (本 phase Wave B planner ship 本 PLAN.md)
    │
    ▼ (Wave C plan-checker iter max 3 后)
Phase v2.0-2.3 execute schema
    ├─ Wave 0: foundation (expr-eval dep + capabilities.yaml + judgments/ 6 file + judgmentResolver + checkAgentTeams)
    │   ├─ T2.3.W0.1 [S] capabilities.yaml v2.0 baseline ~35 entry
    │   ├─ T2.3.W0.2 [M] judgments/ 6 file ship
    │   ├─ T2.3.W0.3 [M] expr-eval npm dep install + exprBuilder.ts
    │   ├─ T2.3.W0.4 [M] judgmentResolver.ts ~60L NEW (Q-AUDIT-5c) — 必含
    │   ├─ T2.3.W0.5 [S] checkAgentTeams.ts ~30L NEW + 5 fixture (Q-AUDIT-5b) — 必含
    │   └─ T2.3.W0.6 [S] TypeBox schema validate (capabilities + judgments + phaseFactContext)
    ├─ Wave 1: integration (setup.ts patch + defaults.yaml)
    │   ├─ T2.3.W1.1 [S] setup.ts wire checkAgentTeams() + capabilities.yaml + judgments/ + defaults.yaml install
    │   ├─ T2.3.W1.2 [S] defaults.yaml ship (ralph_max_iterations table per RESEARCH § 7.1)
    │   └─ T2.3.W1.3 [S] phaseFactContext.ts ~80L NEW (TypeBox typed shape)
    └─ Wave 2: ADR + close
        └─ T2.3.W2.1 [S] Phase 2.3 ship cadence (RETROSPECTIVE entry + STATE update + git commit baseline)
    │
    ▼
Phase v2.0-2.4 execute workflows (4 workflow.yaml v2)
    ├─ Wave 0: schema v2 baseline
    │   └─ T2.4.W0.1 [S] workflow.yaml schema v2 TypeBox (gate / on / capability / args / fallback 字段)
    ├─ Wave 1: existing 2 workflows upgrade
    │   ├─ T2.4.W1.1 [M] workflows/execute-task/phases.yaml v2 — ralph-loop 真接 + tdd-gate + mattpocock route
    │   ├─ T2.4.W1.2 [M] workflow engine catch handler — MaxIterationsExceededError + UX text + exit 1
    │   └─ T2.4.W1.3 [M] workflows/plan-feature/workflow.yaml v2 — planning-with-files plugin slash cmd 真接 (Q-AUDIT-5a)
    ├─ Wave 2: 2 NEW workflows
    │   ├─ T2.4.W2.1 [L] workflows/research/workflow.yaml NEW — Tavily/Exa/ctx7 多源 fan-out + GSD discuss synth
    │   └─ T2.4.W2.2 [L] workflows/verify-work/workflow.yaml NEW — 7+ phase full 4-stage (gsd-verify-work + gsd-progress + code-review 并行 + gstack /review conditional + 可选 /qa /cso /design-review + code-simplifier + 4-specialist Agent Team upgrade conditional)
    └─ Wave 3: dogfood prep
        └─ T2.4.W3.1 [S] doctor.ts MIN 5→MIN 7 wire checkAgentTeams + planning-with-files plugin presence check
    │
    ▼
Phase v2.0-2.5 execute 4-stage 机器化 dogfood
    ├─ Wave 1: Cycle 1 — parallelism-gate + fallback (R20.11 + R20.16)
    │   └─ T2.5.W1.1 [M] parallelism-gate dogfood + Agent Teams round-trip + DOGFOOD-T5.1.md
    ├─ Wave 2: Cycle 2 — verify-work 4-specialist Agent Team (R20.12 + R20.11 + R20.14)
    │   └─ T2.5.W2.1 [M] verify-work full 4-stage dogfood + 4-specialist team Pattern C + DOGFOOD-T5.2.md
    ├─ Wave 3: Cycle 3 — tdd-gate + planning-with-files + ralph-loop (R20.13 + R20.15 + R20.10)
    │   └─ T2.5.W3.1 [M] TDD 自动 invoke + /plan 真生 3 file + ralph-loop COMPLETE round-trip + DOGFOOD-T5.3.md
    ├─ Wave 4: Cycle 4 — special-purpose tools + mattpocock + fallback 3 铁律 (R20.8 + R20.9 + R20.14 + R20.16)
    │   └─ T2.5.W4.1 [M] mattpocock /grill-with-docs auto-invoke + user explicit override + chain isolation + DOGFOOD-T5.4.md
    └─ Wave 5: Cycle 5 — aggregate integration
        └─ T2.5.W5.1 [M] DOGFOOD-T5.X.md 5-axis report (16 R20.x all triggered trace)
    │
    ▼
Phase v2.0-2.6 close + ship 🎯 v2.0.0 GA
    ├─ Wave 0: ADR backfill (per ADR 0011 9-section pattern × 6)
    │   ├─ T2.6.W0.1 [M] ADR 0024 — workflow schema v2 + capability abstraction (D-01 + D-02 + D-09)
    │   ├─ T2.6.W0.2 [M] ADR 0025 — capabilities.yaml v2.0 baseline + static manifest discipline (D-07 + D-14)
    │   ├─ T2.6.W0.3 [M] ADR 0026 — judgments/ 6 file + expr-eval + judgmentResolver (D-03 + D-04 + D-16 + Q-AUDIT-5c)
    │   ├─ T2.6.W0.4 [M] ADR 0027 — research + verify-work NEW workflows (D-08 + D-12 + planning-with-files plugin reframe errata)
    │   ├─ T2.6.W0.5 [M] ADR 0028 — ralph-loop + TDD + Agent Teams 路由 (D-10 + D-11 + D-13 + Q-AUDIT-5b schema fix errata)
    │   └─ T2.6.W0.6 [S] ADR 0029 — fallback 3 铁律 runtime + 4-stage 机器化 (R20.16 + Phase 2.5 dogfood)
    ├─ Wave 1: ship artifacts
    │   ├─ T2.6.W1.1 [S] CHANGELOG.md [2.0.0] BREAKING CHANGES + 升级一行指令 + schema v1→v2 字段差异
    │   ├─ T2.6.W1.2 [S] ci.yml A7 step iter 0023→0029 single extend
    │   ├─ T2.6.W1.3 [S] package.json 1.0.4 → 2.0.0 (semver major bump per D-05)
    │   ├─ T2.6.W1.4 [S] README.md v2.0 feature highlight + docs/WORKFLOW.md v0.5+ 路线图全部 ship 反映 in v2.0
    │   └─ T2.6.W1.5 [S] RETROSPECTIVE.md v2.0 milestone close + cross-milestone trend (sister v0.4/v0.5/v1.0 close pattern reuse)
    ├─ Wave 2: milestone close
    │   ├─ T2.6.W2.1 [S] `.planning/milestones/v2.0-MILESTONE-AUDIT.md` ship (sister v1.0 audit format reuse)
    │   └─ T2.6.W2.2 [S] milestone tag triple LOCAL CREATE (v2.0.0-alpha.1 post Phase 2.4 + v2.0.0-rc.1 post Phase 2.5 + 🎯 v2.0.0 GA)
    └─ Wave 3: publish
        └─ T2.6.W3.1 [S] publish.yml tag-trigger npm publish (sister ADR 0023 OIDC + sigstore pattern) — user push approval required

并行机会:
- Phase 2.3 Wave 0 T2.3.W0.1 (capabilities) ↔ T2.3.W0.2 (judgments) ↔ T2.3.W0.3 (expr-eval) 三 task 文件独立可并行
- Phase 2.4 Wave 1 ↔ Wave 2 部分并行 (existing upgrade 与 NEW workflows 文件无 overlap)
- Phase 2.5 各 Cycle (Wave 1-4) 串行执行 (依赖 Phase 2.3+2.4 完成); Wave 5 aggregate 串行

依赖硬要求:
- Phase 2.4 所有 task 依赖 Phase 2.3 W0 全 ship (capabilities + judgments + exprBuilder + judgmentResolver)
- Phase 2.5 所有 task 依赖 Phase 2.4 全 ship (4 workflow.yaml v2)
- Phase 2.6 ADR backfill 必须 Phase 2.3+2.4+2.5 全 ship 之后 (capture learnings from actual impl)
- T2.6.W2.2 milestone tag triple 依赖 Phase 2.5 DOGFOOD-T5.X.md PASS (rc.1 only if dogfood PASS; GA only if all artifacts ship)
```

---

## Wave 拓扑 by phase

### Phase v2.0-2.3 execute schema (~7-9 task)

**Goal**: ship capabilities.yaml + judgments/ 6 file + expr-eval + judgmentResolver + checkAgentTeams + TypeBox schema 全集; Phase 2.4 workflow.yaml v2 可消费的所有 schema + helper 就绪。

#### Wave 2.3.W0 schema foundation (并行可能)

##### T2.3.W0.1 [S] capabilities.yaml v2.0 baseline ~35 entry
- **Files**: `workflows/capabilities.yaml` NEW (target ~250-300L 多 entry 不可避免, 接受 split 3 commit pattern per RESEARCH § 2.4)
- **Action**: 创建 flat yaml map per D-02 schema = `capabilities: { <name>: {impl, cmd, since, description, fires_when?, requires?, plugin_path?, aliases?} }`. 顶部 `schema_version: harnessed.capabilities.v1` (sister Phase 2.2 schemaVersion 7 surface convention)。Entry 含 (per RESEARCH § 2):
  - **mattpocock 12 高频招式** (per D-09): grill-with-docs / zoom-out / diagnose / caveman / grill-me / tdd / to-prd / to-issues / improve-codebase-architecture / code-review / code-simplifier / investigate (剩 11 招式 `since: v2.x` 标 manifest-only)
  - **special-purpose tools 13+** (per D-14): ui-ux-pro-max / frontend-design / playwright-cli / playwright-test (@playwright/test) / webapp-testing / chrome-devtools-mcp / ctx7 / tavily-mcp / exa-mcp / gsd-review / gsd-debug / gsd-progress / gsd-verify-work
  - **gstack 治理关卡** (per D-12): gstack-office-hours / gstack-plan-ceo-review / gstack-review (Paranoid Staff Eng) / gstack-qa / gstack-cso / gstack-design-review
  - **核心 capability**: tdd (impl: superpowers, cmd: superpowers:test-driven-development, aliases: [{impl: mattpocock-skills, cmd: /tdd}]) / planning-with-files (impl: claude-code-plugin, cmd: /plan, requires: {plugin: planning-with-files >=2.2.0}, plugin_path 字段) per Q-AUDIT-5a reframe / ralph-loop (impl: bundled-skill, cmd: ralph-loop, sdk_ref: src/routing/lib/ralphLoop.ts) per D-10 / superpowers-brainstorming (impl: superpowers)
  - **Agent Teams 5 升级触发**: agent-teams-create (impl: claude-platform, cmd: TeamCreate, requires: {settings_env_var: env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS == "1", cc_version: ">=2.1.133"}, fires_when array: teammate_send_message_needed / subagent_context_overflow / shared_task_list / opposing_hypothesis_debate / fullstack_three_way) per Q-AUDIT-5b root-level env / agent-teams-send-message / agent-teams-shutdown
- **Acceptance**:
  - (a) ≥ 35 entry shipped, 覆盖 mattpocock 12 + special-purpose 13 + gstack 6 + 核心 4 + Agent Teams 3 buckets
  - (b) TypeBox `Type.Record(Type.String(), CapabilityEntry)` validate pass (T2.3.W0.6 schema validate task verify)
  - (c) `planning-with-files` entry impl 字段 = `claude-code-plugin` (NOT `npm-sdk`) per Q-AUDIT-5a; `agent-teams-create` requires 字段 = `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` (root-level) per Q-AUDIT-5b
  - (d) `tdd` entry 含 `aliases` 字段 list 2 impl 候选 per D-13
- **Depends on**: none (Wave 0 entry, 与 T2.3.W0.2 + T2.3.W0.3 三 task 文件独立可并行)
- **R**: R20.2 (主) + R20.8 (D-09 mattpocock) + R20.13 (D-13 tdd) + R20.14 (D-14 special-purpose) + R20.11 (D-11 Agent Teams requires schema) + R20.15 (D-15 planning-with-files reframe)
- **Implementation Tasks (PLAN-ENG-REVIEW)**: #5 (planning-with-files entry) + #6 (agent-teams-enabled entry)

##### T2.3.W0.2 [M] judgments/ 6 file ship
- **Files**: `workflows/judgments/strategic-gate.yaml` NEW + `phase-gate.yaml` NEW + `subtask-gate.yaml` NEW + `parallelism-gate.yaml` NEW + `tdd-gate.yaml` NEW + `fallback.yaml` NEW (target each ~50-80L)
- **Action**: per D-04 + D-16 multi-file 分类 (rule-style sister `~/.claude/rules/*.md`), 各 file 顶部 `schema_version: harnessed.judgment.v1` + `triggers: { <name>: {description, fires_when, skips_when?, invokes?, requires?, fallback_action?} }` (per RESEARCH § 6.2 verbatim schema)。机器化 ~/.claude/CLAUDE.md 「澄清/审查触发判据」节 verbatim:
  - **strategic-gate.yaml** triggers: office-hours (`fires_when: phase.type in ['new_project', 'new_milestone', 'new_feature']` / `skips_when: phase.type in ['bug_fix', 'tech_debt', 'continuing_phase'] OR phase.scope_locked_in_history == true`) + plan-ceo-review
  - **phase-gate.yaml** triggers: gsd-discuss-phase (`fires_when: phase.open_decisions >= 2 OR phase.has_cross_phase_data_flow == true OR phase.scope_days > 1` / `skips_when: phase.single_task == true OR phase.scope_days < 1`)
  - **subtask-gate.yaml** triggers: brainstorming (`fires_when: subtask.approaches >= 2 OR subtask.core_algorithm == true OR subtask.has_api_contract == true OR subtask.error_cost == 'high'` / `skips_when: subtask.type in ['crud', 'standard_lib_call'] OR subtask.lines < 20`)
  - **parallelism-gate.yaml** triggers: subagent-default (`subtask.parallel_count <= 3 AND subtask.communication_needed == false`) + main-session-fallback (`subtask.lines < 20 OR subtask.type == 'single_command_query'`) + agent-teams-upgrade (5 fires_when OR-chain) + ralph-loop-wrapper (orthogonal wraps array per R20.10) per D-11
  - **tdd-gate.yaml** triggers: tdd-strongly-suggested (6 fires + 3 skips per D-13 verbatim)
  - **fallback.yaml** rules (NOT triggers): uncertain-skip-transparently + user-explicit-override (词法 6 signal: "先 brainstorm" / "跑 office-hours" / "讨论一下" / "office-hours" / "brainstorm" / "深度调研") + chain-isolation per R20.16 verbatim CLAUDE.md
- **Acceptance**:
  - (a) 6 file all ship, each pass `js-yaml.load()` parse 不抛错
  - (b) workflow.yaml gate field reference path `judgments.<file>.<gate>.fires` 在 T2.3.W0.4 judgmentResolver.ts ship 后可成功 resolve (验证 cross-file 6 reference 命中)
  - (c) fallback.yaml 3 rules 字段齐全 (fallback_action + override_signal[6 string] + chain_isolation: true)
  - (d) parallelism-gate.yaml agent-teams-upgrade `requires` 字段引用 `capabilities.agent-teams-create` per RESEARCH § 6.2
- **Depends on**: none (Wave 0 entry, 并行)
- **R**: R20.4 (主, D-04 + D-16) + R20.11 (parallelism-gate) + R20.13 (tdd-gate) + R20.16 (fallback 3 铁律)

##### T2.3.W0.3 [M] expr-eval npm dep install + src/workflow/exprBuilder.ts ~50L NEW
- **Files**: `package.json` MODIFY (+ `expr-eval` ~^2.0.2 dep) + `pnpm-lock.yaml` AUTO + `src/workflow/exprBuilder.ts` NEW ~50L + `tests/workflow/exprBuilder.test.ts` NEW ~80L (~10 fixture)
- **Action**: per D-03 + RESEARCH § 1.3 verbatim implementation:
  - `pnpm add expr-eval@^2.0.2` (实测 npm 实测 version 2.0.2 MIT zero-dep 145.6 KB unpacked; CONTEXT.md L34 "~5KB" 数据校正推 Phase 2.6 ADR 0025 errata 节)
  - `src/workflow/exprBuilder.ts` NEW: `import { Parser } from 'expr-eval'`; `new Parser({ operators: { add: false, subtract: false, multiply: false, divide: false, logical: true, comparison: true, in: true, assignment: false } })` (per Phase 2.2 STRIDE T-2.2-02 mitigation lockdown 防 yaml-injection 副作用); `evalGate(expr, ctx): boolean` 函数 try `parser.parse(expr).evaluate(ctx)` → boolean; throw `GateEvalError` on failure (workflow runtime catch + fallback skip per fallback.yaml uncertain-skip-transparently 铁律 1)
  - Parser instance cache (per PLAN-ENG-REVIEW Section 4 LOW perf recommendation) — module-level `const parser = new Parser(...)` 单例 (避免 hot-path Parser 重建); evaluate 用 prepared context object NOT 每次 deep-merge
  - 10 fixture: 5 syntax positive (==, !=, >=, <=, AND, OR, in, dot-access, string literal, mixed) + 3 negative (unbound variable / assignment attempt rejected / function call rejected) + 2 injection (e.g., `phase.type = 'admin'` 应抛 GateEvalError + `eval('process.exit')` 应抛)
- **Acceptance**:
  - (a) `expr-eval` in package.json `dependencies` (NOT devDependencies)
  - (b) `evalGate("phase.type == 'new_feature' AND phase.open_decisions >= 2", {phase: {type: 'new_feature', open_decisions: 3}})` returns `true`
  - (c) `evalGate("assignment_attempt = 1", {})` throws `GateEvalError`
  - (d) 10 fixture all pass: `pnpm test tests/workflow/exprBuilder.test.ts` exit 0
  - (e) Parser instance module-singleton (assert via `import { _parserSingleton } from 'src/workflow/exprBuilder.js'; expect(_parserSingleton).toBe(_parserSingleton)`)
- **Depends on**: none (Wave 0 entry, 并行)
- **R**: R20.3 (主)
- **Implementation Tasks (PLAN-ENG-REVIEW)**: #7 (exprBuilder.ts Parser cache, Section 4 LOW)

##### T2.3.W0.4 [M] src/workflow/judgmentResolver.ts ~60L NEW (Q-AUDIT-5c MANDATORY per PLAN-ENG-REVIEW)
- **Files**: `src/workflow/judgmentResolver.ts` NEW ~60L + `tests/workflow/judgmentResolver.test.ts` NEW ~100L (~12 fixture)
- **Action**: per Q-AUDIT-5c LOCKED + PLAN-ENG-REVIEW Implementation Task #1 + RESEARCH § 6.3 verbatim implementation:
  - `import { load as parseYaml } from 'js-yaml'` (sister Phase 2.1 reusable) + `import { evalGate } from './exprBuilder.js'` (T2.3.W0.3) + `import { readFile } from 'node:fs/promises'`
  - `resolveJudgmentGate(gateRef: string, ctx: PhaseFactContext, packageRoot: string): Promise<boolean>` 函数:
    - Step 1: split 4-segment ref `gateRef.split('.')` → `[root, fileName, triggerName, fieldName]`; root !== 'judgments' → throw `Error('Invalid gate ref')`
    - Step 2: `resolve(packageRoot, 'workflows', 'judgments', '${fileName}.yaml')` + readFile + parseYaml + TypeBox `Value.Check(JudgmentFile, parsed)` validate (T2.3.W0.6)
    - Step 3: `trigger = parsed.triggers[triggerName]`; missing → throw `TriggerNotFoundError`
    - Step 4: `expr = fieldName === 'fires' ? trigger.fires_when : trigger.skips_when`; return `evalGate(expr, ctx)`
  - Cache: parsed yaml 文件 module-level `Map<fileName, JudgmentFileT>` cache (避免 hot-path 重复 readFile + parseYaml)
  - 12 fixture: 6 cross-file resolve (1 file each: strategic / phase / subtask / parallelism / tdd / fallback) + 3 error path (invalid ref / unknown file / unknown trigger) + 2 cache hit verify + 1 TypeBox validate reject (malformed yaml)
- **Acceptance**:
  - (a) `resolveJudgmentGate('judgments.strategic-gate.office-hours.fires', {phase: {type: 'new_feature'}}, packageRoot)` returns `true`
  - (b) `resolveJudgmentGate('judgments.parallelism-gate.agent-teams-upgrade.fires', {teammate_send_message_needed: true}, packageRoot)` returns `true`
  - (c) `resolveJudgmentGate('foo.bar.baz.qux', ctx, root)` throws `Error('Invalid gate ref')`
  - (d) 12 fixture all pass; cache hit second call < 1ms
  - (e) TypeBox `JudgmentFile` schema validate reject malformed yaml (missing `schema_version` / `triggers` key)
- **Depends on**: T2.3.W0.2 (judgments/ 6 file existence) + T2.3.W0.3 (exprBuilder.evalGate) + T2.3.W0.6 (TypeBox JudgmentFile schema)
- **R**: R20.4 (acceptance c sub-item per Q-AUDIT-5c)
- **Implementation Tasks (PLAN-ENG-REVIEW)**: #1 (mandatory MUST appear)
- **TDD**: `tdd="true"` — core algorithm (4-level ref split + yaml load + expr resolve), behavior 可写 unit test 先 expect 后 impl

##### T2.3.W0.5 [S] src/cli/lib/checkAgentTeams.ts ~30L NEW + 5 fixture test (Q-AUDIT-5b MANDATORY per PLAN-ENG-REVIEW)
- **Files**: `src/cli/lib/checkAgentTeams.ts` NEW ~30L + `tests/cli/checkAgentTeams.test.ts` NEW ~80L (5 fixture)
- **Action**: per Q-AUDIT-5b LOCKED + PLAN-ENG-REVIEW Implementation Task #2 + RESEARCH § 4.3 verbatim implementation:
  - `import { readFile } from 'node:fs/promises' + { homedir } from 'node:os' + { resolve } from 'node:path'`
  - `interface AgentTeamsCheckResult { status: 'pass'|'warn'|'missing', detected: {env: boolean, settingsJson: boolean}, envValue?: string, settingsValue?: string, remediation?: string }`
  - `async function checkAgentTeams(): Promise<AgentTeamsCheckResult>`:
    - Probe 1: `envValue = process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS; envOn = envValue === '1'`
    - Probe 2: try `readFile(resolve(homedir(), '.claude', 'settings.json'), 'utf8')` + `JSON.parse(raw) as { env?: Record<string, string> }`; `settingsValue = data.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS; settingsOn = settingsValue === '1'` (per Q-AUDIT-5b root-level `env.*` NOT nested `experimental.*`)
    - Return: `if (envOn || settingsOn) return { status: 'pass', detected, ... }` else `{ status: 'missing', detected, remediation: 'Add to ~/.claude/settings.json:\n  "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" }\nOR export env var:\n  export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1\nThen restart Claude Code (CC ≥ 2.1.133 required).' }`
  - 5 fixture: env-on / settings-on / both-on / missing-both / settings-malformed (non-fatal, fall through to env probe)
- **Acceptance**:
  - (a) `checkAgentTeams()` 时 `process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS='1'` set → returns `{status: 'pass', detected: {env: true, ...}, envValue: '1'}`
  - (b) 5 fixture all pass: `pnpm test tests/cli/checkAgentTeams.test.ts` exit 0
  - (c) schema 是 root-level `env.*` (assert via fixture inspect 实装 source code 含 `data.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` NOT `data.experimental?.*`)
  - (d) remediation text 含 `claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1` OR `~/.claude/settings.json` "env" 节 引导 + CC 2.1.133+ 提示
- **Depends on**: none (Wave 0 entry, 与 T2.3.W0.1-W0.4 并行)
- **R**: R20.11 (主 acceptance d per Q-AUDIT-5b schema fix)
- **Implementation Tasks (PLAN-ENG-REVIEW)**: #2 (mandatory MUST appear)
- **TDD**: `tdd="true"` — 5 fixture I/O test 先写; behavior 明确 (env probe + settings.json probe + status enum + remediation text)

##### T2.3.W0.6 [S] TypeBox schema validate (capabilities + judgments + phaseFactContext)
- **Files**: `src/workflow/schema/capabilities.ts` NEW ~40L + `src/workflow/schema/judgment.ts` NEW ~50L + `src/workflow/schema/phaseFactContext.ts` NEW ~80L + `tests/workflow/schema.test.ts` NEW ~100L (~15 fixture)
- **Action**: per RESEARCH § 6.4 verbatim TypeBox pattern (sister Phase 2.1 `src/manifest/schema/spec.ts` 项目用 TypeBox NOT zod per ROADMAP 8 接口契约 7):
  - `CapabilityEntry = Type.Object({impl: Type.String(), cmd: Type.String(), since: Type.String(), description: Type.Optional(...), fires_when: Type.Optional(Type.Array(Type.String())), requires: Type.Optional(...), aliases: Type.Optional(Type.Array(...)), plugin_path: Type.Optional(...)}, {additionalProperties: false})` + `Capabilities = Type.Object({schema_version: Type.Literal('harnessed.capabilities.v1'), capabilities: Type.Record(Type.String(), CapabilityEntry)}, {additionalProperties: false})`
  - `JudgmentTrigger = Type.Object({description, fires_when, skips_when?, invokes?, requires?, fallback_action: Type.Optional(Type.Union([Type.Literal('skip_with_transparency'), Type.Literal('warn_and_continue'), Type.Literal('invoke_forced'), Type.Literal('continue_independent_eval')]))}, {additionalProperties: false})` + `JudgmentFile = Type.Object({schema_version: Type.Literal('harnessed.judgment.v1'), triggers: Type.Record(Type.String(), JudgmentTrigger), rules?: similar shape for fallback.yaml}, {additionalProperties: false})`
  - `PhaseFactContext` typed shape per RESEARCH § 1.3 verbatim (phase: 12 boolean + 1 enum + 2 number; subtask: 9 boolean + 1 enum + 1 number; user: explicit_signal string array)
  - Wire CI step `scripts/check-workflow-schema.mjs` ~40L NEW: scan `workflows/capabilities.yaml` + `workflows/judgments/*.yaml` + `workflows/{plan-feature,execute-task,research,verify-work}/workflow.yaml` (Phase 2.4 ship 后) + Value.Check vs schema; mismatch exit 1
  - .github/workflows/ci.yml 加 step "Workflow schema validate" 在 transparency gate 之后 (sister Phase 2.2 W0 provenance gate pattern)
- **Acceptance**:
  - (a) `Value.Check(Capabilities, parseYaml(readFileSync('workflows/capabilities.yaml')))` returns true
  - (b) Value.Check 6 judgment file all return true
  - (c) ci.yml step "Workflow schema validate" pass on clean repo + fail on synthetic invalid yaml
  - (d) 15 fixture: 6 positive valid + 5 negative invalid (missing required / additional property / wrong enum) + 4 edge case (empty triggers / unknown impl / nested mismatch)
- **Depends on**: T2.3.W0.1 (capabilities.yaml) + T2.3.W0.2 (judgments/ 6 file)
- **R**: R20.2 (acceptance a TypeBox validate) + R20.4 (acceptance a multi-file TypeBox validate)

#### Wave 2.3.W1 integration (setup.ts patch + defaults.yaml)

##### T2.3.W1.1 [S] setup.ts wire checkAgentTeams() + capabilities/judgments/defaults install
- **Files**: `src/cli/setup.ts` MODIFY (+ ~30L Step A patch)
- **Action**: per Q-AUDIT-5b setup wire + D-01 Pure bundled distribution + RESEARCH § 4.3:
  - Step A 之前 invoke `await checkAgentTeams()` (T2.3.W0.5); `result.status === 'missing'` → print 友好 warn (per PLAN-ENG-REVIEW Section 5 LOW Agent Teams enable 引导 UX text 全文): `⚠️ Agent Teams 未启用 — parallelism-gate 升级路径不可用\n   修复: claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1\n   说明: harnessed v2.0 三层栈方法论 parallelism-gate 升级路径需 CC 2.1.133+ Agent Teams enable (sister ~/.claude/rules/agent-teams.md)`; **不阻塞** continue (per agent-teams.md L42 "Session-scoped 容忍策略")
  - Pure bundled distribution per D-01: setup 不需 user-dir override yaml install (NOT `~/.harnessed/`), `getPackageRoot()` 解析 `<packageRoot>/workflows/capabilities.yaml` + `judgments/*.yaml` + `defaults.yaml` 直接 share-only readonly
  - 在 `harnessed setup --apply` 完成后 print v2.0 三层栈 feature highlight 一行 (per Phase 2.6 README highlight 同步)
- **Acceptance**:
  - (a) `harnessed setup --apply` exit 0 even Agent Teams missing (non-blocking warn)
  - (b) Warn text grep `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` + `2.1.133+` 同时命中
  - (c) `getPackageRoot()` 解析路径不含 `~/.harnessed/` (Pure bundled verify)
- **Depends on**: T2.3.W0.5 (checkAgentTeams.ts)
- **R**: R20.11 (acceptance e setup 引导) + R20.1 (Pure bundled distribution)
- **Implementation Tasks (PLAN-ENG-REVIEW)**: #3 (wire setup.ts)

##### T2.3.W1.2 [S] defaults.yaml ship (ralph_max_iterations table)
- **Files**: `workflows/defaults.yaml` NEW ~30L
- **Action**: per RESEARCH § 7.1 verbatim table + D-10 fallback abort path explicit:
  - `schema_version: harnessed.defaults.v1`
  - `ralph_max_iterations:` nested map: execute-task (01-clarify=5 / 02-code=20 / 03-test=15 / 04-deliver=20) + plan-feature (01-gstack-decision=1 / 02-brainstorm=5 / 03-gsd-discuss=3 / 04-gsd-plan=3 / 05-persist=5) + research (01-fan-out=3 / 02-synth=3) + verify-work (01-gsd-verify-work=3 / 02-code-review=5 / 03-gstack-review=3 / 04-code-simplifier=5)
  - `hard_upper_limit: 100` (sister Phase 2.2 STRIDE T-2.2-05 DoS mitigation)
  - workflow.yaml 通过 `{{ defaults.ralph_max_iterations.execute-task.04-deliver }}` jinja-like interpolation 引用 (sister current workflows/plan-feature/workflow.yaml L13 `gstack_prefix` interpolation pattern)
- **Acceptance**:
  - (a) yaml parse pass; schema_version literal match
  - (b) 全 4 workflow × 各 phase max_iterations 数值 在 1-100 范围
  - (c) workflow engine interpolation test: `interpolate('{{ defaults.ralph_max_iterations.execute-task.04-deliver }}')` returns `20`
- **Depends on**: none
- **R**: R20.10 (ralph-loop fallback path explicit)

##### T2.3.W1.3 [S] phaseFactContext.ts ~80L NEW (TypeBox typed shape)
- **Files**: `src/workflow/schema/phaseFactContext.ts` NEW ~80L (与 T2.3.W0.6 在 schema.ts 中合并 OR 单独 file 按 karpathy ≤200L 原则单独)
- **Action**: per RESEARCH § 1.3 verbatim TypeBox typed shape:
  - `phase: Type.Object({type: Type.Union([Literal('new_project'), Literal('new_milestone'), Literal('new_feature'), Literal('bug_fix'), Literal('tech_debt'), Literal('continuing_phase')]), open_decisions: Type.Number(), scope_days: Type.Number(), single_task: Type.Boolean(), is_critical_module: Type.Boolean(), has_ui_changes: Type.Boolean(), has_auth_or_secrets: Type.Boolean(), has_design_changes: Type.Boolean(), is_major_release: Type.Boolean(), is_large_refactor: Type.Boolean(), spec_ambiguous: Type.Boolean(), unfamiliar_module: Type.Boolean()})`
  - `subtask: Type.Object({type: Type.Union([Literal('crud'), Literal('core_logic'), Literal('algorithm'), Literal('ui_polish'), Literal('docs_only'), Literal('single_command_query')]), lines: Type.Number(), approaches: Type.Number(), core_algorithm: Type.Boolean(), is_core_business_logic: Type.Boolean(), is_algorithm: Type.Boolean(), is_data_processing: Type.Boolean(), regression_risk: Type.Union([Literal('low'), Literal('medium'), Literal('high')]), reliability_required: Type.Boolean()})`
  - `user: Type.Object({explicit_signal: Type.Array(Type.String())})`
  - Export `Static<typeof PhaseFactContext>` type for exprBuilder consumer
- **Acceptance**:
  - (a) 文件 ≤80L
  - (b) `evalGate("phase.type == 'new_feature' AND subtask.lines < 20", validCtx)` pass with TypeBox-validated context
  - (c) Phase 2.4 workflow engine 调用 evalGate 时 ctx 通过 Value.Check(PhaseFactContext) pre-validate
- **Depends on**: T2.3.W0.3 (exprBuilder)
- **R**: R20.3 (acceptance b phase fact context inject)

#### Wave 2.3.W2 ADR + close

##### T2.3.W2.1 [S] Phase 2.3 ship cadence (RETROSPECTIVE entry + STATE update + git commit baseline)
- **Files**: `.planning/STATE.md` MODIFY (Phase v2.0-2.3 shipped entry) + `.planning/RETROSPECTIVE.md` MODIFY (W0 trim Phase v2.0-2.1 narrative if needed sister D2 cadence iter ≥8 graduated freeze post-v1.0 — confirm at execute time per STATE T6 forward signal) + `git tag v2.0.0-alpha.0-schema` LOCAL CREATE
- **Action**: sister Phase 5.x close cadence + sister D2 standing process per Phase 6.1 TERMINUS forward signal (post-v1.0 STATE maintenance freeze, no more D2 iter; v2.0 is post-v1.0 milestone → confirm cadence applicability at execute time, default = maintenance-only mode + 1 STATE entry per phase ship NO archive trim):
  - STATE.md 当前位置 update Phase v2.0-2.3 SHIPPED 实际日期; 进度 1/6 → 2/6
  - Local git tag (NO push per CLAUDE.md commit safety)
- **Acceptance**:
  - (a) STATE.md L36-38 update; 进度表 v2.0 行 update
  - (b) Local tag `v2.0.0-alpha.0-schema` 存在
- **Depends on**: T2.3.W0.* + T2.3.W1.* all ship
- **R**: meta (Phase 2.3 ship cadence)

---

### Phase v2.0-2.4 execute workflows (~6-8 task)

**Goal**: ship 4 workflow.yaml v2 — plan-feature + execute-task 升级 + research + verify-work NEW; 全部使用 Phase 2.3 ship 的 capabilities + judgments + exprBuilder + judgmentResolver + checkAgentTeams; doctor.ts MIN 5→MIN 7 wire 2 NEW check。

#### Wave 2.4.W0 schema v2 baseline

##### T2.4.W0.1 [S] workflow.yaml schema v2 TypeBox
- **Files**: `src/workflow/schema/workflow.ts` MODIFY (+ ~50L gate / on / capability / args / fallback / parallelism 字段) + `tests/workflow/schema.test.ts` MODIFY (+ 5 fixture)
- **Action**: per D-04 + D-09 + D-10 + D-11 + D-12 + D-15 + R20.10 acceptance d (max_iterations_exceeded fallback) schema v2 字段:
  - `schema_version: Type.Literal('harnessed.workflow.v2')` (sister Phase 2.2 schemaVersion 7 surface)
  - `phases[]` item shape `Type.Object({id, name, upstream?, capability: Type.Optional(Type.String()), model?: Type.Optional(ModelTier), invokes?: Type.Optional(Type.String()), args?: Type.Optional(Type.Record(Type.String(), Type.Unknown())), gate: Type.Optional(Type.String()), on: Type.Optional(Type.Array(Type.Object({if: Type.String(), invoke: Type.Optional(Type.String()), action: Type.Optional(Type.Union([Literal('skip'), Literal('invoke')]))}))), parallelism: Type.Optional(Type.String()), fallback?: Type.Optional(Type.Object({max_iterations_exceeded: Type.Object({action, message, exit_code})}))}, {additionalProperties: false})`
  - workflow.yaml gate field reference `judgments.<file>.<gate>.fires` 在 workflow engine 跑前 通过 T2.3.W0.4 judgmentResolver 预 resolve (NOT raw expr-eval direct)
- **Acceptance**:
  - (a) 5 fixture: 1 plan-feature v1→v2 migration + 1 execute-task v1→v2 + 1 research NEW v2 valid + 1 verify-work NEW v2 valid + 1 invalid (missing capability)
  - (b) TypeBox Value.Check pass for 4 v2 workflow.yaml after Phase 2.4 ship 全
  - (c) `additionalProperties: false` strict per Phase 2.2 STRIDE T-2.2-02 mitigation
- **Depends on**: T2.3.W0.6 (TypeBox schema validate baseline)
- **R**: R20.1 + R20.2 + R20.9 (schema v1→v2 字段差异)

#### Wave 2.4.W1 existing 2 workflows upgrade

##### T2.4.W1.1 [M] workflows/execute-task/phases.yaml v2 — ralph-loop 真接 + tdd-gate + mattpocock route
- **Files**: `workflows/execute-task/phases.yaml` MODIFY (sister current 28L → ~60L v2) + `workflows/execute-task/SKILL.md` MODIFY (v2 user-facing description)
- **Action**: per D-10 + D-13 + D-09 + RESEARCH § 3.3 verbatim schema delta:
  - `schema_version: harnessed.workflow.v2`
  - 04-deliver step 加 `capability: '{{ capabilities.ralph-loop.cmd }}'` (D-02 capability abstraction) + `args: {completion_promise: COMPLETE, max_iterations: '{{ defaults.ralph_max_iterations.execute-task.04-deliver }}'}` (D-10 + T2.3.W1.2) + `gate: judgments.parallelism-gate.fires` (D-04 + D-11) + `on: [{if: 'subtask.lines >= 20 AND subtask.type != "single_command_query"', invoke: '{{ capabilities.ralph-loop.cmd }}'}, {if: 'subtask.lines < 20 OR subtask.type == "single_command_query"', action: skip}]` + `fallback: {max_iterations_exceeded: {action: emit_warning_and_halt, message: '⚠️ ralph-loop max-iterations ({{ args.max_iterations }}) exceeded...', exit_code: 1}}` (R20.10 acceptance c explicit fallback)
  - 02-code step 加 `on: [{if: 'judgments.tdd-gate.tdd-strongly-suggested.fires', invoke: '{{ capabilities.tdd.cmd }}'}, {if: 'phase.spec_ambiguous == true', invoke: '{{ capabilities.grill-with-docs.cmd }}'}, {if: 'phase.unfamiliar_module == true', invoke: '{{ capabilities.zoom-out.cmd }}'}]` (D-13 + D-09 mattpocock route)
  - 03-test step 加 `on: [{if: 'test_fail == true', invoke: '{{ capabilities.diagnose.cmd }}'}]` (D-09 句型机器化)
- **Acceptance**:
  - (a) TypeBox `Value.Check(WorkflowSchema, parseYaml(phases.yaml))` pass
  - (b) `harnessed execute-task --dry-run` parse phases.yaml + 显示 ralph-loop wire 在 04-deliver step + tdd-gate wire 在 02-code step
  - (c) `judgments.parallelism-gate.fires` resolve via T2.3.W0.4 resolver → 命中 (assert via dry-run output)
  - (d) sister Phase 2.2 v0.2.0 ralphLoop.ts (54L) + sdkSpawn.ts (91L) + isComplete 4-layer dual-signal 全部 复用 NOT 重写 per RESEARCH § 3.1
- **Depends on**: T2.4.W0.1 (schema v2) + T2.3.W0.1 (capabilities) + T2.3.W0.2 (judgments) + T2.3.W0.4 (judgmentResolver) + T2.3.W1.2 (defaults.yaml)
- **R**: R20.10 (主, ralph-loop 真接) + R20.13 (tdd-gate execute-task wire) + R20.8 (mattpocock route)

##### T2.4.W1.2 [M] workflow engine catch handler — MaxIterationsExceededError + UX text + exit 1
- **Files**: `src/workflow/engineHook.ts` MODIFY (+ ~40L try-catch) OR `src/routing/engine.ts` MODIFY (+ ~40L if engineHook.ts ≤200L 不够) + `tests/workflow/ralph-fallback.test.ts` NEW ~80L (5 fixture)
- **Action**: per R20.10 acceptance c + RESEARCH § 7.2 verbatim UX text:
  - try-catch `MaxIterationsExceededError` (sister Phase 2.2 ralphLoop.ts L22-27 已 ship): catch → print to stderr full UX text (per RESEARCH § 7.2):
    ```
    ❌ ralph-loop max-iterations exceeded ({iterations}/{max}).
    Sub-task: {subtask.summary}
    Workflow: {workflow.name} / phase {phase.id}
    Last subagent output (truncated): {last_message_first_500_chars}
    The subagent attempted {iterations} iterations without emitting verbatim "<promise>COMPLETE</promise>".
    This indicates one of:
      1. Sub-task is genuinely incomplete (escalate to user / re-scope)
      2. Subagent is stuck in a loop (review prompt / system instructions)
      3. max-iterations too low (override via --max-iterations <N>, hard upper limit 100)
    Manual options:
      A) Continue with current state: `harnessed workflow resume --skip-completion-gate`
      B) Re-run from last checkpoint: `harnessed workflow resume --from-checkpoint`
      C) Abort cleanly: exit 1
    Exit code: 1
    ```
  - `process.exit(1)` 显式 NOT silent (R20.10 acceptance "explicit NOT silent")
  - try-catch `VerbatimCompleteFailError` similar fallback path (sister Phase 2.2 ralphLoop.ts L29-34 已 ship)
  - 5 fixture: max-iter exceeded → stderr text grep `max-iterations exceeded` + exit 1 / verbatim fail → similar / clean COMPLETE → exit 0 / mid-iter interruption → continue (no fallback) / iterations < hard_upper_limit
- **Acceptance**:
  - (a) Mock spawn 触发 MaxIterationsExceededError → process.exit called with `1` + stderr 含完整 UX text (4 manual options + 3 indicators)
  - (b) 5 fixture all pass
  - (c) sister engineHook.ts (Phase 3.1 ship 49L) ≤200L Karpathy hard limit 守住 (B-26 / Phase 3.4 D-04 explicit no B-03 5% tolerance) — if exceed, split helper
- **Depends on**: T2.4.W1.1 (phases.yaml v2 ralph-loop wire + fallback 字段)
- **R**: R20.10 (acceptance c "explicit NOT silent")
- **TDD**: `tdd="true"` — error path behavior 明确 (input: spawn throw MaxIterationsExceededError; expected: stderr UX text + exit 1)

##### T2.4.W1.3 [M] workflows/plan-feature/workflow.yaml v2 — planning-with-files plugin slash cmd 真接 (Q-AUDIT-5a)
- **Files**: `workflows/plan-feature/workflow.yaml` MODIFY (sister current 40L → ~60L v2) + `workflows/plan-feature/SKILL.md` MODIFY (v2 描述)
- **Action**: per Q-AUDIT-5a LOCKED + D-15 reframe + RESEARCH § 5.3 (a) plugin slash cmd invocation:
  - `schema_version: harnessed.workflow.v2`
  - 05-persist step 改: `capability: '{{ capabilities.planning-with-files.cmd }}'` (NOT npm SDK call, NOT fs.writeFile self-impl — 显式拒绝 sister Wave A § 5.3) + `invokes: '/plan'` (Claude Code plugin slash cmd) + `model: haiku` (文档生成省 token sister current L36 不变) + `on: [{if: 'phase.scope_days > 1 OR phase.is_critical_module == true', action: invoke}]` (per CLAUDE.md "复杂任务" 触发条件) + `artifacts_expected: [task_plan.md, progress.md, findings.md]` (3 file 位置 `.planning/<phase-id>/`) + `max_iterations: 5`
  - 01-gstack-decision step 加 `gate: judgments.strategic-gate.office-hours.fires` (D-04 gate reference)
  - 03-gsd-discuss step 加 `on: [{if: 'judgments.phase-gate.gsd-discuss-phase.fires', invoke: '{{ capabilities.gsd-discuss-phase.cmd }}'}]`
  - 02-brainstorm step 加 `on: [{if: 'judgments.subtask-gate.brainstorming.fires', invoke: '{{ capabilities.superpowers-brainstorming.cmd }}'}]`
- **Acceptance**:
  - (a) `harnessed plan-feature --dry-run` parse workflow.yaml + 显示 planning-with-files plugin slash cmd `/plan` 真接 wire 在 05-persist (NOT fs.writeFile reference) + artifacts_expected list = [task_plan.md, progress.md, findings.md]
  - (b) workflow.yaml grep `invokes: '/plan'` 命中 + NOT 含 `fs.writeFile` (反向 verify rejected option c)
  - (c) capabilities.yaml planning-with-files entry impl 字段 = `claude-code-plugin` (T2.3.W0.1 已 ship per Q-AUDIT-5a)
- **Depends on**: T2.4.W0.1 (schema v2) + T2.3.W0.1 (capabilities planning-with-files entry) + T2.3.W0.2 (judgments)
- **R**: R20.15 (主, planning-with-files 真接 plugin slash cmd) + R20.7 (D-08 plan-feature 在 4 workflows 之一)
- **Implementation Tasks (PLAN-ENG-REVIEW)**: #4 (workflow.yaml plugin slash cmd 真接) + #5 (capabilities entry, T2.3.W0.1 已 cover)

#### Wave 2.4.W2 2 NEW workflows

##### T2.4.W2.1 [L] workflows/research/workflow.yaml NEW — Tavily/Exa/ctx7 多源 fan-out + GSD discuss synth
- **Files**: `workflows/research/workflow.yaml` NEW ~80L + `workflows/research/SKILL.md` NEW ~30L (slash cmd `/research` user-facing description) + 在 `src/cli/` 注册 `harnessed research` subcommand (or via main CLI dispatcher per current pattern, Phase 2.3 W0.1 capabilities entry 引用 sub-workflow)
- **Action**: per D-08 + RESEARCH § 7.1 max_iterations table verbatim + sister Phase 1.4 research workflow E2E 实装 reuse:
  - `workflow: research; schema_version: harnessed.workflow.v2; on_veto: halt_workflow`
  - phases:
    - `01-fan-out`: capability `{{ capabilities.tavily-mcp.cmd }}` + 并行 `{{ capabilities.exa-mcp.cmd }}` + 并行 `{{ capabilities.ctx7.cmd }}`; `parallelism: subagent-fan-out`; `model: sonnet`; `max_iterations: 3` (per defaults.yaml research.01-fan-out=3); `on: [{if: 'phase.has_library_question == true', invoke: '{{ capabilities.ctx7.cmd }}'}, {if: 'phase.has_academic_question == true', invoke: '{{ capabilities.exa-mcp.cmd }}'}]`; `args: {dedup: true}` (multi-source URL hash dedup per R3.4 v1 partial implementation extend)
    - `02-synth`: capability `{{ capabilities.gsd-discuss-phase.cmd }}` synth output; `model: opus` (推理重); `max_iterations: 3`; persists output to `.planning/<phase-id>/research.md` ~80-200L per sister Phase v2.0-2.2 RESEARCH.md 1058L pattern
- **Acceptance**:
  - (a) `harnessed research --dry-run "<topic>"` parse workflow.yaml + 显示 3 source 并行 fan-out plan
  - (b) workflow.yaml TypeBox Value.Check pass (T2.4.W0.1)
  - (c) capabilities.yaml tavily-mcp / exa-mcp / ctx7 / gsd-discuss-phase 4 entry 全部存在 (T2.3.W0.1 已 ship)
  - (d) Phase 2.5 W2 dogfood test 触发 research workflow + 3 source fan-out 实测 round-trip
- **Depends on**: T2.4.W0.1 (schema v2) + T2.3.W0.1 (capabilities 4 entry)
- **R**: R20.7 (主, research workflow NEW 2 之一)

##### T2.4.W2.2 [L] workflows/verify-work/workflow.yaml NEW — 7+ phase full 4-stage
- **Files**: `workflows/verify-work/workflow.yaml` NEW ~120L + `workflows/verify-work/SKILL.md` NEW ~30L + `harnessed verify-work` subcommand register
- **Action**: per D-12 (Q-AUDIT-2 amend) + R20.12 verbatim 7+ phase + RESEARCH § 7.1 max_iterations + sister CLAUDE.md Stage ④ Verify 完整列表 + sister `~/.claude/rules/agent-teams.md` Pattern C 4-specialist:
  - `workflow: verify-work; schema_version: harnessed.workflow.v2; on_veto: halt_workflow`
  - phases (7+ serial / parallel 混合):
    - **01-gsd-verify-work** (serial): `capability: '{{ capabilities.gsd-verify-work.cmd }}'`; `model: sonnet`; `max_iterations: 3`
    - **02-gsd-progress** (serial after 01): `capability: '{{ capabilities.gsd-progress.cmd }}'`; `model: haiku`; GSD 状态同步
    - **03-code-review** (parallel fan-out): `capability: '{{ capabilities.code-review.cmd }}'`; `parallelism: subagent-fan-out`; `model: sonnet`; `max_iterations: 5` (defaults research/verify-work.02-code-review=5)
    - **04-gstack-review** (强制 conditional): `capability: '{{ capabilities.gstack-review.cmd }}'`; `gate: judgments.parallelism-gate.fires`; `on: [{if: 'phase.is_critical_module == true', invoke: '{{ capabilities.gstack-review.cmd }}'}]`; `model: opus` (Paranoid Staff Eng 推理重); `max_iterations: 3`
    - **05a-gstack-qa** (可选 conditional): `gate: judgments.parallelism-gate.fires`; `on: [{if: 'phase.has_ui_changes == true', invoke: '{{ capabilities.gstack-qa.cmd }}'}, {if: 'phase.has_ui_changes == false', action: skip}]`
    - **05b-gstack-cso** (可选 conditional): `on: [{if: 'phase.has_auth_or_secrets == true', invoke: '{{ capabilities.gstack-cso.cmd }}'}, {else: skip}]`
    - **05c-gstack-design-review** (可选 conditional): `on: [{if: 'phase.has_design_changes == true', invoke: '{{ capabilities.gstack-design-review.cmd }}'}, {else: skip}]`
    - **06-code-simplifier** (末尾串行): `capability: '{{ capabilities.code-simplifier.cmd }}'`; `model: sonnet`; `max_iterations: 5`
    - **07-agent-team-upgrade** (Pattern C 多维度审查 conditional upgrade): `gate: judgments.parallelism-gate.agent-teams-upgrade.fires`; `on: [{if: 'phase.is_major_release == true OR phase.is_large_refactor == true', invoke: '{{ capabilities.agent-teams-create.cmd }}'}]`; team spec = 4 teammate (code-review + gstack-review + gstack-cso + gstack-qa); SendMessage round-trip lead-delegate pattern (sister agent-teams.md Pattern C); cleanup mandatory (`SendMessage shutdown_request` + `TeamDelete` per agent-teams.md L46 cleanup discipline)
  - sister R20.16 fallback 3 铁律 wire: phase ≥4 各 conditional `on: [..., {else: skip}]` 实装 chain_isolation (skip 04-gstack-review ≠ skip 06-code-simplifier 等)
  - 里程碑 `/retro` 推 v2.x per D-08 (NOT included in v2.0 verify-work scope)
- **Acceptance**:
  - (a) `harnessed verify-work --dry-run` parse workflow.yaml + 显示 7+ phase plan with parallel / serial / conditional mix
  - (b) `phase.is_critical_module == false` scenario → gstack-review skip + 透明声明 (per fallback.yaml chain ref); `phase.is_critical_module == true` → invoke
  - (c) `phase.is_major_release == true` scenario → 07-agent-team-upgrade fires + TeamCreate (Phase 2.5 W2 dogfood verify); requires checkAgentTeams returns pass
  - (d) capabilities.yaml gsd-verify-work / gsd-progress / code-review / gstack-review / gstack-qa / gstack-cso / gstack-design-review / code-simplifier / agent-teams-create 全部存在 (T2.3.W0.1 已 ship)
  - (e) Phase 2.5 W2 dogfood test 触发 verify-work + 4-specialist Agent Team round-trip 实测
- **Depends on**: T2.4.W0.1 (schema v2) + T2.3.W0.1 (capabilities 9 entry) + T2.3.W0.2 (judgments parallelism-gate + fallback)
- **R**: R20.12 (主, verify-work full scope) + R20.11 (4-specialist Agent Team upgrade) + R20.14 (special-purpose /qa /cso /design-review conditional) + R20.7 (D-08 verify-work NEW 2 之一)

#### Wave 2.4.W3 dogfood prep

##### T2.4.W3.1 [S] doctor.ts MIN 5→MIN 7 wire 2 NEW check
- **Files**: `src/cli/doctor.ts` MODIFY (~199L → ~215L 接近 ≤200L hard limit per CLAUDE.md L21 Karpathy 关键提醒 4 + Phase 3.4 D-04 explicit; if exceed split helper)
- **Action**: per R2.4.1 MIN 5 baseline (Phase 2.4 doctor v0.2 ship) + Q-AUDIT-5b + D-15 plugin presence check:
  - **NEW 6th check**: invoke `checkAgentTeams()` (T2.3.W0.5); status `missing` → `warn` (exit 0 per CLAUDE.md L21 "warn exit 0 / fail exit 1" R2.4.1)
  - **NEW 7th check**: planning-with-files plugin presence check — `await readdir('~/.claude/plugins/cache/planning-with-files/')` exists? Y → pass, N → warn (R20.15 acceptance d 依赖 plugin 存在性)
  - sister R2.4.1 5 check baseline 保留 (Node ≥ 22 / MCP scope / jq present / Win bash flavor / origin URL 校验)
  - karpathy ≤200L hard limit 守: 若 doctor.ts 超限 split helper `src/cli/lib/checkPlanningWithFiles.ts` ~15L NEW
- **Acceptance**:
  - (a) `harnessed doctor --json | jq '.summary.checks_count'` returns ≥ 7
  - (b) Agent Teams missing scenario → 6th check status='warn'; planning-with-files plugin missing → 7th check status='warn'
  - (c) doctor.ts ≤200L OR split to helper ≤200L (Karpathy hard limit verify)
  - (d) sister R2.4.1 5 check baseline unchanged (regression verify via existing tests)
- **Depends on**: T2.3.W0.5 (checkAgentTeams.ts)
- **R**: R20.11 (acceptance c doctor wire) + R20.15 (acceptance d plugin presence)

---

### Phase v2.0-2.5 execute 4-stage 机器化 dogfood (~5 task — 1 per cycle + 1 aggregate)

**Goal**: 1 个真实 harnessed phase 跑完完整 4-stage Discuss→Plan→Execute→Verify cycle 触发 16 R20.x 全集; 拆 5 Wave (4 cycle + 1 aggregate) per RESEARCH § 8.2; 每 Wave ship 1 DOGFOOD-T5.N.md report (sister Phase 4.3 DOGFOOD-T2.X.md 60L 3-axis pattern 沿袭)。

#### Wave 2.5.W1 Cycle 1 parallelism-gate + fallback

##### T2.5.W1.1 [M] parallelism-gate dogfood + Agent Teams round-trip + DOGFOOD-T5.1.md
- **Files**: `.planning/phase-v2.0-2.5/DOGFOOD-T5.1.md` NEW ~70L (3-axis sister Phase 4.3 pattern)
- **Action**: per RESEARCH § 8.2 Cycle 1 verbatim:
  - 真实跑 1 个 self-hosted harnessed sub-task (推 "实装 sample helper function" 类) 触发 parallelism-gate yaml-eval
  - 5 升级触发 至少 1 命中 (推 `subagent_context_overflow == true` 模拟易触发); 若 `checkAgentTeams()` pass → TeamCreate round-trip (sister agent-teams.md L21 full lifecycle: TeamCreate → Agent × 3 (frontend/backend/test) → SendMessage round-trip → SendMessage shutdown_request × 3 + TeamDelete cleanup); 若 `checkAgentTeams()` missing → fallback subagent fan-out + 透明声明 "⚠️ 跳过 agent-teams-upgrade, 因为 Agent Teams 不可用..." (R20.16 铁律 1)
  - DOGFOOD-T5.1.md 3-axis verdict: Axis A R20.11 parallelism-gate fires verify (judgments.parallelism-gate.agent-teams-upgrade.fires resolved true via T2.3.W0.4 judgmentResolver, expr-eval evaluated 5 fires condition); Axis B R20.16 fallback skip_with_transparency 触发 verify (assert stderr 含 transparent message); Axis C cleanup discipline (TeamDelete + SendMessage shutdown_request cleanup verify, sister agent-teams.md L42 防呆清单)
- **Acceptance**:
  - (a) DOGFOOD-T5.1.md ship ≥ 60L 3-axis verdict PASS
  - (b) `judgments.parallelism-gate.agent-teams-upgrade.fires` resolve at runtime + condition命中
  - (c) Agent Teams round-trip 完整 lifecycle (TeamCreate + ≥1 SendMessage + TeamDelete) verifiable via session log
  - (d) R20.11 + R20.16 acceptance trace recorded in DOGFOOD-T5.1.md
- **Depends on**: Phase 2.4 全 ship (4 workflow.yaml v2 + doctor + checkAgentTeams)
- **R**: R20.11 + R20.16 (Cycle 1 主 target)

#### Wave 2.5.W2 Cycle 2 verify-work 4-specialist Agent Team

##### T2.5.W2.1 [M] verify-work full 4-stage dogfood + 4-specialist Pattern C + DOGFOOD-T5.2.md
- **Files**: `.planning/phase-v2.0-2.5/DOGFOOD-T5.2.md` NEW ~70L
- **Action**: per RESEARCH § 8.2 Cycle 2 verbatim:
  - 真实跑 verify-work workflow on 1 个 already-shipped harnessed phase artifact (推 Phase 2.4 W2.2 verify-work.yaml 自身, self-hosting verification per CLAUDE.md "dogfooding 内在动力" R8.1)
  - 7+ phase 全部 verifiable trigger: 01-gsd-verify-work + 02-gsd-progress (serial) → 03-code-review (parallel 多 agent) → 04-gstack-review (假 `phase.is_critical_module=true` 触发) → 05a-c gstack-qa/cso/design-review (各 conditional 测一遍 with `has_ui_changes=true` etc) → 06-code-simplifier (末尾) → 07-agent-team-upgrade (假 `phase.is_major_release=true` 触发, 4-specialist team Pattern C lead-delegate)
  - DOGFOOD-T5.2.md 3-axis verdict: Axis A R20.12 7+ phase 全 verify; Axis B R20.11 4-specialist Agent Team Pattern C round-trip (lead 委派 + specialist 互相质询 finding + lead 裁判); Axis C R20.14 special-purpose tools (/qa /cso /design-review) conditional invoke 各命中 1 次
- **Acceptance**:
  - (a) DOGFOOD-T5.2.md ship 3-axis PASS
  - (b) 7+ phase 全 trigger trace recorded
  - (c) Agent Team Pattern C (4 teammate + lead) round-trip evidence (session log SendMessage round-trip ≥ 5 round)
  - (d) cleanup discipline 完整 (TeamDelete + 4× shutdown_request)
- **Depends on**: T2.5.W1.1 (parallelism-gate dogfood verified Cycle 1)
- **R**: R20.12 (主) + R20.11 (4-specialist) + R20.14 (gstack 3 可选)

#### Wave 2.5.W3 Cycle 3 tdd-gate + planning-with-files + ralph-loop

##### T2.5.W3.1 [M] TDD 自动 invoke + /plan 真生 3 file + ralph-loop COMPLETE + DOGFOOD-T5.3.md
- **Files**: `.planning/phase-v2.0-2.5/DOGFOOD-T5.3.md` NEW ~70L + 真实生成 `.planning/phase-v2.0-2.5/dogfood-cycle-3/{task_plan.md, progress.md, findings.md}` 3 file via /plan plugin invocation
- **Action**: per RESEARCH § 8.2 Cycle 3 verbatim:
  - 真实跑 plan-feature workflow on 1 个 "实装核心 algorithm" 类 mock subtask (推 `subtask.is_algorithm=true OR subtask.is_core_business_logic=true` 触发 tdd-gate)
  - 05-persist step 真接 `/plan` Claude Code plugin slash cmd → plugin 生 3 file 至 `.planning/phase-v2.0-2.5/dogfood-cycle-3/` (R20.15 acceptance d verify) — 注意 plugin 本身需 user 已安装 planning-with-files >=2.2.0; missing → fallback warn (T2.4.W3.1 doctor 7th check 前置 verify)
  - execute-task workflow 04-deliver step 真接 ralph-loop SDK + `--completion-promise COMPLETE` + max_iterations=20 + verbatim COMPLETE round-trip (sister ADR 0011 4-layer dual-signal pattern, isComplete L1 outer PRIMARY structured_output `subtype === 'success'` + `structured_output.status === 'COMPLETE'`) per R20.10 acceptance d
  - DOGFOOD-T5.3.md 3-axis verdict: Axis A R20.13 tdd-gate fires + TDD invoke verify; Axis B R20.15 plugin 真生 3 file verify (Read 3 file content + 非 empty + 非 placeholder); Axis C R20.10 ralph-loop COMPLETE 真转一圈 verify (session log 含 verbatim "COMPLETE" 字符串)
- **Acceptance**:
  - (a) DOGFOOD-T5.3.md ship 3-axis PASS
  - (b) `.planning/phase-v2.0-2.5/dogfood-cycle-3/` 含 task_plan.md + progress.md + findings.md 3 file (R20.15 acceptance d)
  - (c) ralph-loop session 至少 1 iteration round-trip 到 verbatim "COMPLETE" gate (R20.10 acceptance d)
  - (d) tdd workflow invoke at least once (R20.13 acceptance d)
- **Depends on**: T2.5.W2.1 (Cycle 2 verified)
- **R**: R20.10 + R20.13 + R20.15 (Cycle 3 主 target)

#### Wave 2.5.W4 Cycle 4 special-purpose tools + mattpocock + fallback 3 铁律

##### T2.5.W4.1 [M] mattpocock auto-invoke + user explicit override + chain isolation + DOGFOOD-T5.4.md
- **Files**: `.planning/phase-v2.0-2.5/DOGFOOD-T5.4.md` NEW ~70L
- **Action**: per RESEARCH § 8.2 Cycle 4 verbatim:
  - 真实跑 plan-feature workflow on 1 个 mock subtask 触发 mattpocock route: phase.spec_ambiguous=true → `/grill-with-docs` auto-invoke (R20.8 + D-09 verify); phase.unfamiliar_module=true → `/zoom-out` auto-invoke
  - User explicit override 测试: user input 含 "先 brainstorm" → R20.16 铁律 2 词法匹配 → force invoke superpowers-brainstorming (即使 fires_when == false)
  - Chain isolation 测试: 跳过 strategic-gate (phase.scope_locked_in_history=true) ≠ 跳过 phase-gate (per fallback.yaml chain_isolation=true 铁律 3); 验证 phase-gate 仍独立 eval fires
  - Special-purpose tools 触发 ≥ 1 sample each: `phase.has_ui_changes=true` → ui-ux-pro-max invoke; `phase.has_library_question=true` → ctx7 invoke; web 搜索 → tavily-mcp default
  - DOGFOOD-T5.4.md 3-axis verdict: Axis A mattpocock route 2+ skill auto-invoke + R20.8 trace; Axis B fallback 3 铁律全验 (uncertain-skip / user-explicit-override / chain-isolation 各 1 fixture); Axis C special-purpose tools 触发 ≥ 3 (ui-ux-pro-max + ctx7 + tavily/exa)
- **Acceptance**:
  - (a) DOGFOOD-T5.4.md ship 3-axis PASS
  - (b) User input "先 brainstorm" override 命中 + force invoke superpowers-brainstorming (R20.16 铁律 2)
  - (c) chain isolation: skip strategic-gate independent eval continued phase-gate (R20.16 铁律 3)
  - (d) ≥ 3 special-purpose tool invoke trace
- **Depends on**: T2.5.W3.1 (Cycle 3 verified)
- **R**: R20.8 + R20.9 + R20.14 + R20.16 (Cycle 4 主 target — fallback 3 铁律全集触发)

#### Wave 2.5.W5 Cycle 5 aggregate integration

##### T2.5.W5.1 [M] DOGFOOD-T5.X.md 5-axis aggregate report (16 R20.x all triggered trace)
- **Files**: `.planning/phase-v2.0-2.5/DOGFOOD-T5.X.md` NEW ~90L (5-axis aggregate sister Phase 4.3 60L pattern extended)
- **Action**: per RESEARCH § 8.3 verbatim aggregate structure:
  - 5-axis verdict aggregate Cycle 1-4 + cross-cycle integration verification:
    - Axis A — Cycle 1 R20.11/R20.16 (再 cite DOGFOOD-T5.1.md)
    - Axis B — Cycle 2 R20.12/R20.11/R20.14 (再 cite T5.2)
    - Axis C — Cycle 3 R20.13/R20.15/R20.10 (再 cite T5.3)
    - Axis D — Cycle 4 R20.8/R20.9/R20.14/R20.16 (再 cite T5.4)
    - Axis E — Aggregate cross-cycle: R20.1-R20.9 (initial 9): all triggered list; R20.10-R20.16 (Q-AUDIT 7): all triggered list; Full test suite gate (pnpm test) ≥ 750+ baseline PASS; CI gates ✅ (A7 + transparency + Phase 2.4 schema validate + Phase 2.6 schema validate)
  - Per RESEARCH § 8.3 disposition: ✅ T5.X dogfood PASS 5/5 axes verified miss: none ✅ R20.1-R20.16 all triggered at least once ✅ Ready for Phase v2.0-2.6 close
  - LOCAL CREATE tag `v2.0.0-rc.1` (sister ADR 0023 dual / triple baseline tag pattern); NO push per CLAUDE.md commit safety
- **Acceptance**:
  - (a) DOGFOOD-T5.X.md ship 5-axis PASS verdict
  - (b) 16 R20.x acceptance trace verifiable (each R20.x cite 一处 dogfood evidence)
  - (c) Local tag `v2.0.0-rc.1` 存在
  - (d) Full test suite baseline ≥ 750+ pass (sister Phase 6.1 756 baseline)
- **Depends on**: T2.5.W4.1 (Cycle 4 verified, all 4 cycle ship)
- **R**: 16 R20.x aggregate verify (R20.1-R20.5 + R20.7-R20.16; R20.6 DROPPED)

---

### Phase v2.0-2.6 close + ship 🎯 v2.0.0 GA (~10-11 task)

**Goal**: BREAKING CHANGES ship + ADR 0024-0029 backfill (6 ADR sister A7 conservation extend 0023→0029) + CHANGELOG + ci.yml A7 iter + README + RETROSPECTIVE + milestone audit + 🎯 v2.0.0 GA tag triple + publish.yml tag-trigger npm publish (sister ADR 0023 OIDC pattern reuse)。

#### Wave 2.6.W0 ADR backfill (6 ADR per ADR 0011 9-section pattern)

##### T2.6.W0.1 [M] ADR 0024 — workflow schema v2 + capability abstraction (D-01 + D-02 + D-09)
- **Files**: `docs/adr/0024-workflow-schema-v2-capability-abstraction.md` NEW ~200L (sister ADR 0011 9-section pattern: Status + Context + Decisions × N + A7 Conservation + CI A7 step + Consequences + Compliance + Errata-path note + References)
- **Action**: per Phase v2.0-2.3 + 2.4 ship outcome backfill:
  - Decisions: 1. D-01 Pure bundled distribution (workflow.yaml v2 share-only readonly) / 2. D-02 capability abstraction flat yaml map / 3. D-09 mattpocock capability route by condition (on: syntax + expr-eval)
  - A7 Conservation: ADR 0001-0023 main body 不动; 加 `adr-0024-accepted` baseline tag
  - CI A7 step: ci.yml iter 0023→0024 (Wave 1 T2.6.W1.2 落地 single extend NOT retroactive)
  - References: 内部 docs/adr/0023 + .planning/phase-v2.0-2.1/2.1-CONTEXT.md + .planning/phase-v2.0-2.2/{RESEARCH,PLAN}.md + sister Phase 2.2 ADR 0011 (capability+gate pattern 起源 hint)
- **Acceptance**:
  - (a) 9-section format complete
  - (b) sister ADR 0011 9-section pattern verbatim 复用
  - (c) A7 Conservation 验收命令 `git diff adr-0001-accepted..HEAD -- docs/adr/0001-*.md ... docs/adr/0023-*.md | wc -l` = 0
  - (d) Local tag `adr-0024-accepted` 待创建 (Wave 2)
- **Depends on**: Phase 2.3 + 2.4 ship 全
- **R**: R20.1 + R20.2 + R20.8 + R20.9 (BREAKING CHANGES doc)

##### T2.6.W0.2 [M] ADR 0025 — capabilities.yaml v2.0 baseline + static manifest discipline (D-07 + D-14)
- **Files**: `docs/adr/0025-capabilities-yaml-baseline-static-manifest.md` NEW ~180L
- **Action**: per D-07 (Q6 static manifest + ADR per upstream upgrade) + D-14 (Q-AUDIT-3 special-purpose tools 13+ entry):
  - Decisions: 1. capabilities.yaml v2.0 baseline ~35 entry (mattpocock 12 + special-purpose 13 + gstack 6 + 核心 4) / 2. static manifest discipline (NOT dynamic introspection per D-07; ADR 0026+ per upstream upgrade pattern + npm patch release 2-3 day cycle); 3. expr-eval size correction (CONTEXT.md L34 "~5KB" 数据校正 → unpackedSize 实测 145.6 KB; bundle ~30-40 KB gzip ~10-15 KB; 不阻塞 Pure bundled distribution since runtime impact < 1ms node CLI 启动) per RESEARCH § 9.2 MED finding
  - A7 Conservation: ADR 0001-0024 0 diff; 加 `adr-0025-accepted` tag
  - References: capabilities.yaml + .planning/phase-v2.0-2.2/RESEARCH.md § 2 (baseline list) + § 1.1 (size correction) + ~/.claude/rules/web-*.md (special-purpose tools source)
- **Acceptance**: (a) 9-section ADR 0025 ship + (b) A7 = 0 diff ADR 0001-0024
- **Depends on**: Phase 2.3 + 2.4 ship
- **R**: R20.2 + R20.5 + R20.14

##### T2.6.W0.3 [M] ADR 0026 — judgments/ 6 file + expr-eval + judgmentResolver (D-03 + D-04 + D-16 + Q-AUDIT-5c)
- **Files**: `docs/adr/0026-judgments-multi-file-expr-eval-resolver.md` NEW ~200L
- **Action**: per D-03 + D-04 + D-16 + Q-AUDIT-5c errata:
  - Decisions: 1. D-03 expr-eval npm dep (2.0.2 MIT zero-dep 145.6 KB unpacked) + Parser instance cache + operator lockdown / 2. D-04 + D-16 multi-file judgments/ 6 file 分类 (rule-style sister `~/.claude/rules/*.md` pattern) / 3. Q-AUDIT-5c judgmentResolver.ts ~60L NEW (4 层 ref split + yaml load + resolve `triggers.<gate>.fires_when` + pass to expr-eval + TypeBox validate); errata 节 captures D-04 single judgment.yaml → multi-file 6 file reframe history per Q-AUDIT-3 annotation
  - A7 Conservation: 加 `adr-0026-accepted` tag
  - References: src/workflow/{exprBuilder,judgmentResolver}.ts + workflows/judgments/*.yaml + .planning/phase-v2.0-2.2/RESEARCH.md § 6
- **Acceptance**: (a) 9-section + (b) errata 节 (Q-AUDIT-3 annotation history)
- **Depends on**: Phase 2.3 ship
- **R**: R20.3 + R20.4 + R20.16

##### T2.6.W0.4 [M] ADR 0027 — research + verify-work NEW workflows (D-08 + D-12 + planning-with-files plugin reframe errata)
- **Files**: `docs/adr/0027-research-verify-work-workflows-planning-plugin.md` NEW ~220L
- **Action**: per D-08 (Q7 ship 2 NEW workflows) + D-12 (Q-AUDIT-2 verify-work full 4-stage scope) + Q-AUDIT-5a (D-15 reframe planning-with-files plugin NOT npm SDK terminology drift):
  - Decisions: 1. workflows/research/ NEW (Tavily/Exa/ctx7 多源 fan-out + GSD discuss synth) / 2. workflows/verify-work/ NEW 7+ phase full (gsd-verify-work + gsd-progress + code-review 并行 + gstack-review conditional + 3 optional + code-simplifier + 4-specialist Agent Team upgrade conditional) / 3. **errata 节**: planning-with-files SDK → plugin terminology drift fix history (sister ADR 0011 errata 9 章节 pattern; sister Phase 1.2.5 SISTER-REVIEW.md 5-recurrence terminology drift pattern recognition); npm registry 404 verified; 实装 path = plugin slash cmd `/plan` invocation; rejected fs.writeFile self-impl + fork repo abstract npm package
  - A7 Conservation: 加 `adr-0027-accepted` tag
  - References: workflows/{research,verify-work}/workflow.yaml + RESEARCH.md § 5 (planning-with-files plugin verified) + ~/.claude/rules/agent-teams.md Pattern C
- **Acceptance**: (a) 9-section + (b) errata 节 (planning-with-files SDK→plugin terminology drift history)
- **Depends on**: Phase 2.4 ship
- **R**: R20.7 + R20.12 + R20.15
- **Implementation Tasks (PLAN-ENG-REVIEW)**: #8 (ADR 0027+ errata 节 planning-with-files terminology drift history)

##### T2.6.W0.5 [M] ADR 0028 — ralph-loop + TDD + Agent Teams 路由 (D-10 + D-11 + D-13 + Q-AUDIT-5b schema fix errata)
- **Files**: `docs/adr/0028-ralph-loop-tdd-agent-teams-routing.md` NEW ~200L
- **Action**: per D-10 (Q-AUDIT-2 ralph-loop 真接) + D-11 (Q-AUDIT-2 parallelism-gate + Agent Teams env check) + D-13 (Q-AUDIT-2 tdd-gate) + Q-AUDIT-5b errata (settings.json schema root-level env NOT nested experimental):
  - Decisions: 1. D-10 ralph-loop completion-promise 真接 (NOT mock; sister ADR 0011 dual-signal 4-layer pattern 沿袭) + explicit fallback UX text + exit 1 / 2. D-11 parallelism-gate 3 路径 (subagent default / Agent Teams 5 upgrade triggers / 主 session fallback) + checkAgentTeams.ts ~30L / 3. D-13 tdd-gate fires_when 6 + skips_when 3 / 4. **errata 节**: Q-AUDIT-5b settings.json schema fix history (nested experimental.* → root-level env.* per Wave A 本地实证 + 5 fixture test verify)
  - A7 Conservation: 加 `adr-0028-accepted` tag
  - References: src/cli/lib/checkAgentTeams.ts + src/workflow/engineHook.ts (ralph-loop fallback UX wire) + workflows/judgments/{parallelism,tdd}-gate.yaml + ~/.claude/rules/agent-teams.md L7 prereq + sister ADR 0011 9-section pattern
- **Acceptance**: (a) 9-section + (b) errata 节 (Q-AUDIT-5b schema fix history)
- **Depends on**: Phase 2.3 + 2.4 ship
- **R**: R20.10 + R20.11 + R20.13

##### T2.6.W0.6 [S] ADR 0029 — fallback 3 铁律 runtime + 4-stage 机器化 (R20.16 + Phase 2.5 dogfood)
- **Files**: `docs/adr/0029-fallback-3-rules-runtime-4-stage-dogfood.md` NEW ~160L
- **Action**: per R20.16 (Q-AUDIT-3 fallback 3 铁律字段扩充) + Phase 2.5 dogfood 5-axis verdict learnings backfill:
  - Decisions: 1. fallback.yaml 3 字段 (fallback_action: skip_with_transparency + override_signal 6 string + chain_isolation: true) runtime 实装 / 2. Phase 2.5 4-stage 端到端 dogfood 验证 16 R20.x 全集触发 trace (Cycle 1-4 + Cycle 5 aggregate)
  - A7 Conservation: 加 `adr-0029-accepted` tag
  - References: workflows/judgments/fallback.yaml + DOGFOOD-T5.{1,2,3,4,X}.md + sister CLAUDE.md 「澄清/审查触发判据」节 fallback 铁律 verbatim
- **Acceptance**: (a) 9-section + (b) Phase 2.5 dogfood evidence cite
- **Depends on**: Phase 2.5 ship 全
- **R**: R20.16 + meta (Phase 2.5 dogfood report cluster)

#### Wave 2.6.W1 ship artifacts

##### T2.6.W1.1 [S] CHANGELOG.md [2.0.0] BREAKING CHANGES + 升级一行指令 + schema v1→v2 字段差异
- **Files**: `CHANGELOG.md` MODIFY (+ [2.0.0] entry top of file per Keep-a-Changelog format, sister Phase 4.3 W2 ship 41L baseline init)
- **Action**: per R20.9 acceptance a + Phase 2.6 close cadence:
  - [2.0.0] BREAKING CHANGES 节:
    - 升级一行指令: `npm install -g harnessed@2.0 && harnessed setup --apply`
    - Schema v1 → v2 字段差异列表:
      - workflow.yaml: + `schema_version: harnessed.workflow.v2` + `capability` 字段 + `gate` 字段 + `on:` 数组 + `args` map + `fallback` 字段
      - capabilities.yaml: NEW `<packageRoot>/workflows/capabilities.yaml` (~35 entry baseline)
      - judgments/: NEW `<packageRoot>/workflows/judgments/` directory (6 file)
      - defaults.yaml: NEW `<packageRoot>/workflows/defaults.yaml` (ralph_max_iterations table + hard_upper_limit)
    - 4 workflows ship: plan-feature (upgraded v2) + execute-task (upgraded v2) + research (NEW) + verify-work (NEW)
    - Pure bundled distribution: end-user share-only, NO user-dir override, ~/.harnessed/ 不需要
    - planning-with-files plugin terminology fix: 是 Claude Code plugin NOT npm SDK; 升级前需 `claude plugin install planning-with-files@>=2.2.0`
    - Agent Teams settings.json: root-level `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (NOT nested experimental.*); CC ≥ 2.1.133 required
  - Added 节: ~35 capabilities entry + 6 judgments file + 2 NEW workflows + expr-eval npm dep + judgmentResolver.ts + checkAgentTeams.ts
  - Changed 节: workflow schema v1→v2 + doctor MIN 5→MIN 7
  - Removed 节: R20.6 manifest user-dir hot-reload DROPPED
- **Acceptance**:
  - (a) [2.0.0] entry 在 CHANGELOG.md 顶部
  - (b) BREAKING CHANGES + 升级一行指令 + Added + Changed + Removed 5 section 齐
  - (c) sister Keep-a-Changelog format (Phase 4.3 baseline) 沿袭
- **Depends on**: Phase 2.3 + 2.4 + 2.5 ship
- **R**: R20.9 (主)

##### T2.6.W1.2 [S] ci.yml A7 step iter 0023→0029 single extend
- **Files**: `.github/workflows/ci.yml` MODIFY (A7 step 两处 `for n in ... 0023` → `for n in ... 0023 0024 0025 0026 0027 0028 0029`; step name `ADR 0001-0023` → `ADR 0001-0029`; echo `ADR 0001-0023` → `ADR 0001-0029`)
- **Action**: sister Phase 5.2 W2 T2.7 0021→0022 + Phase 6.1 W2 T2.2 0022→0023 pattern verbatim single extend NOT retroactive:
  - 4 surgical edits per sister pattern
  - STRICT ordering: BEFORE Wave 2 baseline tag creation (`adr-0024-accepted` ~ `adr-0029-accepted`) per STRIDE T-4.3-07 sister Phase 4.3
- **Acceptance**:
  - (a) ci.yml A7 step contains `0001 ... 0029` complete range
  - (b) `git diff adr-0023-accepted..HEAD -- "docs/adr/000[1-9]-*.md" "docs/adr/00[12][0-9]-*.md"` = 0 lines (A7 守恒 ADR 0001-0029)
  - (c) CI run 3-OS 全绿 (post-Phase 2.5 baseline)
- **Depends on**: Phase 2.6 W0 6 ADR ship (0024-0029)
- **R**: meta (A7 conservation)

##### T2.6.W1.3 [S] package.json 1.0.4 → 2.0.0 semver major bump
- **Files**: `package.json` MODIFY (`"version": "1.0.4" → "2.0.0"`)
- **Action**: per D-05 release notes only migration (Pure bundled YAGNI):
  - version 1.0.4 → 2.0.0 (semver major); sister Phase 6.1 W1 T1.2 0.3.0 → 1.0.0 jump pattern (NO intermediate rc 数字 per D-05 sneak-block)
  - all other metadata fields unchanged (description / keywords / homepage / repository / bugs / license / bin / files whitelist 已 sister Phase 6.1 verified clean)
- **Acceptance**:
  - (a) `npm pack --dry-run` shows `harnessed@2.0.0`
  - (b) version semver major bump 1.0.x → 2.0.0
- **Depends on**: Phase 2.6 W0 ship (ADR 0024-0029 reference 2.0)
- **R**: R20.9 (升级一行指令依赖)

##### T2.6.W1.4 [S] README.md v2.0 feature highlight + docs/WORKFLOW.md v0.5+ 路线图反映 in v2.0
- **Files**: `README.md` MODIFY (+ ~15L v2.0 feature highlight + status badge update 1.0 → 2.0) + `docs/WORKFLOW.md` MODIFY (v0.5+ 路线图全部 ship 反映 in v2.0)
- **Action**: per Phase 2.6 close cadence + CONTEXT.md L222 README + WORKFLOW.md update:
  - README v2.0 feature highlight 节: 4 workflows 完整 4-stage 三层栈机器化 + capability abstraction + judgments/ 6 file 分类 + Pure bundled distribution
  - status badge: "stable v1.0" → "stable v2.0"
  - docs/WORKFLOW.md v0.5+ 路线图 3 entry (plan-feature 自动 gsd-* spawn / verify-work 自动 / 4-stage 完整自动) 全部 反映 SHIPPED in v2.0
- **Acceptance**:
  - (a) README 顶部 v2.0 feature 4 项 highlight
  - (b) docs/WORKFLOW.md v0.5+ 路线图 entry SHIPPED in v2.0 标注
  - (c) status badge "stable v2.0"
- **Depends on**: Phase 2.6 W0 ship
- **R**: meta (close cadence README + docs)

##### T2.6.W1.5 [S] RETROSPECTIVE.md v2.0 milestone close + cross-milestone trend
- **Files**: `.planning/RETROSPECTIVE.md` MODIFY (+ v2.0 milestone close 节 + cross-milestone trend update)
- **Action**: sister v0.4.0 + v0.5.0 + v1.0 close pattern 100% reuse:
  - v2.0 milestone close 节: 6 phase ship (v2.0-2.1 ~ v2.0-2.6) + 16 R20.x acceptance verify + 5-axis dogfood PASS + 6 ADR (0024-0029) backfill + 1 milestone tag triple (alpha.1-post-2.4 + rc.1-post-2.5 + 🎯 v2.0.0)
  - cross-milestone trend: v0.1→v0.2→v0.3→v0.4→v0.5→v1.0→v2.0 各 milestone 数据 (phases 完成 / tests / ADR / 关键决策 / ship cadence days)
- **Acceptance**:
  - (a) RETROSPECTIVE.md 含 v2.0 milestone close 节
  - (b) cross-milestone trend update reflect v2.0 close
- **Depends on**: Phase 2.6 W0 ship
- **R**: meta (close cadence)

#### Wave 2.6.W2 milestone close

##### T2.6.W2.1 [S] `.planning/milestones/v2.0-MILESTONE-AUDIT.md` ship
- **Files**: `.planning/milestones/v2.0-MILESTONE-AUDIT.md` NEW ~120L (sister v1.0 audit format reuse) + 可选 `.planning/milestones/v2.0-ROADMAP.md` + `.planning/milestones/v2.0-REQUIREMENTS.md` 3-file archive triplet (sister v0.3 + v0.4 + v0.5 + v1.0 triplet pattern)
- **Action**: per sister `.planning/milestones/v1.0-MILESTONE-AUDIT.md` format verbatim reuse:
  - 16 R20.x acceptance final verify (each R20.x 数 status Done/Partial/Re-scoped)
  - 6 phase ship summary (Phase v2.0-2.1 ~ v2.0-2.6)
  - 6 ADR (0024-0029) accumulate
  - Tests baseline maintain ≥ 750+
  - CI 3-OS 全绿
- **Acceptance**:
  - (a) v2.0-MILESTONE-AUDIT.md ship + 16 R20.x acceptance status table 齐
  - (b) sister v1.0 audit format 复用
- **Depends on**: Phase 2.6 W1 ship
- **R**: meta (close cadence)

##### T2.6.W2.2 [S] milestone tag triple LOCAL CREATE (alpha.1 + rc.1 + 🎯 v2.0.0)
- **Files**: git tag triple LOCAL CREATE (NO push per CLAUDE.md commit safety)
- **Action**: per sister Phase 6.1 W2 T2.10 v1.0 tag pattern + Phase 5.2 alpha.X pattern + CONTEXT.md L260 triple tag:
  - `v2.0.0-alpha.1` post-Phase 2.4 (实际 Phase 2.4 ship 时即创建 OR Phase 2.6 W2 一并)
  - `v2.0.0-rc.1` post-Phase 2.5 (dogfood PASS 后, T2.5.W5.1 已 LOCAL CREATE)
  - `🎯 v2.0.0` post-Phase 2.6 (Phase 2.6 W2 ship 后即创建)
  - LOCAL only; push 由 user 手动 approve per CLAUDE.md commit safety
- **Acceptance**:
  - (a) `git tag -l 'v2.0.0*'` returns 3 tag
  - (b) `git log -1 v2.0.0` 命中 Phase 2.6 W2 commit
- **Depends on**: T2.6.W1.* + T2.6.W2.1 ship
- **R**: meta (milestone tag cadence)

#### Wave 2.6.W3 publish (user approval gated)

##### T2.6.W3.1 [S] publish.yml tag-trigger npm publish (sister ADR 0023 OIDC + sigstore pattern reuse)
- **Files**: `.github/workflows/publish.yml` 已 ship (sister Phase 6.1 W1 T1.1 39L OIDC tag-trigger); 本 task = 用户 push `🎯 v2.0.0` tag 触发 npm publish LIVE
- **Action**: per sister ADR 0023 D-02 NpmPublishStrategy verbatim reuse:
  - publish.yml 已含 `push: tags: v[0-9]+.[0-9]+.[0-9]+` trigger (semantic version only)
  - `🎯 v2.0.0` tag push → publish.yml fires → OIDC + sigstore provenance + `npm publish --provenance --access public`
  - sister ADR 0023 fallback `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` env if Trusted Publishers UI not configured
  - **此 task user push approval required per CLAUDE.md commit safety** — planner ship 完后 user 手动 push `🎯 v2.0.0` tag
- **Acceptance**:
  - (a) publish.yml workflow fires on `🎯 v2.0.0` tag push
  - (b) `npm view harnessed@2.0.0 version` returns `2.0.0` (post-publish verify)
  - (c) sigstore provenance attestation 显示在 npm registry
- **Depends on**: T2.6.W2.2 (🎯 v2.0.0 tag LOCAL CREATE) + user push approval
- **R**: meta (npm publish stream sister ADR 0023)

---

## Acceptance Backward Mapping (16 R20.x → task IDs)

| R20.x | Acceptance summary | Implementation tasks | Dogfood / Verify tasks |
|-------|-------------------|---------------------|------------------------|
| R20.1 | workflows bundled SoT, end-user share-only NO override | T2.3.W1.1 (setup.ts Pure bundled) + T2.4.W0.1 (schema v2) | T2.5.W3.1 (Cycle 3 plan-feature dogfood within `<packageRoot>/`) + T2.6.W1.1 (CHANGELOG 升级一行指令 verify) |
| R20.2 | capabilities.yaml flat yaml map ~35 entry | T2.3.W0.1 (capabilities.yaml NEW) + T2.3.W0.6 (TypeBox validate) | T2.5.W1.1-W4.1 (各 cycle 触发 capabilities.* lookup) + T2.6.W0.2 (ADR 0025 backfill) |
| R20.3 | gate yaml-eval grammar via expr-eval npm dep | T2.3.W0.3 (expr-eval install + exprBuilder.ts) + T2.3.W1.3 (phaseFactContext.ts) | T2.5.W4.1 (Cycle 4 chain isolation + override fallback) + T2.6.W0.3 (ADR 0026 backfill) |
| R20.4 | judgments/ multi-file SoT + judgmentResolver | T2.3.W0.2 (judgments/ 6 file) + T2.3.W0.4 (judgmentResolver.ts) + T2.3.W0.6 (TypeBox JudgmentFile validate) | T2.5.W1.1 (parallelism-gate resolve) + T2.5.W3.1 (tdd-gate resolve) + T2.6.W0.3 (ADR 0026) |
| R20.5 | upstream static manifest + ADR per upgrade | T2.6.W0.2 (ADR 0025 static manifest discipline) | T2.6.W1.2 (ci.yml A7 step 0023→0029) |
| ~~R20.6~~ | ~~manifest user-dir hot-reload~~ DROPPED | DROPPED — Pure bundled supersede (D-06) | N/A |
| R20.7 | NEW workflows ship research + verify-work | T2.4.W2.1 (research workflow) + T2.4.W2.2 (verify-work workflow) | T2.5.W2.1 (Cycle 2 verify-work dogfood) + T2.6.W0.4 (ADR 0027) |
| R20.8 | mattpocock in-workflow capability routing | T2.4.W1.1 (execute-task 02-code mattpocock on:) + T2.4.W1.3 (plan-feature mattpocock on:) | T2.5.W4.1 (Cycle 4 mattpocock auto-invoke) + T2.6.W0.1 (ADR 0024) |
| R20.9 | BREAKING CHANGES release notes only, no migrate CLI | T2.6.W1.1 (CHANGELOG [2.0.0]) + T2.6.W1.3 (package.json 2.0.0) | T2.6.W1.4 (README v2.0) |
| R20.10 | ralph-loop completion-promise 真接 explicit NOT silent | T2.4.W1.1 (phases.yaml ralph-loop wire) + T2.4.W1.2 (fallback UX text + exit 1) + T2.3.W1.2 (defaults.yaml max_iterations) | T2.5.W3.1 (Cycle 3 ralph-loop COMPLETE round-trip) + T2.6.W0.5 (ADR 0028) |
| R20.11 | parallelism-gate + Agent Teams 路由 + env check (root-level env) | T2.3.W0.5 (checkAgentTeams.ts ~30L) + T2.3.W0.2 (parallelism-gate.yaml) + T2.3.W1.1 (setup wire) + T2.4.W3.1 (doctor 6th check wire) + T2.4.W2.2 (verify-work 07-agent-team-upgrade) | T2.5.W1.1 (Cycle 1 parallelism-gate + Agent Teams round-trip) + T2.5.W2.1 (Cycle 2 4-specialist team) + T2.6.W0.5 (ADR 0028 + Q-AUDIT-5b errata) |
| R20.12 | verify-work workflow full 4-stage 7+ phase | T2.4.W2.2 (verify-work workflow 7+ phase) | T2.5.W2.1 (Cycle 2 7+ phase dogfood + 4-specialist team) + T2.6.W0.4 (ADR 0027) |
| R20.13 | tdd-gate 强制 core_business_logic/algorithm | T2.3.W0.2 (tdd-gate.yaml) + T2.3.W0.1 (capabilities tdd entry + aliases) + T2.4.W1.1 (execute-task 02-code tdd-gate wire) | T2.5.W3.1 (Cycle 3 TDD auto-invoke) + T2.6.W0.5 (ADR 0028) |
| R20.14 | special-purpose tools 13+ entry routing | T2.3.W0.1 (capabilities special-purpose 13+ entry) + T2.4.W2.2 (verify-work 05a-c gstack /qa /cso /design-review conditional) | T2.5.W2.1 (Cycle 2 special tools conditional invoke) + T2.5.W4.1 (Cycle 4 ui-ux-pro-max + ctx7 + tavily) + T2.6.W0.2 (ADR 0025) |
| R20.15 | planning-with-files 真接 plugin slash cmd /plan | T2.3.W0.1 (capabilities entry impl=claude-code-plugin cmd=/plan) + T2.4.W1.3 (plan-feature 05-persist invokes /plan) + T2.4.W3.1 (doctor 7th check plugin presence) | T2.5.W3.1 (Cycle 3 /plan 真生 3 file) + T2.6.W0.4 (ADR 0027 + Q-AUDIT-5a errata) |
| R20.16 | judgments/fallback.yaml 3 铁律 runtime | T2.3.W0.2 (fallback.yaml schema 3 rules) + T2.4.W2.2 (verify-work chain isolation) + T2.4.W1.1-W1.3 (各 workflow gate field 应用 fallback) | T2.5.W4.1 (Cycle 4 3 铁律全验) + T2.6.W0.6 (ADR 0029) |

**Verification**: 每行 R20.x 至少 1 implementation task + 1 dogfood/verify task; R20.6 DROPPED 明确; 全部 16 acceptance backward derived from R20.x verbatim acceptance text。

---

## Open Questions

None — plan fully resolved.

(Wave A research surface 出 5 open question per RESEARCH § 10.3, 全部 已在本 plan 中 resolve:
- Q-OPEN-1 planning-with-files 实装 path: D-15 reframe LOCKED via Q-AUDIT-5a, plugin slash cmd `/plan` (option a per RESEARCH § 5.3), 拒绝 fs.writeFile self-impl + fork repo — 已 cover in T2.4.W1.3 + T2.6.W0.4 ADR 0027 errata 节
- Q-OPEN-2 capabilities.yaml entry count: T2.3.W0.1 ship ~35 entry baseline (mattpocock 12 + special-purpose 13 + gstack 6 + 核心 4 + Agent Teams 3) verifiable via acceptance criterion (a)
- Q-OPEN-3 research/verify-work max_iterations: T2.3.W1.2 defaults.yaml 集中表 ship; Phase 2.5 dogfood Cycle 2 verify 收敛性 (verify-work 7+ phase max_iter 收敛 with current 3/5/3/5 default)
- Q-OPEN-4 Phase 2.5 dogfood cycle 拓扑: 选 4 cycle + 1 aggregate (per RESEARCH § 8.2 推荐); T2.5.W1.1-W5.1 5 task 体现
- Q-OPEN-5 judgments/ 是否再拆 7th file (cc-handoff-gate): KEEP 6 file per D-16 文案; cc-handoff scenarios 推 v2.x patch release per CLAUDE.md `~/.claude/rules/cc-handoff.md` 推迟; 不阻塞 v2.0 ship。)

---

## 拒绝清单 (out of scope per Phase v2.0-2.1 CONTEXT.md deferred 节 verbatim)

- ❌ `/retro` workflow ship → v2.x (per D-08, sister 现 absorb 模式手动 /retro slash cmd 不阻塞)
- ❌ R20.6 manifest user-dir hot-reload → DROPPED per D-06 (Pure bundled supersede)
- ❌ Dynamic capability discovery (R20.5 option B) → DROPPED per D-07 (脱位风险高)
- ❌ `harnessed migrate v1→v2` CLI helper → DROPPED per D-05 (Pure bundled YAGNI; release notes only)
- ❌ Compat shim v1+v2 共存 → DROPPED per D-05 (Pure bundled 单一 SoT 模式不需要)
- ❌ mattpocock 23 招式全集 wire → v2.x patch release per D-09 (v2.0 仅 ship 12 高频子集; capabilities.yaml since: v2.x 标 剩 11)
- ❌ `/plan-feature` Stage ③ 子任务级自动 gsd-* spawn → v2.1+ dogfood 信号触发 per CONTEXT.md L281
- ❌ `harnessed --dev` maintainer hot-reload mode → 推后续 phase 单独评估 per CONTEXT.md L282
- ❌ 跨 harness 抽象层实际启用 → v2.0 不在 scope per CONTEXT.md L283

---

## Phase ship cadence forward signal

- **Phase v2.0-2.3 SHIPPED** target window 2026-05-21 ~ 2026-05-23 (8-9 task, ~2 day; sister 1-phase/day cadence per Phase 4.x ship rate)
- **Phase v2.0-2.4 SHIPPED** target window 2026-05-24 ~ 2026-05-27 (6-7 task, ~3 day; 含 2 NEW workflows 较 Phase 2.3 工程量大)
- **Phase v2.0-2.5 SHIPPED** target window 2026-05-28 ~ 2026-06-01 (5 task × 1 day cycle = ~5 day; sister Phase 4.3 60L DOGFOOD pattern × 5)
- **Phase v2.0-2.6 SHIPPED** target window 2026-06-02 ~ 2026-06-05 (10-11 task, ~3-4 day; 6 ADR backfill 单 task ~1 hour × 6 + ship artifacts cluster)
- **🎯 v2.0.0 GA tag** target 2026-06-05 (within ROADMAP v2.0 chapter 1-2 week window 2026-05-22~2026-06-05)

---

## 框架治理路由 (sister CLAUDE.md 三层栈)

本 PLAN.md 在 Phase 2.3+2.4+2.5+2.6 execute 时严格遵守:
- **gstack 决策层** (强制 conditional): Phase 2.6 W0 ADR backfill 时关键 ADR 0024/0027/0028 单独走 gstack `/review` Paranoid Staff Eng 视角 (sister CLAUDE.md "关键模块 PR 前强制" + sister Phase 6.1 W2 T2.6 /review pattern)
- **GSD 项目经理** (主轴): Phase 2.3-2.6 各 phase 通过 `/gsd-execute-phase` 启动 + `/gsd-verify-work` 验收 + `/gsd-progress` 状态同步
- **superpowers 资深工程师**:
  - Phase 2.3 W0.4 judgmentResolver.ts + W0.5 checkAgentTeams.ts + W0.3 exprBuilder.ts → TDD red-green-refactor 强制 (`tdd="true"` marked, core algorithm + 多 fixture I/O test)
  - Phase 2.4 W1.2 ralph-loop fallback UX → TDD 强烈建议 (5 fixture I/O test 先写)
  - 其他 task brainstorming 按需 (subtask-gate 判据触发, sister CLAUDE.md ✅ 触发: 核心 algorithm / API contract / 多方案对比 / 错误成本高)
- **mattpocock 招式** 按需召唤 (per D-09 实装也 verify): 实装 Phase 2.4 W2.2 verify-work workflow 时若 spec 不明 → `/grill-with-docs` self-invoke; 陌生 src/workflow/ 模块 → `/zoom-out` self-invoke
- **planning-with-files** (Stage ② Plan 持久化): 本 PLAN.md 即是 planning-with-files plugin slash cmd `/plan` ship 的 task_plan.md 等价物 (本 phase plan-phase 主轴产出);  Phase 2.3+ execute 时 sub-task 触发 `phase.scope_days > 1` → plan-feature workflow 05-persist auto-invoke `/plan`
- **ralph-loop** completion-promise: Phase 2.3-2.5 每个 [M] / [L] task 通过 `/ralph-loop "<task description>" --completion-promise COMPLETE --max-iterations <N>` 包装 (sister CLAUDE.md "每个子任务必须使用 ralph-loop")
- **Agent Teams** (升级 conditional): Phase 2.4 W2.2 verify-work + Phase 2.5 W2.1 Cycle 2 dogfood 时 if multi-dimensional review needed → TeamCreate 4-specialist Pattern C; cleanup discipline mandatory (sister `~/.claude/rules/agent-teams.md` L42 防呆清单)
- **ctx7 CLI** (库 API 文档): Phase 2.3 W0.3 expr-eval npm dep 实装时 `npx ctx7@latest library expr-eval "Parser cache evaluate"` + docs query (sister `~/.claude/rules/context7.md`)

---

## 复杂架构验证 (gstack /plan-eng-review)

本 PLAN.md ship 前 (Wave B planner 完成时) **已通过 gstack /plan-eng-review** verify (per PLAN-ENG-REVIEW.md ship 2026-05-20):
- 3 P1 finding all RESOLVED via Q-AUDIT-5 ALL Option A
- 8 implementation tasks identified, **ALL 8 已纳入本 PLAN.md** (verify 见 ## Acceptance Backward Mapping 行内引用):
  - #1 judgmentResolver.ts ~60L NEW → T2.3.W0.4
  - #2 checkAgentTeams.ts ~30L + 5 fixture → T2.3.W0.5
  - #3 wire setup.ts → T2.3.W1.1
  - #4 plan-feature workflow.yaml plugin slash cmd 真接 → T2.4.W1.3
  - #5 capabilities planning-with-files entry → T2.3.W0.1 (acceptance c)
  - #6 capabilities agent-teams-enabled entry → T2.3.W0.1 (acceptance c)
  - #7 exprBuilder Parser cache → T2.3.W0.3 (acceptance e)
  - #8 ADR 0027+ errata 节 planning-with-files terminology drift history → T2.6.W0.4

**Plan accepted ✅ confidence 9/10 per PLAN-ENG-REVIEW.md L191** — ready for Phase v2.0-2.2 Wave C plan-checker iter max 3 → Phase v2.0-2.3+ execute spawn.

---

*Phase v2.0-2.2 PLAN.md (Wave B planner output)*
*Created: 2026-05-20*
*Input: 9 mandatory file all Read (CONTEXT 294L + DISCUSSION-LOG 197L + REQUIREMENTS R20 16 项 + RESEARCH 1058L + PLAN-ENG-REVIEW 227L + ROADMAP v2.0 chapter + STATE 142L + ADR 0023 154L + ADR 0011 381L)*
*Output: 32 atomic tasks 覆盖 4 phase (v2.0-2.3 + 2.4 + 2.5 + 2.6); 16 R20.x acceptance backward derived; 8 PLAN-ENG-REVIEW implementation tasks 全部纳入*
*Next: Wave C plan-checker iter max 3 (gap analysis + acceptance backward verify) → Phase v2.0-2.3 execute*
*STATUS: ready-to-execute*
