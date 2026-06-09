# GRAY-AREA-3: mattpocock 23 招式 Phase Routing 决策树

> **目的**: capture A5' (mattpocock 23 命令 phase routing) + A6' (心法+招式配对完整版) — phase 1.2.5 8 支柱 acceptance bar
> **来源**: 用户笔记 § "核心原则与角色定位" + CLAUDE.md + R2 调研真实命令清单（已填充 — 来自 RESEARCH-2 § 3.1 GitHub API 实证）
> **状态**: ✅ 完成（R2 实证 23 skills；v0.1 catalog 18 active）

---

## § 1 招式定位（用户笔记原话）

> **mattpocock/skills**（**招式**）：16+ 个按需召唤的命令工具集。Discuss 阶段用 `/grill-with-docs` 澄清规格、`/to-prd` 沉淀 PRD；Plan 阶段用 `/to-issues` 拆任务；Execute 阶段用 `/tdd`（备选 `superpowers:test-driven-development`）、`/diagnose` 系统化排错、`/zoom-out` 上下文导航；维护期周期性用 `/improve-codebase-architecture` 做架构健康检查；不需要长解释时用 `/caveman` 节省 token。

### 1.1 招式 vs 心法（GRAY-AREA-4 § 1.1 cross-ref）

| | 心法 (karpathy) | **招式 (mattpocock)** |
|---|---|---|
| 性质 | 态度 / 原则 always-on | **命令 / 工具 on-demand** |
| trigger | 编码全程默认 | **按场景需要召唤** |
| 数量 | 4 核心原则 | **23 命令 (v0.1 catalog 18 active)** |
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

### 2.2 R2 调研补充（已填充 — 来自 RESEARCH-2 § 3.1 GitHub API 实证）

**真实总数：23 skills（不是预测的 16+）**：10 engineering + 4 productivity + 4 misc + 4 deprecated + 3 in-progress + 2 personal。详尽清单见 `RESEARCH-2-skill-ecosystem.md` § 3.1。本节只列**进 v0.1 catalog 的 18 个 active skill**（去除 deprecated 4 + personal 2 + in-progress 但具体 phase 不明 1）：

| Phase | 命令 | 路径 | 触发条件 |
|---|---|---|---|
| **Discuss** | `/grill-with-docs` ★ | engineering/ | 代码任务 + CONTEXT.md/ADR + ubiquitous language（用户笔记 explicit）|
| **Discuss** | `/grill-me` | productivity/ | **非代码任务**澄清 / 决策树发散（R2 新增）|
| **Discuss** | `/to-prd` ★ | engineering/ | 对话 context 已成熟 → 沉淀 PRD（用户笔记 explicit）|
| **Plan** | `/to-issues` ★ | engineering/ | PRD/plan/spec → GitHub issues 拆分（用户笔记 explicit）|
| **Plan** | `/zoom-out` | engineering/ | 进 plan 阶段前看陌生模块 broader context（笔记 explicit + R2 推断 plan phase 也适用）|
| **Execute** | `/tdd` ★ | engineering/ | red-green-refactor 子任务（用户笔记 explicit）|
| **Execute** | `/diagnose` ★ | engineering/ | hard bug / perf regression 系统化排错（用户笔记 explicit）|
| **Execute** | `/zoom-out` ★ | engineering/ | 跨陌生模块跳转编码（用户笔记 explicit）|
| **Execute** | `/prototype` | engineering/ | UI/state/business 设计需 throwaway 探索（R2 新增）|
| **Execute** | `/triage` | engineering/ | issue 进入 → role-based triage（R2 新增）|
| **维护** | `/improve-codebase-architecture` ★ | engineering/ | 周期性架构健康检查（推荐 3-7d cadence；用户笔记 explicit）|
| **维护** | `/setup-pre-commit` | misc/ | 新项目 / pre-commit 缺失 → 一次性装（R2 新增）|
| **维护** | `/setup-matt-pocock-skills` | engineering/ | 装 mattpocock 全家桶后必须 run 一次（per repo；R2 新增）|
| **维护** | `/git-guardrails-claude-code` | misc/ | 防 destructive git ops（CLAUDE.md hard rule 配套；R2 新增）|
| **Token-省** | `/caveman` ★ | productivity/ | 上下文紧 / 不需详细解释 / batch（用户笔记 explicit；超压缩 ~75% tokens）|
| **Token-省** | `/handoff` | productivity/ | 对话过长 → compact 给下个 session（R2 新增）|
| **meta-skill** | `/write-a-skill` | productivity/ | 创建新 skill / progressive disclosure 模式（R2 新增 — 与 anthropics/skill-creator 重叠备选）|
| **misc / 一次性** | `/migrate-to-shoehorn`, `/scaffold-exercises` | misc/ | 特定迁移 / exercise 模板 — 一次性场景（R2 新增）|

★ = 用户笔记 explicit 提到的命令；其余为 R2 实证补充。

**deprecated 4 项不进 catalog**: design-an-interface / qa / request-refactor-plan / ubiquitous-language（其中 ubiquitous-language 已合到 grill-with-docs；qa 改用 anthropic /qa）

**in-progress 3 项 deferred 到 v0.2+ verify**: review (mattpocock 自家 review，与 paranoid /review 区分) / writing-beats / writing-fragments / writing-shape

**personal 2 项不进 catalog**: edit-article / obsidian-vault（mattpocock 个人专用）

---

## § 3 routing engine 内 招式 trigger schema（A5' enforcement — main-process-driven per D1.2.5-3）

### 3.1 Phase 自动检测 + 命令推荐

**enforcement 路径**: 主流程 routing engine 在 spawn subagent **之前**根据当前 phase + task 上下文决定招式触发；命中 trigger → 主进程 install + 主进程 `/reload-plugins` → AgentDefinition factory inject 到 subagent skills/prompt 字段（subagent 启动后**仅 invoke 已注入 skill**，不能在 subagent 内 install — F33 实证）。

```yaml
mattpocock_phase_routing:
  - phase: Discuss
    triggers:
      - condition: subtask.spec_clarity == "ambiguous" AND subtask.is_code == true
        recommend: /grill-with-docs
        prompt: "代码任务 spec 不明 — 用 /grill-with-docs 澄清 + 维护 CONTEXT.md/ADR?"
      - condition: subtask.spec_clarity == "ambiguous" AND subtask.is_code == false
        recommend: /grill-me
        prompt: "非代码任务澄清 — 用 /grill-me 决策树发散?"
      - condition: subtask.scope == "feature" && subtask.context_mature == true
        recommend: /to-prd
        prompt: "context 已成熟 — 用 /to-prd 沉淀 PRD?"
  
  - phase: Plan
    triggers:
      - condition: prev_phase == "Discuss" && task_decomposition_pending
        recommend: /to-issues
        prompt: "PRD 已就绪 — 用 /to-issues 拆 GitHub issues?"
      - condition: working_in_unfamiliar_module
        recommend: /zoom-out
        prompt: "陌生模块 — 用 /zoom-out 拉远看全貌?"
  
  - phase: Execute
    triggers:
      - condition: subtask.is_core_business || subtask.is_algorithm || subtask.high_reliability
        recommend: /tdd
        prompt: "核心 logic — 用 /tdd 走 red-green-refactor?"
        note: "obra/superpowers-skills (TDD) 是备选 — 见 GRAY-AREA-1 § 4.1 mandatory_tdd_triggers"
      - condition: error_encountered || test_failing
        recommend: /diagnose
        prompt: "遇到 bug — 用 /diagnose 系统排错?"
      - condition: working_in_unfamiliar_module
        recommend: /zoom-out
        prompt: "陌生模块 — 用 /zoom-out 拉远看全貌?"
      - condition: subtask.needs_throwaway_exploration
        recommend: /prototype
        prompt: "UI/state/business 探索 — 用 /prototype throwaway 设计?"
  
  - phase: 维护
    triggers:
      - condition: triggered_periodically (每 sprint / 每 phase 完成 / 3-7d cadence)
        recommend: /improve-codebase-architecture
        prompt: "维护检查 — 跑 /improve-codebase-architecture?"
      - condition: new_project_setup && pre_commit_missing
        recommend: /setup-pre-commit
      - condition: mattpocock_skills_installed_first_time
        recommend: /setup-matt-pocock-skills
        rationale: "per repo 必须 run 一次"
      - condition: new_repo
        recommend: /git-guardrails-claude-code
        rationale: "防 destructive git ops"
  
  - phase: Token-省
    triggers:
      - condition: session_length > threshold || subtask.simple_action
        recommend: /caveman
        prompt: "节省 token — 用 /caveman 简洁模式?"
        scope: "任意 phase 都可叠加"
      - condition: session_too_long_needs_handoff
        recommend: /handoff
        prompt: "对话过长 — 用 /handoff compact 给下个 session?"
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
| **A5'** 23 命令 list | § 2.1 已含 8 explicit + § 2.2 R2 实证 18 active 完整 | ✅ |
| **A5'** 5 phase × 命令 mapping | § 2.1 表格 + § 3.1 schema | ✅ |
| **A5'** routing engine schema | § 3.1 yaml | ✅ |
| **A6'** 心法+招式配对机制 | § 4.1 运作图 + § 4.2 特性表 | ✅ |
| **A6'** day-to-day 模式 | § 4.3 JWT auth 实例完整流程 | ✅ |

A5' 100% capture (R2 实证 23 skills) ✅ / A6' 100% capture ✅

---

## § 6 R2 调研已完成 ✅

R2 (gsd-project-researcher) 已完成 — 23 skill 实证清单见 § 2.2；mapping schema 完整。本 GA-3 状态：✅ 100% capture (A5' + A6')。

---

## § 7 References

- 用户笔记 § "核心原则与角色定位" — mattpocock 招式定义
- 用户笔记 § "工作流" — 招式按 phase 触发实例
- CLAUDE.md § "角色与框架定位" — 8 个 explicit 命令归类 (`C:\Users\easyi\.claude\CLAUDE.md`)
- mattpocock GitHub repo — R2 调研后填 URL

[Wave A R2 返回后追加 cross-ref + 真实数据]
