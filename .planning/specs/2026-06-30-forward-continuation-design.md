---
title: Forward Continuation — cross-task / cross-phase advance engine
date: 2026-06-30
status: DESIGN-LOCKED (ready-to-execute) — awaiting milestone scheduling
author: design session (5-repo comparative research)
problem: harnessed has no horizontal forward-advance — after a task/phase finishes, nothing advances to the next; only the singleton sub-ledger (one workflow invocation) auto-chains. Cross-task / cross-phase continuation is manual re-invocation today.
provenance: 5-way fusion — gsd-pi (derive-next engine + exit-code driver) · gsd-core (disk-derived SoT, wireable JSON verbs) · Trellis (per-turn re-derive surface) · comet (hook-gate horizontal advance) · oh-my-pi (stateless "first-incomplete" pointer, no stored queue)
verified_refs:
  - "src/cli/next.ts — `harnessed next` cmd, currently process.exit(0) always (exists)"
  - "src/checkpoint/nextStep.ts — resolveNext(ledger, auto) → done|auto|manual (exists)"
  - "src/checkpoint/ledger.ts:103 — nextPending(entries) (exists)"
  - "src/checkpoint/injectState.ts — buildWorkflowStateBlock + findPhaseContextExcerpt (scans .planning/phases/) (exists)"
  - "bin/harnessed-inject-state.mjs — workflowStateBlock plain-JS replica, ts↔bin parity (exists)"
  - "src/checkpoint/schema/currentWorkflow.v1.ts — singleton envelope, sub_progress ledger (exists)"
  - "src/cli/status.ts — `harnessed status [--recover]` (exists)"
  - ".planning/phases/NN-name/{NN-PLAN.md, NN-MM-SUMMARY.md, task_plan.md, progress.md} (exists, verified)"
  - "gsd_run query {roadmap.analyze, find-phase, phase-plan-index, state.advance-plan, state.add-roadmap-evolution} — ~/.claude/gsd-core/bin/gsd-tools.cjs, PATH-exposed JSON (exists, OPTIONAL reuse)"
  - "src/cli/run.ts — isNestedHarnessContext guard (exists; pattern reuse for advance-gate)"
non_goals:
  - "NOT the Merak full routed graph (intelligent entry router, structured GapReport back-edges, durable journal, P4 managed/semi-managed). That is heptagent's evolution; harnessed stays the linear-cadence realization."
  - "NOT a stored FIFO queue. Unanimous across all 5 repos: derive next from disk SoT, never maintain a separate queue."
  - "NOT cross-back-edges (contract→Spec etc.) — that is the orthogonal 'loop-back' roadmap item, separate from this 'forward' one."
---

# Forward Continuation — design spec

## 1. Problem

harnessed's runtime ledger (`current-workflow.json`, `currentWorkflow.v1.ts`) is a **singleton** envelope: one `phase` string + a `sub_progress` ledger holding the sub-workflows of **one** workflow invocation. `harnessed next` (`nextStep.ts:resolveNext`) returns `done` when those subs are all resolved — it does **not** point at the next task or phase.

Consequence (the two user scenarios this spec closes):

1. **Multi-task / multi-phase**: planned several phases, split into tasks — after a task finishes, nothing advances to the next task or phase. Continuation is doc-driven (agent re-reads `progress.md`) + manual re-invocation.
2. **Emergent work**: a new idea mid-development → a new phase recorded in ROADMAP — there is no engine that "finishes current, then continues to the next (incl. newly-inserted)."

## 2. Cross-repo evidence (the convergence this design rests on)

All five comparison projects were studied on the forward-continuation axis (this session). Unanimous findings:

- **No one maintains a separate queue.** "Next" is **derived from a persistent disk SoT** every call (gsd-pi: `deriveState` recomputes phase from row statuses, "advance() discovers, never chooses"; gsd-core: `roadmap.analyze`/`find-phase` scan PLAN-vs-SUMMARY; Trellis: `task.json.status` on disk; comet: `tasks.md` checkboxes; oh-my-pi: external SoT real-time requery).
- **The pointer is stateless** = first-incomplete unit in the SoT (oh-my-pi). Mid-insertion / manual edit / resume all "just work" — no queue to sync.
- **Completion derives from artifacts** (SUMMARY existence / checkbox / commit), not agent self-report.
- **Resume re-derives from disk, never trusts conversation history** (all 5, explicit).
- **Cross-phase auto-advance is near-absent industry-wide** — only gsd-pi has a true engine driver loop. harnessed adding it is bounded but genuinely novel.
- **comet's lesson**: horizontal advance enforced by prose alone drifts (its CRITICAL "no pause" warnings exist because agents skip). A hook/script gate is more reliable.

Detail: this session's research transcripts + `2026-06-02-merak-workflow-design.md` (heptagent §9 three-layer-stack → completed-form comparison).

## 3. Design principles (locked)

1. **Derive, don't queue.** A pure `deriveNext(planningRoot)` recomputes the next unit from `.planning/` disk state each call. No stored queue, no sync.
2. **harnessed-native scan as the floor; `gsd_run query` as optional reuse.** harnessed's `.planning` is GSD-derived but self-maintained — do NOT hard-couple to gsd-tools' parser. The disk-reconciliation rules are simple booleans (gsd-core's own assessment); harnessed implements them natively. When a GSD-tools-compatible project is detected, `gsd_run query roadmap.analyze`/`find-phase`/`phase-plan-index` MAY accelerate the scan (graceful, never required).
3. **Artifact-derived completion.** phase NN complete ⇔ every `NN-*-PLAN.md` has a matching `NN-*-SUMMARY.md` (gsd-core's `plans.length === summaries.length`). task complete ⇔ checkbox checked in `task_plan.md`/`progress.md`.
4. **Resume = re-derive from disk.** Already harnessed's discipline ("状态从产物派生"); extend it across phases.
5. **Gate the advance (comet lesson), don't only narrate it.** `harnessed advance` refuses to step past an incomplete unit (evidence-gated, mirroring `checkpoint complete`'s fail-CLOSED guard).

## 4. Component design

### D1 — `deriveNext()` pure resolver — NEW `src/checkpoint/deriveNext.ts`

Pure, schema-type-only, no I/O beyond a passed-in disk snapshot (testable like `nextStep.ts`). Resolution order (first match wins — the stateless "first-incomplete" pointer):

```
deriveNext(snapshot) →
  | { kind: 'sub',   sub }              // (1) current workflow has a pending sub  → existing intra-workflow behavior (resolveNext)
  | { kind: 'task',  phase, task }      // (2) current phase has an unchecked task → next unchecked in task_plan/progress
  | { kind: 'phase', phase, name }      // (3) current phase complete → first incomplete phase in ROADMAP (resume-first-incomplete)
  | { kind: 'blocked', unit, reason }   // a unit is failed / needs-decision (ledger fail_count, VERIFICATION FAIL)
  | { kind: 'done' }                    // all phases + tasks complete
```

- `snapshot` is assembled by an impure reader (D2) so the resolver stays pure.
- Reuses `nextPending` (`ledger.ts:103`) for branch (1).
- **resume-first-incomplete invariant** (gsd-core `next.md` Route 0): scan all phases, the first with `PLAN > SUMMARY` is "where work died" — do NOT trust a `current_phase` pointer that may have over-run a dead session.

### D2 — disk snapshot reader — NEW `src/checkpoint/planningScan.ts`

Impure, best-effort (graceful null like `findPhaseContextExcerpt`). Produces the `snapshot` D1 consumes:

- Reads `current-workflow.json` (singleton, existing) for branch (1).
- Scans `.planning/phases/NN-*/` for `NN-*-PLAN.md` vs `NN-*-SUMMARY.md` existence → per-phase done/incomplete.
- Parses `.planning/ROADMAP.md` phase rows for ordering + names (and `gsd_run query roadmap.analyze` reuse when available — D5).
- Parses the active phase's `task_plan.md` / `progress.md` `- [ ]`/`- [x]` checkboxes → next unchecked task.
- Mirrors `injectState.ts:findPhaseContextExcerpt`'s phase-dir-matching convention (leading `NN` ↔ workflow `phase` string).

### D3 — extend `harnessed next` — EDIT `src/cli/next.ts` + `src/checkpoint/nextStep.ts`

Today `next.ts` always `process.exit(0)` and `resolveNext` only sees the sub-ledger. Extend:

- When the sub-ledger resolves to `done`, fall through to `deriveNext()` (D1) instead of stopping.
- Print a cross-unit contract:
  ```
  NEXT: advance | blocked | done
  UNIT: phase 17 'X'   (or)   task 'implement middleware' in phase 16
  HINT: run /auto (or harnessed advance) to start it — 3 phases / 5 tasks remain
  ```
- **Exit-code contract** (gsd-pi `headless` style, improved so the driver can distinguish done from error):
  - `0` — a next unit is available (advance)
  - `2` — all complete (done)
  - `10` — blocked (human decision needed)
  - `1` — error
- Backward-compat: intra-workflow `auto|manual|done` sub semantics preserved when a workflow is mid-flight (branch 1).

### D4 — `harnessed advance` — NEW `src/cli/advance.ts` (15th→Nth subcommand, registered in `src/cli.ts`)

Optional driver primitive (the gsd-pi `next`/`query` split: `harnessed next` = read-only preview; `harnessed advance` = act). Steps:

1. `deriveNext()` → the next unit.
2. **Advance-gate (D5 comet lesson)**: refuse to advance past an incomplete unit — if the current phase still has `PLAN > SUMMARY`, exit non-zero with the unfinished unit (mirrors `checkpoint complete` fail-CLOSED; `--force` override records an audit note).
3. Emit the unit's start instruction (e.g. seed a fresh `current-workflow.json` for the next phase via `checkpoint start`, or print the `/auto`/`/<stage>` to run). Advance does NOT itself spawn — it hands the main session the next move (keeps Agent-Teams/clarification reachable, same rationale as the issue #2 orchestrator bodies).

A bash driver loop (documented, optional, ralph-loop-wrappable) realizes hands-free multi-phase run:
```
while harnessed advance --json; do : ; done   # 0 advance · 2 done (loop exits) · 10 blocked · 1 error
```

### D5 — optional `gsd_run query` reuse — inside D2

When `gsd_run` is on PATH AND `.planning` is GSD-tools-compatible, D2 MAY call:
- `gsd_run query roadmap.analyze` → phase list + disk_status
- `gsd_run query find-phase <N>` → `{plans[], summaries[]}` reconciliation
- `gsd_run query phase-plan-index <N>` → plan + wave map + `has_summary`

These replace harnessed's native scan for those values when present (faster + battle-tested), but the native scan (D2) is the floor — harnessed never *requires* GSD. This is the literal "wire GSD's data layer" the research validated (the advance *orchestration* is NOT wireable — built in D1/D3/D4 instead).

### D6 — per-turn "current → next" pointer — EDIT `src/checkpoint/injectState.ts` + `bin/harnessed-inject-state.mjs`

Extend the issue #2 `<workflow-state>` breadcrumb (the `ENGINE:` line). When the current workflow's subs are all resolved AND `deriveNext` returns a cross-unit next:
```
NEXT-UNIT: current workflow complete → next is phase 17 'X' (run /auto or `harnessed advance`); 3 phases / 5 tasks remain
```
This is the "current + next pointer" Trellis's per-turn breadcrumb lacks (its breadcrumb is single-unit; `completed` state is dead). Keep ts↔bin byte parity (issue #2 invariant). Advisory tone, like `VERIFY-MODE`/`ENGINE`.

## 5. Acceptance criteria (BDD — fitting the three-layer theme)

- **AC1 (multi-task)**: GIVEN a phase whose `task_plan.md` has tasks 1..N with task 1 checked, WHEN `harnessed next`, THEN `NEXT: advance` + `UNIT: task 2` + exit 0.
- **AC2 (phase boundary)**: GIVEN phase 16 complete (every `16-*-PLAN.md` has a `16-*-SUMMARY.md`) and phase 17 incomplete, WHEN `harnessed next`, THEN `UNIT: phase 17` + exit 0.
- **AC3 (resume-first-incomplete)**: GIVEN a `current_phase` pointer at 18 but phase 16 has `PLAN > SUMMARY` (dead session), WHEN `harnessed next`, THEN it routes to phase 16 (disk reconciliation beats the stale pointer) + exit 0.
- **AC4 (mid-insertion)**: GIVEN a new phase 16.1 added to ROADMAP mid-development, WHEN `harnessed next` after phase 16, THEN `UNIT: phase 16.1` — no queue rebuild, picked up from disk.
- **AC5 (done)**: GIVEN all phases have matching SUMMARYs and all tasks checked, WHEN `harnessed next`, THEN `NEXT: done` + exit 2.
- **AC6 (advance-gate, comet)**: GIVEN phase 16 has an unfinished plan, WHEN `harnessed advance` to phase 17, THEN it refuses (non-zero) naming the unfinished unit unless `--force`.
- **AC7 (per-turn pointer)**: GIVEN a resolved workflow with an incomplete next phase, WHEN the per-turn hook fires, THEN the breadcrumb carries `NEXT-UNIT: ... next is phase N`. ts↔bin parity green.
- **AC8 (graceful, no GSD)**: GIVEN `gsd_run` absent, WHEN `harnessed next`, THEN the native D2 scan still resolves the next unit (no hard dependency).
- **AC9 (backward-compat)**: GIVEN a workflow mid-flight with pending subs, WHEN `harnessed next`, THEN the existing `auto|manual|done` sub contract is unchanged.

## 6. Provenance attribution (per element)

| Element | Source | Role |
|---|---|---|
| `deriveNext()` derive-not-queue | gsd-pi (ADR-030) + all 5 | load-bearing skeleton |
| disk SoT + reuse `gsd_run query` verbs | gsd-core (wireable data layer) | load-bearing — the literal "wire GSD" |
| `next`(read) / `advance`(act) split + exit-code driver | gsd-pi (`headless query`/`next`) | engine mechanism |
| per-turn re-derive + current→next pointer | Trellis (disk-authoritative status, per-turn) + harnessed's own issue #2 hook | surface |
| advance-gate (don't skip incomplete) | comet (prose-drift lesson + checkoff gate) | reliability |
| first-incomplete stateless pointer | oh-my-pi (no stored backlog) | framing |
| mid-insertion = edit ROADMAP, auto-derived | gsd-core (`/gsd-phase` CRUD, autonomous re-reads) + gsd-pi | mechanism |

## 7. Implementation phasing (waves)

- **W1** — D2 `planningScan.ts` (impure reader) + D1 `deriveNext.ts` (pure resolver) + TDD over a fixtured `.planning/`. (Core, no surface changes.)
- **W2** — D3 extend `harnessed next` (exit codes + cross-unit contract) + D4 `harnessed advance` + advance-gate. Tests over the exit-code contract.
- **W3** — D6 per-turn pointer (ts + bin parity) + D5 optional `gsd_run` reuse. Tests.
- **W4** — docs: update harnessed-site `concepts/three-layer-stack.md` GoBack/forward note from "roadmap" → "shipped"; README forward-continuation line; STATE sync.

## 8. Open questions (resolve at discuss-phase)

- **OQ-1**: Should `harnessed advance` auto-seed the next phase's `current-workflow.json` (via `checkpoint start`), or only print the `/auto`/`/<stage>` for the main session to run? (Lean: print-only first — keeps clarification/Agent-Teams reachable, ships smaller.)
- **OQ-2**: Task-level granularity — does harnessed track per-task checkboxes itself, or delegate task iteration to the existing planning-with-files `progress.md` convention + only own phase-level advance? (Lean: phase-level advance is the high-value floor; task-level is W1 stretch.)
- **OQ-3**: Is harnessed's milestone-indexed `ROADMAP.md` (shipped-archive table) the right active-phase SoT, or does forward-continuation need an active-phase list distinct from the shipped index? (Check at discuss — may need a small ROADMAP active-section convention.)
