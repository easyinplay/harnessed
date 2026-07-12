# Phase 18 SUMMARY — CodeGraph semantic index (F)

> Executed in the MAIN session (TDD red→green), 2026-06-13/14. Hand-driven. Manifest/capability-layer phase (not checkpoint internals); parallelizable. NOT yet committed — awaiting user review.

## Outcome

CodeGraph (`@colbymchenry/codegraph`, MIT, 100% local) is now cataloged as an OPT-IN semantic-index component: a validated manifest (provenance) + an always-pass doctor detect + a capability-map entry. harnessed runs NO install and vendors NO upstream code — CodeGraph self-installs via its own CLI. No-vendor thesis taken to its end: catalog + detect, the tool installs itself.

## Tasks (TDD)

1. **checkCodeGraph doctor detect** — `src/cli/lib/check-codegraph.ts`: fs-detect `.codegraph/` in cwd; present → `pass` "detected"; absent → `pass` "optional, not configured" + `npx @colbymchenry/codegraph` enable hint. **Always pass** (an opt-in tool's absence is not a health failure).
2. **Catalog manifest** — `manifests/optional/codegraph.yaml` (NEW dir): cli-npm shape (sister ctx7), MIT, describes CodeGraph's own `npm i -g @colbymchenry/codegraph && codegraph install` / `codegraph status` / `codegraph uninstall`. Validates against the manifest schema first try.
3. **Register + capability** — appended `checkCodeGraph` to `doctor-registry.ts` CHECKS (12→13); added the `codegraph` tool entry to `capabilities.yaml` (impl mcp / cmd codegraph_explore / fires_when code_navigation·symbol_lookup·call_graph). Bumped both doctor test files (doctor.test.ts + doctor-fixtures.test.ts) 12→13 + added the codegraph mock + expected-name.
4. **Verify gate** — below.

## Decisions honored (18-CONTEXT.md)

- D1 catalog + detect only (no harnessed-run install). D2 opt-in via NEW `manifests/optional/` (install-base globs only tools/skill-packs → never base; `harnessed install` resolves only tools/skill-packs → not installable → CodeGraph self-installs). D3 cli-npm + MIT (whitelist). D4 doctor always-pass. D5 capability entry. D6 TDD.

## Opt-in + no-vendor (verified)

- `install-base.ts` / `install.ts` do NOT reference codegraph or `manifests/optional/` (grep clean) → CodeGraph is never auto-installed and never in the base profile.
- Only a manifest YAML + a doctor check + a capability entry were added — zero CodeGraph upstream code copied into the repo.

## Two test-infra fixes (mock plumbing, not logic)

The two doctor test files (`doctor.test.ts` + `doctor-fixtures.test.ts`) globally `vi.mock('node:fs', { readFileSync })` without `existsSync`; checkCodeGraph's `existsSync` crashed under them. Followed the established pattern (every fs/env-using check is module-mocked to a fixed pass) — added a `vi.mock('check-codegraph.js')` to both. Real logic is unit-tested in `check-codegraph.test.ts`.

## Evidence

- TDD: check-codegraph RED→GREEN, **5 tests** (checkCodeGraph present/absent/always-pass ×3 + manifest validates + MIT ×2).
- Typecheck: `tsc --noEmit` exit 0.
- Biome: 315 files clean.
- Full suite: **1285 passed | 5 skipped | 1 todo, 0 failed** (was 1280; +5).
- Opt-in: install-base/install grep-clean of codegraph. No-vendor: only manifest + check + capability, no upstream code.
- `git diff --stat`: ROADMAP + doctor-registry + 2 doctor test files + capabilities; untracked new: codegraph.yaml, check-codegraph.ts, check-codegraph.test.ts, phase docs.

## Acceptance — all met

1. ✅ codegraph.yaml validates + MIT + describes install/verify/uninstall
2. ✅ not in base + not `harnessed install`-able (manifests/optional/)
3. ✅ checkCodeGraph present→pass / absent→pass+hint (always pass)
4. ✅ doctor 13 checks + summary 'pass' + both doctor test files updated
5. ✅ capabilities codegraph entry + check-workflow-schema green
6. ✅ full gate green; biome clean; no-vendor

## Not done / deferred

- harnessed-managed install (rejected — CodeGraph self-installs).
- Routing/decision-rule auto-suggest (rejected ambitious option).
- Phase 19 (minimal adoption) — last.
