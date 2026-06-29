# Phase 39 — per-turn current→next pointer (W3 / D6 + D5) — SUMMARY

> v12.0 Forward Continuation, Wave 3. Delivered D6 (per-turn NEXT-UNIT pointer, ts + bin parity). D5 (optional `gsd_run` reuse) DEFERRED with rationale.

## Status: COMPLETE

## (a) Files changed / created

- **EDIT** `src/checkpoint/injectState.ts`
  - `buildWorkflowStateBlock(wf)` → `buildWorkflowStateBlock(wf, forward?: NextPointer | null)` (optional, backward-compatible; pure).
  - new exported `interface NextPointer { unit: NextUnit; remainingPhases: number }`.
  - NEXT-UNIT line emitted in the block when `!next` (no pending sub) AND `forward.unit.kind` is `phase`|`task`. Placed right after the issue #2 ENGINE block (mutually exclusive with it).
  - `buildInjection` (impure) now computes the pointer: `nextPending(ledger) === null ? forwardPointer(repoRoot, wf) : null`, passed into the pure builder. New impure helper `forwardPointer()` calls `scanPlanning({ includeTasks: false })` + `deriveNext()` (W1 reuse), returns null for done/blocked.
- **EDIT** `bin/harnessed-inject-state.mjs` (plain-JS hot-path replica)
  - inlined plain-JS `scanPhases` / `describeUnit` / `deriveNextUnit` / `forwardPointer` mirroring the TS `planningScan` / `forwardStep.describeUnit` / `deriveNext` (phase-level floor, `includeTasks:false` → no task scan).
  - `workflowStateBlock(wf)` → `workflowStateBlock(wf, forward)` with the identical NEXT-UNIT line at the identical position.
  - main flow computes `forward` only when the ledger is resolved, then passes it in.
- **EDIT** `tests/checkpoint/injectState.test.ts`
  - AC7 unit tests (pure `buildWorkflowStateBlock`): NEXT-UNIT for phase next; `1 phase remain` singular; task-next description; NO NEXT-UNIT while a sub is pending (ENGINE owns it); NO NEXT-UNIT when pointer is null.
  - Phase 39 bin↔ts parity integration test: real `.planning/phases/` fixture (16 complete, 17 incomplete) → runs the bin, asserts the NEXT-UNIT line + `toBe(buildInjection(...))` byte parity.

## (b) NEXT-UNIT line — actual wording + parity confirmation

Verbatim (from the green parity test, phase 16 done / phase 17 incomplete):

```
NEXT-UNIT: current workflow complete → next is phase 17 'forward' (run /auto or `harnessed advance`); 1 phase remain
```

General form: `NEXT-UNIT: current workflow complete → next is <describeUnit(unit)> (run /auto or \`harnessed advance\`); N phase[s] remain`
- `<describeUnit>` reuses W2 `forwardStep.describeUnit`: phase → `phase 17 'name'`; task → `task 'X' in phase 16`.
- `N` = count of incomplete phases; singular/plural handled (`1 phase remain` / `3 phases remain`).

**ts↔bin byte parity: CONFIRMED.** The parity test asserts `expect(stdout).toBe(buildInjection(repoRoot, resolvedWf, '', DEFAULT_INJECT_BUDGET).trim())` and passes — the bin's stdout is byte-identical to the TS builder, NEXT-UNIT line included.

## (c) D5 — DEFERRED (to follow-on)

Native scan (W1 `planningScan.ts`) is the complete floor; AC8 (no GSD) holds. Deferred because adding `gsd_run query` reuse here would:
1. **Break ts↔bin parity in the D6 hot path.** The per-turn surface is the plain-JS bin (`harnessed-inject-state.mjs`), which is self-contained by design (no subprocess, no project imports — comment L8). If TS `scanPlanning` gained a `gsd_run` path, the TS `buildInjection` would diverge from the native-only bin whenever a GSD-compatible project is present → the `toBe` parity gate would flip red. Gating around it adds exactly the complexity the clean-bar (<40 lines, no complexity rise) forbids.
2. **Spawn a subprocess on every prompt turn.** D6 runs in the UserPromptSubmit hot path; `execSync('gsd_run …')` per turn is a latency regression against a path whose entire raison d'être (file header) is hot-path speed.
3. **Couple to gsd-tools' ROADMAP schema** — exactly what spec §3.2 warns against ("do NOT hard-couple to gsd-tools' parser").

D5's intended consumers per spec §4 are the W2 CLI surfaces (`harnessed next`/`advance`), not the per-turn pointer. A future wave may add it inside `planningScan.ts` guarded so the bin path stays native (e.g. an opt-in flag the hot path never sets). Recorded as follow-on; no scope lost — the native scan already resolves the next unit completely.

## (d) AC7 + parity gate results

- **AC7** (GIVEN resolved workflow + incomplete next phase, THEN breadcrumb carries `NEXT-UNIT: ... next is phase N`): PASS (pure unit tests + real-bin integration test).
- **bin↔ts parity** (`toBe`): PASS — byte-identical.
- `tsc --noEmit`: 0 errors. `biome check --write`: clean. `vitest run` (injectState + perturn-inject-manifest + deriveNext): **53/53 passed**.

## (e) Trade-offs / gray areas

- **`includeTasks:false` per spec instruction** → in the per-turn path `deriveNext` never returns a `task` unit (the phase branch is the floor, OQ-2 lean). Consequence: the spec's illustrative "N phases / **M tasks** remain" was reduced to **"N phases remain"** — `M` (remaining task count) is genuinely uncomputable without a task scan, and inventing it would be wrong. `describeUnit` still renders a `task`-kind unit correctly if a caller ever passes one (unit test covers it), so the builder is task-ready; only the per-turn wiring is phase-level by design.
- **Line placement**: NEXT-UNIT sits immediately after the ENGINE block (before BREAK-LOOP / SHIP-READY / VERIFY-MODE) in both ts and bin. ENGINE (pending sub) and NEXT-UNIT (subs resolved) are mutually exclusive, so they read as one "where are you / where next" pairing.
- **No state mutation**: pointer is derived from disk each turn ("derive, don't queue", spec §3.1); advisory tone, `</workflow-state>` remains the last line.
- Not touched (W2-owned, per brief): `src/cli/next.ts`, `src/cli/advance.ts`, `src/cli.ts`.
