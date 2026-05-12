# GRAY-AREA-2: gstack 6+ 虚拟角色矩阵 + 双职责治理

> **目的**: capture A1' (gstack 6+ 虚拟角色矩阵) + A2' (gstack 双职责区分) — phase 1.2.5 8 支柱 acceptance bar
> **来源**: 用户笔记 § "gstack 介入节点速查表" + CLAUDE.md § "gstack 治理关卡"
> **不依赖 researcher 输出** — 内容直接从用户已 explicit 的事实 capture
> **状态**: ✅ 准备完成 (Wave B Step prepare — 不依赖 R1/R2 调研)

---

## § 1 gstack 双职责（A2' capture）

gstack 不只是"治理关卡"，是**双职责**层：

| 职责 | 含义 | 类比 | 触发模式 |
|---|---|---|---|
| **"做什么"** (Strategy) | 高层决策 / 产品战略 / 多角色虚拟团队审查 / 商业价值评估 / scope 决策 / sanity check | 像创业团队的董事会 + CEO + CTO 联席 | 项目 / 里程碑级别（不参与子任务）|
| **"是否值得做"** (Governance) | 治理关卡 / sanity check / Paranoid 风险审查 / 安全审查 / 设计审查 | 像 PR 审查官 / 安全官 / 设计官 | 关键节点强制（office-hours / ceo-review / review）/ 条件强制（关键模块 / 复杂架构）/ 可选辅助 |

### 1.1 Strategy 职责 — "做什么 + 值不值得做"

- 决定 **方向** — 这个项目 / 里程碑该不该启动？商业价值在哪？
- 决定 **范围** — scope 应该做到哪里？10-star 潜力评估？
- 决定 **优先级** — 多 milestone 先做哪个？

→ 触发命令：`/office-hours` / `/plan-ceo-review` / `/autoplan` / `/retro`

### 1.2 Governance 职责 — "是否值得做 / 怎么做才安全"

- 决定 **架构合理性** — 工程架构 / 数据流 / 边缘案例 / 依赖锁定
- 决定 **代码质量** — Paranoid 视角找 bug / 安全 / 性能 / 隐患
- 决定 **设计一致性** — 设计系统 / AI 审美问题
- 决定 **安全 & 合规** — CSO 视角

→ 触发命令：`/plan-eng-review` / `/review` / `/design-review` / `/cso` / `/qa` / `/investigate` / `/ship`

---

## § 2 gstack 6+ 虚拟角色矩阵（A1' capture）

用户笔记原话："多角色审查（CEO / Eng Manager / Designer / Paranoid Staff Engineer / QA / CSO 等）"

| # | 角色 | 视角 | 主要触发命令 | 触发条件 | 强制级别 |
|---|---|---|---|---|---|
| 1 | **CEO** | 商业战略 / 商业价值 / 10-star 潜力 / scope 决策 | `/plan-ceo-review` (含在 `/autoplan`) | 新功能 / 大功能启动 | 🔒 **强制（治理关卡）** |
| 2 | **EM (Engineering Manager)** | 工程架构 / 数据流 / 边缘案例 / 依赖锁定 / 实施可行性 | `/plan-eng-review` (含在 `/autoplan`) | 复杂架构（多模块 / 新服务 / 数据模型重构等） | ⚠️ **复杂架构强制** |
| 3 | **Designer** | 设计审查 / 设计系统一致性 / AI 审美问题识别 | `/design-review` | UI 设计完成后 | ⭐ 可选（推荐） |
| 4 | **Paranoid Staff Engineer** | bug / 安全 / 性能 / 隐患 / 找 CI 漏掉的问题 | `/review` | 关键模块 PR 前 | 🔒 **关键模块强制** |
| 5 | **QA** | 端到端验收 / 真实浏览器测试 / 回归测试生成 | `/qa` | 整体功能完成后 | ⭐ 可选补充 |
| 6 | **CSO (Chief Security Officer)** | 安全专项审查 / 合规 / 漏洞 / 权限 | `/cso` | 涉及安全敏感模块 / 凭据 / 权限 | 按需（条件强制） |
| 7+ | **其他扩展** | 类似 Investigator (问题排查) / 发布工程师 (Ship) / 复盘官 (Retro) | `/investigate` / `/ship` / `/retro` | 调试 / 发布 / 项目结束 | 按需 / 可选 |

### 2.1 sanity check 横切机制

每个角色都自带 **sanity check**：
- CEO: scope 是否合理？ROI 评估？
- EM: 架构是否过度设计？dependency 是否锁定？
- Designer: 设计是否符合系统一致性？
- Paranoid: 这段代码生产环境会爆炸吗？
- QA: 用户实际场景能跑吗？
- CSO: 这有没有 supply chain 风险？凭据泄漏？

sanity check **不是单独命令**，是每个角色 review 内含的 "**反问机制**" — gstack agent 在 review 时自动跑（用户笔记原话 "治理关卡与 sanity check"）。

### 2.2 完整 trigger 矩阵 (来自用户笔记 § "gstack 介入节点速查表")

| 节点 | gstack 命令 | 强制级别 | 角色映射 |
|------|------------|----------|---------|
| 新项目 / 大功能启动前 | `/office-hours` | 🔒 **强制（治理关卡）** | 多角色团队（CEO/EM/Designer/Paranoid 等联席）|
| 战略 / scope 锁定前 | `/plan-ceo-review` | 🔒 **强制（新功能必跑）** | CEO 主导 |
| 一键规划连锁 | `/autoplan` | ⭐ 可选（加速 — 连跑 office-hours → ceo-review → eng-review） | 多角色串联 |
| 架构决策前 | `/plan-eng-review` | ⚠️ **复杂架构强制** | EM 主导 |
| UI 设计完成后 | `/design-review` | ⭐ 可选 | Designer 主导 |
| 代码实现后（PR 前）| `/review` | 🔒 **关键模块强制** | Paranoid Staff Engineer 主导 |
| 端到端验收 | `/qa` | ⭐ 可选补充 | QA 主导 |
| 调试 / 问题排查 | `/investigate` | 按需 | Investigator (自动 freeze 到问题模块) |
| 发布准备 | `/ship` / `/land-and-deploy` | ⭐ 可选 | 发布工程师 (PR 描述 / 部署检查) |
| 项目 / 里程碑结束 | `/retro` | ⭐ 可选 | 复盘官 (经验教训总结) |
| 安全专项审查 | `/cso` | 按需 | CSO 主导 |

### 2.3 治理原则（用户笔记原话）

- 🔒 **治理关卡（gates）必须通过才能继续**：新功能启动前 `/office-hours` + `/plan-ceo-review`、关键模块 PR 前 `/review` 是硬关卡，**不能跳过**
- ⚠️ **条件强制**：根据架构复杂度 / 风险等级 / 业务关键度决定是否触发
- ⭐ **可选加分项**：其余命令按需使用，不强制
- gstack 命令生成的文档（Design Doc、Review Report 等）自动沉淀到 `.planning/` 或项目目录，成为后续阶段的输入，**形成链式工作流 — 不要重复产出同类文档**

---

## § 3 gstack 在 routing engine 内的 enforcement schema

### 3.1 Phase-level gates (主流程级别)

routing engine 在 main agent 级别 enforce 这些**硬关卡**：

```yaml
gates:
  - name: new-feature-launch
    description: 新功能 / 大功能启动前
    required: [/office-hours, /plan-ceo-review]
    enforce: BLOCKING        # 不通过 → 主流程 stop
    artifacts_required: [Design Doc 自动沉淀到 .planning/]
  
  - name: complex-arch
    description: 复杂架构（多模块 / 新服务 / 数据模型重构）
    required: [/plan-eng-review]
    enforce: BLOCKING_IF[arch_complexity >= "complex"]
    detect_arch_complexity:
      - 多模块改动 (changed_files spans ≥ 3 modules)
      - 新依赖引入 (package.json modified)
      - 数据模型变更 (migration / schema files modified)
  
  - name: key-module-pr
    description: 关键模块 PR 前
    required: [/review]
    enforce: BLOCKING_IF[is_key_module]
    detect_key_module:
      - manifest 标记 (metadata.is_key_module: true)
      - 路径匹配 (src/manifest/security.ts / src/installers/index.ts 等)
```

### 3.2 Subtask-level reviews (subagent 级别)

routing engine 在 subagent 内 trigger 这些**条件 review**：

```yaml
reviews:
  - name: ui-design-review
    trigger: subtask.intent == "ui design"
    invoke: /design-review
    enforce: RECOMMENDED   # ⭐ 可选 — prompt user 但不 block
  
  - name: e2e-verification
    trigger: subtask.intent in ["release", "milestone-complete"]
    invoke: /qa
    enforce: RECOMMENDED
  
  - name: security-audit
    trigger: subtask.security_sensitive == true
    invoke: /cso
    enforce: RECOMMENDED
```

### 3.3 Sanity check 内嵌

每 gstack 命令调用时，routing engine 不需要单独 sanity check trigger — sanity check 是 gstack 命令**内嵌行为**（gstack agent 自身跑 review 时 always 含 sanity check 视角）。

---

## § 4 P0-2 决策（gstack 治理关卡编码深度）— 推荐 (a) 1:1 enforce

> P0-2 候选: (a) routing engine 1:1 enforce 强制级别 / (b) 仅 prompt 提示 / (c) 不编码（用户手工触发）

**推荐 (a) 1:1 enforce**，理由：

1. **用户硬要求 100% 实现** — (b)(c) 都会让 8 支柱 acceptance bar A1' 不达成
2. **gstack 的核心价值是治理强制** — 如果 routing engine 不 enforce，gstack 就退化为"建议工具"，失去 wedge 价值
3. **phase 1.1.1 + 1.2 经验**：A7 守恒 / B1 security gate / H4 mock shim 等都是 hard enforce 才让架构稳健 — gstack 治理关卡是同等级
4. **trade-off**：implementation 成本提升 ~30%（routing engine 加 phase-level gates + arch 复杂度检测），但获得"硬保证完整三层栈方法论 100% 实现"

### 实现策略（v0.1 起步）

- **v0.1**: phase-level BLOCKING gates 全实装（new-feature-launch / complex-arch / key-module-pr）
- **v0.2**: subtask-level RECOMMENDED reviews 加（design-review / qa / cso）
- **v0.4+**: sanity check 增量扩展（gstack agent feature 演进时同步）

---

## § 5 capture verification (Wave D 用)

| Acceptance Bar | 本文档 capture | 状态 |
|---|---|---|
| **A1'** 6+ 虚拟角色矩阵 | § 2.2 完整 11 行矩阵 + § 2 7 角色定义 | ✅ |
| **A1'** 各角色 trigger 条件 | § 2.2 第 4 列 + § 3.1/3.2 schema | ✅ |
| **A1'** sanity check 机制 | § 2.1 + § 3.3 | ✅ |
| **A2'** 双职责区分 | § 1 整段 + § 1.1 / § 1.2 详解 | ✅ |

A1' + A2' 100% capture ✅ — 待 ADR 0006 + PROJECT-SPEC v3.0 引用本 GRAY-AREA。

---

## § 6 References

- 用户笔记 § "gstack 介入节点速查表" (本对话历史)
- CLAUDE.md § "gstack 治理关卡（强制 / 可选）" (`C:\Users\easyi\.claude\CLAUDE.md`)
- 用户原话强调："必须在整体上保证上面说的角色主要职责和核心理念的 100% 实现"

[Wave A R1/R2 返回后追加 cross-ref 引用]
