# REQUIREMENTS — harnessed

> Regenerated 2026-06-05 from `.planning/intel/requirements.md` reconciliation; forward-scope reconciled v6.0→v10.0 at 2026-06-24 milestone-open.
> Shipped families = delivered baseline (do NOT re-plan). Historical v10.0 i18n Surface shipped as npm v4.8.0; latest shipped npm is 5.0.4.
> Current publication status: `.planning/STATE.md` and `.planning/releases/`. Public npm **5.0.4 Maintenance Release** is published and verified complete; Phase 74 is complete. The older requirement families below remain historical records.

## Candidate npm-5.0.5 Requirements

| ID | Requirement | Acceptance Home | Status |
| --- | --- | --- | --- |
| PATCH-505-01 | Structured exact-ID readiness: validate `claude plugin list --json` as a top-level array; require the exact marketplace-qualified ID, settings enablement `true`, CLI entry `enabled: true` and a non-empty `installPath`; preserve subsequent runtime/lease checks | Phase 75 task plan and findings | Implementation/validation complete; candidate ready, not published |
| PATCH-505-02 | Claude marketplace presence detection is authoritative with no shell fallback; skip generic manifest verification without weakening provenance refusal or the read-only retained-version probe | Phase 75 findings and focused regression evidence | Implementation/validation complete; candidate ready, not published |
| PATCH-505-03 | Fail-closed negative matrix: CLI nonzero, malformed/non-array/null output, missing entries, similar IDs, wrong marketplaces, disabled, unreadable and runtime-unhealthy plugins remain fatal | Phase 75 findings and focused regression evidence | Validation complete; two final review tracks found no blocking issues |
| PATCH-505-04 | Record release metadata, validation, review and pushed-main candidate while keeping CI pending observation and tag/publish unauthorized; no claim of completed CI, tag, npm or release, no release receipt/SUMMARY | Phase 75 task plan and progress | Task 5 complete (commit `33965c97e2c4a51892008d22fc351e583627c09b` pushed to `origin/main`); Task 6 pending |

Plan: [Phase 75](phases/75-5.0.5-plugin-retention-probe/task_plan.md). Supplied final validation: focused 7 files/204 tests; full Vitest 375 files/4561 passed/11 skipped/1 todo; build, typecheck, docs 30, schema, lint (exit 0, 16 existing warnings), diff-check and npm pack dry-run passed. Non-blocking info: if future Claude CLI output contains conflicting duplicate qualified IDs, any healthy exact match currently passes; not observed in the real CLI and outside this scope. Latest shipped public npm remains **5.0.4**.

## Shipped npm 5.0.4 Release

| ID | Requirement | Acceptance Home | Status |
| --- | --- | --- | --- |
| PATCH-504-01 | For explicit `--system --non-interactive --update-installed`, classify structured `update-unsupported` as `kept-existing` only after read-only active-host presence and runtime-health probes pass; fresh, shared-only, unhealthy and other failures remain fatal | Phase 74 findings/summary and 5.0.4 release receipt | Complete; focused handoff 161/161 and candidate full suite passed; published |
| PATCH-504-02 | Materialize Claude Code npx shared-only skills into the active native root and honor `CLAUDE_CONFIG_DIR`; preserve provenance, dry-run no-write behavior, Codex roots and multi-pack indicators | Phase 74 findings/summary and 5.0.4 release receipt | Complete; regression evidence retained without weakening safety boundaries; published |
| PATCH-504-03 | Record candidate validation, pre-publication release-preflight, exact commit/CI/annotated tag/publish identity, real npm/CLI acceptance and three-platform signed artifacts; synchronize completed release state without inventing website or cleanup evidence | Phase 74 task plan, summary and 5.0.4 release receipt | Published and verified complete; preflight 4/4 passed with result `release-ready`; npm version/latest 5.0.4, real npm/CLI, stable release 9 assets and three-platform SHA256/Ed25519 passed |

Plan: [Phase 74](phases/74-5.0.4-maintenance-release/task_plan.md). Summary: [Phase 74 complete](phases/74-5.0.4-maintenance-release/SUMMARY.md). Receipt: [5.0.4](releases/5.0.4.md). Pre-publication `node dist/cli.mjs release-preflight` passed 4/4, result `release-ready`. Commit `c9a3dc3aba151901e4854b38b25ea8e3344b0e43`; CI `40810930373` 9/9; annotated `v5.0.4`; publish `40811493097` 4/4. Candidate full Vitest: 374 files, 4546 passed, 11 skipped, 1 todo; build/typecheck/lint/diff-check passed with 16 existing lint warnings. Initial parallel test/build contention caused 3 fixture failures; serial reruns passed. Website browser verification was not run; the acceptance root remains retained, not cleaned. Exact tag object, npm integrity/shasum, binary hashes/sizes and retained path are in the receipt. Closeout docs will be committed and pushed separately, without recreating the tag, repeating publication or rerunning runtime acceptance.

## Shipped npm 5.0.2 Release

| ID | Requirement | Acceptance Home | Status |
| --- | --- | --- | --- |
| PATCH-502-01 | Limit the patch to same-root resource-only `webapp-testing` verification without Python, Windows-compatible read-only/notifier-free `playwright-cli` exact `0.1.22` and Chromium metadata verification without browser/daemon startup, and structured force-update failure classification | Phase 73 plan and 5.0.2 release receipt | Complete; published and verified with carried-forward Phase 22/23 implementation evidence |
| PATCH-502-02 | Preserve fresh-install `update-unsupported` fatality, generic failure probe behavior and provenance checks; no runtime-mode, host, schema, state or security-policy change | Phase 23 RED/GREEN and combined regression evidence | Complete; evidence verified, no boundary expansion |
| PATCH-502-03 | Record version, English changelog, completed release plan, publication and public acceptance receipt | Phase 73 summary and 5.0.2 release receipt | Published and verified complete; npm version/latest 5.0.2, actual npm/CLI and three-platform signed artifacts passed |

Plan: [Phase 73](phases/73-5.0.2-maintenance-release/PLAN.md). Summary: [Phase 73 complete](phases/73-5.0.2-maintenance-release/SUMMARY.md). Receipt: [5.0.2](releases/5.0.2.md). Published commit `b5f7bee5d47ea50b20e03ae07d3f6407e592c49d`, CI `40736906479` 9/9, tag `v5.0.2` pushed once, publish `40737857022` 4/4; stable GitHub release has 9 assets. Website browser verification was not run; TEMP cleanup was denied by policy and the retained path is recorded in the receipt. This Markdown-only closeout records supplied evidence and runs only content/line-count/diff checks; it does not rerun publication or acceptance.

## Shipped npm 5.0.0 Requirements

| ID | Requirement | Acceptance Home | Status |
| --- | --- | --- | --- |
| RT-01 | Standalone harnessed needs no external Bun/Node; npm keeps supported Node without Bun | Phase 70 channel smoke and product verification | Core/owned hooks verified in three-platform CI |
| RT-02 | Measure and reduce short-lived startup cost without changing host/state/security semantics | Phase 70 before/after benchmark and lazy-import regression | Local measurements and regression verified |
| RT-03 | Explicit optional Bun invocation and owned lifecycle are verified, not inferred from package installation | Phase 70 Bun route acceptance | Core/CC live and Codex contract coverage; native activation not certified |
| WEB-01 | Replace old 60-second quickstart with one tabbed install / first workflow / progress-recovery flow | Site source, build and real browser evidence | Deployed and live verified; Hero installation and post-WhyCards workflow module |
| WEB-02 | Share latest stable GitHub version metadata with timeout/cache/fallback and no client secrets | Site metadata and browser tests | Deployed; live browser/API verified; website receipt records exact source/check |
| REL-01 | Release 5.0.0 only after regression/CI/evidence, with English records and verified published artifacts | Phase 70 release review and release log | Published and downloaded npm/three-platform signed assets verified; explicit per-release governance substitution recorded |

Plan: [Phase 70](phases/70-runtime-onboarding/PLAN.md). Scope: [approved brief](research/npm-5.0-runtime-onboarding-brief.md). Native governance limitations must remain explicit.

## Active 5.x Maintenance

| ID | Requirement | Acceptance Home | Status |
| --- | --- | --- | --- |
| MAINT-01 | Current Bun5.x guidance describes owned hook/runtime independence and explicit update manager, without obsolete homepage4.x warnings | Phase71 and site onboarding contracts | Site101tests and local/real production4/4 verified; Cloudflare status separately pending |
| MAINT-02 | README remains the concise installation source for people and AI; remove marked maintenance/override clutter and the redundant AI guide across all locales | Phase71 README receipt and installation documentation contracts | Complete locally; docs30/30 and live-link checks pass |
| MAINT-03 | Package update dry-run never invokes installation for default/explicit npm or explicit Bun, including current/ahead with upstreams/all | Phase71 dry-run receipt and updater tests | Local RED/GREEN and4468fullsuite pass; shipped in npm5.0.1 |

These are corrective continuations, not approval for a new method/host architecture. The completed, explicitly authorized 5.0.2 publication is recorded in the shipped release requirements above.

## Shipped npm 5.0.1 Release

| ID | Requirement | Acceptance Home | Status |
| --- | --- | --- | --- |
| PATCH-01 | Cut and publish only the verified Phase71 corrections as a patch release | Phase72 plan and release receipt | Published and downloaded npm/three-platform assets verified |
| PATCH-02 | Preserve the 5.0 runtime/channel contracts and native/upstream limitations | Phase71 verification carried into release review | No contract change; native gstack remains blocked |

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
- **Description**: scale verify rigor to change size / risk — lighter verification for small surgical diffs, stricter for large/risky changes. The v5.0 design's deferred H. **Refined at plan (research)**: the scale DECISION (`assessScale` in `scale.ts`: >5 files / >4 fired subs / >3 reqs ⇒ `full`, else `light`) and its STORAGE (`checkpoint complete` writes `verify_mode` onto the envelope; schema field exists) already ship — the only gap is that `verify_mode` is never rendered to the agent. So the phase = surface it as a `VERIFY-MODE: <mode> — <directive>` advisory line in the per-turn `<workflow-state>` breadcrumb (mirroring SHIP-READY/RETRO-DUE, riding Phase 35's hook), in both `buildWorkflowStateBlock` and the bin (parity).
- **Acceptance**: when `verify_mode` is set on the active workflow, the per-turn breadcrumb surfaces a scale-appropriate directive (`full` → run full verification; `light` → scope to the changed surface); absent → no line (byte-identical to today); bin stdout stays byte-equal to `buildInjection` (parity); no change to `assessScale` thresholds / `collectScaleMetrics` / schema; full serialized gate green vs the 1466 baseline.

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
| REQ-v110-perturn-inject | Phase 35 | ✅ Done (local 2026-06-25) |
| REQ-v110-adaptive-verify | Phase 36 | ✅ Done (local 2026-06-26) |
| REQ-v110-validation | Phases 34–36 (final gate) | ✅ Done (vitest serialized 1470/0; 3-OS CI pending push) |

Coverage: 4/4 (v11.0 all phases green local 2026-06-26). v10.0 (6/6) shipped npm 4.8.0. No orphans. Next: v11.0 milestone-close (LIGHTWEIGHT) + release decision.

---

## Phase 69: Host Installation Contract

This section is additive to the historical milestone requirements above. Approved scope is in phases/69-host-installation-contract/CONTEXT.md; exact contract/coverage are in DESIGN.md and VALIDATION.md. Fresh local evidence and explicit native/cleanup limits are in VERIFICATION.md and EXECUTION.md there.

| ID | Requirement | Planned Slice | Status |
| --- | --- | --- | --- |
| HIC-01 | Pure, immutable host/component resolution for Claude Code and Codex; preserve implicit host precedence and state roots, reject invalid explicit targets without side effects. | Tasks 1-2 | Verified locally |
| HIC-02 | Install, setup grouping/serialization, existing-install probes, update, doctor and per-manifest uninstall consume the same effective host contract instead of independently interpreting overrides. | Tasks 2-4 | Verified locally |
| HIC-03 | Explicit safe host teardown; optional Codex uninstall override is security-screened and consumed. Unsupported or ambiguous inverse operations cause zero wrong-host mutation. | Task 3 | Verified locally; unsupported remains explicit |
| HIC-04 | Native CLI/RPC, confirmation, L4, hook trust, serialization, verify environment isolation and component/OS runtime checks remain separate and enforced. | Tasks 2-4 | Fixture verified; live limits recorded |
| HIC-05 | Installation-source evidence is not ownership or consent. Existing observed receipts and current templates do not authorize destructive takeover of unknown/user-managed resources. | Tasks 3-4 | Verified locally |
| HIC-06 | Production and tests share enumeration of harnessed-owned rendered artifacts; declaration-to-write and write-to-declaration agree without replacing existing hash/backup policy. | Task 5 | Verified locally; byte goldens unchanged |
| HIC-07 | Compatibility, npm/compiled packaging and host-native evidence are independently validated. Unsupported components and upstream/auth/trust blockers remain explicit; no automatic release or live cleanup. | Task 6 | Local channels verified; native deferred |

Local closure is based on the fresh 4327-test serialized suite, production eval 14/14 and independent channel acceptance, not planning documents. Native activation/auth/browser and other-OS live acceptance remain separately deferred. The no-name unified uninstaller was not redesigned; workspace cleanup is incomplete after explicit tool-policy denials.
