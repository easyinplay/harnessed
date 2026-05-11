# harnessed STATE

> 项目记忆 · 跨 session 一致性的 SSOT
> 最后更新：2026-05-12（phase 1.1 SHIP — batch 6 收尾完成，ready for phase 1.2）

---

## 项目核心引用

- **核心价值**：AI coding harness 生态的「装配主义包管理器」——不 vendor 上游，composition skill 编排
- **当前关注**：v0.1.0（manifest 引擎 + research workflow，1-2 周）
- **总工期**：~10-12 周（4 milestones × 3-5 phases = 共 16 phases）
- **License**：Apache-2.0（开源 / GitHub Sponsors 兜底）
- **仓库**：`D:\GitCode\harnessed\`（Node.js + TypeScript）

---

## 当前位置（Current Position）

- **GSD phase**：v0.1.0 Phase 1.1 ✅ **COMPLETED — SHIPPED 2026-05-12**
- **当前里程碑**：v0.1.0
- **下一 phase**：Phase 1.2（cross-OS CI 实测 + cli-npm + mcp-stdio installer + harnessed setup/doctor）
- **状态**：✅ **Ready for Phase 1.2**
- **进度**：1 / 16 phases 已完成 ▓░░░░░░░░░░░░░░░ 6%

### 各里程碑进度

| 里程碑 | Phase 完成 | 状态 | 完成时间 |
|--------|-----------|------|---------|
| v0.1.0 manifest 引擎 + research | 1/4 | ✅ Phase 1.1 done; Phase 1.2-1.4 待执行 | 2026-05-12 (P1.1) |
| v0.2.0 execute-task + ralph-loop | 0/4 | Not started | - |
| v0.3.0 plan-feature + checkpoint | 0/4 | Not started | - |
| v0.4.0 dogfooding + 稳定期 | 0/3 | Not started | - |

### 下一步行动

1. ✅ ~~Phase 1.1 全 47 子任务完成~~ — 2026-05-12 ship
2. ✅ ~~ADR 0001 / 0002 / 0003 全部 accepted~~ — schema v1 frozen
3. ✅ ~~两个 local tag 打好~~ — `adr-0001-accepted` + `v0.1.0-alpha.1-schema-frozen`
4. ⏳ **A4 acceptance bar pending CI run**（main agent 决定何时 push 触发 GitHub Actions）
5. ⏳ **进入 Phase 1.2**（cross-OS CI 实测 + cli-npm + mcp-stdio installer 实装 + setup/doctor 命令骨架）
6. ⏳ Phase 1.3（DAG resolver + harnessed-router 引擎）
7. ⏳ Phase 1.4（research workflow 端到端 + routing/search.md SSOT）

---

## 已完成（Completed）

- ✅ **Phase 1.1 SHIPPED**（2026-05-12）
  - 47 atomic 子任务全部完成或合理 deferred（见 `.planning/phase-1.1/progress.md` § B F16 deferred 表）
  - 50 commits / 71 vitest passing / 10 manifests / 30+ fixtures / 3 SCHEMA.md / bench 21.7ms
  - **Acceptance bar 7/8 ✅** — A1/A2/A3/A5/A6/A7/A8 全绿；A4 ⏳ pending CI on first push
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

[当前无 — Phase 1.1 SHIPPED；等待 main agent 决定何时启动 Phase 1.2]

---

## 待办（按优先级）

### P0 — Phase 1.2 启动前

1. ⏳ **A4 acceptance bar CI run**（push main 触发 `.github/workflows/ci.yml` 跨 OS 三平台验证）
2. ⏳ **Phase 1.2 discuss-phase 启动**（cli-npm + mcp-stdio installer + cross-OS 实测）
3. ⏳ Phase 1.2 plan-phase（task 拆分 + planning-with-files 落地 task_plan）

### P1 — Phase 1.2-1.4 周期

4. **`harnessed setup` 自检**（R04 P0#5；提示 npx@latest）
5. **`harnessed install <workflow>`**（research workflow 用 ctx7 + tavily-mcp + exa-mcp）
6. **DAG resolver Day 1 实装**（R04 P0#4；不允许 sequential 拖到 v0.3）
7. **routing schema strict 校验**（v0.3 phase 1.4）
8. **`manifests/aliases.yaml` 占位文件创建**（v0.3 启用，但 schema v1 必须留接口）

### P2 — 跨里程碑预留

9. `mutually_exclusive_with` 字段在 schema v1 已留占位（v0.2 dogfooding 时观察 planning-with-files vs superpowers/writing-plans 实际语义）
10. gstack-2 / GSD-2 v2 重写迁移策略（v1.0+ 议题，schema 留迁移接口）
11. sigstore / cosign 签名集成（v0.4+ 议题，v0.1-0.3 先用 commit hash）
12. **deferred from phase 1.1**: 原 T4.4 shell-escape pre-Ajv 检测（`$(...)` `${...}` `eval` `!ruby/regexp`）— phase 1.4+ 评估
13. **deferred from phase 1.1**: 原 T8.7 workflow + routing schema artifact + 同等测试覆盖 — v0.3 phase 1.4

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

### 未决问题（留给 phase 1.2+ phase）

1. ~~manifest type 计数：keep 4 + 子方法 vs 升 5 type？~~ — **已决：4 type + 6 method（ADR 0003 errata）**
2. `planning-with-files` 与 `superpowers/writing-plans` 互斥语义（v0.1 dogfooding 观察）
3. gstack-2 / GSD-2 v2 重写迁移（v1.0+ 议题）
4. sigstore / cosign 签名（v0.4+ 议题）
5. `mutually-exclusive skill groups` 元模型（v0.2 设计 pack schema 时定）
6. token budget 监控 UX（v0.3 设计）
7. "用户 10 秒手动覆盖路由错误" UX 量化（v0.4 benchmark 时定）
8. `requires_secret` 字段（API key 注入声明）— v0.2 schema 增强候选（F14 子决策）
9. `command_prefix_strategy` 字段（gstack 前缀可配置）— v0.2 schema 增强候选（F14 子决策）

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
# 6. 读 .planning/phase-1.1/VERIFICATION.md 看 phase 1.1 复现指南（A1-A8 + F1-F17 索引）
# 7. 读 .planning/phase-1.1/progress.md § B 看完整 finding narratives
```

### 本 session 关键产出（截至 2026-05-12 phase 1.1 ship）

- `D:/GitCode/harnessed/.planning/ROADMAP.md`
- `D:/GitCode/harnessed/.planning/STATE.md`（本文件）
- `D:/GitCode/harnessed/.planning/REQUIREMENTS.md`
- `D:/GitCode/harnessed/.planning/phase-1.1/{PLAN.md, task_plan.md, progress.md, VERIFICATION.md}`
- `D:/GitCode/harnessed/docs/adr/{0001,0002,0003}*.md`
- `D:/GitCode/harnessed/{README.md, CONTRIBUTING.md, LICENSE, NOTICE, NOTICES.md}`
- `D:/GitCode/harnessed/docs/MAINTAINER-ONBOARDING.md`
- `D:/GitCode/harnessed/{manifests, workflows, routing, schemas, src, tests}/`
- `D:/GitCode/harnessed/.github/workflows/ci.yml`

### 性能指标（phase 1.1 实证）

- 当前 phase token 消耗：— (main agent 后续填入)
- checkpoint 数量：phase 1.1 内多次 batch checkpoint（batch 1-6 各一次）
- 累积 ADR 数量：3（0001 schema / 0002 toolchain / 0003 method count errata）（目标 v0.4 ≥ 5）
- 路由命中率：— （目标 ≥ 85%，v0.3 phase 1.4 / v0.4 验收）
- 总 commits（phase 1.1 累积）：50
- 总 vitest tests：71 passing
- bench：21.7-22.7ms mean / RME ±2% / SLA < 50ms（A6 reconfirmed）

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

