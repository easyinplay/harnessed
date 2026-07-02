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

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-code-review` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt verify-code-review --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,改用原生 goal gate(Claude Code 2.1.139+ / Codex):`/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"`,随后 spawn subagent,由 goal 评估器驱动重 spawn 直到目标清除。若 `/goal` 也不可用,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。goal 只在叶子 subtask 层设置 — `/goal` 每 session 单槽,嵌套 goal 会覆盖外层。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete verify-code-review --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。

<!-- harnessed-generated:v4.9.3 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- workflows/capabilities.yaml — code-review
- workflows/judgments/parallelism-gate.yaml — subagent-default.fires
- workflows/defaults.yaml — ralph_max_iterations.verify-code-review.* 值（W2.2 backfill）
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 03-code-review-parallel sister verbatim
