---
name: verify-qa
description: |
  Stage ④.d verify sub-workflow — gstack /qa 端到端 QA 验收 (has_ui_changes 触发, 可选 conditional;
  bundled verify-stage optional /qa step).
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-qa + playwright-cli + playwright-test + webapp-testing) + 1 phase (gate ref
  has_ui_changes conditional)。
  Triggered by slash command
  `/verify-qa` after `harnessed setup`.
trigger_phrases:
  - "verify qa"
  - "端到端 QA"
  - "E2E 验收"
  - "gstack qa"
  - "跑 verify-qa"
---

# verify-qa workflow (v3)

## Overview

1-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — 可选 /qa" onto harnessed runtime
(Phase v3.0-3.4 W0.13a — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 + Pattern A
sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-qa` | gstack | sonnet | `{{ capabilities.gstack-qa.cmd }}` | `judgments.stage-routing.verify-qa-ui.fires` |

Per-phase config loads from `workflows/verify/qa/workflow.yaml`; engine 4-level gate resolver
evaluates `phase.has_ui_changes == true` via expr-eval — true 则 invoke gstack `/qa` (端到端
QA 验收 + UI dogfood), false 则 skip。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gstack-qa` — Bucket 3 治理关卡 (impl: gstack, cmd: /qa, fires_when: has_ui_changes)
- `playwright-cli` — Bucket 2 special-purpose (impl: npm-cli, browser_probe)
- `playwright-test` — Bucket 2 special-purpose (impl: npm-cli, e2e_test typescript)
- `webapp-testing` — Bucket 2 special-purpose (impl: gstack, e2e_test python)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-qa-ui.fires` — `phase.stage == 'verify' and phase.has_ui_changes == true`

## Routing rules (bundled web-testing routing — `workflows/judgments/web-testing-routing.yaml`)

- 写测试 提交 repo / CI 跑 → `@playwright/test` (默认 frontend/e2e/*.spec.ts)
- 探查 / 调试 / 一次性确认 → `playwright-cli` (token 最省)
- setup 需 Python 后端 (Tortoise ORM / pandas) → `webapp-testing` skill
- 性能 / a11y / 内存诊断 → 不在此 sub-workflow,用 `chrome-devtools-mcp`

## How to invoke

!`harnessed checkpoint intent verify-qa`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run verify-qa` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt verify-qa --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, use the native goal gate instead (Claude Code 2.1.139+ / Codex): `/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"` then spawn the subagent and let the goal evaluator drive re-spawns until it clears. If `/goal` is unavailable too, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations). Set the goal only at the leaf subtask level — `/goal` is single-slot per session and a nested goal overwrites the outer one.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete verify-qa --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it before treating the sub as done.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- workflows/judgments/web-testing-routing.yaml — 三层职责矩阵 (脑 / 手 / 筋骨)
- workflows/capabilities.yaml — gstack-qa / playwright-cli / playwright-test / webapp-testing
- workflows/judgments/stage-routing.yaml — verify-qa-ui trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 05-qa-conditional sister verbatim
