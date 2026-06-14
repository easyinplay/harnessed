# Phase 21 SUMMARY — ship/release stage (5th stage)

> Executed in the MAIN session (TDD Wave 1 + authoring Wave 2), 2026-06-14. Hand-driven. v7.0 follow-on. NOT yet committed — awaiting user review.

## Outcome

harnessed now has a first-class **Ship** stage after Verify, closing the gap vs comet (archive) / Trellis (finish-work) / Claude-Harness (`/harness-release`). Two layers: a `harnessed release-preflight` machine gate + a `/ship` workflow master. Deploy boundary = tag-ready (publish stays in `publish.yml` CI; zero remote mutation).

## Tasks

1. **Wave 1 — CLI release-preflight (TDD)** — `release-preflight.ts`: pure `collectPreflight(deps)` over injected `{changelog, version, gitStatus, gitTags}` → 4 read-only checks (CHANGELOG `[Unreleased]` non-empty / version present / git-clean / `v<version>` tag absent) + `anyFailed` + `defaultDeps` (read-only repo state via `git status --porcelain` / `git tag -l`). `harnessed release-preflight` (26th command) prints checks, exit 1 on any fail. 5 tests.
2. **Wave 2 — `/ship` master (authoring + schema)** — `workflows/ship/auto/` master (Stage ⑤, delegates_to `[preflight serial order 1]`, tools `release-preflight`+`ship`+`planning-with-files`) + `workflows/ship/preflight/` sub (runs `harnessed release-preflight`, blocks on fail) + `release-preflight` capability (harnessed-bundled) + `ship-preflight-always` stage-routing trigger + README 4-stage→5-stage (Ship between Verify and Retro). The real `check-workflow-schema.mjs` passes (v3 workflow count 24→**26**, capabilities + judgments cross-validated).
3. **Verify gate** — below.

## Decisions honored (21-CONTEXT.md)

- D1 two layers. D2 deploy boundary = tag-ready (no push/publish/tag). D3 the 4 preflight checks. D4 lean master delegating to gstack `/ship`. D5 read-only git. D6 TDD (Wave 1) + schema-validated authoring (Wave 2).

## Dogfood (the gate works — and tells us how to ship 4.5.0)

`node dist/cli.mjs release-preflight` on this repo → **exit 1**, correctly surfacing the three real release blockers:
- ✗ `changelog` — `[Unreleased]` is empty (8 phases undocumented — the exact "evidence rebuilt by memory" failure)
- ✓ `version` — 4.4.0
- ✗ `git-clean` — uncommitted changes (resolves on commit)
- ✗ `tag-absent` — `v4.4.0` already exists → **bump to 4.5.0**

So the upcoming 4.5.0 release must: fill `## [Unreleased]`, bump `package.json` to 4.5.0, commit, then tag.

## Safety (verified)

- **Zero remote/git mutation**: grep of the new code finds no `git push`/`npm publish`/tag-create/commit — only read-only `git status --porcelain` + `git tag -l`. ship stops at tag-ready by construction.
- Workflow additions pass the REAL `check-workflow-schema.mjs` (not just fixtures) + the master loads (v3 count 26).

## Evidence

- TDD Wave 1: +5 tests (collectPreflight all-green / empty-Unreleased fail / dirty fail / tag-exists fail / missing-version fail).
- Typecheck: `tsc --noEmit` exit 0.
- Biome: clean.
- Full suite: **1307 passed | 5 skipped | 1 todo, 0 failed** (was 1302; +5).
- Real schema check: `check-workflow-schema.mjs` exit 0, v3=26.
- Dogfood: exit 1 with the 3 expected blockers.
- `git diff --stat`: ROADMAP + README + cli.ts + capabilities.yaml + stage-routing.yaml; untracked new: release-preflight.ts (×2) + test + workflows/ship/ (4 files) + phase docs.

## Acceptance — all met

1. ✅ collectPreflight: empty-Unreleased/dirty/tag-exists/missing-version → fail; ready → all pass
2. ✅ `harnessed release-preflight` exit 1 on fail / 0 on pass; no git/remote mutation
3. ✅ `/ship` master + `ship/preflight` sub pass real check-workflow-schema; v3 count 26
4. ✅ README 5-stage (Ship between Verify and Retro)
5. ✅ full gate green; biome clean; no remote/git mutation

## Not done / deferred

- Full evidence/pr/changelog sub-workflows (D4 — lean master, delegate to gstack `/ship`).
- The 4.5.0 release itself — NEXT step: fill CHANGELOG `[Unreleased]`, bump to 4.5.0, commit, tag (with explicit approval) → publish.yml.
