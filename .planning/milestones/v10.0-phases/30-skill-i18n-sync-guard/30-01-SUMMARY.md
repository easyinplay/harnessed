# Phase 30 SUMMARY — en↔zh-Hans skill sync-guard

> v10.0 Phase 30 (REQ-v100-sync-guard). Shipped 2026-06-24. Plan: [PLAN.md](./PLAN.md). Decisions: [findings.md](./findings.md).

## What shipped

A CI **hard-gate** enforcing en↔zh-Hans `SKILL.md` structural pair-parity, turning the design
doc's primary risk (dual-maintenance drift) into a checkable constraint.

- **`scripts/check-skill-i18n-parity.mjs`** (NEW) — dep-free pure-node checker exporting
  `checkSkillI18nParity(workflowsDir)` + an `import.meta.url`-guarded CLI `main()`.
- **`scripts/check-skill-i18n-parity.d.mts`** (NEW) — hand-written type decl so the `.ts` test can
  import the `.mjs` under tsc (`scripts/**` in tsconfig include, `allowJs` off → TS7016 otherwise).
- **`tests/scripts/skill-i18n-parity.test.ts`** (NEW) — 7 TDD tests.
- **`.github/workflows/ci.yml`** — hard-fail step among the pure-node checks BEFORE `pnpm install`.

## Decisions

- **OPEN-1 = structural parity** (over presence-only / structural+anchor). When a sibling exists,
  compare translation-invariant features only: frontmatter KEY-set, `{{ capabilities.X }}`
  placeholder set (both directions), heading-LEVEL sequence (code-fence-aware). Never prose /
  frontmatter values / heading text. Orphan-zh (zh without en) = violation.
- **drift-only** — sibling exists → must parity; absence → OK. So the guard is green NOW (26
  SKILL.md, 0 siblings) and stays green as Phase 31 lands siblings. `must-exist` (every SKILL.md
  must have a sibling) is a Phase-31-close concern.
- **dep-free, pre-install** — runs before `corepack pnpm install` (sister `check-provenance.mjs`),
  so it must NOT import the `yaml` package; frontmatter keys parsed by regex.

## Gate (self-verified)

- **vitest 1423 passed** | 5 skipped | 1 todo, **0 failed** (1416 baseline + 7 new; 0 regression).
- tsc clean; biome clean (3 files); guard exits **0** against the real `workflows/`.
- Isolated neighborhood (parity + Phase-29 render/resolve/setup/scan) 29/29 green.

## Commits (local, no push)
- `dbaa181` feat T30.1 — parity checker + .d.mts + 7 TDD tests
- `3e7bbe0` ci T30.2 — hard-fail CI step (pre-install)
- (this) docs — SUMMARY + STATE/ROADMAP/REQUIREMENTS + PWF

## Notes
- Actual SKILL.md count = **26** (design doc / ROADMAP said 28). Figure reconciles at Phase 31.
- **Execution incident**: the first executor run was killed (terminal crashed); it had written T30.1
  files but committed nothing + left an accidental dead-precedent comment (claimed
  `injectState.test.ts` imports a `.mjs` — it spawns a subprocess; corrected). Main session finished
  T30.1 verify + T30.2 + close. The crash also orphaned a duplicate MCP-server set (~50 node procs)
  that starved the test runner → transient nondeterministic full-suite failures (57→47→13→3→1→0 as
  load drained); a clean `--no-file-parallelism` run confirmed 1423/0. No product/test defect.

## Out of scope → later
- 48 surfacing **yaml** string parity → Phase 31 (no yaml i18n mechanism yet).
- Actual translation content → Phase 31. CLI 14-key gap → Phase 32.
