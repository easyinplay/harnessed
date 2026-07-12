# Phase 37 — deriveNext core (W1) — SUMMARY

> v12.0 Forward Continuation, Wave 1. Plan SoT = `.planning/specs/2026-06-30-forward-continuation-design.md` (D1 + D2 + §5 ACs). Pure core + disk reader only; NO CLI / surface (W2/P38).

## What was built

- **D1 — `src/checkpoint/deriveNext.ts`** (pure resolver, schema-type-only, no I/O). `deriveNext(snapshot)` first-match-wins: pending sub → blocked (failed sub) → unchecked task (stretch) → first-incomplete phase → done. Owns the snapshot + `NextUnit` types (the pure core is the type home, mirroring `nextStep.ts`). Reuses `nextPending` (`ledger.ts:103`) for branch 1.
- **D2 — `src/checkpoint/planningScan.ts`** (impure best-effort reader). `scanPlanning(opts)` assembles the snapshot: `subProgress` + `currentPhase` from an injectable `currentWorkflow`, and a phase scan of `.planning/phases/NN-name/`. Per-phase artifact completion = `plans > 0 && summaries >= plans`. NN ordering is decimal-aware (`parseFloat`, supports `16.1` mid-insertion). Graceful (try/catch → safe-empty, never throws). Mirrors `injectState.ts:findPhaseContextExcerpt` style.
- **Tests — `tests/checkpoint/deriveNext.test.ts`** (TDD, written red-first). 13 tests over fixtured temp `.planning/` (`mkdtemp` + real PLAN/SUMMARY/task_plan files), exercising the real `scanPlanning` + `deriveNext` together.

## `deriveNext` return type

```ts
export type NextUnit =
  | { kind: 'sub';     sub: string }
  | { kind: 'task';    phase: string; task: string }
  | { kind: 'phase';   phase: string; name: string }
  | { kind: 'blocked'; unit: string; reason: string }
  | { kind: 'done' }

export function deriveNext(snapshot: PlanningSnapshot): NextUnit
```

`PlanningSnapshot` / `PhaseSnapshot` / `TaskSnapshot` are also exported from `deriveNext.ts` for W2 reuse.

## AC coverage (spec §5)

| AC | Covered | Note |
|----|---------|------|
| AC2 phase-boundary | ✅ | 16 complete, 17 incomplete → `{kind:'phase', phase:'17'}` |
| AC3 resume-first-incomplete | ✅ | pointer says 18, disk 16 has PLAN>SUMMARY → routes to 16 (pointer never read for routing) |
| AC4 mid-insertion | ✅ | `16.1` between 16 and 17, NN-sorted, no rebuild |
| AC5 done | ✅ | all SUMMARYs present; + multi-plan `summaries>=plans` edge cases |
| AC8 graceful no-GSD | ✅ | absent / empty `.planning/` → `{kind:'done'}`, no throw; no `gsd_run` dependency |
| AC9 backward-compat sub | ✅ | pending sub wins over phase advance; resolved ledger falls through |
| blocked | ✅ | failed sub (`fail_count>0`) → `{kind:'blocked'}` (minimal, as spec'd) |
| AC1 task-level (OQ-2 stretch) | ✅ (done, not deferred) | `includeTasks:true` → next `- [ ]` task; default off = phase-level floor |

AC6 (advance-gate) / AC7 (per-turn pointer) are W2/W3 surface — out of W1 scope.

## Gate results

- `biome check --write` — clean (only import reorder applied).
- `tsc --noEmit` — **0 errors** (incl. `noUncheckedIndexedAccess`: regex/index access narrowed via `m?.[1]` + `if (!num) continue`).
- `vitest run tests/checkpoint/deriveNext.test.ts` — **13 passed / 13**.

## Tradeoffs / notes

- `scanPlanning` is synchronous and takes an **injectable** `currentWorkflow` (default null) rather than calling async `readCurrentWorkflow` itself — keeps the reader pure-ish + testable over a fixtured `repoRoot`; W2's CLI wires `readCurrentWorkflow` and passes it in. (Spec D2 explicitly allows "接受传入".)
- Task-level granularity (OQ-2 stretch) was implemented rather than stubbed — it was a small, self-contained add and is gated behind `includeTasks` (default false = phase-level floor), so it cannot regress the W1 floor.
- `blocked` is minimal per spec: detects a current-ledger failed sub only (no VERIFICATION FAIL parsing yet — that can join in a later wave if needed).
- Biome gotcha hit + fixed: JSDoc comments must not contain the `*/` sequence (e.g. a literal `NN-*/` glob closed the block comment early and corrupted the file); rewrote comments to avoid it.

## No-touch confirmation

Did NOT touch `src/cli/next.ts`, `src/cli.ts`, `injectState.ts`, or any surface. No commit / push.
