# REQUIREMENTS — harnessed

> Regenerated 2026-06-05 from `.planning/intel/requirements.md` reconciliation; forward-scope reconciled v6.0→v10.0 at 2026-06-24 milestone-open.
> Shipped families = delivered baseline (do NOT re-plan). Latest shipped = v9.0 Cross-Harness (✅ npm v4.7.0).
> Current published version: **v4.7.0** (bundles v8.0+v9.0+ECC). Active milestone: **v10.0 i18n Surface** (bilingual skill/workflow surface, phases 29–32).

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

---

## Active forward scope — v10.0 i18n Surface

> Source: ROADMAP big-bet ② + strategy gate `v10.0-i18n-surface-DESIGN.md` (office-hours full-scope user override + ceo-review release-before-v10.0 re-sequence, released as v4.7.0).
> Additive-only; reuses v9.0 platform-aware resolve layer (`detectPlatform`/resolvers) + the messages/{en,zh} file-level pattern. No architecture change.
> Decisions locked: **full bilingual scope** (28 SKILL.md + 48 surfacing yaml + 14 CLI keys); **Approach A parallel sibling files** (`SKILL.md` + `SKILL.zh-Hans.md`). 2 open design questions (sync-guard granularity; resolve-vs-bundle) deferred to per-phase plan.

### REQ-v100-resolve-layer — locale-aware skill/workflow file selection (Phase 29) ✅ Done 2026-06-24
- **Description**: extend the v9.0 resolve layer so the skill/workflow surface selects `SKILL.md` vs `SKILL.zh-Hans.md` by resolved locale (reuse the existing `HARNESSED_LANG`→POSIX→Intl→en chain + `mapToSupported` zh*→zh-Hans). OPEN-2 (resolve-vs-bundle: install both siblings alongside vs select-exclusively-by-locale at install time) resolves at this phase's plan (main-session brainstorm before executor spawn).
- **Acceptance**: resolver returns the zh-Hans sibling under a zh locale and the en file otherwise / when no sibling exists (en-default never breaks); claude default install byte-identical when locale=en; per-case unit tests; biome + tsc + vitest green vs the 1394-test baseline.

### REQ-v100-sync-guard — en↔zh-Hans CI pair-parity hard gate (Phase 30)
- **Description**: CI check enforcing that every `SKILL.md` has a non-drifting `SKILL.zh-Hans.md` sibling (and the surfacing yaml carry both locales) — turning the dual-maintenance tax into a checkable hard constraint, not silent drift. OPEN-1 (granularity: presence-only vs structural heading/section parity) resolves at this phase's plan.
- **Acceptance**: guard fails CI when a sibling is missing or drifts past the chosen granularity, passes when the pair is in parity; transparent failure message naming the offending file; runs in existing CI on all 3 OS; unit tests for fire/pass; green gate.

### REQ-v100-translation — skill/workflow surface bilingual content (Phase 31)
- **Description**: translate the 28 `SKILL.md` prompt bodies (~12,332 words) into `.zh-Hans.md` siblings + the user-facing `description`/prompt strings in the 48 surfacing yaml. Whole-file translation preserves prompt semantics (per Approach-A rationale). TDD only where mechanism (resolve wiring), not prose. Depends on Phase 29 (resolve) + Phase 30 (guard).
- **Acceptance**: all 28 siblings present + sync-guard green; resolve layer surfaces the zh-Hans body under a zh locale end-to-end; en bodies unchanged (byte-identical default); surfacing yaml carry both locales; green gate.

### REQ-v100-cli-gap — close the CLI message table gap (Phase 32)
- **Description**: translate the 14 untranslated keys so `messages/zh-Hans.json` reaches parity with `messages/en.json` (80→94). Independent of the skill-surface phases.
- **Acceptance**: `zh-Hans.json` key-set == `en.json` key-set (94/94); en-default byte-identical; existing i18n `t()` tests green + a parity assertion; green gate.

### REQ-v100-validation — additive, backward-compatible, green
- **Description**: all additions additive (new sibling files + new CI guard + new tests; no en-default behavior mutated; claude default byte-identical); full quality gate green; Windows CI green.
- **Acceptance**: biome + tsc clean; full vitest green; no regression vs the 1394-test baseline; CI green on 3 platforms.

---

## Backlog (deferred, future milestones)

- **v5.0 Spec 2** — D: session-scoped state (`sessions/<CLAUDE_SESSION_ID>.json`) + single-session fallback.
- **v5.0 Spec 3** — G: per-turn injection hook + H: scale-adaptive verify strength.
- Security hardening pass (threat-model-gated): shell-injection `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency `sigintTrap.ts`/`before-commit.ts`.

---

## Traceability (v10.0 forward scope)

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-v100-resolve-layer | Phase 29 | ✅ Done (1416 tests, en byte-identical) |
| REQ-v100-sync-guard | Phase 30 | ✅ Done (1423 tests, drift-only hard gate) |
| REQ-v100-translation | Phase 31 | ⬜ Not started |
| REQ-v100-cli-gap | Phase 32 | ⬜ Not started |
| REQ-v100-validation | Phases 29–32 (final gate) | ⬜ Not started |

Coverage: 2/5 (Phase 29 + 30 done 2026-06-24). v9.0 (3/3) shipped v4.7.0. No orphans.
