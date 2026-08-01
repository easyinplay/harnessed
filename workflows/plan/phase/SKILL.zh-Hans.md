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

!`harnessed checkpoint intent plan-phase`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run plan-phase` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt plan-phase --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,然后用 harnessed 自己的完成闸门驱动交付:
   - subagent 返回后,把它的最终输出写入文件,跑 `harnessed checkpoint complete plan-phase --result-file <path>` —— 该命令对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
   - 若被拦下,跑 `harnessed checkpoint fail plan-phase --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
   - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:把 subagent 最终输出写入文件,再 Bash `harnessed checkpoint complete plan-phase --result-file <path> --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。`--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
5. 若 complete 闸门拦下:Bash `harnessed checkpoint fail plan-phase --failing-tests <n>` 记录本次尝试。命中停机条件时会打印 `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。

<!-- harnessed-generated:v4.12.0 -->

## 参考文档

- D-04 Stage ② Plan 二层（架构 / 计划）
- D-15 Q-AUDIT-5a planning-with-files claude-code-plugin reframe (NOT npm-sdk)
- workflows/capabilities.yaml — gsd-plan-phase / planning-with-files (Bucket 4)
- workflows/defaults.yaml — ralph_max_iterations.plan-phase.* values (W2.2 backfill)
