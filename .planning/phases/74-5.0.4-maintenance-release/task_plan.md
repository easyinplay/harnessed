# Phase 74: npm 5.0.4 Maintenance Release

Date: 2026-10-29. Status: local release gate passed; awaiting commit, CI, tag, and publish.

## Goal

Prepare the `v5.0.4` maintenance release candidate metadata for two bounded fixes: health-gated classification of explicit force-update provenance refusals, and Claude npx shared-only skill materialization with active-root verification.

## Tasks

1. [x] Record the implementation handoff: focused tests 161/161, typecheck, focused Biome, and diff-check passed; findings from both review rounds closed. These results were supplied for this candidate, not rerun by this metadata-only task.
2. [x] Set `package.json` to `5.0.4` and add the dated `CHANGELOG.md` Fixed section after the empty Unreleased section.
3. [x] Update this directory's `task_plan.md`, `findings.md`, and `progress.md` to candidate status without changing global planning or release receipts.
4. [x] Run the local release gate: full Vitest, production build, lint, typecheck, and `git diff --check`.
5. [ ] Commit and push the candidate, wait for CI, run `harnessed release-preflight`, create `v5.0.4`, and verify publication artifacts.

Dependency order: implementation verification handoff -> version and changelog -> candidate documentation -> metadata validation.

## Acceptance Criteria

- `package.json` reports `5.0.4`; empty `[Unreleased]` is followed by `[5.0.4] - 2026-10-29` with exactly two Fixed entries.
- Explicit `--system --non-interactive --update-installed` retains structured provenance refusals only when active-host presence and runtime health both pass; fresh and unhealthy failures remain fatal.
- Claude shared-only npx skills materialize the active native root; `webapp-testing` verification honors `CLAUDE_CONFIG_DIR` without weakening provenance, dry-run, Codex legacy, or multi-pack indicator boundaries.
- Candidate records distinguish local validation from CI/publication evidence and do not imply a shipped release before the tag workflow completes.

## Boundaries

- Preserve unrelated untracked files and `.tmp/skills-*`; do not stage, delete, or rewrite them.
- Defer `.planning/STATE.md`, ROADMAP, REQUIREMENTS, the release receipt, and `SUMMARY.md` until public release verification is complete.
- Publish only through the existing tag-triggered GitHub Actions workflow after the pushed candidate passes CI and `harnessed release-preflight`.
