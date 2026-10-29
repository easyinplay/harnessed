# Phase 74: npm 5.0.4 Maintenance Release

Date: 2026-10-29. Status: complete; publication, public acceptance and documentation closeout recorded.

## Goal

Release and close out `v5.0.4` for two bounded fixes: health-gated classification of explicit force-update provenance refusals, and Claude npx shared-only skill materialization with active-root verification. Keep the implementation handoff, local candidate gates and public acceptance evidence distinct.

## Tasks

1. [x] Record the implementation handoff: focused tests 161/161, typecheck, focused Biome, and diff-check passed; findings from both review rounds closed. These results were supplied for this candidate, not rerun by this metadata-only task.
2. [x] Set `package.json` to `5.0.4` and add the dated `CHANGELOG.md` Fixed section after the empty Unreleased section.
3. [x] Update this directory's `task_plan.md`, `findings.md`, and `progress.md` to candidate status without changing global planning or release receipts.
4. [x] Run the local release gate: full Vitest, production build, lint, typecheck, and `git diff --check`.
5. [x] Record pre-publication `node dist/cli.mjs release-preflight` 4/4 passed with result `release-ready`, published commit `c9a3dc3aba151901e4854b38b25ea8e3344b0e43`, CI `40810930373` 9/9, annotated tag `v5.0.4`, publish `40811493097` 4/4, npm and three-platform signed-artifact acceptance.
6. [x] Complete the documentation-only closeout: add `.planning/releases/5.0.4.md` and this phase's `SUMMARY.md`; update this phase's `task_plan.md`/`progress.md`/`findings.md` and global `.planning/STATE.md`/`ROADMAP.md`/`REQUIREMENTS.md`; check evidence, links, diff hygiene and STATE <100 lines.

Dependency order: implementation handoff -> candidate metadata -> local release gate -> commit/CI/tag/publication -> public acceptance -> documentation closeout.

## Acceptance Criteria

- `package.json` reports `5.0.4`; empty `[Unreleased]` is followed by `[5.0.4] - 2026-10-29` with exactly two Fixed entries.
- Explicit `--system --non-interactive --update-installed` retains structured provenance refusals only when active-host presence and runtime health both pass; fresh and unhealthy failures remain fatal.
- Claude shared-only npx skills materialize the active native root; `webapp-testing` verification honors `CLAUDE_CONFIG_DIR` without weakening provenance, dry-run, Codex legacy, or multi-pack indicator boundaries.
- Release records distinguish local validation from CI/publication evidence; npm version/latest 5.0.4, real npm/CLI, stable GitHub release with 9 assets and three-platform SHA256/Ed25519 acceptance are recorded.
- Phase 74 is complete, global milestone is `npm-5.0.4` completed, latest shipped is 5.0.4, and STATE stays below 100 lines. The retained acceptance root and unrun website browser verification remain explicit.

## Boundaries

- Preserve unrelated untracked files and `.tmp/skills-*`; do not stage, delete, or rewrite them.
- Global planning and release receipts were deferred during candidate preparation; public release verification is now complete and documentation closeout is authorized.
- This closeout edits only the eight authorized Markdown files. Do not modify implementation, tests, CHANGELOG or package metadata, recreate the tag, repeat publication or runtime acceptance, clean the acceptance root or overwrite concurrent work. Closeout docs will be committed and pushed separately by the release owner.

## Verification Record

- Candidate: focused handoff 161/161; candidate `install-aliases` 3/3; full Vitest 374 files, 4546 passed, 11 skipped, 1 todo; build/typecheck/lint/diff-check passed, with 16 existing lint warnings.
- Release owner confirmed pre-publication `node dist/cli.mjs release-preflight` passed all four checks: `CHANGELOG has [5.0.4]`, `package version 5.0.4`, `tracked working tree clean`, `v5.0.4 tag absent`; result `release-ready`. This is the pre-tag result, not a post-publication rerun.
- Initial parallel test/build contention caused 3 fixture failures while build cleaned `dist/cli.mjs`; serial reruns passed. This was tool concurrency interference.
- Public acceptance: npm real install added 117 packages and CLI printed 5.0.4; signed artifacts passed on all three platforms; Windows exe printed 5.0.4 and unpacked 167 assets. Exact identifiers and hashes: [release receipt](../../releases/5.0.4.md).
- Retained acceptance root: `C:/Users/easyi/AppData/Local/Temp/harnessed-504-accept-20261029-main`. Website browser verification was not run; no cleanup or website propagation is claimed.
