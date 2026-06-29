---
name: discuss-phase
description: |
  Stage ①.b Phase 层 discuss sub-workflow — GSD /gsd-discuss-phase 灰色澄清 (≥2 open
  implementation decisions / 跨 phase API contract 不清 / phase scope > 1 day / 灰色地带)。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gsd-discuss-phase + planning-with-files) + 2 phases (01-gsd-discuss + 02-persist findings.md
  + knowledge.md)。Triggered by harnessed CLI `harnessed discuss-phase --phase <num>` or slash
  command `/discuss-phase` after `harnessed setup`.
trigger_phrases:
  - "discuss phase"
  - "phase 层澄清"
  - "gsd discuss phase"
  - "灰色地带澄清"
  - "跑 discuss-phase"
---

# discuss-phase workflow (v3)

## Overview

2-phase sub-workflow mapping CLAUDE.md "Stage ①.b Phase 层 — GSD /gsd-discuss-phase 灰色澄清"
onto harnessed runtime (Phase v3.0-3.4 W0.2 — D-04 Stage ① Discuss 三层 + Pattern A
sub-workflow ship)。

| phase | id | upstream | model | capability / invokes | gate / artifacts |
| ----- | -- | -------- | ----- | -------------------- | ---------------- |
| 1 | `01-gsd-discuss` | gsd | sonnet | `{{ capabilities.gsd-discuss-phase.cmd }}` | `gate: judgments.phase-gate.gsd-discuss-phase.fires` |
| 2 | `02-persist` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` + `invokes: /plan` | `artifacts_expected: [findings.md, knowledge.md]` |

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gsd-discuss-phase` — Bucket 2 (impl: gsd, cmd: /gsd-discuss-phase)
- `planning-with-files` — Bucket 4 (impl: claude-code-plugin, cmd: /plan)

## Gate refs

Sister `workflows/judgments/phase-gate.yaml`:
- `gsd-discuss-phase.fires` — `phase.open_decisions >= 2 or phase.has_cross_phase_data_flow == true or phase.scope_days > 1`

## Invocation

- Slash command: `/discuss-phase <num>` (after `harnessed setup`)

## Routing rules

跳过条件 (sister CLAUDE.md "Phase 层 ❌ 跳过"):
- 单一明确子任务
- 跟前 phase 同 module 同 pattern
- < 1 天工作量
- bug 修复且已有最小复现

## How to invoke

Clarification needs real user dialogue, so run this stage directly in THIS session — do NOT
spawn it, and do NOT improvise: follow these steps so the locked spec is persisted for the
execution stages.

1. Evaluate the clarification criteria for "$ARGUMENTS":
   - **Strategic** — new feature / milestone / unclear business scope → gstack `/office-hours` + `/plan-ceo-review`
   - **Phase** — ≥2 open implementation decisions / unclear cross-phase API contract → GSD `/gsd-discuss-phase`
   - **Subtask** — ≥2 distinct approaches / core algorithm / API contract design / high error cost → superpowers brainstorming
2. For each layer that fires, hold the dialogue with the user (use AskUserQuestion for option-style decisions) and lock every open decision.
3. Transparent-skip layers that don't fire — state which were skipped and why.
4. Persist the locked decisions to `.planning/` via planning-with-files (`findings.md` / `task_plan.md`).

Output: a locked spec the execution stages (`/plan` → `/task` → `/verify`) consume without further user input.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-04 Stage ① Discuss 三层 (战略 / phase / 子任务)
- workflows/capabilities.yaml — gsd-discuss-phase / planning-with-files
- workflows/judgments/phase-gate.yaml — gsd-discuss-phase trigger
- workflows/defaults.yaml — ralph_max_iterations.discuss-phase.* values (W2.2 backfill)
