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
T2.3 把 `01-fan-out` 拆成 5 条 gated source lane —— 每条 lane 各由
`workflows/judgments/web-search-routing.yaml` 的一个 trigger gate（那 5 个 trigger 此前是
运行时孤儿：零 gate ref，文件永不加载求值）。`02-synth` 未变。

## 阶段 (6)

| # | Phase | Upstream | Capability | Model | Gate | Description |
|---|-------|----------|-----------|-------|------|-------------|
| 01 | `01-fan-out-tavily-keyword` | web-search | (route-by-subtask) | sonnet | `judgments.web-search-routing.tavily-mcp-default.fires` | 默认 lane —— Tavily MCP 关键词 / 库 API / 新闻时效 / 生产 RAG |
| 02 | `01-fan-out-exa-descriptive` | web-search | (route-by-subtask) | sonnet | `judgments.web-search-routing.exa-mcp-descriptive-academic.fires` | Exa MCP 覆盖默认 —— 描述式查询 / 学术论文（需 `EXA_API_KEY`，缺则落默认 lane） |
| 03 | `01-fan-out-tavily-crawl` | web-search | (route-by-subtask) | sonnet | `judgments.web-search-routing.tavily-crawl-map-site.fires` | Tavily 必用 —— 抓整站 / 站点结构 (crawl / map)，Exa 无对等工具 |
| 04 | `01-fan-out-ctx7-lib-docs` | ctx7 | (route-by-subtask) | sonnet | `judgments.web-search-routing.ctx7-lib-docs.fires` | ctx7 CLI —— 库 / API / 框架 / SDK / CLI 工具文档（优先于 web search） |
| 05 | `01-fan-out-webfetch-url` | web-search | (route-by-subtask) | haiku | `judgments.web-search-routing.webfetch-single-url.fires` | 永远规则 —— 单次轻量查询（一个明确 URL）直接 WebFetch，不走 MCP / CLI |
| 06 | `02-synth` | gsd | `gsd-discuss-phase` | opus | （无 gate —— 无论命中哪条 lane 都要 aggregate） | GSD discuss-phase 聚合 + 去重 + 对账 |

lane 之间互斥（`subtask.search_type` 单值）；默认 gateContext（`search_type == 'keyword'`）
只 fire Tavily lane，与 T2.3 之前"`01-fan-out` 无条件跑一次"行为等价。

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

!`harnessed checkpoint intent research`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run research` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt research --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,改用原生 goal gate(Claude Code 2.1.139+ / Codex):`/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"`,随后 spawn subagent,由 goal 评估器驱动重 spawn 直到目标清除。若 `/goal` 也不可用,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。goal 只在叶子 subtask 层设置 — `/goal` 每 session 单槽,嵌套 goal 会覆盖外层。交付契约:必须用**阻塞式** Agent/Task 调用 —— 只有阻塞调用会把 subagent 的最终文本作为 tool result 返回给你。named/background teammate 的最终消息会被平台**丢弃**;若必须那样跑,要求 agent 把发现写入文件(你再读回)或 SendMessage 回主 session —— 否则 COMPLETE promise 和研究发现永远到不了你手里。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete research --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。

<!-- harnessed-generated:v4.10.0 -->
