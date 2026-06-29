---
name: plan
description: |
  Stage ② Plan master orchestrator — 串行 invoke 2 sub (architecture conditional → phase always)。
  复杂架构 gstack /plan-eng-review 锁定架构后再 GSD /gsd-plan-phase + planning-with-files 持久化
  task_plan.md。schema_version: harnessed.workflow.v3 with delegates_to (2 sub: architecture
  serial order 1 + phase serial order 2) + disciplines_applied (6 default) + tools_available
  (planning-with-files + plan-eng-review + gsd-plan-phase)。
  Triggered by slash command `/plan`
  (bare per ADR 0030 namespace policy D-02 LOCK) after `harnessed setup`.
trigger_phrases:
  - "plan"
  - "计划阶段"
  - "stage 2 plan"
  - "持久化计划"
  - "task_plan"
---

# plan master orchestrator (v3)

## Overview

4-stage cadence Stage ② master orchestrator delegating to 2 sequential sub-workflows
(bundled Plan-stage cadence + D-06 planning-with-files cross-cutting tool):

| order | sub | gate ref | mode | when fires |
| ----- | --- | -------- | ---- | ---------- |
| 1 | `architecture` | `judgments.stage-routing.plan-architecture-delegate.fires` | serial | phase.is_complex_architecture == true |
| 2 | `phase` | (unconditional — plan-phase always fires when stage=='plan') | serial | always |

Engine runtime spawns 2 sub-workflow phases sequentially via `runMasterOrchestrator`
per T3.5.W0.1 — order 1 (architecture conditional) MUST complete before order 2
(phase unconditional, GSD plan-phase + planning-with-files /plan task_plan.md
持久化)。K9 invariant enforced: every serial mode delegate carries explicit `order`。

## Capability refs

Sister `workflows/capabilities.yaml`:
- `planning-with-files` — Bucket 4 核心 capability (impl: claude-code-plugin, cmd: /plan)
- `plan-eng-review` — Bucket 7 gstack 33 optional (impl: gstack, cmd: /plan-eng-review)
- `gsd-plan-phase` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-plan-phase)
- sub `architecture` upstream → `plan-eng-review`
- sub `phase` upstream → `gsd-plan-phase` + `planning-with-files`

## Routing rules (sister CLAUDE.md "Plan 阶段")

- **复杂架构必须先跑** `/plan-eng-review` 锁定架构后再进入 plan-phase (sister CLAUDE.md "⚠️")
- 普通 phase skip architecture sub (gate `phase.is_complex_architecture == false`)
- **禁止在规划阶段直接使用** `superpowers:writing-plans` 输出大文档 (除非用户明确要求)

## Invocation

- Slash command: `/plan <text>` (bare per ADR 0030 namespace policy D-02 LOCK after `harnessed setup`)

## How to invoke

The numbered sequence below **is** the state machine — execute it step by step with Bash.
Do NOT improvise an equivalent flow from the Overview above: freelancing bypasses the engine
(no per-sub ledger, no evidence guard, no recovery). harnessed is the orchestration brain
(`harnessed gates` says which subs fire, `harnessed prompt` gives each spawn-ready prompt,
`harnessed checkpoint` records the ledger); YOU spawn with CC-native Task / Agent tools.

Do NOT pipe to `harnessed run plan` — that is the CI/headless path (in-process SDK spawn
that blocks the session, bypasses Agent Teams, and hangs inside Claude Code).

1. If the clarification criteria fire for "$ARGUMENTS" (≥2 approaches / core algorithm / API contract / high error cost), clarify interactively in THIS session first (AskUserQuestion) and lock decisions; otherwise transparent-skip. Produce a locked spec.
2. Bash: `harnessed gates plan --task "<locked spec>" --skip-sub clarify` → parse the JSON `{fire, skip, parallelism}`. This is the plan SoT (no spawn). Keep the verbatim JSON.
3. Bash: `harnessed checkpoint start plan --plan '<the verbatim gates JSON from step 2>'` → seeds the per-sub ledger so `harnessed status --recover` can re-orient you after compaction.
4. If `parallelism.escalate_to_teams === true`: read `~/.claude/rules/agent-teams.md`, then drive the fired subs as an Agent Team (`TeamCreate` → `Agent(name, team_name, …)` per sub with its `harnessed prompt <sub>` prompt → coordinate via `SendMessage` → `SendMessage shutdown_request` + `TeamDelete`). Still checkpoint each sub (`complete` / `fail`) as below.
5. Otherwise, for each fired sub in `order` (serial subs sequentially, parallel subs concurrently):
   - **If the entry has `is_master: true`** (a stage master — e.g. `/auto` firing `plan`/`task`/`verify`): do NOT prompt+spawn it. RECURSE: run that master’s own `harnessed gates <sub> --task "<spec>" --skip-sub clarify` → `harnessed checkpoint start <sub> --plan '<json>'` → repeat this loop for ITS fired subs.
   - **Else (leaf sub):**
     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → parse `{prompt, max_iterations, model}`.
     b. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations).
     c. If the output contains `STATUS: NEEDS_CLARIFICATION` + questions: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
     d. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete <sub> --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it, or pass `--force` only to deliberately override.
     e. If the sub cannot reach COMPLETE (max_iterations exhausted / unrecoverable error): Bash `harnessed checkpoint fail <sub> --summary "<why>"`, then STOP and report to the user.
6. After all fired subs are `done` (or recorded `failed`), Bash `harnessed status --recover` to confirm the ledger and report a per-sub fired/skipped/done/failed summary to the user.

**If you lose context (compaction / resume):** run `harnessed status --recover` first — it reads the ledger and prints "you are here, this is next" so you resume at the first `pending` sub instead of restarting. If the ledger is empty, re-run steps 2-3.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-01 master orchestrator delegation pattern
- D-02 bare slash cmd convention (ADR 0030 namespace policy LOCK)
- D-06 planning-with-files cross-cutting tool (NOT 独立 sub-workflow)
- workflows/judgments/stage-routing.yaml — plan-{architecture,phase}-delegate triggers
- workflows/plan/{architecture,phase}/workflow.yaml — 2 sub-workflow Phase 3.4 SHIPPED
