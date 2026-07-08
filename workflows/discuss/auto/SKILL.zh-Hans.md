---
name: discuss
description: |
  Stage ① Discuss 主控编排器 — 3 个子工作流并行门控评估（chain-isolation 铁律）。
  战略层 / Phase 层 / 子任务层独立判断 gate, 可能 3 个全跑 / 1-2 个 / 全跳 + 透明声明。
  schema_version: harnessed.workflow.v3 with delegates_to (3 sub: strategic + phase + subtask, mode parallel)
  + disciplines_applied (6 default) + tools_available (planning-with-files)。
  Triggered by slash command `/discuss`
  (bare per ADR 0030 namespace policy D-02 LOCK) after `harnessed setup`.
trigger_phrases:
  - "discuss"
  - "讨论澄清"
  - "新功能澄清"
  - "stage 1 discuss"
  - "三层澄清"
---

# discuss 主控编排器 (v3)

## 概述

4-stage cadence Stage ① 主控编排器，委托给 3 个独立子工作流
（打包三层独立澄清：战略层 / phase 层 / 子任务层）：

| 子工作流 | gate ref | mode | 触发时机 |
| --- | -------- | ---- | ---------- |
| `strategic` | `judgments.stage-routing.discuss-strategic-delegate.fires` | parallel | new_project / new_milestone / new_feature / is_major_release |
| `phase` | `judgments.stage-routing.discuss-phase-delegate.fires` | parallel | open_decisions ≥ 2 / cross_phase_data_flow / scope_days > 1 |
| `subtask` | `judgments.stage-routing.discuss-subtask-delegate.fires` | parallel | approaches ≥ 2 / core_algorithm / has_api_contract / error_cost=high |

引擎运行时通过 `runMasterOrchestrator` 以
T3.5.W0.1（sister sub-workflow `runWorkflow` SDK pattern，并行 fan-out 通过
subagent 默认方式 — Path A `query()` 并行 OR Path B sub-shell 兜底，per
T3.5.W2.1 dogfood cycle decision LOCK）生成 3 个子工作流阶段。

## Chain-isolation 铁律（sister CLAUDE.md "Fallback 三条铁律"）

- 拿不准 → 倾向跳过, 但在响应里**透明声明**: "这次跳过了 X, 因为 Y。如果你认为需要请明说"
- 用户明示 → 覆盖判据 (用户说 "先 brainstorm" / "跑 office-hours" / "讨论一下" 时无条件激活)
- **链式互不前置**: 跳过战略层 ≠ 必须跳过 phase 层; 每层独立判断 (防止 "上层没跑下层不敢跑" 的死板)

## 能力引用

Sister `workflows/capabilities.yaml`:
- `planning-with-files` — Bucket 4 核心能力（impl: claude-code-plugin, cmd: /plan，discuss 汇入 findings.md）
- sub `strategic` upstream → `gstack-office-hours` + `gstack-plan-ceo-review`
- sub `phase` upstream → `gsd-discuss-phase`
- sub `subtask` upstream → `superpowers-brainstorming` + `grill-with-docs` + `grill-me`

## 调用方式

- Slash command: `/discuss <text>`（bare per ADR 0030 namespace policy D-02 LOCK，`harnessed setup` 后可用）

## 如何调用

澄清需要真实用户对话,所以本阶段直接在**本 session** 跑 —— **不要** spawn,也**不要**自行演绎:
按以下步骤走,把 locked spec 持久化给执行阶段。

0. **新项目引导** —— 若 `.planning/ROADMAP.md` 不存在:`/gsd-new-project` skill 可用则先调用它;不可用则先创建最小骨架再继续(后续 phase 目录遵循 `.planning/phases/<NN>-<slug>/`):
   - `ROADMAP.md`:`# Roadmap` + 每 phase 一行表:`| 01 | <slug> | <一行目标> | in-progress |`
   - `STATE.md`:`# STATE (digest — 保持 <100 行)` + `current: phase 01-<slug> / stage discuss` + `next: <动作>`
   - `REQUIREMENTS.md`:`# Requirements` + 编号行 `- R1: <可验证的验收标准>`
1. 对 "$ARGUMENTS" 评估澄清判据:
   - **战略层** —— 新功能 / 新 milestone / 商业 scope 不清 → gstack `/office-hours` + `/plan-ceo-review`
   - **Phase 层** —— ≥2 个 open implementation decision / 跨 phase API contract 不清 → GSD `/gsd-discuss-phase`
   - **子任务层** —— ≥2 个不同方案 / 核心算法 / API contract 设计 / 高错误成本 → superpowers brainstorming
2. 对每个 fire 的层与用户对话(option 型决策用 AskUserQuestion),锁定每个 open decision。
3. 不 fire 的层透明 skip —— 说明哪些被 skip 及原因。
4. 把 locked 决策持久化到 `.planning/phases/<NN>-<slug>/`(planning-with-files 的 `findings.md` / `task_plan.md`;NN = 两位数,取现有最大 phase 目录号 + 1)。

产出:一份 locked spec,执行阶段(`/plan` → `/task` → `/verify`)无需再问用户即可消费。

<!-- harnessed-generated:v4.9.3 -->

## 参考资料

- D-01 主控编排器委托模式
- D-02 bare slash cmd 约定（ADR 0030 namespace policy LOCK）
- D-04 Stage ① Discuss 三层独立判
- workflows/judgments/stage-routing.yaml — discuss-{strategic,phase,subtask}-delegate triggers
- workflows/discuss/{strategic,phase,subtask}/workflow.yaml — 3 个子工作流 Phase 3.4 已发布
- workflows/judgments/fallback.yaml — 链式互不前置 chain-isolation 铁律
