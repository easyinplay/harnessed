# ROADMAP — harnessed

> Shipped history = indexed archive (do NOT re-plan). Active milestone = **v5.1 Upstream Re-sync**.
> Current published npm: **4.2.0** · milestone codenames (v5.1) are spec/era names, NOT npm versions.

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
| v5.0 State Machine Core (Spec 1) | shipped as **v4.2.0** 2026-06-05 | structured progress ledger + fail-closed evidence guard + `status --recover` + handoff sha256 drift. 8/8 phases. ADR-0033. 1158 tests. Spec 2/3 deferred (see Backlog). Phase archive: `.planning/v5.0/`. |

---

## Active milestone: v5.1 Upstream Re-sync

**Goal**: Sync harnessed's composition manifest + capability registry to upstream drift — GSD Core rename (`@opengsd/gsd-core` 1.4.1) + gstack/mattpocock version bumps + new upstream skills. **Additive-only config**: ~18 new `capabilities.yaml` entries + 2 manifest version bumps + test-fixture sync. **No runtime/architecture change.**

**Keystone decision**: execute mechanism stays self-owned (`gsd-execute-phase` NOT wired — harnessed keeps CC-native spawn + ralph-loop + v4.2 checkpoint ledger). Preamble already delivered: GSD Core manifest rename (commit `0ab8c52`) + `.planning/` GSD-layout migration (`f61e443`).

**Invariants**: every new entry follows existing `impl / skill_dir / cmd / fires_when` pattern; every `skill_dir` verified on disk before wiring; only gstack/mattpocock version fields mutated (no existing capability rewritten); KARPATHY-minimal; full quality gate green vs the 1158-test baseline; Windows CI green.

### Phases

- [x] **Phase 9: GSD Core re-wire** ✅ 2026-06-09 - Added 12 GSD Core 1.4.1 capabilities + 4 stage-phase-gate triggers (additive, keystone intact). 详: phases/09-gsd-core-rewire/09-01-SUMMARY.md
- [x] **Phase 10: gstack/mattpocock bump + 6 skills** ✅ 2026-06-09 - Bumped gstack manifest to main HEAD (`1626d485…` / `1.52.1.0`) + mattpocock last_check refresh, wired 6 new non-iOS gstack capabilities (spec/skillify/pair-agent/scrape/benchmark-models/landing-report) into Bucket 7, full green gate. 详: phases/10-gstack-bump-skills/10-SUMMARY.md

---

## Phase Details

### Phase 9: GSD Core re-wire
**Goal**: harnessed's capability registry exposes the GSD Core 1.4.1 phase-stage, bootstrap, and milestone-lifecycle skills, and the judgments router can fire the stage-gated ones — without wiring `gsd-execute-phase`.
**Depends on**: Nothing (first phase of v5.1; preamble rename already landed)
**Requirements**: REQ-v51-gsd-rewire, REQ-v51-gsd-judgments, REQ-v51-validation (partial — additive + green for GSD scope)
**Success Criteria** (what must be TRUE):
  1. `workflows/capabilities.yaml` carries ~12 new `impl: gsd` entries — stage-gap (`gsd-spec-phase` / `gsd-ui-phase` / `gsd-secure-phase` / `gsd-ai-integration-phase`), bootstrap (`gsd-ingest-docs` / `gsd-new-project` / `gsd-new-milestone`), milestone lifecycle (`gsd-extract-learnings` / `gsd-audit-milestone` / `gsd-complete-milestone` / `gsd-milestone-summary`), and `gsd-docs-update` — each matching the existing `skill_dir / cmd / since / category / fires_when` shape.
  2. Every new entry's `skill_dir` resolves to a real directory in the installed GSD Core 1.4.1 skill set (verified on disk, not assumed).
  3. `gsd-execute-phase` is NOT present as a capability (self-owned execute preserved).
  4. The stage-phase capabilities (spec/ui/secure/ai-integration) are referenced from `workflows/judgments/*.yaml` triggers consistent with `gsd-plan-phase` / `gsd-discuss-phase` routing; every trigger ref resolves to a real capability name with no orphan capability or dangling trigger.
  5. `capability-resolver` + `check-workflow-schema` pass; biome + tsc clean; vitest green for this scope.
**Plans**: TBD

### Phase 10: gstack/mattpocock bump + 6 skills
**Goal**: harnessed's manifests track current gstack/mattpocock HEAD and its registry exposes the 6 new non-iOS gstack skills, with the full additive change verified green against the 1158-test baseline.
**Depends on**: Phase 9
**Requirements**: REQ-v51-gstack-bump, REQ-v51-gstack-skills, REQ-v51-validation (final gate)
**Success Criteria** (what must be TRUE):
  1. `manifests/gstack.yaml` `git_ref` advances `74895062` → current main HEAD (`1626d485…`), `last_known_good` `main-269-commits` → `1.52.1.0`, plus `last_check` refresh — repo unchanged (version drift only, no rename); `mattpocock-skills.yaml` `last_check` + `last_known_good` bump (`skills@1.5.10` installer).
  2. `workflows/capabilities.yaml` carries 6 new `skill_dir: gstack` entries — `spec` / `skillify` / `pair-agent` / `scrape` / `benchmark-models` / `landing-report` (iOS suite intentionally skipped).
  3. Each of the 6 gstack subdirs is verified to exist on disk (`~/.claude/skills/gstack/<name>/`).
  4. `manifest-validate` + `capability-resolver` + `check-workflow-schema` all pass; known-good locks consistent; test fixtures synced.
  5. Final green gate: every change is additive (no existing capability mutated except gstack/mattpocock version fields); biome + tsc clean; full `vitest run` green with no regression vs the 1158-test baseline.
**Plans**: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 9. GSD Core re-wire | 0/0 | Not started | - |
| 10. gstack/mattpocock bump + 6 skills | 0/0 | Not started | - |

---

## Backlog / Deferred (future milestones)

- **v5.0 Spec 2** — session-scoped state (`sessions/<CLAUDE_SESSION_ID>.json`) + single-session fallback.
- **v5.0 Spec 3** — per-turn injection hook + scale-adaptive verify strength.
- Security hardening pass (threat-model-gated): shell-injection `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency hazards `sigintTrap.ts`/`before-commit.ts`.
