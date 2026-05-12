# Phase 1.2.5 — Architecture Revision Discuss-Phase KICKOFF

> **Wedge 重定位 — 三层栈方法论的完整机器化**
> 启动日期：2026-05-12
> 工作量预估：3-4 hour（4 wave）
> 状态：🔄 in-progress (Wave A — 调研)
> Phase 1.2 + 1.2.1 hotfix 已 SHIPPED；本 phase **仅修订 architecture 文档 + 准备 phase 1.3+ implementation，不 break 已 ship 代码**

---

## 触发原因

Phase 1.2 SHIPPED 后用户在三轮对话中提出架构 wedge 纠偏：

1. **第 1 轮**: harnessed 不是"5-10 固定上游 manifest"，是"**N 大类 × M 候选 + 决策辅助 + 按需装**"
2. **第 2 轮**: 不是 "替换 base"，是 "**base 不动 + extension 叠加**"；harnessed-driven 主动决策路由（不是 user-driven 浏览）
3. **第 3 轮**: subagent isolation + ralph-loop wrap + **整个三层栈方法论的机器化**（不仅 4 类 skill）

最终 wedge 描述：

> **完整三层栈方法论的可执行 engine — 6+ 虚拟角色 / 双职责治理 / 环境质量 / 4 心法 / 16+ 招式 phase 路由 / 心法-招式配对 / brainstorming-TDD 触发规则 / 4+ skill category — 全部从静态 CLAUDE.md 升级为 subagent-isolated routing engine**

---

## Acceptance Bar — 8 支柱 100% Capture（A1' - A8'）

每条必须在 PROJECT-SPEC v3.0 + ADR 0006 + routing engine schema 中**显式可验证 capture**。**不达成 8/8 即不能进 phase 1.3**：

- [ ] **A1'** gstack **6+ 虚拟角色矩阵**（Designer / QA / CSO / EM / Paranoid Staff Engineer / CEO 等）+ 各自 trigger 条件 + sanity check 机制
- [ ] **A2'** gstack **双职责区分**（"做什么"strategy decisions vs "是否值得做"governance gates）
- [ ] **A3'** GSD **环境质量层**（CI 守恒 / lockfile / Cross-OS / Corepack / 工具版本基线 enforce — phase 1.1 已实证的核心维度）
- [ ] **A4'** karpathy **心法 4 原则 1:1 enforce**（Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution — subagent always-on 注入机制）
- [ ] **A5'** mattpocock **16+ 招式 phase routing 决策树**（Discuss / Plan / Execute / 维护 / Token-省 5 phase × 16+ 命令 mapping）
- [ ] **A6'** **心法+招式配对**（主流程注入心法 + subagent 按 phase trigger 招式 = "真正工程师 day-to-day 模式"）
- [ ] **A7'** superpower **brainstorming + TDD 触发规则**（核心业务/算法/高可靠性的精准识别 → 决定是否强制 TDD）
- [ ] **A8'** **4+ skill category × decision rules + curate criteria**（meta / engineering / design / content / testing / search — 含决策路由实例 + 候选准入标准）

## 5 P0 灰色地带决策

| ID | 主题 | 候选 |
|---|---|---|
| **P0-1** | 决策规则存放位置 | (a) manifest `decision_rules` 自描述 / (b) `routing/categories.md` 中心化 SSOT / (c) 两者结合（manifest 自描述 + 中心仲裁） |
| **P0-2** | gstack 治理关卡编码深度 | (a) routing engine 1:1 enforce 强制级别 / (b) 仅 prompt 提示 / (c) 不编码（用户手工触发） |
| **P0-3** | curate criteria | (a) v0.1 maintainer 手工 / (b) v0.4+ community PR / (c) 渐进策略（phase-aware） |
| **P0-4** | workflow 模式库范畴 | (a) 进 routing engine / (b) docs only / (c) 渐进（v0.1 docs；v0.2+ 编码） |
| **P0-5** | superpower brainstorming + TDD 触发规则 | (a) hard-coded（核心业务/算法/可靠性识别表）/ (b) heuristic（基于 task description match）/ (c) user-decide（subagent 启动 prompt 用户） |

---

## Wave 分解（3-4 hour 总工作量）

### Wave A — 调研（45-60 min，parallel researcher agents）⏳ in-progress

| Research | Agent | Output |
|---|---|---|
| **R1** CC subagent API + skill 动态 reload + langchain/OpenAI assistants expert routing patterns | gsd-phase-researcher | `RESEARCH-1-routing-engine.md` |
| **R2** 4+ category skill 生态（meta/design/content/testing/search 现状候选 + decision rules 实例 + curate criteria 参考）| gsd-project-researcher | `RESEARCH-2-skill-ecosystem.md` |

### Wave B — 综合（60-90 min，main agent）

- **B.1** `ASSUMPTIONS.md` — 8 支柱 × 5 P0 决策 locked 状态
- **B.2** `GRAY-AREA-1-routing-engine.md` — subagent isolation + auto-install + reload + decision rules grammar
- **B.3** `GRAY-AREA-2-gstack-roles.md` — 6+ 角色矩阵 + 双职责 + 触发条件
- **B.4** `GRAY-AREA-3-mattpocock-phase-routing.md` — 16+ 命令 × 5 phase mapping table
- **B.5** `GRAY-AREA-4-karpathy-enforcement.md` — 4 原则 always-on 注入 (CLAUDE.md auto vs hook reminder)
- **B.6** `GRAY-AREA-5-curate-criteria.md` — 候选库准入 / 维护 / phase-aware 策略

### Wave C — Spec 修订（45-60 min，main agent）

- **C.1** `PROJECT-SPEC.md` v2.1 → v3.0（wedge 重定位 § 1.1 升级 + § 2 上游清单分 base/extension + § 6 wedge 描述更新）
- **C.2** `docs/adr/0006-three-stack-mechanization-wedge.md` 起草（三层栈机器化 wedge + 8 支柱 capture verification）
- **C.3** `.planning/ROADMAP.md` 重排：
  - phase 1.3 = base profile + categorization schema + manifest `decision_rules` 字段（ADR 0006 + ADR 0007 errata）
  - phase 1.4 = routing engine + 4+ category MVP + research workflow E2E
  - phase 2.x 顺序调整

### Wave D — Cross-validation（30-45 min，sister CC review + paranoid）

- **D.1** 跨 session sister CC review — 8 支柱 100% capture verify + paranoid lens
- **D.2** ASSUMPTIONS / PROJECT-SPEC v3.0 / ADR 0006 / ROADMAP patches per sister findings
- **D.3** Final acceptance — 8/8 A1'-A8' ✅
- **D.4** main agent decide：进 phase 1.3 plan-phase / pause review / continue 修订

---

## 输出 Artifacts 清单

```
.planning/phase-1.2.5/
├── KICKOFF.md                          # 本文件 (W A 启动)
├── RESEARCH-1-routing-engine.md        # W A.R1 (researcher 输出)
├── RESEARCH-2-skill-ecosystem.md       # W A.R2 (researcher 输出)
├── ASSUMPTIONS.md                       # W B.1
├── GRAY-AREA-1-routing-engine.md       # W B.2
├── GRAY-AREA-2-gstack-roles.md         # W B.3
├── GRAY-AREA-3-mattpocock-phase-routing.md  # W B.4
├── GRAY-AREA-4-karpathy-enforcement.md # W B.5
├── GRAY-AREA-5-curate-criteria.md      # W B.6
└── progress.md                          # 滚动进度 (类 phase 1.1/1.2)

PROJECT-SPEC.md                          # W C.1 (in-place v2.1 → v3.0)
docs/adr/0006-three-stack-mechanization-wedge.md  # W C.2 (新)
.planning/ROADMAP.md                     # W C.3 (in-place 重排)
```

---

## 守恒约束（贯穿全 phase 1.2.5）

1. **A7 守恒**：ADR 0001-0005 main body 不动；本 phase 加 ADR 0006（不是 0001 errata），baseline tag 增至 6
2. **A8 LF 行尾**：所有新 .md 文件 LF
3. **Phase 1.2 ship 状态**：`runInstall` / installer / cli / lib helpers / tests 全部不动；Wave C 修订 ROADMAP / SPEC / ADR 文档级
4. **manifest schema 不动 (本 phase)**：`decision_rules` 字段加在 phase 1.3 (走 ADR 0007 errata，A7 守恒不动 0001)

---

## 路径策略

- **batch 1 (本 batch)** = Wave A 调研启动 + KICKOFF
- **batch 2** = Wave B 综合（依赖 Wave A 完成）
- **batch 3** = Wave C spec 修订
- **batch 4** = Wave D cross-validation + sister review
- 所有 wave 完成后 → main agent decide 进 phase 1.3 plan-phase

---

## 用户硬要求（acceptance gate）

> **必须在整体上保证笔记里角色主要职责和核心理念的 100% 实现**

A1'-A8' 8 支柱 acceptance bar 是该硬要求的 **可验证 schema**。Wave D cross-validation 必须 8/8 ✅ 才能 ship phase 1.2.5；任何 ✗ 都阻塞 phase 1.3 启动。
