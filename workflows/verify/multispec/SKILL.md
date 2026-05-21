---
name: verify-multispec
description: |
  Stage ④.h verify sub-workflow — 4-specialist Agent Team Pattern C 多维度审查 (关键发布 /
  大重构 PR 升级, code-review + gstack-review + gstack-cso + gstack-qa 4 teammate 互相
  SendMessage 质询, NOT fire-and-forget subagent fan-out, sister ~/.claude/rules/agent-teams.md
  L42-L52 Pattern C verbatim)。Cleanup mandatory: shutdown_request + TeamDelete (防呆清单)。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (agent-teams 3 + 4 specialist capability) + 2 phase (01-team-create on critical-release
  invoke / 02-team-cleanup mandatory shutdown)。
  Triggered by harnessed CLI `harnessed verify-multispec --phase <num>` or slash command
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
+ TeamDelete (防呆清单 per ~/.claude/rules/agent-teams.md L46-L48)。

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

## Routing rules (sister ~/.claude/rules/agent-teams.md)

- ✅ **触发**: 关键发布 / 大重构 PR (≥3 specialist 需互相质询而非 fire-and-forget)
- ❌ **跳过**: 常规 PR / 单点任务 (sister verify-code-review fan-out + verify-paranoid 已够用且省 token)
- **Token 估算 prereq**: `team_cost < 2 × subagent_cost` (engine-level check per agent-teams.md L34)
- **Cleanup mandatory**: phase 02-team-cleanup `agent-teams-shutdown` 必跑 (防呆清单)

## CLI invocation

```bash
# Dry-run preview — arbitrate-only, never spawns SDK.
harnessed verify-multispec --phase <num> --dry-run --non-interactive

# Apply path — real SDK spawn + TeamCreate 4 specialist + 互相 SendMessage 质询 + 末尾 TeamDelete。
harnessed verify-multispec --phase <num> --apply
```

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-11 Agent Teams 4-specialist Pattern C upgrade
- ~/.claude/CLAUDE.md "Verify 阶段 — 关键发布 / 大重构 PR 升级 Agent Team Pattern C" verbatim
- ~/.claude/rules/agent-teams.md Pattern C 多维度审查 + 防呆清单 + 完整生命周期
- workflows/capabilities.yaml — agent-teams-{create,send-message,shutdown} + 4 specialist
- workflows/judgments/stage-routing.yaml — verify-multispec-critical-release trigger
- workflows/judgments/parallelism-gate.yaml — agent-teams-upgrade.fires (5 OR-chain)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 09-agent-team-multispecialist sister verbatim
