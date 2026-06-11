# ROADMAP — harnessed

> Shipped history = indexed archive (do NOT re-plan). Active milestone = **v6.0 Doc-Discipline Substrate** (G1 文档纪律 + G2 哨兵 gating).
> Current published npm: **4.3.0** · milestone codenames (v6.0) are spec/era names, NOT npm versions.

---

## Shipped milestones (archived index)

> Delivered baseline. Detail in `.planning/milestones/*-MILESTONE-AUDIT.md` + `CHANGELOG.md` (46 releases) + `.planning/RETROSPECTIVE.md`.

| Milestone | Shipped | Summary |
|-----------|---------|---------|
| v0.1.0 | 2026-05-12~14 | manifest 引擎 + research workflow. |
| v0.2.0 | 2026-05-16 | sub-task loop + extension installers. |
| v0.3.0 | 2026-05-17 | plan-feature + checkpoint engine; routing 30/30 100%. |
| v0.4.0 | 2026-05-19 | dogfooding + 稳定期 (benchmark, audit log, community). |
| v2.0 | 2026-05-20 | Architecture Refactor — pure bundled SoT + capabilities + judgments. |
| v3.0 | 2026-05-21 | 4-Stage Namespace-Layered Workflow — master orchestrator + 22 sub-workflow + L0 disciplines. ADR-0030/0031/0032. |
| v0.5.0 / v1.0 GA | 2026-05-22 | v1.0-RC2 hardening → production GA. |
| v3.9.x | 2026-05-24~30 | maintenance series (v3.9.3→v3.9.26), dogfood bug fixes. |
| v4.0.0 | 2026-05-30 | orchestration-brain redesign — gates/prompt/checkpoint CLIs, CC-native spawn. |
| v4.1.0→v4.1.3 | 2026-05-30~06-04 | yaml SoT richness + code-review fixes + P0 data-loss fixes. 1107 tests. |
| v5.0 State Machine Core (Spec 1) | shipped as **v4.2.0** 2026-06-05 | structured progress ledger + fail-closed evidence guard + `status --recover` + handoff sha256 drift. 8/8 phases. ADR-0033. 1158 tests. Spec 2/3 deferred (see Backlog). Phase archive: `.planning/milestones/v5.0-phases/`. |
| v5.1 Upstream Re-sync | shipped as **v4.3.0** 2026-06-10 | GSD Core rename `@opengsd/gsd-core` 1.4.1 + gstack/mattpocock bump + 18 new capabilities + stage-phase-gate triggers. Keystone: execute self-owned. 1167 tests. 详: `phases/09-gsd-core-rewire/` + `phases/10-gstack-bump-skills/`. |

---

## Active milestone: v6.0 Doc-Discipline Substrate

**Goal**: Close the two highest-value gaps vs `~/.claude/CLAUDE.md` — codify the 文档纪律 section (entirely un-mechanized) as a 7th L0 discipline, and finish the 强制执行哨兵 (half-done) with a checkpoint-sync gate before COMPLETE. **Additive-only**: 1 new discipline yaml + 1 new enforcement hook + tests. Reuses existing L0 substrate + v4.2 checkpoint ledger. **No architecture change.**

**Discuss decisions** (2026-06-11): 1 milestone / 2 phases (G1→G2); G1 lives in `disciplines/doc-discipline.yaml`; enforcement is warn-majority with STATE line-count `halt`-with-override (karpathy philosophy). Strategic + architecture review skipped (scope locked, reuses existing pattern).

**Invariants**: 7th discipline follows the existing 6-discipline `harnessed.discipline.v1` shape; reuse before-commit / checkpoint ledger (no new state store); KARPATHY-minimal; full gate green vs the 1167-test baseline; Windows CI green; NEVER push without approval.

### Phases

- [x] **Phase 11: doc-discipline substrate (G1)** ✅ 2026-06-11 — `disciplines/doc-discipline.yaml` (6 rules) + `doc-discipline` capability (7th L0) + before-commit STATE-line halt/override. vitest 1179 green. 详: `phases/11-doc-discipline/`.
- [ ] **Phase 12: sentinel gate (G2)** — new `before-complete.ts` checkpoint-sync gate (refuse COMPLETE when `.planning/` unsynced). Depends on Phase 11. Reqs: REQ-v60-sentinel-gate, REQ-v60-validation (final gate). 详: `phases/12-sentinel-gate/`.

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 11. doc-discipline substrate | 1/1 | ✅ Complete (vitest 1179 green) | 2026-06-11 |
| 12. sentinel gate | 0/1 | ⏳ Planned | — |

---

## Backlog / Deferred (future milestones)

- **v5.0 Spec 2** — session-scoped state (`sessions/<CLAUDE_SESSION_ID>.json`) + single-session fallback.
- **v5.0 Spec 3** — per-turn injection hook + scale-adaptive verify strength.
- Security hardening pass (threat-model-gated): shell-injection `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency hazards `sigintTrap.ts`/`before-commit.ts`.
