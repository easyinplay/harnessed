# REQUIREMENTS — harnessed

> Regenerated 2026-06-05 from `.planning/intel/requirements.md` reconciliation.
> Shipped families = delivered baseline (do NOT re-plan). Latest shipped = v5.1 Upstream Re-sync (✅ v4.3.0).
> Current published version: **v4.3.0**. Active milestone: **v6.0 Doc-Discipline Substrate** (G1 文档纪律 codify + G2 哨兵 gating).

---

## Shipped requirement families (delivered baseline — all Done)

> Historical record. Detail lives in `.planning/milestones/*-MILESTONE-AUDIT.md` + `CHANGELOG.md` (authoritative, 46 releases).

| Family | Version | Status | Scope |
|--------|---------|--------|-------|
| REQ-v0.1-manifest | v0.1.0 | ✅ Done | manifest 引擎 + research workflow. |
| REQ-v0.2-subtask | v0.2.0 | ✅ Done | sub-task loop + extension installers. |
| REQ-v0.3-checkpoint-routing | v0.3.0 | ✅ Done (7/7) | checkpoint engine + plan-feature + gstack probe + aliases/deprecation + version lock + routing hit-rate 30/30 100% + token budget doctor. |
| REQ-v0.4-benchmark-community | v0.4.0 | ✅ Done (6/6) | dogfooding benchmark + routing audit log + co-maintainer onboarding + GitHub Sponsors + stale-bot + ADR 0018-0020. |
| REQ-v0.5-hardening | v0.5.0 | ✅ Done (4/4) | audit-log consumer (`--filter`) + state.ts concurrent-write lock + `harnessed uninstall` (7-method) + path-traversal guard (5-vector OWASP A1) + ADR 0021/0022. |
| REQ-v2.0-architecture-refactor | v2.0 | ✅ Done (16/16, R20.6 dropped) | pure bundled SoT + capabilities.yaml flat map + expr-eval gate grammar + judgments multi-file + 4 v2 workflows + release-notes migration + ADR 0024-0029. |
| REQ-v3.0-4stage | v3.0 | ✅ Done (13/13) | 4-stage namespace-layered (22 v3 workflows) + master auto gate-route + bare slash cmd + nested dir + L0 disciplines + L5b execution mechanism + rules-based routing + gstack capabilities registry. Implements ADR-0030/0031/0032. |
| REQ-v3.9.x-maintenance | v3.9.3→v3.9.26 | ✅ Done | dogfood bug fixes + Windows compat + Option A architecture fix (interactive clarify → main session). |
| REQ-v4.0-orchestration-brain | v4.0.0 | ✅ Done | gates/prompt/checkpoint CLIs; CC-native spawn replaces in-process SDK spawn. Implements ARCHITECTURE-SPEC v4.0. |
| REQ-v4.1-yaml-sot-richness | v4.1.0→v4.1.3 | ✅ Done | tools injection + master recursion + disciplines_applied injection + gates→prompt handoff fix + P0 data-loss fixes (atomic write / gc no-op / rollback two-pass). 1107 tests. |
| REQ-v5.0-state-machine-core | v4.2.0 (Spec 1) | ✅ Done (8/8) | structured progress ledger + fail-closed evidence guard + `status --recover` + handoff sha256 drift + verify artifacts_expected backfill + generated ORCHESTRATOR body. Additive schema, single SoT, no FSM lib. ADR-0033. 1158 tests. Spec 2/3 deferred (see Backlog). |
| REQ-v5.1-upstream-resync | v4.3.0 | ✅ Done (5/5) | GSD Core rename `@opengsd/gsd-core` 1.4.1 + gstack/mattpocock bump + 18 new capabilities (12 GSD + 6 gstack) + stage-phase-gate triggers. Keystone: execute self-owned (`gsd-execute-phase` NOT wired). 1167 tests. |

---

## Active forward scope — v6.0 Doc-Discipline Substrate

> Source: gap analysis vs `~/.claude/CLAUDE.md` (G1 文档纪律 entirely un-codified; G2 强制执行哨兵 only half-done).
> Additive-only; reuses existing L0 discipline substrate pattern (7th discipline) + v4.2 checkpoint ledger. No architecture change.
> Discuss decisions (2026-06-11): 1 milestone / 2 phases; G1 = `disciplines/doc-discipline.yaml`; warn-majority + STATE line-count halt-with-override.

### REQ-v60-doc-discipline — codify CLAUDE.md 文档纪律 as 7th L0 discipline (Phase 11)
- **Description**: new `workflows/disciplines/doc-discipline.yaml` (schema `harnessed.discipline.v1`, discipline `doc`) with rules: `state-digest-line-limit` (halt, override-allowed — STATE.md >100 lines), `one-fact-per-file` (warn, heuristic), `overview-pointer-no-inline-narrative` (warn, heuristic — ROADMAP/overview no closing narrative), `transient-consume-then-archive` (warn), `status-derived-from-artifacts` (warn), `responsibility-matrix-one-home` (info). Register `doc-discipline` capability (category=behavioral, discipline_ref). Wire enforcement into `before-commit.ts` (STATE line halt + ROADMAP inline-narrative warn on `.planning/` doc commits).
- **Acceptance**: yaml validates `harnessed.discipline.v1`; capability registered + resolver passes; `before-commit` halts on >100-line STATE without override env, passes with it; per-rule unit tests; biome + tsc + vitest green vs the 1167-test baseline.

### REQ-v60-sentinel-gate — `.planning/` sync guard layered on checkpoint complete (Phase 12)
- **Description**: extend the existing fail-closed evidence guard (ADR-0033) at the `harnessed checkpoint complete <sub>` path with a `.planning/` sync check. New pure fn `checkPlanningSync(cwd, workflowState)` (sister to `checkArtifacts` in `src/checkpoint/evidence.ts`): when `.planning/` exists but the active workflow's progress/STATE artifact is missing or unsynced → contributes to the `missing` set → `complete` BLOCKED exit 1 unless `--force` (records `evidence_status: overridden`). When no `.planning/` dir exists → `none_declared` (no block — non-GSD users unaffected). Folds into the `checkpoint.ts` complete path alongside `checkArtifacts`; NO standalone `before-complete.ts` (one-fact, reuse `mutateSubProgress` + the existing complete flow). Discuss decision (2026-06-11): extend evidence guard (halt + --force), not timestamp-staleness, not warn-only.
- **Acceptance**: `complete` blocks when `.planning/` present + progress unsynced and no `--force`; passes with `--force` (overridden), when synced, or when no `.planning/` (none_declared); transparent block message naming the unsynced doc; unit tests for fire/pass/override/na; reuses checkpoint ledger (no new state store); green gate.

### REQ-v60-validation — additive, backward-compatible, green
- **Description**: all additions additive (new yaml + new hook + new tests; no existing discipline/capability mutated); full quality gate green; Windows CI green.
- **Acceptance**: schema-check + capability-resolver pass; biome + tsc clean; full vitest green; no regression vs the 1167-test baseline.

---

## Backlog (deferred, future milestones)

- **v5.0 Spec 2** — D: session-scoped state (`sessions/<CLAUDE_SESSION_ID>.json`) + single-session fallback.
- **v5.0 Spec 3** — G: per-turn injection hook + H: scale-adaptive verify strength.
- Security hardening pass (threat-model-gated): shell-injection `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency `sigintTrap.ts`/`before-commit.ts`.

---

## Traceability (v6.0 forward scope)

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-v60-doc-discipline | Phase 11 | ✅ Done |
| REQ-v60-sentinel-gate | Phase 12 | ✅ Done (vitest 1188 green) |
| REQ-v60-validation | Phase 11 + Phase 12 (final gate) | ✅ Done |

Coverage: 3/3 done · v6.0 complete (2/2 phases). v5.1 (5/5) shipped v4.3.0. No orphans.
