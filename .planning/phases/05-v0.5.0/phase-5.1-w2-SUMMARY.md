---
phase: "5.1"
plan: "w2"
subsystem: checkpoint/lock + cli/status + docs/adr
tags: [R10.2, proper-lockfile, state-lock, LockHeldError, TDD, ADR-0021, A7-conservation, ship-cadence]
dependency_graph:
  requires: [phase-5.1-w1, phase-4.3]
  provides: [R10.2-state-lock, adr-0021, ci-a7-0021, wave2-ship-artifacts]
  affects: [src/checkpoint/state.ts, src/checkpoint/engineHook.ts, src/cli/status.ts, docs/adr/0021]
tech_stack:
  added: [proper-lockfile@4.1.2, "@types/proper-lockfile@4.1.4"]
  patterns: [dir-level-lockfile, withLock-generic, vi.hoisted-cjs-mock, TDD-red-green-refactor]
key_files:
  created:
    - src/checkpoint/state.ts (modified: +39L lock impl, 77L→116L)
    - src/checkpoint/engineHook.ts (modified: +4L transitive comments, 48L→52L)
    - src/cli/status.ts (modified: +27L D-07 lock display, 31L→58L)
    - tests/checkpoint/state-lock.test.ts (NEW 113L — 5 TDD cells)
    - docs/adr/0021-state-lock-and-audit-consumer.md (NEW 174L)
    - .planning/phase-5.1/DOGFOOD-T2.X.md (NEW 86L)
    - .planning/RETROSPECTIVE.md (modified: Phase 5.1 section appended)
    - .planning/STATE.md (modified: Phase 5.1 SHIPPED 163L ≤ 165L gate)
  modified:
    - package.json (+proper-lockfile runtime dep)
    - pnpm-lock.yaml (auto-regenerated)
    - docs/adr/README.md (+ADR 0021 index row)
    - .github/workflows/ci.yml (A7 step iter 0018→0021)
    - PROJECT-SPEC.md (Phase 5.1 SHIPPED transparency marker)
decisions:
  - "D-05 LOCKED: proper-lockfile@4.1.2 (5M weekly downloads, MIT, cross-OS, dir-level lock)"
  - "D-06 LOCKED: bounded retry 3×100ms exp backoff (stale:10_000, retries:{retries:3,factor:2,minTimeout:100})"
  - "D-07 LOCKED: NO --force; status.ts lockfile.check() + stat mtime + STALE suffix if age>10s"
  - "D-08 LOCKED: dir-level lock .harnessed/.lock (not per-file; coarse granularity appropriate v0.5)"
  - "W-01 Path A: state.ts self-locks via writeCurrentWorkflow; engineHook calls transitively — no double-lock deadlock"
  - "vi.hoisted() required for CJS default-export package mocks in vitest (lockMock/releaseMock hoisted before vi.mock factory)"
  - "A7 Conservation: ci.yml A7 step retroactively extended 0018→0021 (0019+0020 were missing — critical CI gap fixed)"
metrics:
  duration: "Wave 2 ~4h (T2.1-T2.16)"
  completed: "2026-05-19"
  tasks_completed: 14
  files_changed: 14
  tests_baseline: 728
  tests_final: 733
  new_tests: 5
---

# Phase 5.1 Wave 2: R10.2 State Lock + ADR 0021 + Ship Artifacts Summary

**One-liner:** `proper-lockfile@4.1.2` dir-level write lock wrapping `writeCurrentWorkflow` via `withLock<T>` generic + `LockHeldError` actionable hint + D-07 `status.ts` lock display + ADR 0021 9-section PRIMARY + ci.yml A7 retroactive iter 0018→0021 + 5 TDD cells (733 tests total).

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| T2.1 | proper-lockfile dep install | 6103ee8 | package.json, pnpm-lock.yaml |
| T2.4 RED | state-lock.test.ts TDD RED | d1a7489 | tests/checkpoint/state-lock.test.ts |
| T2.2+T2.4 GREEN | state.ts lock + test GREEN | 50489de | src/checkpoint/state.ts, tests/checkpoint/state-lock.test.ts |
| T2.3 | engineHook transitive comments | ae62348 | src/checkpoint/engineHook.ts |
| T2.5 | status.ts D-07 lock display | 2369bbd | src/cli/status.ts |
| T2.6 | ADR 0021 PRIMARY | e2892d5 | docs/adr/0021-state-lock-and-audit-consumer.md |
| T2.7 | ADR README index | c6451d5 | docs/adr/README.md |
| T2.8 | ci.yml A7 iter 0018→0021 | 0e5856c | .github/workflows/ci.yml |
| T2.11 | DOGFOOD-T2.X.md 3-axis PASS | 5ed4029 | .planning/phase-5.1/DOGFOOD-T2.X.md |
| T2.12 | RETROSPECTIVE.md Phase 5.1 | 2e4e282 | .planning/RETROSPECTIVE.md |
| T2.13 | STATE.md + PROJECT-SPEC.md | 628119b | .planning/STATE.md, PROJECT-SPEC.md |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.hoisted() required for CJS default-export mock**
- **Found during:** T2.4 RED (first test run)
- **Issue:** `const lockMock = vi.fn()` at module scope referenced inside `vi.mock()` factory → "Cannot access 'lockMock' before initialization" ReferenceError at runtime. CJS default-export packages require hoisting before factory evaluation.
- **Fix:** Wrapped `lockMock` + `releaseMock` in `vi.hoisted(() => { ... return { lockMock, releaseMock } })` per vitest CJS mock hoisting requirement.
- **Files modified:** `tests/checkpoint/state-lock.test.ts`
- **Commit:** 50489de (combined with GREEN)

**2. [Rule 1 - Bug] Cell 4 over-engineered first draft incompatible with vi.mock hoisting**
- **Found during:** T2.4 RED iteration
- **Issue:** Initial cell 4 used `vi.doMock` + writeFile mock injection inside test body — incompatible with vi.mock hoisting pattern established in cells 1-3.
- **Fix:** Simplified cell 4 to "non-ELOCKED error propagates, release never acquired" — tests the actual contract cleanly without fighting vitest internals.
- **Files modified:** `tests/checkpoint/state-lock.test.ts`
- **Commit:** 50489de

**3. [Rule 2 - Missing Critical] STATE.md SIZE_LIMIT gate violation (167/168L > 165L)**
- **Found during:** T2.13 post-write gate check
- **Issue:** After Phase 5.1 SHIPPED narrative added, STATE.md exceeded 165L SIZE_LIMIT (ENFORCE=true). Script uses `split(/\r?\n/).length` (wc+1 on Windows CRLF). Required 3 rounds of trimming: condensed "下一 phase" line, removed standalone "Note (D-04 HYBRID 2-clock)" line, removed DEFERRED #AF/#AG resolved carry items.
- **Fix:** Iteratively trimmed 5L; final 163L (script counts 164L ≤ 165L = PASS).
- **Files modified:** `.planning/STATE.md`
- **Commit:** 628119b

**4. [Rule 2 - Missing Critical] transparency-verdicts ENFORCE=true gate failure**
- **Found during:** T2.13 CI gate verify
- **Issue:** `scripts/check-transparency-verdicts.mjs` requires "Phase 5.1 SHIPPED" literal in PROJECT-SPEC.md 状态 line. Was absent after initial STATE.md update.
- **Fix:** Prepended `**Phase 5.1 SHIPPED 2026-05-19** — R10.1 audit-log.ts 162L consumer + R10.2 state.ts 116L lock + ADR 0021 + ci.yml A7 0018→0021 + 733 tests` to the status line in PROJECT-SPEC.md.
- **Files modified:** `PROJECT-SPEC.md`
- **Commit:** 628119b

**5. [Rule 1 - Bug] biome import ordering violation in state.ts**
- **Found during:** T2.2 GREEN post-edit biome check
- **Issue:** `import lockfile from 'proper-lockfile'` written before `node:` imports. Biome enforces node: imports first in import group ordering.
- **Fix:** `pnpm exec biome check --write` auto-reordered to place `import { mkdir, readFile, writeFile } from 'node:fs/promises'` before third-party imports.
- **Files modified:** `src/checkpoint/state.ts`
- **Commit:** 50489de

**6. [Rule 3 - Blocking] @types/proper-lockfile missing**
- **Found during:** T2.2 GREEN tsc --noEmit check
- **Issue:** `proper-lockfile` has no bundled TypeScript types; tsc errors on import without type declarations.
- **Fix:** `pnpm add -D @types/proper-lockfile` (4.1.4 installed); added to devDependencies.
- **Files modified:** `package.json`, `pnpm-lock.yaml`
- **Commit:** 6103ee8 (backfilled into T2.1 dep install commit)

---

## TDD Gate Compliance

| Gate | Commit | Message |
|------|--------|---------|
| RED (test) | d1a7489 | `test(phase-5.1-w2): T2.4 RED — tests/checkpoint/state-lock.test.ts NEW 5 TDD RED cells` |
| GREEN (feat) | 50489de | `feat(phase-5.1-w2): T2.2+T2.4 GREEN — state.ts R10.2 lock wrap + state-lock.test.ts 5 cells PASS` |

RED gate commit precedes GREEN gate commit. No REFACTOR commit required (implementation clean post-GREEN, biome pass).

---

## W-01 Lock Level Resolution (Path A)

PLAN-CHECK posed ambiguity: lock at `engineHook.ts` level vs `state.ts` (`writeCurrentWorkflow`) level.

Verification: `grep -r writeCurrentWorkflow src/ | grep -v state.ts | grep -v import` = 0 results. No direct callers outside `state.ts` itself. `engineHook.ts` calls `stateActivate` / `stateComplete` which call `writeCurrentWorkflow` transitively.

**Resolved Path A:** `state.ts` self-locks inside `writeCurrentWorkflow`. `engineHook.ts` receives transitive lock protection with no double-lock deadlock risk. Two inline comments added to `engineHook.ts` documenting the resolution for future maintainers.

---

## A7 Conservation

- ADR 0001-0020 main body: 0 diff (verified via ci.yml A7 step)
- ci.yml A7 step extended: `0018→0021` (retroactive — 0019 + 0020 were missing from loop since Phase 4.3/5.1 W0)
- Both for loops in A7 step updated: existence check loop + verify loop
- ADR 0021 accepted tag: `adr-0021-accepted` LOCAL CREATE at e2892d5 (not pushed per CLAUDE.md safety)

---

## DOGFOOD Verdict

3/3 axes PASS (DOGFOOD-T2.X.md):
- **Axis A Smoke:** `proper-lockfile` dep confirmed, `LockHeldError` class found, `.harnessed/.lock` lockfilePath confirmed, `harnessed status` shows `lock: free` (exit 0)
- **Axis B Functional:** 5-cell TDD suite PASS; full suite 733 passed | 4 skipped (0 regression from 728 baseline)
- **Axis C Edge:** `LockHeldError` verbatim message both required substrings PASS; STALE indicator in `status.ts` PASS; A7 `0019 0020 0021` both for loops updated PASS

---

## Known Stubs

None. All lock functionality fully implemented and wired. `status.ts` lock display wired to live `lockfile.check()` call. No placeholder values in UI-facing output paths.

---

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: supply-chain | package.json | +1 runtime dep `proper-lockfile@4.1.2` — new network-accessible package in dependency graph. Mitigated: 5M weekly downloads, MIT license, pnpm audit clean, lockfile pinned in pnpm-lock.yaml |

---

## Self-Check: PASSED

Files exist:
- `src/checkpoint/state.ts` — FOUND
- `tests/checkpoint/state-lock.test.ts` — FOUND
- `src/cli/status.ts` — FOUND
- `docs/adr/0021-state-lock-and-audit-consumer.md` — FOUND
- `.planning/phase-5.1/DOGFOOD-T2.X.md` — FOUND

Commits exist:
- 6103ee8 — T2.1 proper-lockfile dep
- d1a7489 — T2.4 RED
- 50489de — T2.2+T2.4 GREEN
- ae62348 — T2.3 engineHook comments
- 2369bbd — T2.5 status.ts lock display
- e2892d5 — T2.6 ADR 0021
- c6451d5 — T2.7 ADR README
- 0e5856c — T2.8 ci.yml A7 iter
- 5ed4029 — T2.11 DOGFOOD
- 2e4e282 — T2.12 RETROSPECTIVE
- 628119b — T2.13 STATE+PROJECT-SPEC
