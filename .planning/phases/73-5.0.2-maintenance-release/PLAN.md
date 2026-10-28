# Phase 73: npm 5.0.2 Maintenance Release

Date: 2026-10-29. Status: active release candidate; not published. Latest shipped remains npm 5.0.1. This patch packages the already verified Windows setup and force-update corrections, not a new product surface.

## Scope

- Package version: 5.0.2; English `CHANGELOG.md` entry dated 2026-10-29 under `Fixed`.
- `webapp-testing` setup verification requires no Python and checks only same-root installed resources.
- `playwright-cli` verification works on Windows, is read-only and notifier-free, checks exact version `0.1.22` and Chromium metadata, and starts no browser or daemon.
- Force-update preserves the structured installer failure keyword. Prior-installed `update-unsupported` preflight refusals become `kept-existing` without a runtime re-probe; fresh-install `update-unsupported` failures remain fatal and generic failures retain the existing idempotent-probe path.

## Release Gates

1. Carry forward existing implementation evidence, not a fresh candidate test run: Phase 22 passed 105 related tests and real Windows no-Python/Playwright probes; Phase 23 RED was 68 passed/7 failed and GREEN was 75/75; combined regression passed 132/132.
2. Carry forward passing typecheck (`tsc --noEmit`), focused Biome and `git diff --check`; gstack `/review` returned `Ship as-is`; task-deliver evidence verified. Phase 22/23 are the repair-task labels used during this work, not the historical GSD phase directories.
3. Prepare only the seven metadata files listed below. Validate JSON, Markdown structure, STATE line count and diff statically; do not rerun implementation tests, live probes, build or release-preflight in this task.
4. Candidate local gates passed: serialized Vitest 4495/4495, production build/types/hooks, full lint exit 0 with 16 existing warnings, CLI version 5.0.2, and npm pack dry-run. Commit and push only intended changes, require exact-source three-platform CI success, then run isolated release-preflight with version/tag availability checks.
5. User has explicitly authorized tag/publication. Push `v5.0.2` only after the candidate exact-source CI and release-preflight gates above pass. No commit, push, tag or publication is performed by this metadata task.
6. Only after release gates pass, publish once under that authorization and verify npm metadata/installation, the GitHub release and nine signed binary/checksum/signature assets, including downloaded Windows execution. Keep candidate status until publication and acceptance are evidenced.

## Boundaries

No runtime mode, host, schema, state or security-policy change is included. Installer provenance checks are unchanged; fresh-install `update-unsupported` remains fatal and generic failures do not gain a no-probe exception. Preserve all concurrent implementation/test changes and unrelated untracked files.

Metadata write scope: `package.json`, `CHANGELOG.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, this `PLAN.md` and `.planning/releases/5.0.2.md`. Do not modify `src/`, `tests/`, `manifests/` or root `task_plan.md`, `progress.md`, `findings.md`, `verification-evidence.md`. STATE remains below 100 lines.

## Candidate Outcome (Not Published)

- Version/changelog and active candidate pointers are prepared; candidate local gates passed as recorded above.
- Latest shipped remains 5.0.1. No candidate commit, exact-source CI, tag, publication, registry convergence or downloaded 5.0.2 artifact acceptance is claimed yet.
- Release receipt: [5.0.2 candidate](../../releases/5.0.2.md). Implementation and historical release acceptance remain distinct from metadata readiness.
