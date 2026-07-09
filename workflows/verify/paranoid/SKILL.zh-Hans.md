---
name: verify-paranoid
description: |
  Stage ④.c verify 子工作流 — gstack /review Paranoid Staff Engineer 关键模块 PR 前强制
  (bundled gstack governance gate — mandatory before critical-module PR)。Gate:
  judgments.stage-routing.verify-paranoid-critical.fires (phase.is_critical_module == true) —
  默认 critical fire only；非关键模块 skip。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-review) + 1 phase (gate ref is_critical_module conditional)。
  Triggered by slash command
  `/verify-paranoid` after `harnessed setup`.
trigger_phrases:
  - "verify paranoid"
  - "paranoid staff engineer review"
  - "关键模块审查"
  - "gstack review"
  - "跑 verify-paranoid"
---

# verify-paranoid 工作流 (v3)

## 概览

1-phase 子工作流，将 CLAUDE.md「gstack 治理关卡 🔒 关键模块 PR 前强制 — `/review`」
映射到 harnessed 运行时（Phase v3.0-3.4 W0.12 — D-04 Stage ④ Verify 7 sub + D-12 gstack
治理关卡 + Pattern A sub-workflow ship）。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-review` | gstack | opus | `{{ capabilities.gstack-review.cmd }}` | `judgments.stage-routing.verify-paranoid-critical.fires` |

Per-phase 配置从 `workflows/verify/paranoid/workflow.yaml` 加载；引擎 4-level gate
resolver 通过 expr-eval 计算 `phase.is_critical_module == true` — 为 true 则调用 gstack
`/review`，为 false 则跳过（chain_isolation 3 铁律 R20.16 sister verify-work v2 phase 04）。

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `gstack-review` — Bucket 3 治理关卡 (impl: gstack, cmd: /review,
  fires_when: phase.is_critical_module == true)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`：
- `verify-paranoid-critical.fires` — `phase.stage == 'verify' and phase.is_critical_module == true`
  （默认 critical fire only；普通 PR 应跳过 — gstack-review 是 Paranoid Staff Engineer 重武器）

## 路由规则（sister CLAUDE.md「gstack 治理关卡」）

- ✅ **触发**：关键模块 PR 前（auth / payment / data migration / core algorithm 等）
- ❌ **跳过**：常规 PR / docs / config / 非核心 module

## 如何调用

!`harnessed checkpoint intent verify-paranoid`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-paranoid` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt verify-paranoid --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,改用原生 goal gate(Claude Code 2.1.139+ / Codex):`/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"`,随后 spawn subagent,由 goal 评估器驱动重 spawn 直到目标清除。若 `/goal` 也不可用,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。goal 只在叶子 subtask 层设置 — `/goal` 每 session 单槽,嵌套 goal 会覆盖外层。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete verify-paranoid --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。

<!-- harnessed-generated:v4.9.3 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡强制
- workflows/capabilities.yaml — gstack-review
- workflows/judgments/stage-routing.yaml — verify-paranoid-critical trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-paranoid.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 04-gstack-review-conditional sister verbatim
