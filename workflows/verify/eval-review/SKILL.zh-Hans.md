---
name: verify-eval-review
description: |
  Stage ④ 验证子工作流 — GSD /gsd-eval-review AI phase eval 覆盖审计 (has_ai_phase 触发,
  可选 conditional; 与 plan 侧 gsd-ai-integration-phase AI-SPEC eval strategy 配对).
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gsd-eval-review) + 1 phase (gate ref has_ai_phase conditional)。
  Triggered by slash command
  `/verify-eval-review` after `harnessed setup`.
trigger_phrases:
  - "verify eval review"
  - "eval 覆盖审计"
  - "AI eval 审查"
  - "gsd eval review"
  - "跑 verify-eval-review"
---

# verify-eval-review workflow (v3)

## 概览

1-phase 子工作流，审计 AI phase eval 覆盖 (v13.0 P42 上游 re-sync — D-04 Stage ④ Verify
conditional sub + GSD eval-review wire)。与 plan 侧 `gsd-ai-integration-phase` (AI-SPEC.md
eval strategy) 配对：verify 侧回查实现是否真覆盖规划的 eval 维度，产出 EVAL-REVIEW.md
(逐维度 COVERED/PARTIAL/MISSING)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-eval-review` | gsd | sonnet | `{{ capabilities.gsd-eval-review.cmd }}` | `judgments.stage-routing.verify-eval-review-aiphase.fires` |

Per-phase 配置从 `workflows/verify/eval-review/workflow.yaml` 加载；引擎 4-level gate resolver
通过 expr-eval 计算 `phase.has_ai_phase == true` — true 则调用 GSD `/gsd-eval-review`
(eval 覆盖审计 → EVAL-REVIEW.md)，false 则跳过。

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `gsd-eval-review` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-eval-review, fires_when: has_ai_phase)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`：
- `verify-eval-review-aiphase.fires` — `phase.stage == 'verify' and phase.has_ai_phase == true`

## 如何调用

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-eval-review` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt verify-eval-review --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,改用原生 goal gate(Claude Code 2.1.139+ / Codex):`/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"`,随后 spawn subagent,由 goal 评估器驱动重 spawn 直到目标清除。若 `/goal` 也不可用,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。goal 只在叶子 subtask 层设置 — `/goal` 每 session 单槽,嵌套 goal 会覆盖外层。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete verify-eval-review --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。

<!-- harnessed-generated:v4.9.3 -->

## 参考资料

- D-04 Stage ④ Verify conditional sub 分解
- v13.0 P42 上游 re-sync — GSD eval-review wire (与 plan 侧 gsd-ai-integration-phase 配对)
- workflows/capabilities.yaml — gsd-eval-review
- workflows/judgments/stage-routing.yaml — verify-eval-review-aiphase trigger
- workflows/verify/qa/workflow.yaml — sister conditional-sub pattern (has_ui_changes gate)
