# ROADMAP — harnessed

> Shipped history = indexed archive (do NOT re-plan). Active milestone = **v7.0 Gap-Close & Memory Loop** (close comet/Trellis competitive gaps + de-bloat planning docs).
> Current published npm: **4.4.0** · milestone codenames (v6.0/v7.0) are spec/era names, NOT npm versions. v6.0 implemented 2026-06-11, pending npm release.

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

> **v6.0 Doc-Discipline Substrate** — ✅ implemented 2026-06-11 (Phase 11 doc-discipline + Phase 12 sentinel gate, vitest 1188). Pending npm release (bump from 4.4.0). 详: `phases/11-doc-discipline/` + `phases/12-sentinel-gate/`.

## Active milestone: v7.0 Gap-Close & Memory Loop

**Goal**: Close the competitive gaps surfaced by the comet/Trellis comparison (2026-06-13) — make the runtime actually run (compact real, multi-workflow), add the cross-session learning loop Trellis builds its moat on, and trim the planning-doc bloat that violates our own v6.0 doc-discipline. Plus a minimal adoption motion (2 GitHub stars today vs comet 1.2k / Trellis 10.2k).

**Discuss decisions** (2026-06-13, via comparison analysis + AskUserQuestion): full 6-item scope, phased; doc-debloat full (status-line digest + archive); multi-workflow = complete breaking migration (un-defers G5); adoption = minimal (README quickstart + 1 honest comparison post). **Non-goals** (actively trimmed, NOT YAGNI-justified at 1 harness + ~0 users): cross-harness breadth, routing L2-supervisor over-generalization.

**Invariants**: additive-where-possible; multi-workflow migration ships a compat-read for the existing singleton `current-workflow.json` (no data loss); KARPATHY-minimal surgical diffs; full gate green vs the 1188-test baseline; Windows CI green; biome preempt before every TS/JS commit; NEVER push without approval; every `.planning/` edit self-exemplifies doc-discipline.

### Phases

- [x] **Phase 13: planning doc-debloat (A)** ✅ 2026-06-13 — PROJECT-SPEC status blockquote folded 6265→1196 chars (digest PASS) + 8 non-English README best-effort headers; docs-only. Committed 933441d. 详: `phases/13-planning-doc-debloat-a/`.
- [ ] **Phase 14: compact 做实 (B)** — `src/checkpoint/compact.ts` placeholder → real context compression with measured token reduction. Runtime foundation for long tasks (comet ships 25–30%). 详: `phases/14-*` (NEW).
- [ ] **Phase 15: multi-workflow migration (D / un-defer G5)** — singleton `current-workflow.json` → multiple active workflows + compat-read migration. Closes the parallel-project gap (comet multi-Spec, Trellis multi-task). BREAKING schema. Subsumes Backlog "v5.0 Spec 2". 详: `phases/15-*` (NEW).
- [ ] **Phase 16: learning 回灌闭环 (C)** — extract decisions/lessons from completed workflows → promote into persistent knowledge so the next session starts smarter (Trellis `update-spec` analog, no-vendor). Biggest increment; builds on Phase 15 state base. 详: `phases/16-*` (NEW).
- [ ] **Phase 17: spec/convention auto-injection (E / ex-Spec3)** — extend the G4 inject hook to inject relevant project specs/conventions per turn, not just workflow state. Subsumes Backlog "v5.0 Spec 3". 详: `phases/17-*` (NEW).
- [ ] **Phase 18: CodeGraph semantic index (F)** — integrate semantic code indexing as an optional capability/manifest (comet reports tool-calls ↓58%). Parallelizable (no dep on 14–17). 详: `phases/18-*` (NEW).
- [ ] **Phase 19: minimal adoption (G)** — README quickstart polish + 1 honest harnessed-vs-comet-vs-Trellis comparison post. Last (announce after features land). 详: `phases/19-*` (NEW).

### Phase 13: planning doc-debloat (A)

**Goal**: Cut the planning-doc bloat that violates our own v6.0 doc-discipline, so the overview/status tier is a real digest and history lives in archives.
**Scope**: PROJECT-SPEC.md ~4000-word status blockquote → <100-line digest (current pointer + per-milestone one-liners + pointers); collapse milestone narrative into CHANGELOG/RETROSPECTIVE/git; decide policy for the 11 hand-maintained README translations (on-demand generation or drop-to-N). Self-exemplifies doc-discipline. No `src/` code change.
**Depends on**: none (independent, first).
**Acceptance**: PROJECT-SPEC status section <100 lines; no history inlined in overview tier; doc-discipline `before-commit` check passes clean on the edited docs; zero behavior/code change.
**Plans**: 1 plan — 13-01-PLAN.md (PROJECT-SPEC status digest + 8 non-English README best-effort headers + verify gate). Wave 1, autonomous, docs-only.

### Phase 14: compact 做实 (B)

**Goal**: Turn the stubbed checkpoint compaction into real, measured context compression so long tasks survive context pressure.
**Scope**: `src/checkpoint/compact.ts` placeholder → real compaction (summarize/evict resolved sub-progress + spec/brainstorm context); measured token-reduction assertion in tests. Reuses existing checkpoint ledger; additive to `compact` CLI.
**Depends on**: none (independent).
**Acceptance**: compact produces a measurable input-token reduction on a fixture workflow; no data loss of unresolved state; TDD red→green; full gate green.

### Phase 15: multi-workflow migration (D / un-defer G5)

**Goal**: Replace the singleton current-workflow with multiple concurrently-active workflows, closing the parallel-project gap, without losing existing singleton state.
**Scope**: singleton `current-workflow.json` → keyed multi-workflow store; `currentWorkflow.v1.ts` schema migration (schemaVersion bump) + compat-read of the old singleton; `state.ts`/`ledger.ts`/CLIs (`status`/`next`/`resume`/`reject`) updated to select active workflow. BREAKING. Subsumes ex-Spec-2.
**Depends on**: Phase 14 (compaction operates per-workflow; settle compact first).
**Acceptance**: old singleton `current-workflow.json` auto-migrates with zero data loss (tested); two workflows active + independently resumable; all existing checkpoint tests green post-migration.

### Phase 16: learning 回灌闭环 (C)

**Goal**: Add the cross-session learning loop — completed workflows promote durable learnings into persistent project knowledge so the next session starts smarter (Trellis `update-spec` analog, no-vendor).
**Scope**: extract decisions/lessons/patterns from a completed workflow ledger → write to a persistent knowledge store (`.planning/`-resident or capability-driven); wire into `checkpoint complete`. No upstream vendoring (compose, don't copy).
**Depends on**: Phase 15 (per-workflow learnings keyed off the multi-workflow store).
**Acceptance**: completing a workflow emits a structured learnings artifact; a subsequent workflow can read it; round-trip covered by tests; KARPATHY-minimal surface.

### Phase 17: spec/convention auto-injection (E / ex-Spec3)

**Goal**: Inject relevant project specs/conventions into each turn, not just workflow state — deepen the G4 hook from state-only to knowledge-aware.
**Scope**: extend `src/checkpoint/injectState.ts` + `bin/harnessed-inject-state.mjs` to select + inject relevant project conventions/specs per turn (size-bounded). Subsumes ex-Spec-3. Reuses Phase 16 knowledge store where available.
**Depends on**: Phase 16 (injects the promoted knowledge).
**Acceptance**: inject hook emits relevant convention context bounded by a token budget; no injection when none relevant (silent); tested for selection + budget cap.

### Phase 18: CodeGraph semantic index (F)

**Goal**: Offer semantic code indexing as an optional capability to cut tool-call/token cost on code navigation (comet reports tool-calls ↓58%).
**Scope**: integrate a semantic code index as an optional manifest/capability (install + check + invoke), gated behind an opt-in; no hard dependency added to base. Parallelizable.
**Depends on**: none (no dep on 14–17; can run anytime).
**Acceptance**: capability installs + checks via manifest; opt-in only (base unaffected when absent); doctor reports presence; no base-install regression.

### Phase 19: minimal adoption (G)

**Goal**: Make the project legible to a first real user and publish one honest positioning artifact (2 stars today).
**Scope**: README quickstart polish (install → first workflow in <5 min); 1 honest harnessed-vs-comet-vs-Trellis comparison post (reuse the 2026-06-13 analysis, no vanity-metric spin). Docs/markdown only.
**Depends on**: Phases 13–18 (announce after features land).
**Acceptance**: a new user can reach first successful workflow from README alone; comparison post is factually accurate (downloads-are-noise caveat included); no code change.

---

## Backlog / Deferred (future milestones)

- ~~v5.0 Spec 2 (session-scoped state)~~ → folded into v7.0 Phase 15 (multi-workflow migration).
- ~~v5.0 Spec 3 (per-turn injection)~~ → folded into v7.0 Phase 17 (spec auto-injection).
- Security hardening pass (threat-model-gated): shell-injection `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency hazards `sigintTrap.ts`/`before-commit.ts`.
- Deferred non-goals (v7.0 discuss): cross-harness breadth (only CC implemented; revisit when a 2nd harness has real demand); routing L2-LLM-supervisor simplification.
