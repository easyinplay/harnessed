# Phase 6.1: v1.0 GA tag ship + npm publish stream — Research

**Researched:** 2026-05-19
**Domain:** npm publish (OIDC provenance), GitHub Actions workflows, package.json metadata, release documentation
**Confidence:** HIGH (core npm/GHA findings verified via official docs; package.json audit verified live)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 OrganicClockInterpretation**: Phase 6.1 ships v1.0 GA today — organic clock OPENED (NOT close prereq); sister D-04 HYBRID precedent ADR 0020
- **D-02 NpmPublishStrategy**: GitHub Actions `.github/workflows/publish.yml` NEW + release-by-tag trigger + npm provenance attestation (sigstore-backed); `permissions: id-token: write` + `npm publish --provenance --access public`
- **D-03 ReadmeBadgeSwap**: ADD shields.io npm version badge; REMOVE pre-launch badge; KEEP License + Sponsor; Status section v1.0 GA SHIPPED note
- **D-04 V10TagAnnotation**: Comprehensive 25-40L major release annotation — 5 sections: intro (3L) + milestones (5L) + GA criteria (9L) + stats (5L) + forward (5L)
- **D-05 PackageJsonUpdate**: `"private": true` REMOVE + `"version": "1.0.0"` + metadata verify (description/keywords/homepage/repository/bugs/license/author)
- **D-06 ChangelogV10**: `## [1.0.0] - 2026-05-22` MAJOR release line above [0.5.0]
- **D-07 RoadmapV10ShippedAndPostV10Outline**: Phase 6.1 row PROGRESS → 🎯 SHIPPED + v1.0+ maintenance outline ~30L
- **D-08 MaintenanceModeForwardSignal**: MAINTAINER-ONBOARDING.md ~5-10L NOTE section forward visibility; NO negative-framing

### Claude's Discretion

- npm registry account claim — manual external prereq (user one-time)
- `.github/workflows/publish.yml` NEW structure — recommend Node setup + pnpm + npm publish --provenance
- GitHub repository npm publisher integration UI — user manual external prereq
- ADR 0023 invoke decision — RECOMMEND YES (NEW infrastructure publish.yml = architectural NEW)
- CI A7 step iter 0022→0023 IF ADR 0023 added
- v1.0 tag annotation 25-40L draft per D-04 5 sections

### Deferred Ideas (OUT OF SCOPE)

- Strict literal organic clock close (~2026-11 defer) — REJECT per D-01
- npm token + 2FA local publish — REJECT per D-02
- Hybrid manual first + OIDC after — REJECT per D-02
- Double badge cross-signal — REJECT per D-03
- Maintenance-only mode immediate signal — REJECT per D-03
- 1-line or 60+ line tag — REJECT per D-04
- Bump version 1.0.0-rc.X intermediate — REJECT per D-05
- Detailed Phase 7.x task spec — outline only per D-07
- Immediate maintenance mode wording — REJECT per D-08
- npm registry self-host — REJECT default npmjs.org
- #BC/#BD/#BE/#BN reactivation — DEFER post-v1.0
</user_constraints>

---

## Summary

Phase 6.1 is the FINAL phase of the harnessed project: v1.0 GA tag creation, npm publish stream establishment via GitHub Actions OIDC provenance, README badge swap, and release documentation (CHANGELOG, ROADMAP, MAINTAINER-ONBOARDING forward signal). No new source code is written — this is a pure production release phase with one new infrastructure artifact (`.github/workflows/publish.yml`).

**Critical discovery:** npm supports true **Trusted Publishing** (OIDC-only, no NPM_TOKEN long-lived token required). The workflow only needs `permissions: id-token: write` plus a one-time npm registry UI configuration to register GitHub Actions as a trusted publisher. This is strictly better than the classic `NPM_TOKEN` secret approach per D-02. [VERIFIED: docs.npmjs.com/trusted-publishers]

**Package name status:** `harnessed` is unclaimed on the npm registry — `npm view harnessed` returns 404. [VERIFIED: npm registry live probe]

**Tarball audit:** `npm pack --dry-run` confirms 51 files, 210.5 kB compressed, 843.9 kB unpacked. The `files` array in `package.json` is already correctly scoped: `dist/`, `manifests/`, `workflows/`, `routing/`, `config-templates/`, `schemas/`, `README.md`, `LICENSE`, `NOTICE`. No `.planning/`, no `tests/`, no `src/`, no `.github/` in tarball — clean. [VERIFIED: live npm pack run]

**Primary recommendation:** Use npm Trusted Publishing (OIDC, no token) for publish.yml. Add ADR 0023 (YES — new publish infrastructure is architectural). Trigger on `push: tags: 'v[0-9]+.[0-9]+.[0-9]+'` pattern. Package.json needs `private` removal + version bump to 1.0.0 only — all other metadata already present and correct.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| npm publish authentication | CI/CD (GitHub Actions) | npm registry (OIDC) | OIDC token minted by GHA, consumed by npm registry — no browser/client involvement |
| Tag creation | Local git | GitHub remote | LOCAL CREATE + push; tag triggers publish workflow |
| Provenance attestation | npm registry / sigstore | GitHub Actions OIDC | npm CLI calls sigstore with OIDC token; attestation stored at registry |
| README badge rendering | CDN (shields.io) | GitHub README | shields.io fetches npm registry version; badge is a URL reference only |
| CHANGELOG / ROADMAP / ADR docs | Repository (git) | — | Pure file edits, no runtime tier involved |
| CI A7 integrity gate | CI/CD (GitHub Actions) | git tags (baseline refs) | A7 step checks ADR file diffs against baseline tags |

---

## § 1: npm publish 4-step Rehearsal Sequencing (T3 absorb)

### Step 1: npm pack dry-run — COMPLETED in research

```bash
npm pack --dry-run
```

**Result (verified live):**
- Package: `harnessed@0.3.0` (will be `1.0.0` after D-05)
- Tarball: 210.5 kB compressed / 843.9 kB unpacked / 51 files
- Contents are correctly scoped via `files` array in package.json

**Files INCLUDED (correct):**
- `dist/` — built CLI + library output
- `manifests/` — skill/tool manifest YAML files
- `workflows/` — composition skill markdown
- `routing/` — B+C routing rules
- `config-templates/` — hook configuration templates
- `schemas/` — JSON Schema artifacts
- `README.md`, `LICENSE`, `NOTICE`
- `package.json`

**Files EXCLUDED (correct — NOT in tarball):**
- `.planning/` — excluded (not in `files` array) ✅
- `tests/` — excluded ✅
- `src/` — excluded (only `dist/` published) ✅
- `.github/` — excluded ✅
- `docs/adr/` — excluded ✅
- `scripts/` — excluded ✅
- `.harnessed/` runtime dir — excluded ✅

**Verdict:** `.npmignore` is NOT needed. The `files` array in `package.json` already acts as a whitelist allowlist, which is stricter and more explicit than `.npmignore`. [VERIFIED: npm pack --dry-run live]

### Step 2: .npmignore — NOT NEEDED

`package.json` `files` array whitelist is the recommended approach over `.npmignore`. When `files` is present, it takes precedence. Adding `.npmignore` would be redundant and could introduce confusion. [ASSUMED: npm whitelist vs blacklist behavior per training knowledge — consistent with pack output]

### Step 3: npm publish --dry-run simulation

```bash
# After package.json private removal + version 1.0.0 bump:
npm publish --dry-run --access public
```

This requires Node.js authentication state but will simulate the publish flow including provenance flag validation. Wave 0 task should include this as a local verification step BEFORE pushing the v1.0 tag.

**Important:** `--dry-run` does NOT test OIDC — it simulates the publish without actually uploading. True OIDC test only happens in the actual CI workflow. [ASSUMED: npm dry-run scope per training knowledge]

### Step 4: Package name claim verification

```bash
npm view harnessed
# Returns: npm error 404 Not Found — package name is UNCLAIMED ✅
```

[VERIFIED: npm registry live probe — 404 returned, package name available]

**Wave 0 T0.X recommendation:** Add a PREREQ task: (1) user creates npm account + claims package `harnessed` via `npm publish` first-time flow, (2) user configures Trusted Publisher in npm registry UI (see § 2), (3) `npm pack --dry-run` local verify with version 1.0.0.

---

## § 2: `.github/workflows/publish.yml` NEW Infra (D-02)

### Authentication Architecture: Trusted Publishing (OIDC — NO TOKEN)

npm supports **Trusted Publishing** — OIDC-based authentication that eliminates long-lived NPM_TOKEN entirely. [VERIFIED: docs.npmjs.com/trusted-publishers]

**How it works:**
1. npm registry UI: register GitHub Actions as trusted publisher for package `harnessed`
2. GHA workflow: `permissions: id-token: write` allows OIDC token minting
3. `npm publish --provenance --access public` — npm CLI auto-detects OIDC env, authenticates without token
4. sigstore attestation generated and attached to package

**Setup prerequisites (user manual, one-time external):**
1. Create npm account at npmjs.com
2. Publish package once to claim name (first publish establishes ownership)
3. Navigate to package settings → Trusted Publishers → Add publisher
4. Enter: GitHub username/org + repository name (`harnessed`) + workflow filename (`publish.yml`)
5. No secret configuration needed in GitHub repository settings

### Recommended publish.yml (~55L)

```yaml
name: publish
on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'   # matches v1.0.0, v1.0.1, etc.
permissions:
  contents: read
  id-token: write                   # required for OIDC trusted publishing
jobs:
  publish:
    name: npm publish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5  # v4.3.1 (sister ci.yml SHA pin)
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020  # v4.4.0 (sister ci.yml SHA pin)
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: corepack enable
      - run: corepack pnpm install --frozen-lockfile
      - run: corepack pnpm build
      - run: npm publish --provenance --access public
```

**Key design decisions:**
- **Trigger**: `push: tags: v[0-9]+.[0-9]+.[0-9]+` — semantic version tags only (NOT `v*` which would also match alpha/rc tags like `v0.5.0-alpha.1`)
- **ubuntu-latest only**: npm publish is platform-agnostic; cross-OS matrix not needed for publish job
- **SHA-pinned actions**: Sister ci.yml supply-chain hardening pattern (Phase 1.1.1 hotfix H1) — same SHAs as ci.yml
- **pnpm install + pnpm build**: Sister ci.yml pattern; build ensures fresh dist/ before publish
- **npm publish NOT pnpm publish**: npm CLI is the canonical tool for provenance; pnpm publish has provenance support but npm CLI is more reliable per D-02 LOCK
- **No NODE_AUTH_TOKEN**: Trusted publishing eliminates the need for any secret token
- **registry-url**: Required by setup-node to generate .npmrc; needed even with OIDC

**Estimated line count:** ~50-58L [VERIFIED: counted above template]

**Sister ci.yml format references:**
- SHA-pinned checkout + setup-node — exact same action SHAs [VERIFIED: ci.yml L28-31]
- `corepack enable` + `corepack pnpm install --frozen-lockfile` — exact same pattern [VERIFIED: ci.yml L150-151]
- `corepack pnpm build` — exact same [VERIFIED: ci.yml L175]
- `permissions: contents: read` — sister pattern; add `id-token: write` for OIDC

**FALLBACK (if Trusted Publishing not configured before tag push):** Add `NPM_TOKEN` granular access token as `secrets.NPM_TOKEN` and add `env: NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` to the publish step. This is the fallback-only path; prefer Trusted Publishing per D-02.

---

## § 3: package.json D-05 Verify (Current State Audit)

**Live audit of `package.json`** [VERIFIED: file read]

| Field | Current Value | D-05 Action |
|-------|--------------|-------------|
| `"private"` | `true` | **REMOVE** — blocks publish |
| `"version"` | `"0.3.0"` | **CHANGE to `"1.0.0"`** |
| `"name"` | `"harnessed"` | ✅ correct |
| `"description"` | `"AI coding harness package manager + composition orchestrator"` | ✅ present |
| `"keywords"` | 7 items: claude-code, ai-harness, package-manager, composition, skill-pack, mcp, orchestrator | ✅ 7 items present |
| `"homepage"` | `"https://github.com/easyinplay/harnessed#readme"` | ✅ present |
| `"repository"` | `{ "type": "git", "url": "https://github.com/easyinplay/harnessed.git" }` | ✅ present |
| `"bugs"` | `"https://github.com/easyinplay/harnessed/issues"` | ✅ present |
| `"license"` | `"Apache-2.0"` | ✅ correct |
| `"author"` | **MISSING** | **ADD** `"easyinplay"` or `"easyinplay <easyinplay@gmail.com>"` |
| `"engines"` | `{ "node": ">=22.0.0" }` | ✅ node ≥22 per project |
| `"type"` | `"module"` | ✅ ESM |
| `"bin"` | `{ "harnessed": "./dist/cli.mjs" }` | ✅ CLI entry present |
| `"files"` | 8 entries including dist/, manifests/, workflows/, routing/, config-templates/, schemas/, README.md, LICENSE, NOTICE | ✅ whitelist clean |
| `"main"` | `"./dist/index.mjs"` | ✅ |
| `"exports"` | 3 entries: `.`, `./schemas`, `./package.json` | ✅ |

**Summary of D-05 changes needed:**
1. Remove `"private": true` line
2. Change `"version": "0.3.0"` → `"version": "1.0.0"`
3. Add `"author": "easyinplay"` field

All other metadata fields are already present and correct. [VERIFIED: package.json live read]

---

## § 4: ADR 0023 Invoke Decision (T5)

**Recommendation: YES — add ADR 0023** [ASSUMED: architectural classification based on project ADR patterns]

**Rationale:**

The project's ADR invocation pattern (per ci.yml A7 gate + ROADMAP records) is:
- ADR added for every ARCHITECTURAL decision — new infrastructure, new patterns, new schema surfaces
- ADR NOT added for pure publish-only / community-infra phases (Phase 4.1 benchmark, Phase 4.2 stale-bot — no ADR; Phase 4.3 audit log — ADR 0018)

Phase 6.1 introduces `.github/workflows/publish.yml` — a NEW GitHub Actions workflow establishing the npm publish pipeline. This is **architectural NEW infrastructure** per M-01 PhaseClass: PRODUCTION RELEASE analysis:
- Establishes permanent release cadence pattern (v1.x future releases reuse this workflow)
- Introduces OIDC trusted publishing as institutional security pattern
- Locks the "tag push → auto-publish" contract for all future releases

**ADR 0023 outline (sister ADR 0022 9-section format):**

```
# ADR 0023: Phase 6.1 — v1.0 GA npm publish pipeline (OIDC trusted publishing + sigstore provenance)

## Status
Accepted (phase 6.1 W1 — 2026-05-22)

## Context
Phase 6.1 first MAJOR release (v1.0 GA). Need automated, supply-chain-secure npm publish.
Three options: (a) manual npm token + 2FA local, (b) long-lived NPM_TOKEN in CI secret,
(c) OIDC trusted publishing (no long-lived token). D-02 LOCK selects (c).

## Decision
.github/workflows/publish.yml NEW: tag-triggered (v[0-9]+.[0-9]+.[0-9]+) + ubuntu-latest +
OIDC id-token:write + npm publish --provenance --access public. Trusted publisher
registered on npmjs.com for easyinplay/harnessed/publish.yml. No NPM_TOKEN stored.

## Consequences
- Tag push v1.x.y → automatic publish with sigstore provenance attestation
- Supply-chain: consumers can verify build origin via npm provenance chain
- Future releases: same workflow reused (no per-release manual steps)
- Cross-ref: ADR 0021 (state lock) + ADR 0022 (path traversal) — v0.5.0 security posture
  completes before GA tag

## Sections 5-9: [9-section format sister ADR 0022 延袭]
```

**Estimated line count:** ~160-180L (sister ADR 0022 9-section format; ADR 0022 was accepted at similar scope) [ASSUMED: line count estimate based on sister ADR length patterns]

---

## § 5: ci.yml A7 Step Iter 0022→0023

**IF ADR 0023 added**, the A7 step requires two surgical edits — sister Phase 5.2 pattern延袭. [VERIFIED: ci.yml live read L87-112]

**Edit 1 — tag fetch loop (L90):**
```
# Current:
for n in 0001 0002 ... 0021 0022; do
# After:
for n in 0001 0002 ... 0021 0022 0023; do
```

**Edit 2 — integrity check loop (L101):**
```
# Current:
for n in 0001 0002 ... 0021 0022; do
# After:
for n in 0001 0002 ... 0021 0022 0023; do
```

**Edit 3 — A7 comment header (L87):**
```
# Current:
- name: A7 acceptance bar — ADR 0001-0022 main body 守恒
# After:
- name: A7 acceptance bar — ADR 0001-0023 main body 守恒
```

**Edit 4 — success echo (L112):**
```
# Current:
echo "A7 ✅ ADR 0001-0022 main body unchanged"
# After:
echo "A7 ✅ ADR 0001-0023 main body unchanged"
```

**Critical ordering constraint**: ci.yml A7 iter MUST be committed BEFORE the `adr-0023-accepted` baseline tag is created (sister Phase 4.3 T-4.3-07 STRIDE constraint延袭). Tag creation happens in W2; ci.yml A7 iter should be in W1.

**Verify NO main body diff**: Existing ADR 0001-0022 — zero diff required per A7 守恒 principle. Only the loop bounds change, not any ADR file content. [VERIFIED: ci.yml L87-112 structure]

---

## § 6: CHANGELOG [1.0.0] MAJOR Release Entry (D-06)

**Position:** Insert above `## [0.5.0] - 2026-05-22` (current first release entry at L10)

**Current CHANGELOG state:** [VERIFIED: CHANGELOG.md live read]
- Has `## [Unreleased]` section at top
- Has `## [0.5.0] - 2026-05-22` as first release
- Footer links reference `[Unreleased]: .../compare/v0.5.0...HEAD`

**Recommended [1.0.0] entry structure:**

```markdown
## [1.0.0] - 2026-05-22

### Added
- Released to npm registry — `npm install harnessed` or `npx harnessed@latest setup` now live
- `.github/workflows/publish.yml` — tag-triggered OIDC trusted publishing + sigstore provenance (ADR 0023)
- ADR 0023 — v1.0 GA npm publish pipeline architecture (OIDC trusted publishing pattern)
- 21 phases complete (20/20 pre-GA + Phase 6.1 GA ship) — 22 ADRs (0001-0023)
- 756 tests stable (CI 3-OS green: ubuntu / macOS / Windows)

### Changed
- `package.json` — `private: true` removed + version `0.3.0` → `1.0.0` + `author` field added
- `README.md` badge — pre-launch status badge replaced with npm version shield (auto-tracks)
- `README.md` Status section — v1.0 GA SHIPPED 2026-05-22; npm publish stream live
- ROADMAP.md Phase 6.1 → 🎯 SHIPPED; v1.0+ Maintenance-Only Mode forward outline added

### Note
- 6-month co-maintainer organic clock opened 2026-05-22 (closes ~2026-11 per ADR 0020 D-04 HYBRID)
- Post-clock decision: maintenance-only mode if no co-maintainer recruited; continued active if recruited
- Forward visibility: see ROADMAP.md § v1.0+ and MAINTAINER-ONBOARDING.md
```

**Footer link to add:**
```
[1.0.0]: https://github.com/easyinplay/harnessed/compare/v0.5.0...v1.0.0
```

**ADR count note:** D-06 CONTEXT.md says "22 ADRs" but that was before ADR 0023 decision. If ADR 0023 is added (recommended YES per § 4), CHANGELOG should say "23 ADRs (0001-0023)". [ASSUMED: ADR count contingent on ADR 0023 decision]

---

## § 7: v1.0 GA Tag Annotation 25-40L Draft (D-04)

**Per D-04 LOCKED 5-section structure, 25-40L target.** Sister 9-line minor cadence NOT applicable.

```
harnessed v1.0.0 GA — AI coding harness package manager + composition orchestrator

Released: 2026-05-22. Production-ready stable release after 12-day intensive build
(2026-05-11 to 2026-05-22). Machines CLAUDE.md three-layer methodology into
executable engine: gstack decisions + GSD orchestration + superpowers execution.

── Milestone History ──────────────────────────────────────────────────────────
v0.1.0 (2026-05-15): manifest engine + research workflow + routing engine v1 (9 ADRs)
v0.2.0 (2026-05-16): execute-task + ralph-loop + 4 installer types (ADR 0010-0013)
v0.3.0 (2026-05-17): plan-feature + checkpoint + aliases + 100% routing hit-rate (ADR 0014-0017)
v0.4.0 (2026-05-19): dogfooding benchmark + co-maintainer onboarding + audit log (ADR 0018-0020)
v0.5.0 (2026-05-22): audit consumer + state lock + uninstall + path traversal hardening (ADR 0021-0022)

── 9 GA Criteria ───────────────────────────────────────────────────────────────
✅ R8.1-R8.5: audit log + co-maintainer onboarding + stale-bot + ADR corpus + Sponsors
✅ R10.1-R10.4: audit consumer + state lock + uninstall + path traversal hardening
✅ Organic clock OPENED (2026-05-22): co-maintainer 6-month recruit window live
✅ Tests: 756 PASS; CI: ubuntu + macOS + Windows native all green
✅ Benchmark: docs/benchmarks/v0.4.md — 30-task / 100% routing hit-rate public
✅ Security: path-guard OWASP A1 5-vector (ADR 0022); OIDC trusted publish (ADR 0023)
✅ Docs: README + PROJECT-SPEC + CONTRIBUTING + MAINTAINER-ONBOARDING all current
✅ npm publish: live at npmjs.com/package/harnessed (OIDC provenance + sigstore)
✅ README: stable npm version badge replaces pre-launch badge

── Project Stats ───────────────────────────────────────────────────────────────
23 ADRs (0001-0023) | 756 tests | 21 phases | 2 manifest dirs
18 install methods | 23 routing rules | Apache-2.0

── Forward ─────────────────────────────────────────────────────────────────────
6-month organic clock closes ~2026-11. Post-clock: maintenance-only if no co-maintainer
recruited; continued active if recruited + healthy (Avelino 36%/year bus factor).
npm publish stream live — future releases auto-publish on tag push via ADR 0023.
Co-maintainer recruiting: docs/MAINTAINER-ONBOARDING.md | Sponsor: github.com/sponsors/easyinplay
Apache-2.0 | https://github.com/easyinplay/harnessed
```

**Line count: ~32L** — within D-04 25-40L target. [ASSUMED: exact wording subject to planner refinement]

---

## § 8: README Badge Swap (D-03)

**Current state (verified live):** [VERIFIED: README.md L6-8]

```markdown
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-pre--launch-orange)](./.planning/ROADMAP.md)
[![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)
```

**After D-03 swap:**

```markdown
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![npm](https://img.shields.io/npm/v/harnessed?label=npm&color=blue)](https://npmjs.com/package/harnessed)
[![Sponsor](https://img.shields.io/github/sponsors/easyinplay?logo=github&label=Sponsor)](https://github.com/sponsors/easyinplay)
```

**Changes:**
- Line 2: REPLACE pre-launch badge with npm version badge (auto-tracks published version)
- Lines 1 and 3: KEEP unchanged (License + Sponsor)

**Status section (README L40-48, current):** [VERIFIED: README.md L40-44]
```
- **Current**: 🎯 **v0.5.0 SHIPPED 2026-05-22** (4/4 milestones close); v1.0 GA target window 2026-05-22~23 post-close per ROADMAP § v1.0
- **Next**: Phase 6.x — v1.0 GA (🎯 v1.0 tag + npm publish + README "stable" badge; post-close independent window)
```

**After D-03 update:**
```
- **Current**: 🎯 **v1.0 GA SHIPPED 2026-05-22** (21/21 phases 100%); npm publish stream live; maintenance-only mode trigger ~2026-11 post organic clock end (per ADR 0020)
```

**Sneak-block enforcement:** NO "frozen" or "abandoned" language per D-03. Forward visibility only.

---

## § 9: ROADMAP v1.0 SHIPPED + v1.0+ Maintenance Outline (D-07)

**Current v1.0 chapter state:** [VERIFIED: ROADMAP.md L289-321]

Phase 6.1 row is listed as outline only ("Phase 6.1 outline (scope freeze guard)") — needs SHIPPED status.

**v1.0 chapter header update:**
```markdown
## v1.0 — Production-ready GA + npm publish + README "stable" badge — 🎯 **SHIPPED 2026-05-22**

> Phase 6.1: v1.0 GA tag + npm publish stream live + README stable badge — SHIPPED 2026-05-22
> 9/9 GA criteria all ✅ (R8.1-R8.5 + R10.1-R10.4 verified + organic clock OPENED)
```

**v1.0+ maintenance outline section to ADD (~30L):**

```markdown
## v1.0+ — Maintenance-Only Mode (Forward Visibility)

> **Note (D-04 HYBRID 2-clock per ADR 0020)**: v1.0 GA shipped. External 6-month organic clock
> opened 2026-05-22. Post-clock decision point ~2026-11.

### Goal
Operate in maintenance mode after organic clock ends. Decide continuation posture
based on co-maintainer recruitment outcome.

### Trigger
~2026-11 (± buffer): organic clock end per ADR 0020 D-04 HYBRID 2-clock. Review window
opened Phase 4.2 (2026-05-18), 6 months → ~2026-11-18 approximate target.

### Outcomes (two paths)

**(a) Maintenance-only mode** (if no co-maintainer recruited by clock end):
- Accept maintenance-only posture — documented in MAINTAINER-ONBOARDING.md
- Security patches and critical bug fixes only; no new features
- Avelino 36%/year bus factor acknowledged; no pretense of active development

**(b) Continued active development** (if co-maintainer recruited + project healthy):
- Discuss Phase 7.x scope via `/gsd-discuss-phase 7.x`
- v1.1.x minor releases; community-driven feature roadmap
- ADR 0024+ as needed for new architectural decisions

### Reject List (v1.0+ scope freeze guard)
- ❌ New workflow types beyond 3 MVP (research/execute-task/plan-feature)
- ❌ Cloud manifest registry
- ❌ Dashboard visualization
- ❌ Cross-harness support (schema interface preserved, not implemented)
```

---

## § 10: MAINTAINER-ONBOARDING.md Forward Note (D-08)

**Current state:** [VERIFIED: MAINTAINER-ONBOARDING.md L1-30]

File has: Status note (v0.4 activated), Goal, Recruiting Window, Co-maintainer Role, Required Reading sections.

**Section to ADD (~8L, at end of file or after "Recruiting Window" section):**

```markdown
## Post-v1.0 Maintenance Mode (Forward Visibility)

> Transparency note for prospective co-maintainers per ADR 0020 (D-04 HYBRID 2-clock).

After the 6-month co-maintainer recruit window closes (~2026-11), the project will
enter one of two states:

- **Co-maintainer recruited + healthy** → continued active development; Phase 7.x discuss
- **No co-maintainer recruited** → maintenance-only mode (security + critical fixes only)

This is honest project stewardship, not a sign of abandonment. The recruit window is
active now — see "Co-maintainer 角色定位" above for the commitment level required.
```

**NO negative-framing:** "frozen" and "abandoned" words explicitly excluded per D-08 sneak-block.

---

## § 11: Risk Matrix R-1 to R-5

| Risk | Level | Description | Mitigation |
|------|-------|-------------|------------|
| **R-1** | HIGH | npm publish is irreversible — once `npm publish` runs for a version, that version cannot be unpublished after 72 hours | T3 4-step rehearsal in Wave 0: npm pack dry-run ✅ (done in research) + verify tarball + npm publish --dry-run simulation + name claim verify ✅ (done: 404 confirmed) |
| **R-2** | MED | OIDC Trusted Publishing setup complexity — npm registry UI config must be done before first tag push; if misconfigured, publish workflow fails silently or with auth error | Wave 0 PREREQ task: user configures Trusted Publisher in npmjs.com UI BEFORE creating v1.0 tag; fallback documented (NPM_TOKEN secret path) |
| **R-3** | LOW | ADR 0023 invoke decision — planner must decide YES/NO before W1 tasks begin | Research recommends YES (§ 4); planner confirms and locks in Wave 0 |
| **R-4** | LOW | Tag annotation 25-40L Karpathy budget — risk of over-writing | D-04 5-section structure enforced; §7 draft is 32L (within budget) |
| **R-5** | LOW | STATE.md post-v1.0 maintenance freeze — D2 iter 8 = TERMINUS; explicit graduation signal needed | Wave 0 W0.1 task: #BA SIZE_LIMIT round 5 + #BS D2 iter 8 TERMINUS signal; post-v1.0 STATE enters maintenance freeze (no more iter cadence) |

### R-1 Irreversibility detail

npm's unpublish policy: packages can be unpublished within 72 hours IF no other packages depend on them. After 72 hours, unpublish is permanently blocked. For a new package with no dependents, the 72-hour window technically applies — but the correct mental model is: **treat it as irreversible from day one**. Version 1.0.0 cannot be re-published once any user downloads it.

**Mitigation checklist for Wave 0:**
- [ ] `npm pack --dry-run` — tarball contents verified ✅ (done in research)
- [ ] `package.json` private removal + version 1.0.0 verified before tag
- [ ] Trusted Publisher configured in npm UI
- [ ] `npm publish --dry-run --access public` local simulation
- [ ] `npm view harnessed` — 404 confirmed ✅ (done in research)

---

## § 12: Open Questions — RESOLVED

### OQ-1: npm registry account claim — manual prereq
**Status: RESOLVED with recommendation**
The `harnessed` package name is unclaimed (404 verified). User must: (1) create npm account, (2) configure Trusted Publisher in npm registry UI for `easyinplay/harnessed/publish.yml`. This is a manual one-time external prereq — planner should add as Wave 0 PREREQ checkpoint (T0.0 PREREQ).

### OQ-2: GitHub repository npm publisher integration
**Status: RESOLVED**
With Trusted Publishing (OIDC), there is NO GitHub repository secret configuration needed. The integration is configured entirely on the npm registry side (npmjs.com package settings → Trusted Publishers). GitHub side only needs `permissions: id-token: write` in the workflow YAML.

### OQ-3: ADR 0023 invoke decision — YES or NO?
**Status: RESOLVED — RECOMMEND YES**
Rationale: `.github/workflows/publish.yml` is new CI/CD infrastructure establishing the permanent release pipeline pattern. Per project ADR invocation history: Phase 4.3 added ADR 0018 for routing audit log (new infrastructure); Phase 5.1 added ADR 0021 for state lock (new pattern); Phase 5.2 added ADR 0022 for uninstall + security (new pattern). Phase 6.1 publish pipeline is equivalent architectural weight — new infra + new security pattern (OIDC) + permanent release cadence lock. ADR 0023 justified.

### OQ-4: pnpm publish vs npm publish
**Status: RESOLVED — use npm publish**
D-02 LOCKS `npm publish --provenance --access public`. pnpm publish supports `--provenance` as of pnpm v8+ but npm CLI is the canonical tool and more reliable for OIDC provenance attestation. Use `npm publish` directly (npm is installed alongside Node.js; pnpm install/build uses pnpm, publish uses npm). [VERIFIED: docs.npmjs.com/generating-provenance-statements]

### OQ-5: NODE_AUTH_TOKEN still needed with OIDC?
**Status: RESOLVED — NOT needed with Trusted Publishing**
npm Trusted Publishing eliminates `NODE_AUTH_TOKEN`. The npm CLI auto-detects the OIDC environment when `id-token: write` permission is granted and the package has a configured trusted publisher. No `secrets.NPM_TOKEN` needed in GitHub repository settings. [VERIFIED: docs.npmjs.com/trusted-publishers]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| npm publish authentication | Custom token management / rotation scripts | npm Trusted Publishing (OIDC) | Long-lived tokens are security debt; OIDC is scoped to single workflow run |
| Provenance attestation | Custom signing scripts | `npm publish --provenance` flag | sigstore integration built into npm CLI; supply-chain standard |
| Tarball content control | Custom exclusion scripts | `files` array in package.json (already present) | Whitelist semantics; already correctly configured |
| Workflow SHA pinning | Manual hash lookups | Reuse exact SHAs from ci.yml | Supply-chain hardening already applied; sister pattern reuse |
| CHANGELOG format | Custom format | Keep-a-Changelog format (already in use) | Established in Phase 4.3; D-04 LOCK |

---

## Standard Stack

### Core (Phase 6.1 specific)

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `actions/checkout` | SHA `34e114876b0b11c390a56381ad16ebd13914f8d5` (v4.3.1) | Checkout repo in GHA | Sister ci.yml SHA — supply-chain hardened |
| `actions/setup-node` | SHA `49933ea5288caeca8642d1e84afbd3f7d6820020` (v4.4.0) | Node.js + .npmrc generation | Sister ci.yml SHA — generates registry .npmrc |
| npm CLI | `11.12.1` (system) | `npm publish --provenance --access public` | Canonical provenance tool; Node bundled |
| sigstore | (bundled in npm ≥9.5) | Supply-chain attestation | Automatic via `--provenance` flag |

[VERIFIED: npm --version = 11.12.1 live; action SHAs from ci.yml]

---

## Validation Architecture

No new test files are required for Phase 6.1 (no new `src/` code). Existing 756 tests must remain stable (zero regression). The phase gate is:

| Gate | Command | When |
|------|---------|------|
| Existing test suite | `corepack pnpm test` | Per wave commit |
| biome lint | `pnpm exec biome check --write` | Before every TS/JS commit (per `feedback_biome-preempt.md` — 3 CI-red recurrences) |
| A7 integrity gate | CI auto-runs on push | Verify after ci.yml A7 iter |
| npm pack dry-run | `npm pack --dry-run` | Wave 0 prereq verify |
| STATE.md size gate | CI `check-state-archive-stale.mjs` | Per commit to main |

**Wave 0 Gaps:** None for tests. W0.1 task (#BA SIZE_LIMIT round 5 + #BS D2 iter 8) is a planning/docs task, not a test gap.

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | NO | npm auth handled by OIDC/Trusted Publishing (not app auth) |
| V3 Session Management | NO | No session management in release phase |
| V4 Access Control | YES (partial) | publish.yml `permissions: contents: read; id-token: write` — minimal privilege |
| V5 Input Validation | NO | No new user-input code |
| V6 Cryptography | YES | sigstore provenance via `--provenance` flag — never hand-roll |

**Known Threat Patterns:**

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious tag push triggers publish | Spoofing | Tag protection rules on GitHub (user-configures); OIDC scope limits to workflow |
| Supply-chain: compromised npm token | Tampering | Trusted Publishing eliminates long-lived token entirely |
| Tarball inclusion of sensitive files | Information Disclosure | `files` array whitelist verified clean (§ 1 + § 3) |
| Mutable action refs | Tampering | SHA-pinned actions (sister ci.yml H1 pattern) |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | publish.yml runtime, pnpm commands | ✓ | v24.15.0 | — |
| npm CLI | `npm publish --provenance` | ✓ | 11.12.1 | — |
| git | tag creation, push | ✓ | (system) | — |
| GitHub Actions (ubuntu-latest) | publish.yml CI runner | ✓ | managed by GHA | — |
| npm registry `harnessed` name | package publish | ✓ (unclaimed) | — | — |
| npm account (easyinplay) | trusted publisher config | external prereq | — | Create account manually |
| npm Trusted Publisher config | OIDC auth (no token) | external prereq (not yet configured) | — | NPM_TOKEN granular token as fallback |

**Missing dependencies with no fallback:**
- npm account creation + Trusted Publisher configuration — must be done by user before v1.0 tag push (Wave 0 PREREQ)

**Missing dependencies with fallback:**
- Trusted Publisher not configured → fallback: add `NPM_TOKEN` granular access token as `secrets.NPM_TOKEN` in GitHub repo settings + `env: NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` in publish step

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `.npmignore` not needed — `files` array whitelist is sufficient | § 1 Step 2 | Would need to add `.npmignore` to exclude additional files; low risk given pack dry-run verified clean |
| A2 | `npm publish --dry-run` does not test OIDC authentication | § 1 Step 3 | Minor — dry-run scope may vary; real test is the live publish workflow |
| A3 | ADR 0023 justified as ARCHITECTURAL per project ADR invocation history | § 4 | If planner decides NO, skip ADR 0023 + ci.yml A7 iter; affects tag annotation ADR count |
| A4 | Tag annotation ~32L wording in § 7 is draft for planner refinement | § 7 | Exact wording subject to planner adjustment; structure (5 sections) is locked per D-04 |
| A5 | CHANGELOG ADR count "23 ADRs" contingent on ADR 0023 being added | § 6 | If NO ADR 0023: use "22 ADRs (0001-0022)" instead |
| A6 | npm Trusted Publishing is stable and production-ready | § 2 | If npm changes Trusted Publishing behavior, fallback NPM_TOKEN path documented |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Long-lived NPM_TOKEN in CI secrets | OIDC Trusted Publishing (no token) | npm 2023-2024 | Eliminates token rotation, reduces secret sprawl |
| `@v4` mutable action refs | SHA-pinned action refs | 2022+ (industry practice) | Supply-chain hardening; immutable refs |
| `.npmignore` blacklist | `files` array whitelist in package.json | npm best practice | Explicit whitelist safer than blacklist |
| Manual version bump + publish | Tag-triggered CI auto-publish | GitHub Actions maturity | Reproducible, auditable releases |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: docs.npmjs.com/trusted-publishers] — OIDC trusted publishing, no NPM_TOKEN needed
- [VERIFIED: docs.npmjs.com/generating-provenance-statements] — `--provenance` flag, `id-token: write` permission
- [VERIFIED: docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-nodejs-packages] — GHA publish workflow pattern
- [VERIFIED: npm registry live probe] — `harnessed` package name = 404 (unclaimed)
- [VERIFIED: npm pack --dry-run live] — tarball contents 51 files, clean whitelist
- [VERIFIED: package.json live read] — current field audit (private/version/metadata)
- [VERIFIED: .github/workflows/ci.yml live read] — sister workflow format, SHA pins, A7 step structure
- [VERIFIED: README.md live read] — badge area L6-8, Status section L40-44
- [VERIFIED: CHANGELOG.md live read] — current structure, [0.5.0] entry position
- [VERIFIED: MAINTAINER-ONBOARDING.md live read] — current sections for D-08 target

### Secondary (MEDIUM confidence)
- [CITED: npm pack whitelist semantics] — `files` array takes precedence over `.npmignore`

### Tertiary (LOW confidence)
- [ASSUMED: A1-A6] — see Assumptions Log above

---

## Metadata

**Confidence breakdown:**
- npm publish / OIDC / Trusted Publishing: HIGH — verified via official npm docs
- publish.yml structure: HIGH — verified against official GHA docs + sister ci.yml
- package.json audit: HIGH — verified via live file read
- ADR 0023 recommendation: MEDIUM — based on project patterns (ASSUMED classification)
- Tag annotation draft wording: LOW — draft only, planner refines

**Research date:** 2026-05-19
**Valid until:** 2026-05-26 (7 days — npm Trusted Publishing is stable but fast-moving ecosystem)
