# Phase 4.2 — deferred-items.md

> **Authored**: 2026-05-18 (Phase 4.2 W0 T0.2 Branch B DEFER PATH active per § 8.2 decision tree)
> **Author**: gsd-executor (Phase 4.2 W0.2 conditional)
> **Sources**: task_plan.md § Resolved (T0.2) Branch B DEFER outcome + RESEARCH.md § 8.2 decision tree + PATTERNS.md § 5 R-5 conditional path uncertainty
> **Style**: 沿袭 sister Phase 4.1 deferred-items.md (NEW file precedent per Phase 4.2 W0 first-time inhabitant — Phase 4.1 W0.5 DEFER path created sister deferred-items.md as carry-forward register)

> **Purpose**: Phase 4.2-specific register for items deferred at ship-time per W0/W1/W2 task outcomes. Items registered here flow into next-phase STATE.md 待办 P1 + RETROSPECTIVE.md § Cost Patterns DEFERRED carry-forward inventory at Phase 4.2 ship close (W2 T2.1/T2.2).

---

## DEFERRED items registered at Phase 4.2 W0 (2026-05-18)

### #BA — D1 SIZE_LIMIT round 2 tighten 200→150 (carry-forward Phase 4.3 W0 LOW priority defensive)

**Status**: DEFERRED (Phase 4.2 W0.2 Branch B DEFER PATH active per § 8.2 decision tree)
**Origin**: Phase 4.1 W0 T0.3 (W0.5 conditional DEFER path active 2026-05-18; sister precedent post-Phase-4.1-W0.3 STATE 143L > 140L threshold → DEFER path active; carried forward to Phase 4.2 W0.2 conditional)
**Phase 4.2 W0.2 outcome**: post-T0.1 STATE 150L falls in 141-150L range (≥10L headroom threshold NOT met for round 2 tighten); insufficient safe margin for `SIZE_LIMIT = 200 → 150` flip — flipping at 150L baseline would leave 0L headroom for W2 T2.1 STATE 续编 Phase 4.2 SHIPPED event log delta (+5-10L expected per sister Phase 4.1 W2 T2.1 +3L precedent) → post-W2 续编 STATE would exceed SIZE_LIMIT=150 trigger CI fail.

**Decision rationale** (defensive against over-tighten brittle per R-02 mitigation):
- Sister Phase 4.1 W0.5 DEFER path precedent延袭 (post-W0.3 trim STATE 143L > 140L threshold same rationale)
- W0.1 D2 cadence iter 3 trim under § 8.3 ~14L projection (only -1L net; 关键决策 area lacked Phase 4.1 D-decision rows ready to delete — sister Phase 4.1 W0.3 had 7 ready-to-archive rows whereas Phase 4.2 baseline already condensed by Phase 4.1 W2 T2.1)
- R-02 over-tighten brittle pattern: flip ENFORCE flags / tighten gates should have safety margin — flipping at 150L baseline (0 headroom) would trigger CI fail on first content addition (sister Phase 4.1 W0.2 ENFORCE flip downstream test regression lesson — atomic test fix bundle T1.6 mitigated; principle: don't flip at exact threshold)
- Karpathy YAGNI: SIZE_LIMIT=200 round 1 sufficient for current STATE.md role (post-trim 150L well under 200L; round 2 tighten 150 is "nice to have" NOT mission-critical)

**Carry-forward target**: Phase 4.3 W0 LOW priority defensive
- **Conditions for FLIP at Phase 4.3 W0**: post-Phase-4.2-ship STATE size + Phase 4.3 W0 D2 cadence iter 4 trim Phase 4.2 narrative outcome — IF post-iter-4 STATE ≤140L → FLIP safe / IF 141-150L → DEFER again #BA carry Phase 4.4+ (assuming v0.4.0 close at Phase 4.3 reserves milestone tag delta evaluation)
- **Alternative**: SIZE_LIMIT=200 round 1 may remain permanent if v0.4.0 close + v0.5+ project growth absorbs SIZE_LIMIT headroom — Karpathy YAGNI reassess at v0.5+ benchmark trigger

**Sister cross-reference**: Phase 4.1 W0.5 conditional task DEFER path → registered as #BA carry-forward Phase 4.2 W0 → Phase 4.2 W0.2 conditional task DEFER path → registered as #BA carry-forward Phase 4.3 W0 (2-iter defer chain; sister 5-recurrence terminus heuristic suggests reassess at iter 3 IF defer continues — i.e. Phase 4.4+ if Phase 4.3 W0.2 also defers, reassess D-decision necessity)

---

## Notes (cadence verification)

- **Phase 4.2 W0 backlog absorb**: 1 项 #BA conditional (carry from Phase 4.1) — RESOLVED via DEFER branch (NOT FLIP); #BB ✅ pre-RESOLVED Phase 4.2 discuss-phase 2026-05-18 (HYBRID 2-clock LOCKED D-04); #BC defer no signal (currently 30/30 100% routing PASS); #BD ADVISORY plan-checker future iterations; #BE R1+R2 cross-validation lesson registered Phase 4.2 plan-phase Wave C orchestrator FIX (institutional carry); #AH defer Phase 4.0+ conditional unchanged
- **#BE bonus** (Phase 4.2 plan-phase Wave C orchestrator FIX institutional lesson registered as DEFERRED carry — sister Phase 4.1 #BD regex 2-pass validation pattern lock precedent延袭; future plan-checker iterations adopt R1+R2 cross-validation as standing process)

*Phase 4.2 W0 deferred-items.md complete — DEFERRED #BA carry-forward Phase 4.3 W0 registered + #BE institutional lesson registered. Next-phase carry-forward inventory flows into Phase 4.2 W2 T2.2 RETROSPECTIVE.md § Cost patterns DEFERRED section at ship close.*
