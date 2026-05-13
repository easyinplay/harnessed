# harnessed STATE

> 项目记忆 · 跨 session 一致性的 SSOT
> 最后更新：2026-05-13（**phase 1.4 SHIPPED** — routing engine v1 + AgentDefinition factory + research workflow E2E + 30 sample 100% hit；C1-C8 8/8 acceptance bar；ADR 累积 7 → 8；baseline tag 7 → 8；tests 235+1 → 291+2 skipped；ready for phase 1.5）

---

## 项目核心引用

- **核心价值**：AI coding harness 生态的「装配主义包管理器 + 完整三层栈方法论的可执行 engine」——routing engine v1 已实装（main-process-driven query→arbitrate→install missing→factory→spawn→ralph-loop→verbatim COMPLETE 闭合）；6+ 虚拟角色（gstack 决策层 + GSD 项目经理 + superpowers 资深工程师）/ 双职责治理 / 4 心法 / 23 招式 phase 路由 / 6 skill category，把 CLAUDE.md 协作规则机器化
- **当前关注**：v0.1.0（manifest 引擎 + research workflow，3-5 周 v3 重排范围 — phase 1.4 ship 后核心 wedge: routing engine v1 + research workflow E2E + 30 sample 100% hit + 7 接口契约 frozen for phase 1.5）
- **总工期**：~10-12 周（4 milestones × 3-5 phases = 共 **17 phases** v3 重排后）
- **License**：Apache-2.0（开源 / GitHub Sponsors 兜底）
- **仓库**：`D:\GitCode\harnessed\`（Node.js + TypeScript）

---

## 当前位置（Current Position）

- **GSD phase**：v0.1.0 Phase 1.4 ✅ **COMPLETED — SHIPPED 2026-05-13**（含 routing engine v1 主流程 + AgentDefinition factory 1:1 contract + research workflow E2E + 30 sample 命中率 100.0%；前置 phase 1.1 + 1.1.1 / 1.2 + 1.2.1 / 1.2.5 / 1.3 + 1.3.1 已 ship）
- **当前里程碑**：v0.1.0
- **下一 phase**：Phase 1.5（DAG resolver + Semantic Router L2 + engineering category routing rules + mattpocock 23 招式 phase routing schema）— phase 1.4 已落地 routing engine v1 (`src/routing/{engine.ts 170L, agentDefinition.ts 148L, systemPrompt.ts 43L}`) + research workflow E2E (`src/cli/research.ts` + 9th register fn) + SAMPLES.md 30 sample inline truth table + 8 接口契约 frozen for phase 1.5（详 `.planning/phase-1.4/PLAN.md` § 4 + VERIFICATION.md § 2）
- **状态**：✅ **Ready for Phase 1.5**
- **进度**：5 / 17 phases 已完成 ▓▓▓▓▓░░░░░░░░░░░░ 29.4%

### 各里程碑进度

| 里程碑 | Phase 完成 | 状态 | 完成时间 |
|--------|-----------|------|---------|
| v0.1.0 manifest 引擎 + research | 5/6 | ✅ Phase 1.1 + 1.2 + 1.2.5 + 1.3 + 1.4 done; Phase 1.5 待执行 | 2026-05-12 (P1.1+P1.2+P1.2.5) / 2026-05-13 (P1.3+P1.4) |
| v0.2.0 Sub-task Loop + Extension Installers | 0/4 | Not started | - |
| v0.3.0 plan-feature + checkpoint | 0/4 | Not started | - |
| v0.4.0 dogfooding + 稳定期 | 0/3 | Not started | - |

### 下一步行动

1. ✅ ~~Phase 1.1 全 47 子任务完成~~ — 2026-05-12 ship
2. ✅ ~~ADR 0001 / 0002 / 0003 全部 accepted~~ — schema v1 frozen
3. ✅ ~~两个 local tag 打好~~ — `adr-0001-accepted` + `v0.1.0-alpha.1-schema-frozen`（已 push 到 origin）
4. ✅ ~~A4 acceptance bar~~ — CI run 25686045249 @ 92b355c 三平台全绿；**Phase 1.1 全 8/8 ✅**
5. ✅ ~~Phase 1.1.1 hotfix~~ — 9 项 paranoid review fixes shipped (B1+B2+M1+H1-H7)；tests 71→89；ADR 0001/0002 不动 (A7 守恒)
6. ✅ ~~Phase 1.2 SHIPPED~~ — 2026-05-12；installer runtime ready；B1'-B9' 9/9 acceptance bar；ADR 累积 5；tests 89→202+1 skipped
7. ✅ ~~Phase 1.2.1 hotfix~~ — 2026-05-12；B5' CI fail fix (commit `bad2f20` — `set +o pipefail` in ok_or_dryrun helper)；CI run 25721497734 三平台全绿；**B5' acceptance bar 实测达成**（见 phase-1.2/progress.md § B F32）
8. ✅ ~~Phase 1.2.5 architecture revision SHIPPED~~ — 2026-05-12；ADR 0006 wedge 重定位（"装配主义包管理器" → "完整三层栈方法论的可执行 engine"）；8 支柱 100% capture lock + 5 P0 决策 lock；6 baseline tag 全部加入 A7 守恒 iterate；ROADMAP v3 重排 16 → 17 phase（加 phase 1.2.5 + phase 1.5）；不动已 ship 代码 (A7 守恒)
9. ✅ ~~Phase 1.3 SHIPPED~~ — 2026-05-13；base profile + categorization schema + decision_rules.yaml v1；B1-B8 8/8 acceptance bar；ADR 累积 7（加 0007 errata）；baseline tag 5 → 7（加 adr-0006-accepted retag → 3e24c16 + adr-0007-accepted）；tests 202+1 → 235+1 skipped (+33)；含 phase 1.3.1 hotfix bundle（F37/F38/F39 — sister review patch round 6/8 applied + 2 deferred）；详 `.planning/phase-1.3/{progress.md, VERIFICATION.md, PERF-ATTRIBUTION.md}`
10. ✅ ~~main agent tag `v0.1.0-alpha.3-base-profile`~~ — pushed
11. ✅ ~~Phase 1.4 SHIPPED~~ — 2026-05-13；routing engine v1 + AgentDefinition factory + research workflow E2E + 30 sample 100.0% hit (**expected behavior match**；specific rule match 21/30 = 70% — 9 plan-phase expected fallback/fallthrough：engineering 5/5 v1 占位 0 rules 走 fallback_supervisor + 4 array trigger v1 miss fallthrough；array semantic match 升级推 phase 1.5 DAG resolver — sister review T1 transparency strengthening)；C1-C8 8/8 acceptance bar；ADR 累积 8（加 0008 errata 含 H1a perf transparency + M1 yaml path migration + R6 engineering category 推 phase 1.5）；baseline tag 7 → 8（加 adr-0008-accepted）；tests 235+1 → 291+2 skipped (+56)；CI run 25804037789 @ 8f56514 + 25805032247 @ fe97a72 三平台全绿；详 `.planning/phase-1.4/{progress.md, VERIFICATION.md}`
12. ✅ **main agent tag `v0.1.0-alpha.4-routing-engine` pushed** — fe97a72；4 milestone tag 累积（alpha.1-schema-frozen / alpha.2-installer-runtime / alpha.3-base-profile / alpha.4-routing-engine）
13. ⏳ **进入 Phase 1.5 plan-phase**（DAG resolver + Semantic Router L2 + engineering category routing rules + mattpocock 23 招式 phase routing schema）

---

## 已完成（Completed）

- ✅ **Phase 1.4 SHIPPED**（2026-05-13）
  - 21 atomic 子任务全部完成（Wave 0-7 跑完；详 `.planning/phase-1.4/progress.md` § A.4）
  - **Acceptance bar C1-C8 8/8** ✅
    - C1 main-process-driven routing engine 实装 — `engine.ts` 170L ≤ 200L + ≥ 10 unit cell (12 实测) + verbatim COMPLETE 闭合 (Wave 6 CI verify run 25804037789 三平台全绿)
    - C2 AgentDefinition factory 实装 — `agentDefinition.ts` 148L ≤ 150L + 12 字段 1:1 contract + 4 typed error class
    - C3 6 category routing rules MVP execute — 30 sample 命中率 100.0% (30/30) ≥ 85% baseline；design/content/testing/search/meta 全 5/5；engineering 全 fallback_supervisor
    - C4 research workflow E2E — `research.ts` 93L ≤ 100L + `cli.ts` 9th register fn + integration test +3 mock cell + 1 real-spawn skipIf gate
    - C5 systemPrompt verbatim COMPLETE — `systemPrompt.ts` 43L ≤ 80L + 1:1 对齐 contract § 5.4 + D-18 enforce
    - C6 30 真实查询样本路由命中率 ≥ 85% — 实测 100.0% (30/30) ✅；per-category 全 5/5；4 F42 fallthrough corrected
    - C7 Cross-OS CI 三平台全绿 + A7 step iter 1-8 ✅ (run 25804037789 @ 8f56514；macOS 1m18s / Win 58s / Ubuntu 36s)
    - C8 ADR 0008 errata accepted + adr-0008-accepted tag pushed (172L 6-section)
  - **8 wave 完整跑完**：Wave 0 ADR 0008 errata + ci.yml A7 iter 1-8 / Wave 1 spike main-process query() API 实证 + SPIKE-REPORT 7 anchor decisions / Wave 2 engine.ts + agentDefinition.ts + systemPrompt.ts 实装 / Wave 3 engine + agentDefinition unit (+21 cell) / Wave 4 research workflow E2E sub-routing / Wave 5 SAMPLES.md + 30-sample integration test (Pattern P) / Wave 6 cross-OS CI verify (T7.3 perf attribution 跳过 — routing engine 不调 manifest validate hot path 0 perf 影响) / Wave 7 docs + ship
  - **3 routing 文件**：`src/routing/engine.ts`(170L Pattern N — 主流程编排) + `src/routing/agentDefinition.ts`(148L 12 字段 + 4 typed error + 4 心法 prepend D1.4-14) + `src/routing/systemPrompt.ts`(43L Pattern O verbatim 1:1 contract § 5.4 D-18) + `src/routing/lib/ralphLoop.ts`(spillover) + `src/routing/index.ts`(barrel)
  - **新 ADR**：0008 routing-engine-v1-errata（A7 守恒：ADR 0001-0007 main body 0 diff；含 phase 1.3 deferred H1a perf transparency reference + M1 yaml path migration 官方化 + R6 engineering category 推 phase 1.5）
  - **新 baseline tag**：7 → 8（加 `adr-0008-accepted`；CI A7 step iterate 1-8 全 8 ADR 守恒）
  - **新文件**：`docs/adr/0008-routing-engine-v1-errata.md` + `src/routing/{engine.ts, agentDefinition.ts, systemPrompt.ts, index.ts, lib/ralphLoop.ts}` + `src/cli/research.ts` + `tests/unit/routing-{engine, agentDefinition}.test.ts`(+21 cell) + `tests/integration/{routing-research-workflow, routing-30-samples}.test.ts`(+3+30 cell) + `scripts/spike/routing-spawn-agent.sh` + `.planning/phase-1.4/{KICKOFF.md, ASSUMPTIONS.md, RESEARCH.md, PATTERNS.md, PLAN.md, task_plan.md, PLAN-CHECK.md, PLAN-CHECK-ROUND-2.md, SPIKE-REPORT.md, SAMPLES.md, progress.md, VERIFICATION.md}`
  - **3 finding logged**：F40-2 (SDK type alias deferred — agentDefinition.ts 改用本地 structural interface；karpathy YAGNI；推 phase 1.5 D1.4-2 errata window) / F41 (engine.test.ts narrow guard fix — TS strict union narrowing across no-discriminator variant；6 处 `if ('ok' in result && result.ok === false)` Rule 3 trivial auto-fix) / F42 (SAMPLES.md plan-phase hypothesis correction — 4 sample expected fallthrough not fallback; arbitrate v1 array-field miss → priority=50 default rule fallthrough hit；R3 frozen 边界澄清 expected/hypothesis 可改 prompt+category 不可改)
  - **Pattern N/O/P 新生**：Pattern N (engine.ts 主流程编排 ≤ 200L Wave 2 anchor) / Pattern O (systemPrompt.ts verbatim instructional template ≤ 80L D-18 1:1 contract § 5.4) / Pattern P (SAMPLES.md inline truth table ≥ 85% tolerance threshold 30 sample × 6 category v0.1 内部基线)
  - **15 D1.4-* 决策 lock**：D1.4-1 main-process query() API 实证路径 / D1.4-2 contract v1 frozen 不动 main body 守 A7（推 phase 1.5 errata） / D1.4-3 自实装 ralph-loop wrap ≤ 50L 是 wedge 原则 / D1.4-4 sequential MCP add + parallel ctx7 / D1.4-5 30 sample 选取标准 (6 category × 5 + ≥ 3 ambiguous) / D1.4-14 4 心法 always-on baseline inject / D1.4-15 research independent subcommand (D-15)
  - 见 `.planning/phase-1.4/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md, SPIKE-REPORT.md, SAMPLES.md}`
- ✅ **Phase 1.3 SHIPPED**（2026-05-13）
  - 22 atomic 子任务全部完成（含 phase 1.3.1 hotfix bundle 6 commit; sister review F39 6/8 applied + 2 deferred；详 `.planning/phase-1.3/progress.md` § A.4）
  - **Acceptance bar B1-B8 8/8** ✅
    - B1 ADR 0007 errata accepted + adr-0007-accepted tag pushed (CI run 25790126213 三平台全绿验证)
    - B2 manifest schema 加 3 字段（category 6 enum / install_type 4 enum / decision_rules optional Object）+ `validate:schema` 通过
    - B3 schema unit tests +19 cell（>= 12 acceptance bar；分布 category 8 / install-type 6 / decision-rules 5 含嵌套 array+object reject mitigation）
    - B4 `routing/decision_rules.yaml` v1 (12 rules + version: 1 + fallback_supervisor) + arbitrate Priority Hit Policy +8 cell unit
    - B5 `harnessed install-base` 独立子命令 (D-9) + dry-run 三态输出 (D-11 installed/skipped/failed) + 5 cell unit
    - B6 ui-ux-pro-max install path 实测 PATH_A_OK + PATH_B_OK + manifest 创建 (路径 B git-clone-with-setup) + F36 finding logged
    - B7 AgentDefinition factory contract draft 12 字段 + signature + W-5 consumption + V1 BLOCKER 检查
    - B8 CI 三平台全绿（run 25790126213 @ 7c9b66f）+ A7 step iterate 1-7 全绿 + ADR 0001-0007 main body diff 0
  - **7 wave 完整跑完**：Wave 0 ADR 0007 errata + ci.yml A7 iterate 1-7 / Wave 1 schema 实装 (3 字段 + 10 manifest patch + 19 cell) / Wave 2 decision_rules.yaml v1 + arbitrate / Wave 3 install-base 子命令 (8 register fn) / Wave 4 ui-ux-pro-max install path 实测 / Wave 5 AgentDefinition factory contract / Wave 6 cross-OS CI verify + perf attribution / Wave 7 docs + ship
  - **3 schema 新字段**：`category` (6 enum: design/content/testing/search/meta/engineering required) / `install_type` (4 enum: ngm/npx/git/local required, 与 install.method 1:N 闭合) / `decision_rules` (optional per-manifest decision hint, schema 与 routing/decision_rules.yaml 全局 rule-set 完全独立 — B-1 区分)
  - **新 ADR**：0007 categorization-schema-extension errata（A7 守恒：ADR 0001 main body 0 diff；schema 加 3 字段 via errata 流程）
  - **新 baseline tag**：5 → 7（加 `adr-0006-accepted` retag → 3e24c16 [F37 retroactive 同 phase 1.2 F26 模式] + `adr-0007-accepted`）
  - **新文件**：`docs/adr/0007-categorization-schema-extension.md` + `routing/decision_rules.yaml`(179L) + `src/routing/decisionRules.ts`(105L) + `src/cli/install-base.ts`(102L) + `manifests/skill-packs/ui-ux-pro-max.yaml` + `scripts/probe/ui-ux-pro-max-install.sh`(108L) + `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` + `tests/unit/{routing-decisionRules,manifest-validate.{category,install-type,decision-rules},cli-install-base}.test.ts`(+32 cell) + `.planning/phase-1.3/{PLAN.md, task_plan.md, progress.md, KICKOFF.md, ASSUMPTIONS.md, RESEARCH.md, PATTERNS.md, PERF-ATTRIBUTION.md, VERIFICATION.md}`
  - **5 finding logged**：F36 (ui-ux-pro-max install path 实测 — Win Git Bash PATH_A+B 双 OK / v4-next tip SHA e89d70e4bcd0) / F37 (ADR 0006 baseline tag 漂移 + retroactive 重打到 3e24c16) / F38 (CI Ubuntu perf gate 50.14ms 越线 + hotfix 50→75ms) / F39 (sister review patch round — 6/8 applied + 2 deferred [H1a phase 1.4 ADR 0008 errata; M2 v0.4 maintainer onboarding])
  - 见 `.planning/phase-1.3/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md, PERF-ATTRIBUTION.md}`
- ✅ **Phase 1.2.5 architecture revision SHIPPED**（2026-05-12）
  - sister review challenge 后 architecture wedge 重定位（"装配主义包管理器" → "完整三层栈方法论的可执行 engine"）
  - 8 支柱 100% capture lock + 5 P0 决策 lock + ROADMAP v3 重排（16 → 17 phase，加 phase 1.2.5 + phase 1.5）
  - 12 sister review patches（H1+H2+H3+M1-5+L1-4 — commit 3e24c16 单 commit，ADR 0006 main body 加 "Quick Reference Snapshot" 段 + "8 支柱 100% Capture" 表 self-contained 改写）
  - 新 ADR 0006 architecture-wedge-revision-v3 + adr-0006-accepted baseline tag（phase 1.3 F37 retroactive 重打到 3e24c16 修复漂移）
  - 不动已 ship 代码 (A7 守恒严格遵守)；为 phase 1.3 implementation 铺路
  - 见 `.planning/phase-1.2.5/{ASSUMPTIONS.md, RESEARCH-1, RESEARCH-2, ADR-0006-DRAFT.md, progress.md, KICKOFF.md, PATTERNS.md}`
- ✅ **Phase 1.2.1 hotfix SHIPPED**（2026-05-12）
  - phase 1.2 ship 后 CI run 25718x fail — Wave 6 H4 dual-layer step 出错（ok_or_dryrun bash helper 在 Ubuntu/macOS pipefail strict mode 下 set -e 失效）
  - 1 atomic commit `bad2f20` — `set +o pipefail` in ok_or_dryrun helper（接受 mock-claude-cli.sh exit 0/2 dry-run sentinel 不被 pipefail 误吃）
  - CI run 25721497734 三平台全绿；**B5' acceptance bar 实测达成**
  - 见 `.planning/phase-1.2/progress.md` § B F32
- ✅ **Phase 1.2 SHIPPED**（2026-05-12）
  - 33 task ID / 37 atomic 子任务全部完成或合理 deferred（见 `.planning/phase-1.2/progress.md` § A.4 + § B.6 Wave retro）
  - **Acceptance bar B1'-B9' 9/9** ✅
    - B1' real-spawn ctx7 install ready (Wave 6 T5.6, skipIf gate, 1 skipped test)
    - B2' / B3' integration ready (T6.5 VERIFICATION.md § 1 复现命令)
    - B4' 12 contract tests 全绿 ✅ (Wave 6 T5.2 commit 7769535 — 6 contract × 2 method)
    - B5' Cross-OS CI dual-layer step ready (Wave 6 T5.5 H4 + mock-claude-cli.sh — push validates 3 platforms)
    - B6' tests ≥ 110 ✅ 当前 **202 + 1 skipped**（89 baseline → 202 = +113 / skipped: real-spawn）
    - B7' ADR 0001-0005 main body 守恒 ✅（5 baseline tag iterate, A7 step 实测 0 diff per F26 retroactive 0002 补齐）
    - B8' `harnessed doctor` 4-check 落地 ✅（Wave 5 T4.2 — Node ≥22 / MCP scope / jq present / Win bash flavor 含 WSL_DISTRO_NAME probe）
    - B9' `INSTALLER-CONTRACT.md` 182L + 6 契约 + 6-Q FAQ ✅ (Wave 7 T6.1)
  - **6 wave 完整跑完**：Wave 0 deps + ADR 0005 / Wave 1 types base / Wave 2 lib helpers L1 (5 helpers) / Wave 3 state.ts + 6 unit test (+56 tests) / Wave 4 3 installer + dispatcher / Wave 5 4 cli subcommands (含 M1 gc) / Wave 6 顶层 wire + 12 contract test + 19 method unit + 21 cli unit + ci.yml H4 + real-spawn skipIf / Wave 7 docs + verify
  - **2 install methods runtime-ready**：`npm-cli` + `mcp-stdio-add`；4 method placeholders unblock phase 2.1
  - **5 CLI subcommands** wired to commander root：install / doctor / audit / rollback / status / backup-list / gc（7 register fn — F31 followup 1）
  - **新 ADR**：0005 marketplace_source schema errata（F23 起源 → ADR 0001 main body 0 diff per A7 守恒）
  - **新 deps**：picocolors 1.1.1 + diff 9.0.0 + @clack/prompts 0.10.1（GA-2 § B 锁定）
  - **新 baseline tag**：`adr-0005-accepted`（5 tag total: 0001 / 0002 (retroactive d5589dd, F26) / 0003 / 0004 / 0005）
  - **新文件**：`docs/INSTALLER-CONTRACT.md`(182L) + `.planning/phase-1.2/VERIFICATION.md`(237L) + 7 lib helpers (`src/installers/lib/*.ts`) + 2 installer + dispatcher (`src/installers/{npmCli,mcpStdioAdd,index}.ts`) + 7 cli files (`src/cli/{install,doctor,audit,rollback,status,backup-list,gc}.ts`) + 12 contract test + 19 method unit test + 21 cli unit test + 1 real-spawn skipIf test + ci.yml H4 dual-layer step + scripts/ci/mock-claude-cli.sh
  - **9 finding logged**：F23 (executed predicted) / F24 (ready, awaiting CI push) / F25 (resolved) / F26 (auto-fix retroactive tag) / F27 / F28 / F29 / F30 / F31 (cluster — 4 followup actions)
  - 见 `.planning/phase-1.2/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md}`
- ✅ **Phase 1.1.1 hotfix SHIPPED**（2026-05-12）
  - paranoid staff engineer review 后续 — 9 项 fixes 全部 ship；ADR 0001/0002 main body 不动 (A7 守恒)
  - 10 atomic commits + 1 lint fix；tests 71→89（+18）：B1 security gate 9 + B2/M1 git_ref pattern 9
  - 见 `.planning/phase-1.1/progress.md` § B F19-F22；task_plan.md § "Phase 1.1.1 Hotfix Batch" 索引表
- ✅ **Phase 1.1 SHIPPED**（2026-05-12）
  - 47 atomic 子任务全部完成或合理 deferred（见 `.planning/phase-1.1/progress.md` § B F16 deferred 表）
  - 50 commits / 71 vitest passing / 10 manifests / 30+ fixtures / 3 SCHEMA.md / bench 21.7ms
  - **Acceptance bar 8/8 ✅** — A1/A2/A3/A4/A5/A6/A7/A8 全绿（A4: CI run 25686045249 三平台全绿 @ 2026-05-12，详见 § B F18）
  - 3 ADR accepted: 0001 schema v1 / 0002 toolchain / 0003 install method count errata
  - 2 local tag: `adr-0001-accepted`（A7 baseline sentry）+ `v0.1.0-alpha.1-schema-frozen`（milestone）
  - VERIFICATION.md（140L）+ CONTRIBUTING.md（139L）+ README expand（72L）+ MAINTAINER-ONBOARDING stub（50L）
  - GitHub Actions ci.yml（36L）3-OS × Node 22 matrix config-ready
- ✅ **gstack /autoplan 三关卡通过**（2026-05-11）
  - `/office-hours` + `/plan-ceo-review` + `/plan-eng-review`
- ✅ **PROJECT-SPEC v2 锁定**（2026-05-11）
  - 14 项决策已敲定（项目名 / License / 路由机制 / 上游版本锁等）
- ✅ **WORKFLOWS-MVP v2 锁定**（2026-05-11）
  - 3 个 workflow phases schema 标准化（plan-feature 作 reference implementation）
- ✅ **4 个 domain researcher 调研**（2026-05-11）
  - R01 竞品格局（HIGH） / R02 上游真实性（HIGH） / R03 集成机制（HIGH） / R04 失败模式（HIGH）
- ✅ **research synthesis（SUMMARY.md）**（2026-05-11）
  - 6 个核心 spec 修订建议 + ROADMAP ready-to-use 必含项 + 6 项拒绝清单
- ✅ **ROADMAP.md / STATE.md / REQUIREMENTS.md 创建**（2026-05-11）
- ✅ **6 项 spec 修订批量 patch**（2026-05-11）
  - PROJECT-SPEC.md v2 → v2.1（§ 2 上游清单 / § 5.1 跨 harness 损失 / § 7 风险登记 + 5 新增 / § 8.3 hook 措辞重写 / § 8.4 MCP CLI 强制 / § 11 cross-OS 前移）
  - WORKFLOWS-MVP.md v2 → v2.1（research MCP scope project + Windows wrapper / execute-task ralph-loop max-iterations + Windows fix / plan-feature gstack 双路径变量插值 / 跨 workflow upstream_health 降级）
- ✅ **3 项 P0 决策敲定**（2026-05-11）
  - manifest type = 4 type + install.method 子枚举（schema 简洁性优先）
  - gstack v0.1 验证 = 双路径（plugin 化预留 + git-clone-with-setup 实证）
  - 6 项 spec 修订全部立即批量 patch（避免文档分叉）
- ✅ **ADR 0001 manifest schema v1**（2026-05-11）
  - 完整 schema 冻结 + type×method 矩阵 + component_type 语义
- ✅ **ADR 0002 repo structure + toolchain v0.1**（2026-05-11）
  - single package + pnpm 10 + tsup + pure ESM + vitest 4 + commander + biome 2
- ✅ **ADR 0003 install method count errata**（2026-05-12）
  - install method 数 5→6 文档对齐（SPEC + REQUIREMENTS + ROADMAP + STATE）；ADR 0001 main body 守恒
- ✅ **GSD discuss-phase 1**（2026-05-11）
  - ASSUMPTIONS.md（A 8 / B 9 / C 6）+ GA-1 (Ajv+TypeBox) + GA-2 (toolchain)
- ✅ **GSD plan-phase 1**（2026-05-11）
  - PLAN.md（339L）+ task_plan.md（1528L · 47 原子子任务）+ progress.md（含 § B Findings tracker）
  - plan-checker verdict ⚠️ APPROVED WITH CONDITIONS — V1 BLOCKER（5→6 install method）已 patch
- ✅ **GSD execute-phase 1.1 (batch 1-6)**（2026-05-11 → 2026-05-12）
  - batch 1 (T1+T2 wave 1) / 1.5 (T1 残项) / 2 (T3+T4 wave 2) / 3 (T5+T6 wave 3) / 4 (T7 wave 4) / 5 (T8 wave 5) / 6 (T9+T10 wave 6+7)

---

## 进行中（In Progress）

[当前无 — Phase 1.4 SHIPPED；等待 main agent 决定 push tag `v0.1.0-alpha.4-routing-engine` + 启动 Phase 1.5]

---

## 待办（按优先级）

### P0 — Phase 1.5 启动前

1. ⏳ **Phase 1.4 push tag `v0.1.0-alpha.4-routing-engine`** (T8.3；main agent 决定时机；CI 已三平台全绿验证 — run 25804037789 @ 8f56514)
2. ⏳ **Phase 1.5 discuss-phase 启动**（DAG resolver + Semantic Router L2 embedding kNN + engineering category routing rules + mattpocock 23 招式 phase routing schema）
3. ⏳ Phase 1.5 plan-phase（task 拆分 + planning-with-files 落地 task_plan）
4. ⏳ Phase 1.5 ADR 0009 候选评估（`initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` v1.1 contract errata D1.4-2 + array semantic match 升级 R5/F42 fallthrough → match）

### P1 — Phase 1.5 周期

5. **Phase 1.5 DAG resolver Day 1 实装**（R04 P0#4；不允许 sequential 拖到 v0.3）
6. **Phase 1.5 Semantic Router L2 升级**（embedding kNN 语义增强；高频 workflow 模式编码）
7. **Phase 1.5 engineering category routing rules + mattpocock 23 招式 phase routing schema** — 完成 8 支柱 A1' / A5' enforcement (phase 1.4 R6 mitigation)
8. **`initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` v1.1 contract errata 评估**（D1.4-2 — fresh 2026 RESEARCH § 2 暴露的 2 新字段）
9. **F40-2 `@anthropic-ai/claude-agent-sdk` deps 引入评估**（推 phase 1.5 D1.4-2 errata window — 视 research workflow E2E 是否需要 query() 真实调用决定 deps 引入；karpathy YAGNI 至 phase 1.5）
10. **`--add-plugin ralph-wiggum` 官方 plugin headless mode 切换评估**（D1.4-3；v0.2+ 评估窗口）
11. **routing schema strict 校验**（v0.3 phase 1.4 → 实际已在 phase 1.3 落地 routing/decision_rules.yaml schema 验证）

### P2 — 跨里程碑预留

12. `mutually_exclusive_with` 字段在 schema v1 已留占位（v0.2 dogfooding 时观察 planning-with-files vs superpowers/writing-plans 实际语义）
13. gstack-2 / GSD-2 v2 重写迁移策略（v1.0+ 议题，schema 留迁移接口）
14. sigstore / cosign 签名集成（v0.4+ 议题，v0.1-0.3 先用 commit hash）
15. **deferred from phase 1.1**: 原 T4.4 shell-escape pre-Ajv 检测（`$(...)` `${...}` `eval` `!ruby/regexp`）— phase 1.4+ 评估
16. **deferred from phase 1.1**: 原 T8.7 workflow + routing schema artifact + 同等测试覆盖 — v0.3 phase 1.4 (routing/decision_rules.yaml v1 已落地，但完整 workflow schema artifact 仍 deferred)
17. **deferred from phase 1.2**: cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer 实装代码 — phase 2.1（GA-1 Recommendation Option C timing）
18. **deferred from phase 1.2**: mcp-http-add 实装 — phase 2.x（无真实上游 demo）
19. **deferred from phase 1.2**: 6 月 stale upstream check + `--force` flag for idempotent_check — phase 2.4 / 2.1+
20. **deferred from phase 1.3 sister review**: M2 ADR 0006 self-contained snapshot SSOT drift defense — v0.4 maintainer onboarding 加监控警示
21. **deferred from phase 1.4 (F42)**: array semantic match 升级 (R5 array fallthrough → match 行为) — phase 1.5 评估 OR ADR 0009 errata 路径；4 SAMPLES expected_rule_id v0.1 fallthrough → v0.2+ 升级回 array-trigger rule (SAMPLES.md § 8.1 升级映射已落地)
22. **deferred from phase 1.4 (P2)**: phase 1.4 30 sample → phase 3.4 v0.3.0 完整命中率 100+ sample × 多 model × stability 验收（W-3 fixture migration script `scripts/migrate-samples-inline-to-fixture.mjs` — phase 3.4 fixture 化迁移基线）

---

## 关键提醒（⚠️ 不可忽略）

1. ✅ ~~SUMMARY 提议的 6 项 spec 修订尚未应用~~ — **已 patch 进 PROJECT-SPEC v2.1 / WORKFLOWS-MVP v2.1（2026-05-11）**
2. ✅ ~~新增 5 条风险尚未合并~~ — **已合并到 SPEC § 7（2026-05-11）**
3. ✅ ~~Phase 1.1 schema v1 frozen~~ — **2026-05-12 SHIPPED；ADR 0001/0002 main body 受 `adr-0001-accepted` tag 守恒；进入 phase 1.2 前 schema 改动 = 全量 manifest 迁移**
4. ✅ ~~Phase 1.3 schema 加 3 字段 (category/install_type/decision_rules)~~ — **2026-05-13 SHIPPED via ADR 0007 errata；A7 守恒：ADR 0001 main body 0 diff；adr-0007-accepted tag iterate 1-7 全 7 ADR baseline tag 守恒**
5. ✅ ~~Phase 1.4 routing engine v1 + research workflow E2E~~ — **2026-05-13 SHIPPED via ADR 0008 errata；A7 守恒：ADR 0001-0007 main body 0 diff；adr-0008-accepted tag iterate 1-8 全 8 ADR baseline tag 守恒；30 sample 100.0% hit ≥ 85% baseline；3 routing 文件 (engine.ts 170L / agentDefinition.ts 148L / systemPrompt.ts 43L) karpathy 严守 ≤ 200/150/80**
6. **Cross-OS 测试 Day 1**（不是 v0.4）——CI config 已在 phase 1.1 落地（ci.yml）；phase 1.2 起 CI 红了必须修，不允许 disable Windows
7. **DAG resolver Day 1 实装**——sequential 容易拖到 v0.3，brew bundle 案的反面教材；v3 重排推到 phase 1.5（base profile 安装顺序明确，不需拓扑）
8. **路由命中率 30 样本必须覆盖 Haiku/Sonnet/Opus 各 ≥ 8**——Haiku 命中率显著低于 Sonnet（R03 实证）；phase 1.4 30 sample × 6 category 100% hit (单 model 单环境基线，phase 3.4 v0.3.0 升级多 model × stability 验收)
9. **bus factor 1 真实风险**——Avelino 论文实证单 maintainer 年掉队率 36%，6 个月 co-maintainer 窗口非装饰
10. ✅ ~~Phase 1.4 verbatim COMPLETE 强制~~ — **2026-05-13 SHIPPED；systemPrompt.ts D-18 1:1 contract § 5.4 enforce + main agent system prompt verbatim COMPLETE marker (F33 P1 mitigation)；T6.2 30-sample test 验证主流程 verbatim COMPLETE 不被 summarize 误吞**

---

## 累积上下文（Decisions / Todos / Blockers）

### 关键决策记录（追溯到 spec / research 章节）

| 决策 | 来源 | 备注 |
|------|------|------|
| 路由 B+C 混合 + 85% 验收 | SPEC § 5.1 + R03 § 2.4 | Sonnet 100% / Haiku 84% 实证 |
| schema apiVersion + upstream_health + signed_by | R04 P0 + R03 § 6.5 | 仿 K8s CRD 模式 |
| 6 种 install method 用子枚举（type 仍 4） | SUMMARY § 二 冲突 2 决议 + ADR-0003 errata | schema 简洁性优先；mcp-stdio-add / mcp-http-add 拆为独立 method |
| Hook 措辞重写 | SUMMARY § 二 冲突 3 决议 | 配置纯 yaml/md + 脚本严格审计 |
| Cross-OS 前移 | SPEC § 11 修订 | R03 红旗 6 + R04 P0 |
| 单点维护风险升级 | SPEC § 7 修订 | R04 学术 36%/年 |
| Schema v1 sufficient (T7.10 verdict) | progress.md § B F14 + § B.4 表 | 9 上游 dry-run 全 pass，零字段缺失，无 errata 需求 |
| Phase 1.1 SHIP | progress.md § B F17 + .planning/phase-1.1/VERIFICATION.md | 7/8 acceptance bar ✅；A4 ⏳ pending CI；schema v1 frozen via 2 local tags |
| ADR 0005 marketplace_source schema errata | phase-1.2 progress.md § B F23 + ADR 0005 | A7 守恒：ADR 0001 main body 0 diff；schema 加 optional field via errata 流程 |
| Phase 1.2 SHIP — installer runtime ready | phase-1.2 progress.md § A.4 + VERIFICATION.md | B1'-B9' 9/9 ✅；2 method runtime + 4 placeholder；ADR 4→5；tests 89→202+1 skipped |
| Installer UX 6 contract 硬契约（dry-run default + diff + rollback + 4-Level confirm + MCP CLI-only + no-silent-failure）| ADR 0004 + INSTALLER-CONTRACT.md | 12 contract test 自动化 (`tests/integration/installer-contract.test.ts`)；CI fail if violation |
| `npm-cli` L4 → L1 自动降级（fallback npx ephemeral）| ASSUMPTIONS B3 候选 1 + D1.2-4 | H3 三选一 prompt: retry/downgrade/abort；karpathy YAGNI 不抽 selectAt helper |
| `mcp-stdio-add` hardcoded `--scope project` | ADR 0004 § 5 + D1.2-10 + CC #54803 | manifest 不能 override；规避 user-scope bug；不调通用 spawn helper |
| `.harnessed/state.json` SSOT + atomic write-then-rename | D1.2-7 + state.ts | 仅 backup + state.json；audit.log / checkpoints 推 phase 1.4+ |
| backup metadata.json per-file `eol: lf\|crlf` 字段 | ASSUMPTIONS C3 + D1.2-11 | rollback EOL preserve（CRLF 文件不被 LF 化）|
| Contract test 12 cell 用 vi.mock; real-spawn 单独 skipIf gate | D1.2-12 + ASSUMPTIONS C6 + Pattern K | `HARNESSED_REAL_SPAWN=1` 才 run；CI 默认 skip 避免装真包污染 |
| ADR 0001-0005 main body 永久守恒（A7） | F26 + ci.yml iterate 5 tag | 5 baseline tag全部就位；任一字符 diff = CI fail |
| ADR 0006 architecture-wedge-revision-v3 | phase 1.2.5 ASSUMPTIONS § E + ADR 0006 | 8 支柱 100% capture lock + ROADMAP v3 重排 16 → 17 phase；不动已 ship 代码 |
| Phase 1.3 SHIP — base profile + categorization schema + decision_rules.yaml v1 | phase-1.3 progress.md § A.4 + VERIFICATION.md | B1-B8 8/8 ✅；3 schema 字段 + 12 rules + install-base + ui-ux-pro-max install path 实测；ADR 5→7；tests 202+1→235+1 |
| Phase 1.3 perf cost 量化 (schema +3 字段 cost +12% / 100 ops) | phase-1.3 PERF-ATTRIBUTION.md + F38 | 同机本地 phase 1.1 20.13 / 1.2 20.80 / 1.3 22.58ms; CI Ubuntu spike 50.14ms hotfix 50→75ms relax (data-driven 不优化 schema validation) |
| `routing/decision_rules.yaml` v1 schema (Priority Hit Policy + 12 rules) | phase-1.3 T3.1 + RESEARCH-2 | DMN Priority hit policy；6 category × 12 rules MVP；fallback_supervisor=claude-opus-4-7；deprecated brave-search-mcp |
| ADR 0006 baseline tag retroactive 重打到 3e24c16 (F37) | phase-1.3 progress.md § B F37 | 沿袭 phase 1.2 F26 模式；phase 1.2.5 Wave D commit 3e24c16 加 ~50 行 self-contained snapshot 后 tag 与 main body 漂移 → retag 修复
| Phase 1.4 SHIP — routing engine v1 + research workflow E2E + 30 sample 100% hit | phase-1.4 progress.md § A.4 + VERIFICATION.md | C1-C8 8/8 ✅；3 routing 文件 (engine.ts 170L / agentDefinition.ts 148L / systemPrompt.ts 43L)；30 sample 100.0% hit (30/30) ≥ 85% baseline；ADR 7→8；tests 235+1 → 291+2 skipped |
| ADR 0008 routing-engine-v1-errata | phase-1.4 progress.md + ADR 0008 | A7 守恒：ADR 0001-0007 main body 0 diff；含 phase 1.3 deferred H1a perf transparency reference + M1 yaml path migration 官方化 + R6 engineering category 推 phase 1.5 跟踪条目 |
| Pattern N/O/P 新生 (engine 主流程编排 / systemPrompt verbatim 1:1 / SAMPLES inline truth table) | phase-1.4 PATTERNS.md + PLAN.md § 2 | Pattern N ≤ 200L Wave 2 anchor；Pattern O ≤ 80L D-18 1:1 contract § 5.4；Pattern P ≥ 85% tolerance threshold 30 sample × 6 category v0.1 内部基线 |
| AgentDefinition 12 字段 1:1 contract drift detector (T4.2 cell 1) | phase-1.4 T4.2 + W-5 V1 BLOCKER | inline interface 替代 SDK type alias (F40-2)；karpathy YAGNI；推 phase 1.5 D1.4-2 errata window 评估 deps 引入 |
| F42 SAMPLES expected fallthrough not fallback (R3 frozen 边界澄清) | phase-1.4 progress.md § B F42 | R3 mitigation Step 3 严守 prompt+category 不可改；expected/hypothesis 必须同步 ground truth (test 永远 fail 否则)；4 sample (design-3/-5 + search-4/-5) 升级映射推 phase 1.5 array semantic match |
| Phase 1.4 perf 0 影响 (T7.3 跳过) | phase-1.4 task_plan T7.3 trigger 条件 + KICKOFF YAGNI | routing engine 不调用 manifest validate hot path (engine.route 直走 arbitrate / agentFactory / spawn — no validateManifestFile)；T7.3 触发条件不满足；karpathy YAGNI 跳过 PERF-ATTRIBUTION-2.md |

### 未决问题（留给 phase 1.3+ phase）

1. ~~manifest type 计数：keep 4 + 子方法 vs 升 5 type？~~ — **已决：4 type + 6 method（ADR 0003 errata）**
2. ~~installer UX 契约：dry-run 默认还是 explicit~~ — **已决：dry-run 默认 + `--apply` 显式 + `--non-interactive --apply` 双 flag for CI（ADR 0004 + INSTALLER-CONTRACT.md）**
3. ~~MCP scope: user vs project~~ — **已决：硬编码 `--scope project` 写到 .mcp.json，规避 CC #54803（ADR 0004 § 5）**
4. `planning-with-files` 与 `superpowers/writing-plans` 互斥语义（v0.1 dogfooding 观察）
5. gstack-2 / GSD-2 v2 重写迁移（v1.0+ 议题）
6. sigstore / cosign 签名（v0.4+ 议题）
7. `mutually-exclusive skill groups` 元模型（v0.2 设计 pack schema 时定）
8. token budget 监控 UX（v0.3 设计）
9. "用户 10 秒手动覆盖路由错误" UX 量化（v0.4 benchmark 时定）
10. `requires_secret` 字段（API key 注入声明）— v0.2 schema 增强候选（F14 子决策）
11. `command_prefix_strategy` 字段（gstack 前缀可配置）— v0.2 schema 增强候选（F14 子决策）
12. `--force` flag for install idempotent_check 重装语义（phase 2.1+；当前 already-installed = exit 0 + skip）
13. cc-plugin-marketplace REPL slash-command headless 机制（F20 deferred to phase 2.1 plan-phase；ADR 0004 L3 适用）

### Blockers

[当前无]

---

## Session 连续性（Continuity）

### 跨 session 恢复指南

```bash
# 进入项目根
cd D:/GitCode/harnessed

# 1. 读 STATE.md（本文件）了解当前位置 + 待办
# 2. 读 ROADMAP.md 看里程碑总览
# 3. 读 REQUIREMENTS.md 看功能需求清单
# 4. 读 PROJECT-SPEC.md / WORKFLOWS-MVP.md 看立项 spec
# 5. 读 .planning/research/SUMMARY.md 看调研综合
# 6. 读 .planning/phase-1.1/VERIFICATION.md 看 phase 1.1 复现指南（A1-A8 + F1-F22 索引）
# 7. 读 .planning/phase-1.2/VERIFICATION.md 看 phase 1.2 复现指南（B1'-B9' + F23-F31 索引 + Phase 1.3 prereq）
# 8. 读 .planning/phase-1.3/VERIFICATION.md 看 phase 1.3 复现指南（B1-B8 + F36-F39 索引 + Phase 1.4 prereq）
# 9. 读 .planning/phase-1.3/PERF-ATTRIBUTION.md 看 schema 3 字段 perf cost 量化结论 (H1b sister patch 落地)
# 10. 读 .planning/phase-1.4/VERIFICATION.md 看 phase 1.4 复现指南（C1-C8 + F40-F42 索引 + Phase 1.5 prereq 8 接口契约）
# 11. 读 .planning/phase-1.4/SAMPLES.md 看 30 sample inline truth table + R3 frozen + § 8 升级映射
# 12. 读 .planning/phase-1.4/SPIKE-REPORT.md 看 main-process query() API 实证 + 7 anchor decisions
# 13. 读 docs/INSTALLER-CONTRACT.md 看 phase 1.2 installer UX 6 contract（用户视角）
# 14. 读 docs/AGENT-DEFINITION-FACTORY-CONTRACT.md 看 phase 1.3 AgentDefinition factory 12 字段 contract draft (phase 1.4 已实装 1:1 binding)
# 15. 读 docs/adr/0006-architecture-wedge-revision-v3.md 看完整三层栈方法论 wedge 定义 (8 支柱 capture)
# 16. 读 docs/adr/0007-categorization-schema-extension.md 看 phase 1.3 schema errata
# 17. 读 docs/adr/0008-routing-engine-v1-errata.md 看 phase 1.4 routing engine v1 errata + R6 deferred
# 18. 读 .planning/phase-1.{1,2,2.5,3,4}/progress.md § B 看完整 finding narratives
```

### 本 session 关键产出（截至 2026-05-13 phase 1.4 ship）

- `D:/GitCode/harnessed/.planning/ROADMAP.md`（v3 重排：16 → 17 phase）
- `D:/GitCode/harnessed/.planning/STATE.md`（本文件）
- `D:/GitCode/harnessed/.planning/REQUIREMENTS.md`
- `D:/GitCode/harnessed/.planning/phase-1.1/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md}`
- `D:/GitCode/harnessed/.planning/phase-1.2/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md, ASSUMPTIONS.md, PATTERNS.md, GRAY-AREA-1, GRAY-AREA-2, PLAN-CHECK.md}`
- `D:/GitCode/harnessed/.planning/phase-1.2.5/{ASSUMPTIONS.md, RESEARCH-1, RESEARCH-2, ADR-0006-DRAFT.md, progress.md, KICKOFF.md, PATTERNS.md}`
- `D:/GitCode/harnessed/.planning/phase-1.3/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md, KICKOFF.md, ASSUMPTIONS.md, RESEARCH.md, PATTERNS.md, PERF-ATTRIBUTION.md, PLAN-CHECK.md, PLAN-CHECK-ROUND-2.md}`
- `D:/GitCode/harnessed/.planning/phase-1.4/{KICKOFF.md, ASSUMPTIONS.md, RESEARCH.md, PATTERNS.md, PLAN.md, task_plan.md, PLAN-CHECK.md, PLAN-CHECK-ROUND-2.md, SPIKE-REPORT.md, SAMPLES.md, progress.md, VERIFICATION.md}`
- `D:/GitCode/harnessed/docs/adr/{0001,0002,0003,0004,0005,0006,0007,0008}*.md`
- `D:/GitCode/harnessed/docs/{INSTALLER-CONTRACT.md, AGENT-DEFINITION-FACTORY-CONTRACT.md}`
- `D:/GitCode/harnessed/{README.md, CONTRIBUTING.md, SECURITY.md, LICENSE, NOTICE, NOTICES.md}`
- `D:/GitCode/harnessed/docs/MAINTAINER-ONBOARDING.md`
- `D:/GitCode/harnessed/{manifests, workflows, routing, schemas, src, tests}/`
- `D:/GitCode/harnessed/src/installers/{lib/{types,spawn,preflight,diff,confirm,backup,state}.ts, npmCli.ts, mcpStdioAdd.ts, index.ts}`（phase 1.2 — 7 lib + 2 installer + dispatcher）
- `D:/GitCode/harnessed/src/cli/{install,doctor,audit,rollback,status,backup-list,gc,install-base,research}.ts`（phase 1.2 — 7 register fn + phase 1.3 install-base = 8 register fn + phase 1.4 research = 9 register fn）
- `D:/GitCode/harnessed/src/routing/{decisionRules.ts, engine.ts, agentDefinition.ts, systemPrompt.ts, index.ts, lib/ralphLoop.ts}`（phase 1.3 decisionRules + phase 1.4 engine 170L / agentDefinition 148L / systemPrompt 43L / barrel + ralphLoop spillover）
- `D:/GitCode/harnessed/routing/decision_rules.yaml`（phase 1.3 — 179L v1 schema; 12 rules + version: 1 + fallback_supervisor + hit_policy: P；M1 sister patch 移自 .planning/）
- `D:/GitCode/harnessed/manifests/skill-packs/ui-ux-pro-max.yaml`（phase 1.3 — install_type=git + method=git-clone-with-setup; v4-next tip SHA e89d70e4bcd0; decision_rules per-manifest hint）
- `D:/GitCode/harnessed/scripts/probe/ui-ux-pro-max-install.sh`（phase 1.3 — 108L; D-10 shell probe Win Git Bash 双路径 OK; 不入 CI）
- `D:/GitCode/harnessed/scripts/spike/routing-spawn-agent.sh`（phase 1.4 — D1.4-1 spike script; main-process query() API 实证）
- `D:/GitCode/harnessed/tests/integration/{installer-contract.test.ts, installer-real-spawn.test.ts, routing-research-workflow.test.ts, routing-30-samples.test.ts}`（phase 1.2 — 12 contract + 1 real-spawn skipIf；phase 1.4 — 3 mock E2E + 1 real-spawn skipIf + 30 sample-driven cell + 1 load + 1 summary skipIf）
- `D:/GitCode/harnessed/tests/unit/installers-{npmCli,mcpStdioAdd,index,lib-*}.test.ts` + `cli-{install,doctor,audit,rollback,status,install-base}.test.ts` + `routing-{decisionRules,engine,agentDefinition}.test.ts`（phase 1.2 — 6 lib + 19 method + 21 cli unit; phase 1.3 + cli-install-base 5 cell + routing-decisionRules 8 cell + manifest-validate.{category 8, install-type 6, decision-rules 5}; phase 1.4 + routing-engine 12 cell + routing-agentDefinition 9 cell）
- `D:/GitCode/harnessed/.github/workflows/ci.yml`（含 phase 1.2 H4 dual-layer installer step + phase 1.4 A7 step iterate 1-8 ADR守恒）
- `D:/GitCode/harnessed/scripts/ci/mock-claude-cli.sh`（phase 1.2 mock shim）

### 性能指标（phase 1.1 + 1.1.1 + 1.2 + 1.2.1 + 1.2.5 + 1.3 + 1.4 实证）

- 当前 phase token 消耗：— (main agent 后续填入)
- checkpoint 数量：phase 1.1 内多次 batch checkpoint（batch 1-6 各一次）；phase 1.1.1 hotfix 1 次 batch；phase 1.2 共 7 batch (Wave 0-7)；phase 1.2.1 hotfix 1 batch；phase 1.2.5 多 wave；phase 1.3 共 4 batch (batch 1+2+3+4)；phase 1.4 共 4 batch (batch 1+2+3+4)
- 累积 ADR 数量：**8**（0001 schema / 0002 toolchain / 0003 method count errata / 0004 installer UX contract / 0005 marketplace_source schema errata / 0006 architecture-wedge-revision-v3 / 0007 categorization-schema-extension errata / 0008 routing-engine-v1-errata）（目标 v0.4 ≥ 5 ✅ 已达）
- 累积 baseline tag 数量：**8**（adr-0001/0002/0003/0004/0005/0006/0007/0008-accepted；0006 phase 1.3 F37 retroactive 重打到 3e24c16）+ 2 milestone tag（v0.1.0-alpha.1-schema-frozen + v0.1.0-alpha.2-installer-runtime；v0.1.0-alpha.3-base-profile pushed；v0.1.0-alpha.4-routing-engine pending T8.3 main agent 决定）
- 路由命中率：**phase 1.4 30 sample 100.0% (30/30) v0.1 内部基线** ✅；目标 ≥ 85% 达成；per-category 5/5 design+content+testing+search+meta；engineering 5/5 fallback_supervisor expected (phase 1.5 unblock)；phase 3.4 v0.3.0 升级 100+ sample × 多 model × stability 验收
- 总 commits（phase 1.1 累积 50 + phase 1.1.1 hotfix 10 + phase 1.2 ~37 + phase 1.2.1 hotfix 1 + phase 1.2.5 多 + phase 1.3 ~24 atomic + phase 1.4 ~21 atomic + checkpoints）：~165
- 总 vitest tests：**291 passing + 2 skipped**（phase 1.4: +56 from phase 1.3 baseline 235+1；分布 routing-engine +12 / routing-agentDefinition +9 / routing-research-workflow +3 +1 skipped real-spawn / routing-30-samples +30 +1 skipped real-spawn + 1 load + 1 summary）
- bench：phase 1.3 22.58ms mean / RME ±1.88% / SLA < 75ms（phase 1.3.1 hotfix relax；本地仍 ~3.3× headroom；详 PERF-ATTRIBUTION.md § 2-4）；phase 1.4 routing engine 不调 manifest validate hot path → 0 perf 影响 (T7.3 跳过 — engine.route 直走 arbitrate/agentFactory/spawn)
- 总 manifests / fixtures / SCHEMA.md：10 / 30+ / 3（phase 1.4 不加 manifest，只加 routing 文件）
- 新 deps：8（5 phase 1.1 base：Ajv + TypeBox + yaml + Ajv-formats + Ajv-errors + 3 phase 1.2：picocolors + diff + @clack/prompts；phase 1.3 不加 dep；phase 1.4 不加 dep — F40-2 SDK type alias 推 phase 1.5）

---

## Phase 1.5 Prereq Notes（phase 1.4 ship 后 explicit 启动 prereq — T8.4）

> phase 1.5 plan-phase 启动**直接消费 phase 1.4 输出**，无需重做。完整 8 接口契约见 `.planning/phase-1.4/VERIFICATION.md` § 2 + `PLAN.md` § 4。

### P0 — phase 1.5 启动必备

1. **DAG resolver + Semantic Router L2 (embedding kNN)** — 解锁 plan-feature workflow context routing
   - **接口入口**: `engine.route(task, opts)` (phase 1.4 已 ship — `src/routing/engine.ts`)；DAG resolver 替换 arbitrate 步骤；其余编排步骤同源
   - **EngineResult narrow pattern**: `if ('ok' in result && result.ok === false)` (F41 takeaway — TS strict union narrow 防陷阱)
   - **来源**: ROADMAP.md v0.1.0 phase 1.5 + R04 P0#4 (sequential 不允许拖到 v0.3)

2. **engineering category routing rules + mattpocock 23 招式 phase routing schema** — 完成 8 支柱 A1' / A5' enforcement
   - **R6 mitigation**: phase 1.4 KICKOFF 第 38 行 explicit lock + ADR 0008 § Consequences R6 跟踪条目
   - **现状**: phase 1.4 30 sample 中 engineering 5/5 走 fallback_supervisor (claude-opus-4-7) — 单模型兜底；phase 1.5 加 23 招式 phase routing schema 后能精确路由 discuss/plan/execute/verify
   - **接口扩展**: `routing/decision_rules.yaml` 加 engineering category 新 rules + manifest spec 顶层 `phase` 字段（discuss/plan/execute/verify enum 候选）

3. **PERF-ATTRIBUTION-2.md ship — DAG resolver hot path bench** (sister review T3 transparency — phase 1.5 acceptance bar D9 候选)
   - **触发**: phase 1.5 DAG resolver 频繁调 `validateManifestFile` (依赖图解析必经路径) — 不 audit 风险 100ms→200ms perf 跳跃 ship 前才发现
   - **范围**:
     - manifest validate 调用次数 baseline (phase 1.4 routing engine 0 hot path) vs phase 1.5 DAG (≥ N 次/调用)
     - 单 manifest validate 时间 baseline (phase 1.3 ship 28ms) 是否 regress (≥ 5% threshold)
     - 续 phase 1.3 PERF-ATTRIBUTION.md 模式 + phase 1.4 跳过 T7.3 透明性补强
   - **决策点**: phase 1.5 plan-phase Wave 6 acceptance bar D9 (类 phase 1.4 C7 模式)

4. **v0.1.0-alpha.4 release notes 显式 known limitations** (sister review T2 transparency — 推 phase 1.5 release window 顺手 patch)
   - **触发**: phase 1.4 30 sample 100.0% hit metric 用户视角误读风险（specific rule match 21/30 = 70% — array trigger v1 miss 影响 search-5 批量 URL → tavily fallback ~10× cost vs exa intent）
   - **范围**: README v0.1.0-alpha.4 状态段已加 5 行注脚 (sister T1 inline) — phase 1.5 release notes (CHANGELOG.md or GitHub Release) 加 ## Known Limitations 段
   - **决策点**: phase 1.5 ship 时 release notes 内联 (类 phase 1.4 ADR 0008 inline phase 1.3 deferred items 模式)

### P1 — phase 1.5 周期内评估

3. **`initialPrompt` + `criticalSystemReminder_EXPERIMENTAL` v1.1 contract errata 评估** (D1.4-2)
   - **来源**: phase 1.4 RESEARCH § 2 fresh 2026 暴露 2 新字段；contract v1 frozen at phase 1.3 ship — 不动 main body 守 A7 (D1.4-2 lock)
   - **决策点**: phase 1.5 errata window 走 ADR 0009 errata 加 `initialPrompt: string` + `criticalSystemReminder_EXPERIMENTAL: string` 2 字段，AgentDefinition 12 字段 → 14 字段 1:1 binding；T4.2 cell 1 W-5 V1 BLOCKER drift detector 同步扩展
   - **预期 impact**: spawn 时刻 main agent 注入 initialPrompt 进 subagent context (复用 ralph-loop wrap pattern + verbatim COMPLETE marker 约束)

4. **F40-2 `@anthropic-ai/claude-agent-sdk` deps 引入评估** (推 phase 1.5 D1.4-2 errata window 同步)
   - **现状**: phase 1.4 agentDefinition.ts 用 inline `interface AgentDefinition` 1:1 contract § 2 (12 字段)；package.json 不污染 dep；karpathy YAGNI
   - **触发条件**: research workflow E2E (T5.x) 真实调用 query() API 时 (HARNESSED_REAL_SPAWN=1 spawn 真实 main-process subagent) 才引入 deps
   - **决策点**: 视 phase 1.5 实装 DAG resolver 调用 spawn 频率 + Semantic Router L2 supervisor 调用 query() API 真实形态实证后决定

5. **`--add-plugin ralph-wiggum` 官方 plugin headless mode 切换评估** (D1.4-3)
   - **现状**: phase 1.4 自实装 `src/routing/lib/ralphLoop.ts` ≤ 50L (wedge 原则 — 自实装 small 是核心 wedge)；KICKOFF lock 严守
   - **触发条件**: v0.2+ 官方 plugin 成熟度可信 + 自实装 cost > 切换 cost 时
   - **决策点**: phase 2.1+ + ADR 0009+ errata 评估窗口

### P2 — 跨里程碑预留 (phase 1.4 deferred items)

6. **F42 array semantic match 升级** (R5 array fallthrough → match 行为)
   - **现状**: phase 1.4 arbitrate v1 array-field rule (priority=100 ui-task-bold-style-override / priority=80 search-academic-or-batch-or-token-sensitive) v1 miss → priority=50 default rule fallthrough 命中
   - **影响**: 4 SAMPLES expected_rule_id v0.1 fallthrough — design-3/-5 (`ui-task-default`) / search-4/-5 (`search-default`)；命中 default rule (非 array-trigger rule) 不影响 routing primary 命中率 (设计意图仍达成 — ui-design 走 ui-ux-pro-max / search 走 tavily-mcp)
   - **决策点**: phase 1.5 评估 OR ADR 0009 errata 路径；升级回 array-trigger rule 命中后 4 SAMPLES expected_rule_id 同步升级（SAMPLES.md § 8.1 升级映射已落地）

7. **phase 1.4 30 sample → phase 3.4 v0.3.0 完整命中率 100+ sample × 多 model × stability 验收**
   - **现状**: phase 1.4 30 sample inline truth table (Pattern P) 单 model 单环境 100% hit ≥ 85% v0.1 内部基线
   - **升级路径**: W-3 fixture migration script `scripts/migrate-samples-inline-to-fixture.mjs` 把 SAMPLES.md inline truth → tests/fixtures/routing/samples/*.yaml；phase 3.4 v0.3.0 release 验收时 100+ sample × Haiku/Sonnet/Opus 各 ≥ 8 × stability run × 3 验收

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

