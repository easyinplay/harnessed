---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: v1.0 GA (production-ready stable release)
status: shipped
last_updated: "2026-05-22T00:00:00.000Z"
progress:
  total_phases: 21
  completed_phases: 21
  total_plans: 21
  completed_plans: 21
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

- **GSD phase**：✅ **Phase 6.1 SHIPPED** (2026-05-22) — 🎯 v1.0 GA PRODUCTION RELEASE FINAL phase; 21/21 phases 100% complete
- **当前里程碑**：**🎯 v1.0.1 PATCH SHIPPED** 2026-05-22 — critical bug fix post-v1.0 GA; global install users now work; harnessed setup NEW; 4 tags LOCAL (adr-0023-accepted + v1.0.0-alpha.1-release-prep + 🎯 v1.0.0 + 🎯 v1.0.1); push approval pending → npm publish LIVE
- **下一 phase**：**v1.0+ Maintenance-Only Mode** — organic clock running 2026-05-22 ~ ~2026-11; post-clock decision (a) maintenance-only or (b) continued active per ADR 0020 D-04 HYBRID
- **状態**：✅ **v1.0.1 PATCH SHIPPED 2026-05-22** — critical bug fix exception per ROADMAP v1.0+ chapter; install/install-base/uninstall path resolution fixed (process.cwd → packagePath); setup command finally implemented; 764 tests (756 + 8 new); maintenance-only mode trigger ~2026-11
- **進度**：21 / 21 phases ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ **100%**（v0.1.0 + v0.2.0 + v0.3.0 + v0.4.0 + v0.5.0 + 🎯 **v1.0 GA** ALL SHIPPED & ARCHIVED）

### 各里程碑进度

| 里程碑 | Phase 完成 | 状态 | 完成时间 |
|--------|-----------|------|---------|
| v0.1.0 manifest 引擎 + research | 6/6 | ✅ Phase 1.1 + 1.2 + 1.2.5 + 1.3 + 1.4 + 1.5 done — **v0.1.0 里程碑全部完成** | 2026-05-12 ~ 2026-05-14 |
| v0.2.0 Sub-task Loop + Extension Installers | 4/4 | 🎯 **SHIPPED & ARCHIVED** — Phase 2.1 + 2.2 + 2.3 + 2.4 ship (doctor MIN 5 + EE-4 SSOT + dashboard C 路径 + audit hard-fail + Win sentinel + Wave 0 backlog 5 项); 13 ADR + 13 baseline tag accumulate; archive + audit ship | 2026-05-15 ~ 2026-05-16 |
| v0.3.0 plan-feature + checkpoint | 4/4 | 🎯 **SHIPPED & ARCHIVED** — Phase 3.1-3.4 全 ship; tests 543→701+ (+158); 17 ADR + 14 milestone tag; archive `.planning/milestones/v0.3.0-*.md` triplet | 2026-05-16 ~ 2026-05-17 |
| v0.4.0 dogfooding + 稳定期 | 3/3 | 🎯 **SHIPPED & ARCHIVED** — Phase 4.1+4.2+4.3 全 ship (dogfooding benchmark + community infra + R8.1 audit log + R8.4 ADR backfill + CHANGELOG + 🎯 v0.4.0 close); tests 709→733 (+24); 21 ADR; archive `.planning/milestones/v0.4.0-*.md` triplet | 2026-05-18 ~ 2026-05-19 |
| v0.5.0 v1.0-RC2 minor + 🎯 v1.0 GA prep | 3/3 | 🎯 **SHIPPED & ARCHIVED** — Phase 5.1 ✅ + Phase 5.2 ✅ + Phase 5.3 ✅ SHIPPED (R10.1-R10.4 全 Done + ADR 0021+0022 + 756 tests); archive `.planning/milestones/v0.5.0-*.md` triplet + dual tag v0.5.0-alpha.3-close + 🎯 v0.5.0 LOCAL | 2026-05-19 ~ 2026-05-22 |
| v1.0 GA production release | 1/1 | 🎯 **SHIPPED & ARCHIVED** — Phase 6.1 ✅ (publish.yml NEW OIDC + package.json 1.0.0 + CHANGELOG [1.0.0] + README stable badge + ROADMAP v1.0 SHIPPED + ADR 0023 + 🎯 v1.0.0 tag LOCAL CREATE) | 2026-05-22 |

### 已完成 phase ship 历史 (dev SoT — README user-facing summary only)

<!-- Phase 3.3 + 3.4 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 (2026-05-18 Phase 4.1 W0.3 D2 cadence iter 2 per standing process — M2 backlog discharge institutionalize verify 2nd-iter beyond 1st-implementation) -->
<!-- Phase 4.0 + 4.1 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.0+4.1 (2026-05-18 Phase 4.2 W0.1 D2 cadence iter 3 per standing process — M2 backlog discharge institutionalize verify 3rd-iter terminus stable ≥3-iter pattern signal beyond 2nd-iter Phase 4.1 W0.3; Phase 4.0 was numeric placeholder NOT real shipped phase — Phase 4.1 single-phase archive per R-4 cadence consistency mitigation) -->
<!-- Phase 4.2 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2 (2026-05-19 Phase 4.3 W0.1 D2 cadence iter 4 per standing process — M2 backlog discharge institutionalize REINFORCE 4th-iter stable signal beyond ≥3-iter pattern; sister 5-recurrence terminus heuristic confirmed pattern stable Phase 4.2 W0.1 3rd-iter → Phase 4.3 W0.1 4th-iter; single-phase archive per R-4 cadence consistency mitigation continuation) -->
<!-- Phase 4.3 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.3 (2026-05-19 Phase 5.1 W0 T0.1 D2 cadence iter 5 TERMINUS per standing process — 5-recurrence terminus heuristic confirmed pattern stable; single-phase archive per R-4 cadence consistency mitigation continuation; iter 5 = REINFORCE post-iter-4 stable terminus signal) -->
<!-- Phase 5.1 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.1 (2026-05-19 Phase 5.2 W0 T0.1 D2 cadence iter 6 REINFORCE per standing process — implicit-standing-process graduation signal; 6th-iter confirms D2 cadence formally institutionalized; single-phase archive per R-4 cadence consistency mitigation continuation) -->
<!-- Phase 5.2 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.2 (2026-05-22 Phase 5.3 W0.1 D2 cadence iter 7 per standing process — implicit-standing-process graduation REINFORCE; iter 7 post-iter-6 terminus signal Phase 5.2 W0; single-phase archive per R-4 cadence consistency mitigation continuation) -->

<!-- Phase 5.3 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.3 (2026-05-22 Phase 6.1 W0 D2 cadence iter 8 TERMINUS per standing process — 8-iter confirms implicit graduation; sister Phase 5.1 iter 5 + Phase 5.2 iter 6 + Phase 5.3 iter 7 pattern stable beyond 6-iter graduation) -->

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
