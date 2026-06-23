# ROADMAP — harnessed

> Shipped history = indexed archive (do NOT re-plan). Active milestone = **v8.0 Frictionless Entry** (first of three competitive-gap milestones from the 2026-06-23 comet/Trellis re-comparison).
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

---

## Active milestone: v8.0 Frictionless Entry

**Goal**: Turn the 2026-06-23 three-way re-comparison into the first of three competitive-gap milestones. v8.0 = the low-risk "quick wins" tier — a single-command resume entry (comet `/comet` analog; the mechanism already exists, only the zero-arg entry + ergonomics are missing) and a legible value-prop + <5min quickstart (comet's instantly-graspable positioning). The two big bets — **cross-harness reach (→ v9.0)** and **i18n surface (→ v10.0)** — are deferred to their own milestones per the scope decision below.

**Discuss decisions** (2026-06-23, via 3-way re-comparison + AskUserQuestion):
- **Posture = 守宽做深 (B)** — keep the heterogeneous-upstream-arbitration moat (capabilities.yaml + priority.yaml + ADR de-confliction); do NOT narrow to a single pairing like comet's OpenSpec×Superpowers.
- **Fact correction (verified 2026-06-23)** — the earlier "守宽 conflicts with cross-platform" premise was WRONG. gstack and ECC are already cross-harness (ECC README: "Works across Codex, Claude Code, Cursor, OpenCode, Gemini, Zed, GitHub Copilot"; gstack deploys to `.agents/.cursor/.factory/.hermes/.kiro/.omc/.openclaw/`). 守宽 and cross-platform are **synergistic** — upstreams already solved upstream-side portability. Cross-platform work collapses to abstracting harnessed's OWN hardcoded `~/.claude/` (`setup.ts:120/194` + state + inject) onto the industry `.agents/` + per-platform convention with auto-detect. No generator needed; no CC-degrade.
- **State-machine + evidence-guard are NOT gaps** (verified 2026-06-23) — harnessed already has a two-tier state machine (envelope 3-state activate/pause/complete in `state.ts` + ledger 5-state; `currentWorkflow.v1.ts:1` "state machine schema"; `nextStep.ts` mirrors `comet-state next`) and a fail-closed evidence guard (`checkpoint complete` → `checkArtifacts` + `checkPlanningSync`, BLOCKED unless `--force`). Earlier compare drafts mis-attributed these to comet; corrected.
- **Remaining real comet/Trellis gaps** = (1) cross-harness reach [→ v9.0], (2) single-command resume ergonomics [v8.0], (3) i18n skill surface [→ v10.0], (4) adoption/legibility [v8.0].
- **Milestone split** — quick-wins first (this v8.0), then cross-harness (v9.0) + i18n (v10.0) each as a dedicated milestone.

**Competitive basis** (do NOT re-create — one-fact-one-home): `.planning/research/01-competitive-landscape.md` … `04-failure-modes.md` + `SUMMARY.md` + `docs/comparison.md`. 2026-06-23 increment: comet 1,562 ★ / Trellis 10,949 ★; ECC v2.0.0 "Agent Harness Operating System" cross-harness; gstack 10-agent auto-detect.

**Invariants**: 守宽 moat preserved; KARPATHY-minimal surgical diffs; full gate green vs the 1335-test baseline; Windows CI green; biome preempt before every TS/JS commit; NEVER push without approval; every `.planning/` edit self-exemplifies v6.0 doc-discipline.

### Phases (sketch — refine at execution per anti-stale; do NOT pre-detail downstream)

- [x] **Phase 24: single-command resume entry** ✅ 2026-06-23 — zero-arg `harnessed` you-are-here dashboard + `NEXT: auto|manual|done` contract + `--json` (comet `/comet` analog); pure aggregation of shipped pieces (`readCurrentWorkflow` + `buildRecoverLines` + `resolveNext`), read-only, explicit bare-dispatch (no misfire). 1352 tests. 详: `phases/24-resume-entry/24-01-SUMMARY.md`.
- [ ] **Phase 25: value-prop + quickstart legibility** — README one-line positioning + install→first-workflow <5min quickstart, matching comet's graspable narrative. Docs-only. Depends on: Phase 24 (quickstart demos the resume entry).

### Adoption (non-phase follow-on)

Stars / demo gif / DeepWiki are marketing, not code-deliverables — tracked as a milestone follow-on, NOT a phase. ~0 ★ today vs comet 1.5k / Trellis 10.9k.

---

## Backlog / Deferred (future milestones)

- **v9.0 Cross-Harness** (big bet ①, un-defers the ex-v7.0 non-goal) — platform adapter: abstract harnessed's hardcoded `~/.claude/` (setup/state/inject) → platform descriptor; auto-detect installed harness; align the industry `.agents/` + per-platform dirs. Upstreams (gstack/ECC/superpowers/codegraph) already portable, so no generator / no upstream-mapping work. Opens with `/plan-eng-review` (structural). Sketch only — refine when started.
- **v10.0 i18n Surface** (big bet ②) — extend i18n from the CLI message layer (en/zh-Hans, already shipped) to the skill/workflow surface bilingual (comet model: ship EN+中文 skills). Parallelizable with v9.0. Sketch only.
- ~~Deferred non-goal (v7.0 discuss): cross-harness breadth~~ → **un-deferred 2026-06-23** (→ v9.0): demand changed (user direction 守宽做深 + cross-platform) AND feasibility changed (upstreams gstack/ECC verified already cross-harness). routing L2-LLM-supervisor simplification still deferred.
- Security hardening pass (threat-model-gated): shell-injection `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency hazards `sigintTrap.ts`/`before-commit.ts`.
