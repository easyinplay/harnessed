# Phase 74 Findings

Status: `v5.0.4` local release gate passed; not shipped.

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
- CI, `harnessed release-preflight`, tag publication, npm latest, GitHub release assets, signatures, and Windows binary acceptance remain pending. This record is not yet a release receipt.
