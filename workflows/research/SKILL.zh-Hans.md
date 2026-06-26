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

CC-native 编排。**不要** pipe 到 `harnessed run research` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/research` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/research.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/research.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->
