---
name: verify-second-opinion
description: |
  Stage ④ verify sub-workflow — 跨模型第二意见 (cross-AI peer review), fired only when this
  release-in-progress touched the ORCHESTRATION SURFACE.
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (codex) + 1 phase (gate ref requires_second_opinion, mechanically derived).
  Triggered by slash command
  `/verify-second-opinion` after `harnessed setup`.
trigger_phrases:
  - "verify second opinion"
  - "cross model review"
  - "第二意见"
  - "跨模型审查"
  - "跑 verify-second-opinion"
---

# verify-second-opinion workflow (v3)

## Overview

1-phase sub-workflow — 编排契约改动时的跨模型第二意见 (Phase 54 T2)。

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

Sister `workflows/capabilities.yaml` entries:
- `codex` — 第二意见 / cross-AI peer review via codex (impl: gstack, cmd: /codex)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-second-opinion-orchestration.fires` — `phase.stage == 'verify' and requires_second_opinion == true`

## Routing rules

- ✅ **触发**: 本次改动触及编排契约本身 (judgments / capabilities.yaml / phaseFactContext /
  facts.ts / judgmentResolver / exprBuilder / ledger.ts / disciplines / 任一 SKILL.md)
- ❌ **跳过**: 纯 installer / 文档 / 测试 / 依赖 bump —— 改这些不会改变引擎的决策方式

**交付物即证据。** 本 sub fire 了就必须交 `second-opinion.md`;不交则 `checkpoint complete`
fail-closed 阻断,`--force` 在 ledger 记 `evidence_status: overridden`。跳过因此是台账上
一行,不是隐形的。

## How to invoke

!`harnessed checkpoint intent verify-second-opinion`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run verify-second-opinion` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt verify-second-opinion --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` and `model`, then drive delivery with harnessed's own completion gate:
   - on return, write the subagent's final output to a file and run `harnessed checkpoint complete verify-second-opinion --result-file <path>` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
   - if it blocks, run `harnessed checkpoint fail verify-second-opinion --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
   - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete verify-second-opinion --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. `--force` records an audited override (`evidence_status=overridden`) — it does not silently pass.
5. If the complete gate blocked: Bash `harnessed checkpoint fail verify-second-opinion --failing-tests <n>` to record the attempt. It prints `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.

<!-- harnessed-generated:v4.12.0 -->

## References

- Phase 54 SPEC — .planning/phases/54-declaration-evaluation-parity/SPEC.md
- workflows/capabilities.yaml — codex
- workflows/judgments/stage-routing.yaml — verify-second-opinion-orchestration trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-second-opinion.*
- src/cli/facts.ts — deriveSecondOpinion / ORCHESTRATION_SURFACE
