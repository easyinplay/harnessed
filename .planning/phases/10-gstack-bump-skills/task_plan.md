# Phase 10 — gstack/mattpocock bump + 6 skills · task_plan

> planning-with-files persistence layer (three-layer-stack Plan stage).
> Reconstructed retroactively 2026-06-10 (phase shipped in v4.3.0). Detail:
> [`10-SUMMARY.md`](./10-SUMMARY.md). Progress: [`progress.md`](./progress.md);
> discoveries: [`findings.md`](./findings.md). (Phase 10 collapsed plan+execute —
> trivially-specified config with pre-verified exact values, no separate gsd-planner run.)

## Goal

Bump 2 upstream manifests to current versions + additively wire 6 non-iOS gstack
capabilities. Track gstack v1.52.1.0 + mattpocock drift in the composition registry.

## Tasks

- [x] **T1** — `manifests/skill-packs/gstack.yaml`: git_ref `74895062` → `1626d485…` (current `garrytan/gstack` main HEAD), last_known_good `main-269-commits` → `1.52.1.0`, last_check → 2026-06-09. Sync `tests/fixtures/manifests/valid/gstack.yaml`.
  - acceptance: manifest-validate + install-known-good green; install.cmd/homepage/repo unchanged (gstack NOT renamed, only GSD was).
- [x] **T2** — `manifests/skill-packs/mattpocock-skills.yaml`: last_check → 2026-06-09 (skills@1.5.10 installer; last_known_good left commit-based — no fabricated number).
- [x] **T3** — wire 6 gstack capabilities into `capabilities.yaml` Bucket 7: spec / skillify / pair-agent / scrape / benchmark-models / landing-report (skill_dir:gstack, cmd:/<name>, since:v5.1). Skip iOS suite.
- [x] **T4 (final gate)** — green: capability-resolver + manifest-validate + check-workflow-schema + install-known-good/aliases (version-sensitive) + full vitest.

## Dependency order

T1/T2 (manifests) ∥ T3 (capabilities) → T4 (validates all). 

## Acceptance (phase)

2 manifests bumped + 6 capabilities + fixture synced + green. Requirements:
REQ-v51-gstack-bump, REQ-v51-gstack-skills, REQ-v51-validation (final gate).
