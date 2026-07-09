---
name: verify-simplify
description: |
  Stage ④.g 验证子工作流 — code-simplifier 末尾串行 (移除重复 / 多余逻辑;
  捆绑 verify 阶段节奏 — tail-step code-simplifier).
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (code-simplifier) + 1 phase (gate ref is_final_step 末尾串行)。
  Triggered by slash command
  `/verify-simplify` after `harnessed setup`.
trigger_phrases:
  - "verify simplify"
  - "code simplify"
  - "代码简化"
  - "移除重复逻辑"
  - "跑 verify-simplify"
---

# verify-simplify workflow (v3)

## 概览

1-phase 子工作流，将 CLAUDE.md "Verify 阶段 — 末尾 code-simplifier" 映射到 harnessed
运行时 (Phase v3.0-3.4 W0.13d — D-04 Stage ④ Verify 7 sub + Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-simplify` | mattpocock-skills | sonnet | `{{ capabilities.code-simplifier.cmd }}` | `judgments.stage-routing.verify-simplify-tail.fires` |

Per-phase 配置从 `workflows/verify/simplify/workflow.yaml` 加载；引擎 4-level gate
resolver 通过 expr-eval 计算 `phase.is_final_step == true` — true 则调用
`/code-simplifier` (移除重复 / 多余逻辑)，false 则跳过。verify 链末尾步骤，
sister verify-work v2 phase 08-code-simplifier verbatim 位置。

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `code-simplifier` — Bucket 1 mattpocock 高频招式 (impl: mattpocock-skills,
  cmd: /code-simplifier, fires_when: stage=='verify' AND is_final_step)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`：
- `verify-simplify-tail.fires` — `phase.stage == 'verify' and phase.is_final_step == true`

## 路由规则

- ✅ **触发**: verify chain 末尾步骤 (所有其他 verify sub 已 ship，准备 code 简化收尾)
- ❌ **跳过**: verify chain 中间步骤 (避免过早简化干扰后续 review)

## 如何调用

!`harnessed checkpoint intent verify-simplify`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-simplify` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt verify-simplify --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,改用原生 goal gate(Claude Code 2.1.139+ / Codex):`/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"`,随后 spawn subagent,由 goal 评估器驱动重 spawn 直到目标清除。若 `/goal` 也不可用,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。goal 只在叶子 subtask 层设置 — `/goal` 每 session 单槽,嵌套 goal 会覆盖外层。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete verify-simplify --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。

<!-- harnessed-generated:v4.9.3 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- workflows/capabilities.yaml — code-simplifier
- workflows/judgments/stage-routing.yaml — verify-simplify-tail trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-simplify.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 08-code-simplifier sister verbatim
