---
name: discuss-subtask
description: |
  Stage ①.c 子任务层 discuss 子工作流 — superpowers brainstorming（≥2 种方案 / 核心算法 /
  API contract / 错误成本高）。schema_version: harnessed.workflow.v3 with disciplines_applied (6
  default) + tools_available (superpowers-brainstorming + grill-with-docs + grill-me) + 1 phase
  （01-brainstorm，含 spec_ambiguous + no_docs 条件调用 invokes_tools）。Triggered by
  harnessed CLI `harnessed discuss-subtask --task <text>` or slash command `/discuss-subtask`
  after `harnessed setup`.
trigger_phrases:
  - "discuss subtask"
  - "子任务澄清"
  - "brainstorm"
  - "多 approach 探索"
  - "跑 discuss-subtask"
---

# discuss-subtask 工作流 (v3)

## 概述

1 阶段子工作流，将 CLAUDE.md "Stage ①.c 子任务层 — superpowers brainstorming"
映射到 harnessed 运行时（Phase v3.0-3.4 W0.3 — D-04 Stage ① Discuss 三层 + D-05
phase.invokes_tools 条件触发 + Pattern A 子工作流发布）。

| 阶段 | id | upstream | model | 能力 / invokes_tools | 门控 |
| ----- | -- | -------- | ----- | -------------------------- | ---- |
| 1 | `01-brainstorm` | superpowers | opus | `{{ capabilities.superpowers-brainstorming.cmd }}` + conditional `invokes_tools[grill-with-docs, grill-me]` | `gate: judgments.subtask-gate.brainstorming.fires` |

## 能力引用

Sister `workflows/capabilities.yaml` 条目：
- `superpowers-brainstorming` — Bucket 4（impl: superpowers, cmd: superpowers:brainstorming）
- `grill-with-docs` — Bucket 1 mattpocock（impl: mattpocock-skills, cmd: /grill-with-docs）
- `grill-me` — Bucket 1 mattpocock（impl: mattpocock-skills, cmd: /grill-me）

## 门控引用

Sister `workflows/judgments/subtask-gate.yaml`:
- `brainstorming.fires` — `subtask.approaches >= 2 or subtask.core_algorithm == true or subtask.has_api_contract == true or subtask.error_cost == 'high'`

## 条件工具调用（D-05 invokes_tools）

- `phase.spec_ambiguous == true` → 触发 `grill-with-docs`
- `phase.spec_ambiguous == true AND phase.no_docs == true` → 触发 `grill-me`

## 调用方式

- Slash command: `/discuss-subtask <text>`（`harnessed setup` 后可用）

## 路由规则

跳过条件（sister CLAUDE.md "子任务层 ❌ 跳过"）：
- 常规 CRUD / 跟现有模式一致
- 单一明显实现（< 20 行 / 一个文件）
- 标准库直接调用
- bug 修复且已知根因

## 如何调用

CC-native 编排。**不要** pipe 到 `harnessed run discuss-subtask` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/discuss-subtask` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/discuss-subtask.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/discuss-subtask.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->

## 参考资料

- D-04 Stage ① Discuss 三层（战略层 / phase 层 / 子任务层）
- D-05 phase.invokes_tools 条件触发（NEW v3）
- workflows/capabilities.yaml — superpowers-brainstorming / grill-with-docs / grill-me
- workflows/judgments/subtask-gate.yaml — brainstorming trigger
- workflows/defaults.yaml — ralph_max_iterations.discuss-subtask.* values (W2.2 backfill)
