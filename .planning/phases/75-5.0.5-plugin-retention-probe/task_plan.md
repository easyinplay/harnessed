# Phase 75: Claude Plugin Retention Probe

Date: 2026-10-29. Milestone: npm-5.0.5. Status: candidate ready; in progress (commit/push pending).

## Goal

Fix the remaining explicit force-update false failures for healthy existing Claude plugins without weakening provenance refusal or treating disabled/broken plugins as usable.

## Tasks

1. [x] Build a deterministic regression test matching the v5.0.4 log: `superpowers` and `planning-with-files` remain failed while healthy peer plugins become `kept-existing`.
2. [x] Trace plugin identity, registry presence, enablement, and runtime verification for the affected manifests.
3. [x] Implement the user-approved bounded redesign through a delegated worker with focused tests after Paranoid review blocked the initial shell-pipeline correction.
4. [x] Complete validation. Supplied final results: focused 7 files/204 tests; full Vitest 375 files/4561 passed/11 skipped/1 todo; build, typecheck, docs 30, schema, lint (exit 0, 16 existing warnings), diff-check and npm pack dry-run passed.
5. [ ] (in progress) Review the final diff, update release metadata for the patch candidate, commit and push `main`. Release metadata and two final review tracks complete with no blocking issues; commit/push pending.
6. [ ] (pending) Tag/publish only after explicit user authorization for the new version; not authorized.

## Acceptance Criteria

- Healthy retained `superpowers` and `planning-with-files` installations are reported as `kept-existing` after a provenance-safe update refusal.
- Missing, disabled, unreadable, malformed or runtime-unhealthy plugins remain fatal.
- Validate `claude plugin list --json` as a top-level array, requiring the exact qualified ID, settings enablement `true`, CLI entry `enabled: true` and a non-empty `installPath`.
- CLI nonzero, malformed/non-array/null output, missing entries, similar IDs and wrong marketplaces fail closed.
- Claude marketplace presence uses authoritative native detection without a shell fallback. Generic manifest verification does not execute; subsequent runtime/lease checks remain enforced.
- `ui-ux-pro-max` and other already-correct component paths do not regress.
- The fix remains read-only during the retained-version probe and does not authorize replacement.
- Relevant regression tests fail before the fix and pass after it.

## Final Review

- Implementation, validation and two final review tracks are complete with no blocking issues.
- Non-blocking info: if future Claude CLI output contains conflicting duplicate qualified IDs, any healthy exact match currently passes. Not observed in the real CLI; outside this scope.

## Boundaries

- Preserve all unrelated untracked root files and `.tmp/`.
- Do not bypass `update-unsupported`, rewrite plugin identity, or infer health from receipts alone.
- Do not tag or publish without a new explicit authorization.
- Latest shipped public npm remains 5.0.4; npm-5.0.5 is a candidate, not a published release. Commit/push remain pending; no completed CI, tag or npm publication is claimed. Do not create a release receipt or SUMMARY.
- This status-only update is limited to `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` and this phase's `task_plan.md`, `findings.md` and `progress.md`; record supplied validation/review results without rerunning them and run `git diff --check`.
