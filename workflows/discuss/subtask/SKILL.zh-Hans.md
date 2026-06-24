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

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run discuss-subtask --task-stdin
```

若 `$ARGUMENTS` 为空，运行 `harnessed run discuss-subtask`（不带 stdin pipe）。

执行完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一个阶段。请根据对话上下文决定是否调用——该提示仅供参考，非强制指令。

<!-- harnessed-generated:v3.4.4 -->

## 参考资料

- D-04 Stage ① Discuss 三层（战略层 / phase 层 / 子任务层）
- D-05 phase.invokes_tools 条件触发（NEW v3）
- workflows/capabilities.yaml — superpowers-brainstorming / grill-with-docs / grill-me
- workflows/judgments/subtask-gate.yaml — brainstorming trigger
- workflows/defaults.yaml — ralph_max_iterations.discuss-subtask.* values (W2.2 backfill)
