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

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run plan-architecture --task-stdin
```

若 `$ARGUMENTS` 为空，运行 `harnessed run plan-architecture`（不带 stdin pipe）。

完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一阶段。是否调用由对话上下文决定——该提示仅供参考，非强制指令。

<!-- harnessed-generated:v3.4.4 -->

## 参考文档

- D-04 Stage ② Plan 二层（架构 / 计划）
- D-12 gstack 治理关卡（复杂架构强制）
- workflows/capabilities.yaml — plan-eng-review (Bucket 7)
- workflows/defaults.yaml — ralph_max_iterations.plan-architecture.* values (W2.2 backfill)
