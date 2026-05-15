---
name: execute-task
description: |
  execute-task workflow — 4-phase chain (brainstorming → karpathy → mattpocock → TDD → ralph-loop)
  triggered by harnessed CLI `harnessed execute-task --task <text>`.
trigger_phrases:
  # forward-looking documentation — auto-invocation 实装推 Phase 2.3 extension category (B-28).
  # Current enforced entry surface is the CLI subcommand below; these phrases are
  # documentation-only hints for the eventual GSD orchestration agent.
  - "execute this task"
  - "implement this feature"
  - "execute-task workflow"
  - "跑 execute-task"
---

# execute-task workflow

## Overview

4-phase chain mapping the user's CLAUDE.md Execute-phase discipline onto the harnessed
runtime (ADR 0011 — SDK + ralph-loop integration):

| phase | id | upstream | model (intel CD-2 § 第 4 条) | rationale |
| ----- | -- | -------- | ---------------------------- | --------- |
| 1 | `01-clarify` | `superpowers brainstorming` | opus | 任务复杂度澄清 |
| 2 | `02-code` | `karpathy` 心法 always-on | sonnet | small surgical changes |
| 3 | `03-test` | `superpowers TDD` + mattpocock 招式 | sonnet | conditional TDD red-green-refactor |
| 4 | `04-deliver` | `ralph-loop` | haiku | 迭代验收循环省 token (关键点) |

Per-phase models load from `workflows/execute-task/phases.yaml`; engine.runRouting
spawns each phase as a sub-agent via `@anthropic-ai/claude-agent-sdk` 0.3.142+
(`AgentDefinition` 5-字段 unpack — ADR 0011 § 4).

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
- `workflows/execute-task/phases.yaml` — 4-phase config (T3.3)
- `src/routing/lib/sdkSpawn.ts` — SDK query() consumer (T4.1)
- `src/routing/lib/ralphLoop.ts` — verbatim COMPLETE round-trip
