# Phase 89 — legacy-migration root-override isolation fix

Status: complete — committed `0e6b00b` + pushed; CI `42658347518` success
9/9 (2026-11-10); not published (no tag/release). Design settled by lead + independent second opinion;
recorded verbatim, not redesigned.

## Confirmed defect

`src/cli.ts` calls `migrateLegacyHarnessedRoot(captureHostInstallContext(...))`
for every non-update invocation. `captureHostInstallContext` deliberately does
NOT apply `HARNESSED_ROOT_OVERRIDE`, so `--version` under a root override still
moves `~/.harnessed` in the native home — proven on built CLI:

- native-absent (both hosts): legacy → `<home>/.claude|codex/harnessed`
- native-present (both hosts): legacy → `<home>/.harnessed.legacy-bak`,
  native dir untouched

## Settled fix (exact)

Top of `migrateLegacyHarnessedRoot` body in `src/platform/harnessedRoot.ts`,
before FS checks:

```ts
const override = process.env.HARNESSED_ROOT_OVERRIDE
if (override !== undefined && override !== '') return
```

No trim (matches `detectPlatform`), no redirect of legacy into the override,
no other behavior/API changes. Unset and empty env → migration unchanged.

## Tasks

- [x] T1 red: one failing unit case — nonempty override + legacy + native
      absent → migration must be skipped. `evidence/red-unit.log`
- [x] T2 impl: add the guard.
- [x] T3 green + extend unit table: hosts claude/codex, native absent/present,
      override path + whitespace override (both skip), legacy/native content
      + mtime preserved, no `.legacy-bak`, no override-target creation.
      Explicit unset + `''` still run normal migration.
- [x] T4 new `tests/integration/legacy-migration-cli-process.test.ts`:
      4 cells (both hosts × native absent/present), real `dist/cli.mjs`
      `--version` child, fake homes + pinned env.
- [x] T5 narrow gates: `corepack pnpm build` (dist refresh for process test),
      vitest 3 files `--no-file-parallelism`, `tsc --noEmit`,
      `biome check --write` changed/evidence files, `git diff --check`,
      `bin/` drift check.
- [x] T6 docs: CHANGELOG Fixed entry; phase progress/findings/VERIFICATION.

## Out of scope

- No redirect of legacy into the override; no suppressing all native writes
  (other ambient writes unaudited — no "CLI is read-only under override" claim).
- No `captureHostInstallContext`/`detectPlatform`/cli.ts signature changes.
- Only one final full-suite pass; results in `VERIFICATION.md`. No tags or publication.
