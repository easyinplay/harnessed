---
name: verify-validate-phase
description: |
  Stage ④ verify sub-workflow — GSD /gsd-validate-phase Nyquist 覆盖审计 (requires_coverage_audit
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

## Overview

1-phase sub-workflow auditing requirement→test coverage gaps (v13.0 P43 upstream re-sync —
D-04 Stage ④ Verify conditional sub + GSD validate-phase wire)。回溯审计 phase 完成后的
requirement→test 覆盖缺口,为未覆盖 requirement 生成测试 (gsd-nyquist-auditor agent),
补 TDD 前向写测试之外的后向查漏。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-validate-phase` | gsd | sonnet | `{{ capabilities.gsd-validate-phase.cmd }}` | `judgments.stage-routing.verify-validate-phase-coverage.fires` |

Per-phase config loads from `workflows/verify/validate-phase/workflow.yaml`; engine 4-level gate
resolver evaluates `phase.requires_coverage_audit == true` via expr-eval — true 则 invoke GSD
`/gsd-validate-phase` (Nyquist 覆盖审计 → VALIDATION.md), false 则 skip。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gsd-validate-phase` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-validate-phase, fires_when: requires_coverage_audit)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-validate-phase-coverage.fires` — `phase.stage == 'verify' and phase.requires_coverage_audit == true`

## How to invoke

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run verify-validate-phase` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt verify-validate-phase --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations).
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete verify-validate-phase --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it before treating the sub as done.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-04 Stage ④ Verify conditional sub 分解
- v13.0 P43 upstream re-sync — GSD validate-phase wire (Nyquist 覆盖后向查漏, TDD 前向之外)
- workflows/capabilities.yaml — gsd-validate-phase
- workflows/judgments/stage-routing.yaml — verify-validate-phase-coverage trigger
- workflows/verify/eval-review/workflow.yaml — sister conditional-sub pattern (v13.0 P42)
