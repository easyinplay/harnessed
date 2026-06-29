---
name: verify-multispec
description: |
  Stage ④.h verify sub-workflow — 4-specialist Agent Team Pattern C 多维度审查 (关键发布 /
  大重构 PR 升级, code-review + gstack-review + gstack-cso + gstack-qa 4 teammate 互相
  SendMessage 质询, NOT fire-and-forget subagent fan-out; bundled Agent Teams Pattern C
  routing). Cleanup mandatory: shutdown_request + TeamDelete (bundled cleanup discipline).
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (agent-teams 3 + 4 specialist capability) + 2 phase (01-team-create on critical-release
  invoke / 02-team-cleanup mandatory shutdown)。
  Triggered by slash command
  `/verify-multispec` after `harnessed setup`.
trigger_phrases:
  - "verify multispec"
  - "4-specialist Agent Team"
  - "Pattern C 多维度审查"
  - "critical release review"
  - "跑 verify-multispec"
---

# verify-multispec workflow (v3)

## Overview

2-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — 关键发布 / 大重构 PR 升级 Agent Team
Pattern C" onto harnessed runtime (Phase v3.0-3.4 W0.13e — D-04 Stage ④ Verify 7 sub +
D-11 Agent Teams + Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability | gate / on |
| ----- | -- | -------- | ----- | ---------- | --------- |
| 1 | `01-team-create` | claude-platform | opus | `{{ capabilities.agent-teams-create.cmd }}` | `parallelism: agent-teams-upgrade.fires`; `on: is_major_release OR is_large_refactor → invoke` |
| 2 | `02-team-cleanup` | claude-platform | haiku | `{{ capabilities.agent-teams-shutdown.cmd }}` | mandatory 防呆清单 |

Per-phase config loads from `workflows/verify/multispec/workflow.yaml`; phase 01 creates 4
teammate (code-review + gstack-review + gstack-cso + gstack-qa) via TeamCreate, teammates 互相
SendMessage 质询 findings 是否真问题 (NOT fire-and-forget); phase 02 mandatory shutdown_request
+ TeamDelete (bundled Agent Teams cleanup discipline)。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `agent-teams-create` — Bucket 5 Agent Teams (impl: claude-platform, cmd: TeamCreate)
- `agent-teams-send-message` — Bucket 5 Agent Teams (impl: claude-platform, cmd: SendMessage)
- `agent-teams-shutdown` — Bucket 5 Agent Teams (impl: claude-platform, cmd: TeamDelete)
- `code-review` — Bucket 1 mattpocock (teammate 1)
- `gstack-review` — Bucket 3 治理关卡 (teammate 2 Paranoid Staff Engineer)
- `gstack-cso` — Bucket 3 治理关卡 (teammate 3 安全审查)
- `gstack-qa` — Bucket 3 治理关卡 (teammate 4 端到端 QA)

## Parallelism + on gate refs

Sister `workflows/judgments/parallelism-gate.yaml`:
- `agent-teams-upgrade.fires` — 5 OR-chain (teammate_send_message_needed / subagent_context_overflow /
  shared_task_list / opposing_hypothesis_debate / fullstack_three_way)

Phase-level `on` clause (critical-release 升级触发):
- `if: phase.is_major_release == true or phase.is_large_refactor == true` → `action: invoke`
- else → `action: skip`

## Routing rules (bundled Agent Teams routing — `workflows/judgments/parallelism-gate.yaml`)

- ✅ **触发**: 关键发布 / 大重构 PR (≥3 specialist 需互相质询而非 fire-and-forget)
- ❌ **跳过**: 常规 PR / 单点任务 (sister verify-code-review fan-out + verify-paranoid 已够用且省 token)
- **Token 估算 prereq**: `team_cost < 2 × subagent_cost` (engine-level check; bundled cost guideline)
- **Cleanup mandatory**: phase 02-team-cleanup `agent-teams-shutdown` 必跑 (bundled cleanup discipline)

## How to invoke

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run verify-multispec` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt verify-multispec --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations).
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete verify-multispec --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it before treating the sub as done.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-11 Agent Teams 4-specialist Pattern C upgrade
- workflows/capabilities.yaml — agent-teams-{create,send-message,shutdown} + 4 specialist
- workflows/judgments/stage-routing.yaml — verify-multispec-critical-release trigger
- workflows/judgments/parallelism-gate.yaml — agent-teams-upgrade.fires (5 OR-chain)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 09-agent-team-multispecialist sister verbatim
