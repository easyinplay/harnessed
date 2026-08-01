---
name: verify-paranoid
description: |
  Stage ④.c verify sub-workflow — gstack /review Paranoid Staff Engineer 关键模块 PR 前强制
  (bundled gstack governance gate — mandatory before critical-module PR)。Gate:
  judgments.stage-routing.verify-paranoid-critical.fires (phase.is_critical_module == true) —
  默认 critical fire only; 非关键模块 skip。
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

# verify-paranoid workflow (v3)

## Overview

1-phase sub-workflow mapping CLAUDE.md "gstack 治理关卡 🔒 关键模块 PR 前强制 — `/review`"
onto harnessed runtime (Phase v3.0-3.4 W0.12 — D-04 Stage ④ Verify 7 sub + D-12 gstack
治理关卡 + Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-review` | gstack | opus | `{{ capabilities.gstack-review.cmd }}` | `judgments.stage-routing.verify-paranoid-critical.fires` |

Per-phase config loads from `workflows/verify/paranoid/workflow.yaml`; engine 4-level gate
resolver evaluates `phase.is_critical_module == true` via expr-eval — true 则 invoke gstack
`/review`, false 则 skip (chain_isolation 3 铁律 R20.16 sister verify-work v2 phase 04)。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gstack-review` — Bucket 3 治理关卡 (impl: gstack, cmd: /review,
  fires_when: phase.is_critical_module == true)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-paranoid-critical.fires` — `phase.stage == 'verify' and phase.is_critical_module == true`
  (默认 critical fire only; 普通 PR 应跳过 — gstack-review 是 Paranoid Staff Engineer 重武器)

## Routing rules (sister CLAUDE.md "gstack 治理关卡")

- ✅ **触发**: 关键模块 PR 前 (auth / payment / data migration / core algorithm 等)
- ❌ **跳过**: 常规 PR / docs / config / 非核心 module

## How to invoke

!`harnessed checkpoint intent verify-paranoid`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run verify-paranoid` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt verify-paranoid --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` and `model`, then drive delivery with harnessed's own completion gate:
   - on return, write the subagent's final output to a file and run `harnessed checkpoint complete verify-paranoid --result-file <path>` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
   - if it blocks, run `harnessed checkpoint fail verify-paranoid --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
   - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete verify-paranoid --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. `--force` records an audited override (`evidence_status=overridden`) — it does not silently pass.
5. If the complete gate blocked: Bash `harnessed checkpoint fail verify-paranoid --failing-tests <n>` to record the attempt. It prints `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.

<!-- harnessed-generated:v4.12.0 -->

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡强制
- workflows/capabilities.yaml — gstack-review
- workflows/judgments/stage-routing.yaml — verify-paranoid-critical trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-paranoid.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 04-gstack-review-conditional sister verbatim
