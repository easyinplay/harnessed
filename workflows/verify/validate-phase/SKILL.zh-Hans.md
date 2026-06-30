---
name: verify-validate-phase
description: |
  Stage ④ 验证子工作流 — GSD /gsd-validate-phase Nyquist 覆盖审计 (requires_coverage_audit
  触发, 可选 conditional; 补 TDD 前向写测试之外的后向 requirement→test 覆盖查漏).
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gsd-validate-phase) + 1 phase (gate ref requires_coverage_audit conditional)。
  Triggered by slash command
  `/verify-validate-phase` after `harnessed setup`.
trigger_phrases:
  - "verify validate phase"
  - "Nyquist 覆盖审计"
  - "覆盖查漏"
  - "gsd validate phase"
  - "跑 verify-validate-phase"
---

# verify-validate-phase workflow (v3)

## 概览

1-phase 子工作流，审计 requirement→test 覆盖缺口 (v13.0 P43 上游 re-sync — D-04 Stage ④
Verify conditional sub + GSD validate-phase wire)。回溯审计 phase 完成后的 requirement→test
覆盖缺口，为未覆盖 requirement 生成测试 (gsd-nyquist-auditor agent)，补 TDD 前向写测试之外的
后向查漏。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-validate-phase` | gsd | sonnet | `{{ capabilities.gsd-validate-phase.cmd }}` | `judgments.stage-routing.verify-validate-phase-coverage.fires` |

Per-phase 配置从 `workflows/verify/validate-phase/workflow.yaml` 加载；引擎 4-level gate resolver
通过 expr-eval 计算 `phase.requires_coverage_audit == true` — true 则调用 GSD
`/gsd-validate-phase` (Nyquist 覆盖审计 → VALIDATION.md)，false 则跳过。

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `gsd-validate-phase` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-validate-phase, fires_when: requires_coverage_audit)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`：
- `verify-validate-phase-coverage.fires` — `phase.stage == 'verify' and phase.requires_coverage_audit == true`

## 如何调用

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-validate-phase` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt verify-validate-phase --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,自循环:spawn → 检查 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete verify-validate-phase --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。

<!-- harnessed-generated:v4.9.3 -->

## 参考资料

- D-04 Stage ④ Verify conditional sub 分解
- v13.0 P43 上游 re-sync — GSD validate-phase wire (Nyquist 覆盖后向查漏, TDD 前向之外)
- workflows/capabilities.yaml — gsd-validate-phase
- workflows/judgments/stage-routing.yaml — verify-validate-phase-coverage trigger
- workflows/verify/eval-review/workflow.yaml — sister conditional-sub pattern (v13.0 P42)
