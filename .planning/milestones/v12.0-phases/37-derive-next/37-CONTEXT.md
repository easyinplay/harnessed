# Phase 37 — deriveNext core (W1)

> v12.0 Forward Continuation, Wave 1. Plan SoT = `.planning/specs/2026-06-30-forward-continuation-design.md` (D1 + D2 + ACs). This CONTEXT is a pointer, not a re-spec.

## Goal

Pure forward-advance core, NO surface changes: scan `.planning/` disk state → derive the next work unit (sub / phase / done / blocked). Floor = phase-level (OQ-2). Stateless, artifact-derived (OQ-3). Graceful without GSD (AC8). Existing `harnessed next`/CLI untouched (that is W2/P38).

## Deliverables

- `src/checkpoint/planningScan.ts` (D2) — impure best-effort disk snapshot reader.
- `src/checkpoint/deriveNext.ts` (D1) — pure resolver over the snapshot.
- `tests/checkpoint/deriveNext.test.ts` (+ planningScan as needed) — TDD, fixtured `.planning/`.

## Locked decisions (discuss-phase 2026-06-30)

- OQ-2: phase-level advance is the floor; task-level checkbox iteration is an optional stretch (stub/flag, don't block W1 on it).
- OQ-3: `phases/NN-*/` dir scan is the primary SoT; phase complete ⇔ every `NN-*-PLAN.md` has a matching `NN-*-SUMMARY.md` (artifact-derived, naturally skips shipped). `gsd_run query` reuse is W3 (P39), not W1.

## Acceptance (spec §5): AC2 phase-boundary · AC3 resume-first-incomplete · AC4 mid-insertion · AC5 done · AC8 no-GSD graceful · AC9 backward-compat sub.
