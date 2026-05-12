# harnessed STATE

> 项目记忆 · 跨 session 一致性的 SSOT
> 最后更新：2026-05-12（**phase 1.2 SHIPPED** — installer runtime ready；B1'-B9' 9/9 acceptance bar；ADR 累积 4 → 5；tests 89 → 202+1 skipped；ready for phase 1.3）

---

## 项目核心引用

- **核心价值**：AI coding harness 生态的「装配主义包管理器」——不 vendor 上游，composition skill 编排
- **当前关注**：v0.1.0（manifest 引擎 + research workflow，1-2 周）
- **总工期**：~10-12 周（4 milestones × 3-5 phases = 共 16 phases）
- **License**：Apache-2.0（开源 / GitHub Sponsors 兜底）
- **仓库**：`D:\GitCode\harnessed\`（Node.js + TypeScript）

---

## 当前位置（Current Position）

- **GSD phase**：v0.1.0 Phase 1.2 ✅ **COMPLETED — SHIPPED 2026-05-12** + **Phase 1.2.1 hotfix shipped 2026-05-12 (B5' CI fix — set +o pipefail in ok_or_dryrun)** （Phase 1.1 + 1.1.1 hotfix 已于先前 ship）
- **当前里程碑**：v0.1.0
- **下一 phase**：Phase 1.3（DAG resolver + harnessed-router 引擎 + setup 完整版）— phase 1.2 已落地 `runInstall(manifest, opts)` 公共 API + `InstallResult` discriminated union + `levelOf(method)` Level seed + `.harnessed/state.json` SSOT schema + `InstallError.keyword` 错误库 — 全部 prereq ready (见 phase-1.2 VERIFICATION.md § 3)
- **状态**：✅ **Ready for Phase 1.3**
- **进度**：2 / 16 phases 已完成 ▓▓░░░░░░░░░░░░░░ 12.5%

### 各里程碑进度

| 里程碑 | Phase 完成 | 状态 | 完成时间 |
|--------|-----------|------|---------|
| v0.1.0 manifest 引擎 + research | 2/4 | ✅ Phase 1.1 + 1.2 done; Phase 1.3-1.4 待执行 | 2026-05-12 (P1.1+P1.2) |
| v0.2.0 execute-task + ralph-loop | 0/4 | Not started | - |
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
8. ⏳ **main agent tag `v0.1.0-alpha.2-installer-runtime`**（T6.7；CI 已三平台全绿验证）
9. ⏳ **进入 Phase 1.3 plan-phase**（DAG resolver + harnessed-router 引擎 + setup 完整版）
10. ⏳ Phase 1.4（research workflow 端到端 + routing/search.md SSOT）

---

## 已完成（Completed）

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

[当前无 — Phase 1.2 SHIPPED；等待 main agent 决定 push 时机 + tag `v0.1.0-alpha.2-installer-runtime` + 启动 Phase 1.3]

---

## 待办（按优先级）

### P0 — Phase 1.3 启动前

1. ⏳ **Phase 1.2 push to origin + tag `v0.1.0-alpha.2-installer-runtime`** (T6.7；main agent 决定时机)
2. ⏳ **CI 验证 Phase 1.2 push**（H4 dual-layer step 第一次实测 + A7 守恒 5 tag iterate + ok_or_dryrun() bash helper 接受 exit 0+2 dry-run sentinel — F24 finding ready，待 main agent push 验证）
3. ⏳ **Phase 1.3 discuss-phase 启动**（DAG resolver 接口设计 + harnessed-router 引擎 + setup 完整版）
4. ⏳ Phase 1.3 plan-phase（task 拆分 + planning-with-files 落地 task_plan）

### P1 — Phase 1.3-1.4 周期

5. **DAG resolver Day 1 实装**（R04 P0#4；不允许 sequential 拖到 v0.3）
6. **`harnessed setup` 完整版**（自检 + workflow skill 装载到 `~/.claude/skills/`）
7. **`harnessed install <workflow>`**（research workflow 用 ctx7 + tavily-mcp + exa-mcp — Phase 1.2 已落地三 method 的 npm-cli + mcp-stdio-add 实装，Phase 1.3 加 DAG 编排）
8. **routing schema strict 校验**（v0.3 phase 1.4）
9. **`manifests/aliases.yaml` 占位文件创建**（v0.3 启用，但 schema v1 必须留接口）

### P2 — 跨里程碑预留

10. `mutually_exclusive_with` 字段在 schema v1 已留占位（v0.2 dogfooding 时观察 planning-with-files vs superpowers/writing-plans 实际语义）
11. gstack-2 / GSD-2 v2 重写迁移策略（v1.0+ 议题，schema 留迁移接口）
12. sigstore / cosign 签名集成（v0.4+ 议题，v0.1-0.3 先用 commit hash）
13. **deferred from phase 1.1**: 原 T4.4 shell-escape pre-Ajv 检测（`$(...)` `${...}` `eval` `!ruby/regexp`）— phase 1.4+ 评估
14. **deferred from phase 1.1**: 原 T8.7 workflow + routing schema artifact + 同等测试覆盖 — v0.3 phase 1.4
15. **deferred from phase 1.2**: cc-plugin-marketplace / git-clone-with-setup / npx-skill-installer 实装代码 — phase 2.1（GA-1 Recommendation Option C timing）
16. **deferred from phase 1.2**: mcp-http-add 实装 — phase 2.x（无真实上游 demo）
17. **deferred from phase 1.2**: 6 月 stale upstream check + `--force` flag for idempotent_check — phase 2.4 / 2.1+

---

## 关键提醒（⚠️ 不可忽略）

1. ✅ ~~SUMMARY 提议的 6 项 spec 修订尚未应用~~ — **已 patch 进 PROJECT-SPEC v2.1 / WORKFLOWS-MVP v2.1（2026-05-11）**
2. ✅ ~~新增 5 条风险尚未合并~~ — **已合并到 SPEC § 7（2026-05-11）**
3. ✅ ~~Phase 1.1 schema v1 frozen~~ — **2026-05-12 SHIPPED；ADR 0001/0002 main body 受 `adr-0001-accepted` tag 守恒；进入 phase 1.2 前 schema 改动 = 全量 manifest 迁移**
4. **Cross-OS 测试 Day 1**（不是 v0.4）——CI config 已在 phase 1.1 落地（ci.yml）；phase 1.2 起 CI 红了必须修，不允许 disable Windows
5. **DAG resolver Day 1 实装**——sequential 容易拖到 v0.3，brew bundle 案的反面教材
6. **路由命中率 30 样本必须覆盖 Haiku/Sonnet/Opus 各 ≥ 8**——Haiku 命中率显著低于 Sonnet（R03 实证）
7. **bus factor 1 真实风险**——Avelino 论文实证单 maintainer 年掉队率 36%，6 个月 co-maintainer 窗口非装饰

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
# 8. 读 docs/INSTALLER-CONTRACT.md 看 phase 1.2 installer UX 6 contract（用户视角）
# 9. 读 .planning/phase-1.{1,2}/progress.md § B 看完整 finding narratives
```

### 本 session 关键产出（截至 2026-05-12 phase 1.2 ship）

- `D:/GitCode/harnessed/.planning/ROADMAP.md`
- `D:/GitCode/harnessed/.planning/STATE.md`（本文件）
- `D:/GitCode/harnessed/.planning/REQUIREMENTS.md`
- `D:/GitCode/harnessed/.planning/phase-1.1/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md}`
- `D:/GitCode/harnessed/.planning/phase-1.2/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md, ASSUMPTIONS.md, PATTERNS.md, GRAY-AREA-1, GRAY-AREA-2, PLAN-CHECK.md}`
- `D:/GitCode/harnessed/docs/adr/{0001,0002,0003,0004,0005}*.md`
- `D:/GitCode/harnessed/docs/INSTALLER-CONTRACT.md`（phase 1.2 user-facing 6 contract spec — Wave 7 T6.1）
- `D:/GitCode/harnessed/{README.md, CONTRIBUTING.md, SECURITY.md, LICENSE, NOTICE, NOTICES.md}`
- `D:/GitCode/harnessed/docs/MAINTAINER-ONBOARDING.md`
- `D:/GitCode/harnessed/{manifests, workflows, routing, schemas, src, tests}/`
- `D:/GitCode/harnessed/src/installers/{lib/{types,spawn,preflight,diff,confirm,backup,state}.ts, npmCli.ts, mcpStdioAdd.ts, index.ts}`（phase 1.2 — 7 lib + 2 installer + dispatcher）
- `D:/GitCode/harnessed/src/cli/{install,doctor,audit,rollback,status,backup-list,gc}.ts`（phase 1.2 — 7 register fn）
- `D:/GitCode/harnessed/tests/integration/{installer-contract.test.ts, installer-real-spawn.test.ts}`（phase 1.2 — 12 contract + 1 real-spawn skipIf）
- `D:/GitCode/harnessed/tests/unit/installers-{npmCli,mcpStdioAdd,index,lib-*}.test.ts` + `cli-{install,doctor,audit,rollback,status}.test.ts`（phase 1.2 — 6 lib + 19 method + 21 cli unit）
- `D:/GitCode/harnessed/.github/workflows/ci.yml`（含 phase 1.2 H4 dual-layer installer step）
- `D:/GitCode/harnessed/scripts/ci/mock-claude-cli.sh`（phase 1.2 mock shim）

### 性能指标（phase 1.1 + 1.1.1 + 1.2 实证）

- 当前 phase token 消耗：— (main agent 后续填入)
- checkpoint 数量：phase 1.1 内多次 batch checkpoint（batch 1-6 各一次）；phase 1.1.1 hotfix 1 次 batch；phase 1.2 共 7 batch (Wave 0-7)
- 累积 ADR 数量：5（0001 schema / 0002 toolchain / 0003 method count errata / 0004 installer UX contract / 0005 marketplace_source schema errata）（目标 v0.4 ≥ 5 ✅ 已达）
- 累积 baseline tag 数量：5（adr-0001/0002/0003/0004/0005-accepted）+ 2 milestone tag（v0.1.0-alpha.1-schema-frozen + v0.1.0-alpha.2-installer-runtime pending T6.7）
- 路由命中率：— （目标 ≥ 85%，v0.3 phase 1.4 / v0.4 验收）
- 总 commits（phase 1.1 累积 50 + phase 1.1.1 hotfix 10 + phase 1.2 ~37 atomic + checkpoints）：~100
- 总 vitest tests：**202 passing + 1 skipped**（phase 1.2: +113 from phase 1.1.1 baseline 89；分布 Wave 0 +5 marketplace_source / Wave 3 +56 lib unit / Wave 6 +52 contract+method+cli unit + 1 skipped real-spawn skipIf gate）
- bench：21.7-22.7ms mean / RME ±2% / SLA < 50ms（A6 reconfirmed；phase 1.2 不改 schema validation hot path 故 bench 数不变）
- 总 manifests / fixtures / SCHEMA.md：10 / 30+ / 3（phase 1.1 base，phase 1.2 fixture pair add marketplace_source 字段 — manifest 数不变）
- 新 deps：8（5 phase 1.1 base：Ajv + TypeBox + yaml + Ajv-formats + Ajv-errors + 3 phase 1.2：picocolors + diff + @clack/prompts）

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

