---
name: research
description: 多源调研 workflow — Tavily/Exa/ctx7 多源 fan-out + GSD discuss synth aggregate; harnessed v2.0 NEW per R20.7 (Stage ① Discuss 独立 call); schema bumped to harnessed.workflow.v3 in Phase v3.0-3.4 W1.1 (T3.4.W1.1) with disciplines_applied [6] + tools_available [tavily-mcp, exa-mcp, ctx7, gsd-discuss-phase], phases reuse v2 verbatim. Triggered by harnessed CLI `harnessed research --topic <text>` or slash command `/research` after `harnessed setup`.
preamble-tier: 2
schema_version: harnessed.workflow.v3
---

# research workflow

Multi-source research workflow shipped with harnessed v2.0 (Stage ① Discuss);
`workflow.yaml` schema bumped to `harnessed.workflow.v3` in Phase v3.0-3.4 W1.1
(T3.4.W1.1 — D-09 L0 Discipline Substrate + D-05 tools_available cross-validate);
phases content (01-fan-out + 02-synth) verbatim reused from v2 SHIPPED unchanged.

## Phases (2)

| # | Phase | Upstream | Capability | Model | Description |
|---|-------|----------|-----------|-------|-------------|
| 01 | `01-fan-out` | web-search | (route-by-subtask) | sonnet | 3 source fan-out (Tavily MCP / Exa MCP / ctx7 CLI per ~/.claude/rules/web-search.md + context7.md routing) |
| 02 | `02-synth` | gsd | `gsd-discuss-phase` | opus | GSD discuss-phase aggregate + dedup + reconcile |

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `tavily-mcp` (impl: mcp-server, default 关键词)
- `exa-mcp` (impl: mcp-server, 描述式 / 学术)
- `ctx7` (impl: cli-tool, 库 API 文档)
- `gsd-discuss-phase` (synth aggregate)

## Invocation
- CLI: `harnessed research --topic "<topic>"`
- Slash command: `/research <topic>` (after `harnessed setup`)

## Routing rules (sister ~/.claude/rules/web-search.md)
- 描述式查询 ("找一篇对比 X 和 Y 的博客") → Exa MCP
- 学术 / 论文 → Exa MCP
- 库 / API 文档 → ctx7 CLI (per ~/.claude/rules/context7.md)
- 关键词 / 时效内容 → Tavily MCP (默认)
- 抓整站 / 站点结构 → Tavily crawl/map
