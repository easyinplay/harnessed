---
name: verify-progress
description: |
  Stage ④.a verify sub-workflow — gsd-verify-work + gsd-progress 必跑串行 (verify-work 起点)
  + planning-with-files progress.md 持久化 (bundled verify-stage cadence — mandatory serial:
  gsd-verify-work UAT-driven acceptance + gsd-progress 状态同步 顺序不可调换)。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gsd-verify-work + gsd-progress + planning-with-files) + 3 phases (serial 01→02 + persist
  progress.md sink)。Triggered by harnessed CLI `harnessed verify-progress --phase <num>` or
  slash command `/verify-progress` after `harnessed setup`.
trigger_phrases:
  - "verify progress"
  - "进度同步"
  - "gsd verify work"
  - "ROADMAP 状态同步"
  - "跑 verify-progress"
---

# verify-progress workflow (v3)

## Overview

3-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — 必跑串行" 起点 onto harnessed runtime
(Phase v3.0-3.4 W0.10 — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 ref + Pattern A
sub-workflow ship)。

| phase | id | upstream | model | capability / invokes | mode / artifacts |
| ----- | -- | -------- | ----- | -------------------- | ---------------- |
| 1 | `01-gsd-verify-work` | gsd | sonnet | `{{ capabilities.gsd-verify-work.cmd }}` | serial — UAT-driven acceptance |
| 2 | `02-gsd-progress` | gsd | haiku | `{{ capabilities.gsd-progress.cmd }}` | serial — ROADMAP/STATE/REQUIREMENTS 同步 |
| 3 | `03-progress-update` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` + `invokes: /plan` | `artifacts_expected: [progress.md]` |

Per-phase config loads from `workflows/verify/progress/workflow.yaml`; engine spawns each
phase as a sub-agent via `@anthropic-ai/claude-agent-sdk` 0.3.142+ in serial mode (顺序锁定 —
gsd-verify-work UAT 必先于 gsd-progress 状态同步)。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gsd-verify-work` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-verify-work)
- `gsd-progress` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-progress)
- `planning-with-files` — Bucket 4 核心 capability (impl: claude-code-plugin, cmd: /plan)

## Routing rules (sister CLAUDE.md "Verify 阶段")

总 fire 当 `phase.stage == 'verify'` (sister `workflows/judgments/stage-routing.yaml`
verify-progress-always trigger)。无 skip 条件 — verify-work 起点必跑。

## How to invoke

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run verify-progress` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt verify-progress --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, use the native goal gate instead (Claude Code 2.1.139+ / Codex): `/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"` then spawn the subagent and let the goal evaluator drive re-spawns until it clears. If `/goal` is unavailable too, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations). Set the goal only at the leaf subtask level — `/goal` is single-slot per session and a nested goal overwrites the outer one.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete verify-progress --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it before treating the sub as done.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡 ref (verify-paranoid 后续 sub)
- workflows/capabilities.yaml — gsd-verify-work / gsd-progress / planning-with-files
- workflows/judgments/stage-routing.yaml — verify-progress-always trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-progress.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 01-02 sister verbatim pattern
