---
name: verify-security
description: |
  Stage ④.e verify sub-workflow — gstack /cso 安全审查 OWASP/auth/secrets (has_auth_or_secrets
  触发, 可选 conditional; bundled verify-stage optional /cso step).
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-cso) + 1 phase (gate ref has_auth_or_secrets conditional)。
  Triggered by slash command
  `/verify-security` after `harnessed setup`.
trigger_phrases:
  - "verify security"
  - "安全审查"
  - "OWASP audit"
  - "gstack cso"
  - "跑 verify-security"
---

# verify-security workflow (v3)

## Overview

1-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — 可选 /cso" onto harnessed runtime
(Phase v3.0-3.4 W0.13b — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 + Pattern A
sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-cso` | gstack | opus | `{{ capabilities.gstack-cso.cmd }}` | `judgments.stage-routing.verify-security-secrets.fires` |

Per-phase config loads from `workflows/verify/security/workflow.yaml`; engine 4-level gate
resolver evaluates `phase.has_auth_or_secrets == true` via expr-eval — true 则 invoke gstack
`/cso` (OWASP / auth / credentials / secrets 全面审查), false 则 skip。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gstack-cso` — Bucket 3 治理关卡 (impl: gstack, cmd: /cso,
  fires_when: phase.stage == 'verify' AND phase.has_auth_or_secrets == true)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-security-secrets.fires` — `phase.stage == 'verify' and phase.has_auth_or_secrets == true`

## Routing rules

- ✅ **触发**: auth flow / session / credentials / API keys / SQL injection 路径 / OWASP top 10 area
- ❌ **跳过**: docs / 纯 UI styling / 内部 refactor / non-security PR

## How to invoke

!`harnessed checkpoint intent verify-security`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run verify-security` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt verify-security --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, use the native goal gate instead (Claude Code 2.1.139+ / Codex): `/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"` then spawn the subagent and let the goal evaluator drive re-spawns until it clears. If `/goal` is unavailable too, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations). Set the goal only at the leaf subtask level — `/goal` is single-slot per session and a nested goal overwrites the outer one.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete verify-security --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it before treating the sub as done.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- workflows/capabilities.yaml — gstack-cso
- workflows/judgments/stage-routing.yaml — verify-security-secrets trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 06-cso-conditional sister verbatim
