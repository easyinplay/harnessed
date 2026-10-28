# Phase 73: npm 5.0.2 Maintenance Release

Date: 2026-10-29. Status: published and verified complete. Latest shipped npm: 5.0.2. This patch packages the already verified Windows setup and force-update corrections, not a new product surface.

## Scope

- Package version: 5.0.2; English `CHANGELOG.md` entry dated 2026-10-29 under `Fixed`.
- `webapp-testing` setup verification requires no Python and checks only same-root installed resources.
- `playwright-cli` verification works on Windows, is read-only and notifier-free, checks exact version `0.1.22` and Chromium metadata, and starts no browser or daemon.
- Force-update preserves the structured installer failure keyword. Prior-installed `update-unsupported` preflight refusals become `kept-existing` without a runtime re-probe; fresh-install `update-unsupported` failures remain fatal and generic failures retain the existing idempotent-probe path.

## Completed Release Gates

1. Carry forward existing implementation evidence, not a fresh candidate test run: Phase 22 passed 105 related tests and real Windows no-Python/Playwright probes; Phase 23 RED was 68 passed/7 failed and GREEN was 75/75; combined regression passed 132/132.
2. Carry forward passing typecheck (`tsc --noEmit`), focused Biome and `git diff --check`; gstack `/review` returned `Ship as-is`; task-deliver evidence verified. Phase 22/23 are the repair-task labels used during this work, not the historical GSD phase directories.
3. Close out only the six documentation files listed below. Run diff/content/line-count checks; do not rerun implementation tests, live probes, build or release-preflight in this task.
4. Previously recorded candidate local gates passed: serialized Vitest 4495/4495, production build/types/hooks, full lint exit 0 with 16 existing warnings, CLI 5.0.2 and npm pack dry-run. Candidate `b5f7bee5d47ea50b20e03ae07d3f6407e592c49d` passed exact-source three-platform CI `40736906479`: 9/9 success.
5. Under explicit user authorization, annotated `v5.0.2` points to the candidate and was pushed once; publish `40737857022`: 4/4 success. This documentation task performs no commit, push, tag or publication.
6. Public acceptance passed: npm version/latest 5.0.2; real install added 117 packages and CLI printed 5.0.2; stable GitHub release exactly 9 assets. All three binaries/checksums/signatures were downloaded and passed SHA256 and Ed25519. Downloaded Windows exe printed 5.0.2 and unpacked 167 assets to `C:/Users/easyi/.codex/harnessed/assets/5.0.2`. Exact hashes, sizes and npm integrity/shasum are in the release receipt.

## Boundaries

No runtime mode, host, schema, state or security-policy change is included. Installer provenance checks are unchanged; fresh-install `update-unsupported` remains fatal and generic failures do not gain a no-probe exception. Preserve all concurrent implementation/test changes and unrelated untracked files.

Closeout write scope: `.planning/releases/5.0.2.md`, this `PLAN.md`, new phase `SUMMARY.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` and `.planning/STATE.md`. Do not modify implementation, tests, manifests, package/CHANGELOG or root scratch files. No commit, push or tag. STATE remains below 100 lines.

## Published And Verified Outcome

- Phase73 is published and verified complete; latest shipped is 5.0.2. All release gates above are complete; browser verification and TEMP cleanup remain explicit limits, not claimed passes.
- Policy refused recursive cleanup; `C:/Users/easyi/AppData/Local/Temp/harnessed-502-accept-20261029-main` remains temporarily retained. Website browser verification was not run; no website version propagation is claimed.
- Release receipt: [5.0.2](../../releases/5.0.2.md). Completion summary: [Phase73](SUMMARY.md). This closeout records supplied verified publication facts and carried-forward implementation evidence.
