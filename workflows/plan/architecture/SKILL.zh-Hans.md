---
name: plan-architecture
description: |
  Stage ②.a 架构层 plan 子工作流 — gstack /plan-eng-review（复杂架构强制治理关卡；
  打包的 plan-stage 节奏：复杂架构阶段前必须执行）。schema_version:
  harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  [plan-eng-review] + 1 phase (01-plan-eng-review) + gate literal expr
  `phase.is_complex_architecture == true`。Triggered by harnessed CLI `harnessed
  plan-architecture --module <name>` or slash command `/plan-architecture` after
  `harnessed setup`.
trigger_phrases:
  - "plan architecture"
  - "架构审查"
  - "plan eng review"
  - "复杂架构"
  - "跑 plan-architecture"
---

# plan-architecture 工作流 (v3)

## 概述

1 阶段子工作流，将 CLAUDE.md "⚠️ 复杂架构前 — plan-eng-review" 映射到 harnessed
运行时（Phase v3.0-3.4 W0.4 — D-04 Stage ② Plan 二层 + D-12 gstack 治理关卡 + Pattern A
sub-workflow ship）。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-plan-eng-review` | gstack | opus | `{{ capabilities.plan-eng-review.cmd }}` | `gate: phase.is_complex_architecture == true` (literal expr) |

## 能力引用

Sister `workflows/capabilities.yaml` 条目：
- `plan-eng-review` — Bucket 7 gstack 33 optional (impl: gstack, cmd: /plan-eng-review)
  - Pattern A E.2 LOCK：无 `gstack-` 前缀，遵循 CLAUDE.md gstack skill 路由约定

## 门控引用

内联 literal expr `phase.is_complex_architecture == true` — sister capability
`fires_when` 子句原文。W2.2 backfill 可加 `judgments/phase-gate.yaml`
trigger `is-complex-architecture` 重构 ref。

## 调用方式

- Slash command：`/plan-architecture <name>`（`harnessed setup` 后生效）

## 路由规则

触发条件（sister CLAUDE.md "⚠️ 复杂架构前"）：
- 涉及多模块跨界设计（≥3 模块协同）
- 新引入核心抽象（新 framework / 新数据模型 / 新协议）
- 性能 / scaling 关键路径
- 引入显著技术债 / migration 风险

## 如何调用

CC-native 编排。**不要** pipe 到 `harnessed run plan-architecture` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/plan-architecture` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/plan-architecture.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/plan-architecture.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->
