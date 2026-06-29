---
name: discuss-phase
description: |
  Stage ①.b Phase 层 discuss 子工作流 — GSD /gsd-discuss-phase 灰色澄清（≥2 个开放
  实现决策 / 跨 phase API contract 不清 / phase scope > 1 天 / 灰色地带）。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gsd-discuss-phase + planning-with-files) + 2 phases（01-gsd-discuss + 02-persist findings.md
  + knowledge.md）。Triggered by harnessed CLI `harnessed discuss-phase --phase <num>` or slash
  command `/discuss-phase` after `harnessed setup`.
trigger_phrases:
  - "discuss phase"
  - "phase 层澄清"
  - "gsd discuss phase"
  - "灰色地带澄清"
  - "跑 discuss-phase"
---

# discuss-phase 工作流 (v3)

## 概述

2 阶段子工作流，将 CLAUDE.md "Stage ①.b Phase 层 — GSD /gsd-discuss-phase 灰色澄清"
映射到 harnessed 运行时（Phase v3.0-3.4 W0.2 — D-04 Stage ① Discuss 三层 + Pattern A
子工作流发布）。

| 阶段 | id | upstream | model | 能力 / 调用 | 门控 / 产物 |
| ----- | -- | -------- | ----- | -------------------- | ---------------- |
| 1 | `01-gsd-discuss` | gsd | sonnet | `{{ capabilities.gsd-discuss-phase.cmd }}` | `gate: judgments.phase-gate.gsd-discuss-phase.fires` |
| 2 | `02-persist` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` + `invokes: /plan` | `artifacts_expected: [findings.md, knowledge.md]` |

## 能力引用

Sister `workflows/capabilities.yaml` 条目：
- `gsd-discuss-phase` — Bucket 2（impl: gsd, cmd: /gsd-discuss-phase）
- `planning-with-files` — Bucket 4（impl: claude-code-plugin, cmd: /plan）

## 门控引用

Sister `workflows/judgments/phase-gate.yaml`:
- `gsd-discuss-phase.fires` — `phase.open_decisions >= 2 or phase.has_cross_phase_data_flow == true or phase.scope_days > 1`

## 调用方式

- Slash command: `/discuss-phase <num>`（`harnessed setup` 后可用）

## 路由规则

跳过条件（sister CLAUDE.md "Phase 层 ❌ 跳过"）：
- 单一明确子任务
- 跟前 phase 同 module 同 pattern
- < 1 天工作量
- bug 修复且已有最小复现

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
- workflows/capabilities.yaml — gsd-discuss-phase / planning-with-files
- workflows/judgments/phase-gate.yaml — gsd-discuss-phase trigger
- workflows/defaults.yaml — ralph_max_iterations.discuss-phase.* values (W2.2 backfill)
