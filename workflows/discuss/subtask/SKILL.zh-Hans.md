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

澄清需要真实用户对话,所以本阶段直接在**本 session** 跑 —— **不要** spawn,也**不要**自行演绎:
按以下步骤走,把 locked spec 持久化给执行阶段。

1. 对 "$ARGUMENTS" 评估澄清判据:
   - **战略层** —— 新功能 / 新 milestone / 商业 scope 不清 → gstack `/office-hours` + `/plan-ceo-review`
   - **Phase 层** —— ≥2 个 open implementation decision / 跨 phase API contract 不清 → GSD `/gsd-discuss-phase`
   - **子任务层** —— ≥2 个不同方案 / 核心算法 / API contract 设计 / 高错误成本 → superpowers brainstorming
2. 对每个 fire 的层与用户对话(option 型决策用 AskUserQuestion),锁定每个 open decision。
3. 不 fire 的层透明 skip —— 说明哪些被 skip 及原因。
4. 把 locked 决策持久化到 `.planning/`(planning-with-files 的 `findings.md` / `task_plan.md`)。

产出:一份 locked spec,执行阶段(`/plan` → `/task` → `/verify`)无需再问用户即可消费。

<!-- harnessed-generated:v4.9.3 -->

## 参考资料

- D-04 Stage ① Discuss 三层（战略层 / phase 层 / 子任务层）
- D-05 phase.invokes_tools 条件触发（NEW v3）
- workflows/capabilities.yaml — superpowers-brainstorming / grill-with-docs / grill-me
- workflows/judgments/subtask-gate.yaml — brainstorming trigger
- workflows/defaults.yaml — ralph_max_iterations.discuss-subtask.* values (W2.2 backfill)
