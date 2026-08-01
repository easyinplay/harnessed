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

!`harnessed checkpoint intent plan-architecture`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run plan-architecture` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt plan-architecture --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,然后用 harnessed 自己的完成闸门驱动交付:
   - subagent 返回后,把它的最终输出写入文件,跑 `harnessed checkpoint complete plan-architecture --result-file <path>` —— 该命令对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
   - 若被拦下,跑 `harnessed checkpoint fail plan-architecture --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
   - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:把 subagent 最终输出写入文件,再 Bash `harnessed checkpoint complete plan-architecture --result-file <path> --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。`--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
5. 若 complete 闸门拦下:Bash `harnessed checkpoint fail plan-architecture --failing-tests <n>` 记录本次尝试。命中停机条件时会打印 `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。

<!-- harnessed-generated:v4.12.0 -->

## 参考文档

- D-04 Stage ② Plan 二层（架构 / 计划）
- D-12 gstack 治理关卡（复杂架构强制）
- workflows/capabilities.yaml — plan-eng-review (Bucket 7)
- workflows/defaults.yaml — ralph_max_iterations.plan-architecture.* values (W2.2 backfill)
