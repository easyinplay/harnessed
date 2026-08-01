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

3-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — 可选 /design-review" onto harnessed
runtime (Phase v3.0-3.4 W0.13c — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 +
Pattern A sub-workflow ship; T2.3 两段式 remediation lane 接线)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-design-review` | gstack | sonnet | `{{ capabilities.gstack-design-review.cmd }}` | `judgments.web-design-routing.design-review-post.fires` |
| 2 | `02-ui-ux-structure` | ui-ux-pro-max | sonnet | `{{ capabilities.ui-ux-pro-max.cmd }}` | `judgments.web-design-routing.ui-ux-pro-max-structure.fires` |
| 3 | `03-design-taste-polish` | design-taste-frontend | sonnet | `{{ capabilities.design-taste-frontend.cmd }}` | `judgments.web-design-routing.design-taste-polish.fires` |

Per-phase config loads from `workflows/verify/design/workflow.yaml`; engine 4-level gate
resolver evaluates `phase.has_design_changes == true` via expr-eval — true 则 invoke gstack
`/design-review` (设计系统一致性 + AI 审美问题识别), false 则 skip。Phase 02 / 03 是
review 出问题清单后的两段式 remediation lane (结构问题 → Stage 1; 视觉打磨 / AI 味 → Stage 2),
各由 `phase.has_ui_changes == true` 独立 gate。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gstack-design-review` — Bucket 3 治理关卡 (impl: gstack, cmd: /design-review,
  fires_when: has_design_changes)
- `ui-ux-pro-max` — Bucket 2 special-purpose (Stage 1 结构骨架, 数据驱动)
- `design-taste-frontend` — Bucket 2 special-purpose (Stage 2 视觉打磨叠加, anti-slop cross-agent)

## Gate ref

Sister `workflows/judgments/web-design-routing.yaml`:
- `design-review-post.fires` — `phase.stage == 'verify' and phase.has_design_changes == true`
- `ui-ux-pro-max-structure.fires` — `phase.has_ui_changes == true`
- `design-taste-polish.fires` — `phase.has_ui_changes == true`

`workflows/verify/auto/workflow.yaml` 的 `delegates_to` 也 gate 在
`design-review-post.fires` 上 — 之前那条逐字等价的 `stage-routing.verify-design-changes`
副本已删,一个判据一个家。

## Routing rules (bundled web-design routing — `workflows/judgments/web-design-routing.yaml`)

- 两段式叠加 (非仲裁): Stage 1 `ui-ux-pro-max` 理清受众/交互逻辑/设计主轴 (结构骨架, 始终先跑)
- Stage 2 `design-taste-frontend` 在结构之上叠加细节 + 视觉打磨 → 高级感 (anti-slop, 默认凡 UI 改动都叠加)
- 设计完成后可选 gstack `/design-review` 一致性 + AI 审美问题识别

## How to invoke

!`harnessed checkpoint intent verify-design`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run verify-design` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt verify-design --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` and `model`, then drive delivery with harnessed's own completion gate:
   - on return, write the subagent's final output to a file and run `harnessed checkpoint complete verify-design --result-file <path>` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
   - if it blocks, run `harnessed checkpoint fail verify-design --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
   - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete verify-design --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. `--force` records an audited override (`evidence_status=overridden`) — it does not silently pass.
5. If the complete gate blocked: Bash `harnessed checkpoint fail verify-design --failing-tests <n>` to record the attempt. It prints `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.

<!-- harnessed-generated:v4.12.0 -->

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- workflows/judgments/web-design-routing.yaml — 两段式 ui-ux-pro-max 结构 → design-taste-frontend 打磨
- workflows/capabilities.yaml — gstack-design-review / ui-ux-pro-max / design-taste-frontend
- workflows/verify/auto/workflow.yaml — `design` delegate gate = 同一个 design-review-post trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 07-design-review-conditional sister verbatim
