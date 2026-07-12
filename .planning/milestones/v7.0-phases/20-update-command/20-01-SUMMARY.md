# Phase 20 SUMMARY — `harnessed update` command (follow-on)

> Executed in the MAIN session (TDD red→green), 2026-06-14. Hand-driven; survived a mid-execution terminal crash (state reassembled from disk, no rework lost). NOT yet committed — awaiting user review.

## Outcome

harnessed now has a GSD-style `update` command + a passive "update available" doctor surface, closing the `comet update` gap. Also folds in `--migration-report` (read-only stale-state inventory, borrowed from Chachamaru127/claude-code-harness `doctor --migration-report`).

## Tasks (TDD)

1. **version-check.ts** — pure `compareVersions` (current/behind/ahead/unknown; numeric segments, prerelease-below-release, malformed→unknown) + fail-soft `fetchLatestVersion` (injectable runner; `npm view harnessed version` by default; null on any failure, never throws). 7 tests.
2. **check-update.ts** (14th doctor check) — behind→`warn` (X→Y + run hint), current/ahead/npm-unreachable→`pass` (fail-soft, never flips the doctor summary). Registered in doctor-registry; the THREE doctor test files (`doctor.test.ts`, `doctor-fixtures.test.ts`, `unit/cli-doctor.test.ts`) bumped 13→14 + check-update module-mock added. 4 tests.
3. **install-base extract + update command** — extracted `installBaseProfile(opts)` from the `registerInstallBase` action (loop only, returns the tally; the action keeps print + `process.exit`). `update.ts`: `--check` (report only), default self-update via `npm i -g harnessed@latest` + CHANGELOG top + restart hint, `--upstreams`/`--all` re-runs `installBaseProfile`, `--migration-report` prints `collectMigrationReport` (read-only). `migration-report.ts`: existsSync inventory of legacy `current-workflow.json` / backup dirs / rogue-ref — deletes nothing. Registered as the 25th CLI command. 6 tests.
4. **Verify gate** — below.

## Decisions honored (20-CONTEXT.md)

- D1 self+upstreams flagged. D2 doctor-check surface. D3 `--check`. D4 global self-update (prints the npm invocation for non-global users). D5 install-base extract-and-delegate. D6 network fail-soft. D7 TDD. D8 `--migration-report` (read-only, deletes nothing).

## Safety (verified)

- **Zero real installs**: `update.test.ts` mocks `node:child_process` (`execFileSync`/`execFile`); the behind-path test asserts the mock received `['i','-g','harnessed@latest']` — `npm i -g` is never actually run.
- **install-base unchanged**: the refactor is extract-and-delegate; `registerInstallBase` still owns the print + exit codes. Full suite (which exercises install-base paths) stays green.
- **Doctor never false-fails**: checkUpdate is fail-soft; npm-unreachable → pass.

## Test-infra note

Three doctor test files mock `node:fs`/`node:child_process` and run the real registry, so each fs/network-using check is module-mocked. `unit/cli-doctor.test.ts` (a third, older doctor test) crashed because checkUpdate pulls version-check's `promisify(execFile)`, absent from its `child_process` mock — fixed by adding the check-update module-mock (the established per-check pattern), not by adding execFile (which would hang on the promisified mock).

## Evidence

- TDD: +17 tests (version-check 7, check-update 4, update 6).
- Typecheck: `tsc --noEmit` exit 0 (fixed a `noUncheckedIndexedAccess` tuple-index issue in compareVersions).
- Biome: 322 files clean.
- Full suite: **1302 passed | 5 skipped | 1 todo, 0 failed** (was 1285; +17).
- `git diff --stat`: ROADMAP + cli.ts + install-base.ts (extract) + doctor-registry + 3 doctor test files; untracked new: version-check.ts, check-update.ts, update.ts, migration-report.ts, 3 new tests, phase docs.

## Acceptance — all met

1. ✅ compareVersions 4 states + prerelease + malformed→unknown
2. ✅ checkUpdate behind→warn / current→pass / unreachable→pass
3. ✅ `update --check` reports, no install
4. ✅ `update` self-updates via `npm i -g harnessed@latest` (mock-asserted) + restart hint
5. ✅ `update --upstreams` calls installBaseProfile
6. ✅ doctor 14 checks + summary pass + all three doctor test files updated
7. ✅ install-base regression-free; full gate green; biome clean
8. ✅ `update --migration-report` read-only inventory, deletes nothing

## Not done / deferred

- `--sync`/`--reapply`/RC-channel flags (out of scope).
- Non-global install-scope detection (assumes global; prints the cmd).
- Phase 21: a first-class ship/release stage (the `verify`-terminal gap — comet/Trellis/Claude-Harness all have one; harnessed does not). Discussed, deferred to a separate phase.
