# 自建派 3 项目对比与借鉴（OMC + omo + ECC）— v0.2.0+ 外部参考

> **文件名保留 `omc-comparison.md`** 是历史命名（v0.1 初版仅含 OMC），内容已扩展到 3 项目。重命名风险高（CONTRIBUTING.md / paste 文本 / git 历史多处引用），故保留。
>
> **来源**：
> - 2026-05-14 子 agent 研究 `Yeachan-Heo/oh-my-claudecode` (**OMC** — 装配器形态)
> - 2026-05-15 子 agent 研究 `code-yeongyu/oh-my-openagent` (**omo** — 同作者下一代 / agent runtime 形态)
> - 2026-05-15 子 agent 研究 `affaan-m/everything-claude-code` (**ECC** — 自建派最大成熟项目 / harness OS 形态)
>
> **用途**：v0.2.0+ 各 phase discuss-phase 按需取用的外部参考。**不是 spec，不锁定决策** —— 借鉴点由对应 phase GSD 流程正式评估后落 PLAN/ROADMAP。
>
> **SSOT 引用纪律**：见 § 0。本文件按**三层框架**分组（编排引擎层 / 配置数据层 / 上游组件层），phase 取用时直接看相关层即可，不必读全文。

---

## § 0 SSOT 引用纪律（核心理念 — 适用所有 intel / 参考文档）

intel 文件是**外部参考，不是 SSOT**。引用 SSOT 资源（phase / ADR 编号）时必须防 stale：

- **phase 编号** → 用**语义锚定**（"Phase 2.2 = execute-task workflow"），不只靠数字 —— phase 可能被 insert（phase 1.2.5 插入即先例）
- **ADR 编号** → **绝不预占**。ADR 编号是"先 plan-phase 先占"的动态资源。需要新 ADR 时写"需起 errata ADR（编号由对应 phase plan-phase 流程分配）"，**不写死 ADR NNNN**
- **校验时机** → 任何 phase discuss-phase 取用本文件时，先比对当前 `ROADMAP.md` / `docs/adr/` 实际编号，发现 drift 即就地修正

> 反面教材：本文件 2026-05-14 初版写死 "phase 2.0" + "ADR 0010"，2026-05-15 v0.2.0 激活 + Phase 2.1 plan-phase 后即 stale（execute-task 实际是 Phase 2.2；ADR 0010 已被 Phase 2.1 installer-schema-extension-errata 占用）。本次（2026-05-15）重写修正。CONTRIBUTING.md 已把此教训提升为项目级 SSOT 引用纪律。

---

## § 借鉴判断标准（核心纪律）

借鉴某个理念时，**先判断它落到哪一层**，再决定实现路径 —— 判断标准不是"能装配 vs 只能造轮子"，而是"**这轮子属于上游组件还是编排引擎**"：

| 理念落点 | 实现路径 |
|---------|---------|
| **上游组件层**（prompt / agent / skill 内容）| 装配现成上游 manifest；对比项目有**可独立提取的子组件**也当上游装配；真没有 → 放弃或推迟，**绝不自造**（造 = 变 ECC）|
| **编排引擎层**（routing / DAG / installer / checkpoint / model-tier 逻辑）| **本来就该自己造** —— harnessed 80% 价值在此（`dag.ts` 142L Kahn 即先例）。原则：karpathy 极简、只留精髓、不引重型库；对比项目有同类引擎 → **读源码借鉴算法结构**（学，不 vendor）|
| **配置/数据层**（decision_rules.yaml / phases schema / checkpoint 模板）| 自己定义 schema（harnessed 核心资产）；对比项目的 schema 格式可直接借鉴 |

3 项目本质都是自建派（ECC = harnessed 立项时对标反面，OMC/omo 是同生态自建派）。但**都做编排** —— harnessed 借的是**编排理念**，用装配方式实现，不照抄它们的轮子。**不存在"它们有的 harnessed 默认不要"这种功能黑名单。**

---

## § 上游组件层借鉴（无 — 见 § 不借鉴清单 / 上游组件层组）

3 项目的 agent / skill / prompt 内容全是自建（OMC 18 / omo 11 / ECC 30+135+60），**对 harnessed 没有借鉴价值** —— 借就是变 ECC。唯一候选见 § 愿景候选的 **Manual fallback bundle export**（来自 ECC，边界 case，可能 wedge 红线）。

---

## § 编排引擎层借鉴（5 条）

### EE-1. role-router 优先级降级链 — arbitrate fallback 率优化

**来源**：OMC `src/team/role-router.ts` `routeTaskToRole()` **10 步优先级降级链**：显式 role > 关键词模式 > **keyword-count scoring 中间层** > fallback。关键设计：没精确命中时**先做一轮关键词计数打分，而非直接掉 fallback**。

**对 harnessed**：phase 1.5 review H4 暴露 `arbitrate()` substring match 的 false-positive + fallback 率问题（30 sample 2 miss）。OMC 的 scoring 中间层是降 fallback 率的算法方向。读源码借鉴算法结构（学，不 vendor）。

**时机**：**v0.3+ 评估**（路由命中率验收 ROADMAP 排在 v0.3.0；`arbitrate()` phase 1.5 刚 ship，v0.2 改是 churn）。

### EE-2. `resolved_routing` 快照冻结 + 9-field machine-check（OMC + ECC 强化）

**OMC 部分**：OMC `/team` 创建时一次性解析路由配置 → 冻结快照 → spawn/scale/restart 全读同一份，避免 mid-session 漂移。harnessed `arbitrate()` 现在每次重新读 `decision_rules.yaml`。Phase 2.2 execute-task 长链路应借鉴"解析一次冻结"。

**ECC 强化**：ECC `docs/architecture/harness-adapter-compliance.md` 把每条 entry 暴露 9 字段（`id / state / supported_assets / unsupported_surfaces / install_or_onramp / verification_commands / risk_notes / last_verified_at / owner / source_docs`），且 `scripts/lib/harness-adapter-compliance.js` 是 source-of-truth + `npm run harness:adapters -- --check` 一致性 lint。**harnessed 装配方式**：manifest entry schema 加 5 字段（`last_verified_at / verification_command / risk_notes / owner / source_doc`）+ `harnessed manifest --check` lint 跑数据与 markdown 一致性。

**时机**：Phase 2.2 execute-task 长链路（OMC 部分）+ Phase 2.3 manifest schema 演进（ECC 部分）。

### EE-3. `keyword-detector.mjs` hook — B+C 路由 C 层现成参考

**来源**：OMC `scripts/keyword-detector.mjs`（UserPromptSubmit hook magic keyword 检测）+ `skill-injector.mjs` —— 与 harnessed B+C 混合路由 **C 层同构**。

**对 harnessed**：C 层 hook 实装 phase 待 ROADMAP 确认（routing engine 相关，最可能 Phase 2.2 execute-task 主流程 routing engine 调用时一并做）—— 届时直接读 OMC 源码省时间。

**时机**：phase 待 ROADMAP 确认。

### EE-4. Plan 审查 4 维量化阈值 schema（omo 新发现）

**来源**：omo `src/agents/metis.ts` + `momus.ts` —— Plan 审查双 agent 链：Metis 前置 gap 分析 + Momus 后置 4 维硬标准（**100% file references verified / ≥80% reference sources / ≥90% concrete acceptance criteria / 0 business-logic assumption**）+ 无限 REJECT loop。

**对 harnessed**：harnessed 已有 `gsd-plan-checker`，但 verdict 是模糊三档（APPROVED / APPROVED WITH CONDITIONS / NEEDS REVISION）—— 前几轮 review 反复看到 "APPROVED WITH CONDITIONS → 推 execute-phase 自然吸收" 的灰色地带。omo 的量化阈值消除灰色地带。

**harnessed 装配方式**：写 `plan-review-schema.yaml`（配置层 4 维阈值）+ `gsd-plan-checker` 按 schema 输出量化分数（编排层 ≤30L），不达标 → 自动触发 plan-phase 重跑。**关键约束**：**不 vendor Momus 的希腊神话 prompt**（该 prompt 是 omo 叙事强耦合）—— 只借 4 维 schema 格式。

**时机**：Phase 2.2+ plan-phase 流程改进（需起 schema errata ADR — 编号由对应 phase plan-phase 分配，不预占）。

### EE-5. 反 thin wrapper 5-question merge gate（ECC 新发现）

**来源**：ECC `docs/skill-adaptation-policy.md` 提出"反 thin wrapper"红线：装配外部 skill 前必须回答 **5 个 review 问题**（是真 reusable surface 吗？现有名字 fit 项目 shape 吗？已有 surface 重叠吗？是 import 概念还是 import 别人产品身份？user 不知 upstream 还能理解吗？）gate merge。

**对 harnessed**：直接对应 harnessed `manifest add` workflow —— **装配主义的实质就是"该不该让这个上游进来"**。harnessed 现在没有显式 gate，全凭主观判断。

**harnessed 装配方式**：固化为 `harnessed manifest add <upstream>` 命令的 prompt-driven gate checklist；plan-phase 模板里也加 5 题清单。**和 karpathy 心法对齐** —— 拒绝盲目堆装配。

**时机**：**Phase 2.3 extension category MVP 前必上**（design/content/testing 引入新上游前必经此 gate）。

---

## § 配置/数据层借鉴（6 条）

### CD-1. handoff 文档四字段 — checkpoint 内容模板

**来源**：OMC `.omc/handoffs/<stage>.md` = **Decided / Rejected / Risks / Files** 四字段（10-20 行）。battle-tested 最小集。

**对 harnessed**：可进 harnessed `.harnessed/checkpoints/` 模板。注：checkpoint 机制完整版 ROADMAP 排在 **v0.3.0**，但模板格式可在 Phase 2.2 execute-task 长链路先用。

**时机**：Phase 2.2 execute-task（模板格式）/ v0.3.0（机制完整版）。

### CD-2. ⭐ per-phase model tier — execute-task 省 token

**理念**：OMC per-task per-subagent 指定 model（Haiku/Sonnet/Opus 可并行），不是 `/model` 命令。

**harnessed 装配方式**：workflow phases schema 每个 phase 静态标 `model:` 字段，agentFactory 读 `phase.model` 填进 `AgentDefinition.model`（12 字段里本就有 `model`，零新引擎）。

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

**时机**：**Phase 2.2 必做**（用户最先采纳的条目）。

### CD-3. 显式职责负空间声明 + `if_rejected_use:<id>` 进阶（OMC + omo 扩展）

**OMC 部分**：每个 agent `.md` prompt 写 **"你不负责 X，X 归某 agent"** + skill 间 `Do_Not_Use_When` 指向上下层 —— 用**职责负空间**约束让 LLM 收敛选择。

**omo 进阶**：omo `AGENT_ELIGIBILITY_REGISTRY` 三档 verdict（`eligible / conditional / hard-reject`），每档**自带专属拒绝消息且消息里指向正确的替代品**（`if_rejected_use: <component-id>` 字段配对写出"该用什么替代"）。

**对 harnessed**：manifest `decision_rules` 现有 `override_signals`（正向触发），缺"这个 skill 不该用于 X"的负空间 + "该用什么替代"的指向。等 extension category 真实候选多了，路由漂移风险才真正大 —— 负空间 + 替代品指向显著降漂移 + 降用户摸索成本。

**时机**：**Phase 2.3 评估**（design/content/testing extension category MVP — 候选多了才需要）。

### CD-4. Task Session 复用 schema 字段（omo 新发现）

**来源**：omo `BoulderState.task_sessions[task_key] = { session_id, agent, category, ... }` —— 同一个 top-level task 的多次 iteration 必须复用**同一个 subagent session**，而不是每次开新 session。这把"subagent 上下文积累"从 in-memory 升级成跨进程持久化。

**对 harnessed**：execute-task workflow 的 phase 03 (test) 如果失败回炉到 phase 02 (code)，复用同一 session 比开新 session 上下文好得多。

**harnessed 装配方式**：phase manifest 加 `task_session_id` 字段（配置层）+ executor 优先 resume 同 session（编排层）。**关键依赖**：Claude Code SDK 是否暴露 session resume API —— **Phase 2.2 plan-phase 时需 verify SDK 能力**，能则做、不能则 deferred。

**时机**：Phase 2.2 execute-task 实装时同步评估（含 SDK 能力 verify）。

### CD-5. ⭐ `schemaVersion` 单一兼容门（ECC 新发现，价值最高）

**来源**：ECC 所有跨边界 payload（`ecc.session.v1` / `ecc.hud-status.v1` / install state 等）**只用 `schemaVersion` 一个字段做兼容判定**；未知 enum/state 字符串 = 合法值（adapter-specific），consumer 必须 **graceful degrade**；新增字段必须 **nested 不能 top-level**。

**对 harnessed**：harnessed 当前每次 schema errata（ADR 0003/0005/0007/0010）都靠 ADR 编号追溯版本，但**没有统一的 `schemaVersion` 字段约定** —— 跨边界 payload 演进时 consumer 不知道该 branch on 什么。这条**价值最高**，影响所有跨 phase artifact。

**harnessed 装配方式**：routing snapshot / handoff doc / phases schema / manifest state / installer state 统一加 `schemaVersion: "harnessed.<surface>.v1"` 头；consumer 必须 branch on it；未知 enum 值不能 fail；新字段 nested。**这是引擎层算法结构** —— 纯学不 vendor。

**时机**：**Phase 2.2+ 评估，优先级最高**（影响所有跨 phase artifact 的演进策略；越晚做迁移成本越高）。

### CD-6. 三层 skill 产源 + provenance gate（ECC 新发现）

**来源**：ECC `docs/SKILL-PLACEMENT-POLICY.md` 把 skill 分四种产源：**Curated**（repo `skills/`）/ **Learned**（`~/.claude/skills/learned/`）/ **Imported** / **Evolved**（`~/.claude/homunculus/`），**只有 Curated 进 manifest 和 install**。Learned/Imported 强制要求 sibling `.provenance.json`（4 字段：`source / created_at / confidence / author`）。

**对 harnessed**：execute-task workflow 会大量产生 runtime artifact（routing 决策日志 / handoff doc / failed-route 记录 / checkpoint 修复 / session learnings）。如果不区分"装配上游"vs"运行时生成"，前者会被后者污染。ECC 用产源分层 + 强制 provenance gate 彻底隔离。

**harnessed 装配方式**：自建 ~5KB `provenance.schema.json`（4 字段 `source/created_at/confidence/author`），composition skill/installer 加 enforce：任何运行时新建的 artifact 必须 sibling `.provenance.json`，否则 lint fail。完全避免运行时生成物污染 curated 装配上游。

**时机**：**Phase 2.2 execute-task 开始产生大量 runtime artifact 前必上**（之前不上 = 之后追溯污染极痛）。

---

## § 愿景候选（v0.3+ 评估，由对应 phase discuss 时 GSD 正式落 ROADMAP）

### V-1. 动态 model routing（OMC 启发）

运行时按任务复杂度自动选 model（OMC `model-routing/` 的 signal→rules→scorer 三段式）。v0.2 静态标 model（CD-2）跑通后再评估是否升级动态。**karpathy YAGNI — 不提前做**。

**时机**：v0.3 discuss 时评估。

### V-2. ⚠️ Manual fallback bundle export（ECC 启发，**边界 case + wedge 风险警示**）

**理念**：ECC `docs/MANUAL-ADAPTATION-GUIDE.md` —— 当 harness 完全不支持 folder/hook/command 时（如 Grok / 普通 chat UI），手工选 3-5 个 SKILL.md + `sed` 拼最小 bundle + system-prompt 模拟 command registry。**这是"装配主义"的退化形态**。

**可能装配方式**：`harnessed export --bundle` 子命令把 manifest 选定 skill 拼成单 markdown bundle。

**⚠️ wedge 风险警示**：harnessed 当前 wedge 红线是"只服 Claude Code 生态"。`export --bundle` **可能滑向"跨 harness 工具"** —— 一旦支持 Grok/普通 chat UI，下一步就是支持 Codex/Gemini/Cursor，逐步变成 ECC 的多 harness 矩阵。

**时机**：**v0.4+ 评估**。决策前需先答："这条是装配主义极限形态（保 wedge）还是跨 harness 工具入口（破 wedge）？" —— 不进当前 actionable 队列。

---

## § 不该借鉴清单（按"理念落点"分组，非功能黑名单）

### 上游组件层（绝不自造）

| 项目 | 特性 | 为什么不借 |
|------|------|-----------|
| OMC | 自建 18 agents | agent = 上游组件层，绝不自造（造 = 变 ECC）；理念若有价值 → 找上游 agent 包装配，没有则放弃 |
| omo | 11 具名 agent + 希腊神话 prompt 体系（Sisyphus / Prometheus / Atlas / Metis / Momus）| vendor 整套人格化 prompt = 变成"另一个 omo"，污染 harnessed 工具定位中立性。借 schema（如 EE-4）可以，不借 prompt 内容 |
| ECC | 30+ 自建 agents / 135+ 自建 skills / 60+ 自建 commands | 这是 harnessed 立项的**反面教材**，ground zero 不借 |

### 编排引擎层（违反 wedge 或不在 scope）

| 项目 | 特性 | 为什么不借 |
|------|------|-----------|
| OMC | 7 种编排模式照搬 | harnessed 3 workflow 是 ADR 0006 锁定；借单个编排理念可以（如 CD-2），照搬模式数量不行 |
| OMC | 多模型 CLI 子进程（ccg / omc-teams）| codex/gemini CLI = 上游组件层但不在 harnessed scope（不做 multi-provider）|
| omo | per-agent fallback model chain（Sisyphus 6 段 / Oracle 3 段）| 违反"不碰 multi-provider"；karpathy YAGNI — 比 CD-2 per-phase model 复杂得多 |
| ECC | `ecc2/` Rust control plane / 自建 daemon-TUI runtime | 违反 karpathy 极简栈；harnessed 永远不引 Rust runtime |
| ECC | Continuous learning v2 / homunculus / evolved skills（agent 自进化）| 自造 evolved skill = 自造大量 skill，违反 wedge |

### 商业 / 平台层（不在 harnessed scope）

| 项目 | 特性 | 为什么不借 |
|------|------|-----------|
| ECC | AgentShield enterprise security platform（SARIF / policy packs / supply-chain intel）| 商业化方向，不在 harnessed scope |
| ECC | ECC Tools GitHub App + Marketplace billing | 商业 SaaS 层，harnessed 是 CLI + manifest 工具 |

### 跨 harness 规模（违反 wedge 红线）

| 项目 | 特性 | 为什么不借 |
|------|------|-----------|
| ECC | 多 harness 装配矩阵规模本身（同时支持 8+ harness） | wedge 红线 — harnessed 只服 Claude Code 生态；借 schema 形状（EE-2 / CD-5）够了，不借规模 |

### 早期文档投资（karpathy YAGNI）

| 项目 | 特性 | 为什么不借 |
|------|------|-----------|
| ECC | 8 种语言 README + the-shortform / longform / security-guide 教程体系 | karpathy 极简 — 早期保持英文 + 一份中文，等 wedge 稳定再投入用户认知曲线 |

---

## § v0.2.0+ actionable（按 phase 取用 — 取用前先比对 ROADMAP / docs/adr/，见 § 0）

| Phase / 时机 | 优先级 | 借鉴条目 | 备注 |
|-------------|--------|---------|------|
| **Phase 2.2 discuss-phase** | ⭐⭐⭐ | CD-5 `schemaVersion` 单一兼容门 | **价值最高**，优先评估；影响所有跨 phase artifact |
| **Phase 2.2 discuss-phase** | ⭐⭐⭐ | CD-2 per-phase model tier | 用户最先采纳；需起 schema errata ADR（编号 plan-phase 时分配）|
| **Phase 2.2 discuss-phase** | ⭐⭐ | CD-6 三层 skill 产源 + provenance gate | execute-task 产生大量 runtime artifact 前**必上**，之前不上 = 之后追溯污染极痛 |
| **Phase 2.2 discuss-phase** | ⭐⭐ | EE-4 Plan 审查 4 维量化阈值 schema | 消除 "APPROVED WITH CONDITIONS" 灰色地带 |
| **Phase 2.2 discuss-phase** | ⭐⭐ | CD-4 Task Session 复用 | 先 verify CC SDK 能力，能则做不能则 deferred |
| **Phase 2.2 实装** | ⭐⭐ | EE-3 C 层 hook 读 OMC `keyword-detector.mjs` | 现成参考省时间 |
| **Phase 2.2 实装** | ⭐⭐ | EE-2 (OMC 部分) resolved_routing 快照冻结 | 长链路防漂移 |
| **Phase 2.2 / v0.3.0** | ⭐ | CD-1 handoff 四字段 | execute-task 先用模板格式，完整版 v0.3.0 |
| **Phase 2.3 discuss-phase** | ⭐⭐⭐ | EE-5 反 thin wrapper 5-question merge gate | extension category 引入新上游前**必上** |
| **Phase 2.3 discuss-phase** | ⭐⭐ | CD-3 显式职责负空间 + `if_rejected_use:<id>` | extension category 多了才需要 |
| **Phase 2.3 / Phase 2.4** | ⭐⭐ | EE-2 (ECC 部分) 9-field manifest schema | manifest schema 演进时同步评估 |
| **v0.3+（路由命中率验收时）** | ⭐ | EE-1 role-router 优先级降级链 | `arbitrate()` scoring 中间层；v0.2 改是 churn |
| **v0.3 discuss** | — | V-1 动态 model routing 愿景候选 | v0.2 静态 CD-2 跑通后再评估升级 |
| **v0.4+ 评估** | ⚠️ | V-2 Manual fallback bundle export 边界 case | wedge 风险警示 — 决策前先答 "保 wedge vs 破 wedge" |

---

## § 来源映射（便于追溯）

| 借鉴条目 | OMC | omo | ECC |
|---------|-----|-----|-----|
| EE-1 role-router scoring | ✅ | | |
| EE-2 resolved_routing + 9-field | ✅ | | ✅ 扩展 |
| EE-3 keyword-detector hook | ✅ | | |
| EE-4 Plan 量化阈值 schema | | ✅ | |
| EE-5 反 thin wrapper 5-question | | | ✅ |
| CD-1 handoff 四字段 | ✅ | | |
| CD-2 per-phase model tier | ✅ | | |
| CD-3 Do_Not_Use_When + if_rejected_use | ✅ | ✅ 进阶 | |
| CD-4 Task Session 复用 | | ✅ | |
| CD-5 schemaVersion 兼容门 | | | ✅ |
| CD-6 三层产源 provenance gate | | | ✅ |
| V-1 动态 model routing | ✅ | | |
| V-2 Manual fallback bundle（边界）| | | ✅ |

**条目计数**：11 条核心借鉴（EE 5 + CD 6）+ 2 条愿景（V-1 + V-2 边界）+ 不借鉴清单 5 组（含 4 项目特性）。

---

## 实施进度回填

> **Authored**: Phase 2.3 Wave 0 T0.7 (2026-05-16)
> **Purpose**: 每 intel actionable entry 标 `IMPL: Phase X.Y (commit hash)` 或 `PENDING (defer to ...)`/`DEFERRED` — 防 intel drift。 沿袭 § 0 SSOT 引用纪律。 Phase 2.3 Wave 0 起每 ship phase 时同步更新本节。

| Intel Entry | Status | Implementation / Notes |
|-------------|--------|-----------------------|
| EE-1 role-router scoring 中间层 (L40-) | DEFERRED (v0.3+) | 路由命中率验收时 — 30 sample → 100+ × multi-model 升级时再评估 |
| EE-2 (OMC) resolved_routing 快照冻结 (L?-) | PENDING (v0.3+ evaluation) | karpathy YAGNI — 真实 mid-session drift 出现后再做 |
| EE-2 (ECC) 9-field manifest schema | DEFERRED (Phase 2.4 manifest schema 演进同步评估) | 与 Phase 2.3 MIN scope 不冲突 |
| EE-3 keyword-detector hook (C 层) | PENDING (Phase 2.2+ 实装时机) | 现成参考省时间, 待 hook 引入时直接读 OMC `keyword-detector.mjs` |
| EE-4 plan 4 维量化阈值 schema (L?-) | DEFERRED (Phase 2.4 doctor 完整版 absorb OR 独立 Phase 2.5) | 与 Phase 2.3 extension category 主线 orthogonal (D-06) |
| EE-5 反 thin wrapper 5-question merge gate (L84-104) | IMPL: Phase 2.3 (本 phase, Wave 3 T3.1-T3.2) | `harnessed manifest add <upstream>` CLI 5 题 + plan-phase 模板 5 题 + gsd-plan-checker BLOCKER (D-03 双层); KICKOFF § 7 self-instance 5 adapter × 5 题 inline |
| CD-1 handoff 四字段完整模板 | PENDING (v0.3.0 checkpoint 完整版) | Phase 2.2 已用模板格式, 完整机制 v0.3.0 |
| CD-2 ⭐ per-phase model tier (L106-127) | IMPL: Phase 2.2 (commit `97d4da2` T3.1 schema + `ffe83b9` T3.2 loadPhases + `7799bf5` T3.3 phases.yaml + `b94e8bd` T3.4 tests) | `workflows/execute-task/phases.yaml` 4 phase × model 表 (opus/sonnet/sonnet/haiku); TypeBox 4-enum ModelTier + PhaseEntry schema; 沿袭 ADR 0011 § Decision 5 |
| CD-3 显式职责负空间 + `if_rejected_use` (L130-135) | IMPL: Phase 2.3 (本 phase, Wave 2 T2.2 + T2.3) | `decision_rules.yaml` schema 加 `do_not_use_when:` + `if_rejected_use:` optional fields (TypeBox); `arbitrate()` ~15L 升级读 negative-space → down-rank + reject redirect target; ADR 0012 § 4 |
| CD-4 Task Session 复用 (L139-147) | PENDING (v0.3.0 — Phase 2.2 T1.2 SC4 PARTIAL → B-35 fallback branch triggered; closure infra 三件套 ready) | sdkSpawn.onSessionId / ralphLoopWrap.resumeSessionId / engine.wrappedSpawn capturedSessionId v0.3.0 consumer 接入 + `harnessed.phases.v1` schema bump 加 `task_session_id?` field; 详 `.planning/phase-2.2/T4.4-DEFERRED-onboarding.md` |
| CD-5 ⭐ `schemaVersion` 单一兼容门 (L149-157) | IMPL: Phase 2.2 (commit `4d71b1d` T2.0 — helper-only adoption baseline; consumer 扩 Phase 2.3+ 逐 surface land) | `src/types/schemaVersion.ts` SchemaVersion<S> template literal + SCHEMA_VERSIONS const map + branchOnSchemaVersion<T> helper + TypeBox SchemaVersionLiteral union; **honest adoption status**: consumer count = 2 (Phase 2.3 W0 起点), 7 surface (handoff/phases-yaml/manifest state/installer state/route decision log/checkpoint/agent definition factory) 逐 phase land per ADR 0012 § 7 errata |
| CD-6 三层 skill 产源 + provenance gate (L159-167) | IMPL: Phase 2.2 (commit `2e5a18b` T4.0 — provenance gate hard fail BEFORE-W4) | `provenance.schema.json` 4 字段 (source enum + created_at + confidence + author); `scripts/check-provenance.mjs` ENFORCE=true walker; ci.yml step Phase 2.2 W4 加 + Phase 2.3 W0 T0.6 Win pwsh sentinel 加固; runtime scope 限 `.harnessed/{sessions,checkpoints,route-logs}/**` (R8 mitigation) |
| V-1 动态 model routing 愿景 | DEFERRED (v0.3+ discuss) | static CD-2 跑通 (Phase 2.2 ship) 后再考虑升级 |
| V-2 Manual fallback bundle export 边界 case | DEFERRED (v0.4+ 评估) | wedge 风险警示 — 决策前先答 "保 wedge vs 破 wedge" |

**Status summary**: 5 IMPL (CD-2/CD-3/CD-5/CD-6/EE-5) + 1 PIGGY (CD-3 同 phase Wave 2 ship) + 5 PENDING + 4 DEFERRED = 14 entry tracked。 Phase 2.3 ship 时同步 update CD-3 + EE-5 commit hash 回填本表。


---

## § issue #3/#4/#5 三题对照(2026-07-11 增补 — 3 subagent 实证调研)

> 背景:harnessed v4.23.0/4.23.1/4.23.2 修复 issues #3(skill 覆盖/完整性)、#4(deferrable 决策 relay 门)、#5(gate 未定义变量 fail-open + skip-sub 静默失效)。本节记录三个对照项目对同类问题的解法,来源 = gh CLI + shallow clone(OMC/omo)+ 本机 ECC 插件缓存 2.0.0-rc.1 实证,非 README 转述。

### T1 skill 安装冲突与完整性(对应 issue #3)

| 机制 | OMC | omo | ECC | harnessed 4.23.0 |
|---|---|---|---|---|
| 冲突预防 | 事后 doctor(`omc doctor conflicts`),安装瞬间 `cpSync force:true` 仍覆盖 | 不复制进扁平命名空间:多 scope 原位加载 + runtime `deduplicateSkillsByName` scope 优先级 first-wins(零告警,文档明文接受覆盖) | plugin 命名空间天然隔离(`ecc:`) | Step A 后置(last-writer)+ installs_skills 声明 + 安装前交集预警 |
| 所有权标识 | `.omc-managed` 文件 + CLAUDE.md `OMC:VERSION` 防降级 marker | 无(仅自身组件 sha256 trust 登记) | install-state 记录(无 marker) | `harnessed-generated` marker + 渲染态 sha256 台账 |
| 完整性校验 | SHA-256 `hashFileContents` shipped vs target;`prunePluginDuplicateSkills` 仅删 content 相同或带 marker 的副本("Frontmatter structure alone is not a reliable ownership signal") | doctor 审计自身 bundle(missing/zero-bytes)+ loadedVersion 陈旧检测 | `inspectManagedOperation` 逐字节比对源 repo(`areFilesEqual`),分型 missing/drifted/missing-source/unverified | 五态 ok/foreign/tampered/stale/missing |
| 自愈 | `omc update --force` 重装 | 无(doctor 只提示 REINSTALL_FIX 命令) | `scripts/repair.js` rebuild(支持 --dry-run,手动) | setup 末尾自动自愈重装 + 三入口可见 |

**结论**:OMC 与我们同题同向且成熟(marker+hash+doctor 三件套,值得对照);omo 用"不落盘"绕开问题(runtime 加载,代价 = 覆盖静默);ECC 有检测+修复但不自动触发、以源 repo 为基准不防基准失真。harnessed 的"自动自愈 + pack 声明预警"组合在四者中最完整。借鉴候选:ECC `repair --dry-run` 形态(自愈前预览)。

### T2 deferrable 决策的用户 relay 门(对应 issue #4)

- **OMC**:分层策略 — `/plan` 硬门(强制 AskUserQuestion 结构化 UI,"never ask for approval in plain text";User Preference/Scope Decision 必须问);`/deep-interview` 有量化 ambiguity 阈值门(默认 0.2,不达标不准执行);但 `/autopilot` 全代决。**无通用 per-decision relay 门**,靠用户选模式分流。
- **omo**:纯 prompt 层("MUST NOT: Proceed without user confirmation on major decisions";但 "Multiple interpretations, similar effort → Proceed with reasonable default, note assumption")。无 runtime 门。
- **ECC**:plan 级整体 confirm 门("MUST receive user approval before proceeding")+ prp-plan Ambiguity Gate("Do NOT guess. Ask.");但哲学反向 — prp 追求 "implement without asking further questions","可用默认值"的决策直接代决,默认值只有恰好写进 plan 文本才被用户看到。

**结论**:三家都没有 harnessed 4.23.1 的 "deferrable 集批量 relay(默认值预选、用户一次 override 机会)" 机制 — 这是我们从真实事故(R1.3 验收性质被静默改变)推出的独有契约。OMC 的 ambiguity 量化阈值是另一条有意思的路(把"该不该问"从判断题变成测量题),可作 v5+ 讨论素材。

### T3 gate/路由配置健壮性(对应 issue #5)

- **OMC**:路由硬编码 TS(无表达式引擎,不存在 undefined-variable 面);hook 校验失败 → `{continue: true}` **fail-open**(28 处);`OMC_SKIP_HOOKS` 传错名静默无效零警告(与我们 issue #5 缺陷 2 同病,未修);doctor 事后报告未知 config 字段。
- **omo**:**fail-closed 典范** — 配置层 zod `.strict()` unknown key 整层拒载 + 结构化 diagnostic;规则 frontmatter 损坏 → 规则不激活 + diagnostic 留档。弱点:多处 bare `catch {}` 静默吞 fs 错误;CLI flag 拼错无警告。
- **ECC**:一致哲学 = "gate 故障绝不锁死 agent" — 分发层 fail-open + 显式 stderr(script 缺失/parse 失败/state 写失败全放行并说明,deny 附恢复通道);唯一论证过的 fail-closed 是 config-protection("so the guard is never silently weakened");hookify 规则当前无 runtime 消费者。

**结论**:三家路线图谱 = omo(配置 fail-closed)/ ECC(运行 fail-open + 可见)/ OMC(fail-open + 静默,最弱)。harnessed 4.23.2 的分型(静态配置错误 fail-closed、运行时故障 fail-soft)恰好是 omo 与 ECC 两种正确哲学的合成:配置 bug 不该放大成本(omo 侧),运行故障不该锁死流程(ECC 侧)。skip 名传错警告:四者中仅 harnessed 有。
