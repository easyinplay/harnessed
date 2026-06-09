---
phase: 5.1
plan: w1
subsystem: cli/audit-log
tags: [R10.1, audit-log, jq, redact, TDD, subcommand]
dependency_graph:
  requires: [phase-5.1-w0, phase-4.3-R8.1-producer]
  provides: [harnessed-audit-log-subcommand, R10.1-consumer]
  affects: [src/cli.ts, src/cli/audit-log.ts, tests/cli/audit-log.test.ts]
tech_stack:
  added: []
  patterns: [jq-spawn-argv-mode, consumer-redact-5-pattern, dual-format-human-json, pagination-tail-head-reverse, TDD-red-green-refactor]
key_files:
  created:
    - src/cli/audit-log.ts
    - tests/cli/audit-log.test.ts
    - .planning/phase-5.1/DOGFOOD-T1.X.md
  modified:
    - src/cli.ts
decisions:
  - "D-01 jq subprocess spawn(argv-mode, shell:false) — STRIDE T mitigation confirmed"
  - "D-04 consumer 2nd-layer redact 5 patterns applied to task_excerpt LAST in pipeline"
  - "Rule 1: jq ENOENT error handler added (clean degradation vs crash)"
  - "Rule 1: TDD test readFileSync mock type fix (TS2345 strict build)"
metrics:
  duration: "~45 minutes"
  completed_date: "2026-05-19"
  tasks_completed: 4
  files_changed: 4
---

# Phase 5.1 Wave 1: R10.1 audit log --filter consumer Summary

**One-liner**: `harnessed audit-log` 13th CLI subcommand — jq subprocess filter + dual-format human/JSON + 3-flag pagination + 5-pattern CSO redact defense-in-depth, TDD red-green-refactor 8 cells, 162L Karpathy PASS.

## Tasks Completed

| Task | Commit | Files | LoC | Status |
|------|--------|-------|-----|--------|
| T1.2 TDD RED | `9906f99` | tests/cli/audit-log.test.ts NEW | 239L | PASS |
| T1.1 GREEN | `0c24982` | src/cli/audit-log.ts NEW + test fixes | 152L + 7Δ | PASS |
| T1.3 register | `9f9221e` | src/cli.ts +2L | 2L | PASS |
| T1.4 DOGFOOD | `40bfc27` | .planning/phase-5.1/DOGFOOD-T1.X.md NEW | 128L | PASS |
| Rule 1 fix | `0a1368c` | audit-log.ts +12L, test -1L | 12L | PASS |

## TDD Gate Compliance

- RED gate: `9906f99` `test(phase-5.1-w1):` commit — 8 cells failing (ERR_MODULE_NOT_FOUND)
- GREEN gate: `0c24982` `feat(phase-5.1-w1):` commit — all 8 cells passing
- REFACTOR: `0a1368c` `fix(phase-5.1-w1):` — Rule 1 bug fix (still 8/8 PASS)

Both RED and GREEN gate commits present. TDD discipline followed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] jq ENOENT crash → clean error handler**
- **Found during:** T1.4 DOGFOOD axis B (jq not on PATH on Windows machine)
- **Issue:** `pipeToJq()` had no `error` event handler; `spawn jq ENOENT` caused unhandled Node.js crash
- **Fix:** Added `child.on('error', ...)` handler — ENOENT emits `✗ jq not found in PATH — run: harnessed doctor` + resolve(1); other errors reject
- **Files modified:** `src/cli/audit-log.ts` L53-65
- **Commit:** `0a1368c`

**2. [Rule 1 - Bug] TDD test readFileSync mock type error**
- **Found during:** `npm run build` (tsc --noEmit strict mode)
- **Issue:** `readFileSyncMock.mockReturnValue(lines.join('\n') as unknown as Buffer)` TS2345 strict type mismatch
- **Fix:** Removed cast — `mockReturnValue(lines.join('\n'))` plain string (vitest mock accepts it)
- **Files modified:** `tests/cli/audit-log.test.ts` L95
- **Commit:** `0a1368c`

**3. [Rule 1 - Bug] Test cells 5/6/8 assertion mismatch**
- **Found during:** First GREEN run (cells 5/6/8 failed)
- **Issue:** Tests checked `stdout.toContain('[REDACTED]')` but human table 5-col intentionally omits `task_excerpt` field; redact is applied but not visible in human table output
- **Fix:** Changed cells 5/6/8 to use `--json` flag (shows full 12-field including redacted `task_excerpt`)
- **Rationale:** D-02 design correct — human table shows 5 condensed cols; redact verification requires `--json` opt-in
- **Files modified:** `tests/cli/audit-log.test.ts` cells 5/6/8
- **Commit:** `0c24982`

## Verification

### Test Results
- Baseline: 720 tests passing
- Post-Wave 1: **728 tests passing** (+8 new cells, 0 regression)
- `npm run build` exit 0 (tsc --noEmit + tsup)

### DOGFOOD 3-axis
- Axis A (smoke): `harnessed audit-log --tail 10` → human table 5-col renders 10/77 real records, exit 0 PASS
- Axis B (filter): jq absent on machine → `✗ jq not found in PATH — run: harnessed doctor` + exit 1 (clean degradation PASS; vi.mock cell 3 verifies spawn args D-01)
- Axis C (redact): all 5 patterns verified via TDD cells 5/6/8; real audit.log contains no sensitive patterns

### Karpathy ≤200L
- `src/cli/audit-log.ts`: 162L (≤200L PASS, 38L headroom)
- `tests/cli/audit-log.test.ts`: 242L (test file — Karpathy limit applies to implementation only)

### 13th subcommand registration
- `harnessed --help` lists `audit-log` after `audit` (separate semantic domain confirmed)
- `harnessed audit-log --help` shows all 5 flags (--filter/--tail/--head/--reverse/--json)

## Known Stubs

None — all data paths wired to real `.harnessed/audit.log` JSONL producer (Phase 4.3 R8.1).

## Threat Flags

None — all threat mitigations from PLAN.md threats_open implemented:
- STRIDE T (path traversal): `AUDIT_PATH` hardcoded literal, no user-input derivation
- STRIDE T (shell injection): `spawn('jq', [filterExpr], {shell:false})` argv-mode confirmed
- STRIDE I (redact bypass): 5 patterns applied LAST in pipeline (paginate→redact→jq→render)

## Self-Check

Files created:
- `src/cli/audit-log.ts` — FOUND
- `tests/cli/audit-log.test.ts` — FOUND
- `.planning/phase-5.1/DOGFOOD-T1.X.md` — FOUND

Commits:
- `9906f99` TDD RED — FOUND
- `0c24982` T1.1 GREEN — FOUND
- `9f9221e` T1.3 register — FOUND
- `40bfc27` T1.4 DOGFOOD — FOUND
- `0a1368c` Rule 1 fix — FOUND

## Self-Check: PASSED
