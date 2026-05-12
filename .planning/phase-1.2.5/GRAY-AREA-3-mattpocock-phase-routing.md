# GRAY-AREA-3: mattpocock 16+ 招式 Phase Routing 决策树

> **目的**: capture A5' (mattpocock 16+ 命令 phase routing) + A6' (心法+招式配对完整版) — phase 1.2.5 8 支柱 acceptance bar
> **来源**: 用户笔记 § "核心原则与角色定位" + CLAUDE.md + R2 调研真实命令清单（待返回填充）
> **状态**: 🔄 prep (mapping schema + 已 explicit 命令归类完成；完整 16+ list 待 R2 返回填充)
> **R2 责任**: 真实命令清单 verify (GitHub repo) + 推断未在用户笔记里 explicit 归类的命令

---

## § 1 招式定位（用户笔记原话）

> **mattpocock/skills**（**招式**）：16+ 个按需召唤的命令工具集。Discuss 阶段用 `/grill-with-docs` 澄清规格、`/to-prd` 沉淀 PRD；Plan 阶段用 `/to-issues` 拆任务；Execute 阶段用 `/tdd`（备选 `superpowers:test-driven-development`）、`/diagnose` 系统化排错、`/zoom-out` 上下文导航；维护期周期性用 `/improve-codebase-architecture` 做架构健康检查；不需要长解释时用 `/caveman` 节省 token。

### 1.1 招式 vs 心法（GRAY-AREA-4 § 1.1 cross-ref）

| | 心法 (karpathy) | **招式 (mattpocock)** |
|---|---|---|
| 性质 | 态度 / 原则 always-on | **命令 / 工具 on-demand** |
| trigger | 编码全程默认 | **按场景需要召唤** |
| 数量 | 4 核心原则 | **16+ 命令** |
| 类比 | 工程师"职业操守" | **工程师"工具箱"** |

### 1.2 招式的 phase-aware 性

招式不是 "随时可用 toolbox"，是 **phase-specific routing 决策树** — 不同 phase 用不同招式：

| Phase | 主要场景 | 招式角色 |
|---|---|---|
| **Discuss** | 需求澄清 / 规格沉淀 | 输入侧 (规格 → 文档) |
| **Plan** | 任务拆分 | 转换侧 (规格 → 可执行 task) |
| **Execute** | 实施 + 排错 + 导航 | 行动侧 (task → code) |
| **维护** | 架构健康检查 | 反思侧 (code → 改良建议) |
| **Token-省** | 上下文压缩 | 优化侧 (任意 phase 都可调) |

---

## § 2 5-Phase × 命令 Mapping Table（A5' capture）

### 2.1 用户笔记 explicit 提到的命令 + 归类

| Phase | 命令 | 用途（用户笔记原话）| 触发条件 |
|---|---|---|---|
| **Discuss** | `/grill-with-docs` | 澄清规格 — 把模糊需求 grill 出明确条款 | 子任务规格不明 / 跨技术栈整合 |
| **Discuss** | `/to-prd` | 沉淀 PRD — 把 brainstorm 输出转成正式 PRD | 大功能 / 跨多 sprint 的功能完成 brainstorm 后 |
| **Plan** | `/to-issues` | 拆任务 — PRD → 可执行 issue 列表 | task_plan.md 之前的中间转换 |
| **Execute** | `/tdd` | TDD red-green-refactor — 备选 `superpowers:test-driven-development` | 核心业务 / 算法 / 高可靠性场景 |
| **Execute** | `/diagnose` | 系统化排错 — 不再"猜 bug"，按方法论排查 | 出现 bug / 测试 fail / 异常表现 |
| **Execute** | `/zoom-out` | 上下文导航 — 陌生模块拉远镜头看全貌 | 接手陌生代码 / 大改动前先理解结构 |
| **维护** | `/improve-codebase-architecture` | 架构健康检查 — 周期性走查找架构债 | 维护期 / phase 完成后 / 季度健康检查 |
| **Token-省** | `/caveman` | 节省 token — 不需要长解释时用 | 简单 task / 长 session 中后期 |

### 2.2 R2 调研补充（待填）

R2 任务：
1. 从 mattpocock GitHub repo 抓取真实完整 16+ 命令清单
2. 对未在用户笔记中 explicit 归类的命令推断 phase（Discuss / Plan / Execute / 维护 / Token-省）
3. 更新本表格（§ 2.2）

预填占位（R2 返回后替换）：

```
| Phase | 命令 (R2 调研) | 用途 | 触发条件 |
|---|---|---|---|
| ? | <command-1> | <purpose-from-readme> | <推断 trigger> |
| ? | <command-2> | ... | ... |
| ... | (R2 调研后 8+ 命令补全) | ... | ... |
```

---

## § 3 routing engine 内 招式 trigger schema（A5' enforcement）

### 3.1 Phase 自动检测 + 命令推荐

routing engine 在 subagent 内根据**当前 phase** + **task 上下文**决定招式触发：

```yaml
mattpocock_phase_routing:
  - phase: Discuss
    triggers:
      - condition: subtask.spec_clarity == "ambiguous"
        recommend: /grill-with-docs
        prompt: "spec 不明 — 用 /grill-with-docs 澄清?"
      - condition: subtask.scope == "feature" && subtask.requires_prd == true
        recommend: /to-prd
        prompt: "大功能 — 用 /to-prd 沉淀正式 PRD?"
  
  - phase: Plan
    triggers:
      - condition: prev_phase == "Discuss" && task_decomposition_pending
        recommend: /to-issues
        prompt: "需要把 PRD 拆成 issue?"
  
  - phase: Execute
    triggers:
      - condition: subtask.is_core_business || subtask.is_algorithm || subtask.high_reliability
        recommend: /tdd
        prompt: "核心 logic — 用 /tdd 走 red-green-refactor?"
        note: superpower:test-driven-development 是备选
      - condition: error_encountered || test_failing
        recommend: /diagnose
        prompt: "遇到 bug — 用 /diagnose 系统排错?"
      - condition: working_in_unfamiliar_module
        recommend: /zoom-out
        prompt: "陌生模块 — 用 /zoom-out 拉远看全貌?"
  
  - phase: 维护
    triggers:
      - condition: triggered_periodically (每 sprint / 每 phase 完成)
        recommend: /improve-codebase-architecture
        prompt: "维护检查 — 跑 /improve-codebase-architecture?"
  
  - phase: Token-省
    triggers:
      - condition: session_length > threshold || subtask.simple_action
        recommend: /caveman
        prompt: "节省 token — 用 /caveman 简洁模式?"
        scope: 任意 phase 都可叠加
```

### 3.2 推荐模式（招式 ≠ 强制）

招式与心法核心差异：
- 心法 = always-on **强制 enforce**（违反 = ralph-loop COMPLETE 拒绝）
- 招式 = on-demand **推荐 prompt**（用户/agent 可拒绝）

routing engine 不强制招式，而是 **prompt 推荐**：
- subagent 检测到 trigger 条件 → prompt user (或 agent 自决) "建议用 /<command>?"
- yes → 触发招式
- no → 继续不触发

避免 "招式过度"导致 token 浪费 + 流程僵化。

---

## § 4 心法 + 招式配对 day-to-day 模式（A6' 完整 capture）

> 用户笔记原话："心法 + 招式 = 真正工程师的 day-to-day 模式"

### 4.1 配对运作图

```
┌─ subagent 启动 (子任务: "实现 X 模块") ─────────────────┐
│                                                          │
│  心法 (always-on baseline) ←─── inject CLAUDE.md system │
│   ┌──────────────────────────────────┐                  │
│   │ Think Before Coding              │ ← 持续 enforce  │
│   │ Simplicity First                 │   (无须 trigger)│
│   │ Surgical Changes                 │                  │
│   │ Goal-Driven Execution            │                  │
│   └──────────────────────────────────┘                  │
│                  ↓                                        │
│  brainstorming (superpower) — 子任务设计澄清            │
│                  ↓                                        │
│  编码循环:                                                │
│    每 step: 心法 enforce ← always-on                    │
│              ×                                            │
│              招式 trigger ← on-demand by phase / state  │
│              ┌──────────────────────────────┐           │
│              │ Discuss → /grill-with-docs   │           │
│              │ Plan → /to-issues            │           │
│              │ Execute → /tdd, /diagnose,   │           │
│              │           /zoom-out          │           │
│              │ 维护 → /improve-codebase     │           │
│              │ Token 省 → /caveman          │           │
│              └──────────────────────────────┘           │
│                  ↓                                        │
│  ralph-loop wrap                                          │
│   /ralph-loop "..." --completion-promise "COMPLETE"      │
│                  ↓                                        │
│  COMPLETE → return 主流程                                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.2 配对特性

| 维度 | 心法 always-on | 招式 on-demand |
|---|---|---|
| **激活时机** | subagent.start() 自动注入 | trigger 条件命中 prompt 推荐 |
| **作用范围** | 全子任务编码过程 | 特定 phase / state 时点 |
| **强制度** | 强制 enforce (违反 → COMPLETE 拒) | 推荐 (可选采用) |
| **成本** | ~200 tokens 固定占用 | 按需消耗 (一般 100-500 tokens / 命令) |
| **配对效果** | 心法兜底质量 + 招式增援效率 = day-to-day 模式 | |

### 4.3 配对实例（用户笔记 anchor — JWT auth 模块完整流程）

子任务: "实现 JWT 用户认证模块"

```
1. subagent 启动
   ├── 心法 inject (always-on):
   │     [Think Before Coding | Simplicity First |
   │      Surgical Changes | Goal-Driven Execution]
   └── 招式 phase = Execute 默认

2. brainstorming (superpower)
   澄清: JWT 算法选型 (HS256 vs RS256) / token 存储 (httpOnly cookie vs localStorage)
        / refresh 流程 / 安全考量 (XSS/CSRF)

3. 编码循环 step 1: 选型 jose/jsonwebtoken
   ├── 心法 enforce: Think Before Coding ✓ (已 brainstorm)
   ├── 招式 trigger: 不熟 jose v6 API
   │     → /grill-with-docs jose v6 verify API
   │     → 返回 jose v6 verify usage 文档
   └── 决定: 采用 jose v6 (API 更现代)

4. 编码循环 step 2: 实施 JWT verify
   ├── 心法 enforce: Simplicity First ✓ (不抽 OAuth fallback)
   ├── 招式 trigger: 核心算法 high-reliability
   │     → /tdd JWT verify hot path
   │     → red-green-refactor 验证
   └── commit (Surgical Changes ✓ — single concern)

5. 编码循环 step 3: 遇到 bug "token expired edge case"
   ├── 心法 enforce: Goal-Driven ✓ (服务 "expired token rejected" criterion)
   ├── 招式 trigger: bug 出现
   │     → /diagnose token expired edge case
   │     → 系统排查找到 root cause
   └── fix + commit

6. ralph-loop wrap
   /ralph-loop "实现 JWT auth 模块。完成标准:登录注册功能完整、测试通过、
                文档更新、符合 karpathy simplicity。完成后输出 COMPLETE"
                --max-iterations 20 --completion-promise "COMPLETE"

7. COMPLETE → return 主流程 (含 backup state / state.json 更新等)
```

---

## § 5 capture verification (Wave D 用)

| Acceptance Bar | 本文档 capture | 状态 |
|---|---|---|
| **A5'** 16+ 命令 list | § 2.1 已含 8 explicit + § 2.2 R2 待填 | 🔄 partial (待 R2) |
| **A5'** 5 phase × 命令 mapping | § 2.1 表格 + § 3.1 schema | ✅ |
| **A5'** routing engine schema | § 3.1 yaml | ✅ |
| **A6'** 心法+招式配对机制 | § 4.1 运作图 + § 4.2 特性表 | ✅ |
| **A6'** day-to-day 模式 | § 4.3 JWT auth 实例完整流程 | ✅ |

A5' partial (待 R2 补完整命令清单) / A6' 100% capture ✅

---

## § 6 R2 返回后必填项

R2 (gsd-project-researcher) 完成后回填本文档：
- [ ] § 2.2 真实 16+ 命令清单（来自 GitHub repo verify）
- [ ] 未 explicit 归类的命令推断 phase（Discuss / Plan / Execute / 维护 / Token-省）
- [ ] 真实命令的 install method（mattpocock/skills 是 pack 还是单独命令？）
- [ ] § 3.1 schema 补全（trigger 条件可能扩展）

R2 返回后 main agent 二次 edit 本文档完成 A5' final capture。

---

## § 7 References

- 用户笔记 § "核心原则与角色定位" — mattpocock 招式定义
- 用户笔记 § "工作流" — 招式按 phase 触发实例
- CLAUDE.md § "角色与框架定位" — 8 个 explicit 命令归类 (`C:\Users\easyi\.claude\CLAUDE.md`)
- mattpocock GitHub repo — R2 调研后填 URL

[Wave A R2 返回后追加 cross-ref + 真实数据]
