# GRAY-AREA-4: karpathy 心法 4 原则 1:1 Enforcement

> **目的**: capture A4' (karpathy 4 原则 1:1 enforce + always-on 注入) — phase 1.2.5 8 支柱 acceptance bar
> **来源**: 用户笔记 § "核心原则与角色定位" + CLAUDE.md
> **不依赖 researcher 输出**
> **状态**: ✅ 准备完成 (Wave B Step prepare — 不依赖 R1/R2 调研)

---

## § 1 karpathy 心法定位（用户笔记原话）

> **andrej-karpathy-skills**（**心法**）：所有编码和子任务开发必须严格遵循（Think Before Coding、先思考不直接写、Simplicity First、Surgical Changes、小步原子修改、Goal-Driven Execution、追求最小有效代码）。

### 1.1 心法 vs 招式（用户笔记 § "核心理念" 原话）

| | **心法** (andrej-karpathy) | **招式** (mattpocock) |
|---|---|---|
| 性质 | **态度 / 原则** — always-on 必遵守 | **命令 / 工具** — on-demand 召唤 |
| trigger | 每次写代码都遵守（不 trigger 也 enforce）| 按场景需要时召唤 |
| 数量 | 4 个核心原则 | 16+ 命令 |
| 类比 | 工程师的"职业操守"（fundamental） | 工程师的"工具箱"（utility） |
| 配对 | **心法 + 招式 = 真正工程师 day-to-day 模式** (用户笔记原话) | |

**A6' 心法+招式配对**：心法是 always-on baseline；招式是 on-demand 增援。两者共同构成"day-to-day 模式"。

### 1.2 与 superpower brainstorming + TDD 的关系

执行顺序（用户笔记 § "三层栈执行顺序"）：

```
gstack（决策）→ GSD（稳定）→ superpower（严谨执行）
                                      ↓
                              brainstorming + TDD
                                      ↓
                              [karpathy 心法 always-on 注入]  ← A4'
                                      ↓
                              [mattpocock 招式 on-demand]    ← A5'
                                      ↓
                              ralph-loop COMPLETE
```

→ **subagent 执行子任务时**：先 brainstorming → 编码（心法 always-on enforce + 招式按需召唤）→ ralph-loop wrap → COMPLETE

---

## § 2 karpathy 心法 4 原则（A4' capture）

### 2.1 原则 1: Think Before Coding（先思考，不直接写）

| 维度 | 内容 |
|---|---|
| 含义 | 在动键盘前先理解问题 / 拆解需求 / 列出方案；避免"看到就写"的反射性编码 |
| 子任务实施 | subagent 启动后**先跑 brainstorming**（superpower）澄清子任务设计 / 方案对比 / 设计文档；brainstorming 通过后才进入编码 |
| 反例 | 拿到 task description 直接 Edit / Write 文件 |
| 检测 | 子任务完成后回看：是否有 brainstorming 设计文档？还是直接跳过编码？|

### 2.2 原则 2: Simplicity First（简单优先 / 最小有效代码）

| 维度 | 内容 |
|---|---|
| 含义 | 追求最小有效代码；避免不必要复杂度；YAGNI（You Ain't Gonna Need It）|
| 子任务实施 | subagent 内编码：每加一行代码问"这行真的需要吗？"；不预留 future feature；不抽过早抽象 |
| 反例 | 加 feature flag / config 字段 / 类抽象 for 假设的未来需求 |
| 检测 | 编码后 review：行数最小化？无 dead code？无 unused parameter？无 future-proofing 注释？|
| Phase 1.2 实证 | 多次"超行 vs 简化"取舍（如 backup.ts 167L > 130L target — D1.2-7 决策接受 4 个显式 error path）|

### 2.3 原则 3: Surgical Changes（小步原子修改）

| 维度 | 内容 |
|---|---|
| 含义 | 每个修改是最小、独立、可验证的单元；保持 git 历史干净；single concern per commit |
| 子任务实施 | subagent 内每改一处立即 commit；不 batch 多个 logical change；commit message 含 task ID + 1 句 action |
| 反例 | 一次 commit 含 "fix bug + refactor + 加 feature" 三件事 |
| 检测 | git log 是否每 commit single concern？commit size ≤ 200 行？diff 是否 surgical?|
| Phase 1.2 实证 | 38 commits 在 phase 1.2 全部 single concern (T1.1 / T1.2 / ... / T6.6 / hotfix bad2f20) — atomic commit 模式 |

### 2.4 原则 4: Goal-Driven Execution（追求最小有效代码 / 目标驱动）

| 维度 | 内容 |
|---|---|
| 含义 | 每行代码必须服务于明确目标；不写"以防万一"代码；不写未来可能用到的 helper |
| 子任务实施 | subagent 内每加一段代码问"这段服务于哪个 acceptance criterion？"；不达任何 criterion 就删 |
| 反例 | 加 helper fn for "可能将来用到"；加 try/catch for "假设可能抛错的路径" |
| 检测 | 编码后 review：每段代码可追溯到一个 task acceptance？无 speculative helper？|

---

## § 3 always-on 注入机制（A4' enforcement）

A4' 要求 routing engine **1:1 enforce 4 原则到 subagent 编码守则层**。三种 enforcement 候选：

### 3.1 候选 (a) — CLAUDE.md auto-injection（推荐）

routing engine 在 subagent 启动时自动 inject 一段 system prompt 到 subagent context：

```yaml
subagent_system_prompt_injection:
  source: routing/karpathy-heart.md   # 中心化 SSOT (路径推荐)
  inject_at: subagent.start()
  scope: 子任务编码全过程
  content: |
    # andrej-karpathy 心法 (4 原则) — always-on enforce
    
    1. **Think Before Coding** — 编码前必须先 brainstorming 澄清；不允许直接 Edit/Write
    2. **Simplicity First** — 最小有效代码；YAGNI；不预留 future feature
    3. **Surgical Changes** — 每修改是 atomic commit；不 batch logical change
    4. **Goal-Driven Execution** — 每行代码服务明确 acceptance criterion
    
    违反任一原则 → ralph-loop COMPLETE 拒绝接受
```

**优点**：
- subagent 内自动 enforce，无需 user 手动触发
- 与 brainstorming + TDD + ralph-loop 自然 chain
- routing engine 升级时（v0.2/v0.4）只需改 SSOT 一处

**缺点**：
- 占 subagent context window (~50 tokens × 4 原则 = ~200 tokens)
- 如 CC subagent 不支持 system prompt injection，需 fallback

### 3.2 候选 (b) — Pre-edit hook reminder

routing engine 在 subagent 内每次 Edit/Write 前**hook 提醒**：

```yaml
pre_edit_hook:
  trigger: subagent.tool_use("Edit" | "Write")
  message: "心法 check: 这次修改是否 (1) 已 brainstorm? (2) 最小代码? (3) atomic? (4) 服务明确目标?"
```

**优点**: token 省（只在 edit 时提醒）；用户可见 enforcement
**缺点**: 干扰 subagent 流；hook fatigue 用户/agent 可能 skim

### 3.3 候选 (c) — 文档 only（不 enforce）

仅在 docs/CONTRIBUTING.md 写心法说明，靠 user / subagent 自觉。

**优点**: 0 implementation 成本
**缺点**: **A4' 验收 fail** — 用户硬要求 100% 实现 = (c) 不通过

### 3.4 推荐：(a) + 部分 (b) 混合

- **(a) 主路径**: subagent 启动时 inject CLAUDE.md auto-injection（4 原则 always-on）
- **(b) 关键时刻**: 子任务大改动（changed_files ≥ 5 / new file created）触发 pre-edit reminder hook（避免高风险修改 violating 心法）
- **(c) ✗**: 不采用（验收 fail）

---

## § 4 心法+招式配对（A6' capture）

> 用户笔记原话："心法 + 招式 = 真正工程师的 day-to-day 模式"

### 4.1 配对机制示意

```
┌─ subagent 启动 ─────────────────────────┐
│                                         │
│  1. inject 心法 (always-on)             │
│     karpathy 4 原则 → subagent context  │
│                                         │
│  2. brainstorming (superpower)          │
│     — 子任务设计澄清                    │
│                                         │
│  3. 编码循环:                           │
│     ┌────────────────────────────────┐  │
│     │ 心法 enforce (always-on)       │  │
│     │  ↓                             │  │
│     │ 招式 trigger (on-demand by    │  │
│     │  phase / 任务状态):           │  │
│     │  • Discuss → /grill-with-docs │  │
│     │  • Plan → /to-issues           │  │
│     │  • Execute → /tdd / /diagnose │  │
│     │  • 维护 → /improve-codebase   │  │
│     │  • Token 省 → /caveman        │  │
│     │  ↓                             │  │
│     │ ralph-loop wrap                │  │
│     │  --completion-promise COMPLETE │  │
│     └────────────────────────────────┘  │
│                                         │
│  4. COMPLETE → return 主流程             │
│                                         │
└─────────────────────────────────────────┘
```

### 4.2 配对实例（用户笔记 anchor）

子任务 = "实现 JWT 用户认证模块"：

1. 心法注入：subagent 启动 → 4 原则 always-on
2. brainstorming：澄清 JWT 算法选型 / token 存储 / refresh 流程 / 安全考量
3. 编码：
   - 心法 enforce：先 think before coding（已 brainstorm 通过）→ Simplicity First（不写 OAuth fallback unless required）→ Surgical Changes（auth 实装 1 commit + tests 1 commit + docs 1 commit）→ Goal-Driven (每段代码 serve "JWT login + register works" criterion)
   - 招式按需：
     - 不熟 jose/jwt 库 → `/grill-with-docs jose v6 token verify API`
     - 实施关键算法 → `/tdd JWT verify hot path`
     - 实装中遇到 bug → `/diagnose token expired edge case`
4. ralph-loop wrap：`/ralph-loop "实现 JWT auth 模块。完成标准：登录注册功能完整、测试通过、文档更新、符合 karpathy simplicity。完成后输出 COMPLETE" --max-iterations 20 --completion-promise "COMPLETE"`
5. COMPLETE → return 结果给主流程

---

## § 5 capture verification (Wave D 用)

| Acceptance Bar | 本文档 capture | 状态 |
|---|---|---|
| **A4'** 4 原则定义 | § 2.1 / § 2.2 / § 2.3 / § 2.4 各原则完整定义表 | ✅ |
| **A4'** 1:1 enforce 机制 | § 3.1 候选 (a) CLAUDE.md auto-injection schema | ✅ |
| **A4'** always-on 注入 | § 3.1 inject_at: subagent.start + § 3.4 推荐方案 | ✅ |
| **A6'** 心法+招式配对 | § 4 整段 + § 4.1 流程示意图 + § 4.2 配对实例 | ✅ |
| **A6'** day-to-day 模式 | § 4.1 编码循环图 (心法 always-on × 招式 on-demand) | ✅ |

A4' + A6' (部分) 100% capture ✅ — A6' 还需 GRAY-AREA-3 (mattpocock 16+ phase routing) 完成 cross-ref；待 R2 返回后写。

---

## § 6 References

- 用户笔记 § "核心原则与角色定位" — 心法 / 招式 定义 (本对话历史)
- 用户笔记 § "核心理念" — "心法 + 招式 = day-to-day 模式" 原话
- CLAUDE.md § "角色与框架定位" + § "其他通用规则" (`C:\Users\easyi\.claude\CLAUDE.md`)
- Phase 1.2 实证：38 commits atomic / 多次 simplicity 取舍 (backup.ts L37 超行决策 D1.2-7) — 心法已在 phase 1.1-1.2 实战中实证
- 用户原话强调："必须在整体上保证上面说的角色主要职责和核心理念的 100% 实现"

[Wave A R1/R2 返回后追加 cross-ref 引用 — 特别是 R1 关于 subagent system prompt injection 可行性]
