# Phase 38 — next/advance CLI surface (W2) — SUMMARY

> v12.0 Forward Continuation, Wave 2 (D3 + D4). Builds on W1 (`deriveNext.ts` + `planningScan.ts`).
> Status: COMPLETE — biome clean, tsc 0 errors, vitest 548/0 (cli + checkpoint dirs).

## What shipped

- **D3 — extended `harnessed next`** (`src/cli/next.ts`): preserves the intra-workflow
  sub contract (`NEXT: auto|manual|done` + SUB/HINT, exit 0) when a workflow is
  mid-flight (AC9). When the sub-ledger resolves to `done`, it now falls through to
  `scanPlanning` → `deriveNext` → cross-unit contract with a driver-distinguishable
  exit code (0 advance / 2 done / 10 blocked).
- **D4 — new `harnessed advance`** (`src/cli/advance.ts`): the act half of the
  gsd-pi next(read)/advance(act) split. Print-only (OQ-1) — emits the command for the
  main session to run, never seeds `current-workflow.json`, never spawns. Carries the
  comet **advance-gate** + `--json` + `--force`.
- **Shared pure resolvers** (`src/checkpoint/forwardStep.ts`, NEW): `resolveForwardStep`
  (next) + `resolveAdvance` (advance) map `NextUnit` → `{next, exitCode, lines, json}`.
  Karpathy testability seam — the CLI handlers are thin (read → resolve → print → exit).
- Registered `registerAdvance` in `src/cli.ts` next to `registerNext`.

## Files

| File | Change |
|---|---|
| `src/checkpoint/forwardStep.ts` | NEW — `resolveForwardStep`, `resolveAdvance`, `describeUnit`, gate |
| `src/cli/next.ts` | EDIT — done-branch fall-through to forward continuation (D3) |
| `src/cli/advance.ts` | NEW — `harnessed advance` (D4, gated, print-only) |
| `src/cli.ts` | EDIT — import + `registerAdvance(program)` |
| `tests/cli/next-advance.test.ts` | NEW — 17 cells (pure resolvers + CLI exit codes) |
| `tests/cli/next.test.ts` | EDIT — pin cwd to empty dir (done-branch now scans .planning) |

## Exit-code contract (D3/D4)

`0` advance · `2` done · `10` blocked (failed sub, human decision) · `11` gate-reject
(refuse to skip an earlier incomplete phase) · `1` error.

## Advance-gate (comet lesson)

`detectGate` refuses forward advance when either:
1. `deriveNext` returns `blocked` (failed sub, fail-CLOSED → exit 10), or
2. the derived next phase orders **before** the workflow pointer (an earlier phase was
   left incomplete while the pointer ran ahead → exit 11).

`--force` overrides the gate, prints an `AUDIT:` note, and proceeds (exit 0).

## Output samples (real `dist/cli.mjs` against a fixtured .planning)

```
# advance — 16 complete, 17 next                       exit 0
ADVANCE: advance
UNIT: phase 17 'beta'
→ run /auto "phase 17 'beta'"

# advance --json                                        exit 0
{"next":"advance","unit":"phase 17 'beta'","hint":"→ run /auto \"phase 17 'beta'\""}

# next — 16 complete, 17 next                           exit 0
NEXT: advance
UNIT: phase 17 'beta'
HINT: run /auto (or harnessed advance) to start it — 1 phase remain

# advance / next — all phases complete                  exit 2
ADVANCE: done — all phases complete
NEXT: done
```

Gate-reject + blocked (verified via the `resolveAdvance`/`resolveForwardStep` tests,
not fixture-reachable through the real CLI because they need a global active-workflow
pointer):

```
# advance — pointer at 17 but 16 incomplete             exit 11
ADVANCE: refused — phase 16 is incomplete but the workflow pointer ran ahead to 17
UNFINISHED: phase 16 'alpha'
HINT: finish it, or pass --force to override (records an audit note)

# advance --force (same scenario)                       exit 0
AUDIT: --force override — advancing past unfinished phase 16 'alpha' (...)
ADVANCE: advance
UNIT: phase 16 'alpha'
→ run /auto "phase 16 'alpha'"

# next — resolved-but-failed sub                         exit 10
NEXT: blocked
UNIT: task-code
HINT: sub 'task-code' failed 2x — resolve before advancing
```

## AC coverage

- **AC2** (phase boundary → advance + exit 0): pure + CLI tests — PASS
- **AC5** (all complete → done + exit 2): pure + CLI tests — PASS
- **AC6** (advance-gate refuse + `--force`): pure + CLI tests — PASS
- **AC9** (mid-flight sub contract unchanged): CLI test — PASS
- blocked (exit 10) + advance `--json` shape — PASS

## Notes / trade-offs

- `includeTasks: false` (OQ-2 phase-level floor). HINT reports "N phases remain"; task
  rows are not surfaced by the CLI yet (resolver supports them via `kind:'task'`).
- Dedicated exit `11` for gate-reject (vs reusing `10`) so the driver loop can tell a
  failed-sub block from a skipped-phase refusal. Both are non-zero → both stop
  `while harnessed advance --json; do : ; done`.
- `resolveNext`/`nextStep.ts` contract untouched (AC9 + existing tests green).
- W3 (D5 gsd_run reuse / D6 injectState + bin parity) NOT touched.
