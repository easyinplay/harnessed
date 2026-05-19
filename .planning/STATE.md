---
gsd_state_version: 1.0
milestone: v0.4.0
milestone_name: ship 前必达）
status: unknown
last_updated: "2026-05-19T06:26:35.690Z"
progress:
  total_phases: 2
  completed_phases: 0
  total_plans: 0
  completed_plans: 3
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
- **当前关注**：v0.3.0 milestone 3/4 PROGRESS (Phase 3.1+3.2+3.3 SHIPPED 2026-05-16~17) — next: Phase 3.4 路由命中率 ≥ 85% 验收 + token budget 监控 + DEFERRED #AC (aliases.yaml dogfood entries) + #AD (install.ts package.json version read) + #AE (path traversal regex 若 surface real attack vector) 兑现 + v0.3.0 close 在望 (Phase 3.4 同日 ship + milestone archive)
- **总工期**：~10-12 周（4 milestones × 3-5 phases = 共 **17 phases** v3 重排后）
- **License**：Apache-2.0（开源 / GitHub Sponsors 兜底）
- **仓库**：`D:\GitCode\harnessed\`（Node.js + TypeScript）

---

## 当前位置（Current Position）

- **GSD phase**：✅ **Phase 5.1 SHIPPED** (2026-05-19 — R10.1 audit-log consumer + R10.2 state lock + ADR 0021 + 733 tests); ✅ **Phase 5.2 execute-phase W0 IN PROGRESS** — 详 RETROSPECTIVE.md § ARCHIVED FROM STATE
- **当前里程碑**：**v0.5.0 v1.0-RC2 minor 2/3 IN PROGRESS** (H1 BB path LOCKED; R10.3 uninstall + R10.4 path traversal; 3-day target window; 🎯 v1.0 GA post-v0.5.0 close)
- **下一 phase**：**Phase 5.2 execute-phase W0 → W1 → W2** (PLAN.md 23 tasks LOCKED; W0 D2 iter 6 trim + #BH validateFlags + #BI runOrPreview; W1 R10.3 7 uninstallers + cli/uninstall.ts; W2 R10.4 path-guard + ADR 0022)
- **状态**：✅ **Phase 5.1 SHIPPED 2026-05-19** (archived → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.1); **Phase 5.2 W0 executing**
- **进度**：18 / 20 phases 已完成 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░ 90%（v0.1.0 100% + v0.2.0 100% + 🎯 **v0.3.0 100% CLOSE** + 🎯 **v0.4.0 100% CLOSE** + v0.5.0 里程碑 2/3 PROGRESS — Phase 5.1 ✅ + Phase 5.2 IN PROGRESS + Phase 5.3 pending）

### 各里程碑进度

| 里程碑 | Phase 完成 | 状态 | 完成时间 |
|--------|-----------|------|---------|
| v0.1.0 manifest 引擎 + research | 6/6 | ✅ Phase 1.1 + 1.2 + 1.2.5 + 1.3 + 1.4 + 1.5 done — **v0.1.0 里程碑全部完成** | 2026-05-12 ~ 2026-05-14 |
| v0.2.0 Sub-task Loop + Extension Installers | 4/4 | 🎯 **SHIPPED & ARCHIVED** — Phase 2.1 + 2.2 + 2.3 + 2.4 ship (doctor MIN 5 + EE-4 SSOT + dashboard C 路径 + audit hard-fail + Win sentinel + Wave 0 backlog 5 项); 13 ADR + 13 baseline tag accumulate; archive + audit ship | 2026-05-15 ~ 2026-05-16 |
| v0.3.0 plan-feature + checkpoint | 4/4 | 🎯 **SHIPPED & ARCHIVED** — Phase 3.1-3.4 全 ship; tests 543→701+ (+158); 17 ADR + 14 milestone tag; archive `.planning/milestones/v0.3.0-*.md` triplet | 2026-05-16 ~ 2026-05-17 |
| v0.4.0 dogfooding + 稳定期 | 3/3 | 🎯 **SHIPPED & ARCHIVED** — Phase 4.1+4.2+4.3 全 ship (dogfooding benchmark + community infra + R8.1 audit log + R8.4 ADR backfill + CHANGELOG + 🎯 v0.4.0 close); tests 709→733 (+24); 21 ADR; archive `.planning/milestones/v0.4.0-*.md` triplet | 2026-05-18 ~ 2026-05-19 |
| v0.5.0 v1.0-RC2 minor + 🎯 v1.0 GA prep | 2/3 | 🚧 **IN PROGRESS** — Phase 5.1 ✅ SHIPPED + Phase 5.2 executing (uninstall + path traversal); Phase 5.3 (🎯 v0.5.0 close) pending | 2026-05-19 ~ - |

### 已完成 phase ship 历史 (dev SoT — README user-facing summary only)

<!-- Phase 3.3 + 3.4 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 (2026-05-18 Phase 4.1 W0.3 D2 cadence iter 2 per standing process — M2 backlog discharge institutionalize verify 2nd-iter beyond 1st-implementation) -->
<!-- Phase 4.0 + 4.1 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.0+4.1 (2026-05-18 Phase 4.2 W0.1 D2 cadence iter 3 per standing process — M2 backlog discharge institutionalize verify 3rd-iter terminus stable ≥3-iter pattern signal beyond 2nd-iter Phase 4.1 W0.3; Phase 4.0 was numeric placeholder NOT real shipped phase — Phase 4.1 single-phase archive per R-4 cadence consistency mitigation) -->
<!-- Phase 4.2 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.2 (2026-05-19 Phase 4.3 W0.1 D2 cadence iter 4 per standing process — M2 backlog discharge institutionalize REINFORCE 4th-iter stable signal beyond ≥3-iter pattern; sister 5-recurrence terminus heuristic confirmed pattern stable Phase 4.2 W0.1 3rd-iter → Phase 4.3 W0.1 4th-iter; single-phase archive per R-4 cadence consistency mitigation continuation) -->
<!-- Phase 4.3 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.3 (2026-05-19 Phase 5.1 W0 T0.1 D2 cadence iter 5 TERMINUS per standing process — 5-recurrence terminus heuristic confirmed pattern stable; single-phase archive per R-4 cadence consistency mitigation continuation; iter 5 = REINFORCE post-iter-4 stable terminus signal) -->
<!-- Phase 5.1 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 5.1 (2026-05-19 Phase 5.2 W0 T0.1 D2 cadence iter 6 REINFORCE per standing process — implicit-standing-process graduation signal; 6th-iter confirms D2 cadence formally institutionalized; single-phase archive per R-4 cadence consistency mitigation continuation) -->

- **Phase 5.1 shipped** ✅ (2026-05-19) — R10.1 audit-log consumer + R10.2 state.ts lock + ADR 0021 + ci.yml A7 0018→0021 + 733 tests
- **Phase 4.3 shipped** ✅ (2026-05-19) — R8.1 audit log + R8.4 ADR backfill + 🎯 v0.4.0 close (archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 4.3)
- **Phase 4.2 shipped** ✅ (2026-05-18) — co-maintainer onboarding + R8.2+R8.3+R8.5 (archived → RETROSPECTIVE.md § Phase 4.2)
- **Phase 4.1 shipped** ✅ (2026-05-18) — dogfooding benchmark R8.1 anchor (archived → RETROSPECTIVE.md § Phase 4.0+4.1)
- **Phase 1.1-3.4 shipped** ✅ (2026-05-12 ~ 2026-05-17) — 14 phases v0.1.0+v0.2.0+v0.3.0 milestones (full narrative archived RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 1.X-3.2 + Phase 3.1+3.2 + Phase 3.3+3.4)

---

## 进行中（In Progress）

[当前: ⚙ v0.5.0 Phase 5.2 W0 executing — R10.3 uninstall + R10.4 path traversal; Phase 5.1 ✅ SHIPPED 2026-05-19]

---

## 待办（按优先级）— v0.5.0 v1.0-RC2 minor STARTING window

### P0 — Phase 5.2 executing

1. ✅ **Phase 5.1 SHIPPED** (2026-05-19) — R10.1+R10.2 DELIVERED; ⏳ **Phase 5.2** — R10.3 uninstall + R10.4 path traversal; ⏳ **Phase 5.3** — v0.5.0 close + 🎯 v1.0 GA prep
2. ⏳ **User push approval** for tags LOCAL (累积 8+ pending: v0.4.0-alpha.1/2/3 + adr-0018/0019/0020/0021-accepted + 🎯 v0.4.0 + v0.5.0-alpha.1-audit-lock; Phase 5.2 will add adr-0022-accepted + v0.5.0-alpha.2-uninstall-security LOCAL)
3. ⏳ **User push approval** for accumulated commits ahead origin (Phase 4.1-5.2 commits per CLAUDE.md commit safety)
4. ⏳ **User manual prerequisite — Sponsors account activation** (R8.5): activate at github.com/sponsors/easyinplay/dashboard if not yet activated per DEFERRED #BE

### P1 — DEFERRED carry-forward (post-v0.4.0 close)

5. **DEFERRED #BC** v0.5+ benchmark expand evaluation — IF Phase 4.1 dogfood reveals miss case NOT covered by current 30 SAMPLES.md → re-evaluate D-01 REJECT EXPAND new mining; currently 30/30 100% routing PASS no signal
8. **DEFERRED #BD** regex 2-pass validation pattern lock — plan-checker iter 2 residual semantic synonym `L1-N`/`=N+1L` arithmetic missed by iter 1 literal regex; future plan-checker iterations use 2-pass (literal + arithmetic-aware) regex validation
9. **DEFERRED #BE** Sponsors account activation external prereq (Phase 4.2 own carry) — IF user NOT activated by Phase 4.2 ship time: FUNDING.yml + badge ship forward-compatible per RESEARCH § 17.2 U1; user manual activation at github.com/sponsors/easyinplay/dashboard required for button render
10. **DEFERRED #BF** CODEOWNERS .github/** defer SR-6 preempt (Phase 4.2 own carry) — defer v0.4.3+ if real attack surface arrives
11. **DEFERRED #AH** ✅ DELIVERING Phase 5.2 R10.4 path traversal regex hardening (5-vector OWASP A1; src/manifest/lib/path-guard.ts NEW)
12. **EE-4 BLOCKER auto-spawn rerun** — v0.4.0 后 evaluate (Phase 2.4 D-02 down-scope carry-forward unchanged)
13. **userSpawn session_id capture** (Phase 3.1 DEFERRED #2) — v0.4.0+ if real userSpawn demand

### P2 — 跨里程碑预留 (v0.5+ 议题)

8. `mutually-exclusive skill groups` 元模型 — 推 v0.5+
9. gstack-2 / GSD-2 v2 重写迁移 — v1.0+ 议题
10. sigstore / cosign 签名集成 — v0.5+ 议题
11. `requires_secret` + `command_prefix_strategy` schema 增强候选 — 推 v0.5+
12. `--force` flag for install idempotent_check — 推 v0.5+

---

## 关键提醒（⚠️ 不可忽略）

1. **Cross-OS 测试 Day 1**（不是 v0.4）——CI config 已在 phase 1.1 落地（ci.yml）；phase 1.2 起 CI 红了必须修，不允许 disable Windows
2. **路由命中率 30 样本必须覆盖 Haiku/Sonnet/Opus 各 ≥ 8**——Haiku 命中率显著低于 Sonnet（R03 实证）；phase 1.4 30 sample × 6 category 100% hit (单 model 单环境基线，phase 3.4 v0.3.0 升级多 model × stability 验收)
3. **bus factor 1 真实风险**——Avelino 论文实证单 maintainer 年掉队率 36%，6 个月 co-maintainer 窗口非装饰
4. **Karpathy ≤200L hard limit**——B-06 + B-26 + Phase 3.4 D-04 explicit "no B-03 5% tolerance"; doctor.ts 195L borderline (Phase 3.4 W1 Option A inline shrink locked)
5. **biome lint preempt before commit**（project memory `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3）: 任何 TS/JS commit 前必跑 `pnpm exec biome check --write`
6. **STATE.md archive cadence institutionalize** (D2 cadence iter 5 TERMINUS Phase 5.1 W0): 每 phase ship 时 T0.1 trim prev-phase narrative → RETROSPECTIVE.md § ARCHIVED FROM STATE; D3 gate `check-state-archive-stale.mjs` SIZE_LIMIT=150 ENFORCE
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

### Blockers

[当前无 — Phase 5.2 W0 executing; tags adr-0019/0020/0021-accepted + v0.5.0-alpha.1-audit-lock LOCAL CREATE pending user push per CLAUDE.md commit safety]

---

## 框架治理路由（呼应 ~/.claude/CLAUDE.md）

本项目在 v0.1+ 的子任务执行阶段须遵循：

- **gstack**：决策关卡（每新里程碑 / 关键模块 PR 前 `/review` 强制）
- **GSD**：整体 orchestration（discuss → plan → execute → verify）
- **planning-with-files**：每个 phase 落地 task_plan.md / progress.md / findings.md
- **superpowers**：子任务级 brainstorming + 可选 TDD
- **andrej-karpathy-skills**：编码心法硬约束（surgical changes / simplicity first）
- **mattpocock-skills**：按需召唤 / `/zoom-out` / `/diagnose` / `/grill-with-docs`
- **ralph-loop**：每子任务交付保证（COMPLETE 标记）
- **Tavily / Exa MCP**：网络调研优先（不用 WebSearch / WebFetch）
- **ctx7**：库 / API / SDK 文档查询（默认）
