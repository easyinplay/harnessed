---
name: verify-second-opinion
description: |
  Stage ④ verify 子工作流 — 跨模型第二意见 (cross-AI peer review),仅在本次发版触及
  编排契约面时触发。
  schema_version: harnessed.workflow.v3,含 disciplines_applied (6 默认) + tools_available
  (codex) + 1 phase (gate ref requires_second_opinion,机械派生)。
  斜杠命令
  `/verify-second-opinion`(`harnessed setup` 之后可用)。
trigger_phrases:
  - "verify second opinion"
  - "cross model review"
  - "第二意见"
  - "跨模型审查"
  - "跑 verify-second-opinion"
---

# verify-second-opinion workflow (v3)

## 概览

单 phase 子工作流 — 编排契约改动时的跨模型第二意见 (Phase 54 T2)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-second-opinion` | gstack | sonnet | `{{ capabilities.codex.cmd }}` | `judgments.stage-routing.verify-second-opinion-orchestration.fires` |

判据不是交给模型的判断题。`harnessed facts` 把 `git diff --name-only <last release tag>`
与 ORCHESTRATION SURFACE (judgments / capabilities / 事实 schema / resolver / exprBuilder /
ledger / disciplines / 任一 workflows SKILL.md) 求交集,机械得出 `requires_second_opinion`。

基准是**上一个 release tag**,不是 `merge-base origin/main` —— 后者在 commit-即-push-main
的纪律下塌缩成 HEAD,只看得见未提交改动,会漏掉多-commit milestone 的早期 commit。

算不出来 (无 tag / 无 git / diff 失败) 时取 `false`,并在每轮 `<workflow-state>` 断点打出
`SECOND-OPINION: 判据不可用(<原因>)`。不乱 fire,且不静默。

## Capability refs

Sister `workflows/capabilities.yaml` 条目:
- `codex` — 第二意见 / cross-AI peer review via codex (impl: gstack, cmd: /codex)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-second-opinion-orchestration.fires` — `phase.stage == 'verify' and requires_second_opinion == true`

## 路由规则

- ✅ **触发**: 本次改动触及编排契约本身 (judgments / capabilities.yaml / phaseFactContext /
  facts.ts / judgmentResolver / exprBuilder / ledger.ts / disciplines / 任一 SKILL.md)
- ❌ **跳过**: 纯 installer / 文档 / 测试 / 依赖 bump —— 改这些不会改变引擎的决策方式

**交付物即证据。** 本 sub fire 了就必须交 `second-opinion.md`;不交则 `checkpoint complete`
fail-closed 阻断,`--force` 在 ledger 记 `evidence_status: overridden`。跳过因此是台账上
一行,不是隐形的。

## 如何调用

!`harnessed checkpoint intent verify-second-opinion`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-second-opinion` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt verify-second-opinion --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,然后用 harnessed 自己的完成闸门驱动交付:
   - subagent 返回后,把它的最终输出写入文件,跑 `harnessed checkpoint complete verify-second-opinion --result-file <path>` —— 该命令对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
   - 若被拦下,跑 `harnessed checkpoint fail verify-second-opinion --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
   - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:把 subagent 最终输出写入文件,再 Bash `harnessed checkpoint complete verify-second-opinion --result-file <path> --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。`--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
5. 若 complete 闸门拦下:Bash `harnessed checkpoint fail verify-second-opinion --failing-tests <n>` 记录本次尝试。命中停机条件时会打印 `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。

<!-- harnessed-generated:v4.12.0 -->

## 参考资料

- Phase 54 SPEC — .planning/phases/54-declaration-evaluation-parity/SPEC.md
- workflows/capabilities.yaml — codex
- workflows/judgments/stage-routing.yaml — verify-second-opinion-orchestration trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-second-opinion.*
- src/cli/facts.ts — deriveSecondOpinion / ORCHESTRATION_SURFACE
