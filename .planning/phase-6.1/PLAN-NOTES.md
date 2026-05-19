# Phase 6.1 Wave 0 — PLAN-NOTES

## T0.2 — #BA SIZE_LIMIT round 5 evaluate (2026-05-22)

- **STATE.md post-T0.1 line count**: 139L
- **Decision tree path**: 131-145L → **ACCEPT terminus** (no SIZE_LIMIT change)
- **SIZE_LIMIT**: remains 150 (no flip to 140; 139L insufficient ≥10L headroom for 150→140)
- **#BA permanent retire**: ✅ YES — 5-recurrence terminus reached (rounds 1-5: 200→175→165→150 + round 5 ACCEPT terminus); Phase 6.x #BA no reactivate per CONTEXT.md #BA row
- **D2 cadence iter 8 = TERMINUS**: confirmed — 8-iter pattern stable beyond ≥6-iter graduation; post-v1.0 STATE maintenance freeze forward signal
- **Sister signal**: Phase 5.3 W0.2 round 4 DEFER at 141L; Phase 6.1 W0 round 5 ACCEPT at 139L (natural floor ~130-145L confirmed; SIZE_LIMIT 150 is stable terminus)
- **CI gate**: `node scripts/check-state-archive-stale.mjs` PASS (139L ≤ 150L SIZE_LIMIT)

## T0.3 npm publish 4-step rehearsal evidence (2026-05-22)

- Step 1 npm pack --dry-run: 51 files, 210.5kB compressed, 843.9kB unpacked → **PASS** (matches RESEARCH § 1 baseline exactly; NO .planning/ / tests/ / src/ / .github/ / secrets in tarball)
- Step 2 .npmignore: NOT PRESENT → **PASS** (files array whitelist sufficient; no .npmignore needed)
- Step 3 npm publish --dry-run --access public: `+ harnessed@0.3.0` (dry-run) → **PASS** (tarball assembly clean; expected pre-T1.2 warns: bin script name + repository URL normalization — both fixed in T1.2 package.json)
  - warn 1: `bin[harnessed]` script `dist/cli.mjs` invalid → T1.2 package.json fix (bin value must be path string not script name)
  - warn 2: `repository.url` normalized → cosmetic, no action needed
- Step 4 npm view harnessed: `E404 Not Found` → **PASS** (name unclaimed ✅; harnessed available for v1.0.0 first publish)

**Overall verdict: 4/4 PASS** — Wave 1 R-1 mitigation cleared; bin fix required T1.2 (Rule 2 deviation noted)

## T0.4 baseline gate verify (2026-05-22)

- pnpm exec tsc --noEmit: clean (no output) → **PASS** ✅
- pnpm test: 756 passed | 4 skipped (760 total) — 106 test files, 107 suites → **PASS** ✅ (zero regression baseline established)
- check-state-archive-stale.mjs: STATE.md within archive cadence limits → **PASS** ✅
- check-transparency-verdicts.mjs: all verdict marker lines compliant → **PASS** ✅

**Wave 0 verdict: ALL GATES GREEN — Wave 1 ready to spawn**
