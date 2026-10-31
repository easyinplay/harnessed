# Phase 81 Task Plan: Open Issues Triage And Repair

Date: 2026-10-31. Status: complete locally; commit, push, CI, issue closure, tag, and release not executed.

## Goal

Triage GitHub issues #28-#33 against the current main worktree, prove whether each report is a real defect or a non-issue, and implement the smallest verified repair for every confirmed defect without weakening Phase 80 ownership and deletion safety.

## Disposition Contract

Each issue must end in exactly one state:

- `confirmed-fixed`: the current worktree reproduces the defect, a bounded repair is implemented, and focused tests prove the new behavior.
- `already-fixed`: the issue reproduction fails because an existing commit or current Phase 80 change already implements the required behavior; evidence names the code and test.
- `non-issue`: the reported expectation is intentionally unsupported or the reproduction relies on a false premise; evidence includes a negative test or executable trace.
- `needs-real-host-validation`: code and fixture evidence are insufficient for a host-specific claim; keep the issue open with an explicit validation command.

## Workstreams

| Workstream | Issues | Ownership | Acceptance |
| --- | --- | --- | --- |
| W1 Hook and host pin identity | #28, #29 | `src/installers/**`, `src/platform/**`, setup-focused tests | Third-party hooks remain untouched; one host setup cannot corrupt the other host pin |
| W2 Uninstall symmetry and atomic settings | #30, #31 | npm teardown manifests/installers, settings writers, focused tests | Declared global packages and owned browser cache have honest teardown semantics; every settings mutation is atomic or proven read-only |
| W3 Checkpoint concurrency and failed state | #32, #33 | `src/checkpoint/**`, checkpoint CLI/resume, focused tests | Concurrent completes do not lose ledger updates; failed checkpoints are machine-readable and resume cannot report success |

## Execution Order

1. Reproduce or refute each issue against the current worktree.
2. Record issue-specific disposition before broad refactoring.
3. Add focused regression tests before or with the smallest repair.
4. Run focused tests, typecheck, Biome, and `git diff --check`.
5. Re-run the full suite only after all three workstreams integrate.
6. Keep commit, push, release, and GitHub issue closure separate until local evidence is complete.

## Non-Goals

- Do not reopen or rewrite Phase 80 implementations for #14-#27 unless a new issue proves a direct regression.
- Do not classify an issue as non-issue from code reading alone when an executable regression test is feasible.
- Do not delete or commit local diagnostic files under `.tmp/` or the root scratch files listed in Phase 80.
- Do not publish, tag, or close GitHub issues in this phase without a separate user instruction.

## Checklist

- [x] #28 disposition and evidence
- [x] #29 disposition and evidence
- [x] #30 disposition and evidence
- [x] #31 disposition and evidence
- [x] #32 disposition and evidence
- [x] #33 disposition and evidence
- [x] Integrated focused verification
- [x] Full verification and Phase 81 status update

## Final Disposition

| Issue | Disposition | Evidence |
| --- | --- | --- |
| #28 | `confirmed-fixed` | Unified hook identity trusts only the captured `assetsRoot`, the standard compiled transport, and bare-token or trusted-relative forms; exact-basename third-party paths such as `C:/vendor/harnessed/bin/...` remain untouched. Path comparison case-folds only Windows drive and UNC forms; POSIX paths require exact case. |
| #29 | `confirmed-fixed` | `setup --platform` writes only the selected host pin; cross-host pin preservation is covered by setup-platform tests. |
| #30 | `non-issue` | CodeGraph upstream teardown owns the global package; Playwright CLI 0.1.22 has no browser-uninstall command and its cache is shared, so harnessed must not recursively delete it. Manifest comments and contract tests record this ownership boundary. |
| #31 | `confirmed-fixed` | Setup install, per-manifest uninstall, and unified uninstall use atomic settings writes with temporary-file cleanup. Failure tests preserve the original JSON. |
| #32 | `confirmed-fixed` | Shared ledger RMW requires the shared lock; retry budget is increased to bounded contention handling, with a real one-second lock-holder test preserving four concurrent updates. |
| #33 | `confirmed-fixed` | Checkpoint envelopes support `failed`; `resume` exits 1 for new failed status and legacy `complete` plus `FAILED:` remains failure-compatible. |
| #14 | `confirmed-fixed` | Unified uninstall excludes `backups` and retains the state root; direct regression test covers data preservation. |
| #15 | `confirmed-fixed` | Host-aware teardown and `migrateLegacyHarnessedRoot(context)` use the captured host state root; ambiguous dual-home selection fails closed. |
| #16 | `confirmed-fixed` plus `non-issue` subclaim | `CHANGELOG.md` is packaged and `prepack: npm run build` is executed by real `npm pack`; the claim that `prepublishOnly` is required is false. |

## Final Review Repairs

- Unified hook identity no longer claims third-party exact-basename paths outside the trusted forms.
- Nested replay recomputes `nested_expansion.start` after earlier siblings expand, keeping the root ledger and replay matched.
- Publish resolves and prints the immutable commit SHA after the initial tag checkout; binary jobs checkout that SHA.
- The exact official GSD Codex uninstall command dispatches only through the strict identity/upstream/install/uninstall/empty-cleanup allowlist; every override remains fail-closed.
- Final read-only review corrected path comparison semantics: only Windows drive and UNC paths case-fold, while POSIX paths remain exact-case; POSIX case-variant, Windows drive, and UNC regressions cover the boundary.

## Verification

- Final post-review focused gate: 12 files / 235 tests passed, first 9/138 and then 3/97.
- Final hook case fix focused gate: 5 files / 85 tests passed.
- Full Vitest: 413 files passed, 4 skipped; 5,273 tests passed, 43 skipped, 1 todo.
- Coverage: 87.62% statements, 82.22% branches, 90.56% functions, 89.14% lines.
- `corepack pnpm typecheck`, `corepack pnpm build`, `corepack pnpm validate:schema`, docs 30/30, targeted Biome, and `git diff --check` passed.
- A real `npm pack --dry-run --json` produced `harnessed@5.0.5` with 201 entries: `CHANGELOG.md`, 9 `dist` entries, and `workflows/*` are present; no `skills/*` entries are present.
