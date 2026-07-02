---
name: verify-design
description: |
  Stage ④.f verify sub-workflow — gstack /design-review 设计系统一致性 + AI 审美问题识别
  (has_design_changes 触发, 可选 conditional; bundled verify-stage optional /design-review step).
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-design-review + ui-ux-pro-max + design-taste-frontend) + 1 phase (gate ref has_design_changes
  conditional)。Triggered by harnessed CLI `harnessed verify-design --phase <num>` or slash
  command `/verify-design` after `harnessed setup`.
trigger_phrases:
  - "verify design"
  - "设计审查"
  - "design review"
  - "gstack design review"
  - "跑 verify-design"
---

# verify-design workflow (v3)

## Overview

1-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — 可选 /design-review" onto harnessed
runtime (Phase v3.0-3.4 W0.13c — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 +
Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-design-review` | gstack | sonnet | `{{ capabilities.gstack-design-review.cmd }}` | `judgments.stage-routing.verify-design-changes.fires` |

Per-phase config loads from `workflows/verify/design/workflow.yaml`; engine 4-level gate
resolver evaluates `phase.has_design_changes == true` via expr-eval — true 则 invoke gstack
`/design-review` (设计系统一致性 + AI 审美问题识别), false 则 skip。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gstack-design-review` — Bucket 3 治理关卡 (impl: gstack, cmd: /design-review,
  fires_when: has_design_changes)
- `ui-ux-pro-max` — Bucket 2 special-purpose (Stage 1 结构骨架, 数据驱动)
- `design-taste-frontend` — Bucket 2 special-purpose (Stage 2 视觉打磨叠加, anti-slop cross-agent)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-design-changes.fires` — `phase.stage == 'verify' and phase.has_design_changes == true`

## Routing rules (bundled web-design routing — `workflows/judgments/web-design-routing.yaml`)

- 两段式叠加 (非仲裁): Stage 1 `ui-ux-pro-max` 理清受众/交互逻辑/设计主轴 (结构骨架, 始终先跑)
- Stage 2 `design-taste-frontend` 在结构之上叠加细节 + 视觉打磨 → 高级感 (anti-slop, 默认凡 UI 改动都叠加)
- 设计完成后可选 gstack `/design-review` 一致性 + AI 审美问题识别

## How to invoke

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run verify-design` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt verify-design --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, use the native goal gate instead (Claude Code 2.1.139+ / Codex): `/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"` then spawn the subagent and let the goal evaluator drive re-spawns until it clears. If `/goal` is unavailable too, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations). Set the goal only at the leaf subtask level — `/goal` is single-slot per session and a nested goal overwrites the outer one.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete verify-design --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it before treating the sub as done.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- workflows/judgments/web-design-routing.yaml — 两段式 ui-ux-pro-max 结构 → design-taste-frontend 打磨
- workflows/capabilities.yaml — gstack-design-review / ui-ux-pro-max / design-taste-frontend
- workflows/judgments/stage-routing.yaml — verify-design-changes trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 07-design-review-conditional sister verbatim
