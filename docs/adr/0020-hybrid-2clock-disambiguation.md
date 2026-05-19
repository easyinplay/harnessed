# ADR 0020: HYBRID 2-clock disambiguation pattern (backfill Phase 4.2 D-04 institutional pattern lock)

## Status

**Accepted backfill — Phase 4.2 source ratified Phase 4.3 W2 — 2026-05-19** — institutional pattern lock backfill (Phase 4.2 D-04 HYBRID 2-clock locked 2026-05-18 via discuss-phase; ratified as ADR 0020 at Phase 4.3 W2 per CONTEXT D-03 + R8.4 "公开 ADR 全集" backfill scope). Sister cross-ref ADR 0019 § Decision (institutional pattern lock 5-recurrence terminus heuristic) — both ADRs document Phase 3.3 + Phase 4.2 institutional lessons backfilled at v0.4.0 milestone close.

## Context

ROADMAP L185 declares v0.4.0 milestone = "2-3 周 dogfooding benchmark + 稳定期" (internal ship timeline). REQUIREMENTS R8.2 spec verbatim "co-maintainer 招募窗口启动 6 month window + docs/MAINTAINER-ONBOARDING.md" (external organic dependency).

Phase 4.1 ship retrospective sister review T3 (DEFERRED #BB) raised cadence consistency question: "Is `1 phase/day` cadence sustainable when R8.2 external dependency 真正 fires?" — semantic conflict between internal ship cadence vs external organic clock.

R-3 risk surface: narrative drift between two narratives competing for same milestone — "v0.4.0 SHIPPED 2-3 weeks internal" (factually true per Phase 4.1+4.2+4.3 1-day each ship cadence verified) vs "6-month co-maintainer window opens post-ship" (organic external clock dependency NOT counted v0.4.0 ship timeline). Without disambiguation: stakeholders conflate clocks → misread v0.4.0 ship timeline as 6-month OR misread external co-maintainer recruitment as 2-3 weeks → narrative drift compromises project credibility.

## Decision

**HYBRID two clocks SEPARATE** pattern — for any milestone with mixed internal-deliverable + external-dependency scope:

- **Internal infra ship clock**: tracks ship-time progress on internal deliverables (Phase X.Y ✅ SHIPPED markers, ROADMAP `2-3 weeks` timeline, baseline tag iteration). Verified per-phase ≤1 day track record sister cadence consecutive.
- **External organic clock**: tracks ship-time progress on external-dependency outcomes (6-month co-maintainer recruitment window per R8.2, R9.1 单 maintainer 36%/年掉队率 mitigation 长期工程). Opens post-internal-ship; runs through v0.5/v1.0 timeline.
- **2-clock disambiguation language enforcement**: ROADMAP + STATE.md + RETROSPECTIVE.md `Cost Patterns` section MUST use explicit "internal infra ship clock" vs "external co-maintainer organic clock" literal phrases when discussing T3 / external-dependency phases — NEVER conflate into single "milestone duration" narrative
- **Standing process for v0.5+ external-dependency phases**: future phases with R-3 risk surface (external dependency 真正 fires) MUST invoke HYBRID 2-clock pattern at discuss-phase time + ratify D-04 lock + commit to 2-clock disambiguation language

## Consequences

**Positive**:
- R-3 narrative drift prevented at v0.4.0 milestone close 通过 STATE.md L24 + RETROSPECTIVE § Cost Patterns explicit 2-clock language
- T3 cadence consistency question (#BB) ✅ pre-RESOLVED via 2-clock disambiguation (NOT timeline compromise)
- Karpathy "ship fast even if external" principle preserved (internal infra ships 1-day cadence) WITHOUT denying external 6-month organic clock reality
- Sister R-3 mitigation institutionalized for v0.5+ external-dependency phases (recruitment windows, beta program windows, conformance certification windows etc.)

**Negative + mitigation**:
- 2-clock disambiguation requires ongoing language discipline — risk of accidental conflation in future docs; mitigation: explicit literal phrases enforce + STATE.md `Note (D-04 HYBRID 2-clock R-3 mitigation)` block as recurring template per phase ship
- Reader cognitive cost +1 clock to track; mitigation: clear "internal vs external" labels + sister 5-recurrence terminus heuristic threshold for re-eval if clock count needs to grow beyond 2

## References

- `.planning/phase-4.2/4.2-CONTEXT.md` D-04 HYBRID 2-clock disambiguation source (locked 2026-05-18 via discuss-phase)
- `.planning/STATE.md` L24 `Note (D-04 HYBRID 2-clock R-3 mitigation)` block (recurring template per phase ship Phase 4.2 onward)
- `.planning/RETROSPECTIVE.md` § Phase 4.2 milestone retrospective § Cost Patterns (explicit 2-clock language Phase 4.2 W2 T2.2 cadence implementation)
- `.planning/ROADMAP.md` L185-187 v0.4.0 chapter Note (D-04 HYBRID 2-clock reconcile R-3 mitigation) explicit 2-clock language enforce
- `docs/MAINTAINER-ONBOARDING.md` R8.2 external dependency anchor (6-month organic clock开口)
- `.planning/REQUIREMENTS.md` R9.1 单 maintainer 36%/年掉队率 mitigation 长期工程 (Avelino 论文实证) — long-term mitigation NOT short-term sprint
- `docs/adr/0019-state-dual-ssot-collapse-pattern.md` (sister institutional pattern lock backfill — both ADRs cohorted Phase 4.3 W2 R8.4 backfill cluster)
- `docs/adr/0018-routing-audit-log.md` § 5 M-01 PhaseClass ARCHITECTURAL vs R-5 publish-only meta-disambiguation (sister meta-decision lock — both ADR 0018 M-01 + ADR 0020 HYBRID 2-clock document semantic disambiguation institutional discipline at v0.4.0 milestone close)
