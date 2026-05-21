# ADR-0032: Cross-Cutting Disciplines (L0) + Execution Mechanism Layer (L5b) + Rules-Based Routing

## Status

**Accepted (phase v3.0-3.6 — 2026-05-21)** — Phase v3.0-3.3 W0 SHIPPED (6 disciplines yaml + 4 NEW judgments yaml + disciplineLoader + 4 hook helper) 完成后 Phase v3.0-3.6 W0 backfill。

> Phase v3.0-3.1 discuss-phase batch 2 LOCKED 5 NEW D-decision (D-09 + D-10 + D-11 + D-12 + D-13) 中 D-05 (cross-cutting 心法招式) + D-09 (L0 Discipline Substrate) + D-10 (L5b Execution Mechanism Layer) + D-11 (rules-based routing) + D-13 (superset commitment) 合并 ADR — 沿袭 ADR 0024 / 0028 多决策合并 errata 模式。

## Context

v2.0.0 GA 2026-05-20 ship 后 user 即时识别 3 个 architectural gap, 在 Phase v3.0-3.1 batch 2 (Q5-Q9) LOCKED 为 D-09 / D-10 / D-11 / D-13:

### Gap (a) — Discipline 散在 workflow / capability / hook 各处, 未 1st-class

`~/.claude/CLAUDE.md` 顶层"语言与输出规范" + "对话回答风格" + "响应规范" + "其他通用规则" + "Web 搜索路由" 等 13 节 prose 是 cross-stage cross-subtask global rules — 既不是 capability (无 slash cmd), 也不是 phase (不属于某个 stage), 也不是 judgment (不是路由判据 而是行为约束)。v2.0 schema 把"karpathy ≤200L 硬限"埋在 `workflows/execute-task/phases.yaml` 注释、把"中文输出"埋在 `superpowers:brainstorming` capability description, 缺统一 SoT。

### Gap (b) — Subagent + Agent Teams 与 workflow orthogonal 但未 1st-class

`~/.claude/rules/agent-teams.md` 完整生命周期 + 防呆清单 + Pattern A/B/C + token 估算公式与 workflow yaml **orthogonal** (任何 phase / 任何 workflow 都可以选择并行机制); ralph-loop 也是 orthogonal wrapper (套在 subagent / team / 主 session 外层保 completion-promise)。v2.0 把 `parallelism-gate.yaml` 单文件 wire 在 `workflows/execute-task/`, 暗示是 execute-task 私有, 实际是全 workflow 共享。

### Gap (c) — Routing rule 散在 CLAUDE.md prose 未 codify

`~/.claude/rules/web-design.md` (ui-ux-pro-max 默认 + frontend-design 补充 + 冲突仲裁), `~/.claude/rules/web-testing.md` (脑/手/筋骨三层职责矩阵), `~/.claude/rules/web-search.md` (Tavily / Exa MCP 探测 + ctx7 + WebFetch 条件式 fallback), `~/.claude/CLAUDE.md` 4-stage cadence 都是 prose-only judgement, 未机器化为 expr-eval expression。Phase 3.1 user direct (Q7): "结合 rules 补充一下抉择路由"。

### A7 守恒约束 (ADR 0001-0031 main body 不可改)

phase v3.0-3.6 沿袭 ADR 0024 / 0028 errata 风格 — **不动 ADR 0001-0031 main body** (A7 守恒)。本 ADR 0032 是 v3.0 三层"cross-cutting"补丁, 不修改 v2.0 schema_version `harnessed.workflow.v2` 或 capability abstraction core (ADR 0024 § 2)。

## Decision

3 NEW first-class concept 入 v3.0 schema:

### 1. L0 Discipline Substrate (D-09 — Q5 LOCKED 2026-05-20)

**Decision: `workflows/disciplines/*.yaml` 6 file NEW first-class layer, schema = `id → {description, severity, fires_when?, applies_to?, expected?, forbidden?}`。workflow.yaml v3 `disciplines_applied:` 字段引用 + runtime 4 hook helper inject + enforce。**

**6 yaml file baseline** (Phase v3.0-3.3 W0.4 SHIPPED, schema_version: `harnessed.discipline.v1`):

| File | Rules count | CLAUDE.md / rules 来源 |
|------|-------------|------------------------|
| `karpathy.yaml` | 5 rule (think-before-coding / simplicity-first / surgical-changes / goal-driven-execution / file-200l-hard-limit) | CLAUDE.md "andrej-karpathy-skills 心法" |
| `output-style.yaml` | 7 rule (BLUF / no-sycophantic / no-emoji / no-em-dash / precise-quantifier / no-trailing-summary / no-empty-followup) | CLAUDE.md "对话回答风格" 4 节 |
| `language.yaml` | 3 rule (default-zh-hans / preserve-english-verbatim / explicit-language-override) | CLAUDE.md "语言与输出规范" |
| `operational.yaml` | 6 rule (commit-safety-no-push / no-skip-hooks / no-amend / surgical-staging / verbatim-citation / windows-bash-msys2) | CLAUDE.md "其他通用规则" + project CLAUDE.md "Windows dev environment quirks" |
| `priority.yaml` | priority_hierarchy ordered list (gstack > GSD > superpowers > planning-with-files > karpathy > parallelism-mechanism > ralph-loop) | CLAUDE.md "响应规范与优先级" |
| `protocols.yaml` | 3 protocol (cc-handoff self-contained-doc / agent-teams-lifecycle / google-workspace-gws) | `~/.claude/rules/cc-handoff.md` + `agent-teams.md` + `google-workspace.md` |

**4 hook fire point** (Phase v3.0-3.3 W0.9 SHIPPED, `src/discipline/enforcement/`):

- `before-spawn.ts` — subagent / Agent Teams spawn 前 inject karpathy 心法 + language default + priority hierarchy
- `before-phase-execute.ts` — phase execute 前 inject discipline applies_to filter (per-stage)
- `before-commit.ts` — git commit 前 enforce operational.yaml (no-skip-hooks / no-amend / surgical-staging) + biome preempt
- `after-output.ts` — LLM 输出后 enforce output-style.yaml (no-emoji / no-em-dash / no-sycophantic) + language.yaml (default-zh-hans)

**`src/workflow/disciplineLoader.ts` SHIPPED** (Phase v3.0-3.3 W0.9): `loadDiscipline(basename, packageRoot)` + `loadAllApplied(workflow, packageRoot)` + `getRule(basename, ruleId)` + `DEFAULT_APPLIED` 6 file 默认数组。

### 2. L5b Execution Mechanism Layer (D-10 — Q6 LOCKED 2026-05-20)

**Decision: subagent / Agent Teams / 主 session / ralph-loop 是 cross-workflow orthogonal mechanism, NOT phase-private。`workflows/judgments/parallelism-gate.yaml` (sister ADR 0028 D-11) extend 为 L5b 层共享 judgment; 任何 workflow phase 引用 `judgments.parallelism-gate.<route>.fires` 决定 subagent fan-out vs Agent Teams upgrade vs 主 session 直跑; ralph-loop 是 orthogonal wrapper (sister ADR 0028 D-10 verbatim COMPLETE) 套在选定执行单元外层。**

**4 路径** (sister ADR 0028 D-11 完整复用, v3.0 NOT 改 schema):

- `subagent-default` — `subtask.parallel_count <= 3 and subtask.communication_needed == false`
- `main-session-fallback` — `subtask.lines < 20 or subtask.type == 'single_command_query'`
- `agent-teams-upgrade` — 5 升级触发 OR-chain (teammate_send_message_needed / subagent_context_overflow / shared_task_list / opposing_hypothesis_debate / fullstack_three_way) per `~/.claude/rules/agent-teams.md`
- `ralph-loop-wrapper` — 正交 wraps array, 套外层保 completion-promise verbatim COMPLETE

**Capability mirror** (`workflows/capabilities.yaml` v3 entry): `agent-teams-create` + `agent-teams-send-message` + `agent-teams-shutdown` 3 entry (sister Phase v2.0-2.3 W0.1 SHIPPED, D-11 + Q-AUDIT-5b)。

### 3. Rules-Based Routing — 4 NEW judgments yaml (D-11 — Q7 LOCKED 2026-05-20)

**Decision: 4 NEW judgments yaml file 机器化 `~/.claude/rules/*.md` prose 为 expr-eval expression, 沿袭 ADR 0026 multi-file judgmentResolver 4-level ref pattern。**

| File | Triggers | rules/CLAUDE.md 来源 |
|------|----------|----------------------|
| `web-design-routing.yaml` | 3 (ui-ux-pro-max-default / frontend-design-override / design-review-gstack) | `~/.claude/rules/web-design.md` |
| `web-testing-routing.yaml` | 4 (playwright-test-default / playwright-cli-probe / webapp-testing-python / chrome-devtools-mcp-perf) | `~/.claude/rules/web-testing.md` "脑/手/筋骨" 三层职责矩阵 |
| `web-search-routing.yaml` | 5 (tavily-default / exa-descriptive-academic / tavily-crawl-site / ctx7-lib-docs / webfetch-single-url) | `~/.claude/rules/web-search.md` 条件式 fallback |
| `stage-routing.yaml` | 10 (discuss-strategic / discuss-phase / discuss-subtask / plan-architecture / plan-phase / verify-progress / verify-paranoid / verify-qa / verify-security / verify-design / verify-multispec / verify-simplify) | `~/.claude/CLAUDE.md` 4-stage cadence + L4 master `auto/workflow.yaml` 委派 |

**Reuse pattern**: `judgments/<file>.yaml` 沿袭 ADR 0026 schema (`schema_version: harnessed.judgment.v1` + `triggers.<route>.fires_when` expr-eval expression), `judgmentResolver.ts` pre-resolve 4-level ref before expr-eval; workflow.yaml v3 phase 通过 `on: [{if: 'judgments.web-design-routing.ui-ux-pro-max-default.fires', invoke: '{{ capabilities.ui-ux-pro-max.cmd }}'}]` 引用。

## Drivers

- **D-05** (Phase v3.0-3.1 user clarify 3): "心法招式应该也是全阶段的" → 心法招式 cross-cutting NOT phase-private
- **D-09** (Q5 batch 2 LOCKED): NEW L0 Discipline Substrate 6 yaml + workflow.yaml v3 `disciplines_applied:` 字段 + 4 hook fire point
- **D-10** (Q6 batch 2 LOCKED): NEW L5b Execution Mechanism Layer 1st-class architectural concept
- **D-11** (Q7 batch 2 LOCKED): Rules-based routing 4 NEW judgments yaml 机器化 prose
- **D-13** (Q9 batch 2 LOCKED): superset commitment — harnessed 必须 1:1 cover CLAUDE.md + `~/.claude/rules/*.md` + Obsidian doc 全集; harnessed > user manual via auto gate-route + Pure bundled + cross-session memory + ADR audit + Token cost estimation

## Consequences

### Positive

- **Cross-cutting concerns 1st-class** — discipline / execution-mechanism / rules-routing 三层不再散在 prose 或 phase-private yaml, 集中 SoT 机器化, end-user `npm install -g harnessed@3.0 && harnessed setup --apply` 一行享用
- **D-13 superset commitment 验证可执行** — CLAUDE.md 13 节 + `~/.claude/rules/*.md` 5 file 1:1 mapping table 完整 (见 § Acceptance Bar)
- **4 hook fire point 自动 enforce** — before-spawn / before-phase-execute / before-commit / after-output 把 discipline rule runtime 注入, NOT prose-only
- **Routing rule expr-eval 化** — 4 NEW judgments yaml + judgmentResolver 4-level ref 沿袭, sister Phase v2.0-2.3 W0.4 ship infra 复用

### Negative

- **6 NEW yaml + 4 NEW hook helper + 4 NEW judgments yaml file count 扩大** — `workflows/disciplines/` 0 → 6 file, `workflows/judgments/` 6 → 10 file, `src/discipline/enforcement/` 0 → 4 file; karpathy ≤200L 单文件硬限守住 (disciplineLoader.ts 71L SHIPPED)
- **Capability abstraction 学习成本叠加** — maintainer 写 workflow.yaml v3 需 reference 3 个层 (disciplines / judgments / capabilities) entry name, onboarding cost 增加
- **Schema version 不 bump** — `harnessed.workflow.v2` 复用 (NOT v3), 仅 schema 内字段 additive 扩展 (`disciplines_applied:` + `category:`), 沿袭 ADR 0024 backward-compat additive principle

### Neutral

- **Schema version 不 bump** — sister ADR 0024 § Neutral additive principle; v3.0 milestone class 是 4-stage namespace-layered refactor (ADR 0031) + cross-cutting codify (本 ADR), workflow schema 仍是 `harnessed.workflow.v2`
- **Discipline 优先级 (priority.yaml)** — multi-capability fires_when 同时 true 时, priority_hierarchy 决定执行顺序; sister ADR 0028 D-13 tdd-gate fires-when 共存判据
- **Rules → judgments mapping 是 codify NOT 重新发明** — `~/.claude/rules/*.md` prose 仍是 SoT 起点, judgments yaml 是机器可读 codify, maintainer 改 rules.md → 同步改 judgments yaml + 写 ADR errata

## Alternatives

### Option A — 内嵌 discipline 进每个 workflow.yaml (REJECTED)

把 karpathy 心法 / output-style / language 直接写在 `workflows/<stage>/<sub>/workflow.yaml` 顶部 prose 块。**Rejected reason**: 重复 boilerplate per workflow (20 workflow × ~50L discipline prose = ~1000L 重复); discipline 升级 (e.g., 加新规则) 需 sync 改 20 file; 不机器化 (prose 不能 expr-eval enforce)。

### Option B — Comment-only convention (REJECTED)

CLAUDE.md prose 不机器化, 仅靠 yaml 注释提醒 maintainer。**Rejected reason**: 不机器化 → 不能 runtime enforce → end-user 拿到 bundled defaults 仍需 read CLAUDE.md prose, 违反 v3.0 superset commitment (D-13)。before-commit hook 无法 expr-eval comment 文本。

## Validation

**SHIPPED 2026-05-20 (Phase v3.0-3.3 W0)**:

- Phase v3.0-3.3 W0.3 (4 NEW judgments yaml — `web-design-routing.yaml` + `web-testing-routing.yaml` + `web-search-routing.yaml` + `stage-routing.yaml`)
- Phase v3.0-3.3 W0.4 (6 disciplines yaml — `karpathy.yaml` + `output-style.yaml` + `language.yaml` + `operational.yaml` + `priority.yaml` + `protocols.yaml`)
- Phase v3.0-3.3 W0.9 (`disciplineLoader.ts` 71L + 4 hook helper 16-30L each — `before-spawn.ts` / `before-phase-execute.ts` / `before-commit.ts` / `after-output.ts`)
- Phase v3.0-3.3 W0.10 (`check-workflow-schema.mjs` 3-cross-validate contract — discipline yaml + judgments yaml + capabilities.yaml entry 互引完整性)

**Phase v3.0-3.5 dogfood pending**: 4 hook fire point 在 1 个真实 phase 跑完 4-stage 触发率 ≥ 95% (Pre-LOCK 验收)。

## References

### 内部依据

- `docs/adr/0024-workflow-schema-v2-capability-abstraction.md` § 2 Capability abstraction flat yaml map (sister discipline/judgment 同 pattern 复用)
- `docs/adr/0026-judgments-multi-file-expr-eval-resolver.md` (multi-file judgments + judgmentResolver 4-level ref 沿袭, 本 ADR 4 NEW judgments yaml 直接复用 infra)
- `docs/adr/0028-ralph-loop-tdd-agent-teams-routing-schema-fix.md` § D-11 parallelism-gate + Agent Teams env check (sister L5b execution mechanism orthogonal 起源)
- `docs/adr/0031-4-stage-namespace-layered-architecture.md` (sister Phase v3.0-3.6 W0 backfill, 4-stage namespace + L0/L5b 在该 layered architecture 中的层级 position)
- `.planning/phase-v3.0-3.1/3.1-DISCUSSION-LOG.md` Q5 + Q6 + Q7 + Q9 batch 2 transcript (D-05 + D-09 + D-10 + D-11 + D-13 LOCK 上下文)
- `.planning/phase-v3.0-3.2/PLAN.md` L634-644 T3.6.W0.3 spec
- `.planning/REQUIREMENTS.md` § R30 NEW (v3.0 acceptance superset)
- `workflows/disciplines/karpathy.yaml` + `output-style.yaml` + `language.yaml` + `operational.yaml` + `priority.yaml` + `protocols.yaml` (Phase v3.0-3.3 W0.4 SHIPPED 6 yaml)
- `workflows/judgments/web-design-routing.yaml` + `web-testing-routing.yaml` + `web-search-routing.yaml` + `stage-routing.yaml` (Phase v3.0-3.3 W0.3 SHIPPED 4 NEW yaml)
- `src/workflow/disciplineLoader.ts` 71L (Phase v3.0-3.3 W0.9 SHIPPED)
- `src/discipline/enforcement/before-spawn.ts` + `before-phase-execute.ts` + `before-commit.ts` + `after-output.ts` (Phase v3.0-3.3 W0.9 SHIPPED 4 hook helper)
- `scripts/check-workflow-schema.mjs` (Phase v3.0-3.3 W0.10 SHIPPED — 3-cross-validate contract)

### 外部参考

- `~/.claude/CLAUDE.md` (user 三层栈方法论 prose 原型, L0 6 yaml + 4 NEW judgments codify 对象, D-13 superset 1:1 mapping source)
- `~/.claude/rules/agent-teams.md` (L5b execution mechanism Pattern A/B/C + 防呆清单 + token 估算公式)
- `~/.claude/rules/cc-handoff.md` (protocols.yaml cc-handoff self-contained-doc 协议)
- `~/.claude/rules/web-design.md` + `web-testing.md` + `web-search.md` + `context7.md` + `google-workspace.md` (4 NEW judgments yaml codify 起点)

## Acceptance Bar

### D-13 1:1 mapping table (CLAUDE.md / rules → harnessed artifact)

| CLAUDE.md / rules section | harnessed artifact | Coverage |
|---------------------------|---------------------|----------|
| 角色与框架定位 (gstack / GSD / superpowers / planning-with-files / karpathy / mattpocock / ralph-loop / Agent Teams) | `workflows/capabilities.yaml` category field (6 enum) + `workflows/<stage>/<sub>/SKILL.md` 20 entry | 全 |
| gstack 治理关卡 (强制 / 可选) | gstack 6 core capabilities (`gstack-office-hours` / `gstack-plan-ceo-review` / `gstack-review` / `gstack-qa` / `gstack-cso` / `gstack-design-review`) + 33 optional registry entry | 全 |
| 澄清/审查触发判据 (战略 / Phase / 子任务 + Fallback 三条铁律) | `judgments/strategic-gate.yaml` + `phase-gate.yaml` + `subtask-gate.yaml` + `judgments/fallback.yaml` 三条铁律 codify | 全 |
| 子任务并行执行机制 (subagent vs Agent Teams 路由 + ralph-loop orthogonal wrapper) | `judgments/parallelism-gate.yaml` 4 路径 + capabilities `agent-teams-create/send-message/shutdown` 3 entry + `ralph-loop` capability + `judgments/parallelism-gate.ralph-loop-wrapper` route | 全 |
| 详细工作流 (Discuss / Plan / Execute / Verify 4 stage cadence) | 20 workflow yaml (4 master `auto/` + 14 sub + 2 standalone) + 4 master orchestrator (sister ADR 0031) + `judgments/stage-routing.yaml` 10 trigger | 全 |
| 语言与输出规范 (默认中文 + 8 类英文原文保留 + 例外覆盖) | `disciplines/language.yaml` 3 rule + `after-output.ts` hook enforce | 全 |
| 对话回答风格 (BLUF / 禁 sycophantic / 禁 emoji / 禁 em-dash / 精确量词 / 禁结尾总结 / 禁空洞续作) | `disciplines/output-style.yaml` 7 rule + `after-output.ts` hook enforce | 全 |
| 响应规范与优先级 (gstack > GSD > superpowers > planning-with-files > karpathy > parallelism > ralph-loop) | `disciplines/priority.yaml` priority_hierarchy ordered list | 全 |
| Web 搜索路由 (Tavily / Exa MCP 探测 + ctx7 + WebFetch 条件式 fallback) | `judgments/web-search-routing.yaml` 5 trigger + capabilities (`tavily-search` / `exa-search` / `ctx7-cli` / `webfetch`) entry | 全 |
| 其他通用规则 (commit safety / 不 skip hooks / 不 amend / Windows MSYS2 / surgical-changes / 跨 CC handoff) | `disciplines/operational.yaml` 6 rule + `before-commit.ts` hook enforce + `disciplines/protocols.yaml` cc-handoff 协议 | 全 |
| `~/.claude/rules/agent-teams.md` (生命周期 + 防呆 + Pattern A/B/C + token 公式) | `judgments/parallelism-gate.yaml` agent-teams-upgrade 5 trigger + capabilities 3 entry + `disciplines/protocols.yaml` agent-teams-lifecycle 协议 | 全 |
| `~/.claude/rules/cc-handoff.md` (Ideation→Onboarding / Plan-CC→Execute-CC 自包含文档要求) | `disciplines/protocols.yaml` cc-handoff self-contained-doc 协议 + 写入边界表 | 全 |
| `~/.claude/rules/web-design.md` (ui-ux-pro-max 默认 + frontend-design 补充 + 冲突仲裁) | `judgments/web-design-routing.yaml` 3 trigger + capabilities (`ui-ux-pro-max` / `frontend-design` / `gstack-design-review`) entry | 全 |
| `~/.claude/rules/web-testing.md` (脑/手/筋骨 三层职责矩阵 + 非功能性诊断) | `judgments/web-testing-routing.yaml` 4 trigger + capabilities (`playwright-test` / `playwright-cli` / `webapp-testing` / `chrome-devtools-mcp`) entry | 全 |
| `~/.claude/rules/context7.md` (ctx7 CLI library + docs 两步) | `judgments/web-search-routing.yaml` ctx7-lib-docs trigger + capabilities `ctx7-cli` entry | 全 |
| `~/.claude/rules/google-workspace.md` (gws CLI Gmail / Drive / Calendar / Sheets) | `disciplines/protocols.yaml` google-workspace-gws 协议 (operational safety + auth 踩坑) | 全 |

**Acceptance verbatim**: file ≥ 120L + 1:1 mapping table ≥ 16 row + `node scripts/check-workflow-schema.mjs` exit 0 + Phase v3.0-3.6 W1 ci.yml A7 step iter 0031→0032。

---

*ADR 0032: Cross-Cutting Disciplines (L0) + Execution Mechanism Layer (L5b) + Rules-Based Routing*
*Authored: 2026-05-21 Phase v3.0-3.6 W0.3 (sister ADR 0024 / 0028 / 0031 9-section pattern)*
*Acceptance: Phase v3.0-3.3 W0 cumulative ship + Phase v3.0-3.5 dogfood 4 hook fire point 触发率 + Phase v3.0-3.6 W1 ci.yml A7 step iter 0031→0032*
