---
name: plan-feature
description: |
  plan-feature workflow v2 — 5-phase 三层栈 composition (gstack governance gate →
  superpowers brainstorm → GSD /gsd-discuss-phase → GSD /gsd-plan-phase →
  planning-with-files Claude Code plugin slash cmd `/plan` 持久化 task_plan.md +
  progress.md + findings.md). schema_version: harnessed.workflow.v2 with
  capability template interpolation + 4-level gate refs + conditional `on` clauses.
  Triggered by harnessed CLI `harnessed plan-feature --task <text>` or slash command
  `/plan-feature` after `harnessed setup`.
trigger_phrases:
  - "plan this feature"
  - "design new feature"
  - "plan-feature workflow"
  - "跑 plan-feature"
---

# plan-feature workflow (v2)

## Overview

5-phase chain mapping the user's CLAUDE.md Discuss + Plan discipline onto the harnessed
runtime, upgraded to `harnessed.workflow.v2` schema (Phase v2.0-2.4 W1 T2.4.W1.3 —
D-15 + Q-AUDIT-5a Option A: planning-with-files = Claude Code plugin slash cmd
`/plan` 真接, **NOT** npm SDK call, **NOT** fs.writeFile self-impl).

| phase | id | upstream | model | capability / invokes | gate / on |
| ----- | -- | -------- | ----- | -------------------- | --------- |
| 1 | `01-gstack-decision` | gstack | opus | `{{ capabilities.gstack-office-hours.cmd }}` / `{{ gstack_prefix }}office-hours` | `gate: judgments.strategic-gate.office-hours.fires` |
| 2 | `02-brainstorm` | superpowers | sonnet | `{{ capabilities.superpowers-brainstorming.cmd }}` | `on: judgments.subtask-gate.brainstorming.fires → invoke` |
| 3 | `03-gsd-discuss` | gsd | sonnet | `{{ capabilities.gsd-discuss-phase.cmd }}` | `on: judgments.phase-gate.gsd-discuss-phase.fires → invoke` |
| 4 | `04-gsd-plan` | gsd | sonnet | `invokes: gsd-plan-phase` (literal — v2.x patch followup capabilities entry) | — |
| 5 | `05-persist` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` / `invokes: /plan` | `on: phase.scope_days > 1 or phase.is_critical_module → invoke` |

Per-phase config loads from `workflows/plan-feature/workflow.yaml`; engine.runRouting
spawns each phase as a sub-agent via `@anthropic-ai/claude-agent-sdk` 0.3.142+.

### v1 → v2 字段 delta

- ADD `schema_version: harnessed.workflow.v2` (T2.4.W0.1 16th surface — first .v2)
- ADD `description` root field (workflow purpose summary)
- ADD `phase.capability: '{{ capabilities.<name>.cmd }}'` template interpolation (D-10)
- ADD `phase.gate: judgments.<file>.<trigger>.fires` 4-level ref (D-04, pre-resolved by `judgmentResolver`)
- ADD `phase.on: [{if, invoke|action}]` conditional clause (D-09)
- ADD `phase.artifacts_expected: [...]` 3-file persistence list (D-15)
- CHANGE `max_iterations` 改用 `{{ defaults.ralph_max_iterations.plan-feature.<phase> }}` jinja ref (T2.3.W1.2 ship)
- KEEP `invokes: '/plan'` literal at 05-persist (Q-AUDIT-5a anti-pattern guard)

### Phase 1 governance gate

Phase 1 (gstack governance) uses workflow-level `on_veto: halt_workflow` — any
CEO/EM/Designer/Paranoid/QA/CSO veto halts the entire workflow before proceeding
to brainstorm or planning (D-04 PUSH 任 1 phase 转换前 read = vetoed → 全 halt).

### Phase 5 planning-with-files plugin 真接 (Q-AUDIT-5a LOCKED Option A)

05-persist invokes the **Claude Code plugin** slash command `/plan`. Requires
the `planning-with-files` Claude Code plugin to be installed via the Claude Code
plugin marketplace. The plugin generates 3 markdown files in
`.planning/<phase-id>/`:

- `task_plan.md` — 主计划 (task 列表 + 文件路径 + 依赖顺序 + 验收标准)
- `progress.md` — 跨 session 进度跟踪
- `findings.md` — 调研发现 / 知识沉淀

Q-AUDIT-5a rejected alternatives (anti-pattern guard verified by
`tests/workflow/plan-feature-v2.test.ts`):

- (b) plugin script direct spawn — Windows PowerShell 跨平台不友好
- (c) `fs.writeFile` self-implementation — duplicates plugin functionality, breaks
  multi-IDE compatibility (sister .continue / .factory / .gemini / .codebuddy /
  .cursor structure 已就绪)

## CLI invocation

```bash
# Dry-run preview — arbitrate-only, never spawns SDK.
harnessed plan-feature --task "<text>" --dry-run --non-interactive

# Apply path — real SDK spawn + 5-phase chain.
harnessed plan-feature --task "<text>" --apply
```

## Forward-looking note

The `trigger_phrases:` frontmatter is active after `harnessed setup` copies this
SKILL.md to `<claude-home>/skills/plan-feature/` — Claude Code then loads the slash
command `/plan-feature` automatically (Gap B fix — v1.0.2).

## References

- ADR 0011 — SDK + ralph-loop integration
- `workflows/plan-feature/workflow.yaml` — 5-phase config (v2 schema)
- `workflows/capabilities.yaml` — capability manifest (35 entry baseline)
- `workflows/judgments/{strategic-gate,phase-gate,subtask-gate}.yaml` — gate refs
- `workflows/defaults.yaml` — ralph_max_iterations.plan-feature.* values
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + gap analysis
- `.planning/phase-v2.0-2.2/RESEARCH.md` § 5.3 — D-15 实装路径 reframe
