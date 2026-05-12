# Phase 1.2.5 Progress & Findings Tracker

> **本文件合并 progress + findings 双重职责**（系统对独立 findings.md 文件名敏感，故合并 — phase-1.1/1.2 同款）
> **完整规划与依赖图**：见 `KICKOFF.md`
> **Section A** — 进度日志（happy path）
> **Section B** — Findings & Decision Log（异常 / 决策修订 / blocker）
> **Finding 编号续接**：phase 1.2 结束在 F32；phase 1.2.5 从 **F33** 开始

---

## Section A — 进度

### A.1 维护规则

- 每完成一个 wave step → § A.4 追加一行 `YYYY-MM-DD | <wave>.<step> | <result> | <commit-shorthash>`
- A1'-A8' 8 支柱 acceptance bar 进度同步 § A.2 状态
- Wave 完成时 § A.3 标记 ✅ + 跑 Wave-Level Acceptance Checkpoint
- Blocker / 异常 / 决策修订写到 § B（不进 § A），事后 § A 用一行引用 `see § B Fxx`
- 守恒约束（A7/A8）持续 enforce — 任何 ADR 0001-0005 main body 改动诱惑立即 STOP

### A.2 Acceptance Bar Snapshot — 8 支柱 100% Capture

(每 wave step 后用 ✅/❌/⏳ 更新；不达成 8/8 即不能进 phase 1.3)

- ⏳ **A1'** gstack 6+ 虚拟角色矩阵 + 触发条件 + sanity check
- ⏳ **A2'** gstack 双职责区分（"做什么" vs "是否值得做"）
- ⏳ **A3'** GSD 环境质量层（CI / lockfile / Cross-OS / Corepack / 工具版本基线）
- ⏳ **A4'** karpathy 心法 4 原则 1:1 enforce + always-on 注入
- ⏳ **A5'** mattpocock 16+ 招式 phase routing 决策树
- ⏳ **A6'** 心法+招式配对（主流程注入 + subagent phase trigger）
- ⏳ **A7'** superpower brainstorming + TDD 触发规则
- ⏳ **A8'** 4+ skill category × decision rules + curate criteria

### A.3 Wave 进度概览

| Wave | 内容 | Steps | 状态 |
|------|------|-------|------|
| A | Researcher 调研 (R1 routing engine + R2 skill ecosystem) | R1 + R2 (parallel async) | 🔄 in-progress |
| B | 综合 (ASSUMPTIONS + 5 GRAY-AREA) | B.1 - B.6 | ⏳ pending (B.3 + B.5 已 prepare 走预备做) |
| C | Spec 修订 (PROJECT-SPEC v3.0 + ADR 0006 + ROADMAP 重排) | C.1 - C.3 | ⏳ pending |
| D | Cross-validation (sister CC review + paranoid + final acceptance) | D.1 - D.4 | ⏳ pending |

### A.4 进度日志（追加式 — newest at bottom）

<!-- 示例：2026-MM-DD | <wave>.<step> | <result> | <commit-shorthash> -->

2026-05-12 | A.start | KICKOFF.md created (156L); 8 支柱 acceptance bar A1'-A8' locked; 5 P0 灰色地带 enumerated; 4 wave 分解; researcher R1+R2 spawned async parallel | (in-progress)
2026-05-12 | B.prep.1 | progress.md 框架 created (本文件) | (in-progress)
2026-05-12 | B.prep.2 | GRAY-AREA-2-gstack-roles.md prepared (A1'+A2' 完整 capture from 用户笔记 + CLAUDE.md, 不依赖 researcher) | (in-progress)
2026-05-12 | B.prep.3 | GRAY-AREA-4-karpathy-enforcement.md prepared (A4' 完整 capture from 用户笔记) | (in-progress)

### A.5 Wave-Level Acceptance Checkpoints

| Wave | 完成验收子集 |
|------|--------------|
| A | R1 + R2 RESEARCH-*.md 各自 ≥ 5 § sections + 必含 References § + 关键 P0 input 给出推荐 |
| B | ASSUMPTIONS.md 8 支柱 × 5 P0 全部 locked / 5 GRAY-AREA.md 完成 |
| C | PROJECT-SPEC v2.1 → v3.0 in-place patch / ADR 0006 ≥ 200 行 accepted / ROADMAP phase 1.3+ 重排完成 |
| D | sister CC review verdict ≥ APPROVED WITH PATCHES / 8/8 A1'-A8' ✅ / patches 全 apply 后 final ✅ |

---

## Section B — Findings & Decision Log

### B.1 用途

- 执行中遇到的意外、决策修订、需要 escalate 的事项记录在此
- A7 守恒（ADR 0001-0005 main body 不动）持续 enforce — 本 phase 加 ADR 0006 不是 errata
- 用户硬要求：8 支柱 100% 实现 — 任一 A1'-A8' 不达成都是 P0 blocker

### B.2 Finding 模板

```
#### F<NN>: <标题简述>
- **Date**: YYYY-MM-DD
- **Wave**: <wave>.<step>
- **Type**: blocker | decision | deviation | discovery | risk-realized
- **Severity**: P0 (阻塞 phase ship) | P1 (阻塞当前 wave) | P2 (warning) | P3 (note)
- **Context**: 1-2 句简述触发场景
- **Investigation**: 调查过程
- **Resolution**: 采取的行动
- **Impact**: 对当前 wave / 后续 phase 的影响
- **Cross-ref**: progress.md § A.4 / GRAY-AREA / ADR / 其他 finding
```

### B.3 已知预期 finding 占位

#### F33: routing engine subagent reload 可行性（预计 Wave A R1）

- **Predicted Date**: Wave A R1 调研完成
- **Predicted Type**: discovery | blocker (depending on outcome)
- **Predicted Severity**: P0 if CC 不支持 subagent skill reload (迫使 architecture 大改)
- **Background**: 用户提议 subagent isolation = 决策路由 + skill 安装 + invoke 全在 subagent 内。如 CC v2.x 不支持 subagent 内 skill 动态 reload，整个 architecture 要换路径（main agent 提前装 + subagent 仅 invoke）
- **Expected Resolution**: 视 R1 调研结论决定 GRAY-AREA-1 设计

#### F34: 用户笔记里某些 skill 真实性 (预计 Wave A R2)

- **Predicted Date**: Wave A R2 调研完成
- **Predicted Type**: discovery
- **Predicted Severity**: P2-P3
- **Background**: 用户笔记里 ui-ux-pro-max / frontend-design / PPTX 等是否真实开源 skill (有 GitHub repo) 还是抽象概念名 — 影响 v0.1 candidate 库实际可装性
- **Expected Resolution**: R2 verify 真实存在性 → 真实候选进 v0.1 / 概念名留 v0.2+ 等社区出 skill

### B.4 已锁定决策追溯表（Wave B ASSUMPTIONS 完成后填）

[empty — Wave B 完成后填 D1.2.5-1 ~ D1.2.5-N]

### B.5 ADR 升级索引

| ADR | Status | Trigger | Date |
|-----|--------|---------|------|
| 0006 | ⏳ planned (Wave C C.2) | 三层栈机器化 wedge 重定位 | TBD |
| 0007 | ⏳ open slot (phase 1.3) | manifest schema 加 `category` + `decision_rules` 字段 errata (A7 守恒不动 0001) | TBD |

### B.6 Wave-level retrospective

[empty — 每 wave 完成后追加]

---

## Section C — Acceptance Bar 8 支柱 Capture Verification (Wave D 用)

> Wave D cross-validation 时按本表逐条 verify；任一 ✗ 都 block phase 1.2.5 ship。

| 支柱 | 验证文档 | 验证查询 (cmd / grep / 文件检查) | 状态 |
|---|---|---|---|
| **A1'** gstack 6+ 角色矩阵 | GRAY-AREA-2 + ADR 0006 § X | grep "Designer\|QA\|CSO\|EM\|Paranoid\|CEO" 全 hit + matrix table 含触发条件列 | ⏳ |
| **A2'** gstack 双职责 | GRAY-AREA-2 + ADR 0006 | grep "做什么\|是否值得做\|strategy.*governance" 区分明确 | ⏳ |
| **A3'** GSD 环境质量层 | GRAY-AREA-* + ADR 0006 + ROADMAP | grep "环境质量\|CI 守恒\|lockfile\|Cross-OS\|Corepack" 全 hit | ⏳ |
| **A4'** karpathy 4 原则 1:1 enforce | GRAY-AREA-4 + ADR 0006 | grep "Think Before Coding\|Simplicity First\|Surgical Changes\|Goal-Driven" 4/4 hit + always-on 注入机制描述 | ⏳ |
| **A5'** mattpocock 16+ 招式 phase routing | GRAY-AREA-3 + ADR 0006 | 16+ 命令 list 含 phase 归类 + 5 phase × 命令 mapping table | ⏳ |
| **A6'** 心法+招式配对 | GRAY-AREA-3 + GRAY-AREA-4 + ADR 0006 | 显式描述 "心法 always-on + 招式 on-demand by phase" 配对机制 | ⏳ |
| **A7'** superpower brainstorming + TDD 触发 | GRAY-AREA-1 + ADR 0006 | 核心业务/算法/高可靠性 识别规则 + 触发流程 schema | ⏳ |
| **A8'** 4+ skill category × decision rules + curate criteria | GRAY-AREA-1 + GRAY-AREA-5 + ADR 0006 | category list ≥ 4 + 每 category 至少 1 个 decision rule 实例 + curate criteria 5+ 项 | ⏳ |

---

## 附：Phase 1.2.5 总体规模 baseline

| 项 | Phase 1.2 baseline | Phase 1.2.5 target |
|---|---|---|
| Production TS lines | ~2370 | unchanged (本 phase 不改 code) |
| Test lines | ~2400 | unchanged |
| Tests passing | 202 + 1 skipped | unchanged |
| Manifests | 10 | unchanged |
| ADR | 5 (0001-0005) | 6 (新加 0006 wedge 重定位) |
| Commits | ~98 | +5-10 (本 phase 仅 docs) |
| 工期 | ~1 工作日 | 3-4 hour |
| 新 deps | 0 | 0 |
