---
name: research
description: 多源调研 workflow — Tavily/Exa/ctx7 多源 fan-out + GSD discuss synth aggregate; harnessed v2.0 NEW per R20.7 (Stage ① Discuss 独立 call); schema bumped to harnessed.workflow.v3 in Phase v3.0-3.4 W1.1 (T3.4.W1.1) with disciplines_applied [6] + tools_available [tavily-mcp, exa-mcp, ctx7, gsd-discuss-phase], phases reuse v2 verbatim. Triggered by slash command `/research` after `harnessed setup`.
preamble-tier: 2
schema_version: harnessed.workflow.v3
---

# research workflow

Multi-source research workflow shipped with harnessed v2.0 (Stage ① Discuss);
`workflow.yaml` schema bumped to `harnessed.workflow.v3` in Phase v3.0-3.4 W1.1
(T3.4.W1.1 — D-09 L0 Discipline Substrate + D-05 tools_available cross-validate);
T2.3 split `01-fan-out` into 5 gated source lanes — each lane is now gated by one
`workflows/judgments/web-search-routing.yaml` trigger (those 5 triggers used to be runtime
orphans: zero gate ref, so the file was never loaded or evaluated). `02-synth` unchanged.

## Phases (6)

| # | Phase | Upstream | Capability | Model | Gate | Description |
|---|-------|----------|-----------|-------|------|-------------|
| 01 | `01-fan-out-tavily-keyword` | web-search | (route-by-subtask) | sonnet | `judgments.web-search-routing.tavily-mcp-default.fires` | 默认 lane — Tavily MCP 关键词 / 库 API / 新闻时效 / 生产 RAG |
| 02 | `01-fan-out-exa-descriptive` | web-search | (route-by-subtask) | sonnet | `judgments.web-search-routing.exa-mcp-descriptive-academic.fires` | Exa MCP 覆盖默认 — 描述式查询 / 学术论文 (需 `EXA_API_KEY`, 缺则落默认 lane) |
| 03 | `01-fan-out-tavily-crawl` | web-search | (route-by-subtask) | sonnet | `judgments.web-search-routing.tavily-crawl-map-site.fires` | Tavily 必用 — 抓整站 / 站点结构 (crawl / map), Exa 无对等工具 |
| 04 | `01-fan-out-ctx7-lib-docs` | ctx7 | (route-by-subtask) | sonnet | `judgments.web-search-routing.ctx7-lib-docs.fires` | ctx7 CLI — 库 / API / 框架 / SDK / CLI 工具文档 (prefer over web search) |
| 05 | `01-fan-out-webfetch-url` | web-search | (route-by-subtask) | haiku | `judgments.web-search-routing.webfetch-single-url.fires` | 永远规则 — 单次轻量查询 (一个明确 URL) 直接 WebFetch, 不走 MCP / CLI |
| 06 | `02-synth` | gsd | `gsd-discuss-phase` | opus | (无 gate — 无论命中哪条 lane 都要 aggregate) | GSD discuss-phase aggregate + dedup + reconcile |

Lanes are mutually exclusive (`subtask.search_type` is single-valued); the default
gateContext (`search_type == 'keyword'`) fires only the Tavily lane, which is behaviourally
identical to the pre-T2.3 unconditional single `01-fan-out`.

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `tavily-mcp` (impl: mcp-server, default 关键词)
- `exa-mcp` (impl: mcp-server, 描述式 / 学术)
- `ctx7` (impl: cli-tool, 库 API 文档)
- `gsd-discuss-phase` (synth aggregate)

## Invocation
- Slash command: `/research <topic>` (after `harnessed setup`)

## Routing rules (bundled web-search routing — `workflows/judgments/web-search-routing.yaml`)
- 描述式查询 ("找一篇对比 X 和 Y 的博客") → Exa MCP
- 学术 / 论文 → Exa MCP
- 库 / API 文档 → ctx7 CLI
- 关键词 / 时效内容 → Tavily MCP (默认)
- 抓整站 / 站点结构 → Tavily crawl/map

## How to invoke

!`harnessed checkpoint intent research`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run research` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt research --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, use the native goal gate instead (Claude Code 2.1.139+ / Codex): `/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"` then spawn the subagent and let the goal evaluator drive re-spawns until it clears. If `/goal` is unavailable too, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations). Set the goal only at the leaf subtask level — `/goal` is single-slot per session and a nested goal overwrites the outer one. Delivery contract: use a BLOCKING Agent/Task call — only a blocking call returns the subagent's final text as your tool result. A named/background teammate's final message is DISCARDED by the platform; if you must run it that way, instruct the agent to write its findings to a file (and read it back) or SendMessage them to the main session — otherwise the COMPLETE promise and the findings never reach you.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete research --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it before treating the sub as done.

<!-- harnessed-generated:v4.10.0 -->
