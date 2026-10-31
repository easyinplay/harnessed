# Phase 81 Progress

## 2026-10-31

- Created Phase 81 with an explicit non-issue proof contract.
- Confirmed live Open issues #28-#33 and cached their bodies/comments under `.tmp/`.
- Split implementation into three disjoint workstreams: #28-#29, #30-#31, and #32-#33.
- #28, #29, #31, #32, #33 confirmed fixed with focused regression tests.
- #30 classified as non-issue because neither upstream teardown nor shared Playwright cache is safely attributable to harnessed.
- #14 confirmed fixed; uninstall preserves backups and state root.
- #15 residual confirmed fixed; legacy migration follows captured host context.
- #16 confirmed fixed; `prepublishOnly` subclaim classified as non-issue because real `npm pack` executes `prepack` and includes generated `dist`.
- Final review fixed unified hook identity trust boundaries, nested replay start recomputation, immutable publish SHA handoff, and the strict official GSD Codex uninstall allowlist.
- Final post-review focused gate passed: 12 files / 235 tests, first 9/138 and then 3/97.
- Final read-only review fixed path case semantics: Windows drive/UNC case-fold, POSIX exact-case; POSIX case-variant, Windows drive, and UNC regressions passed in a 5-file / 85-test focused gate.
- Full Vitest passed: 413 files / 5,273 tests, with 4 files and 43 tests skipped plus 1 todo.
- Coverage passed: 87.62% statements, 82.22% branches, 90.56% functions, 89.14% lines.
- Typecheck, build, schema validation, docs 30/30, targeted Biome, diff check, and real npm pack dry-run passed.
- npm pack produced `harnessed@5.0.5` with 201 entries, including `CHANGELOG.md`, 9 `dist` entries, and `workflows/*`, with no `skills/*` entries.
- External closeout completed: v5.0.6 is published, remote `main` is `b22b411b113bb829b60526fda03442845c867199`, CI `41157702328` passed 9/9, and #14-#18 plus #20-#33 received evidence comments and were closed. #30 was closed as `not planned`; #19 remains open for Phase 82.
