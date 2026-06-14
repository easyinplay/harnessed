# Phase 20 CONTEXT — `harnessed update` command (follow-on, closes the comet-update gap)

> Locked from the 2026-06-14 comet install-mechanism comparison + Phase 20 design clarification (AskUserQuestion: self+upstreams flagged / doctor-check surface / follow-on after v7.0 close). Main session, hand-controlled. NEW scope beyond v7.0's 7 phases; numbered Phase 20.

## Goal

Give harnessed a GSD-style `update` command + a passive version-check so a user sees "update available X→Y" on `harnessed doctor` and runs `harnessed update` to upgrade harnessed itself (and, with a flag, the third-party upstream plugins). Closes the `comet update` gap (harnessed currently has NO update command).

## Why (verified)

- harnessed's CLI command set has no `update` (commands: setup/install/install-base/doctor/status/resume/next/reject/compact/workflows/learn/audit/…). Users upgrade by hand: `npm i -g harnessed@latest` + re-run setup. comet ships `comet update` (upgrade package + re-deploy skills); GSD ships `/gsd-update` (version detect → npm check → changelog → confirm → install → cache clear → restart hint). harnessed should match that UX.
- `pkg.version` is available (`import pkg from '../package.json'` in cli.ts). No semver dep (write a minimal compare). No existing version-check infra.
- `install-base` install logic lives inside the `registerInstallBase` action closure (`listBaseManifests` is private) → reuse for `--upstreams` needs a small refactor to export the core install loop.

## Locked decisions

- **D1 — scope = self + upstreams (flagged)**: `harnessed update` upgrades harnessed itself (`npm i -g harnessed@latest`); `--upstreams` (alias `--all`) ALSO re-runs the base manifests to pull upstream plugins to their pinned-latest. Default is conservative (self only) — upstream upgrade is explicit (npm/plugin installs can be slow / mutate the environment).
- **D2 — version-check surfaced via a doctor check**: a 14th doctor check compares `pkg.version` vs npm latest; behind → `warn` ("update available X→Y — run `harnessed update`"); current OR network-unreachable → `pass` (can't-check is not a failure). Passive, GSD-like; the only doctor check allowed to emit warn here (advisory, exit 0).
- **D3 — `--check` subflag**: `harnessed update --check` reports installed/latest/status without installing (the active counterpart to the passive doctor surface).
- **D4 — self-update assumes global install** (`npm i -g harnessed@latest`, the documented install path). Show the top CHANGELOG.md section + a "restart Claude Code" reminder after. Note for non-global users that they update via their own npm.
- **D5 — install-base refactor**: extract an exported `installBaseProfile(opts)` from `install-base.ts`; `registerInstallBase` AND `update --upstreams` both call it (no behavior change to install-base; existing install-base tests stay green).
- **D6 — network fail-soft**: `npm view harnessed version` runs with a timeout; failure → 'unknown' → doctor passes, `update --check` says "couldn't reach npm". Never throw.
- **D7 — TDD red-first** for the pure version compare + the check + the command gating.
- **D8 — `--migration-report` (borrowed from Chachamaru127/claude-code-harness `doctor --migration-report`)**: `harnessed update --migration-report` prints a READ-ONLY inventory of stale harnessed state and **deletes nothing**. Inventory (existsSync only): the legacy singleton `current-workflow.json` (post-Phase-15 multi-workflow it is only the dual-write rollback anchor — flag as "legacy, removable once the store is proven"), backup dirs (`.harnessed-backup/`, `~/.harnessed/backups/`), deprecated manifests (reuse the existing deprecation signal if cheap), and the untracked `.planning/phases/_rogue-impl-reference/` dev artifact. Each item: what it is + a safe hint; never an auto-delete. Evidence-first, `not_observed != absent` framing.

## Scope

- `src/cli/lib/version-check.ts` (NEW): pure `compareVersions(installed, latest): 'current'|'behind'|'ahead'|'unknown'` (numeric semver-ish, prerelease tolerant) + impure `fetchLatestVersion(timeoutMs?): Promise<string|null>` (spawn `npm view harnessed version`, null on fail/timeout).
- `src/cli/lib/check-update.ts` (NEW doctor check): `checkUpdate(): Promise<CheckResult>` — pkg.version vs fetchLatestVersion; behind → warn, else pass.
- `src/cli/lib/doctor-registry.ts`: append `checkUpdate` (13→14). Bump both doctor test files 13→14 + mock check-update.
- `src/cli/update.ts` (NEW): `registerUpdate` — `update [--check] [--upstreams|--all] [--migration-report]`. Self-update via `npm i -g harnessed@latest` + CHANGELOG top + restart hint; `--upstreams` calls `installBaseProfile`; `--migration-report` prints the read-only stale-state inventory (no install, no delete).
- `src/cli/lib/migration-report.ts` (NEW): pure-ish `collectMigrationReport(cwd, harnessedRoot): MigrationItem[]` — existsSync inventory only, deletes nothing.
- `src/cli/install-base.ts`: extract + export `installBaseProfile(opts)`; `registerInstallBase` delegates to it.
- `src/cli.ts`: register `registerUpdate` (25th).
- tests: version-check pure + check-update (mock fetch) + update command (mock spawn) + doctor 14 + install-base unchanged.

## Out of scope (do NOT touch)

- `--sync` / `--reapply` / RC-channel flags (GSD has them; not needed now).
- Per-turn update nag hook (doctor surface is enough).
- Auto-update without confirmation (always user-initiated).
- Non-global install-scope detection (assume global per D4; note local users).
- checkpoint internals / other phases.

## Invariants

- Network/spawn fail-soft: doctor never fails on an unreachable npm; update reports cleanly.
- install-base behavior unchanged (refactor is extract-and-delegate; its tests stay green).
- Doctor summary stays `pass` when up-to-date (the warn only fires when genuinely behind; doctor tests mock check-update).
- KARPATHY-minimal; TDD red→green; full gate green vs the post-Phase-19 baseline (1285); Windows CI green; biome preempt; NEVER `git add -A`; NEVER push without approval.

## Acceptance

1. `compareVersions`: current/behind/ahead/unknown correct incl. prerelease + malformed → unknown. (unit)
2. `checkUpdate`: behind → warn with X→Y + run-hint; current → pass; npm-unreachable → pass. (unit, mock fetch)
3. `harnessed update --check`: prints installed/latest/status; no install; npm-unreachable handled. (unit, mock)
4. `harnessed update`: self-update path invokes `npm i -g harnessed@latest` + shows CHANGELOG top + restart hint (mock spawn — assert the command, do not really install). (unit)
5. `harnessed update --upstreams`: calls `installBaseProfile` after self-update. (unit, mock)
6. doctor registry has 14 checks; summary stays `pass` when current; both doctor test files updated.
7. install-base tests unchanged-green (refactor preserved behavior); full gate green; biome clean.
8. `harnessed update --migration-report`: prints a read-only inventory of stale state (legacy `current-workflow.json` / backups / deprecated manifests / rogue-ref); **deletes nothing** (asserted: no fs removal calls); present/absent items reported correctly. (unit)
