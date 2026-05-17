# harnessed STATE

> 项目记忆 · 跨 session 一致性的 SSOT
> Phase 3.3 W0 T0.1 (D-04 (b) COLLAPSE locked, 5-recurrence terminus): L4 `> Status:` frontmatter + L5 `> 最后更新：` lines deleted — "当前位置" block (L21-27) is now the single SoT for phase ship event log. Freshness gate `scripts/check-transparency-verdicts.mjs` extends with STATE_POSITION_RE OR-fallback (full-file scan) so STATE.md acceptance check still passes.
> Phase 3.4 W0.1 STRATEGIC (D1 single-SoT institutionalize, 2026-05-17): STATE.md 723L → ≤200L round 1 — prev-prev-phase narrative (L96-329 已完成 milestone + L518-683 Phase 1.5/2.0/2.3/2.4 Prereq Notes ~400L) archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 1.X-3.2. D3 gate `scripts/check-state-archive-stale.mjs` warn-only round 1 (3 rules: size ≤200 / 关键决议 ship 总结 ≤1 / W-N errata literal 禁). D2 ship-time T6.N cadence integrated (Plan 03 W2 T2.2 trim prev-prev-phase narrative as standing process).
> Phase 3.4 W2 T2.2 (D2 ship-time T6.N first-implementation, 2026-05-17): Phase 3.1 + 3.2 narrative (prev-prev-phase) trimmed from STATE → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.1+3.2 (1st cadence implementation per D2 standing process). STATE.md keeps Phase 3.3 + 3.4 SHIPPED narrative only.

---

## 项目核心引用

- **核心价值**：AI coding harness 生态的「装配主义包管理器 + 完整三层栈方法论的可执行 engine」——routing engine v1 已实装（main-process-driven query→arbitrate→install missing→factory→spawn→ralph-loop→verbatim COMPLETE 闭合）；6+ 虚拟角色（gstack 决策层 + GSD 项目经理 + superpowers 资深工程师）/ 双职责治理 / 4 心法 / 23 招式 phase 路由 / 6 skill category，把 CLAUDE.md 协作规则机器化
- **当前关注**：v0.3.0 milestone 3/4 PROGRESS (Phase 3.1+3.2+3.3 SHIPPED 2026-05-16~17) — next: Phase 3.4 路由命中率 ≥ 85% 验收 + token budget 监控 + DEFERRED #AC (aliases.yaml dogfood entries) + #AD (install.ts package.json version read) + #AE (path traversal regex 若 surface real attack vector) 兑现 + v0.3.0 close 在望 (Phase 3.4 同日 ship + milestone archive)
- **总工期**：~10-12 周（4 milestones × 3-5 phases = 共 **17 phases** v3 重排后）
- **License**：Apache-2.0（开源 / GitHub Sponsors 兜底）
- **仓库**：`D:\GitCode\harnessed\`（Node.js + TypeScript）

---

## 当前位置（Current Position）

- **GSD phase**：✅ **Phase 4.1 SHIPPED**（2026-05-18 — dogfooding benchmark 数据采集 + 公开格式定义 R8.1 anchor + W0 backlog 3 项一次根治 + 4 D-decisions activated 闭环）+ 前置 ✅ **Phase 3.4 SHIPPED**（2026-05-17 — 路由 30/30 = 100% + 🎯 v0.3.0 MILESTONE 4/4 CLOSE）— 前置 ✅ Phase 3.3 SHIPPED (2026-05-17) + Phase 3.1/3.2 + v0.2.0/v0.1.0 milestones — 详 RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 (Phase 4.1 W0.3 D2 cadence iter 2 2026-05-18) + § ARCHIVED FROM STATE — Phase 3.1+3.2 (Phase 3.4 W2 T2.2 D2 1st cadence 2026-05-17) + § ARCHIVED FROM STATE — Phase 1.X-3.2 (Phase 3.4 W0.1 STRATEGIC 2026-05-17)
- **当前里程碑**：**v0.4.0 dogfooding benchmark + 稳定期 1/3 PROGRESS**（Phase 4.1 SHIPPED 2026-05-18；Phase 4.2 + 4.3 pending — NOT yet 3/3 ARCHIVED reserved Phase 4.3 close per sister v0.3.0 close cadence延袭）— next: Phase 4.2 co-maintainer onboarding R8.2-R8.5
- **下一 phase**：**Phase 4.2 discuss-phase 启动 prep** (R8.2 co-maintainer 招募 + R8.3 stale-bot + R8.4 公开 ADR 全集 + R8.5 GitHub Sponsors; T3 risk surface 真正 fires Phase 4.2 外部依赖 phase per sister Phase 4.1 ship retrospective; 候选启动 `/gsd-discuss-phase 4.2`)
- **状态**：✅ **Phase 4.1 SHIPPED — Wave 0+1+2 全 ship 2026-05-18** — docs/benchmarks/v0.4.md NEW 302L D-02 FULL per-task disclosure (30/30 100% accuracy 远超 ≥85% bar 15% headroom; sister Phase 3.4 SAMPLES.md § 1+2+3 frame REUSE) + docs/benchmarks/v0.4-upgrade-e2e.log NEW 122L D-03 TEXT LOG zero-dep 4-section × 2 manifests (ctx7 + gstack planner Discretion #5 install_method 多样性) + docs/CONTRIBUTING-BENCHMARK.md NEW 30L D-04 MANUAL re-run instructions + W0 backlog 3 项一次根治 (W0.1 D3 ENFORCE flip DEFERRED #AF RESOLVED + W0.3 D2 cadence iter 2 institutionalize verify M2 backlog discharge + W0.5 conditional D1 SIZE_LIMIT round 2 tighten DEFERRED #BA carry-forward Phase 4.2 W0); A7 守恒 ADR 0001-0017 main body 0 diff (T2.6 ci.yml verify NO A7 iter Phase 4.1 = pure dogfood publish NOT architectural decision); tests 701→709+ (+8) / 0 fail; single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE (NO push per CLAUDE.md commit safety; user controls); NO ADR 0018 + NO triple tag per PATTERNS § 5 risk #3 mitigation; DEFERRED #AF ✅ RESOLVED + #AG ✅ partially RESOLVED (DEFER path #BA carry)
- **进度**：15 / 17 phases 已完成 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░ 88.2%（v0.1.0 里程碑 100%；v0.2.0 里程碑 100%；🎯 **v0.3.0 里程碑 100% CLOSE**；v0.4.0 里程碑 1/3 PROGRESS — Phase 4.1 ✅）
<!-- Phase 3.1 + 3.2 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.1+3.2 (2026-05-17 W0.1 D2 ship-time T6.N first-implementation per Phase 3.4 W2 T2.2 standing process — sister Phase 1.X-3.2 second-pass cadence延袭) -->

### 各里程碑进度

| 里程碑 | Phase 完成 | 状态 | 完成时间 |
|--------|-----------|------|---------|
| v0.1.0 manifest 引擎 + research | 6/6 | ✅ Phase 1.1 + 1.2 + 1.2.5 + 1.3 + 1.4 + 1.5 done — **v0.1.0 里程碑全部完成** | 2026-05-12 ~ 2026-05-14 |
| v0.2.0 Sub-task Loop + Extension Installers | 4/4 | 🎯 **SHIPPED & ARCHIVED** — Phase 2.1 + 2.2 + 2.3 + 2.4 ship (doctor MIN 5 + EE-4 SSOT + dashboard C 路径 + audit hard-fail + Win sentinel + Wave 0 backlog 5 项); 13 ADR + 13 baseline tag accumulate; archive + audit ship | 2026-05-15 ~ 2026-05-16 |
| v0.3.0 plan-feature + checkpoint | 4/4 | 🎯 **SHIPPED & ARCHIVED** — Phase 3.1 + 3.2 + 3.3 + 3.4 全 ship (P3.1: checkpoint 引擎 + harnessed resume + compact + T4.4 closure activation 闭环 + ADR 0014; P3.2: gstack PROBE + JINJA 插值 + plan-feature 5-phase WIRED + governance.json PUSH + ADR 0015 + T4.4 closure infra 二代消费者闭环; P3.3: aliases.yaml RICH 5-field redirect (D-01) + DOCTOR-ONLY-WARN install 安静 + doctor 7th check 人读 audit (D-02) + known-good YAML manifest lazy lock (D-03) + STATE dual-SSOT 5-recurrence terminus COLLAPSE (D-04) + W0 backlog 3 项一次根治 + ADR 0016 + manifest-domain colocation 3rd consumer 闭环; **P3.4: routing 30/30 = 100% accuracy 远超 ≥85% bar 15% headroom per-tier Sonnet/Haiku/Opus 100/100/100 (D-01 + D-02) + check-token-budget.ts 48L PRIMARY helper 4th 家族成员 + doctor 8th check token budget DOCTOR-ONLY-WARN (D-03 + D-04) + W0 backlog 5 项一次根治 W0.1 STATE STRATEGIC institutionalize 4 D-decisions D1-D4 + ADR 0017 9 章节 errata**); tests 543→701+ (+158); 17 ADR + 17 baseline tag; 14 milestone tag (含 🎯 v0.3.0); schemaVersion 7→13 surface; archive `.planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md` triplet (MILESTONE-AUDIT inaugurate milestones/ subdir upgrade); next: v0.4.0 discuss-phase 启动 | 2026-05-16 ~ 2026-05-17 |
| v0.4.0 dogfooding + 稳定期 | 1/3 | 🚧 **PROGRESS** — Phase 4.1 ✅ SHIPPED 2026-05-18 (dogfooding benchmark 数据采集 + 公开格式定义 R8.1 anchor; docs/benchmarks/v0.4.md NEW 302L D-02 FULL + docs/benchmarks/v0.4-upgrade-e2e.log NEW 122L D-03 TEXT LOG + docs/CONTRIBUTING-BENCHMARK.md NEW 30L D-04 MANUAL + W0 backlog 3 项一次根治 + 4 D-decisions activated 闭环 + single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL); Phase 4.2 + 4.3 pending | 2026-05-18 ~ - |

### 已完成 phase ship 历史 (W0.2 — README sync SSOT)

> 与 README.md L46-56 一一对应; grep gate `^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped` 计 count 与 README 等

<!-- Phase 3.3 + 3.4 narrative archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 (2026-05-18 Phase 4.1 W0.3 D2 cadence iter 2 per standing process — M2 backlog discharge institutionalize verify 2nd-iter beyond 1st-implementation) -->
- **Phase 4.1 shipped** ✅ (2026-05-18) — dogfooding benchmark 数据采集 + 公开格式定义 R8.1 anchor (docs/benchmarks/v0.4.md NEW 302L D-02 FULL per-task disclosure 30/30 100% + docs/benchmarks/v0.4-upgrade-e2e.log NEW 122L D-03 TEXT LOG zero-dep 4-section × 2 manifests + docs/CONTRIBUTING-BENCHMARK.md NEW 30L D-04 MANUAL re-run + W0 backlog 3 项一次根治 W0.1 D3 ENFORCE flip DEFERRED #AF RESOLVED + W0.3 D2 cadence iter 2 institutionalize verify M2 discharge + W0.5 conditional D1 SIZE_LIMIT DEFER #BA carry); v0.4.0 milestone 1/3 PROGRESS (NOT yet 3/3 ARCHIVED reserved Phase 4.3 close); NO ADR 0018 + NO triple tag per PATTERNS § 5 risk #3; single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL (NO push)
- **Phase 3.4 shipped** ✅ (2026-05-17) — routing 30/30 = 100% per-tier + doctor 8th check + W0 5 项一次根治 + ADR 0017 (archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4)
- **Phase 3.3 shipped** ✅ (2026-05-17) — aliases.yaml RICH + DOCTOR-ONLY-WARN install + doctor 7th check + known-good YAML + STATE dual-SSOT COLLAPSE + ADR 0016 (archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4)
- **Phase 3.2 shipped** ✅ (2026-05-17) — gstack 前缀探测 PROBE doctor 6th check + workflow JINJA 插值 + plan-feature 5-phase WIRED + governance PUSH
- **Phase 3.1 shipped** ✅ (2026-05-16) — checkpoint 引擎 + harnessed resume 12th CLI + compact 75% placeholder
- **Phase 2.4 shipped** ✅ (2026-05-16) — doctor 完整版 + EE-4 4 维 SSOT + dashboard C 路径
- **Phase 2.3 shipped** ✅ (2026-05-16) — extension MVP + karpathy SKILL-ONLY + 30/30 routing 100%
- **Phase 2.2 shipped** ✅ (2026-05-15) — execute-task workflow + SDK 0.3.142 + per-phase model tier
- **Phase 2.1 shipped** ✅ (2026-05-15) — 6 install method runtime-ready + transparency CI gate
- **Phase 1.5 shipped** ✅ (2026-05-14) — DAG resolver + Semantic Router L2 stub + 23 招式 routing
- **Phase 1.4 shipped** ✅ (2026-05-13) — routing engine v1 + AgentDefinition factory
- **Phase 1.3 shipped** ✅ (2026-05-13) — categorization schema + decision_rules.yaml v1
- **Phase 1.2.5 architecture revision shipped** ✅ (2026-05-12) — ADR 0006 wedge 升级
- **Phase 1.2 shipped** ✅ (2026-05-12) — cli-npm + mcp-stdio runtime + 5 CLI subcommands
- **Phase 1.1 + 1.1.1 hotfix shipped** ✅ (2026-05-12) — schema v1 frozen + 10 manifest + 3 ADR

---

## 进行中（In Progress）

[当前: ✅ **Phase 4.1 SHIPPED** — v0.4.0 milestone 1st phase 完成 2026-05-18 + single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE (NO push pending user explicit approval); next phase pending: Phase 4.2 discuss-phase 启动 (R8.2-R8.5 co-maintainer 招募 + stale-bot + ADR 全集 + GitHub Sponsors)]

---

## 待办（按优先级）— Phase 4.2 启动 window

### P0 — Phase 4.2 discuss-phase 启动 prep

1. ⏳ **Phase 4.2 discuss-phase 启动** (R8.2 co-maintainer 招募 + R8.3 stale-bot + R8.4 公开 ADR 全集 + R8.5 GitHub Sponsors 启用; T3 risk surface 真正 fires Phase 4.2 外部依赖 phase — v0.4.0 节奏 evaluate explicit 调整期望 per sister Phase 4.1 ship retrospective; 候选启动 `/gsd-discuss-phase 4.2`)
2. ⏳ **User push approval** for tags LOCAL created:
   - Phase 3.4 W2 T2.12: adr-0017-accepted + v0.3.0-alpha.4-routing + 🎯 v0.3.0 (already pushed 2026-05-17 per CI run 25992781663)
   - Phase 4.1 W2 T2.7: v0.4.0-alpha.1-benchmark single baseline tag LOCAL (pending push approval per CLAUDE.md commit safety: NEVER push without user explicit request)
3. ⏳ **User push approval** for Phase 4.1 W2 commits T2.1-T2.7 (6 atomic commits) per CLAUDE.md commit safety

### P1 — DEFERRED carry-forward (Phase 4.1 ship 后)

4. **DEFERRED #BA** D1 SIZE_LIMIT round 2 tighten 200→150 — Phase 4.2 W0 LOW priority defensive (post-W0.3 STATE 143-150L exceeded ≥10L headroom threshold per § 7.1 decision tree; W0.5 DEFER path active)
5. **DEFERRED #BB** T3 1 phase/day cadence assessment — Phase 4.2 co-maintainer 招募 EXTERNAL DEPENDENCY phase (T3 risk surface真正 fires Phase 4.2; v0.4.0 节奏 evaluate explicit 调整期望)
6. **DEFERRED #BC** v0.5+ benchmark expand evaluation — IF Phase 4.1 dogfood reveals miss case NOT covered by current 30 SAMPLES.md → re-evaluate D-01 REJECT EXPAND new mining; currently 30/30 100% routing PASS no signal
7. **DEFERRED #BD** regex 2-pass validation pattern lock — plan-checker iter 2 residual semantic synonym `L1-N`/`=N+1L` arithmetic missed by iter 1 literal regex; future plan-checker iterations use 2-pass (literal + arithmetic-aware) regex validation
8. **DEFERRED #AH** W0.4 path traversal regex hardening — Phase 4.0+ W0 (if external user input arrives — currently sole consumer is project maintainer; real attack surface near-zero per spike outcome)
9. **EE-4 BLOCKER auto-spawn rerun** — v0.4.0 后 evaluate (Phase 2.4 D-02 down-scope carry-forward unchanged)
10. **userSpawn session_id capture** (Phase 3.1 DEFERRED #2) — v0.4.0+ if real userSpawn demand (fresh-session fallback per B-02 still acceptable)
- **DEFERRED #AF** ✅ RESOLVED Phase 4.1 W0 T0.2 (D3 gate ENFORCE flip warn-only round 1 → ENFORCE round 2)
- **DEFERRED #AG** ✅ partially RESOLVED Phase 4.1 W0 T0.3 (W0.5 CONDITIONAL — DEFER path active → #BA carry-forward Phase 4.2 W0)

### P2 — 跨里程碑预留 (v0.4+ 议题)

8. `mutually-exclusive skill groups` 元模型 (v0.2 设计 pack schema 时定 — 推 v0.4+)
9. gstack-2 / GSD-2 v2 重写迁移策略 (v1.0+ 议题，schema 留迁移接口)
10. sigstore / cosign 签名集成 (v0.4+ 议题，v0.1-0.3 先用 commit hash)
11. `requires_secret` 字段 (API key 注入声明) — v0.2 schema 增强候选 (F14 子决策；推 v0.4+)
12. `command_prefix_strategy` 字段 (gstack 前缀可配置) — v0.2 schema 增强候选 (F14 子决策；推 v0.4+)
13. `--force` flag for install idempotent_check 重装语义 (phase 2.1+；当前 already-installed = exit 0 + skip；推 v0.4+)

---

## 关键提醒（⚠️ 不可忽略）

1. **Cross-OS 测试 Day 1**（不是 v0.4）——CI config 已在 phase 1.1 落地（ci.yml）；phase 1.2 起 CI 红了必须修，不允许 disable Windows
2. **路由命中率 30 样本必须覆盖 Haiku/Sonnet/Opus 各 ≥ 8**——Haiku 命中率显著低于 Sonnet（R03 实证）；phase 1.4 30 sample × 6 category 100% hit (单 model 单环境基线，phase 3.4 v0.3.0 升级多 model × stability 验收)
3. **bus factor 1 真实风险**——Avelino 论文实证单 maintainer 年掉队率 36%，6 个月 co-maintainer 窗口非装饰
4. **Karpathy ≤200L hard limit**——B-06 + B-26 + Phase 3.4 D-04 explicit "no B-03 5% tolerance"; doctor.ts 195L borderline (Phase 3.4 W1 Option A inline shrink locked)
5. **biome lint preempt before commit**（project memory `feedback_biome-preempt.md` 3 CI-red recurrences Phase 2.1.1 / 2.2 / 2.3）: 任何 TS/JS commit 前必跑 `pnpm exec biome check --write`
6. **STATE.md archive cadence institutionalize** (Phase 3.4 W0.1 D2): 每 phase ship 时 T6.N step 必 trim prev-prev-phase narrative → RETROSPECTIVE.md Phase N-2 § ARCHIVED FROM STATE; D3 gate `scripts/check-state-archive-stale.mjs` 3 rules warn-only round 1 (ENFORCE flip Phase 3.5/v0.4.0)
7. **A7 守恒**——ADR 0001-0016 main body 永久 0 diff; ci.yml A7 step iterate Phase N ship 时 add new ADR N+1 reference

---

## 累积上下文（Decisions / Todos / Blockers）

### 关键决策记录（最近 phase + 长期约束 — 历史决策已 archive 进 RETROSPECTIVE.md）

| 决策 | 来源 | 备注 |
|------|------|------|
| 路由 B+C 混合 + 85% 验收 | SPEC § 5.1 + R03 § 2.4 | Sonnet 100% / Haiku 84% 实证；Phase 3.4 ✅ 30/30 = 100% 远超 ≥85% bar 15% headroom |
| ADR 0001-0017 main body 永久守恒（A7） | F26 + ci.yml iterate 17 tag | 任一字符 diff = CI fail; Phase 3.4 W2 T2.7 iter 1-0016 → 1-0017 |
<!-- Phase 3.3 D-04 (b) COLLAPSE + schemaVersion 13-surface + Phase 3.4 5 D-decision rows (D-01/D-02/D-03/D-04 + W0.1 STRATEGIC) archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 3.3+3.4 (2026-05-18 Phase 4.1 W0.3 D2 cadence iter 2) -->

> 完整决策表 (Phase 1.1-3.4) 已 archive → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 1.X-3.2 (Phase 3.4 W0.1 STRATEGIC 2026-05-17) + § ARCHIVED FROM STATE — Phase 3.1+3.2 (Phase 3.4 W2 T2.2 D2 1st cadence 2026-05-17) + § ARCHIVED FROM STATE — Phase 3.3+3.4 (Phase 4.1 W0.3 D2 cadence iter 2 2026-05-18)

### 未决问题（v0.4+ 议题）

1. `planning-with-files` 与 `superpowers/writing-plans` 互斥语义（v0.1 dogfooding 观察 — defer v0.4+）
2. gstack-2 / GSD-2 v2 重写迁移（v1.0+ 议题）
3. sigstore / cosign 签名（v0.4+ 议题）
4. `mutually-exclusive skill groups` 元模型（v0.2 设计 pack schema 时定 — 推 v0.4+）
5. token budget 监控 UX（v0.3 设计 — Phase 3.4 W1 落地 doctor 8th check）
6. "用户 10 秒手动覆盖路由错误" UX 量化（v0.4 benchmark 时定）

### Blockers

[当前无 — ✅ Phase 4.1 SHIPPED 2026-05-18 v0.4.0 milestone 1/3 PROGRESS; single baseline tag `v0.4.0-alpha.1-benchmark` LOCAL CREATE pending user push approval per CLAUDE.md commit safety]

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
