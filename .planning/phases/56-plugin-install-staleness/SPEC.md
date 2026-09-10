---
phase: 56
name: Plugin Install Staleness
status: complete
created: 2026-09-10
completed: 2026-09-10
gates_passed:
  - strategic gate SKIPPED (declared): not a new product direction — a doctor
    probe for a defect measured on the dev machine during Phase 55's upstream
    sweep. Same family (a record says one thing, the machine does another).
  - user decision: option B — make plugin staleness visible before touching the
    superpowers ceremony threshold, because the staleness IS the threshold work's
    blocker
verified_refs:
  - "~/.claude/plugins/installed_plugins.json — v2 schema, `plugins['<p>@<m>'][].version` (read; 4 entries confirmed)"
  - "src/platform/platform.ts:232 getPluginsRegistry() — returns null on codex (exists)"
  - "src/platform/assetsRoot.ts:118 getAssetsRoot() (exists)"
  - "src/cli/lib/version-check.ts compareVersions() — 'behind'|'current'|'ahead'|'unknown' (exists)"
  - "src/installers/lib/readClaudeConfig.ts:144 isPluginRegistered — boolean only, no version (exists)"
  - "`claude plugin update <plugin>` — 'Update a plugin to the latest version (restart required to apply)' (verified via claude plugin --help)"
  - "src/cli/lib/check-plugin-staleness.ts (NEW)"
  - "tests/cli/check-plugin-staleness.test.ts (NEW, 12 cells)"
---

# Phase 56 — Plugin Install Staleness

## Problem

`claude plugin install` copies the plugin into a versioned cache directory and
pins it. Unlike the `npx --yes <pkg>@latest` manifests, nothing re-resolves
latest on a later session. Claude Code never says the install is old, and before
this phase neither did harnessed.

Measured 2026-09-10 — all four `cc-plugin-marketplace` components behind at once:

| plugin | installed | recorded upstream |
|---|---|---|
| superpowers | 5.1.0 (2026-05-27) | 6.3.0 |
| planning-with-files | 2.34.0 | 3.17.2 |
| ui-ux-pro-max | 2.5.0 | 2.15.0 |
| ecc | 2.1.0 | 2.2.1 |

This corrects a claim made in Phase 55: "nearly every install cmd resolves
`@latest`, so drifting downward is the intended behaviour." True for the npm and
git manifests. False for these four — their drift is a genuinely stale install,
not a record inaccuracy.

## Why this is buildable when Phase 55's version comparison was not

Phase 55 investigated "compare installed against known-good" and found it
vacuous: `HarnessedStateEntry.version` looks like a detected version, but all 7
`updateInstalled` callers pass a manifest-declared value (`install.npm_version` /
`install.git_ref` / `''`). Comparing it against `last_known_good_version`
compares a record to itself.

The plugin registry's `version` is different in kind: Claude Code writes it from
what it actually placed on disk. It is the only observed version anywhere in
reach, which is exactly why this check exists at the plugin layer and not the
installer-state layer.

## Delivered

- **`src/cli/lib/check-plugin-staleness.ts`** — doctor check 22. Walks the
  shipped `manifests/` tree for `install.method == 'cc-plugin-marketplace'`
  (primary method only; a `harness_overrides` entry describes another harness),
  reads the registry, compares with `compareVersions`, warns on `behind`.
  - `registryPath === null` (codex) → pass without reading anything.
  - Unreadable / malformed registry or manifest → pass. A doctor check that
    throws rejects `doctor.ts`'s `Promise.all` and discards every OTHER check.
  - `ahead` and `unknown` never warn: `unknown` covers the non-`X.Y.Z` records
    (`main-3cca18b3`, gstack's 4-segment form), and a record behind the machine
    is the record's problem, not the install's.
- **`tests/cli/check-plugin-staleness.test.ts`** — 12 cells, fully dep-injected
  (no HOME redirect needed). Covers behind / current / ahead / not-installed /
  non-marketplace-method / zh-Hans double-count / multi-plugin fix chaining /
  unparseable version / malformed yaml / null registry / unreadable registry.
- **Mocked to a fixed pass in `doctor.test.ts` + `doctor-fixtures.test.ts`**,
  following the `check-ecc` / `check-mattpocock-skills` convention: a check that
  reads the developer's real home must not make the orchestration suite's
  all-pass cells machine-dependent. Counts bumped 21 → 22 in both.

## Verification

- Dogfood on this machine: `warn`, `4/4 marketplace plugin(s) behind …`, naming
  all four with the exact versions measured by hand beforehand; `doctor` exit 0
  (warn ≠ fail).
- `tsc --noEmit` clean; biome clean.
- doctor suites 24/24 with the mock in place.

## Open items

- **The superpowers ceremony threshold (the original step 3) is still blocked
  until the upgrade actually happens.** superpowers v6.3.0 classifies requests as
  spike / bounded / architectural so small tasks skip the two-document ritual;
  `workflows/judgments/subtask-gate.yaml` `brainstorming.skips_when` was
  calibrated against the old always-heavy ritual. This machine runs 5.1.0, where
  that change does not exist, so an A/B run here would measure the old ritual.
  This phase makes the blocker visible; it does not clear it.
- Worth recording from the same investigation: `brainstorming.fires_when` is
  effectively constant-true under the default gate context (`subtask.approaches: 2`
  and `subtask.has_api_contract: true` are both pinned to the firing side by
  T2.1 OQ2(c)), so `skips_when` is the ONLY discriminator in that gate. Any change
  to it changes all brainstorming routing, which is why it needs measurement
  rather than a number edit.
