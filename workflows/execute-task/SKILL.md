---
name: execute-task
description: |
  execute-task workflow v2 — 4-phase chain (brainstorming → karpathy + mattpocock route → TDD + diagnose → ralph-loop COMPLETE)
  triggered by harnessed CLI `harnessed execute-task --task <text>`.
  v2 delta (Phase v2.0-2.4 W1.1): schema_version: harnessed.workflow.v2 + ralph-loop 真接 SDK wrapper +
  tdd-gate conditional + mattpocock route by condition (grill-with-docs / zoom-out / diagnose) +
  explicit max_iterations_exceeded fallback (R20.10 NOT silent abort).
trigger_phrases:
  # forward-looking documentation — auto-invocation 实装推 Phase 2.3 extension category (B-28).
  # Current enforced entry surface is the CLI subcommand below; these phrases are
  # documentation-only hints for the eventual GSD orchestration agent.
  - "execute this task"
  - "implement this feature"
  - "execute-task workflow"
  - "跑 execute-task"
---

# execute-task workflow (v2)

## Overview

4-phase chain mapping the user's CLAUDE.md Execute-phase discipline onto the harnessed
runtime (ADR 0011 — SDK + ralph-loop integration; v2 schema upgrade T2.4.W1.1):

| phase | id | upstream | model (intel CD-2 § 第 4 条) | v2 wiring |
| ----- | -- | -------- | ---------------------------- | --------- |
| 1 | `01-clarify` | `superpowers brainstorming` | opus | `capability: superpowers-brainstorming` + `gate: judgments.subtask-gate.brainstorming.fires` |
| 2 | `02-code` | `karpathy` 心法 always-on | sonnet | `on[]` route to tdd-gate / grill-with-docs / zoom-out (D-09 + D-13) |
| 3 | `03-test` | `superpowers TDD` | sonnet | `capability: tdd` + `on[]` route to diagnose on test_fail (D-13 + D-09) |
| 4 | `04-deliver` | `ralph-loop` | haiku | `capability: ralph-loop` + `args: {completion_promise: COMPLETE}` + `gate/parallelism: judgments.parallelism-gate.*` + `fallback.max_iterations_exceeded: emit_warning_and_halt` (R20.10) |

v2 schema fields per `src/workflow/schema/workflow.ts` (T2.4.W0.1 16th surface — harnessed.workflow.v2):
- `capability: '{{ capabilities.<name>.cmd }}'` template interpolation (D-10 capability abstraction)
- `gate: judgments.<file>.<gate>.fires` 4-level ref (pre-resolved by T2.3.W0.4 judgmentResolver)
- `on: [{if, invoke|action}]` conditional clause (D-09 mattpocock route by condition)
- `args: {completion_promise, max_iterations}` ralph-loop SDK params (R20.10 verbatim COMPLETE gate)
- `parallelism: judgments.parallelism-gate.<route>.fires` (D-11 subagent / Agent Teams / main session route)
- `fallback.max_iterations_exceeded: {action, message, exit_code}` (R20.10 acceptance c "explicit NOT silent")

Per-phase models load from `workflows/execute-task/workflow.yaml` (v3 SoT post
v3.4.4 Phase 6 — v2 phases.yaml deleted); runWorkflow spawns each phase as a
sub-agent via `@anthropic-ai/claude-agent-sdk` 0.3.142+
(`AgentDefinition` 5-字段 unpack — ADR 0011 § 4). ralph-loop SDK wrapper at 04-deliver
reuses sister Phase 2.2 v0.2.0 ship: `src/workflow/lib/ralphLoop.ts` (54L) + `sdkSpawn.ts` (91L)
+ 4-layer dual-signal `isComplete` (NOT 重写 — per RESEARCH § 3.1).

## CLI invocation (the only enforced entry — B-28)

```bash
# Dry-run preview — arbitrate-only, never spawns SDK.
harnessed execute-task --task "<text>" --dry-run --non-interactive

# Apply path — real SDK spawn + ralph-loop COMPLETE round-trip.
harnessed execute-task --task "<text>" --apply

# `--model-tier inherit` escape hatch (B-10) — override per-phase models with
# SDK 'inherit' (parent-thread model resolution).
harnessed execute-task --task "<text>" --apply --model-tier inherit
```

H1 gate: `--non-interactive` requires `--apply` or `--dry-run` (exit 2 otherwise);
sibling install-base.ts L51-56 + research.ts L37-43 pattern.

EngineResult three-state → exit code mapping:
- `0` — ok (ralph-loop returned verbatim `<promise>COMPLETE</promise>` round-trip)
- `1` — ok:false {phase: arbitrate|install|spawn|verbatim} (typed error)
- `2` — aborted {reason} (max-iter exceeded OR usage/config error)

## Forward-looking note

The `trigger_phrases:` frontmatter is currently **documentation purpose only** —
auto-invocation by the GSD orchestration agent (skill auto-discovery) is deferred
to Phase 2.3 extension category. In Phase 2.2 the only enforced entry surface is
the CLI subcommand above (B-28 single-entry contract).

## References

- ADR 0011 — execute-task SDK + ralph-loop integration (phase 2.2 W6 — finalize)
- `.planning/intel/omc-comparison.md` § CD-2 — per-phase model tier defaults
- `src/cli/execute-task.ts` — CLI implementation (T5.1)
- `workflows/execute-task/workflow.yaml` — 4-phase config (v3 SoT; v3.4.4 Phase 6 ship — v2 phases.yaml deleted)
- `src/workflow/lib/sdkSpawn.ts` — SDK query() consumer (T4.1)
- `src/workflow/lib/ralphLoop.ts` — verbatim COMPLETE round-trip
