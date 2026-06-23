# ROADMAP — harnessed

> Shipped history = indexed archive (do NOT re-plan). Active milestone = **v9.0 Cross-Harness** (architecture locked 2026-06-23, scope B — see Active section). Prior: v8.0 Frictionless Entry shipped 2026-06-23.
> Current published npm: **4.6.0** (2026-06-14) · milestone codenames (vN.0) are spec/era names, NOT npm versions.

---

## Shipped milestones (archived index)

> Delivered baseline. Detail in `.planning/milestones/*-MILESTONE-AUDIT.md` + `phases/<NN>/` SUMMARY + `CHANGELOG.md` (46 releases) + `.planning/RETROSPECTIVE.md`. Overview tier holds one line + pointer per milestone — narrative lives in the archives, never inlined here.

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
| v5.0 State Machine Core | 2026-06-05 (npm 4.2.0) | structured progress ledger + fail-closed evidence guard + `status --recover` + handoff drift. ADR-0033. 1158 tests. Archive: `milestones/v5.0-phases/`. |
| v5.1 Upstream Re-sync | 2026-06-10 (npm 4.3.0) | GSD Core `@opengsd/gsd-core` 1.4.1 + gstack/mattpocock bump + 18 capabilities + stage-phase-gate. execute self-owned. 1167 tests. 详: `phases/09-gsd-core-rewire/` + `phases/10-gstack-bump-skills/`. |
| v6.0 Doc-Discipline Substrate | 2026-06-11 (npm 4.4.0) | Phase 11 doc-discipline (7th L0) + Phase 12 G2 sentinel `checkPlanningSync` guard. 1188 tests. 详: `phases/11-doc-discipline/` + `phases/12-sentinel-gate/`. |
| v7.0 Gap-Close & Memory Loop | 2026-06-14 (npm 4.5.0→4.6.0) | 7 phases (13–19) closing the first comet/Trellis comparison: doc-debloat, compact-real, multi-workflow (un-defer G5), learning-loop, spec-injection, CodeGraph opt-in, minimal adoption. + follow-ons: Phase 20 `update` (comet-update gap), Phase 21 ship-stage (4→5 stage), Phase 22 smart reminders (ship+retro), Phase 23 Windows install fix. 1335 tests. 详: `phases/13-…/` … `phases/23-…/` SUMMARYs. |
| v8.0 Frictionless Entry | 2026-06-23 | 2 phases: 24 single-command resume entry (zero-arg `harnessed` you-are-here + `NEXT: auto\|manual\|done` + `--json`, comet `/comet` analog) + 25 value-prop/quickstart legibility (结果导向定位主句 + First 5 Minutes quickstart). 1352 tests. Audit passed 2/2. 详: `phases/24-resume-entry/` + `phases/25-quickstart/` SUMMARYs + `milestones/v8.0-MILESTONE-AUDIT.md`. |

---

## Active milestone: v9.0 Cross-Harness

**Goal** (architecture locked 2026-06-23 via inline design + `/plan-eng-review`, scope B): abstract harnessed's OWN hardcoded `~/.claude/` layout onto a `PlatformDescriptor` + `detectPlatform()` (claude-first, zero blast) + central config resolvers, proving portability by wiring the industry `.agents/` convention as a real second platform. No generator / no per-platform matrix (upstreams already portable, v8.0 verified). Design SoT: `v9.0-cross-harness-ARCHITECTURE.md`.

### Phases (sketch — refine at execution per anti-stale; A detailed, B/C sketch)

- [x] **Phase 26 (A): PlatformDescriptor seam** ✅ 2026-06-24 — descriptor type + `detectPlatform()` (override + claude-default) + `getHarnessedRoot()` routed through it. Zero behavior change (1357 tests, seam transparent). TDD. 详: `phases/26-platform-descriptor-seam/26-01-SUMMARY.md`.
- [x] **Phase 27 (B): central config resolvers** ✅ 2026-06-24 — 5 resolvers (`getSettingsPath/Skills/Commands/PluginsRegistry/McpConfig`) + optional home base (D2 preserves capabilityResolver test param); folded the 2 near-duplicate env-key settings writers behind `settingsWriter.mergeSettingsEnvKey` (262→133L, D-C; ccHookAdd path-only swap, Installer pipeline untouched); 8 swap sites + 2 idempotent sites routed; `['.claude','.agents']` dual-probe left for Phase 28. Zero behavior change (1369 tests, +12 new, existing UNCHANGED). TDD. 详: `phases/27-config-resolvers/27-01-SUMMARY.md`.
- [ ] **Phase 28 (C): `.agents/` proof** — agents descriptor + auto-probe detection + `HARNESSED_PLATFORM`/`.platform` pin + `setup --platform` + dual-platform tests + fixture parameterization. Verify `.agents/` layout + mcpConfigPath (D-A/D-B) at start. Sketch.

> Open decisions D-A (`.agents/` mcpConfigPath) + D-B (`.agents/` layout) = Phase-C-time verification (architecture doc §7). D-C bundled into Phase 27. Adoption (stars/gif/DeepWiki) remains a non-phase marketing follow-on (~0 ★ vs comet 1.5k / Trellis 10.9k).

---

## Backlog / Deferred (future milestones)

- **v10.0 i18n Surface** (big bet ②) — extend i18n from the CLI message layer (en/zh-Hans, already shipped) to the skill/workflow surface bilingual (comet model: ship EN+中文 skills). Parallelizable with v9.0. Sketch only.
- ~~Deferred non-goal (v7.0 discuss): cross-harness breadth~~ → **un-deferred 2026-06-23** (→ v9.0): demand changed (user direction 守宽做深 + cross-platform) AND feasibility changed (upstreams gstack/ECC verified already cross-harness). routing L2-LLM-supervisor simplification still deferred.
- Security hardening pass (threat-model-gated): shell-injection `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency hazards `sigintTrap.ts`/`before-commit.ts`.
