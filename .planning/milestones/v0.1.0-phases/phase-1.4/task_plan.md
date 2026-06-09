# Phase 1.4 Task Plan (planning-with-files 主计划)

> **状态**: ready for execute-phase
> **维护规则**: 每完成一个 task → 勾选 + 同步 `progress.md`（追加 ISO 日期 + task ID + 简短结果 + commit short-hash）
> **决策回溯**: 所有 "为什么这么做" → 查 `PLAN.md` § 1-8 / `ASSUMPTIONS.md` § B-D / `RESEARCH.md` / `PATTERNS.md`
> **执行策略**: 每个 task 完成后 commit；commit message 格式 `phase-1.4: T<N>.<M> <action>`；建议每个子任务 `/ralph-loop` 包裹直到 COMPLETE
> **总规模**: 21 atomic 子任务 / 8 wave / 预计 5-10 工作日（H3 transparency budget）

---

## Phase 1.4 Acceptance Bar (verify before mark phase done)

(来自 PLAN.md § 6 / ASSUMPTIONS § A — 必须全部 ✅)

- [ ] **C1** main-process-driven routing engine 实装 — `src/routing/engine.ts` ≤ 200L + ≥ 10 unit cell + verbatim COMPLETE 回流验证
- [ ] **C2** AgentDefinition factory 实装 — `src/routing/agentDefinition.ts` ≤ 150L + 12 字段 1:1 对应 contract v1 + 4 错误处理路径
- [ ] **C3** 6 category routing rules MVP execute — design / content / testing / search 4 category 实测命中（每 ≥ 5 sample），meta + engineering 走 fallback expected
- [ ] **C4** research workflow E2E — `harnessed research <prompt>` 子命令 + 端到端跑通 install→spawn→verbatim COMPLETE 链路
- [ ] **C5** main agent system prompt verbatim COMPLETE 强制 — `src/routing/systemPrompt.ts` ≤ 80L + 1:1 对齐 contract § 5.4
- [ ] **C6** 30 真实查询样本路由命中率 ≥ 85% v0.1 内部基线 — SAMPLES.md frozen + 30-sample integration test + ≥ 27/30 hit
- [ ] **C7** Cross-OS CI 三平台保持全绿 + A7 step iterate 1-7 → 1-8（新加 ADR 0008 baseline tag）+ ADR 0001-0007 main body 守恒持续
- [ ] **C8** ADR 0008 errata 起草 + accepted + `adr-0008-accepted` tag — 含 phase 1.3 deferred items inline (H1a perf transparency / M1 yaml path migration / phase 1.4 接口契约升级)

---

## Task Graph

### Wave 0 — 前置（ADR 0008 errata + ci.yml A7 step iter 1-8）

#### T1.1 起草 ADR 0008 errata + accepted + adr-0008-accepted tag
- [ ] **目标**: A7 守恒（不动 ADR 0001-0007 main body）下，给 phase 1.4 routing engine 实装备好 errata；inline phase 1.3 deferred items (H1a perf transparency / M1 yaml path migration)
- **文件**: `/d/GitCode/harnessed/docs/adr/0008-routing-engine-v1-errata.md`
- **内容大纲**（≥ 100 行 — ADR 0005/0007 errata 同款 6-section 风格）:
  - **Status**: Accepted 2026-05-13 (phase 1.4 plan-phase Wave 0)
  - **Context**: phase 1.3 ship 7 接口契约 (manifest 3 字段 / decision_rules.yaml v1 / arbitrate / install-base / AgentDefinition contract draft) 全部 ready；phase 1.4 实装 main-process-driven routing engine 时 emerge 新发现需 errata 透明化；phase 1.3 ship 时 H1a (perf cost transparency) + M1 (yaml path migration) 因 A7 守恒 lock 推 ADR 0008 inline
  - **Decision**: 4 个 errata items
    1. **H1a perf cost transparency reference**: phase 1.3 schema 加 3 字段后 manifest validate baseline 22ms → 28ms (+12.17% / decision_rules nested array+object 占主导 67%)；F38 50→75ms hotfix 决策 cost-benefit 数据驱动正确；详见 `.planning/phase-1.3/PERF-ATTRIBUTION.md`（phase 1.4 不需 schema validation 优化，Ajv compiled 已是 industry-standard 上限）
    2. **M1 yaml path migration 官方化**: `.planning/decision_rules.yaml` → `routing/decision_rules.yaml`（phase 1.3 sister patch round commit `df54d3c`）；ADR 0007 main body 4 处 `.planning/decision_rules.yaml` refs locked by `adr-0007-accepted` tag (A7 守恒)，本 ADR 0008 errata 官方覆盖 → phase 1.4+ 实装统一引用 `routing/decision_rules.yaml`
    3. **D1.4-2 contract delta**: phase 1.3 contract v1 12 字段 100% accurate；fresh 2026-05-13 RESEARCH § 2 暴露 2 新字段 `initialPrompt` + `criticalSystemReminder_EXPERIMENTAL`，**推 phase 1.5 evaluate** v1.1 errata（不动 v1 main body 守 A7）
    4. **routing engine 接口契约升级（如 phase 1.4 实装中 emerge 微调）**: 6-8 接口（engine.route signature / EngineResult 三态 / agentFactory / 4 typed error class / systemPrompt const / installResearchWorkflowDeps adapter / routing/index.ts barrel / 30 sample inline truth table）— 详 PLAN.md § 4
  - **Consequences**:
    - phase 1.4 routing engine + factory + systemPrompt 实装可直接消费 phase 1.3 ship 的 7 接口契约 + 本 ADR 0008 errata 4 items
    - A7 守恒持续 — ADR 0001-0007 main body 0 diff；ci.yml A7 step iter 1-7 → 1-8 (含 0008)
    - phase 1.5 prereq: 2 新字段 contract evaluate / DAG resolver / Semantic Router L2 / engineering category routing / mattpocock 23 招式 phase routing
    - **R6 跟踪条目**: mattpocock 23 招式 phase routing schema 实装推 phase 1.5（KICKOFF 第 38 行 explicit deferred）
  - **Compliance**: ADR 0001-0007 main body 不动（A7 守恒 paranoid check）；fixture-driven validate test 自动覆盖（已在 phase 1.3 T2.3 + 本 phase T4.x）；本 ADR 0008 起 phase 1.4 ship 时刻 frozen，任何 v0.2+ 演化必走 ADR 0009+ errata
  - **References**: ADR 0006 § 6 + ADR 0007 § Compliance + RESEARCH.md (R2) + PATTERNS.md (R1) + ASSUMPTIONS.md / KICKOFF.md / .planning/phase-1.3/PERF-ATTRIBUTION.md / docs/AGENT-DEFINITION-FACTORY-CONTRACT.md
- **同步**: 更新 `docs/adr/README.md` index（加 0008 行）
- **后置命令**:
  ```bash
  cd /d/GitCode/harnessed
  git tag adr-0008-accepted HEAD
  git ls-files --eol docs/adr/0008-*.md  # 应 i/lf
  ```
- **验收**:
  - [ ] ADR 0008 文件 ≥ 100 行（`wc -l docs/adr/0008-*.md`）
  - [ ] `docs/adr/README.md` 含 0008 链接
  - [ ] `git diff adr-0001-accepted -- docs/adr/0001-*.md` 输出空（A7 守恒 paranoid check）
  - [ ] `git tag -l 'adr-*-accepted' | wc -l` = 8
  - [ ] grep 6-section（Status / Context / Decision / Consequences / Compliance / References）全 hit
  - [ ] Consequences 含 H1a + M1 + D1.4-2 + R6 跟踪条目
- **决策来源**: D1.4-11 + D-17 PATTERNS reuse + KICKOFF C8 + ASSUMPTIONS § E R6

---

#### T1.2 ci.yml A7 step iterate 1-7 → 1-8
- [ ] **目标**: ADR 0008 加入 A7 守恒 baseline tag iterate；phase 1.4 push 后 CI 实测 8 个 baseline tag 全绿
- **文件**: `/d/GitCode/harnessed/.github/workflows/ci.yml`
- **内容修改**（4 处 — 沿袭 phase 1.3 T1.2 S-1 模式）:
  - **L34-L38** comment（"ADR baseline tag" 描述段）: "ADR 0001-0007 main body 守恒" → "ADR 0001-0008 main body 守恒"
  - **L42** A7 step `for n in 0001 ... 0007` 列表头次出现：加 `0008`
  - **L53** A7 step `for n in 0001 ... 0007` 第二次出现（如有）：加 `0008`
  - **L64** A7 step echo 文案 "iterate 0001-0007" → "iterate 0001-0008"
  - 注：实际行号 push 前以 `grep -n '0001 0002' .github/workflows/ci.yml` 实测为准
- **验收**:
  - [ ] CI yaml 含 0008 in iterate (`grep -c "0008" .github/workflows/ci.yml` ≥ 2)
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误（不应触发 — yaml 改不影响 ts）
- **决策来源**: C7 acceptance bar + phase 1.3 T1.2 模式延续

---

### Wave 1 — Spike main-process query() API + AgentDefinition spawn (D1.4-1 实证)

#### T2.1 scripts/spike/routing-spawn-agent.sh (D1.4-1 实证)
- [ ] **目标**: phase 1.4 execute-phase 第一步必须 spike — D1.4-1 + D1.4-3 实证；R1+R2 P0 风险 mitigation；后续 implementation anchor
- **文件**: `/d/GitCode/harnessed/scripts/spike/routing-spawn-agent.sh`（≤ 80L bash，executable，cross-OS 兼容写法）
- **内容大纲**:
  - 顶部注释: D-10 shell probe 风格（一次性实测，不入 CI test suite）
  - **Step 1**: 实测 `claude plugin install <name>@<marketplace> --scope project` (Bash 调用)
  - **Step 2**: 验证 install: `claude mcp list | grep -q <name>` (idempotent_check)
  - **Step 3**: skeleton spawn — 调 `claude` headless mode (`-p` flag) 起一个 minimal agent: prompt = "echo COMPLETE"，验证 verbatim 回流
  - **Step 4**: ralph-loop wrap 时序 — 测试 `--completion-promise "COMPLETE"` + `--max-iterations 5` 双 cap
  - **Step 5**: skill load filesystem scan — install plugin 后立即 spawn fresh subagent，验证 plugin 是否生效（不依赖 /reload-plugins）
  - 输出 result: 各 step PASS/FAIL + ms 时序 + verbatim COMPLETE 是否原文回流
- **运行（一次性）**: `chmod +x scripts/spike/routing-spawn-agent.sh && ./scripts/spike/routing-spawn-agent.sh`
- **验收**:
  - [ ] 文件存在 + executable
  - [ ] 至少 1 平台（Mac 或 Linux）实测跑通输出 result
  - [ ] **W-4 condition**: 如条件允许，也跑 Win Git Bash 验证；若 Win 卡（claude headless CLI 在 Win 兼容性不确定），record **F40-Win finding**（沿袭 phase 1.3 F36-Win 命名风格）而非阻塞
  - [ ] **不**入 CI test suite（沿袭 phase 1.3 D-10）
- **决策来源**: D1.4-1 + D1.4-3 + R1 + R2 mitigation Step 1

---

#### T2.2 .planning/phase-1.4/SPIKE-REPORT.md (实测路径 anchor)
- [ ] **目标**: 实测 spike 结果记录；engine.ts 实装 anchor；F40 finding 落地
- **文件**: `/d/GitCode/harnessed/.planning/phase-1.4/SPIKE-REPORT.md`（≥ 50 行，含 ≥ 80 行扩展空间留 finding narrative）
- **内容大纲**:
  - § 1 实测平台 + 时间 + claude CLI version (`claude --version`)
  - § 2 各 step PASS/FAIL 表格 + ms 时序
  - § 3 verbatim COMPLETE feasibility 结论 — 主进程 spawn subagent 后是否能 verbatim grep COMPLETE
  - § 4 ralph-loop wrap 时序 — `--completion-promise` exact match + `--max-iterations` cap behavior
  - § 5 skill load filesystem scan 行为 — install 后是否需 sleep retry / restart hint
  - § 6 与 contract v1 / D1.4-1 / D1.4-3 出入分析 — 如有 fresh 偏离，明确触发 ADR 0008 errata 调整
  - § 7 engine.ts 实装 anchor decisions — 基于实测，明确 engine.ts 主流程编排步骤 + 时序
- **验收**:
  - [ ] ≥ 50 行
  - [ ] 6 step PASS/FAIL 全记录
  - [ ] verbatim COMPLETE feasibility 给出明确 verdict (FEASIBLE / NEEDS_TWEAK / BLOCKED)
  - [ ] § 7 实装 anchor decisions ≥ 5 项
- **决策来源**: T2.1 实测产出 + F40 finding placeholder

---

### Wave 2 — engine.ts + agentDefinition.ts + systemPrompt.ts 实装

#### T3.1 src/routing/engine.ts (Pattern N — Engine 主流程编排)
- [ ] **目标**: C1 acceptance bar — main-process-driven routing engine 主流程实装；≤ 200L hard limit (D-13 / D1.4-6)
- **文件**: `/d/GitCode/harnessed/src/routing/engine.ts`（**新文件**）
- **内容大纲**（≤ 200L）:
  - **顶部 IMPL NOTE** (Pattern H): 引用 ADR 0006 § 1（双层架构）+ KICKOFF C1 + D1.2.5-3（main-process-driven lock）+ F33（verbatim COMPLETE F33 P1 mitigation）+ D1.4-1/D1.4-3（ralph-loop wrap）+ contract § 3（agentFactory signature）
  - **export `runRouting(prompt: string, opts: RoutingOpts): Promise<EngineResult>`** — 主流程入口
  - **EngineResult 三态 discriminated union**:
    ```typescript
    export type EngineResult =
      | { ok: true; result: string; matchedRule: Rule }
      | { ok: false; phase: 'arbitrate' | 'install' | 'spawn' | 'verbatim'; error: Error }
      | { aborted: true; reason: string }
    ```
  - **主流程 chain** (各步骤 ≤ 30L):
    1. **arbitrate**: `loadDecisionRules('routing/decision_rules.yaml')` → `arbitrate(rules, taskContext)` → null = trigger fallback_supervisor
    2. **install missing**: 复用 phase 1.2 `runInstall(manifest, opts)` (Pattern D dispatcher)；D1.4-4 sequential MCP add
    3. **factory**: `createAgent(task, decision, opts)` → throw catch narrow EngineResult error
    4. **spawn**: `query({ options: { allowedTools: [...,'Agent'], agents: { [name]: agentDef } } })` (CC TS API)
    5. **ralph-loop wrap** (内联 ≤ 50L per D1.4-3，spillover 抽 `src/routing/lib/ralphLoop.ts`):
       - max-iter 20 (external) × maxTurns 50 (internal) = 1000 round-trips worst case
       - 每 iter grep `COMPLETE` exact string
       - 不命中 → re-spawn 同 agent；max-iter exceeded → throw MaxIterationsExceededError
    6. **verbatim COMPLETE 回流**: subagent final message exact-string match grep `^COMPLETE$` → 命中 = ok / 不命中（subagent summarized） → throw VerbatimCompleteFailError
  - **reload bypass 路径** (D1.4-1 R2 mitigation): install 段后**不调** `/reload-plugins`；改为 sleep 短暂 + retry idempotent_check + spawn fresh subagent (CC runtime 自动 filesystem scan SKILL.md)；极端场景 throw `RestartRequiredError` (factory 抛 — main agent print "请 exit + restart Claude Code 让 plugin 生效")
- **后置**: 创建 `src/routing/index.ts` barrel re-export `{ runRouting, EngineResult, ... }` (Pattern G + 接口契约 7)
- **验收**:
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] `wc -l src/routing/engine.ts` ≤ 200（如超过抽 lib/）
  - [ ] `grep -E "loadDecisionRules\|arbitrate\|agentFactory\|spawnSubagent\|verbatim.*COMPLETE\|ralphLoop" src/routing/engine.ts` 全 hit
  - [ ] IMPL NOTE 5+ 处分布 (Pattern H — ADR 0006 / KICKOFF / D1.2.5-3 / F33 / contract § 3)
  - [ ] 三态 discriminated union export
  - [ ] `src/routing/index.ts` barrel re-export 创建
- **决策来源**: D1.4-6 / D-13 / KICKOFF C1 / D1.2.5-3 / F33 / R1+R2 mitigation Step 2

---

#### T3.2 src/routing/agentDefinition.ts (factory 1:1 对应 contract 12 字段)
- [ ] **目标**: C2 acceptance bar — AgentDefinition factory 实装；≤ 150L (D1.4-7)；W-5 V1 BLOCKER 1:1 对应 contract enforce
- **文件**: `/d/GitCode/harnessed/src/routing/agentDefinition.ts`（**新文件**）
- **内容大纲**（≤ 150L）:
  - **顶部 IMPL NOTE** (Pattern H): "Implements docs/AGENT-DEFINITION-FACTORY-CONTRACT.md v1 (frozen at phase 1.3 ship)" + ADR 0008 cross-link + D-14 (throw-error not Result wrap) + D1.4-14 (4 心法 inject) + **任何 enum 偏离 = ADR 0008 errata 触发 (D-18 enforce)**
  - **TypeScript-derived type alias (S-2 sister patch — contract § 3 锁定)**: `import type AgentDefinition from '@anthropic-ai/claude-agent-sdk'` — **不本地重定义** AgentDefinition；本地 interface 仅用于 `TaskContext` / `ArbitrateResult` / `AgentDefinitionOpts` (3 input types)。**理由**: 零 enum drift 风险（只要 SDK 版本 fixed），自动追随官方 SDK 升级；以下 12 字段 reference 仅为 plan-phase doc，实际 import from SDK
    ```typescript
    export interface AgentDefinition {
      // 必填 (contract § 2.1)
      description: string
      prompt: string
      // optional (contract § 2.2 — 10 字段)
      tools?: string[]
      disallowedTools?: string[]
      model?: 'haiku' | 'sonnet' | 'opus'
      skills?: string[]
      mcpServers?: Record<string, McpConfig>
      memory?: 'user' | 'project' | 'local'
      maxTurns?: number
      background?: boolean
      effort?: 'low' | 'medium' | 'high'
      permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan'
    }
    ```
  - **4 typed error classes** (contract § 5.1 — D1.4-2 / R5):
    ```typescript
    export class SkillNotInstalledError extends Error {}
    export class InvalidDecisionError extends Error {}
    export class MissingSkillsError extends Error {}
    export class RestartRequiredError extends Error {}
    ```
  - **export `createAgent(task: TaskContext, decision: ArbitrateResult, opts: AgentDefinitionOpts): Promise<AgentDefinition>`** — factory 主入口（D-14 throw-error）
  - **factory 内部**:
    1. validate decision.primary_expert exists → if not: throw InvalidDecisionError
    2. check decision.skills 全部 installed (filesystem scan `~/.claude/skills/<name>/SKILL.md`) → if missing: throw SkillNotInstalledError or MissingSkillsError
    3. 构造 prompt template — D1.4-14 prepend 4 心法 always-on baseline (Karpathy):
       ```
       ## 心法 (always-on baseline)
       - Think Before Coding: ...
       - Simplicity First: ...
       - Surgical Changes: ...
       - Goal-Driven Execution: ...

       ## 任务
       ${task.prompt}

       ## RULE: COMPLETE marker
       (1:1 import from systemPrompt.ts COMPLETE_INSTRUCTION block)
       ```
    4. 返回 AgentDefinition 12 字段对象
  - **dotenv-style ENV 兜底**: `process.env.HARNESSED_AGENT_MODEL` override decision.model（test mock 注入）
- **验收**:
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] `wc -l src/routing/agentDefinition.ts` ≤ 150
  - [ ] `grep -E "SkillNotInstalledError\|InvalidDecisionError\|MissingSkillsError\|RestartRequiredError\|description\|prompt\|tools\|disallowedTools\|model\|skills\|mcpServers\|memory\|maxTurns\|background\|effort\|permissionMode" src/routing/agentDefinition.ts` 全 hit (4 error + 12 字段 = 16 keyword)
  - [ ] IMPL NOTE 头部含 contract v1 frozen + ADR 0008 cross-link + D-14 + D1.4-14
  - [ ] 4 心法 always-on prepend 实测 (`grep "Think Before Coding\|Simplicity First\|Surgical Changes\|Goal-Driven Execution" src/routing/agentDefinition.ts` 全 hit)
- **决策来源**: D1.4-7 / D-14 / D1.4-14 / KICKOFF C2 / contract v1 § 2-3-5 / R5 mitigation

---

#### T3.3 src/routing/systemPrompt.ts (Pattern O — Verbatim instructional prompt template)
- [ ] **目标**: C5 acceptance bar — main agent system prompt verbatim COMPLETE 强制；≤ 80L (D1.4-8)；D-18 V1 BLOCKER 1:1 对齐 contract § 5.4
- **文件**: `/d/GitCode/harnessed/src/routing/systemPrompt.ts`（**新文件**）
- **内容大纲**（≤ 80L）:
  - **顶部 IMPL NOTE** (Pattern H): "1:1 对应 docs/AGENT-DEFINITION-FACTORY-CONTRACT.md § 5.4 verbatim COMPLETE template (frozen at phase 1.3 ship)" + D-18 (plan-checker enforce) + F33 P1 mitigation + ADR 0008 cross-link
  - **export `const SYSTEM_PROMPT: string`** — main agent system prompt verbatim COMPLETE 强制
  - **export `const COMPLETE_INSTRUCTION: string`** — subagent-side CRITICAL RULE template
  - **核心内容** (1:1 contract § 5.4):
    ```
    ## RULE: subagent COMPLETE marker
    When you spawn a subagent and it returns a final message:
    1. **DO NOT summarize, paraphrase, or interpret the subagent's final message**
    2. **DO NOT skip or omit the COMPLETE marker**
    3. The subagent will output `COMPLETE` (exact uppercase string, on its own line) when done
    4. You MUST verbatim grep `^COMPLETE$` from final message → if present, treat task as done
    5. If COMPLETE absent → re-spawn subagent (max 20 iterations); after max, throw VerbatimCompleteFailError

    ## skills fail-fast handling
    - SkillNotInstalledError → print user-friendly fix command (e.g., "Run: harnessed install <name>")
    - RestartRequiredError → print "请 exit + restart Claude Code 让 plugin 生效"

    ## 兜底 max-iterations
    - max-iter 20 (external ralph-loop) × maxTurns 50 (internal AgentDefinition) = 1000 round-trips worst case
    ```
- **验收**:
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] `wc -l src/routing/systemPrompt.ts` ≤ 80
  - [ ] `grep -E "do NOT summarize\|paraphrase\|verbatim.*COMPLETE\|max-iterations.*50\|skill.*fail-fast" src/routing/systemPrompt.ts` 全 hit
  - [ ] IMPL NOTE 头部含 contract § 5.4 verbatim 1:1 enforce + D-18 + F33 + ADR 0008
  - [ ] export 2 const (SYSTEM_PROMPT + COMPLETE_INSTRUCTION)
  - [ ] **S-3 sister patch — T4.1 加 unit test cell 11**: `test('SYSTEM_PROMPT 1:1 contract § 5.4 line content', () => { expect(SYSTEM_PROMPT).toContain('do NOT summarize, paraphrase'); expect(SYSTEM_PROMPT).toContain('verbatim grep `^COMPLETE$`'); ... })` — Pattern O single-source enforce；任何 prompt 内容偏离 = test fail = 触发 ADR 0008+ errata
- **决策来源**: D1.4-8 / D-18 / F33 P1 mitigation / KICKOFF C5 / contract § 5.4 / R5

---

### Wave 3 — Tests engine + agentDefinition unit

#### T4.1 tests/unit/routing-engine.test.ts (≥ 10 cell)
- [ ] **目标**: C1 acceptance bar — engine 主流程 unit 覆盖
- **文件**: `/d/GitCode/harnessed/tests/unit/routing-engine.test.ts`（**新文件**）
- **测试 cell** (≥ 10):
  1. main-process spawn happy path (mock query() + agents config)
  2. arbitrate hit + skip install (idempotent) → factory → spawn → verbatim COMPLETE → ok result
  3. arbitrate miss → fallback_supervisor 兜底 (与 mock 模拟 LLM L2 supervisor)
  4. install missing skill 触发 → install 后 fresh spawn → verbatim COMPLETE → ok result
  5. reload bypass path (D1.4-1 verify) — 不调 /reload-plugins，filesystem scan 验证
  6. skills fail-fast SkillNotInstalledError narrow → EngineResult `{ok: false; phase: 'install'; error}`
  7. verbatim COMPLETE grep verify (F33 mitigation) — subagent summarize → throw VerbatimCompleteFailError
  8. max-iter 20 兜底 → throw MaxIterationsExceededError → EngineResult `{aborted: true; reason}`
  9. yaml security gate inject reject (B1 沿袭 phase 1.1.1 H7) — `$(...)` reject
  10. RestartRequiredError 抛 → EngineResult `{ok: false; phase: 'install'; error: RestartRequiredError}`
- **验收**:
  - [ ] tests 235+1 → ≥ 245+1 skipped (+10 cell)
  - [ ] `corepack pnpm test -- --filter routing-engine` 全绿
  - [ ] 4 error class narrow 全覆盖 (SkillNotInstalledError / InvalidDecisionError / MissingSkillsError / RestartRequiredError)
  - [ ] verbatim COMPLETE grep cell 实测 (F33 mitigation)
- **决策来源**: KICKOFF C1 / D1.4-6 / contract § 5.1 / R1 mitigation Step 2

---

#### T4.2 tests/unit/routing-agentDefinition.test.ts (≥ 8 cell)
- [ ] **目标**: C2 acceptance bar — agentDefinition factory unit 覆盖；W-5 V1 BLOCKER 12 字段 1:1 对齐 contract enforce
- **文件**: `/d/GitCode/harnessed/tests/unit/routing-agentDefinition.test.ts`（**新文件**）
- **测试 cell** (≥ 8):
  1. factory 12 字段 shape — 显式 assert 12 个 toHaveProperty (description / prompt / tools / disallowedTools / model / skills / mcpServers / memory / maxTurns / background / effort / permissionMode)
  2. factory signature 类型 verify — `type assert AgentFactory = typeof createAgent`
  3. SkillNotInstalledError throw path — decision.skills 含未 install skill → reject
  4. InvalidDecisionError throw path — decision.primary_expert 缺 → reject
  5. MissingSkillsError throw path — opts.requiredSkills 全部 missing → reject
  6. throw-error not return Result (D-14 verify) — `expect(() => factory(...)).rejects.toThrow(...)` not `expect(factory(...).ok).toBe(false)`
  7. prompt template 注入 4 心法 + verbatim COMPLETE 引用 (D1.4-14 verify)
  8. ENV override decision.model — `process.env.HARNESSED_AGENT_MODEL=opus` → factory 返回 model: 'opus'
- **验收**:
  - [ ] tests ≥ 245+1 → ≥ 253+1 skipped (+8 cell)
  - [ ] `corepack pnpm test -- --filter routing-agentDefinition` 全绿
  - [ ] 12 字段 toHaveProperty 全 cover
  - [ ] 4 error class throw 全 verify
  - [ ] 4 心法 prepend 实测
- **决策来源**: KICKOFF C2 / D1.4-7 / D-14 / D1.4-14 / W-5 V1 BLOCKER / R5 mitigation Step 1

---

### Wave 4 — research workflow E2E sub-routing + integration test

#### T5.1 src/cli/research.ts (D-15 独立子命令)
- [ ] **目标**: C4 acceptance bar — `harnessed research <prompt>` 独立子命令；sub-routing search category 端到端
- **文件**: `/d/GitCode/harnessed/src/cli/research.ts`（**新文件**，≤ 100L 沿袭 install-base.ts 风格）
- **内容大纲**:
  - **顶部 IMPL NOTE** (Pattern H): D-15 (独立子命令 — 沿袭 D-9 install-base) + KICKOFF C4 + D1.4-9 + Pattern G
  - 单一导出 `registerResearch(program: Command)` (沿袭 phase 1.2 register fn 模式)
  - flags: `--query <text>` (必填) / `--dry-run` / `--apply` / `--non-interactive` / `--model <haiku|sonnet|opus>`
  - 内部 sub-routing:
    1. parse prompt 构造 TaskContext
    2. 调 `runRouting(taskContext, { category: 'search' })` (engine.ts)
    3. 如返回 `{ok: true; result}`: print result + exit 0
    4. 如返回 `{ok: false; phase; error}`: print friendly error + exit 1
    5. 如返回 `{aborted: true; reason}`: print abort + exit 2
- **install adapter helper**: 如 spillover 需要 `installResearchWorkflowDeps()` (D1.4-4 sequential MCP)，抽到 `src/routing/lib/installAdapter.ts`（PLAN.md § 4 接口契约）
- **install adapter invoke 路径 (W-2 sister patch — D1.4-4 子决策)**: **优先 library call** (`import { runInstall } from '../installers/index.js'`) — phase 1.4 行 `harnessed install` subprocess 模式作为 fallback；测试 mock 走 library call inject。**理由**: subprocess 与 R1 Wave 1 Spike 重叠，且 library call 快 + 同 stack debug 易
- **验收**:
  - [ ] `corepack pnpm typecheck && corepack pnpm lint` 0 错误
  - [ ] 文件 ≤ 100 行
- **决策来源**: D1.4-9 / D-15 / KICKOFF C4 / Pattern G

---

#### T5.2 src/cli.ts wire registerResearch (9th register fn)
- [ ] **目标**: cli.ts 顶层注册 research（install/install-base/research sibling 模式）
- **文件**: `/d/GitCode/harnessed/src/cli.ts`（修改）
- **内容修改**:
  ```typescript
  import { registerResearch } from './cli/research.js'
  // ...
  registerResearch(program)  // 9th register fn (8th install-base + 9th research)
  ```
  comment 升级 8 → 9 subcommands
- **验收**:
  - [ ] `corepack pnpm build && node ./dist/cli.mjs --help` 输出含 `research` 子命令
  - [ ] `node ./dist/cli.mjs research --help` 显示 flags（含 `--query` 必填）
- **决策来源**: phase 1.3 cli.ts wire 模式延续（8 → 9 register fn）+ KICKOFF C4

---

#### T5.3 tests/integration/routing-research-workflow.test.ts (≥ 3 cell E2E)
- [ ] **目标**: C4 acceptance bar — research workflow E2E test；env-gated `HARNESSED_REAL_SPAWN=1` skipIf (沿袭 Pattern K phase 1.2 installer-real-spawn.test.ts)
- **文件**: `/d/GitCode/harnessed/tests/integration/routing-research-workflow.test.ts`（**新文件**）
- **测试 cell** (≥ 3):
  1. **happy path** (mock 默认 + env-gated real-spawn): query "Next.js v15 app router" → arbitrate hit search rule → install Tavily+Exa+ctx7 (idempotent skip) → spawn → invoke ctx7 → verbatim COMPLETE → ok
  2. **install fail path** (mock simulated network error): install Tavily 失败 → fallback_supervisor 兜底 (mock LLM L2)
  3. **skills missing path** (mock): AgentDefinition.skills 含未 install skill → SkillNotInstalledError fail-fast → friendly print
- **环境**: 默认 mock 跑通 CI；real-spawn `HARNESSED_REAL_SPAWN=1 corepack pnpm test -- --filter routing-research-workflow` (手动验证)
- **验收**:
  - [ ] tests ≥ 253+1 → ≥ 256+1 skipped (+3 cell)
  - [ ] 默认 mock 三平台 CI 全绿
  - [ ] real-spawn skipIf gate 沿用 Pattern K
- **决策来源**: KICKOFF C4 / D1.4-1 + D1.4-3 / R1 mitigation Step 3 / Pattern K phase 1.2 模式

---

### Wave 5 — 30 sample SAMPLES.md + sample-driven test (Pattern P 新生)

#### T6.1 .planning/phase-1.4/SAMPLES.md (≥ 30 sample / D1.4-5 选取标准)
- [ ] **目标**: C6 acceptance bar — 30 真实查询样本路由命中率 ≥ 85% v0.1 内部基线；plan-phase Wave B frozen execute 不可改样本（R3 mitigation Step 3）
- **文件**: `/d/GitCode/harnessed/.planning/phase-1.4/SAMPLES.md`（**新文件**，≥ 200 行）
- **内容大纲**:
  - **§ 1 Selection rationale**:
    - 6 category × 5 sample = 30 均衡分布
    - 样本来源: 用户 CLAUDE.md trigger phrase + phase 1.2.5/1.3 progress.md 实际决策点（**不允许 ad-hoc 编造**）
    - ≥ 3 ambiguous/borderline sample 验证 fallback_supervisor 兜底（非全 happy path）
    - engineering category 5 sample 走 fallback expected (R6 — engineering category v1 占位 0 rules)
    - cherry-pick 防御: SAMPLES.md plan-phase Wave B 锁；execute-phase **不允许改样本** 只能改 decision_rules.yaml；plan-checker (Wave C) 验收 SAMPLES.md frozen
  - **§ 2 30 sample 详表** (sample table):
    - 每行: id / category / prompt / expected_rule_id / expected_primary_expert / rationale (一行 explain why)
    - design 5 sample (2 ui-ux-default + 2 frontend-design-override + 1 ambiguous)
    - content 5 sample (2 pptx-default + 2 chinese-content-deck + 1 ambiguous)
    - testing 5 sample (1 perf-a11y-memory + 1 e2e-with-python-backend + 1 e2e-default + 1 ai-explore-debug + 1 ambiguous)
    - search 5 sample (2 default-tavily + 2 academic-or-batch-exa + 1 ambiguous)
    - meta 5 sample (2 meta-create-skill + 2 meta-find-skill + 1 ambiguous)
    - engineering 5 sample (全部走 fallback expected — R6 mitigation Step 2)
  - **§ 3 ≥ 85% baseline 业界 alignment** — LangChain Top-1 ≥ 0.85 引用 (RESEARCH § 4)
  - **§ 4 v0.3.0 升级路径** — phase 3.4 完整命中率验收 100+ sample × 多 model × stability (D1.4-5 lock 仅 v0.1 内部基线)
    - **fixture 化迁移 script 名 (W-3 sister patch)**: `scripts/migrate-samples-inline-to-fixture.mjs`（沿袭 phase 1.1 H4 hotfix migration script pattern + phase 1.3 sister review W-6 yaml v1→v2 migration script pattern）；估 30 min 工作量；PATTERNS § 4 D-16 反驳预案已 cite
- **验收**:
  - [ ] ≥ 30 sample 全字段（id / category / prompt / expected_rule_id / expected_primary_expert / rationale）
  - [ ] 6 category × 5 sample 均衡分布
  - [ ] ≥ 3 ambiguous sample
  - [ ] engineering 5 sample 全标 fallback expected
  - [ ] § 1 selection rationale 显式（防 cherry-pick）
- **决策来源**: KICKOFF C6 / D1.4-5 / D-16 / D1.4-10 / R3 mitigation Step 1+2+3 / R6 mitigation Step 2

---

#### T6.2 tests/integration/routing-30-samples.test.ts (≥ 30 cell + Pattern P)
- [ ] **目标**: C6 acceptance bar — sample-driven routing accuracy test；inline truth table (D-16)；≥ 85% tolerance threshold
- **文件**: `/d/GitCode/harnessed/tests/integration/routing-30-samples.test.ts`（**新文件**，≥ 200 行）
- **内容大纲**:
  - **顶部 IMPL NOTE** (Pattern H): D-16 (inline truth table not fixtures/) + KICKOFF C6 + D1.4-5 + D1.4-10 + Pattern P (新生 — sample-driven accuracy test) + R3 mitigation
  - **inline `const SAMPLES`** (≥ 30 项 1:1 对应 SAMPLES.md):
    ```typescript
    const SAMPLES: Sample[] = [
      { id: 'design-1', category: 'design', prompt: '...', expected_rule_id: 'ui-task-default', expected_primary: 'ui-ux-pro-max' },
      // ... 30 项
    ]
    ```
  - **测试 cell** (≥ 30 — 每 sample 一 cell + per-category breakdown + total):
    - per-sample test: 跑 `arbitrate(rules, sample.prompt)` → 命中 expected_rule_id ? hit++ : miss++
    - per-category breakdown: 每 category 命中率打印 (避免 cherry-pick 过 1 category 拉高 mean)
    - total accuracy assertion: hit/30 ≥ 0.85 (≥ 27/30)
  - **failure drill-down**: 每 miss sample 打印 actual_rule_id vs expected_rule_id (debug aid)
- **验收**:
  - [ ] tests ≥ 256+1 → ≥ 286+1 skipped (+30 cell)
  - [ ] `corepack pnpm test -- --filter routing-30-samples` 全绿
  - [ ] 命中率 ≥ 85% (≥ 27/30 hit)
  - [ ] per-category breakdown 输出 (避免 cherry-pick)
  - [ ] inline truth table ≥ 30 项 1:1 对应 SAMPLES.md
- **决策来源**: KICKOFF C6 / D-16 / D1.4-10 / Pattern P 新生 / R3 mitigation Step 4

---

### Wave 6 — Cross-OS CI verify

#### T7.1 push origin → CI 三平台全绿 + A7 step iter 1-8 verify
- [ ] **目标**: C7 acceptance bar — push 后 CI 第 N 轮验证；A7 step iter 1-8 全绿（含 ADR 0008）
- **命令**:
  ```bash
  git push origin main
  git push origin adr-0008-accepted
  # 等通知 + gh run watch
  ```
- **验收**:
  - [ ] 最新 CI run 三平台 success
  - [ ] A7 step iterate 1-8 全绿（含 ADR 0008）
  - [ ] tests ≥ 286+1 skipped 三平台 consistent
- **决策来源**: KICKOFF C7 / phase 1.3 push 模式

---

#### T7.2 (可选 hotfix) — CI red 时类 phase 1.2.1 / 1.3.1 模式
- [ ] **目标**: 如 CI red，做 phase 1.4.1 hotfix（参 phase 1.2.1 / 1.3.1 hotfix 模式）
- **触发条件**: T7.1 CI 任一平台 fail
- **决策来源**: phase 1.2.1 + phase 1.3.1 hotfix 经验

---

#### T7.3 (可选 perf attribution) 续 phase 1.3 T7.3 transparency
- [ ] **目标**: 续 phase 1.3 T7.3 PERF-ATTRIBUTION transparency；phase 1.4 实装 routing engine 后 manifest validate 是否 perf 退化
- **触发条件**: routing engine 实装后 hook 进 manifest validate hot path 风险（如 `runInstall` 调用增加 → `validateManifestFile` 调用增加 → perf 退化）
- **文件**: `.planning/phase-1.4/PERF-ATTRIBUTION-2.md`（如需要）
- **验收**:
  - [ ] perf 监控显示 engine 实装后 manifest validate baseline 不超过 phase 1.3 baseline (~28ms) +5%
- **决策来源**: H1b 持续 transparency / sister review pattern

---

### Wave 7 — Docs + ship

#### T8.1 update STATE.md phase 1.4 SHIPPED + 5/17 phase
- [ ] **目标**: STATE.md 标记 phase 1.4 ship + 解锁 phase 1.5
- **文件**: `/d/GitCode/harnessed/.planning/STATE.md`
- **内容修改**:
  - 当前位置: phase 1.4 ✅ COMPLETED — SHIPPED 2026-MM-DD
  - 下一 phase: 1.5 (DAG resolver + Semantic Router L2 + engineering category routing + mattpocock 23 招式 phase routing)
  - 进度: 5 / 17 phases ▓▓▓▓▓░░░░░░░░░░░░ 29.4%
  - 已完成段加 "Phase 1.4 SHIPPED" 条目（含 routing engine v1 + research workflow E2E + 30 sample ≥85% + ADR 0008 errata + R6 deferred phase 1.5）
  - 累积 ADR: 7 → 8（加 ADR 0008 errata）
  - 累积 baseline tag: 7 → 8（加 adr-0008-accepted）
  - tests count: 235+1 → ~286+1
- **进度算法 verify (W-5 sister patch — 沿袭 phase 1.3 B-4 风格)**: 5/17 = (v0.1 phase 1.1+1.2+1.2.5+1.3+1.4 = 5 done) / (v0.1 6 + v0.2 4 + v0.3 4 + v0.4 3 = 17 total) = **29.4%** — 数学闭合验证
- **验收**:
  - [ ] STATE.md phase 1.4 段落完整
  - [ ] 进度表 5/17 = 29.4%
  - [ ] 累积 ADR / baseline tag count 准确

---

#### T8.2 .planning/phase-1.4/VERIFICATION.md ≥ 150L
- [ ] **目标**: B1-C8 复现命令清单 + Phase 1.5 prereq + Findings 索引
- **文件**: `/d/GitCode/harnessed/.planning/phase-1.4/VERIFICATION.md`（**新文件**，≥ 150 行 — phase 1.3 风格）
- **内容大纲**:
  - § 1 Acceptance Bar 复现命令（C1-C8 各一行 bash + 期望输出 + commit 引用）
  - § 2 Phase 1.5 prereq 列表（DAG resolver + Semantic Router L2 + engineering category routing + mattpocock 23 招式 phase routing 直接消费 phase 1.4 输出 — 8 接口契约 from PLAN.md § 4）
  - § 3 Findings 索引（F40+ 来自 phase 1.4 progress.md § B 反向链接）
  - § 4 一键 reproduce 流程
  - § 5 References
- **验收**:
  - [ ] ≥ 150 行
  - [ ] C1-C8 复现命令完整
  - [ ] Phase 1.5 prereq 8 接口列出

---

#### T8.3 (main agent decide) push tag v0.1.0-alpha.4-routing-engine
- [ ] **目标**: phase 1.4 milestone tag（main agent 决定）
- **决策点**: 是否打 tag — 看 phase 1.4 是否 functional milestone（routing engine v1 + research workflow E2E + 30 sample ≥85% = 是 functional ship）
- **建议**: 打 tag `v0.1.0-alpha.4-routing-engine`（与 phase 1.1/1.2/1.3 milestone 模式一致）
- **决策来源**: phase 1.1/1.2/1.3 milestone tag 风格

---

#### T8.4 phase 1.5 prereq notes 写到 STATE.md / ROADMAP.md
- [ ] **目标**: 为 phase 1.5 plan-phase 启动留 prereq notes
- **文件**: `/d/GitCode/harnessed/.planning/STATE.md` + `/d/GitCode/harnessed/.planning/ROADMAP.md`
- **内容**:
  - phase 1.5 prereq notes 段（待办 P0 / P1 / P2）:
    - **P0**: DAG resolver + Semantic Router L2 (embedding kNN) — 解锁 plan-feature workflow context routing
    - **P0**: engineering category routing rules + mattpocock 23 招式 phase routing schema — 完成 8 支柱 A1' / A5' enforcement (R6 mitigation)
    - **P1**: `initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` v1.1 contract errata 评估 (D1.4-2)
    - **P1**: `--add-plugin ralph-wiggum` 官方 plugin headless mode 切换评估 (D1.4-3)
    - **P2**: phase 1.4 30 sample → phase 3.4 v0.3.0 完整命中率 100+ sample × 多 model × stability 验收
- **验收**:
  - [ ] STATE.md phase 1.5 prereq 段添加
  - [ ] ROADMAP.md phase 1.5 描述 update（含 phase 1.4 ship 后新增 deferred items）

---

## 完成 phase 1.4 的最后一行 commit message 模板

```
phase-1.4: T8.4 close phase 1.4 — routing engine v1 + research workflow E2E ready

- All 8 wave (21 atomic subtasks) complete; acceptance bar C1-C8 all green.
- ADR 0008 errata accepted; routing engine v1 + AgentDefinition factory 1:1 对应 contract v1.
- engine.ts ≤200L / agentDefinition.ts ≤150L / systemPrompt.ts ≤80L (karpathy 严守)
- routing/decision_rules.yaml v1 实测 — 6 category × 5 sample × ≥85% v0.1 内部基线 (≥27/30 hit).
- harnessed research <prompt> 子命令 + research workflow E2E (Tavily+Exa+ctx7 install→spawn→verbatim COMPLETE).
- main agent system prompt verbatim COMPLETE (F33 mitigation) + 4 心法 inject (D1.4-14).
- Tests ≥ 286 + 1 skipped (+51 from 235+1).
- ADR 0001-0007 main body 不动 (A7 守恒); CI A7 step iterate 1-8 全绿.
- 7 baseline tag → 8 baseline tag (adr-0008-accepted).
- Unblocks phase 1.5 (DAG resolver + Semantic Router L2 + engineering category routing + mattpocock 23 招式 phase routing).
- Tag: v0.1.0-alpha.4-routing-engine
```

---

## 维护检查清单（每次 commit 前自检）

- [ ] 改动的 task 在本文件已勾选
- [ ] progress.md 已追加一行（含 commit short-hash）
- [ ] 任何意外 / 决策修订已写入 progress.md § B（F40+，模板沿用 phase 1.3）
- [ ] commit message 含 task ID + 简短 action + 决策来源（ADR / D1.4-X / R1 / R2）
- [ ] 该 task 涉及代码改动 → `corepack pnpm typecheck && corepack pnpm lint && corepack pnpm test` 全绿
- [ ] **A7 守恒 paranoid check**: 每 commit 前 `for n in 0001..0008; do git diff adr-${n}-accepted -- docs/adr/${n}-*.md | wc -l; done` 全 0
- [ ] **W-5 V1 BLOCKER**: agentDefinition.ts 12 字段 1:1 对齐 contract v1 (T3.2 + T4.2 enforce)
- [ ] **D-18 enforce**: systemPrompt.ts 1:1 对齐 contract § 5.4 (T3.3)

---

## Wave-Level Acceptance Checkpoint

每个 wave 完成时跑下列子集验收（来自 PLAN.md § 7）：

| Wave | 完成验收子集 |
|------|--------------|
| Wave 0 | adr-0008-accepted tag + ci.yml A7 iter 1-8 + commits 干净 + `git diff adr-0001-accepted -- docs/adr/0001-*.md` 空 |
| Wave 1 | spike script executable + SPIKE-REPORT.md ≥ 80 行 + 实测 query() API 路径 + verbatim COMPLETE feasibility 结论 + skill load filesystem scan 行为 |
| Wave 2 | typecheck/lint 全绿 + engine ≤ 200L / factory ≤ 150L / systemPrompt ≤ 80L 三 hard limit 满足 + Pattern H IMPL NOTE 5+ 处分布 + `routing/index.ts` barrel re-export |
| Wave 3 | tests 235+1 → ≥ 253+1 skipped (+18 cell, 10 engine + 8 factory) + V1 BLOCKER 比对（手工 plan-checker 可视）+ 4 error paths 全覆盖 |
| Wave 4 | research.ts CLI 命令存在 + cli.ts 9th register fn + integration test ≥ 3 cell（默认 mock 全绿；env-gated real-spawn 可选验证）|
| Wave 5 | SAMPLES.md ≥ 30 sample + 30-sample test 命中率 ≥ 85% + per-sample drill-down 失败 sample 输出 + SAMPLES.md selection rationale + ≥ 3 ambiguous |
| Wave 6 | CI 三平台 success + A7 iter 1-8 全绿 + （可选 perf attribution 续 phase 1.3 T7.3 transparency）|
| Wave 7 | STATE.md / VERIFICATION.md update + C1-C8 8/8 ✅ + （可选）v0.1.0-alpha.4-routing-engine tag + phase 1.5 prereq notes 写到 STATE.md / ROADMAP.md |
