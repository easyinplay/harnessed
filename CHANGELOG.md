# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/easyinplay/harnessed/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/easyinplay/harnessed/releases/tag/v0.4.0
