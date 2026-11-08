---
name: research
description: 多源并行调研，再把结果聚合去重成一份综合结论。用于答案依赖外部最新信息、而非仓库现有内容时。
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
{{ host.native }} {{ host.spawn_subagent.zh_tool }} spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run research` —— 那是 CI/headless 路径({{ host.harnessed_run_warning_note.execution_tail }}

1. Bash: `harnessed prompt research --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model, result_file}`。
2. 用 {{ host.native }} subagent({{ host.spawn_subagent.zh_tool }})以该 `prompt` + `model` spawn。sub 自己把最终结果写入 `result_file`(prompt 里给出的那个路径)—— **完成信号是文件**,不是聊天消息:后台 / 被 re-parent 的 agent 消息可能永不到达,不要等它。然后用 harnessed 自己的完成闸门驱动交付:
   - 闸门是 `harnessed checkpoint complete research --result-file <result_file> --wait 60` —— 单次调用最多等 60 秒,sub 需要更久就重复**同一条**命令;它对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
   - 若被拦下,跑 `harnessed checkpoint fail research --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
   - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
   - {{ host.delivery_contract_note }}
3. 若 sub 的输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表(从 `result_file` 读 —— 聊天消息可能永不到达):STOP,用 {{ host.ask_user }} 原样转达,把答案 append 进 spec,再重 spawn。
4. 当 `result_file` 携带完成标记时:Bash `harnessed checkpoint complete research --result-file <result_file> --wait 60 --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果文件含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--wait 60` 只约束**单次**调用为 60 秒 —— sub 需要更久就重复**同一条**命令,绝不无限等待。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。`result-wait-timeout` 退出码表示 sub 尚未发出完成信号 —— 重复同一条命令;`--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
5. 若 complete 闸门拦下:Bash `harnessed checkpoint fail research --failing-tests <n>` 记录本次尝试。命中停机条件时会打印 `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。

<!-- harnessed-generated:v4.13.0 -->
