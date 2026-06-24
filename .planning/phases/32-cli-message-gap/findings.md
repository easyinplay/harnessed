# Phase 32 findings (PWF) — decisions / landmines

> Source: main-session key-diff + grep (2026-06-24).

## Count reconcile + 2-direction gap

- Design doc / ROADMAP said **14** missing keys — actual is **16** (en 94 / zh 80, all 16 under
  `uninstall.unified.*`). Reconciled to 16.
- **Plus** a reverse gap the design doc missed: zh has **2 keys en lacks** —
  `uninstall.yes_dryrun_conflict` + `uninstall.yes_dryrun_conflict.fix`.

## Decision: remove the 2 dead zh-only keys (don't add to en)

`grep -rn yes_dryrun_conflict src/ tests/` → **zero references**; `en.json` lacks them. So they are
dead in both languages (a removed/never-wired `--yes`+`--dry-run` conflict message). en is the
source of truth → remove from zh. If the feature is ever added, it goes to en first and the parity
test (T32.1) forces the zh translation. Transparent cleanup, no user question (clear minimal action).

## The 16 missing keys (all live)

All `uninstall.unified.*`, consumed by `src/cli/uninstall.ts:134+` (`t('uninstall.unified.nothing')`
… `.header` `.commands` `.skills` `.settings` `.state_dir` `.upstream_note` `.dry_run_hint` `.confirm`
`.removing` `.removed_commands` `.removed_skills` `.removed_settings` `.removed_state_dir`
`.partial_failure` `.complete`). English currently serves; zh silently falls back to en.

## Landmines (translation)

1. Preserve `{{count}}` interpolation placeholders verbatim (e.g. `.commands`/`.skills`/`removed_*`/`partial_failure`).
2. Preserve leading `\n` exactly (`.upstream_note`, `.dry_run_hint`, `.partial_failure`).
3. Keep English for paths/identifiers/env-var/flag names: `~/.claude/commands/`, `~/.claude/skills/`,
   `~/.claude/harnessed/`, `~/.claude/settings.json`, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`,
   `HARNESSED_USER_LANG`, `--dry-run`. Translate only the prose.
4. Do NOT touch `messages/en.json` (byte-identical). Valid JSON (biome formats it — run `--write`).

## Deferred (not this phase)
yaml i18n → Phase 33. (SKILL.md translation done in Phase 31.)
