---
title: State machine gap-fill — G1-G4 + G6 + G7-lite
date: 2026-06-12
status: ready-to-plan
milestone: v0.5.0 (state-machine borrow from comet/Trellis)
deferred: G5 (singleton -> multi-workflow) -> next milestone (breaking schema migration)
verified_refs:
  - "src/checkpoint/state.ts readCurrentWorkflow L85 / mutateSubProgress L137 (exists)"
  - "src/checkpoint/ledger.ts nextPending L100 / markSub L75 / seedLedger L48 (exists)"
  - "src/checkpoint/resume.ts runResume L27 / ResumeResult L13 (exists)"
  - "src/checkpoint/evidence.ts detectDrift L139 / checkArtifacts L65 (exists)"
  - "src/checkpoint/schema/currentWorkflow.v1.ts CurrentWorkflowV1 / SubProgressEntry / WorkflowStatus (exists)"
  - "src/checkpoint/schema/checkpoint.v1.ts CheckpointV1 / CheckpointStatus (exists)"
  - "src/checkpoint/scale.ts (NEW)"
  - "src/checkpoint/nextStep.ts (NEW)"
  - "src/checkpoint/recovery.ts (NEW)"
  - "src/checkpoint/injectState.ts (NEW)"
  - "src/checkpoint/breakLoop.ts (NEW)"
  - "harnessed next / harnessed reject CLI subcommands (NEW)"
---

# State machine gap-fill — G1-G4 + G6 + G7-lite

## Context

Gap analysis vs two sister Claude Code skill harnesses — `rpamis/comet` (phase-guarded
FSM, `.comet.yaml` per-change state) and `mindfold-ai/Trellis` (per-task `task.json`,
per-turn workflow-state injection) — surfaced seven state-machine gaps in harnessed.

harnessed today: a 3-state lifecycle FSM (`active|paused|complete`, D-02 KARPATHY lock,
no FSM lib) over a singleton `current-workflow.json`, with a flat `sub_progress[]` ledger
(`pending|done|failed|skipped`), fail-closed evidence guard (sha256 artifact existence),
checkpoint envelope per phase, proper-lockfile concurrency, and resume-from-paused with
sha256 drift warning.

This milestone borrows six of the seven gaps. **G5** (singleton -> multi-workflow) is a
breaking `current-workflow.json` schema migration and is deferred to a separate milestone.
The six in-scope items are all **additive** and preserve every locked decision (D-01 flat
ledger, D-02 3-state top-level union).

## Goals

| ID | Capability | Borrowed from |
|----|-----------|---------------|
| G1 | scale-adaptive verify strength (`verify_mode` light/full from change size) | comet `scale` |
| G2 | deterministic next-step contract (`NEXT: auto\|manual\|done`) | comet `comet-state next` |
| G3 | structured recovery actions on resume (per sub-state -> action string) | comet `check --recover` |
| G4 | per-turn `<workflow-state>` breadcrumb injection hook | Trellis `inject-workflow-state.py` |
| G6 | loop-escape / anti-thrash (`fail_count` detection + knowledge capture) | Trellis `break-loop` |
| G7-lite | `rejected` sub-status (user-abandoned, distinct from `failed`) | Trellis `rejected` task status |

Non-goals: G5 multi-workflow concurrency (deferred); changing the top-level
`WorkflowStatus` union (D-02 lock preserved); per-phase context jsonl (GSD `.planning/`
already owns this); task tree parent/children (D-01 flat lock preserved).

## Schema changes (all additive-optional, no `schemaVersion` bump per CD-5)

Old state files lacking the new fields still pass `Value.Check`; readers use `?? default`.

`CurrentWorkflowV1` envelope (`src/checkpoint/schema/currentWorkflow.v1.ts`):
- `+ verify_mode?: 'light' | 'full'`
- `+ auto_transition?: boolean`

`SubProgressEntry`:
- `+ fail_count?: number`
- `status` union `+ 'rejected'` (**sub-level union — NOT the top-level `WorkflowStatus`
  D-02 lock; the two unions are independent by design**)

A schema parity test must assert the top-level `WorkflowStatus` / `CheckpointStatus` unions
remain exactly `active|paused|complete` (regression guard on the D-02 lock).

## Components (each isolated, single-purpose, independently testable)

Design § component isolation (mirrors existing `ledger.ts` purity convention): pure logic
depends on schema TYPES only — zero fs/git/crypto. All I/O lives in collectors / CLI layer.

### G1 — `src/checkpoint/scale.ts` (NEW)

- Pure `assessScale(m: ScaleMetrics): 'light' | 'full'`
  where `ScaleMetrics = { changedFiles: number; firedSubs: number; requirements: number }`.
- Rule: `full` when `changedFiles > 5 || firedSubs > 4 || requirements > 3`, else `light`.
- Impure collector `collectScaleMetrics(cwd, ledger): Promise<ScaleMetrics>`:
  - `changedFiles` = `git diff --name-only $(git merge-base HEAD origin/main)` line count;
    git absent / no merge-base -> `0` (fail-soft).
  - `firedSubs` = ledger entries with `status !== 'skipped'` (count).
  - `requirements` = `.planning/REQUIREMENTS.md` acceptance-item line count; no `.planning/`
    -> `0` (non-GSD user; signal contributes nothing).
- base_ref is computed live, NOT stored (avoids a checkpoint schema change).
- Wire-in: when the verify sub fires, compute + write `verify_mode` into the envelope.

### G2 — `harnessed next` CLI + `src/checkpoint/nextStep.ts` (NEW)

- Pure `resolveNext(ledger, autoTransition): NextStep`
  where `NextStep = { next: 'auto' | 'manual' | 'done'; sub?: string; hint?: string }`.
  Reuses `nextPending(ledger)` (ledger.ts L100). `done` when no pending remain.
- `auto_transition` precedence (mirrors comet 3-layer): env `HARNESSED_AUTO_TRANSITION`
  > envelope `auto_transition` field > default `true`.
  - `auto` when a pending sub exists and auto_transition is true.
  - `manual` when a pending sub exists and auto_transition is false (`hint` populated).
- CLI prints the contract: `NEXT: <v>` / `SUB: <sub>` (omit on done) / `HINT: <msg>` (manual only).

### G3 — `src/checkpoint/recovery.ts` (NEW) + extend `runResume`

- Pure `recoveryActions(ledger): string[]`:
  - `pending` -> `"run sub <name>"`
  - `failed` (fail_count n) -> `"sub <name> failed <n>x — investigate before retry"`
  - entry whose evidence ref is missing -> `"artifact for <name> missing — re-run to regenerate"`
  - all done/skipped -> `["all subs resolved — run: harnessed next"]`
- `ResumeResult` (resume.ts L13) `ok` variant gains `recoveryActions: string[]`.
  Existing snapshot + `driftWarn` behavior unchanged.

### G4 — `src/checkpoint/injectState.ts` (NEW hook body) + installer wiring

- Node hook (NOT Python — harnessed is Node/TS): walk-up from cwd to find `<harnessed-root>`,
  read `current-workflow.json`, emit a `<workflow-state>` block:
  phase, status, next pending sub (via `nextPending`), and any `fail_count >= 3` warnings.
  No state file / corrupt -> silent `exit 0` (mirror `readCurrentWorkflow` fail-soft).
- harnessed installer writes a `UserPromptSubmit` hook entry into `.claude/settings.json`
  at the active install scope (global `~/.claude` or local `./.claude`, following the
  existing install-scope resolution).

### G6 — `fail_count` + `src/checkpoint/breakLoop.ts` (NEW)

- `markSub` (ledger.ts L75) increments `fail_count` when `status` transitions to `'failed'`
  (carry-forward + 1; absent -> 1). Other transitions leave `fail_count` untouched.
- Pure `detectLoop(ledger): Array<{ sub: string; count: number }>` — entries with
  `fail_count >= 3`.
- `checkpoint fail` path: when `detectLoop` is non-empty, surface a break-loop directive and
  append a knowledge-capture stub to `.planning/` (GSD lessons file); no `.planning/` ->
  fall back to a harnessed `findings` file.
- The Trellis 5-dimension root-cause framework (missing-spec / cross-layer / propagation /
  coverage / assumption) ships as a `break-loop` **skill prompt doc**, NOT code.

### G7-lite — `rejected` sub-status

- `SubProgressEntry.status` union gains `'rejected'` (sub-level, additive).
- `markSub` accepts `'rejected'`; `harnessed reject <sub>` CLI subcommand sets it.
- Terminal sub state — `nextPending` ignores it (same as `done` / `skipped`).
- Distinct from `failed`: `failed` = could not complete (retryable, drives G6);
  `rejected` = user-abandoned (terminal, no retry).

## Error handling

All collectors / guards fail-soft, mirroring `readCurrentWorkflow` null-on-corrupt:
- git absent or no merge-base -> `changedFiles = 0`.
- no `.planning/` -> `requirements = 0`.
- corrupt / missing state file -> hook silent exit; CLI prints "no active workflow".
No new throw sites in the read path. Writes keep the existing `withLock` + atomic-write +
`Value.Check`-before-write guarantees (state.ts).

## Concurrency

`fail_count` increment and `verify_mode` write go through the existing
`mutateSubProgress` / `writeCurrentWorkflow` single-lock read-modify-write (state.ts L137)
— no new lock surface, no lost-update window.

## Testing (TDD mandatory — state machine core)

- `scale.test.ts` — threshold boundaries (5/6 files, 4/5 subs, 3/4 reqs), all-absent -> light.
- `nextStep.test.ts` — pending->auto, pending+!autoTransition->manual+hint, none->done,
  env > envelope > default precedence.
- `recovery.test.ts` — each sub-state -> expected action string; all-resolved sentinel.
- `breakLoop.test.ts` — fail_count < 3 -> empty; >= 3 -> flagged with count.
- `injectState.test.ts` — `<workflow-state>` snapshot; no state -> empty/silent.
- `markSub` (extend ledger test) — fail_count increment on ->failed; rejected transition;
  fail_count untouched on ->done.
- `schema` parity test — old files (no new fields) pass `Value.Check`; top-level
  `WorkflowStatus` union unchanged (D-02 regression guard).

## Build order (dependencies)

1. Schema changes (unblocks everything; additive).
2. `markSub` fail_count + `rejected` (ledger; unblocks G6 detection + G7).
3. G1 scale, G2 nextStep, G3 recovery (independent pure modules over the new schema).
4. G6 breakLoop (depends on fail_count from step 2).
5. G4 injectState hook + installer wiring (depends on read path; independent of 3/4).
6. CLI subcommands `next` / `reject` + verify-path `verify_mode` wire-in.
7. `break-loop` skill prompt doc (G6 non-code half).
