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

CC-native 编排。**不要** pipe 到 `harnessed run discuss` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/discuss` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/discuss.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/discuss.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->

## 参考资料

- D-01 主控编排器委托模式
- D-02 bare slash cmd 约定（ADR 0030 namespace policy LOCK）
- D-04 Stage ① Discuss 三层独立判
- workflows/judgments/stage-routing.yaml — discuss-{strategic,phase,subtask}-delegate triggers
- workflows/discuss/{strategic,phase,subtask}/workflow.yaml — 3 个子工作流 Phase 3.4 已发布
- workflows/judgments/fallback.yaml — 链式互不前置 chain-isolation 铁律
