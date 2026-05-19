# Phase 6.1 Wave 0 — PLAN-NOTES

## T0.2 — #BA SIZE_LIMIT round 5 evaluate (2026-05-22)

- **STATE.md post-T0.1 line count**: 139L
- **Decision tree path**: 131-145L → **ACCEPT terminus** (no SIZE_LIMIT change)
- **SIZE_LIMIT**: remains 150 (no flip to 140; 139L insufficient ≥10L headroom for 150→140)
- **#BA permanent retire**: ✅ YES — 5-recurrence terminus reached (rounds 1-5: 200→175→165→150 + round 5 ACCEPT terminus); Phase 6.x #BA no reactivate per CONTEXT.md #BA row
- **D2 cadence iter 8 = TERMINUS**: confirmed — 8-iter pattern stable beyond ≥6-iter graduation; post-v1.0 STATE maintenance freeze forward signal
- **Sister signal**: Phase 5.3 W0.2 round 4 DEFER at 141L; Phase 6.1 W0 round 5 ACCEPT at 139L (natural floor ~130-145L confirmed; SIZE_LIMIT 150 is stable terminus)
- **CI gate**: `node scripts/check-state-archive-stale.mjs` PASS (139L ≤ 150L SIZE_LIMIT)
