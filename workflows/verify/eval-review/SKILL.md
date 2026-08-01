---
name: verify-eval-review
description: |
  Stage ④ verify sub-workflow — GSD /gsd-eval-review AI phase eval 覆盖审计 (has_ai_phase 触发,
  可选 conditional; pairs with plan 侧 gsd-ai-integration-phase AI-SPEC eval strategy).
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

## Overview

1-phase sub-workflow auditing AI phase eval coverage (v13.0 P42 upstream re-sync — D-04
Stage ④ Verify conditional sub + GSD eval-review wire)。Pairs with the plan-side
`gsd-ai-integration-phase` (AI-SPEC.md eval strategy): verify 侧回查实现是否真覆盖规划的
eval 维度,产出 EVAL-REVIEW.md (逐维度 COVERED/PARTIAL/MISSING)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-eval-review` | gsd | sonnet | `{{ capabilities.gsd-eval-review.cmd }}` | `judgments.stage-routing.verify-eval-review-aiphase.fires` |

Per-phase config loads from `workflows/verify/eval-review/workflow.yaml`; engine 4-level gate
resolver evaluates `phase.has_ai_phase == true` via expr-eval — true 则 invoke GSD
`/gsd-eval-review` (eval 覆盖审计 → EVAL-REVIEW.md), false 则 skip。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gsd-eval-review` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-eval-review, fires_when: has_ai_phase)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-eval-review-aiphase.fires` — `phase.stage == 'verify' and phase.has_ai_phase == true`

## How to invoke

!`harnessed checkpoint intent verify-eval-review`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run verify-eval-review` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt verify-eval-review --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` and `model`, then drive delivery with harnessed's own completion gate:
   - on return, write the subagent's final output to a file and run `harnessed checkpoint complete verify-eval-review --result-file <path>` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
   - if it blocks, run `harnessed checkpoint fail verify-eval-review --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
   - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete verify-eval-review --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. `--force` records an audited override (`evidence_status=overridden`) — it does not silently pass.
5. If the complete gate blocked: Bash `harnessed checkpoint fail verify-eval-review --failing-tests <n>` to record the attempt. It prints `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.

<!-- harnessed-generated:v4.12.0 -->

## References

- D-04 Stage ④ Verify conditional sub 分解
- v13.0 P42 upstream re-sync — GSD eval-review wire (pairs with plan 侧 gsd-ai-integration-phase)
- workflows/capabilities.yaml — gsd-eval-review
- workflows/judgments/stage-routing.yaml — verify-eval-review-aiphase trigger
- workflows/verify/qa/workflow.yaml — sister conditional-sub pattern (has_ui_changes gate)
