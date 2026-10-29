# Phase 75 Progress

Milestone: npm-5.0.5. Status: candidate ready; in progress (commit/push pending).

## 2026-10-29

- Captured the exact v5.0.4 user log: 2 installed, 2 already-installed, 7 kept-existing, 2 failed.
- Confirmed the residual failures are `superpowers` and `planning-with-files`; both use `cc-plugin-marketplace` on Claude.
- Read the force-update reclassification, retained-version probe, plugin registry and verification paths.
- Confirmed the active Claude registry contains `planning-with-files@planning-with-files` with a readable install path.
- Started two independent read-only code audits for root-cause and regression-test design.
- Completed task 1: RED focused test preserved 20 passing tests and reproduced 2 failures in the new regression tests.
- Completed task 2: confirmed registration and `enabledPlugins` are both `true`; the root cause is that both manifests' `/plugin list` commands were executed through the shell.
- Paranoid review blocked the initial `2>&1 | grep -w` approach: the pipeline could swallow CLI nonzero exits, match similar IDs or the wrong marketplace, and require `grep` in the Windows fallback. The user approved a bounded redesign.
- Completed task 3 with the final structured probe: `claude plugin list --json` must return a top-level array containing the exact qualified ID with settings enablement `true`, CLI entry `enabled: true` and a non-empty `installPath`.
- CLI nonzero, malformed/non-array/null output, missing entries, similar IDs and wrong marketplaces fail closed. Native Claude marketplace presence detection is authoritative without a shell fallback; generic manifest verification is skipped and subsequent runtime/lease checks remain enforced.
- Completed Task 4. Supplied final validation: focused 7 files/204 tests; full Vitest 375 files/4561 passed/11 skipped/1 todo; build, typecheck, docs 30, schema, lint (exit 0, 16 existing warnings), diff-check and npm pack dry-run passed.
- Task 5 is in progress: release metadata/review complete; two final review tracks found no blocking issues. Commit/push remain pending. Non-blocking info: if future Claude CLI output contains conflicting duplicate qualified IDs, any healthy exact match currently passes; not observed in the real CLI and outside this scope.
- Tasks 1-4 complete; Task 6 pending, tag/publish not authorized. Latest shipped public npm remains 5.0.4; npm-5.0.5 is a candidate, not published. No completed CI, tag or npm publication is claimed; no release receipt/SUMMARY is created.
- Synchronized STATE, ROADMAP, PATCH-505 requirements and phase documents within the six-file allowlist. This status-only update records supplied validation/review evidence without rerunning it; `git diff --check` is the local documentation check.
- Preserve unrelated changes, untracked root files and `.tmp/`; keep the retained-version probe read-only and do not bypass provenance refusal or weaken plugin health checks.
