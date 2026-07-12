# MILESTONES — harnessed

> Shipped history index. Generated 2026-06-09 during `.planning/` GSD-layout migration.
> Per-milestone detail: `.planning/milestones/<version>-ROADMAP.md` + `-REQUIREMENTS.md` + `-MILESTONE-AUDIT.md`.
> Phase execution records: `.planning/milestones/<version>-phases/`.
> Full narrative: `CHANGELOG.md` (46 releases) + `.planning/RETROSPECTIVE.md`.
>
> Note: milestone codenames are NOT npm release versions. harnessed publishes by npm semver
> (latest published: 4.11.3); milestone names (v2.0, v3.0, v5.0, v5.1) are spec/era codenames.
> Shipped order below is chronological, not version-monotonic.

## Shipped

| Milestone | Shipped | Summary | Phase archive |
|-----------|---------|---------|---------------|
| v0.1.0 | 2026-05-12~14 | manifest 引擎 + research workflow. | `v0.1.0-phases/` |
| v0.2.0 | 2026-05-16 | sub-task loop + extension installers. | `v0.2.0-phases/` |
| v0.3.0 | 2026-05-17 | plan-feature + checkpoint engine; routing 30/30 100%. | `v0.3.0-phases/` |
| v0.4.0 | 2026-05-19 | dogfooding + 稳定期 (benchmark, audit log, community). | `v0.4.0-phases/` |
| v2.0 | 2026-05-20 | Architecture Refactor — pure bundled SoT + capabilities + judgments. | `v2.0-phases/` |
| v3.0 | 2026-05-21 | 4-Stage Namespace-Layered Workflow — master orchestrator + 22 sub-workflow + L0 disciplines. ADR-0030/0031/0032. | `v3.0-phases/` |
| v3.4.4–v3.8.0 spec era | 2026-05-22~24 | spec-driven series between v3.0 and v3.9.x (PHASE-SPECs + HANDOFF + v3.6.0 mattpocock integration + v3.7+ BACKLOG); merged from legacy `.planning/archive/` 2026-07-13. | `v3.4.4-phases/` `v3.5.0-phases/` `v3.6.0-phases/` `v3.7-plus-phases/` `v3.8.0-phases/` |
| v0.5.0 / v1.0 GA | 2026-05-22 | v1.0-RC2 hardening → production GA. | `v0.5.0-phases/` + `v1.0-GA-phases/` |
| v3.9.x | 2026-05-24~30 | maintenance series (v3.9.3→v3.9.26), dogfood bug fixes. | `v3.9.x-phases/` |
| v4.0.0 | 2026-05-30 | orchestration-brain redesign — gates/prompt/checkpoint CLIs, CC-native spawn. | `v4.0-phases/` |
| v4.1.0→v4.1.3 | 2026-05-30~06-04 | yaml SoT richness + code-review fixes + P0 data-loss fixes. 1107 tests. | (in `v4.0-phases/` / CHANGELOG) |
| v5.0 State Machine Core (Spec 1) | 2026-06-05 (npm 4.2.0) | structured progress ledger + fail-closed evidence guard + `status --recover` + handoff drift + verify backfill + generated ORCHESTRATOR body. ADR-0033. 1158 tests. Spec 2/3 deferred (Backlog). Working dir `.planning/milestones/v5.0-phases/`. | `.planning/milestones/v5.0-phases/` |
| v5.1 Upstream Re-sync | 2026-06-10 (npm 4.3.0) | GSD Core rename `@opengsd/gsd-core` 1.4.1 + gstack/mattpocock manifest bump + 18 new capabilities (12 GSD Core + 6 gstack) + stage-phase-gate triggers. Keystone: execute self-owned (gsd-execute-phase NOT wired). 1167 tests. | `v5.1-phases/` |
| v6.0 Doc-Discipline Substrate | 2026-06-11 (npm 4.4.0) | G1 = 7th L0 discipline `doc-discipline.yaml` + STATE-line halt; G2 = `checkPlanningSync` guard in checkpoint complete. 1188 tests. | `v6.0-phases/` |
| v7.0 Gap-Close & Memory Loop | 2026-06-14 (npm 4.5.0→4.6.0) | 7 phases (13–19) closing the 1st comet/Trellis comparison + follow-ons 20 (`update`) / 21 (ship-stage) / 22 (smart reminders) / 23 (Windows install fix). 1335 tests. | `v7.0-phases/` |
| v8.0 Frictionless Entry | 2026-06-23 | 2 phases: 24 single-command resume entry (zero-arg `harnessed` you-are-here + `NEXT` + `--json`, comet `/comet` analog) + 25 value-prop/quickstart legibility (结果导向定位主句 + First 5 Minutes quickstart). 1352 tests. Audit passed 2/2 (`milestones/v8.0-MILESTONE-AUDIT.md`). | `v8.0-phases/` |
| v9.0 Cross-Harness | 2026-06-24 | 3 phases: 26 PlatformDescriptor seam (A) + 27 central config resolvers + settingsWriter fold (B) + 28 Codex second-platform proof (C, pivoted from `.agents/` after anti-stale verification — `~/.agents/` is skills-only, not a full harness home). Capability-aware descriptor + claude-first `detectPlatform` + `setup --platform codex`; claude default byte-identical. 1394 tests. Audit passed 3/3 (`milestones/v9.0-MILESTONE-AUDIT.md`). | `v9.0-phases/` |
| v10.0 i18n Surface | 2026-06-25 (npm 4.8.0) | 5 phases: 29 locale-resolve-layer + 30 skill-i18n sync-guard + 31 SKILL.md translation (26 zh siblings) + 32 CLI message gap (zh 94/94) + 33 user-facing yaml i18n (locale loader + role-prompts/disciplines zh siblings + **fixed pre-existing en-default bug**; `language` excluded never-surfaced). Approach A parallel sibling files; 2 CI structural parity hard-gates. en byte-identical. 1446 tests. Audit passed 6/6 (`milestones/v10.0-MILESTONE-AUDIT.md`). Published npm `harnessed@4.8.0` (provenance) + GitHub release `v4.8.0`. | `v10.0-phases/` |
| v11.0 State Machine Completion | 2026-06-26 (built local, npm unpublished) | 3 phases (34–36) closing the v5.0 deferred Spec 2/3: 34 session-scoped state (composite key `<repoKey>::<sessionId>`) + 35 per-turn injection hook (opt-in UserPromptSubmit manifest + session-aware bin + **cross-harness session seam** `PlatformDescriptor.sessionIdEnv`, de-hardcoded Phase 34) + 36 scale-adaptive verify (`VERIFY-MODE` breadcrumb directive). Additive, no schema bump, claude/en byte-identical. 1470 tests. Audit passed 4/4 (`milestones/v11.0-MILESTONE-AUDIT.md`). **Release-pass decision pending** (npm 4.9.0?). | `v11.0-phases/` |
| v12.0 Forward Continuation | 2026-06-30 (npm 4.10.0) | 4 phases (37–40): cross-task/phase advance via `deriveNext` + `planningScan` (derive next from `.planning` disk SoT, **no queue**; phase done ⇔ PLAN has matching SUMMARY) + `harnessed next` cross-unit exit-codes + `harnessed advance` (print-only + gate, `--json` driver loop) + per-turn `NEXT-UNIT` pointer (ts↔bin parity). 5-repo fusion (gsd-pi/gsd-core/Trellis/comet/oh-my-pi). Bundled issue #2 fix (52 SKILL inline state-machine + `ship` orchestrator). Phase-level floor (OQ-2). 1673 tests. Audit passed 9/9+4/4 (`milestones/v12.0-MILESTONE-AUDIT.md`). Published npm `harnessed@4.10.0` (provenance) + GitHub release `v4.10.0`. | `v12.0-phases/` |
| v13.0 Upstream Re-sync | 2026-07-01 (npm 4.12.0) | 4 phases (41–44): gstack/gsd-core/superpowers pin bump (1.58.0.0/^1.6.0/v6.0.3, 继承上游硬化) + 5 selective wire (verification-before-completion · gsd-eval-review · /diagram · gsd-validate-phase · systematic-debugging)。capabilities 35→39, verify conditional sub 5→7。3-subagent delta 调研 + 2 spike; skip MemPalace/gbrain/ios。Published npm `harnessed@4.12.0` (provenance) + GitHub release `v4.12.0`, CI 3-OS green。详 ADR-0035。 | spec `specs/2026-06-30-upstream-resync-v13.md` |

| v14.0 Hardening & Distribution | 2026-07-04~12 (npm 4.13.0→4.28.0, 23 publishes) | Retroactive close of the post-v13.0 patch/phase arc, 3 sub-arcs: **A** setup 治理 + cross-harness(4.13–4.18:五根因修复→14/14 全绿 · codex 全对齐 · WSL/spawn/hook 环境免疫)· **B** /auto 合规 + 守卫 + issues #2-#5 + intel 五家借鉴(4.20.1–4.26:checkpoint intent/evidence guard · GateGuard env 豁免 · skill 完整性台账+自愈+备份 · deferrable relay 门 · gate fail-closed 分型 + skip-sub 别名 · 注入 delta · 串行次序守卫)· **C** B 路线 Phase 3(4.19/4.20 B1+B2 编译管线;4.27/4.28 update compiled 分支 + hook 自包含 + 一行安装器)。dogfood/issue 驱动非 phase-driven;CEO review 仅 Phase 3 Slice 1(完整 /plan-ceo-review)。vitest 1673→2121。 | `milestones/v14.0-phases/` (27 dirs) + `milestones/v14.0-MILESTONE-AUDIT.md` |
| v15.0 Upstream Re-sync | 2026-07-13 (npm 4.29.0) | 7-pin 侦察 → 双主菜(pwf v3.4.1 Windows session-catchup 修复 + mattpocock to-spec/to-tickets 改名对齐)+ 三顺手(superpowers 6.1.1 / gstack 1.60.1.0 / gsd-core lkg 1.6.1);gsd-core 1.7.0 GA watch 项。closed lightweight。 | `v15.0-phases/45-upstream-resync-v15/` |

## Active

| Milestone | Status | Notes |
|-----------|--------|-------|
| (none) | — | No active milestone. v14.0 Hardening & Distribution retroactively closed 2026-07-12 (npm 4.28.0); queue: TODOS.md (Slice 3 deferred P3 / E1 签名 user-gated / eval harness v5+). |
