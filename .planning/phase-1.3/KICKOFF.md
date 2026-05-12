# Phase 1.3 Plan-Phase KICKOFF

> **Phase**: v0.1.0 Phase 1.3 — Base Profile + Categorization Schema + decision_rules.yaml v1
> **触发**: phase 1.2.5 ✅ SHIPPED (ADR 0006 wedge 重定位 + 8 支柱 100% capture verify)
> **启动日期**: 2026-05-12
> **预计工作量**: plan-phase 1.5-2 hour + execute-phase 3-5 工作日（v3 ROADMAP § Phase 1.3 行）
> **状态**: 🔄 in-progress (Wave A 调研启动)

---

## 触发原因

Phase 1.2.5 architecture revision discuss-phase 完成（ADR 0006 + 8 支柱 100% capture）。Phase 1.3 是 wedge 实装的**第一步** — 把 phase 1.2.5 lock 的 categorization schema + decision_rules YAML 落地到代码 + manifest，为 phase 1.4 routing engine v1 实装铺路。

**核心 wedge 节点**:
- ADR 0006 § 6 ROADMAP 重排定义 phase 1.3 = "base profile + categorization schema + decision_rules.yaml v1"
- ASSUMPTIONS.md § E + D1.2.5-12 + D1.2.5-11 锁定
- Sister review M5: AgentDefinition factory contract 推迟到 phase 1.3 plan-phase 起草

---

## Acceptance Bar B1-B8

每条必须通过 plan-phase verify + execute-phase ship。**A7 守恒持续**（ADR 0001-0006 main body 不动；本 phase 加 ADR 0007 errata，baseline tag 加到 7）。

- [ ] **B1** ADR 0007 errata 起草 + accepted + `adr-0007-accepted` tag — manifest schema 加 3 新字段（A7 守恒不动 0001）
- [ ] **B2** manifest schema TypeBox 加 3 字段：
  - `category: enum [meta, engineering, design, content, testing, search]` (A8' 6 类)
  - `install_type: enum [skill, mcp, npm, git]` (D1.2.5-12)
  - `decision_rules: optional Object` (DMN Priority Hit Policy schema — D1.2.5-5)
- [ ] **B3** schema 字段 unit tests ≥ 12 cell — 6 category enum × 4 install_type enum × decision_rules require/optional；tests 202 + 1 skipped → ≥ 215 + 1 skipped
- [ ] **B4** `.planning/decision_rules.yaml` v1 schema 落地 — 从 GRAY-AREA-1 § 2 提取 6 category × ≥ 12 rules MVP（含 design / content / testing / search / meta / engineering decision_rule_anchor）
- [ ] **B5** `harnessed install-base` **独立子命令**（D-9 — 不加 --base flag，避免与现有 6 flag + H1 pre-action gate 冲突）— `src/cli/install-base.ts` 新文件；一键装齐 phase 1.1-1.2 已 ship 10 manifest
- [ ] **B6** ui-ux-pro-max install path 实测（D1.2.5-11）— `npx skills@latest add midwayjs/midway` 验证 OR install adapter 实装（git-clone + 子目录拷贝 + symlink 兜底）
- [ ] **B7** AgentDefinition factory contract draft — `docs/AGENT-DEFINITION-FACTORY-CONTRACT.md` ≥ 100 行（function signature + AgentDefinition schema + 错误处理路径）— phase 1.3 仅 draft 不实装（推 phase 1.4）
- [ ] **B8** Cross-OS CI 三平台保持全绿 + ci.yml A7 step iterate 1-7（新加 0007 baseline tag）+ ADR 0001-0006 main body 守恒持续

---

## 关键约束（守恒）

1. **A7 守恒**: ADR 0001-0006 main body 不动；本 phase 加 ADR 0007 errata 而非 0001 修改 — baseline tag 加到 7（adr-0001~0007-accepted iterate）
2. **A8 LF 行尾**: 所有新文件 LF
3. **B1 security gate**: 新加 manifest 字段 `decision_rules` 是 yaml object，可能含字符串字段 — 需要在 phase 1.1.1 实装的 `checkSecurityViolations` 内确保 `decision_rules.*` 字段也走 shell-escape 过滤
4. **三角色横切持续**: phase 1.3 implementation 走 GSD plan → execute → verify orchestration；execute 阶段子任务用 superpower brainstorming + ralph-loop wrap（已在 CLAUDE.md / GSD 标准 enforce）

---

## Wave 分解（plan-phase）

### Wave A — Research (45-60 min, parallel agents)

| Research | Agent | Output |
|---|---|---|
| **R1** Phase 1.3 implementation patterns | gsd-pattern-mapper | `PATTERNS.md` (mapping 新文件到 phase 1.1-1.2 已 ship pattern analogs — manifest schema TypeBox 加字段 / Ajv enum 校验 / fixture-driven test / cli flag 添加风格) |
| **R2** 实装 specific 调研 | gsd-phase-researcher | `RESEARCH.md` (DMN-style YAML 解析库选型 / TypeBox optional Object 嵌套字段最佳实践 / `npx skills` CLI 实测可行性 / Anthropic AgentDefinition CC API 当前形态) |

### Wave B — Plan (60-90 min, main agent + gsd-planner)

- **B.1** ASSUMPTIONS.md (phase 1.3 — 锁定 P0 灰色地带：YAML 解析库选型 / TypeBox 嵌套 schema / install adapter 兜底策略)
- **B.2** PLAN.md (phase 1.3 蓝图 + 7 wave 分解 + 任务表 + 风险登记)
- **B.3** task_plan.md (planning-with-files 标准 — N 个 atomic 子任务 / 每 task 验收 / 决策来源)

### Wave C — Plan-checker (30 min, gsd-plan-checker agent)

- **C.1** PLAN-CHECK.md verdict (APPROVED / APPROVED WITH PATCHES / REJECT)
- **C.2** apply patches (if needed)

### Wave D — execute-phase 启动准备

- **D.1** progress.md initial state（phase 1.3 起步 + 8 支柱 implementation enforcement）
- **D.2** main agent decide：直接 execute-phase batch 1 启动 / pause review

---

## 输出 Artifacts 清单

```
.planning/phase-1.3/
├── KICKOFF.md                          # 本文件
├── RESEARCH.md                         # W A.R2
├── PATTERNS.md                         # W A.R1
├── ASSUMPTIONS.md                       # W B.1
├── PLAN.md                              # W B.2
├── task_plan.md                         # W B.3
├── PLAN-CHECK.md                        # W C.1
└── progress.md                          # 滚动进度（execute-phase 启动后追加）

docs/adr/0007-categorization-schema-errata.md    # B1 ship (W execute)
docs/AGENT-DEFINITION-FACTORY-CONTRACT.md         # B7 draft (W execute)
.planning/decision_rules.yaml                     # B4 ship (W execute)
src/manifest/schema/installMethods/*.ts           # B2 修改 (W execute)
src/cli/install.ts                                # B5 修改 (W execute)
tests/unit/manifest-validate.*.test.ts            # B3 ship (W execute)
```

---

## Phase 1.3 与 phase 1.4 边界

**Phase 1.3** = schema layer（manifest 加字段 + decision_rules.yaml 落地 + base profile install + 基础设施准备）

**Phase 1.4** = engine layer（实装 main-process-driven routing engine 调用 schema + AgentDefinition factory + 6 category × 12+ decision rules MVP execution）

phase 1.3 不实装 routing engine 本身 — 那是 phase 1.4 的工作。phase 1.3 仅落地 schema + 数据。

---

## 6 baseline tag (phase 1.3 起会加到 7)

当前: adr-0001-accepted / adr-0002-accepted / adr-0003-accepted / adr-0004-accepted / adr-0005-accepted / adr-0006-accepted

phase 1.3 ship: + adr-0007-accepted (manifest schema 加 category/install_type/decision_rules 3 字段 errata)

ci.yml A7 step iterate 1-6 → 1-7（B8 acceptance bar）

---

## 用户硬要求持续 enforce

> "必须在整体上保证笔记里角色主要职责和核心理念的 100% 实现"

phase 1.3 implementation 必须**继承** phase 1.2.5 8 支柱 100% capture（A1'-A8' 在 ADR 0006 + GRAY-AREA-1~5 已 lock）。phase 1.3 schema 落地是**第一步硬实装** — 任何字段 / 验证 / 默认值偏离 phase 1.2.5 lock 都是 P0 blocker。
