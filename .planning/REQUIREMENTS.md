# REQUIREMENTS — harnessed

> Regenerated 2026-06-05 from `.planning/intel/requirements.md` reconciliation.
> Shipped families = delivered baseline (do NOT re-plan). Active forward scope = v5.1 Upstream Re-sync.
> Current published version: **v4.2.0**. Active milestone: **v5.1 Upstream Re-sync**.

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

---

## Active forward scope — v5.1 Upstream Re-sync

> Source: GSD Core 1.4.1 rename (`open-gsd/gsd-core`) + gstack v1.52.1.0 drift.
> Additive-only; execute mechanism unchanged (`gsd-execute-phase` NOT wired, per keystone decision — harnessed keeps self-owned CC-native spawn + ralph-loop + v4.2 checkpoint ledger).
> Preamble already delivered: GSD Core manifest rename (commit 0ab8c52) + `.planning/` GSD-layout migration (f61e443).

### REQ-v51-gsd-rewire — wire GSD Core phase + lifecycle skills into capabilities
- **Description**: add ~12 new GSD Core capability entries to `workflows/capabilities.yaml` — stage-gap phase skills (`gsd-spec-phase` / `gsd-ui-phase` / `gsd-secure-phase` / `gsd-ai-integration-phase`) + bootstrap (`gsd-ingest-docs` / `gsd-new-project` / `gsd-new-milestone`) + milestone lifecycle (`gsd-extract-learnings` / `gsd-audit-milestone` / `gsd-complete-milestone` / `gsd-milestone-summary`) + `gsd-docs-update`.
- **Acceptance**: each entry follows existing `impl:gsd / skill_dir / cmd / fires_when` pattern; every `skill_dir` verified to exist on disk (GSD Core 1.4.1); `gsd-execute-phase` NOT wired (self-owned execute); capability-resolver + schema tests pass.

### REQ-v51-gsd-judgments — stage-gate triggers for new phase skills
- **Description**: stage-phase capabilities (spec/ui/secure/ai-integration) referenced from `workflows/judgments/*.yaml` triggers where stage-gated, consistent with existing `gsd-plan-phase` / `gsd-discuss-phase` routing.
- **Acceptance**: trigger refs resolve to real capability names; `check-workflow-schema` passes; no orphan capability or dangling trigger.

### REQ-v51-gstack-bump — gstack + mattpocock manifest version sync
- **Description**: `gstack.yaml` git_ref `74895062` → current main HEAD (`1626d485…`) + last_known_good `main-269-commits` → `1.52.1.0` + last_check; `mattpocock-skills.yaml` last_check + last_known_good bump (`skills@1.5.10` installer).
- **Acceptance**: manifest-validate passes; gstack repo unchanged (version drift only, no repo rename); known-good lock consistent; fixture sync.

### REQ-v51-gstack-skills — 6 new non-iOS gstack capabilities
- **Description**: wire `spec` / `skillify` / `pair-agent` / `scrape` / `benchmark-models` / `landing-report` into `capabilities.yaml` (skip iOS suite per scope decision).
- **Acceptance**: 6 entries follow `skill_dir: gstack` pattern; each subdir verified on disk (`~/.claude/skills/gstack/<name>/`); capability-resolver passes.

### REQ-v51-validation — additive, backward-compatible, green
- **Description**: all additions additive (no existing entry mutated except gstack/mattpocock version fields); full quality gate green.
- **Acceptance**: manifest-validate + capability-resolver + check-workflow-schema pass; biome + tsc clean; full vitest green; no regression in the 1158-test baseline.

---

## Backlog (deferred, future milestones)

- **v5.0 Spec 2** — D: session-scoped state (`sessions/<CLAUDE_SESSION_ID>.json`) + single-session fallback.
- **v5.0 Spec 3** — G: per-turn injection hook + H: scale-adaptive verify strength.
- Security hardening pass (threat-model-gated): shell-injection `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency `sigintTrap.ts`/`before-commit.ts`.

---

## Traceability (v5.1 forward scope)

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-v51-gsd-rewire | (roadmap pending) | Pending |
| REQ-v51-gsd-judgments | (roadmap pending) | Pending |
| REQ-v51-gstack-bump | (roadmap pending) | Pending |
| REQ-v51-gstack-skills | (roadmap pending) | Pending |
| REQ-v51-validation | (roadmap pending) | Pending |

Coverage: filled by roadmapper (gsd-plan-phase) · 5 requirements.
