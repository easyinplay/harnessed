# Phase 3.4 — 30 真实历史任务样本 (Routing Accuracy v0.3 dogfood — haiku/sonnet/opus 三段)

> **Status**: frozen at phase 3.4 plan-phase Wave 0 / **execute-phase 不允许改样本** (sister Phase 2.3 R3 frozen 模式延袭)
> **Trigger**: Phase 3.4 KICKOFF § 4 D-02 RUN ENGINE — 30 sample × routing.arbitrate → ≥85% (≥26/30) hit rate
> **Test consumer**: `tests/routing/phase-3.4-routing-hit-rate.test.ts` (Plan 02 W1 T1.6 — markdown table parser 1:1 对应 § 2)
> **Source**: REAL HISTORICAL — mining `git log --since=2026-05-12 --until=2026-05-18 --no-merges --pretty=format:"%h %s"` (302 commits verified) + `.planning/phase-{1.1..3.3}/task_plan.md` × 10+ + `.planning/intel/*.md` × 2 (D-01 LOCKED, dogfood real not synthetic)

## § 1 Selection Rationale (sister Phase 2.3 § 1)

### 1.1 来源约束 (REAL HISTORICAL, 不复用 phase 1.4 / 2.2 / 2.3 任一 sample)

mining 路径 + 3 约束 — sister Phase 2.3 § 1.1 改写 per D-01:
- 约束 1: 每 row source_commit field MANDATORY 非 empty (D-01 sneak block per PATTERNS § 3 D-01); per-row 7-10 hex git short-sha
- 约束 2: distribution 10 Haiku trivial + 10 Sonnet medium + 10 Opus complex (D-01 + ROADMAP R7 ≥ 8 per tier MIN)
- 约束 3: NOT 复用 phase 1.4 / 2.2 / 2.3 SAMPLES.md 任一 sample (REAL HISTORICAL means fresh mining, sister precedent samples excluded as synthetic)

### 1.2 分布 (10 Haiku trivial + 10 Sonnet medium + 10 Opus complex — D-01 + frozen)

- **10 Haiku trivial** (single-line edits, mechanical fixes): chore() dir scaffold + docs() typo/sync/decision-record + lint --fix biome warnings + simple ADR pointer doc + dogfood verify log
- **10 Sonnet medium** (single-file scope, 1-3 file edit): fix() bug fix single root-cause + test() NEW fixture file + plan-phase ship doc cluster (advance plan-checker iter)
- **10 Opus complex** (multi-file architecture, cross-phase wire): feat(phase-X.Y-wN) multi-task batch T1.1-T1.5 / T1.6-T1.9 / T1.10+T1.11 + cross-phase architectural extract (engineHook PRIMARY) + ADR 9 章节 finalize

### 1.3 Anti-cherry-pick declaration (sister Phase 2.3 § 1.3 anchor / false-pos / CD-3 透明声明 pattern)

- per-row source_commit field non-empty (D-01 sneak block守门)
- manually-traced expected_decision against `routing/decision_rules.yaml` v2 12 rules priority hit (priority 100/80/70/60/50) + 5 engineering sub-rules (engineering-discuss-feature / engineering-plan-architecture / engineering-execute-tdd / engineering-execute-debug / engineering-verify-pr) + mattpocock_phases 23 招式 routing schema (4 phase × 21 unique skills)
- per-tier breakdown defends mean (single tier < 60% cherry-pick warn per Plan 02 W1 harness; sister Phase 2.3 § 1.3 CD-3 disqualify edges 模式延袭)
- ≥ 8 sample per tier hard min (R7 dogfooding scope ROADMAP L149 verbatim — Sonnet 100% / Haiku ≥ 84% bar requires ≥ 8 per tier for statistically meaningful)

## § 2 Sample Truth Table (30 sample — REAL HISTORICAL)

| #  | task_id | model_expected | task_type | description (≤120 chars)                                                | source_commit | expected_decision (yaml inline)                              |
|----|---------|----------------|-----------|------------------------------------------------------------------------|---------------|--------------------------------------------------------------|
| 01 | T01     | haiku          | chore     | tests/manifest + tests/manifest/schema dirs setup (sister Phase 3.2 W0 T0.4 pattern) | `43ce181`     | `{router: B, reason: 'single-file dir scaffold chore'}`      |
| 02 | T02     | haiku          | chore     | tests/workflow/schema dir scaffold + vitest glob verify (Phase 3.2 W0 T0.4)         | `aafab30`     | `{router: B, reason: 'single-file dir scaffold chore'}`      |
| 03 | T03     | haiku          | chore     | flip transparency gate ENFORCE=true (Phase 2.1 T1.7 W3 lock 解除, 1-line)            | `b96133e`     | `{router: B, reason: 'trivial single-flag flip'}`            |
| 04 | T04     | haiku          | docs      | DOGFOOD-T2.8.md Phase 3.3 dogfood log PASS 4/4 miss: none (single-doc append)        | `9ec6e9a`     | `{router: B, reason: 'single-file dogfood log append'}`      |
| 05 | T05     | haiku          | docs      | Phase 3.2 dogfood DOGFOOD-T3.5.md PASS 5/5 miss: none (single-doc append)            | `2cfbc24`     | `{router: B, reason: 'single-file dogfood log append'}`      |
| 06 | T06     | haiku          | docs      | ADR 0014 9 章节 errata accepted pointer doc (status flip Draft→Accepted, 173L)        | `524eeb2`     | `{router: B, reason: 'single-file ADR pointer doc'}`         |
| 07 | T07     | haiku          | docs      | W0.3 schemaVersion 12+13 surface decision record (aliases.v1 + known-good.v1)        | `4804e60`     | `{router: B, reason: 'single-file decision record doc'}`     |
| 08 | T08     | haiku          | docs      | W0.3 schemaVersion 9th+10th surface decision (config.v1+governance.v1)               | `15b1321`     | `{router: B, reason: 'single-file decision record doc'}`     |
| 09 | T09     | haiku          | docs      | deferred-items #2 dashboard-sse pre-existing flaky log (port-bound env-dep, NOT W1)  | `0a8841f`     | `{router: B, reason: 'single-file deferred items log'}`      |
| 10 | T10     | haiku          | chore     | EE-4 baseline spike outcome — RELAX intel defaults to 0.80/0.80/0.80/0 (1-line yaml)  | `c8e4147`     | `{router: B, reason: 'single-file yaml threshold tune'}`     |
| 11 | T11     | sonnet         | fix       | install.ts harnessedVer from package.json Path A ES2022 import attributes (1-line)    | `bdce440`     | `{router: B, reason: 'single-file bug fix surgical 1-line'}` |
| 12 | T12     | sonnet         | fix       | STATE dual-SSOT 5-recurrence terminus COLLAPSE D-04 (b) LOCKED                       | `077d679`     | `{router: B, reason: 'single-file root-cause collapse fix'}` |
| 13 | T13     | sonnet         | fix       | dashboard-sse 4 cell flaky 根治 (random ephemeral port + DASHBOARD_PORT env)          | `a590cb0`     | `{router: B, reason: 'single-file flaky test root-cause fix'}` |
| 14 | T14     | sonnet         | fix       | planFeature.v1 11th schemaVersion surface register backfill (sister Phase 3.2 latent) | `8aaa90f`     | `{router: B, reason: 'single-file schema register backfill'}` |
| 15 | T15     | sonnet         | fix       | governance.v1 vetoed_at format → pattern regex (TypeBox FormatRegistry unregistered)  | `c37ee29`     | `{router: B, reason: 'single-file schema format fix'}`       |
| 16 | T16     | sonnet         | fix       | cli-audit env-dep mock runtime helpers (解 CI red since fcec6bf, path A LOCKED)        | `b41a84a`     | `{router: B, reason: 'single-file mock env-dep fix'}`        |
| 17 | T17     | sonnet         | test      | plan-feature prefix e2e matrix NEW (R7.4 acceptance 3-prefix守门)                     | `5428a42`     | `{router: B, reason: 'single-file e2e test NEW fixture'}`    |
| 18 | T18     | sonnet         | test      | probe-gstack.test.ts NEW 5 fixture (D-01 PROBE 4 outcome + Win shell flavor)         | `4e40afb`     | `{router: B, reason: 'single-file unit test NEW fixture'}`   |
| 19 | T19     | sonnet         | test      | Phase 3.1 dogfood DOGFOOD-T5.5.md PASS 3/3 miss: none (single test verify)            | `fcec6bf`     | `{router: B, reason: 'single-file dogfood test verify'}`     |
| 20 | T20     | sonnet         | test      | sigint/compact/resume tests (18 fixtures all pass, single-file W4 batch)             | `4e9c4ef`     | `{router: B, reason: 'single-file test batch 18-fixture'}`   |
| 21 | T21     | opus           | feat      | schemaVersion 12+13 surface + 2 schemas + 2 loaders NEW (Phase 3.3 T1.1-T1.5)        | `84545e8`     | `{router: A, reason: 'multi-file architectural batch T1.1-T1.5 5-task'}` |
| 22 | T22     | opus           | feat      | check-deprecations PRIMARY helper + doctor 7th + install resolveAlias + --known-good  | `a6e16c9`     | `{router: A, reason: 'multi-file architectural batch T1.6-T1.9 4-task D-01+D-02+D-03'}` |
| 23 | T23     | opus           | feat      | aliases.yaml + 0.3.0-known-good.yaml MVP empty seeds (D-01 + D-03 schema 12+13)      | `6fc2d84`     | `{router: A, reason: 'multi-file architectural batch T1.10+T1.11 schema NEW'}` |
| 24 | T24     | opus           | feat      | config.v1 + governance.v1 TypeBox schemas NEW (9th + 10th surface, Phase 3.2 T1.2+T1.3) | `002cc4b`     | `{router: A, reason: 'multi-file architectural batch T1.2+T1.3 schema NEW'}` |
| 25 | T25     | opus           | feat      | engineHook.ts PRIMARY + engine.ts wedge (D-04 WIRE-IN + W-01 PRIMARY extract pattern) | `5c1f024`     | `{router: A, reason: 'multi-file architectural PRIMARY extract cross-phase'}` |
| 26 | T26     | opus           | feat      | checkpoint schema/state/engineHook tests + 2 Rule-1 fixes (13 active + 3 todo)        | `7254f75`     | `{router: A, reason: 'multi-file architectural test batch W1 + Rule-1 inline fixes'}` |
| 27 | T27     | opus           | docs      | ADR 0013 FINALIZE Draft→Accepted + 9 章节 detailed fill (185L ≤250 Karpathy)          | `5debde2`     | `{router: A, reason: 'multi-section ADR 9 章节 architectural authoring'}` |
| 28 | T28     | opus           | docs      | Phase 3.4 W0 STRATEGIC task lock + H1+H2 inline absorb (6th STATE 类反模式 root-cause) | `ae53b0e`     | `{router: A, reason: 'multi-phase cross-cutting institutionalize architectural framing'}` |
| 29 | T29     | opus           | docs      | Phase 3.4 plan-phase ship — Wave A + B + C iter-2 PASSED (v0.3.0 close phase ready)   | `e6dbf6d`     | `{router: A, reason: 'multi-wave plan-phase ship cross-cutting'}` |
| 30 | T30     | opus           | fix       | README counter gate CI failure — L44 加 "完成" literal + ci.yml regex 兼容 post-close  | `b6a0feb`     | `{router: A, reason: 'multi-file CI + docs counter integrity sister-hotfix'}` |

## § 3 Frozen Marker (sister Phase 2.3 § 1.4)

- SAMPLES.md plan-phase Wave 0 锁定, execute-phase **不允许改样本** (R3 lock; Plan 02 W1 routing harness consumes frozen SAMPLES.md as input)
- per-tier breakdown (Plan 02 W1 T1.6 输出) 防止单 model 拉高 mean
- per-tier acceptance bar (R7 dogfooding scope ROADMAP L149 verbatim):
  - Sonnet ≥ 8 sample 内部命中率 ≥ 100% (perfection expected)
  - Haiku ≥ 8 sample 内部命中率 ≥ 84% (ROADMAP explicit lower bound)
  - Opus ≥ 8 sample 内部命中率 ≥ 80% (derived middle bar per RESEARCH § 4.4 A4 ASSUMED LOW risk)
- Total ≥ 26/30 hit (≥ 85% sister Phase 2.3 D-05 同阈值; ADR 0017 errata 触发 才可改样本)
