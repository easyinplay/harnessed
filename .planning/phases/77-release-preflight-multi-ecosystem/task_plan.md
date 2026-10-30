# Phase 77: Multi-Ecosystem Release Preflight

Date: 2026-10-29. Status: in progress. Progress: 0/5.

## Goal

Resolve issue #12 by discovering static release versions from npm, Python and Rust manifests without false-positive tag checks, while preserving a read-only release gate.

## Tasks

1. [ ] Add RED tests for multi-manifest discovery, conflicts, invalid versions and skipped tag checks.
2. [ ] Implement structured package.json/pyproject.toml/Cargo.toml version discovery with source diagnostics.
3. [ ] Add `--release-version <semver>` override without changing root `harnessed --version` behavior.
4. [ ] Update ship-preflight workflow documentation and run focused/broad validation.
5. [ ] Review, synchronize release metadata and push only after validation; publication remains unauthorized.

## Acceptance Criteria

- Detect `package.json.version`, `pyproject.toml [project].version`, `pyproject.toml [tool.poetry].version` and `Cargo.toml [package].version` through structured parsers.
- `--release-version` has highest priority; an invalid explicit value fails without fallback.
- Multiple discovered manifests with the same version pass; conflicting versions fail and require `--release-version`.
- Missing, dynamic or unsupported versions fail with actionable source diagnostics.
- Full SemVer validation rejects suffix garbage such as `1.0.0garbage`.
- CHANGELOG version-section matching runs only with a valid target version; `[Unreleased]` remains independently valid.
- `tag-absent` reports warn/not-run when no valid version exists and never probes the literal tag `v`.
- Historical git tags are not used to infer the next release version.
- The command remains read-only and root `harnessed --version` behavior remains unchanged.

## Boundaries

- No auto-bump, build-backend execution, Cargo command execution, git-describe fallback or monorepo package selection.
- Preserve unrelated Phase 76 and untracked workspace changes.
- Do not tag or publish without fresh explicit authorization.
