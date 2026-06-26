---
name: plan-phase
description: |
  Stage ②.b 计划层 plan 子工作流 — GSD /gsd-plan-phase Wave A research + Wave B planner +
  Wave C plan-checker + planning-with-files Claude Code plugin /plan 持久化 task_plan.md +
  progress.md（打包的 Plan-stage 节奏：GSD + planning-with-files）。Stage ② 铁律:
  dual capability (GSD orchestration + planning-with-files plugin)。schema_version:
  harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available [gsd-plan-phase,
  planning-with-files] + 2 phases (01-gsd-plan + 02-persist)。Triggered by harnessed CLI
  `harnessed plan-phase --phase <num>` or slash command `/plan-phase` after `harnessed setup`.
trigger_phrases:
  - "plan phase"
  - "计划层 phase"
  - "gsd plan phase"
  - "持久化计划"
  - "跑 plan-phase"
---

# plan-phase 工作流 (v3)

## 概述

2 阶段子工作流，将 CLAUDE.md "Plan 阶段 — GSD + planning-with-files" 映射到 harnessed
运行时（Phase v3.0-3.4 W0.5 — D-04 Stage ② Plan 二层 + D-15 planning-with-files
claude-code-plugin /plan + Pattern A sub-workflow ship）。

| phase | id | upstream | model | capability / invokes | artifacts |
| ----- | -- | -------- | ----- | -------------------- | --------- |
| 1 | `01-gsd-plan` | gsd | sonnet | `{{ capabilities.gsd-plan-phase.cmd }}` | (Wave A research + Wave B planner + Wave C plan-checker) |
| 2 | `02-persist` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` + `invokes: /plan` | `artifacts_expected: [task_plan.md, progress.md]` |

## 能力引用

Sister `workflows/capabilities.yaml` 条目：
- `gsd-plan-phase` — Bucket 2 (impl: gsd, cmd: /gsd-plan-phase)
- `planning-with-files` — Bucket 4 (impl: claude-code-plugin, cmd: /plan;
  需要通过 Claude Code plugin marketplace 安装 `planning-with-files` Claude Code 插件；
  输出：task_plan.md + progress.md + findings.md)

## Stage ② 铁律 — dual capability

GSD `/gsd-plan-phase` 编排（Wave A research → Wave B planner → Wave C
plan-checker）→ planning-with-files `/plan` 持久化（插件真生成 task_plan.md +
progress.md，NOT fs.writeFile self-impl per D-15 Q-AUDIT-5a claude-code-plugin
reframe）。

## 调用方式

- Slash command：`/plan-phase <num>`（`harnessed setup` 后生效）

## 输出产物

- `task_plan.md` — 主任务清单 + 文件路径 + 依赖 + 验收标准
- `progress.md` — phase 进度跟踪 + cross-session 恢复
- （`findings.md` 由 discuss-* 子工作流产出，此处不重复）

## 如何调用

CC-native 编排。**不要** pipe 到 `harnessed run plan-phase` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/plan-phase` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/plan-phase.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/plan-phase.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->
