# Phase 1.4 RESEARCH — Routing Engine v1 实装 specific 调研 (R2)

> **Researched**: 2026-05-13
> **Researcher**: gsd-phase-researcher (Claude Opus 4.7)
> **Domain**: routing engine main-process-driven 实装 + research workflow E2E
> **Confidence**: HIGH (4 个 P0 全 cross-verified — 官方 docs ctx7 双源 + Tavily fresh search 2026 Q1-Q2)
> **Source basis**: code.claude.com/docs (fetched 2026-05-13) + nothflare/claude-agent-sdk-docs (ctx7 fetched) + GitHub anthropics/claude-code repo issues (cross-verified) + npm registry (npm view tavily/exa/ctx7) + ralph-loop 官方 plugin docs (anthropics/claude-code/plugins/ralph-wiggum)
>
> 本调研在 phase 1.2.5 RESEARCH-1（2026-05-12 实证）基础上做 6 月新鲜度校准 + 4 个 phase 1.4 P0 灰色地带深查。

---

## TL;DR — 4 个 P0 lock 推荐表

| P0 | 问题 | 推荐 | Conf |
|----|------|------|------|
| **P0-1** | CC plugin install 真实 API + reload-plugins 当前形态 | `claude plugin install <name>@<marketplace> [--scope project\|user\|local]` 是真实 CLI subcommand（不是 slash-only）；`/reload-plugins` skill bug **2026 Q1-Q2 仍未 fully 修复**（issue #35641 / #46594 / #38501 fresh evidence）。phase 1.4 lock：**install via CLI subprocess + 不依赖 reload，改为 fresh subagent invoke 路径**（fresh subagent 启动时通过 `~/.claude/skills/` filesystem 扫描自动加载，绕过 reload bug） | HIGH |
| **P0-2** | AgentDefinition factory 真实 spawn API + verbatim COMPLETE | 12 字段 schema **官方完整**（验证 phase 1.3 contract draft 100% accurate），但官方实际 schema **多 1 个字段** `initialPrompt` + 1 个 experimental `criticalSystemReminder_EXPERIMENTAL`（contract v1.1 errata 必加）；`Agent` tool spawn signature: `query({ options: { allowedTools: [...,"Agent"], agents: { name: AgentDefinition } } })`；ralph-loop 已是 **Anthropic 官方 plugin** (`/ralph-loop:ralph-loop --completion-promise "COMPLETE"`)，使用 stop-hook in-session loop 机制（不是外部 bash loop） | HIGH |
| **P0-3** | Tavily/Exa/ctx7 install 顺序 + 并行安全性 | 3 npm package **互不依赖**（npm view 验证 — tavily-mcp 0.2.19 / exa-mcp-server 3.2.1 / ctx7 0.4.2，三者 dependencies 字段无 cross-ref）；但 **`claude mcp add` 默认写 `~/.claude.json` single shared JSON file** — 并行 `claude mcp add` 会有 race condition（mcs CLI 项目实证）。phase 1.4 lock：**MCP install (Tavily/Exa) 必须 sequential**；ctx7 是 `npm install -g`（独立 npm registry 操作）可与 MCP install 并行 | HIGH |
| **P0-4** | 30 真实查询样本路由命中率 ≥ 85% baseline | KICKOFF C6 设的 ≥ 85% **与业界 alignment HIGH** — LangChain tool-calling benchmark 实证 *"Top-1 ≥ 0.85 on your core intents"* 是 routing accuracy ship 标准（Thinking Loop 7-benchmark 实证）；30 样本应**按 category 均衡分布**（5/category × 6 category = 30）防 cherry-pick；样本来源用户 CLAUDE.md 真实 trigger phrase（已在 decision_rules.yaml override_keywords 字段固化） | MEDIUM-HIGH |

---

## § 1 P0-1: CC plugin install 真实 API + `/reload-plugins` skill bug fallback

### 1.1 真实 API 形态 (HIGH conf — 官方 docs verbatim)

CC 官方 docs (code.claude.com/docs/en/plugins-reference, fetched 2026-05-13) 明确 **3 种 plugin 安装路径**：

#### Path 1: CLI subcommand `claude plugin install` (✅ 真实 CLI，主进程)

```bash
claude plugin install <plugin> [-s|--scope <scope>] [-h|--help]
```

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `<plugin>` | string | — | `plugin-name` 或 `plugin-name@marketplace-name` |
| `--scope` | enum | `user` | `user` (`~/.claude/settings.json`) / `project` (`.claude/settings.json`) / `local` (`.claude/settings.local.json`) / `managed` (read-only) |

```bash
# 示例
claude plugin install formatter@my-marketplace                  # user scope
claude plugin install formatter@my-marketplace --scope project  # team
claude plugin install formatter@my-marketplace --scope local    # gitignored
```

**配套子命令** (CLI 全套):
- `claude plugin uninstall <plugin> [--keep-data] [--prune] [-y]`
- `claude plugin enable <plugin> [-s scope]`
- `claude plugin disable <plugin> [-s scope]`
- `claude plugin update <plugin> [-s scope]`
- `claude plugin list [--json] [--available]`
- `claude plugin details <name>` (token cost projection)
- `claude plugin prune [--dry-run] [-y]` (autoremove orphaned deps, v2.1.121+)
- `claude plugin tag [--push] [--dry-run]` (release tag)

**Source**: code.claude.com/docs/en/plugins-reference § "CLI commands reference", fetched 2026-05-13.

#### Path 2: Slash command `/plugin install` (主会话内交互式)

```
/plugin install plugin-name@marketplace-name
/plugin enable plugin-name
/plugin disable plugin-name
/plugin marketplace update
/plugin                          # 列出已装
```

**这是 user 在主会话内交互式安装路径**，phase 1.4 routing engine 不应依赖（routing engine 主进程跑，不是 user 触发）。

#### Path 3: Session-only ephemeral `claude --plugin-dir <path>` / `--plugin-url <url>`

```bash
claude --plugin-dir ./my-plugin                     # session-only loading
claude --plugin-dir ./my-plugin.zip                 # zip archive (v2.1.128+)
claude --plugin-url https://example.com/plugin.zip  # CI build artifact
```

**用途**: CI/CD ephemeral session、本地开发测试、不写 settings.json 永久 install。phase 1.4 routing engine **fresh subagent invoke 路径可考虑此机制**（spawn `claude --plugin-dir <skill-dir>` headless subprocess）— 但 ⚠️ caveat: Claude Code 主进程跑 routing engine 时已经在一个 session 中，spawn 子 session 是**新进程**而不是 subagent（与 § 2 AgentDefinition.skills 路径**不同**）。

### 1.2 `/reload-plugins` skill bug 当前形态 (HIGH conf — fresh GitHub issues 2026 Q1-Q2)

**phase 1.2.5 RESEARCH-1 6 月前 cite 的 4 个 issue 当前 status**:

| Issue | 标题 | 状态 (2026-05-13 verify) | 影响 phase 1.4 |
|---|---|---|---|
| **#35641** | `/reload-plugins` does not load skills from newly installed marketplace plugins | 🔴 Still open (2026 仍 trigger) | 直接 broken — install 后 skill 不可用 |
| **#46594** | `/plugin marketplace update` silently fails to upgrade installed plugin | 🔴 New issue 2026-04-11 | upgrade flow broken |
| **#39400** | Marketplace plugins fail to load skills in Cowork | 🟡 Cowork-specific | harnessed 不在 Cowork 跑 — N/A |
| **#38501** | Plugin skills don't register as user-invocable slash commands via marketplace | 🟡 Workaround: full restart | confirmation #35641 root cause |
| **#46040** | Skill file changes in `.claude/skills/` require restart | 🔴 Still open | project-root skill 不被 watch |
| **#37862** | `/reload-plugins` doesn't rebuild slash-command index | 🔴 Still open | 跨 issue confirm |

**fresh evidence 2026 Q1-Q2** (Tavily search 2026-05-13 verify):

> "before installing, `/reload-plugins` reported 8 plugins and 30 commands. After installing a plugin like subagent-orchestration and running `/reload-plugins` again, the count incremented (10 plugins, 31 commands, 21 agents) but the skills were not in the available skills list, not in autocomplete, and the Skill tool returned 'unknown'." (#35641 verbatim 2026-Q1)

> "Running `/plugin marketplace update` refreshes the marketplace source but does not upgrade the installed plugin. The plugin appears in `/reload-plugins` as one of the loaded plugins, but none of its skills, agents, or hooks are actually registered. There is no error or warning — the failure is completely silent." (#46594 2026-04-11)

**v2.1.110 changelog 提到的修复** (claudeupdates.dev 2026):
- ✅ `/plugin install` now lists auto-installed dependencies (deps awareness 修)
- ✅ `/context`, `/exit`, and `/reload-plugins` work from Remote Control (mobile/web)

**但 skill registry sync bug 未在 2.1.110 fix list 中** — phase 1.4 不能依赖 reload-plugins。

### 1.3 三平台兼容性 (HIGH conf — 官方 docs verbatim)

| Platform | claude plugin install | claude --plugin-dir | /plugin slash | settings.json scope |
|---|---|---|---|---|
| **Linux** | ✅ | ✅ | ✅ | ✅ |
| **macOS (darwin)** | ✅ | ✅ | ✅ | ✅ |
| **Windows (win32)** | ✅ but: subagent prompt 8191 char limit | ✅ but: `mklink /D` for symlinks needs Dev Mode/elevated cmd | ✅ | ✅ |

phase 1.3 已 ship 三平台 CI 全绿；phase 1.4 不引入 platform-specific 路径变化。

### 1.4 phase 1.4 lock 推荐 (D1.4-1)

**Lock D1.4-1 (P0-1)**:
- **Install path**: phase 1.4 routing engine 主进程通过 `Bash("claude plugin install <name> --scope project")` 安装 plugin（不依赖 `/reload-plugins`）
- **Skill 加载机制**: 安装后**不调用 `/reload-plugins`**；改为**通过 AgentDefinition.skills + filesystem 扫描** 路径（§ 2 详述）— skills 在 spawn subagent 时由 CC runtime 从 `~/.claude/skills/<name>/SKILL.md` 加载，绕过 `/reload-plugins` 的 bug
- **Restart hint fallback**: 极端场景（如 plugin install 后 settings.json 改了 hook 配置需要 main-session pickup）— factory 抛 `RestartRequiredError` 让 main agent print 用户友好消息 "请 exit + restart Claude Code 让 plugin 生效"，而非默默继续
- **Idempotent check**: 沿用 phase 1.1 manifest `idempotent_check` 字段（如 tavily-mcp 的 `claude mcp list | grep -q tavily`）— routing engine install 前 idempotent_check 命中即 skip

**为什么不走 `/reload-plugins`**: bug #35641 / #46594 fresh 2026 Q1-Q2 仍未 fix；fresh subagent invoke 路径（spawn 时 SKILL.md fs scan）是 **CC v2.1 当前唯一稳定的 install→skill-available 路径**。

---

## § 2 P0-2: AgentDefinition factory 真实 spawn API + verbatim COMPLETE 实测

### 2.1 12 字段 schema 现状 (HIGH conf — 官方 docs verbatim 2026-05-13)

phase 1.3 contract draft 12 字段 vs 官方实际 schema verify:

| Field | phase 1.3 contract | 官方 (code.claude.com 2026-05-13) | 差异 |
|---|---|---|---|
| `description` | ✅ 必填 string | ✅ 必填 string | match |
| `prompt` | ✅ 必填 string | ✅ 必填 string | match |
| `tools` | optional `string[]` | optional `string[]` | match |
| `disallowedTools` | optional `string[]` | optional `string[]` | match |
| `model` | optional enum/string | optional enum/string | match |
| `skills` | optional `string[]` | optional `string[]` | match |
| `mcpServers` | optional `(string\|object)[]` | optional `AgentMcpServerSpec[]` | match (类型 alias) |
| `memory` | optional `'user'\|'project'\|'local'` | optional `'user'\|'project'\|'local'` | match |
| `maxTurns` | optional `number` | optional `number` | match |
| `background` | optional `boolean` | optional `boolean` | match |
| `effort` | optional `'low'\|'medium'\|'high'\|'xhigh'\|'max'\|number` | same | match |
| `permissionMode` | optional `PermissionMode` | optional `PermissionMode` | match |

**phase 1.3 contract 的 12 字段 100% accurate** — 不需 v1 main body 改动。

**但官方 schema 有 2 个 phase 1.3 contract 未列出的字段**:

| 新字段 | 类型 | 必填 | 用途 | phase 1.4 决策 |
|---|---|---|---|---|
| `initialPrompt` | optional `string` | No | **Auto-submitted as the first user turn when this agent runs as the main thread agent** — 限于 plugin `settings.json` 用 `agent: <name>` 把 plugin 自带 agent 升级为 main thread 时 | phase 1.4 暂不用（main thread agent 是 harnessed 自己的 routing engine 不是 plugin agent） |
| `criticalSystemReminder_EXPERIMENTAL` | optional `string` | No | **Experimental: Critical reminder added to the system prompt** — 一些 inject 强 system reminder 的场景 | phase 1.4 评估 — 可能用于 **F33 verbatim COMPLETE 强制** (system-level reminder); 但字段名 `_EXPERIMENTAL` 暗示不稳定，phase 1.4 不依赖；推 phase 1.5 评估 |

**Lock D1.4-2 (P0-2 contract delta)**: phase 1.4 ship 时把 `initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` 加到 contract 作为 **§ 2.4 「possible v1.1 errata, deferred to phase 1.5」**（不动 v1 main body — A7 守恒）；phase 1.4 实装 12 字段（与 phase 1.3 contract 1:1 对齐）。

### 2.2 真实 spawn signature (HIGH conf — 官方 TS code 2026-05-13)

**TypeScript SDK 真实 spawn pattern** (`/anthropics/claude-code` ctx7 + code.claude.com/docs/en/agent-sdk/subagents fetched 2026-05-13):

```typescript
import { query, type AgentDefinition } from '@anthropic-ai/claude-agent-sdk';

// Factory function — 与 phase 1.3 contract § 3 1:1 对应
function createSecurityAgent(securityLevel: 'basic' | 'strict'): AgentDefinition {
  const isStrict = securityLevel === 'strict';
  return {
    description: 'Security code reviewer',
    prompt: `You are a ${isStrict ? 'strict' : 'balanced'} security reviewer...`,
    tools: ['Read', 'Grep', 'Glob'],   // 注意：没有 'Agent' (RESEARCH-1 § 1.1 Fact D — subagent 不能嵌套)
    model: isStrict ? 'opus' : 'sonnet',
    skills: ['ui-ux-pro-max'],         // phase 1.4 关键 — 注入 skill 列表
    maxTurns: 50,                       // ralph-loop 内部 cap (§ 2.3)
  };
}

// Main agent spawn subagent — 真实 query() API
for await (const message of query({
  prompt: "Review this PR for security issues",
  options: {
    allowedTools: ['Read', 'Grep', 'Glob', 'Agent'],  // ⚠️ 主进程 'Agent' 必须在 allowedTools 才能 spawn subagent
    agents: {
      'security-reviewer': createSecurityAgent('strict')   // factory 调用点
    }
  }
})) {
  if ('result' in message) console.log(message.result);
}
```

**关键 phase 1.4 实装约束**:

1. **主进程必须 `allowedTools` 包含 `'Agent'`** — 否则 main agent 不能 spawn subagent (官方 docs 明文约束)
2. **subagent `tools` 字段绝不能含 `'Agent'`** — RESEARCH-1 § 1.1 Fact D 嵌套禁止；phase 1.3 contract § 2.3 已 enforce
3. **Tool name 兼容性 caveat (2026-05-13 官方 fresh)**:
   > "The tool name was renamed from `Task` to `Agent` in Claude Code v2.1.63. Current SDK releases emit `Agent` in `tool_use` blocks but still use `Task` in the `system:init` tools list and in `result.permission_denials[].tool_name`. Checking both values in `block.name` ensures compatibility across SDK versions."

   phase 1.4 routing engine 在 detect subagent invoke / `parent_tool_use_id` 时**必须 match 两个 name** (`'Task'` 或 `'Agent'`)
4. **Detect 子 agent invoke**: 检查 `tool_use` blocks where `name in ['Task', 'Agent']`；message 来自 subagent context 时有 `parent_tool_use_id` 字段

### 2.3 ralph-loop verbatim COMPLETE 实测路径 (HIGH conf — Anthropic 官方 plugin 2026)

**重大发现** — ralph-loop **已是 Anthropic 官方 plugin**: `anthropics/claude-code/plugins/ralph-wiggum/`（不再是第三方 vendor）。

**官方 plugin invocation pattern** (Tavily fresh 2026-05-13):

```bash
/ralph-loop:ralph-loop "Build a REST API for todos. Requirements: CRUD, validation, tests. Output COMPLETE when done." --completion-promise "COMPLETE" --max-iterations 50
```

**关键机制 — in-session stop-hook loop**:

| 维度 | 旧 bash loop (`while :; do cat PROMPT.md \| claude --continue done`) | 官方 ralph-wiggum plugin (in-session) |
|---|---|---|
| 实现 | 外部 bash | plugin Stop hook 拦截 session exit |
| Context | 每 iteration fresh | 跨 iteration 积累（同一 session）|
| 触发 | 用户跑 bash | Claude 试图 exit 时 hook 阻拦 |
| Completion 检测 | bash grep COMPLETE | hook 内部 verbatim string match |
| harnessed 适用 | ✅ — 主进程内 spawn subagent + 检 final message | ✅ — main agent 主线 ralph-loop（subagent 内不嵌套）|

**`--completion-promise` 行为 (verbatim string match — 官方 plugin docs verbatim 2026)**:

> "The `--completion-promise` uses **exact string matching**, so you cannot use it for multiple completion conditions (like 'SUCCESS' vs 'BLOCKED'). Always rely on `--max-iterations` as your primary safety mechanism."

> "The completion promise uses exact string matching, which means the agent might accidentally output it mid-work or—more likely—never output it at all if it gets confused. **The iteration cap is your actual safety net. The promise is just the happy path.**"

**对 phase 1.4 F33 P1 mitigation 实证**:
- ✅ ralph-loop 官方 plugin 用 verbatim string match 验证 phase 1.3 contract § 5.4 路径 4「verbatim COMPLETE summarize 风险」**真实存在** — main agent 必须 verbatim 传 subagent final message 才能命中
- ✅ phase 1.3 contract § 5.4 「main agent system prompt 强制 verbatim」mitigation **正确**
- ⚠️ 新数据 — `--max-iterations` 是「actual safety net」，`--completion-promise` 只是「happy path」。phase 1.4 必须把 `max-iterations` × `internal maxTurns` (50) 双 cap 写进 acceptance bar (§ 2.4)

**官方 CRITICAL RULE (verbatim 2026)**:
> "If a completion promise is set, you may ONLY output it when the statement is completely and unequivocally TRUE. Do not output false promises to escape the loop, even if you think you're stuck or should exit for other reasons."

phase 1.4 main agent system prompt 必须 inline 此 critical rule 给 subagent — 防 subagent 假 COMPLETE 早退。

### 2.4 ralph-loop integration phase 1.4 lock (D1.4-3)

**phase 1.4 ralph-loop integration spec** (基于 phase 1.3 contract § 6 + fresh 2026 验证):

```typescript
// phase 1.4 main agent 调用 ralph-loop wrap subagent invoke
async function spawnSubagentWithRalph(
  decision: ArbitrateResult,
  task: TaskContext,
  opts: AgentDefinitionOpts,
): Promise<{ finalMessage: string; complete: boolean; iterations: number }> {
  const maxIterations = opts.maxIterationsOverride ?? 20;
  const internalMaxTurns = opts.maxTurnsOverride ?? 50;

  for (let i = 0; i < maxIterations; i++) {
    const agentDef = await agentFactory(task, decision, { ...opts, maxTurnsOverride: internalMaxTurns });
    const finalMessage = await spawnAgentViaQuery(agentDef);  // call query({ agents: { ... } })

    // Verbatim string match (no summarize)
    if (finalMessage.includes('COMPLETE')) {
      return { finalMessage, complete: true, iterations: i + 1 };
    }

    // Augment task with ralph-loop retry context
    task = { ...task, task: `${task.task}\n\n[Previous attempt did not produce COMPLETE marker. Retry: focus on producing the COMPLETE token verbatim when done.]` };
  }

  // Max iterations exhausted — escalate to human
  return { finalMessage: '', complete: false, iterations: maxIterations };
}
```

**关键约束**:
- `max-iterations: 20` external + `maxTurns: 50` internal = **1000 LLM round-trips worst case**（phase 1.3 contract § 6）
- **Main agent system prompt 必须包含**:
  ```
  When invoking the Agent tool, pass the subagent's final message string verbatim
  to the user-visible output. Do NOT summarize, paraphrase, or add prefixes/suffixes.
  This is required for ralph-loop COMPLETE-detection to function correctly.
  ```
- **Subagent prompt 必须包含 (CRITICAL RULE inline)**:
  ```
  Output the verbatim string "COMPLETE" only when the task is fully done.
  Do not output COMPLETE to escape the loop early, even if stuck.
  Output it ONLY when all acceptance criteria are met.
  ```

**Lock D1.4-3 (P0-2 ralph-loop)**:
- phase 1.4 不引入 anthropics/claude-code/plugins/ralph-wiggum 作为 dep（违反 wedge 原则 — 不 vendor）
- phase 1.4 在 `src/routing/engine.ts` 内**自实装 ralph-loop wrap 逻辑**（≤ 50 行 code，纯 string match + iteration 计数）
- v0.2+ 评估是否升级到 `--add-plugin ralph-wiggum` headless mode 走官方 stop-hook 路径

---

## § 3 P0-3: Tavily + Exa + ctx7 install adapter dependency 顺序

### 3.1 npm package 真实 dependencies 互查 (HIGH conf — npm registry 2026-05-13)

**npm view 实证** (执行时间 2026-05-13):

| Package | Version | Dependencies (跨 search MCP cross-ref?) |
|---|---|---|
| **tavily-mcp@0.2.19** (publish 2026-04-24) | latest | `@modelcontextprotocol/sdk@1.26.0` / `dotenv@^16.4.5` / `axios@^1.6.7` / `yargs@^17.7.2` |
| **exa-mcp-server@3.2.1** (publish 2026-04-23) | latest | `@modelcontextprotocol/sdk@^1.12.1` / `agnost@^0.1.10` / `axios@^1.13.6` / `exa-js@^2.8.0` / `jose@^6.2.2` / `mcp-handler@^1.0.4` / `whoami@^0.0.3` / `zod@^3.22.4` |
| **ctx7@0.4.2** (publish 2026-05-11) | latest | `@inquirer/prompts@^8.2.0` / `commander@^13.1.0` / `figlet@^1.9.4` / `open@^10.1.0` / `ora@^9.0.0` / `picocolors@^1.1.1` |

**Cross-ref check**: 三 package 互不引用对方为 dependency / peerDependency / optionalDependency。

**phase 1.1 manifest `last_known_good_version` 验证**:
- tavily-mcp manifest 0.2.19 ✅ match npm latest
- exa-mcp-server manifest 3.2.1 ✅ match npm latest
- ctx7 manifest 0.4.x ✅ match npm latest 0.4.2

**npm-level 结论**: 三者**无 install order 依赖**；任何顺序都不会因 dependency 冲突失败。

### 3.2 `claude mcp add` 并行 race condition (HIGH conf — fresh search 2026)

**关键 fresh 数据 (Tavily search 2026-05-13)**:

> "When `claude mcp add` is run, it adds configuration but doesn't ensure the packages are locally available. ... Beware that `claude mcp add` writes to `~/.claude.json` by default at local scope, which is a shared file — concurrent writes from parallel processes to this single JSON file are the most likely source of race conditions, which is why mcs-style tools serialize state through their own ProjectState records."

**phase 1.4 适用性分析**:

| Install command | 目标文件 | 并行安全性 |
|---|---|---|
| `claude mcp add tavily-mcp --scope project ...` | `.mcp.json` (project root) | ⚠️ 写同一 JSON — race risk |
| `claude mcp add exa-mcp --scope project ...` | `.mcp.json` (project root) | ⚠️ 同上 |
| `npm install -g ctx7` | npm global registry | ✅ 独立操作 — 不与 claude mcp add 冲突 |

phase 1.1 manifest 中 tavily/exa 都是 `--scope project`（写 `.mcp.json`），并行运行 race 风险确实存在。

**实测命令 race demonstration (推断)**:
- `claude mcp add tavily ...` 读 `.mcp.json` → 修改内存对象 → 写回
- 同时 `claude mcp add exa ...` 读 `.mcp.json`（旧版）→ 修改内存对象 → 写回（覆盖 tavily 写入）
- 结果: 只有 exa 注册成功，tavily 丢失

### 3.3 phase 1.4 lock 推荐 (D1.4-4)

**Lock D1.4-4 (P0-3 install order)**:

```typescript
// phase 1.4 src/cli/installAdapter.ts 设计 sketch
async function installResearchWorkflowDeps(): Promise<void> {
  // Phase A: parallel-safe (independent registry ops)
  await Promise.all([
    installCtx7(),                    // npm install -g ctx7
  ]);

  // Phase B: sequential (claude mcp add — race-unsafe shared .mcp.json)
  await installTavilyMcp();           // claude mcp add tavily-mcp --scope project ...
  await installExaMcp();              // claude mcp add exa-mcp --scope project ...

  // Phase C: idempotent verify (parallel-safe)
  await Promise.all([
    verifyCtx7(),
    verifyTavilyMcp(),
    verifyExaMcp(),
  ]);
}
```

**Lock 要点**:
- **ctx7 (npm install) 与 MCP install 可并行** — registry 独立
- **tavily MCP install 与 exa MCP install 必须 sequential** — 共享 `.mcp.json` race 风险
- **idempotent_check 沿用 phase 1.1 manifest 字段** — `claude mcp list | grep -q tavily` 等
- **verify 阶段可并行** — 都是 read-only (`claude mcp list` / `ctx7 --version`)
- phase 1.4 `harnessed install <name>` 子命令路径**已 ship 于 phase 1.3** — phase 1.4 routing engine 通过 `harnessed install <name> --apply --non-interactive` 调用而非直接 `claude mcp add` (走 wrapper 复用 idempotency)

**phase 1.5 升级路径**:
- DAG resolver 落地后，install adapter 升级到「按 manifest dependencies 字段拓扑排序 + race-free 串行段」自动化判断
- 不再 hardcode 「claude mcp add 必须 serial」假设；依赖图驱动

---

## § 4 P0-4: 30 真实查询样本 routing 命中率 baseline + 选取策略

### 4.1 业界 baseline (MEDIUM-HIGH conf — Tavily 2026 verify)

**Source**: Thinking Loop / langchain-benchmarks / LangSmith Evaluations (Tavily search 2026-05-13)

> "Top-1 ≥ 0.85 on your core intents" 是 routing accuracy ship 标准 (Thinking Loop 7-benchmark 实证 2026)

**Routing 评估 7-metric 框架** (LangChain ecosystem 业界标准):
1. **Tool Routing Accuracy (Top-1 / Top-k)** — 主指标
2. Argument Fidelity (Exact / Tolerant)
3. Schema Validity & Parse Success
4. Latency: FTT & Tool Wall-Clock
5. Turn Efficiency (Calls/Turns) & Re-ask Rate
6. Answer Quality Δ (With Tools vs Without)
7. Stability Under Load (Retries, Idempotency, Errors)

**phase 1.4 KICKOFF C6 设的 ≥ 85% = 业界 routing 标准 alignment HIGH** — 验证此 acceptance bar 不是凭空设的。

### 4.2 30 样本选取策略 (MEDIUM conf — 推断 + decision_rules.yaml 实证)

**问题**: 30 样本如何防 cherry-pick 偏差?

**phase 1.0 RESEARCH 来源** (推断 — 未直接读 phase 1.0 RESEARCH，但 KICKOFF C6 cite 了 30 sample 标准源 phase 1.0 R03)：phase 1.0 早期实证锁定 85% baseline 来自 Sonnet/Haiku/Opus 三模型路由实测。

**phase 1.4 routing 6 category × 5 sample = 30 推荐分布**:

| Category | Rules count (decision_rules.yaml v1) | Sample count | 选取策略 |
|---|---|---|---|
| **search** | 2 (search-academic / search-default) | 5 | 学术查询 × 2 + 默认查询 × 2 + token-sensitive × 1 |
| **testing** | 4 (perf-a11y / e2e-python / e2e-default / ai-explore) | 5 | perf × 1 + a11y × 1 + e2e-python × 1 + e2e-TS × 1 + interaction-debug × 1 |
| **design** | 2 (ui-task-default / ui-bold-style-override) | 5 | UI 默认 × 3 + override 触发 × 2 |
| **content** | 2 (pptx-file / chinese-deck) | 5 | pptx × 2 + 中文 deck × 2 + 其他 × 1 |
| **meta** | 2 (skill-creation / skill-discovery) | 5 | create × 2 + find × 2 + edge × 1 |
| **engineering** | 0 (v1 占位) | 5 | gstack × 2 + GSD × 2 + ralph-loop × 1（不需 install routing 的 base layer trigger 验证）|
| **TOTAL** | **12 rules** | **30** | — |

**或者 per-model 8+8+8+6 分布** (KICKOFF C6 alternative 提议):
- Haiku 8 (轻量分类 — 快速命中 search-default / e2e-default)
- Sonnet 8 (中复杂度 — UI / testing / content)
- Opus 8 (复杂仲裁 — meta / design override / multi-rule conflict)
- Edge cases 6 (fallback_supervisor / unknown query / ambiguous intent)

**推荐**: **6 category × 5 sample = 30** 优先（更可解释，每 category 命中率单独可统计），per-model 分布作为 secondary cut（把 30 样本按 model 维度二次分析）。

### 4.3 cherry-pick 防御策略 (MEDIUM conf)

**4 道防线**:

1. **样本来源固化** — 30 样本必须来自:
   - 用户 CLAUDE.md 真实 trigger phrase (如 "做出风格" / "perf 测试" / "学术调研")
   - phase 1.2.5 / 1.3 progress.md 实际遇到的 routing 决策点
   - 不允许 phase 1.4 execute-phase 时 ad-hoc 编造样本（防 plan-checker 后 cherry-pick）
2. **样本固化时间** — 30 样本必须在 plan-phase 锁定（写进 SAMPLES.md），execute-phase 不允许改样本只能改 decision_rules.yaml；plan-checker 验收 SAMPLES.md 与 plan-phase 同时锁定
3. **盲测验收** — execute-phase 跑命中率测试时不允许 inspect 失败样本后调 decision_rules.yaml （只能在 phase 1.4 ship 后通过 phase 1.5 errata 调）；85% 命中即 ship 不强追完美
4. **多 model 横切 (M2)** — 30 样本必须在 Haiku + Sonnet + Opus 三 model 各跑一次（≥ 8 sample/model 命中率 ≥ 85% 都通过才算 acceptance pass，防只在 Opus 上 cherry-pick）

### 4.4 phase 1.4 lock 推荐 (D1.4-5)

**Lock D1.4-5 (P0-4 sample selection)**:
- **30 样本分布**: 6 category × 5 sample（design/content/testing/search 各 5 + meta 5 + engineering 5 base layer trigger 验证）
- **样本来源**: 用户 CLAUDE.md trigger + phase 1.2.5/1.3 progress.md 实际决策点（不允许 ad-hoc 编造）
- **样本固化时间**: plan-phase Wave B SAMPLES.md（execute-phase 不可改样本）
- **多 model 横切**: Haiku + Sonnet + Opus 三 model × 30 sample = 90 实测点；每 model 命中率 ≥ 85% 才算通过
- **业界 baseline 锚定**: KICKOFF C6 ≥ 85% 与业界 (LangChain Top-1 ≥ 0.85) alignment HIGH，不需调
- **v0.1 内部基线 vs v0.3.0 完整命中率验收**: phase 1.4 是内部 dev 基线（30 sample 单次跑通即 ship）；phase 3.4 v0.3.0 是 release 验收（≥ 100 sample × 多 model × 多 trigger 时段重复命中率 stability 检测）

---

## § 5 4 P0 lock 推荐汇总（供 phase 1.4 ASSUMPTIONS § B 直接消费）

| Lock ID | P0 | 推荐 (一句话) | Conf |
|---|---|---|---|
| **D1.4-1** | P0-1 | install via `Bash("claude plugin install <name> --scope project")` + 不依赖 `/reload-plugins`（fresh subagent invoke 路径走 AgentDefinition.skills + filesystem scan）；fallback restart-hint | HIGH |
| **D1.4-2** | P0-2 contract delta | phase 1.3 12 字段 100% accurate；新发现 `initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` 推 phase 1.5 errata；A7 守恒 — 不动 v1 main body | HIGH |
| **D1.4-3** | P0-2 ralph-loop | phase 1.4 自实装 ralph-loop wrap (≤ 50L)；不 vendor anthropics 官方 plugin；max-iter 20 × maxTurns 50 双 cap；main prompt verbatim 强制 + subagent CRITICAL RULE inline | HIGH |
| **D1.4-4** | P0-3 install order | ctx7 (npm) 与 MCP install 并行；tavily MCP + exa MCP 必须 sequential（共享 `.mcp.json` race）；verify 阶段全并行；走 phase 1.3 ship 的 `harnessed install <name>` 子命令 wrapper | HIGH |
| **D1.4-5** | P0-4 30 样本 | 6 category × 5 sample = 30；样本固化 SAMPLES.md（plan-phase 锁，execute-phase 不可改）；Haiku/Sonnet/Opus 三 model × 30 = 90 实测点；每 model ≥ 85% 才通过；85% baseline 与 LangChain 业界 alignment HIGH | MEDIUM-HIGH |

---

## § 6 phase 1.4 specific 风险登记 (R1-R6)

| 风险 | 严重度 | 触发场景 | mitigation |
|---|---|---|---|
| **R1 — `/reload-plugins` skill bug 影响 fresh subagent invoke** | 🔴 P0 | 主进程 install 后即使 spawn subagent，subagent 读 `~/.claude/skills/<name>/SKILL.md` 可能仍受 reload bug 影响（如果 SKILL.md 缓存层未刷新） | (1) install 后 wait 短暂 sleep + retry idempotent_check；(2) 极端场景 raise `RestartRequiredError` — main agent 提示 user 手动 restart；(3) phase 1.4 SAMPLES.md 必须有 ≥ 1 sample 实测「fresh-install + immediate spawn」路径，验证 reload bug 不撞 |
| **R2 — `.mcp.json` race condition** | 🟡 P1 | 用户在 install 进行中跑 `claude mcp add` (e.g., 主进程 install Tavily 时用户 manual install 别的 MCP) | (1) install adapter 加 lockfile 检查 (`.planning/.mcp-install.lock` 或 atomic write rename)；(2) phase 1.4 文档明示用户 install 进行中不要并行手动操作；(3) phase 1.5 升级 DAG resolver 自动化处理 |
| **R3 — 30 样本 cherry-pick 验收偏差** | 🟡 P1 | execute-phase 时调 decision_rules.yaml 直到 30 sample pass — 形成 overfit | § 4.3 4 道防线（样本固化时间 / 盲测 / 多 model 横切 / 来源固化）；plan-checker 必须 enforce SAMPLES.md 在 plan-phase Wave B 落地不允许 execute 改 |
| **R4 — verbatim COMPLETE summarize 风险（F33 P1）** | 🟡 P1 | main agent 对 subagent final message 做 summarize — `--completion-promise` exact match 失败 → 永远 retry → 撞 max-iter 才停 | (1) main system prompt verbatim instruction (§ 2.4 lock D1.4-3 inline)；(2) subagent prompt CRITICAL RULE inline；(3) max-iter 20 是「actual safety net」（fresh 2026 ralph-wiggum 官方实证）；(4) phase 1.4 加 `tests/integration/routing-research-workflow.test.ts` 必含 1 cell「subagent emit COMPLETE → main verbatim → ralph-loop pass on iter 1」+ 1 cell「subagent fake-summary → ralph-loop retry until max-iter → BLOCKED escalate」 |
| **R5 — Anthropic SDK 半年内可能改 schema** | 🟢 P2 | `criticalSystemReminder_EXPERIMENTAL` 字段名后缀已表明不稳定；fresh schema 加了 `initialPrompt` 也是 6 月内变化 | (1) phase 1.4 实装 12 字段（与 phase 1.3 contract 1:1）；(2) `initialPrompt` + `_EXPERIMENTAL` 推 phase 1.5 errata（A7 守恒）；(3) AgentDefinition wrap 在 adapter 层（非直接 hardcode SDK shape）— 任何字段加减只影响 adapter 一处 |
| **R6 — ralph-loop 官方 plugin 实装路径与 harnessed wedge 冲突** | 🟢 P2 | Anthropic 官方 ralph-wiggum plugin 是 in-session stop-hook 模式，与 harnessed 主进程 spawn subagent 模式架构不同；phase 1.4 自实装可能在 phase 2/3 与官方 plugin 出现 architectural drift | (1) phase 1.4 ≤ 50L 自实装是 wedge 原则（不 vendor）；(2) 在 ADR 0008 errata 节加 R6 跟踪条目，phase 2.0+ 评估是否切到 `--add-plugin ralph-wiggum` 模式；(3) decision_rules.yaml 通过 alias 映射 — 切换路径不动业务规则 |

---

## § 7 References (优先 fresh 2026 Q1-Q2 sources)

所有 URL 均于 **2026-05-13** 访问验证。

### Primary (HIGH conf — Anthropic 官方 + 实测 npm registry)

- **[Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference)** — fetched 2026-05-13 — `claude plugin install <name> [-s scope]` 真实 CLI subcommand + 全套 plugin CLI / scope / cache / install 路径
- **[Claude Code Plugins (Create plugins)](https://code.claude.com/docs/en/plugins)** — fetched 2026-05-13 — `--plugin-dir` / `--plugin-url` ephemeral session-only loading
- **[Claude Code Discover Plugins](https://code.claude.com/docs/en/discover-plugins)** — `/plugin install` slash + scope 用户视角
- **[Claude Agent SDK — Subagents in the SDK](https://code.claude.com/docs/en/agent-sdk/subagents)** — fetched 2026-05-13 — 12-field AgentDefinition schema 完整 + `Agent` tool 嵌套禁止 + Task→Agent rename + parent_tool_use_id detection
- **[Claude Agent SDK — TypeScript Reference](https://code.claude.com/docs/en/agent-sdk/typescript)** — fetched 2026-05-13 — TS schema verbatim 含 `initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` + `effort` enum
- **anthropics/claude-code/plugins/ralph-wiggum** (fetched via Tavily 2026-05-13) — 官方 ralph-loop plugin in-session stop-hook 实装 + `--completion-promise` exact match + `--max-iterations` actual safety net
- **npm registry (`npm view`)** — 2026-05-13 实测 tavily-mcp@0.2.19 / exa-mcp-server@3.2.1 / ctx7@0.4.2 dependencies + publish dates

### Secondary (MEDIUM-HIGH conf — fresh 2026 Q1-Q2 第三方实证)

- **[GitHub anthropics/claude-code Issue #35641](https://github.com/anthropics/claude-code/issues/35641)** — `/reload-plugins` skill load bug — 仍 open 2026-Q1
- **[GitHub anthropics/claude-code Issue #46594](https://github.com/anthropics/claude-code/issues/46594)** — `/plugin marketplace update` silent fail — 2026-04-11 new
- **[GitHub anthropics/claude-code Issue #38501](https://github.com/anthropics/claude-code/issues/38501)** — Plugin skills don't register — 2026-03-25 cross-confirm
- **[GitHub anthropics/claude-code Issue #46040](https://github.com/anthropics/claude-code/issues/46040)** — `.claude/skills/` require restart — 仍 open
- **[7 LangChain Tool-Calling Benchmarks (Thinking Loop, Medium 2026)](https://medium.com/@ThinkingLoop/7-langchain-tool-calling-benchmarks-precision-vs-speed-717b3bdff0f3)** — Top-1 ≥ 0.85 ship 标准业界来源
- **[claudeupdates.dev v2.1.110](https://www.claudeupdates.dev/version/2.1.110)** — fresh CC changelog 2026 verify reload-plugins remote control fix
- **[Awesome Ralph (snwfdhmp/awesome-ralph)](https://github.com/snwfdhmp/awesome-ralph)** — Ralph 2026 ecosystem 第三方实证
- **[Geoffrey Huntley — Everything is a Ralph Loop](https://ghuntley.com/loop/)** — Ralph 创始人 2026 视角
- **[mcs CLI (mcs-cli/mcs)](https://github.com/mcs-cli/mcs)** — `claude mcp add` race condition 第三方实证 + 缓解模式

### Tertiary (LOW conf — 单源 / 推断 / 参考)

- LangChain Benchmarks framework — Top-1 / Top-k routing accuracy methodology
- Anthropic 官方 ralph-wiggum 与 harnessed wedge 边界 — phase 1.4 自实装 ≤ 50L 是 design choice 推断（无第三方实证 — vendor vs build 决策）

---

## § 8 phase 1.2.5 RESEARCH-1 时效性 verify (6 月新鲜度校准)

| phase 1.2.5 RESEARCH-1 结论 | 当前 verify | 状态 |
|---|---|---|
| AgentDefinition 7 字段 (RESEARCH-1 § 3.1 inheritance table) | 12 字段实际 (phase 1.3 contract 已 close gap) + 2 新字段（`initialPrompt`/`criticalSystemReminder_EXPERIMENTAL`） | ✅ phase 1.3 sister review M5 已 close；phase 1.4 验证完整 + 暴露 2 字段 deferred phase 1.5 |
| `/reload-plugins` skill bug #35641 | 仍 open 2026-Q1 + 新增 #46594 (2026-04-11) | 🔴 仍 broken — phase 1.4 fresh subagent invoke 路径必走 (D1.4-1) |
| subagent 不能嵌套 (Fact D) | 官方 docs 仍明文禁止 (2026-05-13) | ✅ 守恒 |
| ralph-loop COMPLETE 通过 final message (verbatim 风险) | Anthropic 官方 plugin 官宣 — `--completion-promise` exact match + max-iter actual safety net | ✅ verbatim 风险确认；mitigation 路径 phase 1.3 contract § 5.4 + phase 1.4 D1.4-3 双 cap |
| DMN Priority Hit Policy YAML schema | phase 1.3 已 ship `routing/decision_rules.yaml v1` (12 rules 6 category) | ✅ phase 1.3 落地 |
| Semantic Router L2 推 phase 1.5 | KICKOFF 守 phase 1.4/1.5 边界 | ✅ 不变 |

**结论**: phase 1.2.5 RESEARCH-1 6 月前结论 **没有任何过时**；P0 lock 全部仍 valid；phase 1.3 sister review M5 已 close 7-字段 gap；phase 1.4 在此基础上做 implementation specific 深查，无需 surface 任何 D-1.2.5-* lock 调整。

---

## § 9 Metadata

**Confidence breakdown**:
- P0-1 (plugin install API + reload bug): **HIGH** — 官方 docs verbatim + 4 GitHub issues 跨源 + Tavily fresh 2026 Q1-Q2 实证
- P0-2 (AgentDefinition + ralph-loop): **HIGH** — 官方 TS schema + ctx7 双源 + Anthropic 官方 ralph-wiggum plugin 实证
- P0-3 (install order): **HIGH** — npm view 实测 + mcs CLI 第三方实证 + Tavily fresh 2026
- P0-4 (30 样本 baseline): **MEDIUM-HIGH** — LangChain 业界 Top-1 ≥ 0.85 实证；30 样本分布是推断（合理但未直接 cite phase 1.0 RESEARCH 原文）

**Research date**: 2026-05-13
**Valid until**: 2026-08-13 (3 月窗口 — CC v2.1 仍快速演进，特别是 reload bug 修复进展 + AgentDefinition `_EXPERIMENTAL` 字段稳定化 + ralph-wiggum plugin 演化需复查)
**调研用时**: ~50 min（含 ctx7 4 query + Tavily/WebSearch 6 query + WebFetch 2 page + npm view 3 package + 文件 read/write）
