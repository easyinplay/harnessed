---
name: task-test
description: |
  task-test 工作流 v3 — Stage ③.c 子任务测试 sub-workflow (superpowers TDD
  red-green-refactor 强制 + diagnose 条件调用)。单阶段组合：
  01-test（能力 `superpowers:test-driven-development` + 关卡
  judgments.tdd-gate.tdd-strongly-suggested.fires + invokes_tools[{if: test_fail,
  tool: diagnose}]）。Alias /tdd (mattpocock-skills) 可替代 superpowers TDD per D-13。
  schema_version: harnessed.workflow.v3，含 disciplines_applied [6] + tools_available
  [tdd, diagnose]。通过 harnessed CLI `harnessed task-test --task <text>` 或
  `harnessed setup` 后的斜杠命令 `/task-test` 触发。
trigger_phrases:
  - "test this subtask"
  - "task-test workflow"
  - "Stage 3 test"
  - "TDD red-green-refactor"
  - "跑 task-test"
---

# task-test workflow (v3)

## 概述

单阶段子工作流，将用户 CLAUDE.md Stage ③.c 子任务测试 + TDD
强烈建议开启纪律映射到 harnessed 运行时，完整采用 `harnessed.workflow.v3`
schema（Phase v3.0-3.4 W0 T3.4.W0.8 — D-09 L0 Discipline Substrate + D-04 关卡引用
+ D-05 条件式 `invokes_tools` + D-13 tdd 能力别名）。

| phase | id | upstream | model | capability / invokes_tools | gate |
| ----- | -- | -------- | ----- | -------------------------- | ---- |
| 1 | `01-test` | superpowers | sonnet | `{{ capabilities.tdd.cmd }}` + `invokes_tools: [{if: test_fail == true, tool: diagnose}]` | `judgments.tdd-gate.tdd-strongly-suggested.fires` |

每阶段配置从 `workflows/task/test/workflow.yaml` 加载；engine.runRouting
通过 `@anthropic-ai/claude-agent-sdk` 0.3.142+ 将每个阶段作为 subagent 启动。

## TDD 关卡（D-04 + judgments/tdd-gate.yaml 6 fires_when + 3 skips_when）

关卡 `judgments.tdd-gate.tdd-strongly-suggested.fires` 机器化 CLAUDE.md
「Execute 阶段」TDD 强烈建议开启节的 6 项 OR-chain：
- `subtask.is_core_business_logic == true`
- `subtask.is_algorithm == true`
- `subtask.is_data_processing == true`
- `subtask.regression_risk == 'high'`
- `subtask.reliability_required == true`

跳过条件（per tdd-gate.yaml skips_when）：
- `subtask.type in ['crud', 'ui_polish', 'docs_only']`

关卡 4 级引用由 `judgmentResolver`（T2.3.W0.4 SHIPPED）在 expr-eval 求值**前**预解析——
运行时引擎在关卡未触发时跳过该阶段。

## D-13 tdd 能力别名

能力 `tdd`（per capabilities.yaml L346-359）主 impl 为 `superpowers:test-driven-
development`，别名 `[{impl: mattpocock-skills, cmd: /tdd}]` — 两者可替代 per D-13
LOCKED 决策。`{{ capabilities.tdd.cmd }}` 默认 resolve 至 superpowers
SDK，用户发出明确信号时可切换至 mattpocock /tdd 别名路径。

## 条件式 diagnose 调用（D-05 invokes_tools）

阶段 01-test 在 `test_fail == true` 时条件性触发 `diagnose`（capabilities.yaml L55-64 mattpocock-skills
/diagnosing-bugs）— 对应 sister CLAUDE.md「系统化排错」模式；
测试失败时进入 diagnose 循环（reproduce → minimise → hypothesise → instrument →
fix → regression-test），测试通过则完全跳过 diagnose。

## 如何调用

!`harnessed checkpoint intent task-test`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run task-test` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt task-test --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,然后用 harnessed 自己的完成闸门驱动交付:
   - subagent 返回后,把它的最终输出写入文件,跑 `harnessed checkpoint complete task-test --result-file <path>` —— 该命令对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
   - 若被拦下,跑 `harnessed checkpoint fail task-test --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
   - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:把 subagent 最终输出写入文件,再 Bash `harnessed checkpoint complete task-test --result-file <path> --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。`--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
5. 若 complete 闸门拦下:Bash `harnessed checkpoint fail task-test --failing-tests <n>` 记录本次尝试。命中停机条件时会打印 `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。

<!-- harnessed-generated:v4.12.0 -->

## 参考资料

- D-09 — L0 Discipline Substrate always-on
- D-04 — `gate` 4 级引用由 `judgmentResolver` 预解析
- D-05 — 阶段级 `invokes_tools` 条件工具触发
- D-13 — tdd 能力 2 impl 候选别名（superpowers 主 + mattpocock /tdd 备）
- D-02 — SKILL.md `name:` 裸斜杠命令（`task-test` 而非 `task/test`）per ADR 0030
- `workflows/judgments/tdd-gate.yaml` triggers.tdd-strongly-suggested
- `workflows/capabilities.yaml` — tdd（superpowers + mattpocock 别名）+ diagnose 条目
- `workflows/defaults.yaml` — ralph_max_iterations.task-test.* 值（T3.4.W2.2 followup）
- `docs/WORKFLOW.md` — 4-stage 工作流 mermaid + Stage ③ Execute 章节
