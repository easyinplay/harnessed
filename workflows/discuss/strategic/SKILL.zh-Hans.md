---
name: discuss-strategic
description: |
  Stage ①.a 战略层 discuss 子工作流 — gstack /office-hours + /plan-ceo-review 新功能 / 新
  milestone / 新产品方向启动前强制治理关卡（打包 gstack governance gate，新功能前必跑）。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-office-hours + gstack-plan-ceo-review + planning-with-files) + 3 phases（gate
  judgments.strategic-gate.* fires + planning-with-files /plan findings.md 持久化）。
  Triggered by slash command
  `/discuss-strategic` after `harnessed setup`.
trigger_phrases:
  - "discuss strategic"
  - "战略层澄清"
  - "office hours"
  - "新功能启动"
  - "跑 discuss-strategic"
---

# discuss-strategic 工作流 (v3)

## 概述

3 阶段子工作流，将 CLAUDE.md "Stage ①.a 战略层 — 新功能启动前强制 🔒"
映射到 harnessed 运行时（Phase v3.0-3.4 W0.1 — D-04 Stage ① Discuss 三层 + D-12 gstack
治理关卡 + Pattern A 子工作流发布）。

| 阶段 | id | upstream | model | 能力 / 调用 | 门控 / 产物 |
| ----- | -- | -------- | ----- | -------------------- | ---------------- |
| 1 | `01-office-hours` | gstack | opus | `{{ capabilities.gstack-office-hours.cmd }}` | `gate: judgments.strategic-gate.office-hours.fires` |
| 2 | `02-plan-ceo-review` | gstack | opus | `{{ capabilities.gstack-plan-ceo-review.cmd }}` | `gate: judgments.strategic-gate.plan-ceo-review.fires` |
| 3 | `03-persist` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` + `invokes: /plan` | `artifacts_expected: [findings.md]` |

## 能力引用

Sister `workflows/capabilities.yaml` 条目：
- `gstack-office-hours` — Bucket 3 治理关卡（impl: gstack, cmd: /office-hours）
- `gstack-plan-ceo-review` — Bucket 3 治理关卡（impl: gstack, cmd: /plan-ceo-review）
- `planning-with-files` — Bucket 4 核心能力（impl: claude-code-plugin, cmd: /plan）

## 门控引用

Sister `workflows/judgments/strategic-gate.yaml`:
- `office-hours.fires` — `phase.type in ['new_project', 'new_milestone', 'new_feature']`
- `plan-ceo-review.fires` — `phase.type == 'new_project' or phase.is_major_release == true`

## 调用方式

- Slash command: `/discuss-strategic <text>`（`harnessed setup` 后可用）

## 路由规则

跳过条件（sister CLAUDE.md "战略层 ❌ 跳过"）：
- bug 修复 / 技术债 / 实现细节
- scope 已在历史 `.planning/` 或 design doc 定义
- continuing 已有 phase 的执行
- 用户已给明确 ticket / spec

## 如何调用

CC-native 编排。**不要** pipe 到 `harnessed run discuss-strategic` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/discuss-strategic` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/discuss-strategic.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/discuss-strategic.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->

## 参考资料

- D-04 Stage ① Discuss 三层（战略层 / phase 层 / 子任务层）
- D-12 gstack 治理关卡强制
- workflows/capabilities.yaml — gstack-office-hours / gstack-plan-ceo-review / planning-with-files
- workflows/judgments/strategic-gate.yaml — office-hours / plan-ceo-review triggers
- workflows/defaults.yaml — ralph_max_iterations.discuss-strategic.* values (W2.2 backfill)
