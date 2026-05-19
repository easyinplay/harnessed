---
name: plan-feature
description: |
  plan-feature workflow — 5-phase three-layer-stack composition (gstack governance →
  superpowers brainstorm → GSD discuss → GSD plan → planning-with-files persist).
  Triggered by harnessed CLI `harnessed plan-feature --task <text>` or slash command
  `/plan-feature` after `harnessed setup`.
trigger_phrases:
  - "plan this feature"
  - "design new feature"
  - "plan-feature workflow"
  - "跑 plan-feature"
---

# plan-feature workflow

## Overview

5-phase chain mapping the user's CLAUDE.md Discuss + Plan discipline onto the harnessed
runtime (ADR 0011 — SDK + ralph-loop integration):

| phase | id | upstream | model | rationale |
| ----- | -- | -------- | ----- | --------- |
| 1 | `01-gstack-decision` | `gstack` `/office-hours` governance gate | opus | 多角色决策关卡 (CEO/EM/Designer/Paranoid/QA/CSO) |
| 2 | `02-brainstorm` | `superpowers brainstorming` + ui-ux-pro-max | sonnet | 任务复杂度澄清 + UI 设计方案 |
| 3 | `03-gsd-discuss` | `gsd` `/gsd-discuss-phase` | sonnet | 灰色地带澄清 4-question batch |
| 4 | `04-gsd-plan` | `gsd` `/gsd-plan-phase` | sonnet | Wave A research + Wave B planner + Wave C checker |
| 5 | `05-persist` | `planning-with-files` | haiku | task_plan.md + progress.md + findings.md 持久化 |

Per-phase config loads from `workflows/plan-feature/workflow.yaml`; engine.runRouting
spawns each phase as a sub-agent via `@anthropic-ai/claude-agent-sdk` 0.3.142+.

Phase 1 (gstack governance) uses `on_veto: halt_workflow` — any CEO/EM veto halts the
entire workflow before proceeding to brainstorm or planning.

## CLI invocation

```bash
# Dry-run preview — arbitrate-only, never spawns SDK.
harnessed plan-feature --task "<text>" --dry-run --non-interactive

# Apply path — real SDK spawn + 5-phase chain.
harnessed plan-feature --task "<text>" --apply
```

## Forward-looking note

The `trigger_phrases:` frontmatter is active after `harnessed setup` copies this
SKILL.md to `~/.claude/skills/plan-feature/` — Claude Code then loads the slash
command `/plan-feature` automatically (Gap B fix — v1.0.2).

## References

- ADR 0011 — SDK + ralph-loop integration
- `workflows/plan-feature/workflow.yaml` — 5-phase config
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + gap analysis
