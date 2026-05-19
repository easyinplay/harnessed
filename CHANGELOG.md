# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-05-22

### Added
- R10.1 `harnessed audit-log` CLI subcommand — `--filter <jq-expr>` + dual format + 3 pagination flags (ADR 0021 D-01~D-04)
- R10.2 `src/checkpoint/state.ts` LockHeldError + `withLock<T>()` — `proper-lockfile@4.1.2` concurrent write lock (ADR 0021 D-05~D-08)
- R10.3 `harnessed uninstall <name>` CLI subcommand — 14th subcommand, dry-run default (ADR 0022 D-01~D-07)
- R10.4 `src/manifest/lib/path-guard.ts` — 5 OWASP A1 vectors pre-compiled RegExp + `PathTraversalError` (ADR 0022 D-03/D-04/D-08)
- v0.5.0 milestone archive triplet — `.planning/milestones/v0.5.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md`
- ROADMAP.md v1.0 chapter NEW — 9 GA criteria + Phase 6.1 outline + scope freeze guard (D-03 v1.0ChapterTiming)

### Changed
- `scripts/check-state-archive-stale.mjs` — SIZE_LIMIT 200→175→165→150 progressive tightening (4 rounds: Phase 4.3 RELAX + Phase 5.1 FLIP + Phase 5.2 FLIP + Phase 5.3 DEFER)
- `.planning/STATE.md` — D2 cadence iter 5+6+7 GRADUATION; Phase 5.1+5.2 narratives archived to RETROSPECTIVE.md
- ADR family 0017→0022 (ADR 0021+0022 NEW across v0.5.0)

### Fixed
- `.github/workflows/ci.yml` — A7 step retroactive iter 0018→0021 (ADR 0019+0020 retroactive fix; Phase 5.1)
- `.github/workflows/ci.yml` — A7 step iter 0021→0022 (Phase 5.2)

## [0.5.0-alpha.2] - 2026-05-19

### Added
- `harnessed uninstall <name>` CLI subcommand — 14th subcommand, dry-run default (R10.3; ADR 0022 D-01 through D-07)
- `src/cli/uninstall.ts` — 115L uninstall CLI register (D-05 --dry-run default + D-06 --yes bypass + D-07 NO --keep-backup)
- `src/uninstallers/` — 7 per-method uninstallers symmetric inverse of `src/installers/` (npmCli / mcpStdioAdd / mcpHttpAdd / ccPluginMarketplace / gitCloneWithSetup / npxSkillInstaller / ccHookAdd)
- `src/manifest/lib/path-guard.ts` — NEW 36L path traversal guard: 5 OWASP A1 vectors pre-compiled RegExp + `PathTraversalError` D-08 + `checkPathSafe()` (R10.4; ADR 0022 D-03/D-04/D-08)
- `src/cli/lib/validateFlags.ts` — NEW 27L extract: `validateNonInteractiveFlags()` dedup 5-site H1 gate (W0 #BH absorb)
- `src/uninstallers/lib/runOrPreview.ts` — NEW dry-run gate helper for uninstaller dispatch (W0 #BI absorb)
- ADR 0022 — Phase 5.2 R10.3 uninstall + R10.4 path traversal hardening (9-section format sister ADR 0021延袭)
- `tests/manifest/lib/path-guard.test.ts` — 9 TDD cells (5 OWASP A1 vectors + D-08 safe-message + 3 negative controls)
- `tests/cli/uninstall.test.ts` — 14 TDD cells (7-method dispatch + ephemeral + --yes + --apply matrix)

### Changed
- `src/manifest/aliases.ts` `resolveAlias()` — +`checkPathSafe(name)` R10.4 D-04 site 1 (guard before yaml lookup)
- `src/cli/install.ts` — +`checkPathSafe(resolvedName)` R10.4 D-04 site 2 (alias redirect defense-in-depth)
- `src/cli/uninstall.ts` — +`checkPathSafe(resolvedName)` R10.4 D-04 site 2 (symmetric install.ts hardening)
- `scripts/check-state-archive-stale.mjs` — SIZE_LIMIT 165→150 round 3 FLIP (W0 #BA resolve; 15L headroom)
- `.github/workflows/ci.yml` — A7 step iter ADR 0001-0021 → ADR 0001-0022 single extend (NOT retroactive)
- `src/cli/install.ts` + `install-base.ts` + `research.ts` + `manifest-add.ts` + `execute-task.ts` — H1 gate replaced with `validateNonInteractiveFlags()` import (#BH dedup)
- `.planning/STATE.md` — D2 cadence iter 6 REINFORCE: Phase 5.1 narrative archived (141L ≤150L PASS)

## [0.5.0-alpha.1] - 2026-05-19

### Added
- `harnessed audit-log` CLI subcommand — 13th subcommand, `--filter <jq-expr>` + dual format + 3 pagination flags (R10.1; ADR 0021 D-01 through D-04)
- `src/cli/audit-log.ts` — 162L audit log consumer (D-01 jq subprocess + D-04 5-pattern redact + D-02 dual format)
- `src/checkpoint/state.ts` LockHeldError + `withLock<T>()` + `writeCurrentWorkflow` wrap — proper-lockfile dir-level concurrent write lock (R10.2; ADR 0021 D-05 through D-08)
- `proper-lockfile@4.1.2` runtime dependency — MIT, 5M weekly downloads, cross-OS
- `src/cli/status.ts` — lockfile.check + mtime + STALE indicator (D-07 lock holder display)
- ADR 0021 — Phase 5.1 R10.2 state lock + R10.1 audit consumer (9-section format)
- `src/installers/lib/runClaudeArgs.ts` — reusable CC CLI spawn helper extract (W0 #BF absorb)
- `src/installers/lib/err.ts` — reusable error constructor helper extract (W0 #BG absorb)

### Changed
- `.github/workflows/ci.yml` — A7 step retroactive iter 0018→0021 (ADR 0019+0020 retroactive fix)
- `scripts/check-state-archive-stale.mjs` — SIZE_LIMIT 175→165 round 2 (W0 #BA Phase 5.1 resolve)

## [0.4.0] - 2026-05-19

### Added
- Routing audit log (`.harnessed/audit.log`) — JSONL append-only, 12-field schema, forward-only (R8.1)
- `src/audit/log.ts` — JSONL append-only writer + AuditRecordSchema TypeBox (D-01)
- `src/audit/hook.ts` — thin engine integration wrapper (5th PRIMARY helper family member)
- ADR 0018 — routing audit log architecture (Phase 4.3 PRIMARY)
- ADR 0019 — STATE dual-SoT 5-recurrence terminus COLLAPSE pattern (Phase 3.3 backfill)
- ADR 0020 — HYBRID 2-clock disambiguation pattern (Phase 4.2 backfill)
- `CHANGELOG.md` (this file) — Keep-a-Changelog format
- v0.4.0 milestone archive triplet — `.planning/milestones/v0.4.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md`
- `docs/MAINTAINER-ONBOARDING.md` expanded — 50L → 111L additive (Phase 4.2; R8.2)
- `.github/workflows/stale.yml` — 60-day mark + 90-day close on issue+PR (Phase 4.2; R8.3)
- `.github/ISSUE_TEMPLATE/{01-bug,02-feature,03-question}.yml` + `config.yml` — yml form-based (Phase 4.2; R8.3)
- `.github/FUNDING.yml` — single tier $1+ Karpathy YAGNI (Phase 4.2; R8.5)
- GitHub Sponsors badge in README (Phase 4.2; R8.5)
- `docs/benchmarks/v0.4.md` — 30-row dogfooding benchmark FULL per-task disclosure (Phase 4.1; R8.1 anchor)
- `docs/benchmarks/v0.4-upgrade-e2e.log` — TEXT LOG zero-dep portable (Phase 4.1)
- `docs/CONTRIBUTING-BENCHMARK.md` — MANUAL re-run cadence (Phase 4.1)

### Changed
- `src/routing/engine.ts` — 4 `emitAudit` call sites + surgical comment shrink (200L EXACT ≤200L Karpathy hard limit; Phase 4.3 W1 T1.3)
- `src/cli/doctor.ts` — 5 async checks parallelized via `Promise.all` (Phase 4.2 sister 3rd-cycle absorb #BT)
- `scripts/check-state-archive-stale.mjs` — SIZE_LIMIT 200→175 round 2 RELAX (Phase 4.3 W0.2 #BA resolve)
- `.github/workflows/ci.yml` — A7 step iter ADR 0001-0017 → ADR 0001-0018 integrity gate

### Fixed
- Version sync drift across `src/index.ts` + `src/cli.ts` + `package.json` — both files now import `pkg.version` from package.json single SoT (Phase 4.2 ship sister H1 5996ea1)
- `src/cli/audit.ts` N+1 file read in `auditOne` — refactored to accept optional pre-read src (Phase 4.2 ship sister H2 5996ea1)

[Unreleased]: https://github.com/easyinplay/harnessed/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/easyinplay/harnessed/releases/tag/v0.5.0
[0.5.0-alpha.2]: https://github.com/easyinplay/harnessed/releases/tag/v0.5.0-alpha.2
[0.5.0-alpha.1]: https://github.com/easyinplay/harnessed/releases/tag/v0.5.0-alpha.1
[0.4.0]: https://github.com/easyinplay/harnessed/releases/tag/v0.4.0
