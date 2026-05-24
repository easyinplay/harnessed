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

Use the Bash tool to run:

```bash
echo "$ARGUMENTS" | harnessed run plan --task-stdin
```

If `$ARGUMENTS` is empty, run `harnessed run plan` (no stdin pipe).

After completion, the Bash output prints a `Next:` hint on stderr suggesting the next stage. Decide whether to invoke based on conversation context — the hint is informational, not prescriptive.

<!-- harnessed-generated:v3.4.4 -->

## References

- D-01 master orchestrator delegation pattern
- D-02 bare slash cmd convention (ADR 0030 namespace policy LOCK)
- D-06 planning-with-files cross-cutting tool (NOT 独立 sub-workflow)
- workflows/judgments/stage-routing.yaml — plan-{architecture,phase}-delegate triggers
- workflows/plan/{architecture,phase}/workflow.yaml — 2 sub-workflow Phase 3.4 SHIPPED
