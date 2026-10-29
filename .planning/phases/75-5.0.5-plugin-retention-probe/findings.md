# Phase 75 Findings

## 2026-10-29

- User acceptance on `harnessed setup v5.0.4 --system --non-interactive --update-installed` improved from 9 failures to 2 failures.
- Seven healthy existing components now become `kept-existing`; `ctx7` and `playwright-cli` repair successfully.
- Remaining failures are both Claude `cc-plugin-marketplace` components: `superpowers` and `planning-with-files`.
- `planning-with-files` is present in the Claude v2 plugin registry as `planning-with-files@planning-with-files`, version `3.17.2`, under the active native root.
- The current retained-version probe requires both `isAlreadyInstalled(ctx)` and `verifyInstalled(ctx)` to pass. The defect is therefore downstream of structured reclassification and specific to plugin readiness evidence.
- RED focused test: the original 20 tests passed and the 2 newly added regression tests failed.
- Confirmed root cause: both manifests used `/plugin list`, a Claude REPL command that the retained-version probe executed through the shell.
- Registry presence and `enabledPlugins` checks are both `true` for both affected plugins; registration and enablement are not the cause.
- The initial `2>&1 | grep -w` approach (implemented as `claude plugin list 2>&1 | grep -qw <name>`) was blocked by Paranoid review: it could swallow a CLI nonzero exit, match similar IDs or the wrong marketplace, and leave the Windows fallback dependent on `grep`.
- The user approved a bounded redesign. The final implementation validates `claude plugin list --json` as a top-level array and requires an exact marketplace-qualified ID, settings enablement `true`, CLI entry `enabled: true` and a non-empty `installPath`.
- CLI nonzero, malformed/non-array/null output, missing entries, similar IDs and wrong marketplaces all fail closed.
- Claude marketplace presence uses authoritative native detection and no longer falls back to a shell command. Generic manifest verification does not execute; subsequent runtime/lease checks remain enforced.
- Supplied final validation: focused 7 files/204 tests; full Vitest 375 files/4561 passed/11 skipped/1 todo; build, typecheck, docs 30, schema, lint (exit 0, 16 existing warnings), diff-check and npm pack dry-run passed. These results supersede the initial 5-suite/160-test result; this status-only update does not rerun the validation suites.
- Two final review tracks found no blocking issues. Non-blocking info: if future Claude CLI output contains conflicting duplicate qualified IDs, any healthy exact match currently passes. This has not been observed in the real CLI and is outside this scope.
- npm-5.0.5 is a pushed-main candidate, not published; latest shipped public npm remains 5.0.4. Implementation/validation/review and Tasks 1-5 are complete; implementation/version/planning commit `33965c97e2c4a51892008d22fc351e583627c09b` pushed to `origin/main`; CI pending observation, Task 6 pending. No completed CI, tag, npm publication or release is claimed; no release receipt/SUMMARY is created.
- Safety boundaries remain unchanged: the retained-version probe stays read-only, provenance refusal is preserved, and missing, disabled, unreadable, malformed or runtime-unhealthy plugins remain fatal. No tag or publish is authorized without new explicit user authorization.
