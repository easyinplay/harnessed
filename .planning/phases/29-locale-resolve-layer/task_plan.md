# Phase 29 task_plan (PWF) — Locale-aware resolve layer

> Checklist + dependency map. Full spec lives in [PLAN.md](./PLAN.md) (do not duplicate — link).
> Decisions/landmines: [findings.md](./findings.md). Status/commits: [progress.md](./progress.md).

## Dependency order

```
T29.1 (resolveSkillBody helper, TDD)
   └─> T29.2 (wire into renderSkillFile/renderAllSkills)
          └─> T29.3 (setup threads locale + --lang ordering, integration test)
T29.4 (scan-nested gate invariant)   — independent, can run anytime
T29.5 (validation gate)              — final, after all above
```

## Checklist

- [x] **T29.1** NEW `src/cli/lib/resolveSkillBody.ts` + `tests/cli/resolveSkillBody.test.ts` — `skillBodyFilename` (pure) + `resolveSkillBodyFilename` (existence-checked, defaults `getLocale()`). Red → green. ✅ f28e89e (7 tests)
- [x] **T29.2** MODIFY `src/cli/lib/renderSkillTemplates.ts` — thread `locale?`; pick body via resolver; write rendered body → dest `SKILL.md`; rm dest locale siblings. en byte-identical. ✅ 7c892cf (8 tests)
- [x] **T29.3** MODIFY `src/cli/setup.ts` — pass `getLocale()` to `renderAllSkills`; `--lang`→`setLocale` already pre-parsed in src/cli.ts (no setup wiring needed); integration test `setup --lang zh-Hans`. ✅ 0d28810 (3 tests)
- [x] **T29.4** ASSERT-ONLY `src/cli/lib/scan-nested.ts` (unchanged) — gate test: `.zh-Hans.md`-only dir still skipped. ✅ 84aa7a2 (4 tests)
- [x] **T29.5** GATE — biome clean (0 non-noise), tsc clean, full vitest 1416 passed vs 1394 baseline (+22, 0 regression). ✅

## TDD scope (per CLAUDE.md强制判据)
Mechanism (resolver + render wiring + setup integration) = **TDD red-green-refactor required** (T29.1–T29.3). No prose in this phase (translation is Phase 31). No TDD-skip declaration needed.

## Acceptance (phase-level, from REQ-v100-resolve-layer)
Resolver returns zh sibling under zh locale + en otherwise / when no sibling (en-default never breaks); claude default install byte-identical when locale=en; per-case unit tests; green gate vs 1394 baseline.
