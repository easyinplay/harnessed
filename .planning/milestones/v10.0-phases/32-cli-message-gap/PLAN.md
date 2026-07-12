---
phase: 32
milestone: v10.0
title: CLI message table gap close (zh-Hans 80→94)
status: ready-to-execute
created: 2026-06-24
requirement: REQ-v100-cli-gap
depends_on: []
blocks: []
verified_refs:
  - "messages/en.json — 94 flattened keys (verified)"
  - "messages/zh-Hans.json — 80 keys: 78 shared + 2 zh-only dead keys (verified)"
  - "16 missing keys all under `uninstall.unified.*` (verified by key-diff)"
  - "src/cli/uninstall.ts:134+ consumes t('uninstall.unified.*') (exists — keys are live)"
  - "uninstall.yes_dryrun_conflict[.fix] — ZERO refs in src/ or tests/ + absent in en.json (dead)"
  - "src/i18n/index.ts t() loader (exists — Phase 29 reuse)"
  - "tests/unit/i18n-parity.test.ts (NEW)"
---

# Phase 32 — CLI message table gap close

## Goal

Bring `messages/zh-Hans.json` to **full key parity** with `messages/en.json` (94/94), so every
CLI string the `t()` loader can request has a Chinese translation (no silent en-fallback), and a
test pins parity so future en additions force a zh translation.

## Findings (count reconcile + the 2-direction gap)

- en **94** keys / zh **80** → **16 missing** (design doc said 14 — reconciled to 16), ALL under
  `uninstall.unified.*` (live — consumed by `src/cli/uninstall.ts:134+`).
- zh also has **2 keys en lacks**: `uninstall.yes_dryrun_conflict` + `.fix` — **dead** (zero refs in
  src/tests, absent in en). en is the source of truth → **remove from zh** (not add to en).

## Type & TDD posture

**Small mechanism phase — TDD.** The parity test is the red gate; closing the gap makes it green.
(Translating the 16 strings is data, but the parity ASSERTION is real, testable mechanism.)

## Tasks

### T32.1 — message parity test (TDD red) — NEW
- **File**: `tests/unit/i18n-parity.test.ts` (NEW). Flatten both `messages/en.json` + `messages/zh-Hans.json` to dotted key-sets; assert `zhKeys === enKeys` (no missing, no extra). Reads the real shipped JSON (not fixtures).
- **Acceptance**: RED now (zh missing 16 + 2 extra). Asserts BOTH directions (en∖zh empty AND zh∖en empty).

### T32.2 — close the gap (green)
- **File**: `messages/zh-Hans.json` (MODIFY).
  - ADD the 16 `uninstall.unified.*` keys, translated to Simplified Chinese, mirroring en's structure + preserving every `{{count}}` placeholder + leading `\n` exactly. Keep English for paths/identifiers/env-var names (`~/.claude/commands/`, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, `HARNESSED_USER_LANG`, `--dry-run`) per language rules.
  - REMOVE the 2 dead keys `uninstall.yes_dryrun_conflict` + `.fix`.
- **Acceptance**: zh-Hans.json = 94 keys, parity test green; `{{count}}`/`\n` preserved; `messages/en.json` **untouched** (byte-identical); valid JSON.

### T32.3 — validation gate
- **Acceptance**: `corepack pnpm exec biome check --write` clean (biome formats JSON — `zh-Hans.json` must pass); `tsc` clean; full `vitest` green vs the 1423 baseline + the new parity test; en.json byte-identical.

## Out of scope
- yaml i18n → Phase 33. SKILL.md translation → done (Phase 31).

## Goal-backward check
Goal = "zh 94/94 parity, pinned by a test." T32.1 pins parity (red); T32.2 adds 16 + removes 2 dead
→ green; T32.3 proves gate-green + en untouched. Covered; no orphan.
