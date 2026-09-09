---
phase: 55
name: upstream_health Evaluation
status: complete
created: 2026-09-10
completed: 2026-09-10
gates_passed:
  - strategic gate SKIPPED (declared): not a new product direction — the fourth
    surface of the Phase 54 declaration-without-evaluation defect family. The one
    Phase-layer gray area (evaluate vs delete) was put to the user directly.
  - user decision: option C — keep the fields, add a network-free staleness gate
verified_refs:
  - "src/manifest/schema/spec.ts:206 — `upstream_health: UpstreamHealth` required (exists)"
  - "src/manifest/schema/spec.ts:71-80 — 4 required fields + optional `alternative` (exists)"
  - "zero consumers — grep over src/ scripts/ found only the schema declaration (verified)"
  - "19 manifests carry the block; 5 are first-party by `metadata.upstream.repository` (measured)"
  - "scripts/check-state-archive-stale.mjs — sibling staleness gate, hard-fail (exists)"
  - "scripts/check-upstream-freshness.mjs (NEW)"
  - ".github/workflows/ci.yml — gate placed after check-yaml-i18n-parity (edited)"
---

# Phase 55 — `upstream_health` Evaluation

## Problem

`spec.upstream_health` has been a required schema block since v0.1: 4 fields ×
19 manifests = 76 declarations, **zero code consumers**. Same family as Phase 54
(`max_iterations` templates, `capabilities.fires_when`, `verify/second-opinion`),
fourth surface.

The distinguishing property, and why deletion was the wrong answer: `routing_note`
was mis-read as a *machine* input, so renaming it fixed the problem outright.
`last_check` / `last_known_good_version` are read by *humans* as current facts
about our upstreams. Nothing stopped them being read that way when they rotted.
Measured rot at decision time: dates frozen between 2026-05-11 and 2026-07-30
(oldest 121 days), versions behind by 1 to 13 minors.

## What was rejected, and why

- **Delete the block.** Throws away real supply-chain provenance ("which version
  did we verify against"). 5/10 completeness.
- **Network compare against the registry.** Highest semantic completeness (10/10)
  but wrong signal: 11 of 14 upstreams were already drifted at decision time, and
  nearly every `install.cmd` resolves `@latest`, so drifting downward *is* the
  intended behaviour. A permanently-red light equals no light.
- **Compare installed-vs-known-good.** Investigated and found **not buildable**:
  `HarnessedStateEntry.version` exists, but every caller passes a
  manifest-declared value (`install.npm_version` / `install.git_ref` / `''`), not
  a detected version — see `src/installers/lib/state.ts` and its 7 callers. The
  two data points are the same datum; comparing them is vacuous.
- **Mark doc-only.** Cheapest, but the defect is *content expiry*, not
  misclassification. A label does not make a date newer.

## Delivered

- **`scripts/check-upstream-freshness.mjs`** — third-party manifest with
  `last_check` older than 90 days fails CI. First-party exempt, derived from
  `metadata.upstream.repository` pointing at this repo (no hardcoded exemption
  list, unlike the K10 `ORPHAN_TRIGGER_EXEMPTIONS` Map). Zero network.
  `HARNESSED_FRESHNESS_TODAY` overrides "today" for deterministic verification.
- **CI wiring** after `check-yaml-i18n-parity` (both need the `yaml` package,
  so both run after `pnpm install`). Hard-fail, no `continue-on-error`.
- **14 third-party rows re-verified and stamped 2026-09-10** against live
  registry / tag / HEAD — not copied forward.
- **Three verified defects fixed** (`ui-ux-pro-max` provenance pointed at
  `midwayjs/midway` after the 4.32.21 migration; `playwright-test` pinned the
  `skills` installer CLI exactly while both siblings used `@latest`; `ctx7`
  `npm_version: ^0.4.0` did not cover the current 0.5.11).
- **`manifests/SCHEMA.md` corrected** — the two rows claimed "weekly CI 自动写入 /
  自动维护" for a weekly CI that never existed. That sentence was the licence
  under which the fields were allowed to rot. ADR-0001 carries the same sentence
  and is left alone (A7 conservation lock).

## Verification

- `node scripts/check-upstream-freshness.mjs` → `14 third-party manifests,
  0 stale (>90d), 5 first-party exempt`, exit 0.
- Negative: `HARNESSED_FRESHNESS_TODAY=2027-01-01` → 14 stale, exit 1.
- `node scripts/validate-schema.mjs`, `check-workflow-schema`,
  `check-yaml-i18n-parity`, `check-skill-i18n-parity`, `check-state-archive-stale`
  all green.
- vitest 2660 passed. The one red, `tests/dogfood/parallelism-gate.dogfood.test.ts`
  F4, is a dev-machine environment probe for
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`; confirmed failing on stashed HEAD too,
  so it predates this phase and is not caused by it.
- TDD skipped, declared: the deliverable is a lint-shaped gate script with no
  algorithm, sibling to four untested `scripts/check-*.mjs` gates. It was
  exercised in both directions (green today, red at a forced future date) before
  wiring into CI.

## Open items (NOT delivered here)

- **ECC install path.** Record verified to v2.2.1 (this machine's marketplace
  cache holds 2.1.0). ECC 2.2 advertises one guided installer covering Claude
  Code / Codex / Kimi, which may supersede the two-stage `claude plugin
  marketplace add && claude plugin install`. Evaluating that is a behaviour
  change, not a record fix — 2.0.0-rc.1 → 2.1.0 already swapped the whole MCP
  server set, and ECC's bonus-tier positioning was settled 2026-07-29. Noted in
  the manifest's `upstream_health` comment.
- **superpowers ceremony threshold.** superpowers v6.3.0 scales ceremony to the
  task (spike / bounded / architectural). `workflows/judgments/subtask-gate.yaml`
  `brainstorming.skips_when` was calibrated against the old always-heavy ritual.
  Needs empirical testing, not a number change. Separate phase.
