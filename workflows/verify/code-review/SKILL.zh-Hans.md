---
name: verify-code-review
description: |
  Stage ④.b verify 子工作流 — code-review 多 agent 并行 fan-out 高置信度 finding
  （subagent 默认路由，per 打包的 parallelism 关卡 — Task / Agent 工具 spawn
  多 subagent fan-out，context 隔离，token 敏感）。
  schema_version: harnessed.workflow.v3，含 disciplines_applied（6 default）+ tools_available
  （code-review）+ 1 阶段（parallelism ref judgments.parallelism-gate.subagent-default.fires）。
  通过 `harnessed setup` 后的斜杠命令
  `/verify-code-review` 触发。
trigger_phrases:
  - "verify code review"
  - "代码审查"
  - "multi-agent code review"
  - "并行 review"
  - "跑 verify-code-review"
---

# verify-code-review workflow (v3)

## 概述

单阶段子工作流，将 CLAUDE.md「Verify 阶段 — code-review 多 agent 并行」章节
映射到 harnessed 运行时（Phase v3.0-3.4 W0.11 — D-04 Stage ④ Verify 7 sub + 子任务并行
机制 subagent 默认路由机器化 + Pattern A 子工作流发布）。

| phase | id | upstream | model | capability | parallelism |
| ----- | -- | -------- | ----- | ---------- | ----------- |
| 1 | `01-code-review` | mattpocock-skills | sonnet | `{{ capabilities.code-review.cmd }}` | `judgments.parallelism-gate.subagent-default.fires` |

每阶段配置从 `workflows/verify/code-review/workflow.yaml` 加载；引擎以并行 fan-out 方式
启动多个 subagent（打包的 subagent-default 规则 — Task / Agent
工具 spawn 多任务并发，context 隔离，summary 折叠回主 context）。

## 能力引用

Sister `workflows/capabilities.yaml` 条目：
- `code-review` — Bucket 1 mattpocock 高频招式（impl: mattpocock-skills，cmd: /code-review）

## Parallelism 关卡引用

Sister `workflows/judgments/parallelism-gate.yaml`：
- `subagent-default.fires` — `subtask.parallel_count <= 3 and subtask.communication_needed == false`
  （默认 fan-out，focused 任务 research / verify / review 单文件 / 跑测试 / 抓 doc / 探索模块）

## 路由规则

在 `phase.stage == 'verify'` 触发后，必须先跑串行（verify-progress），之后并行 fan-out。无跳过
条件 — code-review 多 agent 是 verify-work 第 3 阶段的默认 fan-out（sister CLAUDE.md 原文）。

## 如何调用

!`harnessed checkpoint intent verify-code-review`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-code-review` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt verify-code-review --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,然后用 harnessed 自己的完成闸门驱动交付:
   - subagent 返回后,把它的最终输出写入文件,跑 `harnessed checkpoint complete verify-code-review --result-file <path>` —— 该命令对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
   - 若被拦下,跑 `harnessed checkpoint fail verify-code-review --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
   - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:把 subagent 最终输出写入文件,再 Bash `harnessed checkpoint complete verify-code-review --result-file <path> --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。`--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
5. 若 complete 闸门拦下:Bash `harnessed checkpoint fail verify-code-review --failing-tests <n>` 记录本次尝试。命中停机条件时会打印 `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。

<!-- harnessed-generated:v4.12.0 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- workflows/capabilities.yaml — code-review
- workflows/judgments/parallelism-gate.yaml — subagent-default.fires
- workflows/defaults.yaml — ralph_max_iterations.verify-code-review.* 值（W2.2 backfill）
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 03-code-review-parallel sister verbatim
