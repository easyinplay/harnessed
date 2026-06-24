---
name: research
description: 多源调研工作流 — Tavily/Exa/ctx7 多源 fan-out + GSD discuss synth aggregate; harnessed v2.0 新增 per R20.7 (Stage ① Discuss 独立调用); schema bumped to harnessed.workflow.v3 in Phase v3.0-3.4 W1.1 (T3.4.W1.1) with disciplines_applied [6] + tools_available [tavily-mcp, exa-mcp, ctx7, gsd-discuss-phase], phases reuse v2 verbatim. Triggered by slash command `/research` after `harnessed setup`.
preamble-tier: 2
schema_version: harnessed.workflow.v3
---

# research 工作流

harnessed v2.0 随附的多源调研工作流（Stage ① Discuss）；
`workflow.yaml` schema 在 Phase v3.0-3.4 W1.1 中 bump 至 `harnessed.workflow.v3`
(T3.4.W1.1 — D-09 L0 Discipline Substrate + D-05 tools_available 交叉验证)；
phases 内容（01-fan-out + 02-synth）原样沿用 v2 SHIPPED，未做更改。

## 阶段 (2)

| # | Phase | Upstream | Capability | Model | Description |
|---|-------|----------|-----------|-------|-------------|
| 01 | `01-fan-out` | web-search | (route-by-subtask) | sonnet | 3 路并发调研 (Tavily MCP / Exa MCP / ctx7 CLI，遵循内置 web-search + context7 路由规则) |
| 02 | `02-synth` | gsd | `gsd-discuss-phase` | opus | GSD discuss-phase 聚合 + 去重 + 对账 |

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `tavily-mcp` (impl: mcp-server，默认关键词搜索)
- `exa-mcp` (impl: mcp-server，描述式 / 学术搜索)
- `ctx7` (impl: cli-tool，库 API 文档)
- `gsd-discuss-phase` (synth aggregate)

## 调用方式
- Slash command: `/research <topic>`（`harnessed setup` 后可用）

## 路由规则（内置 web-search 路由 — `workflows/judgments/web-search-routing.yaml`）
- 描述式查询（"找一篇对比 X 和 Y 的博客"）→ Exa MCP
- 学术 / 论文 → Exa MCP
- 库 / API 文档 → ctx7 CLI
- 关键词 / 时效内容 → Tavily MCP（默认）
- 抓整站 / 站点结构 → Tavily crawl/map

## 如何调用

**优先路径**（master orchestrator）：按当前 stage 规定的顺序依次调用各子工作流的 slash command。每个子命令安装在 `<claude-home>/commands/<sub-name>.md`（由 `harnessed setup` 安装），自带双路径兜底。

**兜底路径**（当上游未安装或无返回结果时）：使用 Task 工具 spawn 一个通用 subagent，prompt 如下：

> You are a **Research analyst**.
>
> **Mission**: Multi-source investigation (docs / web search / codebase grep / library probe) producing a `findings.md` with citations, NOT speculation. Use `ctx7` for library docs, `tavily-mcp` / `exa-mcp` for web, `gh` CLI for GitHub artifacts, and codebase `Grep` for internal references.
>
> **Default-suspect mode**: assume the change is broken / risky / incomplete until proven otherwise. Cite `file:line` for every finding; do not generalize.
>
> **Review checklist**:
> 1. Resolve each unknown claim to a citable source (URL, file:line, or `ctx7` doc id)
>
> 2. Cite version explicitly when discussing library / framework APIs (training cutoff may be stale)
>
> 3. Capture conflicting sources side-by-side; do not silently pick one
>
> 4. Flag `OPEN: <question>` for items the user must decide; never paper over
>
> 5. Persist results to `.planning/<phase>/findings.md` for cross-session handoff
>
> **Output format**: structured report with severity-classified findings (verified / unverified / conflicting / open). One finding per line: `[severity] file:line — problem (one sentence); fix: suggested change`. If no findings, say so explicitly. No preamble, no end-of-report summary.

（Role prompt 自包含 — 即使上游 `specialist` user-skill / plugin 未安装也可正常运行。）

（`harnessed setup` 同时会在 `<claude-home>/commands/research.md` 安装一个 `research` Claude Code slash command，使 `/research` 成为真正的平台 slash command — 两个文件携带相同的双路径指令。之前 v3.4.x 中 `harnessed research --apply` CLI 的相关说明已移除；该子命令从未被实现。）

## 如何调用

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run research --task-stdin
```

如果 `$ARGUMENTS` 为空，运行 `harnessed run research`（不带 stdin pipe）。

完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一个阶段。根据对话上下文决定是否调用 — 该提示仅供参考，不作强制指引。

<!-- harnessed-generated:v3.4.4 -->
