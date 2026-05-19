# Phase 5.1 W2 DOGFOOD — T2.1-T2.10 Empirical Evidence

**Date**: 2026-05-19
**Phase**: 5.1 Wave 2 (R10.2 state.ts concurrent write lock)
**Verdict**: 3/3 axes PASS
**Sister**: Phase 4.3 W2 DOGFOOD pattern延袭 (final wave empirical evidence before ship)

---

## Axis A — Smoke: proper-lockfile dep + state.ts lock wrap

### Dep verify
```
grep '"proper-lockfile"' package.json
  "proper-lockfile": "^4.1.2"    ← dependencies (runtime) PASS

grep 'class LockHeldError' src/checkpoint/state.ts
  export class LockHeldError extends Error {    ← PASS

grep "lockfilePath.*harnessed/.lock" src/checkpoint/state.ts
  lockfilePath: '.harnessed/.lock',    ← D-08 dir-level PASS
```

### harnessed status lock display
```
node dist/cli.mjs status
no installs recorded (.harnessed/state.json absent or empty)

lock: free
```
Exit code: 0. Lock display working (D-07 PASS).

---

## Axis B — Functional: TDD 5-cell lock test suite PASS

### state-lock.test.ts run
```
corepack pnpm test -- tests/checkpoint/state-lock.test.ts --run
Tests  5 passed (5)
```
- cell 1: serial lock acquire+release PASS
- cell 2: concurrent two calls both complete PASS
- cell 3: ELOCKED → LockHeldError verbatim message PASS
- cell 4: non-ELOCKED propagates (release not acquired) PASS
- cell 5: mkdir(.harnessed) + lock acquired on activate() PASS

### Full suite baseline
```
Tests  733 passed | 4 skipped (0 regression from 728 baseline)
```

---

## Axis C — Edge: LockHeldError message + STALE indicator

### LockHeldError verbatim (cell 3 verified)
```
'another harnessed process holds the lock at .harnessed/.lock
 — wait or kill stale process (try: harnessed status)'
```
Both required substrings: 'another harnessed process holds the lock' + 'harnessed status' PASS

### STALE indicator (status.ts)
```
grep -E "STALE|stale\?" src/cli/status.ts
  const stale = ageMs > 10_000
  ...${stale ? ' — STALE' : ''}...    ← PASS
```

### A7 step iter verify
```
grep "0019 0020 0021" .github/workflows/ci.yml | wc -l
  2    ← both for loops updated PASS
```

---

## Wave 2 verdict: PASS — ready for ship artifacts (T2.12-T2.16)

- R10.2 D-05/D-06/D-07/D-08 all implemented, tested, and verified
- 733 tests passing (728 baseline + 5 new lock cells)
- Build clean (tsc --noEmit + tsup success)
- proper-lockfile runtime dep installed + @types devDep
- ci.yml A7 iter extended 0018→0021 (retroactive + Phase 5.1)
- adr-0021-accepted LOCAL CREATE (NOT pushed per CLAUDE.md safety)
