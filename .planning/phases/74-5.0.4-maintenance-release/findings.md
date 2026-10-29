# Phase 74 Findings

Status: `v5.0.4` published and verified complete.

## 2026-10-29

- Verified regression: interactive force-update runs a default baseline pass and therefore knows which components existed before refresh; explicit `--update-installed` sets `updateInstalled: true` on the first pass and loses that baseline.
- `reclassifyForceUpdateFailures` already implements the correct policy for prior-installed `update-unsupported` failures. The defect is orchestration, not installer provenance enforcement.
- The L4 repair command recommended by v5.0.3 includes `--update-installed`, so the regression turns safe provenance refusals for 8 skills plus `gsd` into 9 fatal failures after successfully repairing `ctx7` and `playwright-cli`.
- A normal baseline install pass is unnecessary and can record observed receipts. Minimal design: keep the explicit single force pass, then probe only structured `update-unsupported` failures with the existing read-only presence plus runtime-health probe. Only healthy retained installs become `kept-existing`.
- The `/webapp-testing` warning is a separate cross-host materialization defect: Claude Code cannot load `~/.agents/skills`, but current npx presence and manifest verification accept that shared path and skip creating `~/.claude/skills/webapp-testing`.
- An isolated `skills@1.7.4` probe proved the supported repair path: installing first for `codex`, then for `claude-code`, creates the Claude native copy while leaving the shared `SKILL.md` SHA256 unchanged.

## Candidate Scope And Safety

- Explicit force-update classification uses the structured `update-unsupported` keyword, not human-readable error matching. A read-only active-host presence plus runtime-health probe must succeed before a refusal becomes `kept-existing`; missing or unhealthy installs and other failures remain fatal.
- Claude npx skill detection and post-install verification require the active native skills root. A shared-only installation is not host-ready and can be materialized through the supported installer path without authorizing force-update overwrites of unproven targets.
- `webapp-testing` verification resolves the Claude native root through `CLAUDE_CONFIG_DIR`, falling back to `~/.claude`; Codex shared and legacy native roots remain supported.
- Provenance refusal, dry-run no-write behavior, and multi-pack indicator checks remain safety boundaries, not bypasses.

## Verification Handoff

- Supplied implementation verification: focused tests passed 161/161; findings from both review rounds are closed with final `PASS` / `Ship` verdicts.
- Fresh local release gate on 2026-10-29: focused `install-aliases` fixture passed 3/3; full Vitest passed 374 files and 4546 tests with 11 skipped and 1 todo; production build, typecheck, lint, and `git diff --check` passed. Lint reports 16 existing warnings and no errors.
- The first parallel full-test attempt overlapped `build`, which temporarily removed `dist/cli.mjs` and caused the 3 `install-aliases` failures. The fixture and full suite both passed when rerun serially after build; this was test/build output contention, not a product regression.
- Publication and public acceptance are now complete, as supplied in the release closeout handoff. Exact evidence is recorded below and in [the release receipt](../../releases/5.0.4.md).
- The release owner confirmed that pre-publication `node dist/cli.mjs release-preflight` passed all four checks: `CHANGELOG has [5.0.4]`, `package version 5.0.4`, `tracked working tree clean`, `v5.0.4 tag absent`; result `release-ready`. The tag-absent check records the pre-tag state and must not be interpreted as the current published state.

## Publication Evidence And Closeout Limits

- Release commit `c9a3dc3aba151901e4854b38b25ea8e3344b0e43`; CI `40810930373` 9/9 success. Annotated `v5.0.4` has object `301a0f75e61dce275ec8a834dece89fecab4e654` and peels to that commit; publish `40811493097` 4/4 success. Local commit/tag identity was checked again during documentation closeout.
- npm version/latest both 5.0.4; shasum `6655b216e05d5ef62d532f7154879235e3d03b33`; integrity `sha512-+kgTFalx36YfDXd2Q/0yhhAkeJF61uxEhBtP+OqfnulNKEfcgHzIdQ/I4LKd/tt3wQ9Q0hvC0ly+x2gPgRV4Uw==`. Real npm install added 117 packages and CLI printed 5.0.4.
- Stable GitHub release `v5.0.4` published 2026-10-29 with 9 assets. All three binary SHA256 and Ed25519 checks passed; exact hashes and sizes are in the release receipt.
- Windows exe printed 5.0.4 and unpacked 167 assets under `C:/Users/easyi/AppData/Local/Temp/harnessed-504-accept-20261029-main/state/assets/5.0.4`. The directory exists; the acceptance root remains retained and was not cleaned up.
- Website browser verification was not run. Public release evidence does not establish website propagation or resolve historical native gstack limitations.
- This documentation-only closeout records supplied test/build/preflight/public acceptance evidence; it does not rerun those operations, alter implementation/tests/package metadata or recreate the tag. Closeout docs will be committed and pushed separately, without repeating publication or runtime acceptance.
- Final document checks matched 26 exact receipt evidence markers and resolved all 30 relative Markdown links across the eight authorized files; STATE contains 98 lines and records `npm-5.0.4` completed with Phase 74 complete. All six plan tasks are closed.
