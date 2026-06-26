---
name: plan
description: |
  Stage ② Plan 主控编排器 — 串行 invoke 2 个子工作流（architecture 条件触发 → phase 始终触发）。
  复杂架构 gstack /plan-eng-review 锁定架构后再 GSD /gsd-plan-phase + planning-with-files 持久化
  task_plan.md。schema_version: harnessed.workflow.v3 with delegates_to (2 sub: architecture
  serial order 1 + phase serial order 2) + disciplines_applied (6 default) + tools_available
  (planning-with-files + plan-eng-review + gsd-plan-phase)。
  Triggered by slash command `/plan`
  (bare per ADR 0030 namespace policy D-02 LOCK) after `harnessed setup`.
trigger_phrases:
  - "plan"
  - "计划阶段"
  - "stage 2 plan"
  - "持久化计划"
  - "task_plan"
---

# plan 主控编排器 (v3)

## 概述

4-stage cadence Stage ② 主控编排器，委派给 2 个串行子工作流
（打包的 Plan 阶段节奏 + D-06 planning-with-files 横切工具）：

| order | sub | gate ref | mode | when fires |
| ----- | --- | -------- | ---- | ---------- |
| 1 | `architecture` | `judgments.stage-routing.plan-architecture-delegate.fires` | serial | phase.is_complex_architecture == true |
| 2 | `phase` | (unconditional — plan-phase always fires when stage=='plan') | serial | always |

引擎运行时通过 `runMasterOrchestrator` 按 T3.5.W0.1 顺序派发 2 个子工作流阶段：
order 1（architecture 条件触发）必须完成后，order 2 才启动
（phase 无条件，GSD plan-phase + planning-with-files `/plan` task_plan.md 持久化）。
K9 invariant 强制：每个 serial mode 委派必须携带显式 `order`。

## 能力引用

Sister `workflows/capabilities.yaml`：
- `planning-with-files` — Bucket 4 核心 capability (impl: claude-code-plugin, cmd: /plan)
- `plan-eng-review` — Bucket 7 gstack 33 optional (impl: gstack, cmd: /plan-eng-review)
- `gsd-plan-phase` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-plan-phase)
- sub `architecture` upstream → `plan-eng-review`
- sub `phase` upstream → `gsd-plan-phase` + `planning-with-files`

## 路由规则（sister CLAUDE.md "Plan 阶段"）

- **复杂架构必须先跑** `/plan-eng-review` 锁定架构后再进入 plan-phase (sister CLAUDE.md "⚠️")
- 普通 phase 跳过 architecture sub（gate `phase.is_complex_architecture == false`）
- **禁止在规划阶段直接使用** `superpowers:writing-plans` 输出大文档（除非用户明确要求）

## 调用方式

- Slash command：`/plan <text>`（bare per ADR 0030 namespace policy D-02 LOCK，`harnessed setup` 后生效）

## 如何调用

CC-native 编排。**不要** pipe 到 `harnessed run plan` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/plan` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/plan.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/plan.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->
