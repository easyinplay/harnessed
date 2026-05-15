# OMC (oh-my-claudecode) 对比与借鉴 — v0.2.0 外部参考

> 来源：2026-05-14 子 agent 研究 `Yeachan-Heo/oh-my-claudecode` v4.13.7
> 用途：v0.2.0 各 phase discuss-phase 按需取用的外部参考。**不是 spec，不锁定决策** —— 借鉴点由对应 phase GSD 流程正式评估后落 PLAN/ROADMAP。
> **SSOT 引用纪律**：本文件引用 phase / ADR 编号一律**语义锚定 + 不预占动态编号**（见 § 0）。

---

## § 0 SSOT 引用纪律（核心理念 — 适用所有 intel / 参考文档）

intel 文件是**外部参考，不是 SSOT**。引用 SSOT 资源（phase / ADR 编号）时必须防 stale：

- **phase 编号** → 用**语义锚定**（"Phase 2.2 = execute-task workflow"），不只靠数字 —— phase 可能被 insert（phase 1.2.5 插入即先例）
- **ADR 编号** → **绝不预占**。ADR 编号是"先 plan-phase 先占"的动态资源。需要新 ADR 时写"需起 errata ADR（编号由对应 phase plan-phase 流程分配）"，**不写死 ADR NNNN**
- **校验时机** → 任何 phase discuss-phase 取用本文件时，先比对当前 `ROADMAP.md` / `docs/adr/` 实际编号，发现 drift 即就地修正

> 反面教材：本文件 2026-05-14 初版写死 "phase 2.0" + "ADR 0010"，2026-05-15 v0.2.0 激活 + Phase 2.1 plan-phase 后即 stale（execute-task 实际是 Phase 2.2；ADR 0010 已被 Phase 2.1 installer-schema-extension-errata 占用）。本次（2026-05-15）重写修正。

---

## 借鉴判断标准（核心纪律）

借鉴某个理念时，**先判断它落到哪一层**，再决定实现路径 —— 判断标准不是"能装配 vs 只能造轮子"，而是"**这轮子属于上游组件还是编排引擎**"：

| 理念落点 | 实现路径 |
|---------|---------|
| **上游组件层**（prompt / agent / skill 内容）| 装配现成上游 manifest；对比项目有**可独立提取的子组件**也当上游装配；真没有 → 放弃或推迟，**绝不自造**（造 = 变 ECC）|
| **编排引擎层**（routing / DAG / installer / checkpoint / model-tier 逻辑）| **本来就该自己造** —— harnessed 80% 价值在此（`dag.ts` 142L Kahn 即先例）。原则：karpathy 极简、只留精髓、不引重型库；对比项目有同类引擎 → **读源码借鉴算法结构**（学，不 vendor）|
| **配置/数据层**（decision_rules.yaml / phases schema / checkpoint 模板）| 自己定义 schema（harnessed 核心资产）；对比项目的 schema 格式可直接借鉴 |

OMC 本质是自建派（ECC 同类）；harnessed 是装配派。但**两者都做编排** —— 区别只在：上游组件层 harnessed 装配、OMC 自造；编排引擎层两者都自造（harnessed 求极简）。**不存在"OMC 有的 harnessed 默认不要"这种功能黑名单。**

---

## 6 条可借鉴点（v0.2.0+，对应 phase 见各条）

> 第 1-4 条旧二分法下已成立；第 5-6 条是**三层框架新解锁**（旧标准会误杀/模糊）。

### 1. `keyword-detector.mjs` hook — B+C 路由 C 层现成参考

OMC `scripts/keyword-detector.mjs`（UserPromptSubmit hook magic keyword 检测）+ `skill-injector.mjs` —— 与 harnessed B+C 混合路由 **C 层同构**。**C 层 hook 实装 phase 待 ROADMAP 确认**（routing engine 相关，最可能 Phase 2.2 execute-task 主流程 routing engine 调用时一并做）—— 届时直接读 OMC 源码省时间。

### 2. `resolved_routing` 快照冻结 — routing engine 该补的洞

OMC `/team` 创建时一次性解析路由配置 → 冻结快照 → spawn/scale/restart 全读同一份，避免 mid-session 漂移。harnessed `arbitrate()` 现在每次重新读 `decision_rules.yaml`。**Phase 2.2**（execute-task workflow + ralph-loop full integration）长链路应借鉴"解析一次冻结"。

### 3. handoff 文档四字段 — checkpoint 内容模板

OMC `.omc/handoffs/<stage>.md` = **Decided / Rejected / Risks / Files** 四字段（10-20 行）。battle-tested 最小集，可进 harnessed `.harnessed/checkpoints/` 模板。注：checkpoint 机制完整版 ROADMAP 排在 **v0.3.0**，但模板格式可在 Phase 2.2 execute-task 长链路先用。

### 4. ⭐ per-phase model tier — execute-task 省 token

**理念**：OMC per-task per-subagent 指定 model（Haiku/Sonnet/Opus 可并行），不是 `/model` 命令。
**harnessed 装配方式实现**：workflow phases schema 每个 phase 静态标 `model:` 字段，agentFactory 读 `phase.model` 填进 `AgentDefinition.model`（12 字段里本就有 `model`，零新引擎）。

execute-task 各 phase model 建议：

| phase | 上游 | model |
|-------|------|-------|
| 01-clarify | superpowers brainstorming | opus / sonnet |
| 02-code | karpathy | sonnet |
| 03-test | superpowers TDD | sonnet / haiku |
| 04-deliver | ralph-loop | **haiku**（迭代验收循环省 token）|

**实施约束**：
- **Phase 2.2 做**（execute-task workflow 主线 — ROADMAP v0.2.0 Phase 2.2）
- **A7 守恒**：phases schema 加 `model` 字段 = 需起 **schema errata ADR**（编号由 Phase 2.2 plan-phase 流程分配，**本文件不预占** — 见 § 0）
- **v0.2 只做静态标 model** + 可选配 `--model-tier inherit` override 逃生口（用户采纳）
- 不和 GSD `/gsd-set-profile` 冲突：GSD profile 管 GSD agent，harnessed 管自己 spawn 的 subagent

### 5. role-router 优先级降级链 — arbitrate fallback 率优化（三层框架新解锁）

OMC `src/team/role-router.ts` 的 `routeTaskToRole()` 是 **10 步优先级降级链**：显式 role > 关键词模式 > **keyword-count scoring 中间层** > fallback。关键设计：没精确命中时**先做一轮关键词计数打分，而非直接掉 fallback**。

**对 harnessed**：phase 1.5 review H4 暴露 `arbitrate()` substring match 的 false-positive + fallback 率问题（30 sample 2 miss）。OMC 的 scoring 中间层是降 fallback 率的算法方向。**编排引擎层 → 读源码借鉴算法结构（学，不 vendor — § 借鉴判断标准）**。

**时机**：**v0.3+ 评估**（路由命中率验收 ROADMAP 排在 v0.3.0；`arbitrate()` phase 1.5 刚 ship，v0.2 改是 churn）。

### 6. 显式职责负空间声明（Do_Not_Use_When）— 降路由漂移（三层框架新解锁）

OMC 每个 agent `.md` prompt 写 **"你不负责 X，X 归某 agent"** + skill 间 `Do_Not_Use_When` 指向上下层 —— 用**职责负空间**约束让 LLM 收敛选择。harnessed manifest `decision_rules` 现有 `override_signals`（正向触发），缺"这个 skill 不该用于 X"的负空间声明。

**对 harnessed**：**配置/数据层 → schema 格式可直接借鉴**。等 extension category 真实候选多了，路由漂移风险才真正大 —— 负空间声明显著降漂移。

**时机**：**Phase 2.3 评估**（design/content/testing extension category MVP — 候选多了才需要）。

---

## 愿景候选（v0.3+ 评估，由对应 phase discuss 时 GSD 正式落 ROADMAP）

- **动态 model routing**：运行时按任务复杂度自动选 model（OMC `model-routing/` 的 signal→rules→scorer 三段式）。v0.2 静态标 model 跑通后再评估是否升级动态。**karpathy YAGNI — 不提前做**。

---

## 不该借鉴（按「理念落点」标准，非功能黑名单）

| OMC 特性 | 为什么不借 |
|----------|-----------|
| 自建 18 agents | agent = **上游组件层**，绝不自造（造 = 变 ECC）；理念若有价值 → 找上游 agent 包装配，没有则放弃 |
| 7 种编排模式照搬 | harnessed 3 workflow 是 ADR 0006 锁定；借单个**编排理念**可以（如 model-tier），照搬模式数量不行 |
| 多模型 CLI 子进程（ccg/omc-teams）| codex/gemini CLI = 上游组件层但不在 harnessed scope（harnessed 装配 CC 生态，不做 multi-provider）|

---

## v0.2.0 actionable（对应 phase 见各条；取用前先比对 ROADMAP / docs/adr/ — § 0）

- **Phase 2.2 discuss-phase**：把第 4 条 per-phase model 纳入 execute-task workflow 设计 + 起 schema errata ADR（编号 plan-phase 时分配）
- **Phase 2.2 实装**：C 层 hook（第 1 条）读 OMC `keyword-detector.mjs`；routing 快照（第 2 条）参考 `resolved_routing`
- **Phase 2.2 / v0.3.0**：checkpoint handoff 四字段（第 3 条）—— execute-task 可先用模板格式，checkpoint 机制完整版在 v0.3.0
- **Phase 2.3 discuss-phase**：显式职责负空间声明（第 6 条）评估进 manifest `decision_rules` schema
- **v0.3+（路由命中率验收时）**：role-router 优先级降级链（第 5 条）评估 `arbitrate()` 加 keyword-count scoring 中间层
- **愿景候选**：动态 model routing 在 v0.3 discuss 时评估是否进 ROADMAP
