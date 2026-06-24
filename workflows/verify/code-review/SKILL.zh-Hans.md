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

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run verify-code-review --task-stdin
```

若 `$ARGUMENTS` 为空，运行 `harnessed run verify-code-review`（不带 stdin pipe）。

执行完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一阶段操作。是否调用取决于对话上下文——该提示仅供参考，不具强制性。

<!-- harnessed-generated:v3.4.4 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- workflows/capabilities.yaml — code-review
- workflows/judgments/parallelism-gate.yaml — subagent-default.fires
- workflows/defaults.yaml — ralph_max_iterations.verify-code-review.* 值（W2.2 backfill）
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 03-code-review-parallel sister verbatim
