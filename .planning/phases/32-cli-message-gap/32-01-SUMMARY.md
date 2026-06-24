# Phase 32 SUMMARY — CLI message table gap close

> v10.0 Phase 32 (REQ-v100-cli-gap). Shipped 2026-06-24. Plan: [PLAN.md](./PLAN.md). Findings: [findings.md](./findings.md).

## What shipped

`messages/zh-Hans.json` brought to **full key parity** with `en.json` (94/94), pinned by a test.

- **T32.1** NEW `tests/unit/i18n-parity.test.ts` — flattens both message files, asserts key-set
  equality BOTH directions (no missing en key, no stale zh-only key). TDD red→green (3 cases).
- **T32.2** `messages/zh-Hans.json`: added **16** translated `uninstall.unified.*` keys (live —
  consumed by `uninstall.ts:134+`); removed **2** dead `uninstall.yes_dryrun_conflict[.fix]` keys
  (zero refs in src/tests, absent in en).

## Verify (self-verified)

- biome clean (JSON + test); tsc clean.
- **vitest 1426 passed / 0 failed** (1423 baseline + 3 parity cases).
- `messages/en.json` **byte-identical** (only zh-Hans.json changed).
- parity test green = zh 94 / en 94, both directions.

## Decisions
- Count reconciled **14 → 16** (design doc undercounted; +2 reverse gap it missed).
- 2 dead `yes_dryrun_conflict` keys **removed from zh** (en is source of truth; unused; if the
  feature returns it goes to en first and the parity test forces the zh translation).
- Translations preserve `{{count}}` + leading `\n`; keep English for paths / env-vars / flags.

## Commits (local, no push)
- `f2f58af` feat — parity test + zh gap close
- (this) docs — SUMMARY + digest

## Out of scope → later
- user-facing yaml i18n → Phase 33 (the last v10.0 phase).
