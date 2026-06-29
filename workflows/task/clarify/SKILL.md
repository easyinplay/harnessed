---
name: task-clarify
description: |
  task-clarify workflow v3 — Stage ③.a 子任务澄清 sub-workflow (superpowers
  brainstorm + mattpocock /grill-with-docs conditional invoke)。Per-subtask
  repeat invoke 入口 — execute-task 每个 subtask 起步先走 task-clarify 评估 gate
  (judgments.subtask-gate.brainstorming.fires) 是否激活 brainstorming + 条件性
  fire grill-with-docs (phase.spec_ambiguous == true)。
  schema_version: harnessed.workflow.v3 with disciplines_applied [6] + tools_available
  [superpowers-brainstorming, grill-with-docs]. Triggered by harnessed CLI
  `harnessed task-clarify --task <text>` or slash command `/task-clarify` after
  `harnessed setup`.
trigger_phrases:
  - "clarify this subtask"
  - "task-clarify workflow"
  - "Stage 3 clarify"
  - "跑 task-clarify"
---

# task-clarify workflow (v3)

## Overview

Single-phase sub-workflow mapping the user's CLAUDE.md Stage ③.a 子任务澄清 discipline
onto the harnessed runtime, fully `harnessed.workflow.v3` schema (Phase v3.0-3.4 W0
T3.4.W0.6 — D-09 L0 Discipline Substrate + D-05 conditional `invokes_tools` + D-04
gate ref).

| phase | id | upstream | model | capability / invokes_tools | gate |
| ----- | -- | -------- | ----- | -------------------------- | ---- |
| 1 | `01-brainstorm` | superpowers | sonnet | `{{ capabilities.superpowers-brainstorming.cmd }}` + `invokes_tools: [{if: phase.spec_ambiguous, tool: grill-with-docs}]` | `judgments.subtask-gate.brainstorming.fires` |

Per-phase config loads from `workflows/task/clarify/workflow.yaml`; engine.runRouting
spawns each phase as a sub-agent via `@anthropic-ai/claude-agent-sdk` 0.3.142+.

## Per-subtask repeat invoke pattern

task-clarify is **NOT** a one-shot 阶段 — execute-task master orchestrator delegates
to task-clarify **每个 subtask 入口走一次** evaluate gate (subtask-gate.brainstorming
.fires) 是否激活。Skip path (subtask.type in ['crud','standard_lib_call'] OR
subtask.lines < 20) bypasses brainstorming entirely per CLAUDE.md "拿不准 → 倾向跳过"。

## Discipline Substrate (L0 always-on)

6 disciplines (karpathy + output-style + language + operational + priority + protocols)
apply cross-cutting per D-09 L0 Discipline Substrate — workflow runtime pre-phase hook
loads discipline yaml + applies rules. Sentinel category `behavioral` SKIP cmd invoke;
runtime engine routes via `discipline_ref` ref to `workflows/disciplines/<basename>.yaml`.

## Conditional grill-with-docs fire (D-05 invokes_tools)

Phase 01-brainstorm 条件性 fire `grill-with-docs` when `phase.spec_ambiguous == true` —
sister CLAUDE.md "Discuss / Research 阶段" mattpocock 招式按需召唤 pattern; NOT 强制
unconditional fire (D-05 invokes_tools 与 OnClause 并存, 但作用面不同 — invokes_tools
phase-level conditional tool fire NOT 决定 phase 是否走)。

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

- D-09 — L0 Discipline Substrate always-on (6 disciplines)
- D-05 — phase-level `invokes_tools` conditional tool fire
- D-04 — `gate` 4-level ref pre-resolved by `judgmentResolver`
- D-02 — SKILL.md `name:` bare slash cmd (`task-clarify` NOT `task/clarify`) per ADR 0030
- `workflows/judgments/subtask-gate.yaml` triggers.brainstorming
- `workflows/capabilities.yaml` — superpowers-brainstorming + grill-with-docs entries
- `workflows/defaults.yaml` — ralph_max_iterations.task-clarify.* values (T3.4.W2.2 followup)
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + Stage ③ Execute 章节
