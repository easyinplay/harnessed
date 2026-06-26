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

CC-native 编排。**不要** pipe 到 `harnessed run verify-code-review` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/verify-code-review` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/verify-code-review.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/verify-code-review.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- workflows/capabilities.yaml — code-review
- workflows/judgments/parallelism-gate.yaml — subagent-default.fires
- workflows/defaults.yaml — ralph_max_iterations.verify-code-review.* 值（W2.2 backfill）
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 03-code-review-parallel sister verbatim
