---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: v3.0 4-Stage Namespace-Layered Workflow Architecture (master orchestrator + 20 workflow + cross-cutting tools 分离)
status: in_progress
last_updated: "2026-05-21T00:00:00.000Z"
progress:
  total_phases: 33
  completed_phases: 28
  total_plans: 28
  completed_plans: 28
---

# harnessed STATE

> 项目记忆 · 跨 session 一致性的 SSOT
> Phase 3.3 W0 T0.1 (D-04 (b) COLLAPSE locked, 5-recurrence terminus): L4 `> Status:` frontmatter + L5 `> 最后更新：` lines deleted — "当前位置" block (L21-27) is now the single SoT for phase ship event log. Freshness gate `scripts/check-transparency-verdicts.mjs` extends with STATE_POSITION_RE OR-fallback (full-file scan) so STATE.md acceptance check still passes.
> Phase 3.4 W0.1 STRATEGIC (D1 single-SoT institutionalize, 2026-05-17): STATE.md 723L → ≤200L round 1 — prev-prev-phase narrative (L96-329 已完成 milestone + L518-683 Phase 1.5/2.0/2.3/2.4 Prereq Notes ~400L) archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 1.X-3.2. D3 gate `scripts/check-state-archive-stale.mjs` warn-only round 1 (3 rules: size ≤200 / 关键决议 ship 总结 ≤1 / W-N errata literal 禁). D2 ship-time T6.N cadence integrated (Plan 03 W2 T2.2 trim prev-prev-phase narrative as standing process).
> Phase 3.4 W2 T2.2 (D2 ship-time T6.N first-implementation, 2026-05-17): Phase 3.1 + 3.2 narrative (prev-prev-phase) trimmed from STATE → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.1+3.2 (1st cadence implementation per D2 standing process). STATE.md keeps Phase 3.3 + 3.4 SHIPPED narrative only.
> Phase 4.3 W0.1 (D2 cadence iter 4 REINFORCE, 2026-05-19): Phase 4.2 narrative trimmed STATE → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2 (4th-iter beyond ≥3-iter terminus stable signal sister Phase 4.2 W0.1 3rd-iter; sister 5-recurrence terminus heuristic confirmed pattern stable).

---

## 项目核心引用

- **核心价值**：AI coding harness 生态的「装配主义包管理器 + 完整三层栈方法论的可执行 engine」——routing engine v1 已实装（main-process-driven query→arbitrate→install missing→factory→spawn→ralph-loop→verbatim COMPLETE 闭合）；6+ 虚拟角色（gstack 决策层 + GSD 项目经理 + superpowers 资深工程师）/ 双职责治理 / 4 心法 / 23 招式 phase 路由 / 6 skill category，把 CLAUDE.md 协作规则机器化
- **当前关注**：✅ 🎯 **v1.0 GA SHIPPED** 2026-05-22 — Phase 6.1 FINAL phase COMPLETE; 6 milestones (v0.1.0+v0.2.0+v0.3.0+v0.4.0+v0.5.0+v1.0); 21/21 phases 100% (10 days 2026-05-12~22); post-v1.0 maintenance-only mode trigger ~2026-11 organic clock end per ADR 0020 D-04 HYBRID 2-clock; user push approval pending (tags + commits → npm publish LIVE)
- **总工期**：**10 days 2026-05-12~22 实际 ship 20/20 phases** (v0.1.0+v0.2.0+v0.3.0+v0.4.0+v0.5.0 5 milestones close + v1.0 GA Phase 6.1 in progress; 原 ROADMAP v3 估 ~10-12 周 17 phases 实证显著 over-deliver per BB path Phase 5.x minor + sister D-04 HYBRID 2-clock organic clock SEPARATE) 
- **License**：Apache-2.0（开源 / GitHub Sponsors 兜底）
- **仓库**：`D:\GitCode\harnessed\`（Node.js + TypeScript）

---

## 当前位置（Current Position）

- **GSD phase**：⚙ **Phase v3.0-3.4 execute sub-workflows SHIPPED** (2026-05-21) — v3.0 milestone 4/6; Pattern A 全栈三路 3-teammate execute team `phase34-execute-team` (discuss-plan-teammate 5 task + task-teammate 5 task + verify-teammate 9 task = 19 atomic commit) + team-lead close (W0.14 scaffold + W2.1 audit + W2.2 defaults extend + W2.3 ship cadence = 20th commit) — discuss/plan layer: discuss-strategic + discuss-phase + discuss-subtask + plan-architecture + plan-phase (5 sub-workflow yaml + SKILL.md, 10 file); task layer: task-clarify + task-code + task-test (含 tdd-gate + diagnose conditional) + task-deliver (含 ralph-loop completion_promise + parallelism-gate + R20.10 explicit max_iterations_exceeded emit_warning_and_halt) + research v2→v3 schema bump (5 sub + 1 standalone, 10 file modified/created); verify layer: verify-progress (3 phase serial gsd-verify-work → gsd-progress → planning-with-files) + verify-code-review (parallel) + verify-paranoid (is-critical-module conditional) + W0.13a-e SPLIT per M-2 advisory (verify-qa + verify-security + verify-design + verify-simplify 末尾串行 + verify-multispec 2 phase Pattern C 4-specialist Agent Teams) + retro NEW standalone (retro-gstack alias capability per Pattern A E.2 LOCK + RETROSPECTIVE.md persist, 9 sub-workflow + 1 standalone = 18 file); close: 4 auto/ scaffold dir (workflows/{discuss,plan,task,verify}/auto/.gitkeep) + 19 SKILL.md frontmatter audit (count == 16 expected per PLAN but actual 17 sub + 2 standalone = 19 due to W0.13 split M-2 advisory, OK 不阻塞) + defaults.yaml 36L→103L 加 ~26 NEW entry (research v3 + retro 2 + discuss 4 + plan 3 + task 4 + verify 11); 全 cross-validate C1 + C2 PASS (workflow v2=3 + v3=19); check-workflow-schema exit 0 + vitest schema-v3 10/10 PASS + tsc 0 error + biome clean; 3 layer 共 19 atomic + 1 ship cadence = 20 atomic commit total; Karpathy ≤200L 不适用 (yaml + md);LOCAL tag pending: v3.0.0-alpha.1-sub-workflows
- **当前里程碑**：**🎯 v2.0 Architecture Refactor 6/6 COMPLETE** 2026-05-20 — Pure bundled SoT + 4 workflows v2 + 39 capabilities + 6 judgments + judgmentResolver + checkAgentTeams + fallbackHandlers + 46 dogfood fixture + 6 NEW ADR (0024-0029) + ci.yml A7 0023→0029 + CHANGELOG [2.0.0] + package.json 2.0.0 + 4 LOCAL tag (alpha.0-schema + alpha.1-workflows + rc.1 + 🎯 v2.0.0 GA) — Pure bundled SoT (REFRAME 2026-05-20) + capability abstraction (flat yaml map) + gate yaml-eval (expr-eval) + judgments/ 多 file 分类 (rule-style, sister ~/.claude/rules/*.md pattern) maintainer 三层栈机器化 (NOT parse user CLAUDE.md) + research+verify-work NEW workflows + ralph-loop completion-promise 真接 (Stage ③ 铁律) + parallelism-gate + Agent Teams 路由 + env check + verify-work full 4-stage 重定 + tdd-gate + special-purpose tools routing 扩 + planning-with-files 真接 (Stage ② 铁律) + fallback 3 铁律 + release-notes-only migration; **16 R20.x** (initial 9 + Q-AUDIT amend 7 — R20.6 DROPPED); v2.0 4 phase → **6 phase** (加 2.5 4-stage 机器化 deepening); 1-2 week target window 2026-05-20~2026-06-05
- **下一 phase**：**v2.0 GA push approval + Phase v2.0-W3 publish.yml tag-trigger npm publish** (user approval gated per CLAUDE.md commit safety; sister ADR 0023 v1.0 OIDC + sigstore + NPM_TOKEN fallback pattern); post-v2.0 maintenance-only mode trigger ~2026-11 organic clock per ADR 0020 D-04 HYBRID 2-clock
- **状態**：⚙ **Phase v2.0-2.5 4-stage 机器化 dogfood ALL 5 cycle SHIPPED 2026-05-20** — Cycle 1 parallelism-gate + Agent Teams env real probe (5 fixture, 3 route × 5 trigger matrix) + Cycle 2 verify-work + Pattern C 4-specialist 9-phase (6 fixture, caught production bug 3 处 uppercase OR/AND → fixed inline) + Cycle 3 tdd-gate + planning-with-files /plan + ralph-loop COMPLETE (20 fixture, 3 axis) + Cycle 4 mattpocock auto-invoke + special-purpose tools 13+ + fallback 3 铁律 (15 fixture, 3 scenario) + Cycle 5 aggregate DOGFOOD-T5.5-AGGREGATE.md 180L 5-axis report; **dogfood-first methodology proves R8.1 value** (sister benchmark caught real bug NOT pass-by schema-shape test); 46 NEW fixture total; 895 pass / 4 skip 0 fail; biome clean
- **進度**：21 / 21 phases ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ **100%**（v0.1.0 + v0.2.0 + v0.3.0 + v0.4.0 + v0.5.0 + 🎯 **v1.0 GA** ALL SHIPPED & ARCHIVED）

### 各里程碑进度

| 里程碑 | Phase 完成 | 状态 | 完成时间 |
|--------|-----------|------|---------|
| v0.1.0 manifest 引擎 + research | 6/6 | ✅ Phase 1.1 + 1.2 + 1.2.5 + 1.3 + 1.4 + 1.5 done — **v0.1.0 里程碑全部完成** | 2026-05-12 ~ 2026-05-14 |
| v0.2.0 Sub-task Loop + Extension Installers | 4/4 | 🎯 **SHIPPED & ARCHIVED** — Phase 2.1 + 2.2 + 2.3 + 2.4 ship (doctor MIN 5 + EE-4 SSOT + dashboard C 路径 + audit hard-fail + Win sentinel + Wave 0 backlog 5 项); 13 ADR + 13 baseline tag accumulate; archive + audit ship | 2026-05-15 ~ 2026-05-16 |
| v0.3.0 plan-feature + checkpoint | 4/4 | 🎯 **SHIPPED & ARCHIVED** — Phase 3.1-3.4 全 ship; tests 543→701+ (+158); 17 ADR + 14 milestone tag; archive `.planning/milestones/v0.3.0-*.md` triplet | 2026-05-16 ~ 2026-05-17 |
| v0.4.0 dogfooding + 稳定期 | 3/3 | 🎯 **SHIPPED & ARCHIVED** — Phase 4.1+4.2+4.3 全 ship (dogfooding benchmark + community infra + R8.1 audit log + R8.4 ADR backfill + CHANGELOG + 🎯 v0.4.0 close); tests 709→733 (+24); 21 ADR; archive `.planning/milestones/v0.4.0-*.md` triplet | 2026-05-18 ~ 2026-05-19 |
| v0.5.0 v1.0-RC2 minor + 🎯 v1.0 GA prep | 3/3 | 🎯 **SHIPPED & ARCHIVED** — Phase 5.1 ✅ + Phase 5.2 ✅ + Phase 5.3 ✅ SHIPPED (R10.1-R10.4 全 Done + ADR 0021+0022 + 756 tests); archive `.planning/milestones/v0.5.0-*.md` triplet + dual tag v0.5.0-alpha.3-close + 🎯 v0.5.0 LOCAL | 2026-05-19 ~ 2026-05-22 |
| v1.0 GA production release | 1/1 | 🎯 **SHIPPED & ARCHIVED** — Phase 6.1 ✅ (publish.yml NEW OIDC + package.json 1.0.0 + CHANGELOG [1.0.0] + README stable badge + ROADMAP v1.0 SHIPPED + ADR 0023 + 🎯 v1.0.0 tag LOCAL CREATE) + v1.0.1~v1.0.4 patch series shipped npm (setup NEW + path resolution + UX redesign + parallel + MCP idempotent) | 2026-05-22 |
| v2.0 Architecture Refactor | 6/6 | 🎯 **SHIPPED & ARCHIVED** — Phase v2.0-2.1 ✅ discuss + Q-AUDIT (16 D-decision + 3 Q-AUDIT-5 schema fix); Phase v2.0-2.2 ✅ plan (PLAN.md 32 task); Phase v2.0-2.3 ✅ execute schema; Phase v2.0-2.4 ✅ execute workflows (W1 Team 1 Pattern A + W2+W3); Phase v2.0-2.5 ✅ 4-stage 机器化 dogfood (46 fixture + 1 production bug catch + R8.1 proven); Phase v2.0-2.6 ✅ close (6 ADR backfill + ci.yml A7 0023→0029 + CHANGELOG [2.0.0] + package.json 2.0.0 + README v2.0 + milestone audit + 4 LOCAL tag alpha.0/alpha.1/rc.1/🎯 v2.0.0 GA); 899 pass + 6 NEW ADR + 4 workflows v2 + 39 capabilities; v2.0.0 GA publish pending user push approval | 2026-05-20 |

### 已完成 phase ship 历史 (dev SoT — README user-facing summary only)

<!-- Phase 3.3 + 3.4 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 (2026-05-18 Phase 4.1 W0.3 D2 cadence iter 2 per standing process — M2 backlog discharge institutionalize verify 2nd-iter beyond 1st-implementation) -->
<!-- Phase 4.0 + 4.1 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.0+4.1 (2026-05-18 Phase 4.2 W0.1 D2 cadence iter 3 per standing process — M2 backlog discharge institutionalize verify 3rd-iter terminus stable ≥3-iter pattern signal beyond 2nd-iter Phase 4.1 W0.3; Phase 4.0 was numeric placeholder NOT real shipped phase — Phase 4.1 single-phase archive per R-4 cadence consistency mitigation) -->
<!-- Phase 4.2 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2 (2026-05-19 Phase 4.3 W0.1 D2 cadence iter 4 per standing process — M2 backlog discharge institutionalize REINFORCE 4th-iter stable signal beyond ≥3-iter pattern; sister 5-recurrence terminus heuristic confirmed pattern stable Phase 4.2 W0.1 3rd-iter → Phase 4.3 W0.1 4th-iter; single-phase archive per R-4 cadence consistency mitigation continuation) -->
<!-- Phase 4.3 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.3 (2026-05-19 Phase 5.1 W0 T0.1 D2 cadence iter 5 TERMINUS per standing process — 5-recurrence terminus heuristic confirmed pattern stable; single-phase archive per R-4 cadence consistency mitigation continuation; iter 5 = REINFORCE post-iter-4 stable terminus signal) -->
<!-- Phase 5.1 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.1 (2026-05-19 Phase 5.2 W0 T0.1 D2 cadence iter 6 REINFORCE per standing process — implicit-standing-process graduation signal; 6th-iter confirms D2 cadence formally institutionalized; single-phase archive per R-4 cadence consistency mitigation continuation) -->
<!-- Phase 5.2 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.2 (2026-05-22 Phase 5.3 W0.1 D2 cadence iter 7 per standing process — implicit-standing-process graduation REINFORCE; iter 7 post-iter-6 terminus signal Phase 5.2 W0; single-phase archive per R-4 cadence consistency mitigation continuation) -->

<!-- Phase 5.3 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.3 (2026-05-22 Phase 6.1 W0 D2 cadence iter 8 TERMINUS per standing process — 8-iter confirms implicit graduation; sister Phase 5.1 iter 5 + Phase 5.2 iter 6 + Phase 5.3 iter 7 pattern stable beyond 6-iter graduation) -->

- **Phase v2.0-2.6 shipped** 🎯 (2026-05-20) — v2.0 GA final phase; W0 6 ADR backfill (0024 workflow schema v2 + 0025 capabilities baseline + 0026 judgments multi-file + 0027 research/verify-work + planning-with-files plugin reframe + 0028 ralph-loop+TDD+Agent Teams+Q-AUDIT-5b schema fix + 0029 fallback 3 铁律+4-stage close) via 6 parallel subagent fan-out (5 SHIPPED + 1 hung→inline write fallback) + 3 deferred items resolved inline (T2.4.W1.4 cascade upgrade + T2.4.W1.5 fallback wire CLI E2E + CK setup.ts split 235→139L) + W1 ship artifacts (CHANGELOG [2.0.0] BREAKING + ci.yml A7 step 0023→0029 + package.json 1.0.4→2.0.0 + README v2.0 4-workflow highlight + ADR README index 6 row append) + W2 milestone close (.planning/milestones/v2.0-MILESTONE-AUDIT.md NEW); 4 LOCAL tag created (v2.0.0-alpha.0-schema + v2.0.0-alpha.1-workflows + v2.0.0-rc.1 + 🎯 v2.0.0 GA); v2.0 Architecture Refactor 6/6 phase 100% COMPLETE; v2.0.0 npm publish pending user push approval per CLAUDE.md commit safety (sister ADR 0023 v1.0 OIDC + sigstore + tag-trigger pattern)
- **Phase v2.0-2.5 shipped** ⚙ (2026-05-20) — v2.0 Architecture Refactor 4-stage 机器化 dogfood; 5 sequential cycle subagent fan-out (Cycle 1 parallelism-gate + Agent Teams env real probe 5 fixture / Cycle 2 verify-work + Pattern C 9-phase 6 fixture + 1 production bug caught dogfood-first uppercase OR/AND inline fix / Cycle 3 tdd + planning-with-files /plan + ralph-loop COMPLETE 20 fixture 3-axis / Cycle 4 mattpocock + special-purpose 13+ + fallback 3 铁律 15 fixture 3-scenario / Cycle 5 DOGFOOD-T5.5-AGGREGATE.md 180L 5-axis final report); 46 NEW fixture total; 13/15 active R20.x inline-verified (R20.5 + R20.9 operational deferred Phase 2.6); R8.1 dogfood-first methodology value 实证 (caught real bug NOT pass-by schema-shape regex `/OR/` static pass while runtime expr-eval Parser fails); 895 pass / 4 skip 0 fail; local tag v2.0.0-rc.1 pending Phase 2.5 batch commit
- **Phase v2.0-2.4 shipped** ⚙ (2026-05-20) — v2.0 Architecture Refactor execute workflows; W0 schema (workflow.ts 86L 16th surface) + W1 3-teammate Team 1 `phase24-w1-execute-team` Pattern A 全栈三路 (T2.4.W1.1 phases.yaml v2 + loadPhases.ts Option A++ ifelse dispatch / T2.4.W1.2 fallbackHandlers.ts 89L split + engine.ts wire R20.10 explicit NOT silent / T2.4.W1.3 plan-feature workflow.yaml v2 + Q-AUDIT-5a planning-with-files plugin /plan invoke) + W2 2 NEW workflows (research 2-phase + verify-work 9-phase Pattern C 4-specialist upgrade) + W3 doctor MIN 8→10 (Agent Teams + planning-with-files real probe v2.34.0); 2 architectural arbitration by team-lead (Option A++ loadPhases + Option C split helper) + 4 SendMessage round-trip + 3 graceful shutdown (1 hung execute-task-impl + 1 hung research subagent fallback main session inline); NS deferred resolved (gsd-discuss-phase + gsd-plan-phase capabilities.yaml entry); 14 NEW fixture + 849 pass full suite + biome clean + local tag v2.0.0-alpha.1-workflows
- **Phase v2.0-2.3 shipped** ⚙ (2026-05-20) — v2.0 Architecture Refactor execute schema W0+W1+W2.1; 8 task via 4 parallel + 2 sequential + 2 parallel + ship cadence direct subagent fan-out: W0.1 capabilities.yaml 360L 37 entry (mattpocock 11 + special-purpose 13 + gstack 6 + core 4 + agent-teams 3, Q-AUDIT-5a/5b/D-13 verified) + W0.2 judgments/ 6 file 158L (5 triggers + 1 rules fallback dual schema) + W0.3 exprBuilder.ts 53L (expr-eval ^2.0.2 + Parser singleton + GateEvalError, 10 fixture) + W0.4 judgmentResolver.ts 98L (4-level ref split + dual schema + cache, 12 fixture + exprBuilder.ts:39 TS2345 inline fix Option B Values type) + W0.5 checkAgentTeams.ts 47L (Q-AUDIT-5b root-level env probe, 5 fixture) + W0.6 TypeBox schema 5 file 579L (capabilities + judgment + phaseFactContext + check-workflow-schema.mjs CI gate + ci.yml L141 wire, 17 fixture) + W1.1 setup.ts wire +27L (Agent Teams warn UX + Pure bundled highlight, 4 fixture) + W1.2 defaults.yaml 36L (ralph_max_iterations 4 workflow × 14 entry + hard_upper_limit 100, 3 fixture); W1.3 phaseFactContext.ts deduped by W0.6 cross-task overlap; 副作用 fix W0.2 yaml 8 expr keyword AND/OR → lowercase (expr-eval 2.0.2 case-sensitive); full suite 829 pass / 4 skip 0 fail; biome clean
- **Phase v2.0-2.2 shipped** ⚙ (2026-05-20) — v2.0 Architecture Refactor plan-phase; Wave A research (gsd-phase-researcher subagent, RESEARCH.md 1058L 8 focus area) + gstack /plan-eng-review (Step 0 Scope Challenge + 5 section review, 3 P1 finding RESOLVED via Q-AUDIT-5 ALL Option A) + Wave B planner (gsd-planner subagent, PLAN.md 835L 32 atomic task across Phase v2.0-2.3 to v2.0-2.6) + Wave C plan-check (gsd-plan-checker subagent, PLAN-CHECK.md 308L verdict PASS — 10 dimension 0 HIGH + 0 MEDIUM + 3 LOW advisory); 15 active R20.x 双覆盖 (implementation + dogfood task) + 8 PLAN-ENG-REVIEW.md implementation tasks 全部纳入; Phase 2.1 Q-AUDIT-5 amend (D-15 planning-with-files plugin reframe + D-11 Agent Teams root-level env schema fix + D-04/D-16 judgmentResolver.ts NEW) 全反映
- **Phase v2.0-2.1 shipped + Q-AUDIT amend** ⚙ (2026-05-20) — v2.0 Architecture Refactor discuss-phase; 1 milestone-class M-01 + **16 D-decision LOCKED** (initial 9 D-decision Q1-Q4 RESET reframe + **Q-AUDIT amend 7 D-decision** D-10 ralph-loop 真接 / D-11 parallelism-gate + Agent Teams env check / D-12 verify-work full 4-stage 重定 / D-13 tdd-gate / D-14 special-purpose tools routing 扩 / D-15 planning-with-files 真接 / D-16 judgments/ 多 file 分类 + fallback 3 铁律 + 战略层透明声明); REQUIREMENTS R20.10-R20.16 NEW (16 R20.x total; R20.6 DROPPED); ROADMAP v2.0 4→6 phase (加 2.5 4-stage 机器化 deepening); `.planning/phase-v2.0-2.1/{2.1-CONTEXT.md + 2.1-DISCUSSION-LOG.md}` disambiguated dir
- **Phase 6.1 shipped** ✅ (2026-05-22) — 🎯 v1.0 GA PRODUCTION RELEASE; publish.yml NEW OIDC + package.json 1.0.0 + CHANGELOG [1.0.0] + ADR 0023 + 3 LOCAL tags; 21/21 phases FINAL
- **Phase 5.1-5.3 shipped** ✅ (2026-05-19 ~ 2026-05-22) — R10.1-R10.4 + ADR 0021+0022 + 756 tests + 🎯 v0.5.0 CLOSE & ARCHIVED (full narrative archived RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.1-5.3)
- **Phase 1.1-4.3 shipped** ✅ (2026-05-12 ~ 2026-05-19) — 17 phases v0.1.0+v0.2.0+v0.3.0+v0.4.0 milestones all CLOSE & ARCHIVED (full narrative archived RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 1.X-4.3)

<!-- v1.0 GA SHIPPED 2026-05-22 — Phase 6.1 W2 T2.9 STATE FINAL update + maintenance-mode forward signal recorded.
     D2 cadence iter 8 = TERMINUS (Phase 6.1 W0 T0.1; 8-iter graduation confirmed beyond ≥6-iter implicit graduation; #BS retire signal).
     Post-v1.0 STATE enters maintenance freeze: no more D2 iter cadence; maintenance-only mode wording per D-08 forward visibility (NOT immediate per sneak-block).
     Next STATE update: organic clock end (~2026-11) outcome decision (a) maintenance-only or (b) Phase 7.x discuss-phase.
     ADR 0020 D-04 HYBRID 2-clock reference: organic clock opened 2026-05-22, closes ~2026-11-18 approximate. -->

---

## 进行中（In Progress）

[当前: ✅ Phase 6.1 SHIPPED 2026-05-22 — 🎯 v1.0 GA PRODUCTION RELEASE FINAL; 21/21 phases 100% COMPLETE; v1.0+ maintenance-only mode trigger ~2026-11 organic clock close]

---

## 待办（按优先级）— Phase 6.1 v1.0 GA SHIPPED

### P0 — Phase 6.1 ALL COMPLETE ✅

1. ✅ **Phase 5.1-5.3 SHIPPED** — R10.1-R10.4 DELIVERED + 🎯 v0.5.0 ARCHIVED
2. ✅ **Phase 6.1 Wave 0 COMPLETE** — STATE 139L D2 iter 8 TERMINUS + #BA retire + npm rehearsal 4/4 PASS + 756 baseline
3. ✅ **Phase 6.1 Wave 1 COMPLETE** — publish.yml NEW (OIDC) + package.json 1.0.0 + ADR 0023 NEW; 756 tests PASS
4. ✅ **Phase 6.1 Wave 2 COMPLETE** — T2.1-T2.11 all shipped; 3 LOCAL tags created (adr-0023-accepted + v1.0.0-alpha.1-release-prep + 🎯 v1.0.0)
5. ⏳ **User push approval** for all accumulated LOCAL tags + commits per CLAUDE.md commit safety (push v1.0.0 tag triggers publish.yml → npm publish LIVE)
6. ⏳ **Trusted Publishers UI config** (npmjs.com → package → Trusted Publishers) — complete before tag push; fallback NPM_TOKEN documented in ADR 0023

### P1/P2 — DEFERRED post-v1.0 (maintenance-only mode; evaluate at organic clock end ~2026-11)

- **#BC #BD #BE #BF #BJ #BK** carry-forward items + v1.0+ backlog → evaluate at organic clock end per ADR 0020 D-04 HYBRID outcome (a) maintenance-only or (b) Phase 7.x active
- **#CA M1** STATE.md L17-21 4 historical lesson lines trim → RETROSPECTIVE (sister Paranoid Review 5th-cycle absorb;sister review 显式 '不阻塞';v1.0.1 OR v1.1.0 phase trim 一并;post-v1.0 maintenance freeze 推荐时机)
- **#CB M2** ✅ DISCHARGED 2026-05-22 — `docs/METRICS.md` NEW weekly snapshot baseline (sister Paranoid Review 5th-cycle absorb;6-month organic clock co-maintainer recruit signal monitor;触发 maintenance-only mode evaluate at ~2026-11)

---

## 关键提醒（⚠️ 不可忽略）

1. **Cross-OS 测试 Day 1**（不是 v0.4）——CI config 已在 phase 1.1 落地（ci.yml）；phase 1.2 起 CI 红了必须修，不允许 disable Windows
2. **路由命中率 30 样本必须覆盖 Haiku/Sonnet/Opus 各 ≥ 8**——Haiku 命中率显著低于 Sonnet（R03 实证）；phase 1.4 30 sample × 6 category 100% hit (单 model 单环境基线，phase 3.4 v0.3.0 升级多 model × stability 验收)
3. **bus factor 1 真实风险**——Avelino 论文实证单 maintainer 年掉队率 36%，6 个月 co-maintainer 窗口非装饰
4. **Karpathy ≤200L hard limit**——B-06 + B-26 + Phase 3.4 D-04 explicit "no B-03 5% tolerance"; doctor.ts 195L borderline (Phase 3.4 W1 Option A inline shrink locked)
5. **biome lint preempt before commit**（project memory `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3）: 任何 TS/JS commit 前必跑 `pnpm exec biome check --write`
6. **STATE.md archive cadence institutionalize** (D2 cadence iter 8 TERMINUS Phase 6.1 W0 — 8-iter pattern stable beyond ≥6-iter graduation; post-v1.0 STATE maintenance freeze forward signal per T4): 每 phase ship 时 T0.1 trim prev-phase narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE; D3 gate `check-state-archive-stale.mjs` SIZE_LIMIT=150 ENFORCE
7. **A7 守恒**——ADR 0001-0021 main body 永久 0 diff; ci.yml A7 step iterate Phase N ship 时 add new ADR reference (Phase 5.2 W2 T2.7 iter 0021→0022)

---

## 累积上下文（Decisions / Todos / Blockers）

### 关键决策记录（最近 phase + 长期约束 — 历史决策已 archive 进 RETROSPECTIVE.md）

| 决策 | 来源 | 备注 |
|------|------|------|
| 路由 B+C 混合 + 85% 验收 | SPEC § 5.1 + R03 § 2.4 | Sonnet 100% / Haiku 84% 实证；Phase 3.4 ✅ 30/30 = 100% 远超 ≥85% bar 15% headroom |
| ADR 0001-0017 main body 永久守恒（A7） | F26 + ci.yml iterate 17 tag | 任一字符 diff = CI fail; Phase 3.4 W2 T2.7 iter 1-0016 → 1-0017 |

> 完整决策表 archive → RETROSPECTIVE.md § ARCHIVED FROM STATE (Phase 1.X-3.2 through Phase 5.1)

### 未决问题（v0.5+ 议题）

1. `planning-with-files` 与 `superpowers/writing-plans` 互斥语义 — defer v0.5+
2. gstack-2 / GSD-2 v2 重写迁移 — v1.0+ 议题
3. "用户 10 秒手动覆盖路由错误" UX 量化 — v0.5 benchmark 时定
4. **DEFERRED #BA SIZE_LIMIT round 5 evaluate** — Phase 6.1 W0 T0.2 active: post-T0.1 trim STATE size → conditional FLIP 150→140 (≤130L) / ACCEPT terminus (131-145L) / BLOCKED (>145L); sister 5-recurrence terminus + T4 post-v1.0 STATE maintenance freeze graduation signal; #BA permanent retire pending T0.2 outcome

### Blockers

[当前无 — Phase 5.2 SHIPPED; tags adr-0019/0020/0021/0022-accepted + v0.5.0-alpha.1-audit-lock + v0.5.0-alpha.2-uninstall-security LOCAL CREATE pending user push per CLAUDE.md commit safety]

---

## 框架治理路由（呼应 ~/.claude/CLAUDE.md）

本项目在 v0.1+ 的子任务执行阶段须遵循：gstack 决策关卡 + GSD orchestration + planning-with-files 持久化 + superpowers 子任务执行 + andrej-karpathy-skills 编码心法 + mattpocock-skills 按需召唤 + ralph-loop 交付保证 + Tavily/Exa MCP 网络调研 + ctx7 文档查询。详 ~/.claude/CLAUDE.md。
