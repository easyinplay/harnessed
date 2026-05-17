# harnessed STATE

> 项目记忆 · 跨 session 一致性的 SSOT
> Phase 3.3 W0 T0.1 (D-04 (b) COLLAPSE locked, 5-recurrence terminus): L4 `> Status:` frontmatter + L5 `> 最后更新：` lines deleted — "当前位置" block (L21-27) is now the single SoT for phase ship event log. Freshness gate `scripts/check-transparency-verdicts.mjs` extends with STATE_POSITION_RE OR-fallback (full-file scan) so STATE.md acceptance check still passes.
> Phase 3.4 W0.1 STRATEGIC (D1 single-SoT institutionalize, 2026-05-17): STATE.md 723L → ≤200L round 1 — prev-prev-phase narrative (L96-329 已完成 milestone + L518-683 Phase 1.5/2.0/2.3/2.4 Prereq Notes ~400L) archived to RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 1.X-3.2. D3 gate `scripts/check-state-archive-stale.mjs` warn-only round 1 (3 rules: size ≤200 / 关键决议 ship 总结 ≤1 / W-N errata literal 禁). D2 ship-time T6.N cadence integrated (Plan 03 W2 T2.3 trim prev-prev-phase narrative as standing process).

---

## 项目核心引用

- **核心价值**：AI coding harness 生态的「装配主义包管理器 + 完整三层栈方法论的可执行 engine」——routing engine v1 已实装（main-process-driven query→arbitrate→install missing→factory→spawn→ralph-loop→verbatim COMPLETE 闭合）；6+ 虚拟角色（gstack 决策层 + GSD 项目经理 + superpowers 资深工程师）/ 双职责治理 / 4 心法 / 23 招式 phase 路由 / 6 skill category，把 CLAUDE.md 协作规则机器化
- **当前关注**：v0.3.0 milestone 3/4 PROGRESS (Phase 3.1+3.2+3.3 SHIPPED 2026-05-16~17) — next: Phase 3.4 路由命中率 ≥ 85% 验收 + token budget 监控 + DEFERRED #AC (aliases.yaml dogfood entries) + #AD (install.ts package.json version read) + #AE (path traversal regex 若 surface real attack vector) 兑现 + v0.3.0 close 在望 (Phase 3.4 同日 ship + milestone archive)
- **总工期**：~10-12 周（4 milestones × 3-5 phases = 共 **17 phases** v3 重排后）
- **License**：Apache-2.0（开源 / GitHub Sponsors 兜底）
- **仓库**：`D:\GitCode\harnessed\`（Node.js + TypeScript）

---

## 当前位置（Current Position）

- **GSD phase**：✅ **Phase 3.3 SHIPPED**（2026-05-17 — aliases.yaml RICH 5-field redirect + metadata (D-01 schema 12th surface + Karpathy YAGNI 5 field maxLength 500 DOS cap + ISO-date pattern sister Phase 3.2 W2 Rule 1 lesson) + DOCTOR-ONLY-WARN install 安静重定向 (D-02 install path 1-line surgical resolveAlias pre-manifest-lookup; doctor 7th check checkDeprecations 人读 audit table — install path NO console.warn 沉默 sister Unix tool 习俗) + versions/<harnessed-ver>-known-good.yaml YAML manifest lazy-load 版本 lock (D-03 schema 13th surface + per-version Map memoize + --known-good flag lazy consume Karpathy YAGNI 0 cost when flag not used) + STATE dual-SSOT 5-recurrence terminus COLLAPSE (D-04 (b) LOCKED; L4 frontmatter + L5 最后更新 双删 + STATE_POSITION_RE OR-fallback freshness gate extend) + Wave 0 backlog 3 项一次根治 (W0.1 STATE COLLAPSE 5-recurrence terminus + W0.2 dashboard-sse fix path (a) random ephemeral port DASHBOARD_PORT env injection sister Node net.createServer({port:0}) MDN std + W0.3 schemaVersion 12+13 surface manifest-domain colocation decision + T0.5 planFeature.v1 11th surface backfill sister Phase 3.2 W2 T2.2 b875e21 latent stale claim surgical fix); F1-F8 8/8 acceptance bar; ADR 0016 9 章节 errata accepted; 16 ADR + 16 baseline tag; manifest-domain schema colocation 3rd 消费者闭环 (checkpoint-domain Phase 3.1 + workflow-domain Phase 3.2 + manifest-domain Phase 3.3 cross-phase 模式延袭); v0.3.0 MILESTONE 3/4 PROGRESS）— 前置 ✅ **Phase 3.2 SHIPPED**（2026-05-17 — gstack 前缀探测 PROBE doctor 6th check + workflow `invokes` JINJA `{{prefix}}` 模板替换 + plan-feature 5-phase WIRED reference + governance.json PUSH veto halt_workflow + ADR 0015 9 章节）；前置 ✅ **Phase 3.1 SHIPPED**（2026-05-16 — checkpoint 引擎 TEMPLATE + archive 双轨 + harnessed resume 12th CLI + compact 75% placeholder + T4.4 closure infra activation 闭环 D-04 WIRE-IN 实证 + ADR 0014 9 章节）；前置 ✅ **Phase 2.4 SHIPPED**（2026-05-16）+ 🎯 **v0.2.0 MILESTONE 4/4 SHIPPED & ARCHIVED**（2026-05-16）；前置 ✅ **Phase 2.3 SHIPPED** 2026-05-16；前置 ✅ **Phase 2.2 SHIPPED** 2026-05-15；前置 ✅ Phase 2.1 SHIPPED；前置 ✅ v0.1.0 SHIPPED & ARCHIVED（6/6 phase；git tag `v0.1.0`）
- **当前里程碑**：v0.3.0 plan-feature workflow + checkpoint（**Phase 3.1 + Phase 3.2 + Phase 3.3 SHIPPED 3/4**）— next: Phase 3.4 路由命中率 ≥ 85% 验收 + token budget 监控
- **下一 phase**：**Phase 3.4 execute-phase 启动** (discuss + plan-phase 已 ship 2026-05-17, v0.3.0 close phase) — 4 D-decision lock + 3 waves W0-W2 + 23 atomic tasks (W0 5 + W1 6 + W2 12); Wave A R1 PATTERNS 391L 17 targets 100% analog ~83% reuse + R2 RESEARCH 1094L 18 sections HIGH confidence; Wave B planner PLAN.md 624L + task_plan.md 1132L; Wave C plan-checker iter 2 VERIFICATION PASSED (iter 1 = 3 BLOCKER + 5 WARNING → orchestrator tier-call 7 fix + W-7 REJECT risk note; iter 2 EE-4 4/4 PASS RELAX baseline + 10/10 carry-forward hold + 0 new issues); key Phase 3.2 latent bug carry-forward W0.5 SAMPLES.md 30-row mining REAL HISTORICAL; key W0.1 STRATEGIC STATE.md ≤200L round 1 institutionalize 第 6 phase 沿袭; 候选启动 `/gsd-execute-phase 3.4`
- **状态**：✅ **Phase 3.3 SHIPPED** — Wave 0+1+2 全 ship 2026-05-17；A7 守恒 ADR 0001-0015 main body 0 diff（T2.9 ship-time verify PASS）；CI 3-OS green；tests 623→659+ (+36) + 4 skipped；ADR 0016 9 章节 errata accepted；schemaVersion 11→13 surface (aliases.v1 + known-good.v1)；前置 Phase 3.1 W3 T4.4 closure infra activation 闭环 + Phase 3.2 W2 governance.json PUSH 二代消费者 闭环 + Phase 3.3 W1 manifest-domain colocation 3rd consumer 闭环
- **进度**：13 / 17 phases 已完成 ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░ 76.5%（v0.1.0 里程碑 100%；v0.2.0 里程碑 100%；v0.3.0 里程碑 75% — Phase 3.1 + 3.2 + 3.3 ✅）
<!-- Phase 2.4 关键决议 ship 总结 9 项 archived to RETROSPECTIVE.md Phase 2.4 milestone retrospective § "Key decisions shipped" (2026-05-17 sister review H2 absorb — sister "archive 纪律" institutionalize; STATE.md 仅保 last shipped phase 当前位置 single SoT，历史 phase 总结进 RETROSPECTIVE) -->

### 各里程碑进度

| 里程碑 | Phase 完成 | 状态 | 完成时间 |
|--------|-----------|------|---------|
| v0.1.0 manifest 引擎 + research | 6/6 | ✅ Phase 1.1 + 1.2 + 1.2.5 + 1.3 + 1.4 + 1.5 done — **v0.1.0 里程碑全部完成** | 2026-05-12 ~ 2026-05-14 |
| v0.2.0 Sub-task Loop + Extension Installers | 4/4 | 🎯 **SHIPPED & ARCHIVED** — Phase 2.1 + 2.2 + 2.3 + 2.4 ship (doctor MIN 5 + EE-4 SSOT + dashboard C 路径 + audit hard-fail + Win sentinel + Wave 0 backlog 5 项); 13 ADR + 13 baseline tag accumulate; archive + audit ship | 2026-05-15 ~ 2026-05-16 |
| v0.3.0 plan-feature + checkpoint | 3/4 | 🚀 **PROGRESS — Phase 3.1 + 3.2 + 3.3 SHIPPED** (P3.1: checkpoint 引擎 + harnessed resume + compact + T4.4 closure activation 闭环 + ADR 0014; P3.2: gstack PROBE + JINJA 插值 + plan-feature 5-phase WIRED + governance.json PUSH + ADR 0015 + T4.4 closure infra 二代消费者闭环; **P3.3: aliases.yaml RICH 5-field redirect (D-01) + DOCTOR-ONLY-WARN install 安静 + doctor 7th check 人读 audit (D-02) + known-good YAML manifest lazy lock (D-03) + STATE dual-SSOT 5-recurrence terminus COLLAPSE (D-04) + W0 backlog 3 项一次根治 + ADR 0016 9 章节 errata + manifest-domain colocation 3rd consumer 闭环**); tests 543→659+ (+116); 16 ADR + 16 baseline tag; schemaVersion 7→13 surface; next: Phase 3.4 路由命中率 ≥ 85% 验收 + token budget 监控 + DEFERRED #AC/#AD/#AE 兑现 | 2026-05-16 ~ 2026-05-17 |
| v0.4.0 dogfooding + 稳定期 | 0/3 | Not started | - |

### 已完成 phase ship 历史 (W0.2 — README sync SSOT)

> 与 README.md L46-56 一一对应; grep gate `^[-*]?\s*\*?\*?Phase [1-9]\.[0-9]\*?\*?.*[Ss]hipped` 计 count 与 README 等

- **Phase 3.3 shipped** ✅ (2026-05-17) — aliases.yaml RICH 5-field redirect + DOCTOR-ONLY-WARN install 安静 + doctor 7th check + known-good YAML manifest lazy lock + STATE dual-SSOT 5-recurrence terminus COLLAPSE
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

[当前: Phase 3.4 W0 execute-phase 启动 — 5 atomic tasks T0.1-T0.5 backlog absorb; T0.1 STRATEGIC STATE.md role + archive cadence institutionalize 进行中 (本次 trim 体现 D1+D2+D3+D4 4 D-decisions LOCKED)]

---

## 待办（按优先级）— v0.3.0 close window

### P0 — Phase 3.4 W0+W1+W2 execute-phase

1. ⏳ **Phase 3.4 W0 (5 atomic)**: T0.1 STATE institutionalize (本次) → T0.2 install.ts pkg.version → T0.3 versions/0.3.0-known-good.yaml 8 entries → T0.4 path traversal spike DEFER + 1 fixture → T0.5 SAMPLES.md 30-row REAL HISTORICAL
2. ⏳ **Phase 3.4 W1 (6 atomic)**: check-token-budget.ts NEW ≤40L + doctor.ts 8th check Option A inline shrink (200L exact) + 5 tests 含 routing harness ≥26/30
3. ⏳ **Phase 3.4 W2 (12 atomic)**: ADR 0017 9 章节 + STATE/RETRO/ROADMAP/README/SPEC 续编 + ci.yml A7 iter 1-0017 + .planning/milestones/v0.3.0-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md 三件 archive + DOGFOOD-T2.X + triple tag adr-0017-accepted + v0.3.0-alpha.4-routing + 🎯 v0.3.0

### P1 — v0.4.0 启动准备 (Phase 3.4 ship 后)

4. **v0.4.0 discuss-phase 启动** (R8.1 dogfooding benchmark + R8.2 co-maintainer 招募 + plan-feature 真接外部 gsd-* spawn dogfood per ROADMAP R8.1+R8.2 carry)
5. **DEFERRED #AF** D3 gate ENFORCE flip timing — Phase 3.5 W0 OR v0.4.0 W0 first task (sister Phase 2.1 transparency gate cadence)
6. **DEFERRED #AG** D1 STATE.md ≤150L tighten — v0.4.0+ (round 1 target ≤200L warn-only complete; v0.4.0+ tighten SIZE_LIMIT to 150L per D3 Rule 1 future flip)
7. **DEFERRED #AH** W0.4 path traversal regex hardening — Phase 4.0 W0 (if external user input arrives — currently sole consumer is project maintainer, real attack surface near-zero per spike outcome)

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
| 路由 B+C 混合 + 85% 验收 | SPEC § 5.1 + R03 § 2.4 | Sonnet 100% / Haiku 84% 实证 |
| Phase 3.4 D-01 REAL HISTORICAL 30 sample mining | Phase 3.4 CONTEXT § Decisions | 不允许 SYNTHETIC/MIXED sneak; per-row source_commit field non-empty MANDATORY |
| Phase 3.4 D-02 RUN ENGINE per-sample arbitrate dispatch | Phase 3.4 CONTEXT § Decisions | 不允许 DRY-RUN/FULL E2E sneak; sister Phase 2.3 W4 samples-30 harness 100% 复刻 |
| Phase 3.4 D-03 BUFFER /4 estimateTokens zero-dep | Phase 3.4 CONTEXT § Decisions | 不允许 tiktoken npm dep; sister Phase 3.1 D-01 enforceBudget precedent reuse |
| Phase 3.4 D-04 DOCTOR WARN (status='warn' ≠ fail) | Phase 3.4 CONTEXT § Decisions | 不允许 CI FAIL/SILENT LOG sneak; sister Phase 3.3 D-02 DOCTOR-ONLY-WARN install path 一致 |
| Phase 3.4 W0.1 STRATEGIC institutionalize 4 D-decisions | Phase 3.4 W0.1 KICKOFF | D1 single-SoT trim + D2 ship-time T6.N cadence + D3 3-rules gate warn-only round 1 + D4 ship-process integrate |
| Phase 3.3 D-04 (b) COLLAPSE STATE dual-SSOT 5-recurrence terminus | Phase 3.3 W0.1 | L4 frontmatter + L5 最后更新 双删; STATE_POSITION_RE OR-fallback freshness gate extend |
| schemaVersion 13-surface manifest-domain colocation 3rd consumer | Phase 3.3 D-03 + W0.3 | aliases.v1 (12th) + known-good.v1 (13th); per-version Map memoize; --known-good flag lazy consume |
| ADR 0001-0016 main body 永久守恒（A7） | F26 + ci.yml iterate 16 tag | 任一字符 diff = CI fail |

> 完整决策表 (Phase 1.1-3.2) 已 archive → RETROSPECTIVE.md § ARCHIVED FROM STATE — Phase 1.X-3.2 (W0.1 D2 first ship-time implementation 2026-05-17)

### 未决问题（v0.4+ 议题）

1. `planning-with-files` 与 `superpowers/writing-plans` 互斥语义（v0.1 dogfooding 观察 — defer v0.4+）
2. gstack-2 / GSD-2 v2 重写迁移（v1.0+ 议题）
3. sigstore / cosign 签名（v0.4+ 议题）
4. `mutually-exclusive skill groups` 元模型（v0.2 设计 pack schema 时定 — 推 v0.4+）
5. token budget 监控 UX（v0.3 设计 — Phase 3.4 W1 落地 doctor 8th check）
6. "用户 10 秒手动覆盖路由错误" UX 量化（v0.4 benchmark 时定）

### Blockers

[当前无 — Phase 3.4 W0 execute-phase 顺利启动]

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
