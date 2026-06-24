# Phase 30 findings (PWF) — decisions / landmines / research

> What PLAN/SUMMARY don't capture. Source: main-session research 2026-06-24 (ci.yml + package.json + SKILL.md sampling).

## OPEN-1 decision (resolved with user 2026-06-24): structural parity

Over presence-only (misses the stated primary risk = drift) and structural+anchor (adds a
bump-ritual maintenance tax). When a sibling exists, compare 4 **translation-invariant** features:
frontmatter key-set, `{{capabilities.X}}` placeholder set, heading-level shape, + no-orphan-zh.
Never compare translated prose / heading text.

## Drift-only semantics (critical — phase ordering)

Phase 30 builds the guard; Phase 31 produces the `.zh-Hans.md` siblings. So at Phase 30 land,
**zero siblings exist**. The guard MUST be drift-only: *sibling exists → must parity*; *absence →
ok*. If it required must-exist it would red CI immediately. It stays green through Phase 31 as
siblings land in parity. `must-exist` (every SKILL.md must have a sibling) is a Phase-31-close
concern after all 26 are translated — NOT Phase 30.

## CI / check-script pattern (verified, ci.yml)

- Pure-node `node scripts/check-*.mjs` steps run BEFORE `corepack pnpm install` (L163):
  `check-transparency-verdicts` L124, `check-state-archive-stale` L133, `check-provenance` L140,
  `check-deferred-items` L160. typebox-needing checks (`check-workflow-schema` L168) run AFTER
  install. Our guard is **dep-free → goes BEFORE install** (sister check-provenance).
- Hard-fail vs warn-only both exist; design doc says sync-guard = hard gate → **hard-fail** (no
  `continue-on-error`).
- `package.json`: `lint = biome check .` → the new `.mjs` MUST be biome-clean. Existing checks
  have NO package.json script alias — they're invoked directly in ci.yml. Match that (ci.yml step
  only; local run = `node scripts/check-skill-i18n-parity.mjs`).

## Landmines for the executor

1. **No `yaml` package in the script.** It runs pre-`pnpm install` in CI; `yaml` (a runtime dep)
   is not resolvable. Parse frontmatter keys by **regex** (top-level `^([A-Za-z_][\w-]*):` between
   the first two `---`). Do NOT `import 'yaml'` in the .mjs.
2. **Testable via export + main-guard.** Export `checkSkillI18nParity` AND gate the CLI with
   `if (import.meta.url === pathToFileURL(process.argv[1]).href)`. Vitest imports the fn (precedent:
   `tests/checkpoint/injectState.test.ts` imports a `bin/*.mjs`). Don't make the script un-importable
   (no top-level `process.exit`).
3. **Heading TEXT is translated — never compare it.** Compare only the *level sequence*
   (`[1,2,2,3]`). Same for frontmatter VALUES (translated) — compare only the KEY set.
4. **Placeholder set must be exact-equal both ways** (en∖zh AND zh∖en). A zh file that drops or
   adds a `{{capabilities.X}}` is drift.
5. **Guard must be green NOW.** After writing it, run `node scripts/check-skill-i18n-parity.mjs`
   against the real `workflows/` (26 SKILL.md, 0 siblings) → must exit 0. If it exits 1, the
   drift-only semantics are wrong.
6. **biome on `.mjs`**: `biome check .` lints scripts too — keep the new script biome-clean
   (run `biome check --write` before commit per project 铁律).

## Scope notes
- Actual SKILL.md count = **26** (design doc / ROADMAP said 28 — use 26; reconcile the figure in SUMMARY).
- **yaml string parity deferred to Phase 31** — no yaml i18n mechanism exists yet; the guard would
  have nothing to check. Extend the guard (or add a sibling check) when Phase 31 decides how the 48
  surfacing yaml carry both locales.

## Deferred (not this phase)
Translation content → Phase 31. CLI 14-key gap → Phase 32. must-exist flip → Phase 31 close.
