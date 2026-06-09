# Phase 9 — findings

> Reconstructed retroactively 2026-06-10. Discoveries/decisions during planning + execution
> not captured in PLAN/SUMMARY (one-fact-per-file: the plan lives in task_plan.md/09-PLAN.md;
> this is the "what we learned" layer).

## Decisions

- **Keystone enforced in code, not just prose** — the T1 acceptance includes an automated
  guard (`if (c['gsd-execute-phase']) throw 'KEYSTONE VIOLATION'`) so the "execute stays
  self-owned" decision is mechanically defended against future drift, not just documented.
- **New entries as a tail bucket** — appended rather than interleaved, so the additive
  diff is reviewable and no existing entry moves (one-fact-per-file / surgical).
- **stage-phase-gate.yaml is a NEW sibling file**, not edits to phase-gate.yaml — keeps the
  4 design-contract triggers cohesive + avoids touching the existing gsd-discuss-phase gate.

## Landmines hit

- **`gsd-research-phase` was dead** — the GSD Core 1.4.1 rename removed that skill; the
  pre-existing capability pointed at a non-existent skill_dir. Fixed in the rename preamble
  (remap → `gsd-explore`, commit 0ab8c52) before this phase.
- **grep-over-assume paid off** — verified all 12 skill_dirs exist on disk before wiring
  (per CLAUDE.md SPEC cross-ref checklist); none were missing, but the dead research-phase
  showed why the check matters.

## Process learnings

- **GSD `context: fork` skills fire-and-die as slash commands** — `/gsd-plan-phase 9` returned
  "awaiting input" with no work. Drove it via `gsd-planner` + `gsd-executor` Agent-tool spawns
  instead (reliable).
- **Subagent final messages get swallowed by a stop hook** — both planner and executor returned
  opaque "完成"; had to self-verify outputs (grep files + run green gate) rather than trust the
  returned text. Standard practice for this repo now.
