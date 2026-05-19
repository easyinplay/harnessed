# ADR 0019: STATE dual-SoT 5-recurrence terminus COLLAPSE pattern (backfill Phase 3.3 D-04 institutional pattern lock)

## Status

**Accepted backfill — Phase 3.3 source ratified Phase 4.3 W2 — 2026-05-19** — institutional pattern lock backfill (Phase 3.3 D-04 (b) COLLAPSE locked 2026-05-17; ratified as ADR 0019 at Phase 4.3 W2 per CONTEXT D-03 + R8.4 "公开 ADR 全集" backfill scope). Sister cross-ref ADR 0018 § 2 D-02 forward-only鉴定 lesson + ADR 0017 § 4 D-04 DOCTOR WARN STATE STRATEGIC institutionalize.

## Context

Project memory iterated **5 dual-SoT 反 pattern recurrences** Phase 2.3 → 3.3 (5-recurrence terminus heuristic trigger threshold per sister 5-recurrence terminus disambiguation — pattern stable institutionalize standard):

1. **README L9 freshness scope** (Phase 2.3) — README Status header carried duplicate phase ship status competing with STATE.md `当前位置` block — solved by README L9 user-facing repositioning STATE.md sole dev SoT
2. **README L44 dev status section** (Phase 2.4) — README "Status" dev section ship narrative competing with STATE.md `已完成 phase ship 历史` — solved by README user-facing scope shrink dropped CI gates `README counter integrity` + `README completeness check`
3. **PROJECT-SPEC L3 Status header** (Phase 3.1) — PROJECT-SPEC competing with STATE.md ship status — solved by FRONT_MATTER_DOCS scope = ['PROJECT-SPEC.md', '.planning/STATE.md'] only (transparency gate freshness check)
4. **STATE.md `> Status:` frontmatter L4** (Phase 3.3) — STATE.md L4 frontmatter `> Status:` line + L5 `> 最后更新：` line BOTH competing with `当前位置` block (L21-27) — solved by L4+L5 line deletion D-04 (b) COLLAPSE; `当前位置` block becomes sole SoT
5. **STATE.md `当前位置` block** (Phase 3.3 D-04 lock) — `当前位置` block ratified as single SoT for phase ship event log; sister `scripts/check-transparency-verdicts.mjs` extends with `STATE_POSITION_RE` OR-fallback (full-file scan) so STATE.md freshness gate acceptance check still passes despite L4/L5 deletion

5 recurrences = sister 5-recurrence terminus heuristic threshold trigger condition → institutional pattern lock COLLAPSE 必终止 dual-SoT 反 pattern across project surface.

## Decision

**COLLAPSE pattern** — for any future "Status: X" / "freshness marker" / "phase ship narrative" surface in project documentation:
- **Single SoT discipline** institutionalize — STATE.md `当前位置` block is **sole SoT** for phase ship event log
- **OR-fallback freshness gate**: `scripts/check-transparency-verdicts.mjs` STATE_POSITION_RE OR-fallback (full-file scan) accepts EITHER first-50-line `> Status:` marker OR full-file `**Phase X.Y SHIPPED**` literal anchor (cohabitation acceptable but single-SoT preferred — STATE.md uses full-file OR-fallback exclusively post-COLLAPSE)
- **Sister M2 D2 cadence standing process**: prev-phase narrative auto-archive STATE → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase {N-1} section each phase ship-time T6.N step (Plan 03 W2 T2.2 standing process Phase 3.4+ onward); verified iter 1→2→3→4 stable beyond ≥3-iter terminus signal per sister 5-recurrence terminus heuristic confirmed pattern stable
- **Recurrence beyond 5th = institutional re-eval trigger**: if 6th dual-SoT surface emerges → re-evaluate D-04 COLLAPSE pattern adequacy + extend OR-fallback scope OR introduce new institutional discipline (not just policy violation alert)

## Consequences

**Positive**:
- STATE.md single SoT eliminates project memory drift between competing surfaces
- `scripts/check-state-archive-stale.mjs` 3-rules gate enforce: SIZE_LIMIT (200→175 Phase 4.3 W0.2 RELAX) + 关键决议 ship 总结 ≤1 section + W-N errata literal 禁
- Sister M2 D2 cadence iter 1 (Phase 3.4) → iter 2 (Phase 4.1) → iter 3 (Phase 4.2 terminus stable signal ≥3-iter) → iter 4 (Phase 4.3 REINFORCE) verified pattern stable beyond founder-effort — standing process robust
- 5-recurrence terminus heuristic threshold ratified as project-wide institutional discipline standard

**Negative + mitigation**:
- Single SoT discipline requires ongoing vigilance against new dual-SoT recurrences (e.g., dashboards, badges, external integrations); mitigation: D-04 COLLAPSE pattern documented + this ADR 0019 backfill institutional reference; sister 6th recurrence trigger condition explicit for institutional re-eval
- STATE.md trim cadence pressure on prev-phase narrative archive: mitigation: D2 standing process auto-archive prev-phase narrative each phase ship-time T6.N step (sister 4-iter REINFORCE stable signal beyond terminus)

## References

- `.planning/phase-3.3/3.3-CONTEXT.md` D-04 (b) COLLAPSE source (locked 2026-05-17)
- `.planning/RETROSPECTIVE.md` § ARCHIVED FROM STATE — Phase 3.3+3.4 (Phase 4.1 W0.3 D2 cadence iter 2 archive 2026-05-18)
- `.planning/RETROSPECTIVE.md` § ARCHIVED FROM STATE — Phase 4.0+4.1 (Phase 4.2 W0.1 D2 cadence iter 3 archive 2026-05-18 terminus stable signal)
- `.planning/RETROSPECTIVE.md` § ARCHIVED FROM STATE — Phase 4.2 (Phase 4.3 W0.1 D2 cadence iter 4 REINFORCE archive 2026-05-19)
- `scripts/check-transparency-verdicts.mjs` STATE_POSITION_RE OR-fallback implementation (Phase 3.3 D-04 (b) COLLAPSE locked)
- `scripts/check-state-archive-stale.mjs` 3-rules gate D3 ENFORCE round 2 + SIZE_LIMIT=175 round 2 RELAX (Phase 4.3 W0.2)
- `docs/adr/0017-routing-hit-rate-token-budget.md` § 4 D-04 STATE STRATEGIC institutionalize 4 D-decisions D1-D4 (sister institutional pattern lock — STATE STRATEGIC governs archive cadence; this ADR 0019 governs COLLAPSE pattern dual-SoT termination)
- `docs/adr/0018-routing-audit-log.md` § 2 D-02 forward-only (sister institutional pattern lock — audit log NEW SoT for routing-decision dimension forward-only NOT 重复 existing implementation-decision SoT per D-04 COLLAPSE 教训 cross-ref)
