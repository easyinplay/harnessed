# ROADMAP — harnessed

> Shipped history = indexed archive (do NOT re-plan). Active milestone: **v10.0 i18n Surface** (opened 2026-06-24, phases 29–33 — refine per-phase at plan time; Phase 33 added at Phase-31 plan when research split yaml from SKILL.md).
> Current published npm: **4.7.0** (2026-06-24, bundles v8.0+v9.0+ECC) · milestone codenames (vN.0) are spec/era names, NOT npm versions.

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
| v9.0 Cross-Harness | 2026-06-24 | 3 phases: 26 PlatformDescriptor seam (A) + 27 central config resolvers + settingsWriter fold 262→133L (B) + 28 Codex second-platform proof (C, pivoted from `.agents/` after anti-stale verification). Capability-aware descriptor (`pluginsRegistry: string\|null` + `supportsEnvKeyWrite`); `detectPlatform` claude-first 5-level precedence; `setup --platform codex`; claude default byte-identical. 1394 tests (+42 over v8.0). Audit passed 3/3. 详: `phases/26-…/` + `phases/27-…/` + `phases/28-codex-platform/` SUMMARYs + `milestones/v9.0-MILESTONE-AUDIT.md`. |
| v10.0 i18n Surface | 2026-06-25 (npm 4.8.0) | 5 phases: 29 locale-resolve-layer + 30 skill-i18n sync-guard + 31 SKILL.md translation (26 zh siblings) + 32 CLI message gap (zh 94/94) + 33 user-facing yaml i18n (locale loader + role-prompts/disciplines zh siblings). Approach A parallel sibling files; 2 CI structural-parity hard-gates (skill pre-install + yaml post-install). **Fixed pre-existing en-default bug** (English users were receiving Chinese discipline text; 4 Chinese-source bases→English + zh siblings HEAD byte-identical); `language` excluded (never surfaced). en byte-identical, additive-only. 1446 tests (+52 over v9.0). Audit passed 6/6. Published npm `harnessed@4.8.0` (provenance) + GitHub release `v4.8.0`, CI green 3-OS. 详: `phases/29-…/` … `phases/33-yaml-i18n/` SUMMARYs + `milestones/v10.0-MILESTONE-AUDIT.md`. |

---

## Active milestone — v11.0 State Machine Completion (opened 2026-06-25)

> Close the v5.0 state-machine's **deferred Spec 2 + Spec 3** (the only un-shipped tail of the State Machine Core era). Scope SoT = `milestones/v5.0-phases/STATE-MACHINE-CORE-DESIGN.md` §1 (Spec 2 = D session-scoped state; Spec 3 = G per-turn injection hook + H scale-adaptive verify). Strategy gate (office-hours + ceo-review) **skipped** — scope is pre-defined in the v5.0 design doc (transparent declaration, not a fresh product direction). Full scope D+G+H (user-chosen). Additive backward-compat. Sketch-then-refine — phase one-liners below, full PLAN per-phase at `/gsd-plan-phase`.

| Phase | Goal | Notes |
|-------|------|-------|
| 34 | session-scoped state (Spec 2/D) | ✅ done (local) 2026-06-25 — **composite key `<repoKey>::<sessionId>`** on the Phase 15 `workflows.json` store (refined from the v5.0 `sessions/<id>.json` sketch, which predated Phase 15's repo-keyed store); `process.env.CLAUDE_CODE_SESSION_ID`, no sid → bare repoKey byte-identical. No schema bump. 详: `phases/34-session-scoped-state/34-01-SUMMARY.md` |
| 35 | per-turn injection hook (Spec 3/G) | ✅ done (local) 2026-06-25 — opt-in **UserPromptSubmit** manifest (`manifests/optional/perturn-inject.yaml`) wires the existing inject bin; bin made session-aware (3-tier session→bare→legacy). **Cross-harness session seam** (NEW `PlatformDescriptor.sessionIdEnv`: claude→`CLAUDE_CODE_SESSION_ID`, codex→null) also de-hardcoded Phase 34's activeKey. Feasibility self-resolved (no eng-review). No schema bump. 详: `phases/35-perturn-inject/35-01-SUMMARY.md` |
| 36 | scale-adaptive verify strength (Spec 3/H) | ✅ done (local) 2026-06-26 — surfaced the already-stored `verify_mode` as a `VERIFY-MODE: <mode> — <directive>` breadcrumb line (`buildWorkflowStateBlock` + bin parity), mirroring SHIP-READY/RETRO-DUE. No assessScale/threshold/schema change. 详: `phases/36-adaptive-verify/36-01-SUMMARY.md` |

**v11.0 Invariants**: additive optional (no schema bump — Spec 1 data structures were additive optional); single SoT (`workflows.json` store, composite-keyed); KARPATHY-minimal; en + claude default byte-identical; full gate green vs the 1470 baseline (1446 + 10 Phase 34 + 10 Phase 35 + 4 Phase 36 cells); 3-OS CI green.

---

## Backlog / Deferred (future milestones)

- ~~Deferred non-goal (v7.0 discuss): cross-harness breadth~~ → **un-deferred 2026-06-23** (→ v9.0): demand changed (user direction 守宽做深 + cross-platform) AND feasibility changed (upstreams gstack/ECC verified already cross-harness). routing L2-LLM-supervisor simplification still deferred.
- Security hardening pass (threat-model-gated): shell-injection `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency hazards `sigintTrap.ts`/`before-commit.ts`.
