# Phase 1.4 ASSUMPTIONS — Lock Document

> **目的**: phase 1.4 plan-phase SSOT — 8 acceptance bar status + 4 P0 灰色地带 lock + D-13~D-18 PATTERNS reuse + D1.4-1 ~ D1.4-N 决策追溯
> **依据**: KICKOFF.md (phase 1.4) + RESEARCH.md (R2 — 4 P0 lock D1.4-1~5) + PATTERNS.md (R1 D-13~D-18 + Pattern N/O/P) + AGENT-DEFINITION-FACTORY-CONTRACT.md (phase 1.3 ship) + phase 1.2.5/1.3 ASSUMPTIONS § C/D/E 沿袭
> **状态**: ✅ Wave B.1 完成（plan-phase ASSUMPTIONS lock ready for B.2 PLAN + B.3 task_plan）
> **角色心法/招式**: GSD plan-phase + planning-with-files 持久化 + andrej-karpathy-skills (YAGNI / Goal-Driven / Surgical Changes)

---

## § A 8 Acceptance Bar 状态（phase 1.4 ship 前必须 8/8 ✅）

| # | acceptance bar | Capture 文档（execute-phase task） | 状态 |
|---|---|---|---|
| **C1** | main-process-driven routing engine 实装 — `src/routing/engine.ts` ≤ 200L：query yaml → arbitrate → install missing → reload/restart hint → factory inject → spawn subagent → ralph-loop wrap → verbatim COMPLETE 回流 (F33 mitigation) | `src/routing/engine.ts` (W execute T3.1) + `src/routing/lib/ralphLoop.ts` (如 spillover) | ⏳ |
| **C2** | AgentDefinition factory 实装 1:1 对应 contract 12 字段 — `src/routing/agentDefinition.ts` ≤ 150L：12 字段 + factory signature + 4 错误处理路径 + skills fail-fast SkillNotInstalledError + verbatim COMPLETE prompt template | `src/routing/agentDefinition.ts` (W execute T3.2) | ⏳ |
| **C3** | 6 category routing rules MVP execute — design / content / testing / search 4 category 实测命中（engineering category v1 占位 0 rules base 已装；meta category 推 phase 1.5 sub-routing schema 完整）；每 category ≥ 5 真实样本验证 | (无新源码 — 测试覆盖在 C6) | ⏳ |
| **C4** | research workflow E2E — search category 端到端跑通：用户 prompt → arbitrate hit search rule → install Tavily + Exa + ctx7 (idempotent skip) → spawn subagent inject skills → invoke ctx7/Tavily/Exa → ralph-loop wrap → verbatim COMPLETE 回流 → 主流程返回 | `src/cli/research.ts` (W execute T5.1) + cli.ts wire (T5.2) + `tests/integration/routing-research-workflow.test.ts` (T5.3, ≥ 3 cell, env-gated `HARNESSED_REAL_SPAWN=1`) | ⏳ |
| **C5** | main agent system prompt verbatim COMPLETE 强制 — `src/routing/systemPrompt.ts` ≤ 80L：明确 instructional language 防 subagent final message summarize (F33 P1) + skills fail-fast 处理指引 + max-iterations × 50 兜底 | `src/routing/systemPrompt.ts` (W execute T3.3) | ⏳ |
| **C6** | 30 真实查询样本路由命中率 ≥ 85% v0.1 内部基线 — `tests/integration/routing-30-samples.test.ts` ≥ 30 cell + tolerance threshold；6 category × 5 sample 均衡分布；样本来源用户 CLAUDE.md trigger phrase + phase 1.2.5/1.3 progress.md 实际决策点（不允许 ad-hoc 编造，plan-phase 锁 SAMPLES.md）| `.planning/phase-1.4/SAMPLES.md` (W execute T6.1) + `tests/integration/routing-30-samples.test.ts` (T6.2) | ⏳ |
| **C7** | Cross-OS CI 三平台保持全绿 + A7 step iterate 1-7 → 1-8（新加 0008 baseline tag）+ ADR 0001-0007 main body 守恒持续 | `.github/workflows/ci.yml` 改 3 处 + L34-L38 注释 1.3 → 1.4（W execute T1.2 + T7.1）| ⏳ |
| **C8** | ADR 0008 errata 起草 + accepted + `adr-0008-accepted` tag — 含 phase 1.3 deferred items inline (H1a perf transparency reference / M1 yaml path migration 官方化 / phase 1.4 routing engine 接口契约升级如实装中 emerge 微调) | `docs/adr/0008-routing-engine-v1-errata.md` (W execute T1.1) | ⏳ |

---

## § B 4 P0 灰色地带 Lock（D1.4-1 ~ D1.4-5）

来自 RESEARCH.md § 5「4 P0 lock 推荐汇总」+ § 1-4 详细论证。

| ID | 决策 | Lock | 理由（含 R2 引用，HIGH conf 注明）|
|---|---|---|---|
| **P0-1** | CC plugin install 真实 API + `/reload-plugins` skill bug fallback | **Install via `Bash("claude plugin install <name> --scope project")` + 不依赖 `/reload-plugins`**；改为 **fresh subagent invoke 路径（spawn 时 CC runtime 从 `~/.claude/skills/<name>/SKILL.md` filesystem scan）绕过 reload bug**；极端场景 raise `RestartRequiredError` (factory 抛 — main agent print 用户友好消息 "请 exit + restart Claude Code 让 plugin 生效")；idempotent_check 沿用 phase 1.1 manifest 字段 (如 `claude mcp list \| grep -q tavily`) | R2 § 1 P0-1 (HIGH conf) — 官方 docs verbatim + GitHub issue #35641/#46594/#38501/#46040 fresh evidence 2026 Q1-Q2 仍 broken；v2.1.110 changelog 未含 skill registry sync fix；fresh subagent invoke + filesystem scan 是 CC v2.1 当前唯一稳定的 install→skill-available 路径 |
| **P0-2 contract delta** | AgentDefinition factory 真实 spawn API + 2 个新字段 (`initialPrompt` / `criticalSystemReminder_EXPERIMENTAL`) | **phase 1.3 12 字段 100% accurate** — 不动 contract v1 main body（A7 守恒）；2 新字段在 ADR 0008 errata 标记为 **「possible v1.1 errata, deferred to phase 1.5」**；phase 1.4 实装 12 字段 1:1（contract § 2）；spawn signature `query({ options: { allowedTools: [...,'Agent'], agents: { name: factory(...) } } })`；**Tool name `Task`/`Agent` 双兼容** (CC v2.1.63 rename 兼容)；subagent `tools` 绝不能含 'Agent' (Fact D 嵌套禁止) | R2 § 2 P0-2 (HIGH conf) — code.claude.com TypeScript reference fetched 2026-05-13 + ctx7 双源 + Anthropic 官方 docs verbatim |
| **P0-2 ralph-loop** *(D1.4-3 重大新发现)* | ralph-loop integration 路径 | **phase 1.4 在 `src/routing/engine.ts` 内自实装 ralph-loop wrap** (≤ 50L 纯 string match + iteration 计数)；**不引入 anthropics/claude-code/plugins/ralph-wiggum 作为 dep**（违反 wedge 原则 — 不 vendor）；max-iter 20 (external) × maxTurns 50 (internal) = 1000 round-trips worst case；main prompt verbatim 强制 + subagent CRITICAL RULE inline ("Do not output COMPLETE to escape the loop early, even if stuck")；v0.2+ 评估升级到 `--add-plugin ralph-wiggum` headless mode | R2 § 2.3-2.4 P0-2 (HIGH conf) — Anthropic **官方** plugin 已存在 `anthropics/claude-code/plugins/ralph-wiggum/` (重大新发现)；fresh 2026-05-13 实证：`--completion-promise` 是 exact string match 且 max-iterations 是「actual safety net」、`--completion-promise` 只是「happy path」；harnessed wedge 原则不 vendor 但要参照官方 plugin 的 verbatim/CRITICAL RULE 文本（D-18 enforce 1:1 同步 contract § 5.4）|
| **P0-3** | Tavily / Exa / ctx7 install 顺序 + 并行安全性 | **ctx7 (npm install -g) 与 MCP install 可并行** — npm registry 独立操作；**tavily MCP install 与 exa MCP install 必须 sequential** — 共享 `.mcp.json` race condition 实证（mcs CLI 项目 evidence）；verify 阶段 (`claude mcp list` / `ctx7 --version`) 全可并行；走 phase 1.3 ship 的 `harnessed install <name> --apply --non-interactive` 子命令 wrapper（不直接调 `claude mcp add`，复用 idempotency） | R2 § 3 P0-3 (HIGH conf) — npm view 实测 tavily-mcp@0.2.19 / exa-mcp-server@3.2.1 / ctx7@0.4.2 三 package 互不依赖；mcs CLI 项目 fresh 2026 实证 `~/.claude.json` race risk |
| **P0-4** | 30 真实查询样本路由命中率 ≥ 85% v0.1 内部基线 | **6 category × 5 sample = 30**（design/content/testing/search 各 5 + meta 5 + engineering 5 base layer trigger）；样本来源用户 CLAUDE.md trigger phrase + phase 1.2.5/1.3 progress.md 实际决策点（**不允许 ad-hoc 编造**）；**plan-phase Wave B SAMPLES.md 锁定**（execute-phase 不可改样本只能改 decision_rules.yaml 或被 supervisor 兜底）；30 sample 含 ≥ 3 ambiguous/borderline 验证 fallback_supervisor；engineering category sample 走 fallback expected (≤ 5 sample 防拉低总命中率)；多 model 横切 Haiku/Sonnet/Opus（v0.1 内部基线允许 single-model 跑通 — 多 model 是 phase 3.4 v0.3.0 完整验收）；85% baseline 与业界 LangChain Top-1 ≥ 0.85 alignment HIGH | R2 § 4 P0-4 (MEDIUM-HIGH conf) — Thinking Loop 7-benchmark + LangChain ecosystem 业界标准；30 sample 分布是推断（合理但未直接 cite phase 1.0 RESEARCH 原文 — phase 1.0 R03 引用即可）|

---

## § C D-13 ~ D-18 PATTERNS reuse decisions Lock

来自 PATTERNS.md § 4「Phase 1.4 reuse decisions D-13 ~ D-18（追溯 phase 1.3 D-7~D-12 风格）」。续接 phase 1.3 D-7~D-12 编号。

| ID | 决策 | 实施位置 | 来源 |
|---|---|---|---|
| **D-13** | engine.ts 主流程 ≤ 200L 编码限（karpathy simplicity hard limit） — 超出必须先抽 helper 到 `src/routing/lib/`（沿袭 `src/installers/lib/` Pattern E 共享 helpers 风格） | `src/routing/engine.ts` 200L hard limit；spillover → `src/routing/lib/ralphLoop.ts` / `verbatim.ts` | R1 PATTERNS § 4 D-13 |
| **D-14** | agentDefinition.ts 走 throw-error（不走 Pattern C Result discriminator） — `Promise<AgentDefinition>` (contract § 3 锁) + throw `SkillNotInstalledError` / `InvalidDecisionError` / `MissingSkillsError` (contract § 5.1)；engine.ts 内部 catch 后 narrow 到 EngineResult 三态 | `src/routing/agentDefinition.ts` factory throw；`src/routing/engine.ts` try/catch narrow | R1 PATTERNS § 4 D-14 |
| **D-15** | research.ts 走独立子命令（沿袭 D-9 install-base 路径）— `harnessed research <prompt>` 独立子命令，不在 install/install-base 上加 flag；为 phase 1.5 `harnessed run <prompt>` / `harnessed plan <prompt>` 留扩展点（sub-routing 命令家族） | `src/cli/research.ts` + `registerResearch(program)` 注册到 `src/cli.ts` (9th register fn) | R1 PATTERNS § 4 D-15 |
| **D-16** | 30 sample test 走 inline truth table（不进 tests/fixtures/routing-samples/）— `tests/integration/routing-30-samples.test.ts` 内 inline `const SAMPLES = [{task, expected_category, expected_primary}, ...]` 30 项 ≤ 200L；同步 SAMPLES.md（plan-phase review 用）；100+ sample 时（phase 3.4 v0.3.0）再抽 fixture | `tests/integration/routing-30-samples.test.ts` inline + `.planning/phase-1.4/SAMPLES.md` 镜像 | R1 PATTERNS § 4 D-16 |
| **D-17** | ADR 0008 走 errata 路径（不走 wedge 新 ADR），含 phase 1.3 deferred items inline — 6-section ADR 0005/0007 风格；含 (1) routing engine 接口契约升级如实装中 emerge 微调 (2) H1a perf transparency reference 加到 Consequences 段 (3) M1 yaml path migration 官方化（`.planning/decision_rules.yaml` → `routing/decision_rules.yaml` 更新 ADR 0007 path refs） | `docs/adr/0008-routing-engine-v1-errata.md` | R1 PATTERNS § 4 D-17 |
| **D-18** | systemPrompt.ts 与 contract § 5.4 1:1 同步 enforce（plan-checker enforce）— prompt 字符串必须 1:1 对应 contract § 5.4 mandatory instruction 文本；任何调整必须先改 contract 再改 prompt（不是反向）；contract drift 任何调整必走 ADR 0008+ errata；防 prompt-as-code 漂移 | `src/routing/systemPrompt.ts` + plan-checker enforce | R1 PATTERNS § 4 D-18 |

---

## § D Phase 1.4 决策追溯表 D1.4-1 ~ D1.4-15

| 决策 ID | 内容 | 来源 |
|---|---|---|
| **D1.4-1** | install via `claude plugin install --scope project` + 不依赖 `/reload-plugins`（fresh subagent invoke 路径） | R2 § 1 P0-1 lock |
| **D1.4-2** | phase 1.3 contract 12 字段 100% accurate；`initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` 推 phase 1.5 errata（A7 守恒不动 v1 main body） | R2 § 2 P0-2 contract delta lock |
| **D1.4-3** | phase 1.4 自实装 ralph-loop wrap (≤ 50L)；不 vendor anthropics 官方 plugin；max-iter 20 × maxTurns 50 双 cap；main prompt verbatim 强制 + subagent CRITICAL RULE inline | R2 § 2.4 P0-2 ralph-loop lock（重大新发现 — anthropics/claude-code/plugins/ralph-wiggum 已是官方 plugin，但 phase 1.4 wedge 原则不 vendor） |
| **D1.4-4** | install order — ctx7 (npm) 与 MCP install 并行；tavily MCP + exa MCP sequential；verify 全并行；走 `harnessed install <name>` wrapper（不直接 `claude mcp add`） | R2 § 3 P0-3 lock |
| **D1.4-5** | 30 sample 选取 — 6 category × 5 sample；plan-phase SAMPLES.md 锁；含 ≥ 3 ambiguous/borderline；engineering ≤ 5 sample；85% baseline 与业界 alignment | R2 § 4 P0-4 lock |
| **D1.4-6** | engine.ts 主流程 ≤ 200L hard limit（D-13 实装策略）；spillover 抽 `src/routing/lib/` | PATTERNS § 4 D-13 + KICKOFF C1 |
| **D1.4-7** | agentDefinition.ts ≤ 150L + factory throw（D-14） | PATTERNS § 4 D-14 + KICKOFF C2 + contract § 3 |
| **D1.4-8** | systemPrompt.ts ≤ 80L + verbatim 1:1 contract § 5.4（D-18） | PATTERNS § 4 D-18 + KICKOFF C5 + contract § 5.4 |
| **D1.4-9** | research.ts 独立子命令（D-15）+ 9th register fn | PATTERNS § 4 D-15 |
| **D1.4-10** | 30 sample inline truth table（D-16）；SAMPLES.md 镜像 plan-phase | PATTERNS § 4 D-16 |
| **D1.4-11** | ADR 0008 errata 路径（D-17）；含 phase 1.3 deferred H1a + M1 inline | PATTERNS § 4 D-17 + KICKOFF C8 |
| **D1.4-12** | A7 守恒 — ADR 0001-0007 main body 不动；ci.yml A7 step iter 1-7 → 1-8（C7） | KICKOFF § 关键约束 1 |
| **D1.4-13** | A1' gstack 6+ 角色 routing enforcement — phase 1.4 routing engine 必须能 dispatch design/engineering category 内部 sub-routing；engineering category v1 占位 0 rules + mattpocock 23 招式 phase routing 推 phase 1.5（KICKOFF 第 38 行 explicit deferred）；design category sub-routing 有效 (ui-ux-pro-max default + frontend-design override) | KICKOFF § 用户硬要求持续 enforce + Risk 6 |
| **D1.4-14** | A4' karpathy 4 心法 inject — AgentDefinition prompt template 始终包含 4 心法 always-on baseline（Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution）；agentDefinition.ts factory 在 prompt 拼装时 prepend 4 心法 line | KICKOFF § 用户硬要求持续 enforce A4' |
| **D1.4-15** | A8' 6 category × decision rules execute — phase 1.4 是首个真实跑 routing 的 phase；每 category ≥ 5 样本验收命中（C6）；engineering category 走 fallback_supervisor 兜底（30 sample 中 engineering ≤ 5 走 fallback expected） | KICKOFF § 用户硬要求持续 enforce A8' + R6 mitigation |

---

## § E paranoid 风险登记（来自 PATTERNS § 5 + RESEARCH § 6 合并）

合并 PATTERNS.md § 5 风险 1-6（实装路径具体）与 RESEARCH.md § 6 风险 R1-R6（fresh 2026 实证），去重对齐到 6 条。

### R1: main-process-driven `query() + agents config` API 真实形态未实证

- **触发**: KICKOFF C1 + D1.2.5-3 lock "subagent 不能动态 install/reload skill" + Wave A R2 调研基于官方 docs + ctx7 但实战 spawn API 调用、reload-plugins 行为、verbatim COMPLETE 回流是否真按预期都未实证
- **严重度**: 🔴 P0
- **mitigation**:
  - **Step 1 (Wave 1 Spike)**: phase 1.4 execute-phase 第一步必须 spike — `scripts/spike/routing-spawn-agent.sh` (D1.4-1 实证 — bash claude plugin install + main-process spawn agent + verbatim COMPLETE 实测) + `.planning/phase-1.4/SPIKE-REPORT.md`（执行报告含实测路径 + verbatim COMPLETE feasibility + ralph-loop wrap 时序）
  - **Step 2**: skeleton spawn 验证 — engine.ts 最简版（仅 spawn `task: 'echo COMPLETE'`，验证 verbatim 回流）通过后再加 routing arbitrate / install / verbatim grep 等链路
  - **Step 3 (Wave 4 E2E)**: research workflow E2E test (C4) 走 `HARNESSED_REAL_SPAWN=1` skipIf gate（沿袭 Pattern K installer-real-spawn.test.ts L31）— 默认 mock，实证时手动跑
  - **Step 4 (D-18 enforce)**: 若 `query()` API 形态与 contract 不符，必须先走 ADR 0008 errata 调整 contract，再改 implementation

### R2: `/reload-plugins` 真实 API 与 install 后 fresh subagent invoke 时序

- **触发**: KICKOFF C1 链路 step 3 "install missing skill/mcp + /reload-plugins/restart hint"；GitHub issue #35641/#46594/#38501/#46040 fresh 2026 Q1-Q2 仍 open，install 后 reload 不可靠；fresh subagent invoke 时是否走 filesystem scan 加载 SKILL.md 是 contract § 4 锁的路径但未实证
- **严重度**: 🔴 P0
- **mitigation**:
  - **Step 1 (Wave 1 Spike)**: spike 实测 install 后 fresh `query({ agents })` 调用 skill 是否生效；记录 `.planning/phase-1.4/SPIKE-REPORT.md` § "skill load timing"
  - **Step 2 (Wave 2 implementation)**: engine.ts install 段后**不调** `/reload-plugins`；改为 install 后 wait 短暂 sleep + retry idempotent_check（如 `claude mcp list \| grep -q tavily`）；spawn AgentDefinition 时 CC runtime 自动从 `~/.claude/skills/<name>/SKILL.md` filesystem scan
  - **Step 3 (兜底)**: 极端场景（如 plugin install 后 settings.json 改 hook 配置需要 main-session pickup）— factory 抛 `RestartRequiredError` 让 main agent print 用户友好消息 "请 exit + restart Claude Code 让 plugin 生效"
  - **Step 4 (D-17 ADR 0008)**: 加 IMPL NOTE 在 engine.ts 头部说明 reload 决策（不调 reload，filesystem scan 路径）；phase 1.5+ 升级评估 (R6 跟踪)

### R3: 30 sample 选取偏差（≥ 85% v0.1 内部基线 representativeness）

- **触发**: KICKOFF C6 30 真实查询样本路由命中率 ≥ 85%；样本怎么选不防 cherry-pick？6 category × 5 sample 是否覆盖 long-tail？execute-phase 时调 decision_rules.yaml 直到 30 sample pass — 形成 overfit
- **严重度**: 🟡 P1
- **mitigation**:
  - **Step 1 (Wave 5 SAMPLES.md)**: SAMPLES.md 起草必须包含 sample selection rationale 段（如 "5 design = 2 ui-ux-default + 2 frontend-design-override + 1 ambiguous; 5 search = 2 default-tavily + 2 academic-exa + 1 batch-url-exa" — 显式标 sample 分布）
  - **Step 2**: 30 sample 必须含 ≥ 3 "ambiguous / borderline" sample（预期失败但触发 fallback_supervisor）— 验证 supervisor 兜底而非全 happy path
  - **Step 3 (plan-checker enforce)**: SAMPLES.md 在 plan-phase Wave B 落地，**execute-phase 不允许改样本只能改 decision_rules.yaml**；plan-checker (Wave C) 验收 SAMPLES.md frozen
  - **Step 4 (v0.3.0 升级路径)**: ≥ 85% 命中率是 v0.1 内部基线 — phase 3.4 v0.3.0 完整验收时 100+ sample + ≥ 90% threshold + 多 model × 多 trigger 时段重复命中率 stability 检测

### R4: research workflow E2E install 链路 (Tavily + Exa + ctx7) 依赖顺序 + race condition

- **触发**: KICKOFF C4 "install Tavily + Exa + ctx7 (idempotent skip)"；`claude mcp add` 默认写 `~/.claude.json` single shared JSON file，并行 race condition 实证（mcs CLI 项目）；ctx7 (npm install -g) 与 MCP install (claude mcp add) 是否独立；用户在 install 进行中跑 manual `claude mcp add` 是否 race
- **严重度**: 🟡 P1
- **mitigation**:
  - **Step 1 (D1.4-4 实施)**: install adapter 先 Phase A (ctx7 npm install + Tavily/Exa idempotent_check parallel) → Phase B (Tavily MCP add + Exa MCP add **sequential**) → Phase C (verify 全并行)
  - **Step 2**: 加 IMPL NOTE 在 engine.ts install missing 段说明依赖决策（无依赖图，串行 + idempotent skip = 最简）— phase 1.5 DAG resolver 升级
  - **Step 3 (lockfile 检查 — phase 1.4 时间预算判断 — W-1 sister patch)**: 若 T5.1 install adapter 实装 ≤ 60 min 完成（track in progress.md F40+） → 加 lockfile（atomic write rename `~/.claude.json.tmp` → rename，避免用户并行手动操作 race）；若 > 60 min 触发 → record finding F40+ + 推 phase 1.5 DAG resolver 时一起做
  - **Step 4 (走 wrapper)**: 走 phase 1.3 ship 的 `harnessed install <name> --apply --non-interactive` 子命令而非直接 `claude mcp add`（复用 idempotency 逻辑）

### R5: AgentDefinition factory 12 字段 1:1 对齐 contract drift 风险（W-5 V1 BLOCKER）

- **触发**: contract § 7.2 W-5 V1 BLOCKER bar — phase 1.4 execute-phase code MUST 1:1 correspond to § 2 12 fields；任何 field omission OR signature deviation OR error path missing = phase 1.4 plan-checker MUST reject；fresh 2026 RESEARCH § 2 暴露 2 新字段 (`initialPrompt` / `criticalSystemReminder_EXPERIMENTAL`) — 推 phase 1.5 errata 不动 v1 main body（A7 守恒）
- **严重度**: 🟡 P1
- **mitigation**:
  - **Step 1 (Wave 3 unit test enforce)**: agentDefinition.ts 实装必须附带 `tests/unit/routing-agentDefinition.test.ts` ≥ 8 cell 显式 assert 12 字段 shape (`expect(def).toHaveProperty('description'); ... 12 个`) + signature 类型 (`type assert AgentFactory = typeof factory`) + 4 error paths (`expect(() => factory(...)).rejects.toThrow(SkillNotInstalledError)`)
  - **Step 2 (plan-checker)**: phase 1.4 plan-checker (Wave C) 必须有专用 V1 BLOCKER 章节比对 contract § 2 / § 3 / § 5 与 implementation — 沿袭 phase 1.3 plan-checker review 中的逐字段比对风格（参 phase-1.3/PLAN-CHECK.md）
  - **Step 3 (D-18 enforce)**: contract drift 任何调整必走 ADR 0008 errata；不能 silent change implementation
  - **Step 4 (IMPL NOTE)**: factory 头部明确标 "Implements docs/AGENT-DEFINITION-FACTORY-CONTRACT.md v1 (frozen at phase 1.3 ship)" + ADR 0008 cross-link

### R6: routing/decision_rules.yaml engineering category v1 占位 0 rules + mattpocock 23 招式 phase routing 推 phase 1.5

- **触发**: routing/decision_rules.yaml L165-L168 engineering category 0 rules 注释占位；KICKOFF 第 38 行 explicit lock "engineering category v1 占位 0 rules base 已装"；GRAY-AREA-3 § 3.3 mattpocock_phases routing schema 未 ship；A1' gstack 6+ 角色 routing 在 design 已实现（ui-ux-pro-max default + frontend-design override），但 engineering category sub-routing（gstack 关卡 / GSD orchestration / superpowers TDD 分阶段调度）推 phase 1.5
- **严重度**: 🟢 P2
- **mitigation**:
  - **Step 1 (KICKOFF lock 严守)**: phase 1.4 不补 engineering rules + mattpocock_phases routing；4 category routing rules MVP execute（design/content/testing/search）+ meta routing；engineering category 走 fallback_supervisor 路径
  - **Step 2 (30 sample 调整)**: SAMPLES.md 内 engineering category sample 数 ≤ 5（避免拉低 ≥ 85% 总命中率）— 显式标 engineering sample 走 fallback expected（即 expected_primary = "fallback_supervisor"）
  - **Step 3 (ADR 0008 跟踪)**: ADR 0008 § Consequences 加 R6 跟踪条目（mattpocock 23 招式 phase routing 推 phase 1.5 实装）；记 phase 1.5 KICKOFF prereq
  - **Step 4 (R6 + R7 合并 — ralph-wiggum 官方 plugin)**: phase 1.4 自实装 ≤ 50L 是 wedge 原则；phase 2.0+ 评估是否切到 `--add-plugin ralph-wiggum` 模式；decision_rules.yaml 通过 alias 映射 — 切换路径不动业务规则

---

## § F References

### Phase 1.4 内部 (Wave A 调研产出)

- `D:\GitCode\harnessed\.planning\phase-1.4\KICKOFF.md` — 8 acceptance bar C1-C8 + 7 prereq 接口契约 + Wave 分解 + 守恒约束
- `D:\GitCode\harnessed\.planning\phase-1.4\PATTERNS.md` — R1: 8 新文件 → phase 1.1-1.3 pattern A-L mapping (复用率 84%) + 3 新生 pattern N/O/P + 6 决策提案 D-13~D-18 + 6 风险 R1-R6
- `D:\GitCode\harnessed\.planning\phase-1.4\RESEARCH.md` — R2: 4 P0 lock 推荐 D1.4-1~5 (HIGH conf) + ralph-wiggum 重大新发现 + 6 风险 + 时效性校准

### Phase 1.3 ship artifacts (phase 1.4 直接消费)

- `D:\GitCode\harnessed\docs\AGENT-DEFINITION-FACTORY-CONTRACT.md` — 217 行 contract draft (frozen at phase 1.3 ship) — phase 1.4 factory 1:1 对应（W-5 V1 BLOCKER bar）
- `D:\GitCode\harnessed\routing\decision_rules.yaml` — 12 rules + Priority hit policy + fallback_supervisor + version 1 frozen
- `D:\GitCode\harnessed\src\routing\decisionRules.ts` — `loadDecisionRules` + `arbitrate` ≤ 7L 入口 (phase 1.4 直接 import)
- `D:\GitCode\harnessed\src\manifest\schema\spec.ts` L80-L138 — phase 1.3 加 3 字段 (category / install_type / decision_rules)
- `D:\GitCode\harnessed\src\cli\install-base.ts` — Pattern G commander register fn 风格沿袭（D-15 research.ts 1:1 对应）
- `D:\GitCode\harnessed\src\installers\index.ts` L60-L63 `runInstall(manifest, opts)` — Pattern D dispatcher（engine.ts install missing 段直接复用）
- `D:\GitCode\harnessed\src\manifest\security.ts` — `checkCmdString` shell-escape (B1 沿袭)

### Phase 1.3 plan-phase 风格参考

- `D:\GitCode\harnessed\.planning\phase-1.3\PLAN.md` — phase 1.3 plan-phase 蓝图 + 7-wave 拓扑（phase 1.4 8-wave 沿袭风格）
- `D:\GitCode\harnessed\.planning\phase-1.3\task_plan.md` — planning-with-files 标准 + 20 atomic 子任务（phase 1.4 ~30 task 沿袭）
- `D:\GitCode\harnessed\.planning\phase-1.3\ASSUMPTIONS.md` — 8 acceptance bar + P0 灰色地带 + D-7~D-12 PATTERNS reuse + D1.3-1~12 决策追溯（本文件 1:1 对应）

### Phase 1.2.5 wedge cross-link

- `D:\GitCode\harnessed\.planning\phase-1.2.5\GRAY-AREA-1-routing-engine.md` § 2 routing engine v1 schema 草案 (phase 1.3 已 ship)
- `D:\GitCode\harnessed\.planning\phase-1.2.5\GRAY-AREA-3-mattpocock-phases.md` § 3.3 mattpocock_phases routing schema (phase 1.4 不实装 — Risk R6 deferred phase 1.5)
- `D:\GitCode\harnessed\docs\adr\0006-three-stack-mechanization-wedge.md` § 1 双层架构 ASCII 图 — phase 1.4 是 wedge 实装的"第二步硬实装"

### ADR baseline + lineage

- `D:\GitCode\harnessed\docs\adr\0001-manifest-schema-v1.md` ~ `0007-categorization-schema-errata.md` — phase 1.4 不动 main body；ADR 0008 沿袭 0005/0007 errata 6-section 风格
- `D:\GitCode\harnessed\.github\workflows\ci.yml` L34-L64 — A7 step iter 1-7（phase 1.4 改 3 处加 0008 + L34-L38 注释 1.3 → 1.4）

### 用户硬要求 enforcement

> "必须在整体上保证笔记里角色主要职责和核心理念的 100% 实现"

phase 1.4 implementation 是 8 支柱（A1'-A8'）从静态 capture 到动态 execution 的关键 transformation phase。任何字段 / 验证 / routing 路径偏离 phase 1.2.5 / 1.3 lock 都是 P0 blocker。

**重点 enforcement 持续**:
- **A1' gstack 6+ 角色 routing**: phase 1.4 design category 必须能 dispatch ui-ux-pro-max / frontend-design（已实装）；engineering category 推 phase 1.5（D1.4-13 explicit deferred）
- **A4' karpathy 4 心法 inject**: AgentDefinition prompt template 始终包含 4 心法 always-on baseline（D1.4-14 — agentDefinition.ts factory prepend 4 心法 line）
- **A5' mattpocock 23 招式 phase routing**: phase 1.4 不实装（推 phase 1.5）；research workflow E2E (C4) 现实装单一 search category 路径，phase 1.5 加 plan/execute/verify phase routing
- **A8' 6 category × decision rules execute**: phase 1.4 是首个真实跑 routing phase；每 category ≥ 5 样本验收命中（C6 + D1.4-15）
