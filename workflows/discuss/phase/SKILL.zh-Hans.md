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

CC-native 编排。**不要** pipe 到 `harnessed run discuss-phase` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/discuss-phase` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/discuss-phase.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/discuss-phase.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->

## 参考资料

- D-04 Stage ① Discuss 三层（战略层 / phase 层 / 子任务层）
- workflows/capabilities.yaml — gsd-discuss-phase / planning-with-files
- workflows/judgments/phase-gate.yaml — gsd-discuss-phase trigger
- workflows/defaults.yaml — ralph_max_iterations.discuss-phase.* values (W2.2 backfill)
