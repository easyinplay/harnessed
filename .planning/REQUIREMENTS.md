# REQUIREMENTS — harnessed

> Regenerated 2026-06-05 from `.planning/intel/requirements.md` reconciliation; forward-scope reconciled v6.0→v10.0 at 2026-06-24 milestone-open.
> Shipped families = delivered baseline (do NOT re-plan). Latest shipped = v10.0 i18n Surface (✅ npm v4.8.0).
> Current published version: **v4.8.0** (v10.0 i18n surface; prior 4.7.0 bundled v8.0+v9.0+ECC). Active milestone: **_(none)_** — v10.0 shipped + published 2026-06-25.

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
| REQ-v6.0-doc-discipline | v4.4.0 | ✅ Done (3/3) | 7th L0 `doc-discipline.yaml` + `before-commit` STATE line-halt/ROADMAP inline-warn (Phase 11) + `checkPlanningSync` evidence guard on checkpoint complete (Phase 12). 1188 tests. 详: `phases/11-…/` + `phases/12-…/`. |
| REQ-v7.0-gapclose-memory | v4.5.0→4.6.0 | ✅ Done | 7+4 phases (13–23) closing comet/Trellis comparison: doc-debloat, compact-real, multi-workflow, learning-loop, spec-injection, CodeGraph opt-in, minimal adoption + `update`/ship-stage/smart-reminders/Windows-install. 1335 tests. |
| REQ-v8.0-frictionless-entry | (4.7.0 bundle) | ✅ Done (2/2) | Phase 24 single-command resume entry (zero-arg `harnessed` + `NEXT` + `--json`) + Phase 25 value-prop/quickstart legibility. 1352 tests. Audit `milestones/v8.0-MILESTONE-AUDIT.md`. |
| REQ-v9.0-cross-harness | v4.7.0 | ✅ Done (3/3) | Phase 26 PlatformDescriptor seam + Phase 27 central config resolvers + settingsWriter fold + Phase 28 Codex second-platform proof. Capability-aware descriptor; claude default byte-identical. 1394 tests. Audit `milestones/v9.0-MILESTONE-AUDIT.md`. |
| REQ-v100-i18n-surface | v4.8.0 | ✅ Done (6/6) | Phases 29–33: locale-aware skill resolve + 2 CI structural-parity sync-guards + 26 SKILL.zh-Hans.md + CLI message 94/94 + user-facing yaml i18n (role-prompts/disciplines zh siblings) + en-default discipline-language bug fix. en byte-identical. 1446 tests. Audit `milestones/v10.0-MILESTONE-AUDIT.md`. |

---

## Active forward scope — v11.0 State Machine Completion

> Source: ROADMAP active milestone + scope SoT `milestones/v5.0-phases/STATE-MACHINE-CORE-DESIGN.md` §1 (Spec 1 shipped v4.2.0; Spec 2/3 the deferred tail). Strategy gate (office-hours + ceo-review) skipped — scope pre-defined in the v5.0 design, not a fresh direction (transparent).
> Additive optional (Spec 1's data structures were additive optional — no schema bump); single SoT (`current-workflow.json` / session file); KARPATHY-minimal. No architecture change beyond the locked v5.0 design.
> Full scope D+G+H (user-chosen 2026-06-25). Phase 35 (per-turn hook) feasibility → `/plan-eng-review` at its plan.

### REQ-v110-session-state — session-scoped ledger pointer (Phase 34, Spec 2/D)
- **Description**: key the workflow ledger pointer by session so concurrent CC sessions in the same repo hold independent active-task pointers (Trellis session-scoped-pointer analog; the v5.0 design's deferred D). **Refined at execution (sketch-then-refine, ADR-011)**: the v5.0 sketch (`sessions/<CLAUDE_SESSION_ID>.json` separate files) predated Phase 15, which already replaced the `current-workflow.json` singleton with `workflows.json` — a map keyed by `repoKey` (git-root). The locked mechanism overlays the session dimension on that store via a **composite key** `<repoKey>::<sessionId>` (no separate `sessions/` dir, no second SoT). Session id = `process.env.CLAUDE_CODE_SESSION_ID` (verified CC exposes it to Bash; note the actual var is `CLAUDE_CODE_SESSION_ID`, not `CLAUDE_SESSION_ID`). Single-session fallback: no session id → bare `repoKey` slot, byte-identical to today.
- **Acceptance**: with a session id, the ledger reads/writes the `<repoKey>::<sessionId>` slot; without one, the bare `repoKey` slot is used unchanged (existing tests green); read falls back session-key → bare repoKey → null so an in-flight single-session workflow stays visible after a session gets scoped; two concurrent sessions in one repo do not collide; `retro_meta` stays keyed by `repoKey` (retro cadence is a repo property, not session); additive (no schema bump — composite key is a legal `Record<string,…>` map-key); biome + tsc + vitest green vs the 1446 baseline.

### REQ-v110-perturn-inject — per-turn state injection hook (Phase 35, Spec 3/G)
- **Description**: render the ledger "you are here / next" state (+ relevant learnings / phase-context) into the prompt automatically each turn. **Refined at plan (research)**: the injection builder + hot-path bin (`buildInjection` / `bin/harnessed-inject-state.mjs`) ALREADY exist + are parity-tested — what was missing is (a) a hook that fires them per turn and (b) session-correctness after Phase 34. So the phase = wire the bin as an **opt-in UserPromptSubmit** hook (`manifests/optional/perturn-inject.yaml`, mirroring `dashboard-autospawn.yaml`) + make the bin read the active **session's** slot. Feasibility was self-resolved (ccHookAdd supports UserPromptSubmit; a SessionStart hook already ships) — no `/plan-eng-review` needed. **Cross-harness**: the session-id env is resolved through a NEW `PlatformDescriptor.sessionIdEnv` field (claude→`CLAUDE_CODE_SESSION_ID`, codex→`null`), NOT hardcoded — and Phase 34's `activeKey` is de-hardcoded onto the same seam.
- **Acceptance**: an opt-in UserPromptSubmit hook surfaces the current ledger position automatically (no explicit `status --recover` call); the injection reads `<repoKey>::<sessionId>` for the active session (bare `repoKey` fallback, legacy last) so concurrent sessions inject their own state; session env via descriptor `sessionIdEnv` (claude value, codex null → single-session bare); the hook is non-breaking when absent and a silent no-op in a non-workflow repo; bin stdout stays byte-equal to `buildInjection` (parity); additive (no schema bump); full serialized gate green vs the 1456 baseline.

### REQ-v110-adaptive-verify — scale-adaptive verify strength (Phase 36, Spec 3/H)
- **Description**: scale verify rigor to change size / risk — lighter verification for small surgical diffs, stricter (more evidence / checks) for large or risky changes. The v5.0 design's deferred H.
- **Acceptance**: verify strength is selected from a change-scale signal (e.g. diff size / declared risk); small-change path stays fast, large-change path enforces stricter evidence; deterministic + testable thresholds; unit tests; green gate.

### REQ-v110-validation — additive, backward-compatible, green
- **Description**: all additions additive optional (session file + per-turn hook + adaptive thresholds; no existing behavior mutated when the new signals are absent; claude + single-session default byte-identical); full quality gate green; 3-OS CI green.
- **Acceptance**: biome + tsc clean; full vitest green; no regression vs the 1446 baseline; CI green on 3 platforms.

---

## Backlog (deferred, future milestones)

- Security hardening pass (threat-model-gated): shell-injection `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency `sigintTrap.ts`/`before-commit.ts`.

---

## Traceability (v11.0 forward scope)

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-v110-session-state | Phase 34 | ✅ Done (local 2026-06-25) |
| REQ-v110-perturn-inject | Phase 35 | ⬜ Not started |
| REQ-v110-adaptive-verify | Phase 36 | ⬜ Not started |
| REQ-v110-validation | Phases 34–36 (final gate) | ⬜ Not started |

Coverage: 1/4 (v11.0 in progress 2026-06-25; Phase 34 green local). v10.0 (6/6) shipped npm 4.8.0. No orphans. Next: plan Phase 35 (per-turn injection hook, Spec 3/G).
