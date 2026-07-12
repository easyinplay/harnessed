---
phase: 29-locale-resolve-layer
plan: 01
subsystem: cli/i18n
status: complete
tags: [v10.0, i18n, locale, skill-resolve, install-time, tdd, byte-identical]
requires:
  - phase: "i18n/index.ts (v3.4.0)"
    provides: "getLocale()/setLocale()/SupportedLocale + mapToSupported (single SoT for locale parsing)"
provides:
  - "resolveSkillBody (skillBodyFilename pure + resolveSkillBodyFilename existence-checked)"
  - "locale-aware renderSkillFile/renderAllSkills (optional locale?, dest single SKILL.md)"
  - "install-time locale body selection: zh-Hans sibling → dest SKILL.md, siblings stripped"
  - "setup threads getLocale() into render loop (--lang honored via src/cli.ts pre-parse)"
  - "scan-nested install-gate invariant pinned (SKILL.md presence, not .zh-Hans.md)"
affects:
  - src/cli/lib/resolveSkillBody.ts
  - src/cli/lib/renderSkillTemplates.ts
  - src/cli/setup.ts
  - "Phase 31 (translation content consumes this resolver)"
tech-stack:
  patterns:
    - "install-time locale resolve (no runtime hook — CC reads SKILL.md by exact name)"
    - "graceful fallback (no sibling / en → SKILL.md, byte-identical)"
    - "resolve-once-thread-down (renderAllSkills resolves locale once, passes to each file)"
    - "single-SoT locale parsing (call getLocale(), never re-implement mapToSupported)"
key-files:
  created:
    - src/cli/lib/resolveSkillBody.ts
    - tests/cli/resolveSkillBody.test.ts
    - tests/cli/renderSkillTemplates.test.ts
    - tests/cli/setup-locale.test.ts
    - tests/cli/scan-nested-gate.test.ts
  modified:
    - src/cli/lib/renderSkillTemplates.ts
    - src/cli/setup.ts
decisions:
  - "OPEN-2: render-step selection, dest single SKILL.md (cp copies both siblings free; renderSkillFile picks locale body, writes to dest SKILL.md, strips siblings). Mirrors messages/{en,zh-Hans}.json file-level pattern."
  - "--lang needs NO setup wiring: it is a global flag pre-parsed in src/cli.ts:46-51 → setLocale() runs before the setup action, so getLocale() in the render loop already reflects it. setup passes getLocale() once into renderAllSkills (robust path)."
  - "sibling-strip + dest-write run ONLY when a locale body is actually selected (srcName !== SKILL.md). en path performs zero deletes/extra writes → install byte-identical to pre-29."
metrics:
  duration: "~11min"
  completed: 2026-06-24
  tasks: 5
  files: 7
---

# Phase 29 Plan 01: Locale-aware skill/workflow resolve layer Summary

At `harnessed setup`, the destination `~/.claude/skills/<name>/SKILL.md` now carries the locale-correct body: when the resolved locale is `zh-Hans` and a `SKILL.zh-Hans.md` sibling exists in the copied skill dir, the render step writes THAT body into the dest `SKILL.md` (the exact name Claude Code reads) and strips the sibling so the install dir holds a single locale-correct file. `en` (and any locale with no sibling) stays byte-identical to pre-29 behavior. Mechanism-only phase — no `.zh-Hans.md` content exists yet (Phase 31), so the resolver falls back gracefully and is proven against tmp-dir fixtures.

## The hard constraint that shaped the design

Claude Code's Skill tool reads `SKILL.md` by exact filename at runtime; harnessed has no runtime hook — it acts only at `setup` (install) time. A "ship both files, pick at read time" scheme is impossible (CC never reads a `.zh-Hans.md` sibling). So the localized body must land in dest `SKILL.md` at setup time; switching locale = re-run `setup`. This collapsed OPEN-2 into "which install-time step does the pick" → the post-copy `renderSkillFile` (the natural one-function hook).

## What was built (per task)

- **T29.1 — `resolveSkillBody.ts` (TDD, f28e89e, 7 tests)**: `skillBodyFilename(locale)` pure map (`zh-Hans` → `SKILL.zh-Hans.md`, else `SKILL.md`); `resolveSkillBodyFilename(dir, locale?)` defaults `getLocale()`, returns the locale sibling name ONLY when it exists on disk, else `SKILL.md`. en short-circuits to `SKILL.md` without even an existsSync. Calls `getLocale()` from i18n — no third `mapToSupported` copy.
- **T29.2 — locale pick wired into render (TDD, 7c892cf, 8 tests)**: `renderSkillFile`/`renderAllSkills` take optional `locale?` (default `getLocale()`). renderSkillFile picks the source body via the resolver, renders `{{ capabilities.*.cmd }}` placeholders on the SELECTED body, writes the rendered result to dest `SKILL.md`, then strips `SKILL.<locale>.md` siblings — but ONLY when a locale body was selected. en / no-sibling path: `srcName === SKILL.md` → identical read+render+write, no spurious deletes. Non-fatal warn-and-continue posture preserved.
- **T29.3 — setup threads locale (0d28810, 3 integration tests)**: `setup.ts` passes `getLocale()` into `renderAllSkills`. `--lang` is a global flag pre-parsed in `src/cli.ts:46-51` (→ `setLocale()` before the action), so no setup `--lang` wiring is needed. Integration test (real fs cp+render, mocked Step B/auto-install/commands): `setLocale zh-Hans` → dest SKILL.md == zh body, no sibling; `HARNESSED_LANG=zh` auto-detect → same (guards an en-hardwired render); en env → dest SKILL.md byte-identical en body, cp'd sibling untouched.
- **T29.4 — scan-nested gate invariant (84aa7a2, 4 assert-only tests)**: `scan-nested.ts` UNCHANGED. Pinned that a dir with only `SKILL.zh-Hans.md` (no `SKILL.md`) is still skipped (no zh-only skills) at both flat and nested depths; dirs WITH `SKILL.md` + optional sibling still install.
- **T29.5 — validation gate**: see below.

## Validation gate (T29.5)

- **vitest**: 1416 passed / 5 skipped / 1 todo (baseline 1394 → +22 new; 0 regressions). Test files 169 → 173.
- **tsc** `--noEmit`: clean.
- **biome** `check`: 0 non-noise findings. The 18 local warnings are ALL from the untracked, non-gitignored `.understand-anything/` JSON noise dir — absent on CI (untracked → never pushed). Every phase file passed `biome check` individually (7 files, no fixes).
- **en byte-identical**: asserted in T29.2 (dest SKILL.md == `'EN BODY'` + zh sibling left untouched) and T29.3 (en env → dest SKILL.md == `'EN BODY'`, cp'd sibling present).

## Deviations from Plan

None — plan executed exactly as written. The one gray-area (`--lang` wiring point) was resolved by grep, not by guessing: `--lang` is already pre-parsed in `src/cli.ts:46-51`, so setup needed only the locale pass-through the PLAN anticipated ("no setup change beyond passing the locale"). Recorded in findings.md.

## Known Stubs

None. The resolver intentionally falls back to `SKILL.md` until Phase 31 ships real `.zh-Hans.md` content — this is the documented graceful-fallback behavior, not a stub (the en install is fully functional and byte-identical today).

## Out of scope (later phases)

- Actual `.zh-Hans.md` translation content → Phase 31.
- CI sync-guard enforcing en↔zh parity → Phase 30.
- CLI message table 14-key gap → Phase 32.

## Self-Check: PASSED

All 5 created files + 2 modified files exist on disk; all 4 task commit hashes (f28e89e, 7c892cf, 0d28810, 84aa7a2) present in git log.
