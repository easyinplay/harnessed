---
name: retro
description: |
  独立的 post-④ Verify 回顾工作流 — gstack /retro 经验教训 / 决策 / lessons
  系统总结 (项目 / 里程碑结束可选, bundled milestone-close retrospective cadence)
  + planning-with-files RETROSPECTIVE.md 持久化 (sister Phase
  v2.0-2.5 RETROSPECTIVE pattern)。Capability ref retro-gstack alias suffix per Pattern A
  E.2 LOCK (NOT bare retro 避免 standalone workflow / capability namespace 冲突)。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (retro-gstack + planning-with-files) + 2 phase (01-retro gstack invoke + 02-persist
  RETROSPECTIVE.md sink)。Triggered by harnessed CLI `harnessed retro --milestone <name>` or
  slash command `/retro` after `harnessed setup`.
trigger_phrases:
  - "项目总结"
  - "里程碑结束"
  - "经验教训"
  - "retro"
---

# retro 工作流 (v3 新增 standalone)

## 概述

2 阶段 standalone 工作流，将 CLAUDE.md 中"项目 / 里程碑结束: 可选跑 /retro 总结"映射到
harnessed 运行时（Phase v3.0-3.4 W1.2 — D-04 新增 v3 standalone 工作流 + Pattern A E.2
retro-gstack alias suffix LOCK）。

| phase | id | upstream | model | capability / invokes | artifacts |
| ----- | -- | -------- | ----- | -------------------- | --------- |
| 1 | `01-retro` | gstack | opus | `{{ capabilities.retro-gstack.cmd }}` | gstack /retro 经验教训系统总结 |
| 2 | `02-persist` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` + `invokes: /plan` | `artifacts_expected: [RETROSPECTIVE.md]` |

每阶段配置从 `workflows/retro/workflow.yaml` 加载；引擎 spawn 阶段 01 gstack
`/retro`（alias 解析到 capabilities.yaml 中的 retro-gstack 载体），阶段 02
planning-with-files `/plan` invoke 持久化 RETROSPECTIVE.md sink。

## Capability refs (Pattern A E.2 LOCK)

Sister `workflows/capabilities.yaml` 条目：
- `retro-gstack` — Bucket 7 gstack optional **alias suffix** per Pattern A E.2 LOCK
  (impl: gstack, cmd: /retro, aliases to harnessed-bundled /retro, fires_when: is_milestone_close)
  — 解决 namespace 冲突 (NOT bare `retro` capability 因 standalone workflow 已占 retro 名)
- `planning-with-files` — Bucket 4 核心能力 (impl: claude-code-plugin, cmd: /plan)

## 路由规则（sister CLAUDE.md"项目 / 里程碑结束"）

- ✅ **触发**: 项目结束 / 里程碑结束 / 用户明示"复盘 / retro / lessons learned"
- ❌ **跳过**: 日常 PR / 单阶段完成（常规 verify-progress 已够用）

## 如何调用

!`harnessed checkpoint intent retro`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run retro` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt retro --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,改用原生 goal gate(Claude Code 2.1.139+ / Codex):`/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"`,随后 spawn subagent,由 goal 评估器驱动重 spawn 直到目标清除。若 `/goal` 也不可用,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。goal 只在叶子 subtask 层设置 — `/goal` 每 session 单槽,嵌套 goal 会覆盖外层。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete retro --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。

<!-- harnessed-generated:v4.9.3 -->

## 参考文档

- D-04 新增 v3 standalone 工作流 (research v3 bump + retro 新增)
- Pattern A E.2 LOCK — 2 个 alias suffix `-gstack` 解决 namespace 冲突 (retro-gstack + investigate-gstack)
- Pattern A reconcile D.2 — gstack 30 optional naming bare 例外
- workflows/capabilities.yaml — retro-gstack (alias suffix) + planning-with-files
- workflows/defaults.yaml — ralph_max_iterations.retro.* values (W2.2 backfill)
- sister Phase v2.0-2.5 RETROSPECTIVE.md sink pattern
