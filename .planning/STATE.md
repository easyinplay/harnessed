# harnessed STATE

> 项目记忆 · 跨 session 一致性的 SSOT
> 最后更新：2026-05-11（用户 approve 6 项修订 + 3 项 P0 决策后批量 patch）

---

## 项目核心引用

- **核心价值**：AI coding harness 生态的「装配主义包管理器」——不 vendor 上游，composition skill 编排
- **当前关注**：v0.1.0（manifest 引擎 + research workflow，1-2 周）
- **总工期**：~10-12 周（4 milestones × 3-5 phases = 共 16 phases）
- **License**：Apache-2.0（开源 / GitHub Sponsors 兜底）
- **仓库**：`D:\GitCode\harnessed\`（Node.js + TypeScript）

---

## 当前位置（Current Position）

- **GSD phase**：v0.1.0 Phase 1.1 plan-phase 完成 ✅
- **当前里程碑**：v0.1.0
- **当前 phase**：Phase 1.1（discuss + plan 已完成，待 execute）
- **状态**：✅ Ready for Execute（plan-checker verdict: ⚠️ APPROVED WITH CONDITIONS，V1 BLOCKER 已 patch）
- **进度**：0 / 16 phases 已完成 ░░░░░░░░░░░░░░░░ 0%（plan 完成不计入）

### 各里程碑进度

| 里程碑 | Phase 完成 | 状态 | 完成时间 |
|--------|-----------|------|---------|
| v0.1.0 manifest 引擎 + research | 0/4 | Not started | - |
| v0.2.0 execute-task + ralph-loop | 0/4 | Not started | - |
| v0.3.0 plan-feature + checkpoint | 0/4 | Not started | - |
| v0.4.0 dogfooding + 稳定期 | 0/3 | Not started | - |

### 下一步行动

1. ✅ ~~用户已 approve 6 项 spec 修订~~ — 已批量 patch
2. ✅ ~~3 项 P0 决策已敲定~~ — manifest 4 type / gstack 双路径
3. ✅ ~~起草 ADR 0001~~（manifest schema v1）
4. ✅ ~~ADR 0002~~（repo structure + toolchain）
5. ✅ ~~/gsd-discuss-phase 1~~（ASSUMPTIONS / GA-1 / GA-2 完成）
6. ✅ ~~/gsd-plan-phase 1~~（PLAN / task_plan / progress / PLAN-CHECK 完成，V1 BLOCKER 已 fix）
7. ⏳ **进入 GSD `/gsd-execute-phase 1.1`**（执行 47 个原子子任务）
8. ⏳ T7.10 反哺时统一 patch SPEC § 2 + ADR 0001 + ROADMAP 的 "5→6 install method" 为 ADR 0003 errata

---

## 已完成（Completed）

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
- ✅ **GSD discuss-phase 1**（2026-05-11）
  - ASSUMPTIONS.md（A 8 / B 9 / C 6）+ GA-1 (Ajv+TypeBox) + GA-2 (toolchain)
- ✅ **GSD plan-phase 1**（2026-05-11）
  - PLAN.md（339L）+ task_plan.md（1528L · 47 原子子任务）+ progress.md（含 § B Findings tracker）
  - plan-checker verdict ⚠️ APPROVED WITH CONDITIONS — V1 BLOCKER（5→6 install method）已 patch

---

## 进行中（In Progress）

[当前无 — 等待用户 approve spec 修订后启动 Phase 1.1]

---

## 待办（按优先级）

### P0 — 立即执行（启动 v0.1 前必做）

1. ✅ ~~用户 approve SUMMARY § 三/四 提议的 6 项 spec 修订~~ — **已 approve + 已批量 patch（2026-05-11）**
2. ⏳ **起草 `docs/adr/0001-manifest-schema-v1.md`**（v0.1 P1.1 入口产出）— 写入决策：4 type + install.method 子枚举 + gstack 双路径
3. ⏳ **进入 GSD `/gsd-discuss-phase 1`**（v0.1.0 Phase 1.1）

### P1 — v0.1 早期

4. ✅ ~~WORKFLOWS-MVP § 设计决策更新~~ — **已批量 patch（2026-05-11）**
5. `manifests/aliases.yaml` 占位文件创建（v0.3 启用，但 schema v1 必须留接口）
6. `docs/adr/` 目录建立 + ADR 编号约定文档

### P2 — 跨里程碑预留

7. `mutually_exclusive_with` 字段在 schema v1 留占位（v0.2 dogfooding 时观察 planning-with-files vs superpowers/writing-plans 实际语义）
8. gstack-2 / GSD-2 v2 重写迁移策略（v1.0+ 议题，schema 留迁移接口）
9. sigstore / cosign 签名集成（v0.4+ 议题，v0.1-0.3 先用 commit hash）

---

## 关键提醒（⚠️ 不可忽略）

1. ✅ ~~SUMMARY 提议的 6 项 spec 修订尚未应用~~ — **已 patch 进 PROJECT-SPEC v2.1 / WORKFLOWS-MVP v2.1（2026-05-11）**
2. ✅ ~~新增 5 条风险尚未合并~~ — **已合并到 SPEC § 7（2026-05-11）**
3. **Cross-OS 测试 Day 1**（不是 v0.4）——CI 红了必须修，不允许 disable Windows
4. **manifest schema v1 第一行 installer 代码前必须冻结**——schema 改 = 全量 manifest 迁移
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
| 5 种 install method 用子枚举（type 仍 4） | SUMMARY § 二 冲突 2 决议 | schema 简洁性优先 |
| Hook 措辞重写 | SUMMARY § 二 冲突 3 决议 | 配置纯 yaml/md + 脚本严格审计 |
| Cross-OS 前移 | SPEC § 11 修订 | R03 红旗 6 + R04 P0 |
| 单点维护风险升级 | SPEC § 7 修订 | R04 学术 36%/年 |

### 未决问题（留给 plan-phase）

1. manifest type 计数：keep 4 + 子方法 vs 升 5 type？推荐 4 + 子方法，需 ADR
2. `planning-with-files` 与 `superpowers/writing-plans` 互斥语义（v0.1 dogfooding 观察）
3. gstack-2 / GSD-2 v2 重写迁移（v1.0+ 议题）
4. sigstore / cosign 签名（v0.4+ 议题）
5. `mutually-exclusive skill groups` 元模型（v0.2 设计 pack schema 时定）
6. token budget 监控 UX（v0.3 设计）
7. "用户 10 秒手动覆盖路由错误" UX 量化（v0.4 benchmark 时定）

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
```

### 本 session 关键产出

- `D:/GitCode/harnessed/.planning/ROADMAP.md`
- `D:/GitCode/harnessed/.planning/STATE.md`（本文件）
- `D:/GitCode/harnessed/.planning/REQUIREMENTS.md`

### 性能指标（待 v0.1 启动后填入）

- 当前 phase token 消耗：—
- checkpoint 数量：0
- 累积 ADR 数量：0（目标 v0.4 ≥ 5）
- 路由命中率：— （目标 ≥ 85%）

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
