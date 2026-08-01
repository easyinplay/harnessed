---
name: verify-simplify
description: |
  Stage ④.g verify sub-workflow — code-simplifier 末尾串行 (移除重复 / 多余逻辑;
  bundled verify-stage cadence — tail-step code-simplifier).
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

## Overview

1-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — 末尾 code-simplifier" onto harnessed
runtime (Phase v3.0-3.4 W0.13d — D-04 Stage ④ Verify 7 sub + Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-simplify` | mattpocock-skills | sonnet | `{{ capabilities.code-simplifier.cmd }}` | `judgments.stage-routing.verify-simplify-tail.fires` |

Per-phase config loads from `workflows/verify/simplify/workflow.yaml`; engine 4-level gate
resolver evaluates `phase.is_final_step == true` via expr-eval — true 则 invoke
`/code-simplifier` (移除重复 / 多余逻辑), false 则 skip。verify 链末尾步骤,
sister verify-work v2 phase 08-code-simplifier verbatim 位置。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `code-simplifier` — Bucket 1 mattpocock 高频招式 (impl: mattpocock-skills,
  cmd: /code-simplifier, fires_when: stage=='verify' AND is_final_step)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-simplify-tail.fires` — `phase.stage == 'verify' and phase.is_final_step == true`

## Routing rules

- ✅ **触发**: verify chain 末尾步骤 (所有其他 verify sub 已 ship, 准备 code 简化收尾)
- ❌ **跳过**: verify chain 中间步骤 (避免过早简化干扰后续 review)

## How to invoke

!`harnessed checkpoint intent verify-simplify`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run verify-simplify` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt verify-simplify --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` and `model`, then drive delivery with harnessed's own completion gate:
   - on return, write the subagent's final output to a file and run `harnessed checkpoint complete verify-simplify --result-file <path>` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
   - if it blocks, run `harnessed checkpoint fail verify-simplify --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
   - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete verify-simplify --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. `--force` records an audited override (`evidence_status=overridden`) — it does not silently pass.
5. If the complete gate blocked: Bash `harnessed checkpoint fail verify-simplify --failing-tests <n>` to record the attempt. It prints `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.

<!-- harnessed-generated:v4.12.0 -->

## References

- D-04 Stage ④ Verify 7 sub 分解
- workflows/capabilities.yaml — code-simplifier
- workflows/judgments/stage-routing.yaml — verify-simplify-tail trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-simplify.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 08-code-simplifier sister verbatim
