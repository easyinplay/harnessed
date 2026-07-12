# Phase 29 progress (PWF) — Locale-aware resolve layer

> Done-status + commits. Checklist/deps: [task_plan.md](./task_plan.md). Spec: [PLAN.md](./PLAN.md).

## Status: IN PROGRESS

Plan written 2026-06-24 (main-session hand-controlled, per host-overreach lesson). Research
done (Explore subagent ac6b309861fb10be6). OPEN-2 resolved (render-step, dest single SKILL.md).
Execution started 2026-06-24.

### Execution-time discovery (T29.3 gray-area, resolved — no NEEDS_CLARIFICATION)
`--lang` is a GLOBAL flag already pre-parsed in `src/cli.ts:46-51` → calls `setLocale()`
BEFORE any subcommand action runs. So `getLocale()` inside setup's render loop already
reflects `--lang`. setup.ts needs NO `--lang` wiring beyond passing `getLocale()` once into
`renderAllSkills` (PLAN T29.3 "no setup change beyond passing the locale" path confirmed).
`--user-lang` (setup.ts:132) is a SEPARATE flag feeding `enableUserLangInSettings` (settings
write) — unrelated to locale render; left untouched. Integration test (T29.3) drives locale
via `setLocale('zh-Hans')`/`HARNESSED_LANG` env since it bypasses the bin pre-parse.

## Task status

| Task | Status | Commit |
|------|--------|--------|
| T29.1 resolveSkillBody helper | ✅ done (TDD 7 tests green) | f28e89e |
| T29.2 wire render | ✅ done (TDD 8 tests green) | 7c892cf |
| T29.3 setup + --lang integration | ✅ done (3 integration tests green) | 0d28810 |
| T29.4 scan-nested gate invariant | ✅ done (4 assert-only tests green) | 84aa7a2 |
| T29.5 validation gate | ✅ done (gate passed) | — |

## Status: COMPLETE (2026-06-24)

## Baseline
- Test baseline before phase: **1394** (v9.0 shipped).
- After phase: **1416 passed** (+22 new: 7 resolveSkillBody + 8 renderSkillTemplates + 3 setup-locale + 4 scan-nested-gate). 0 regressions. 4 new test files (169→173).
- biome: 0 non-noise findings (18 warnings all from untracked `.understand-anything/` noise — not tracked, absent on CI). tsc: clean.
- en byte-identical: asserted in T29.2 (`'EN BODY'` toBe + zh sibling untouched) + T29.3 (en env → dest SKILL.md == 'EN BODY', cp'd sibling present).

## Blocked
- _(none)_
