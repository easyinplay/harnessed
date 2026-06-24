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

- [ ] **T29.1** NEW `src/cli/lib/resolveSkillBody.ts` + `tests/cli/resolveSkillBody.test.ts` — `skillBodyFilename` (pure) + `resolveSkillBodyFilename` (existence-checked, defaults `getLocale()`). Red → green.
- [ ] **T29.2** MODIFY `src/cli/lib/renderSkillTemplates.ts` — thread `locale?`; pick body via resolver; write rendered body → dest `SKILL.md`; rm dest locale siblings. en byte-identical.
- [ ] **T29.3** MODIFY `src/cli/setup.ts` — pass `getLocale()` to `renderAllSkills`; verify/wire `--lang`→`setLocale` runs before render; integration test `setup --lang zh-Hans`.
- [ ] **T29.4** ASSERT-ONLY `src/cli/lib/scan-nested.ts` — gate test: `.zh-Hans.md`-only dir still skipped.
- [ ] **T29.5** GATE — biome --write clean, tsc clean, full vitest green vs 1394 baseline, CI 3-OS green.

## TDD scope (per CLAUDE.md强制判据)
Mechanism (resolver + render wiring + setup integration) = **TDD red-green-refactor required** (T29.1–T29.3). No prose in this phase (translation is Phase 31). No TDD-skip declaration needed.

## Acceptance (phase-level, from REQ-v100-resolve-layer)
Resolver returns zh sibling under zh locale + en otherwise / when no sibling (en-default never breaks); claude default install byte-identical when locale=en; per-case unit tests; green gate vs 1394 baseline.
