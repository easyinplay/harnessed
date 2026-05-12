# Phase 1.2.5 Sister CC Cross-Validation Review

> Reviewer: gsd-plan-checker (general-purpose agent, paranoid lens)
> Date: 2026-05-12
> Verdict: **APPROVED WITH PATCHES**

## TL;DR

8 支柱核心实质 capture 实际达成 8/8（A1'-A8' 各文档内容均充实可验证），5 P0 决策 lock 在 ASSUMPTIONS / RESEARCH / ADR 0006 / GRAY-AREA 之间一致。但发现 **3 H 级、5 M 级、4 L 级** paranoid issue：最严重的是 (H1) GRAY-AREA-3 文件标题/§ 1 仍写"16+ 命令"与 § 2.2 实证 23 矛盾，对外读者首次扫描即被误导；(H2) ROADMAP.md § 282-356 "Phase 之间的依赖图" + § 139-198 Phase 2.x/3.x 拆分仍是 v3 重排前的旧版，与 § 73-97 v3 重排段直接冲突；(H3) ADR 0006 + PROJECT-SPEC § 1 仅说"4 心法"未落到 4 个原则名字，phase 1.3 plan-phase 一旦只读 ADR 0006 / SPEC 会丢内容（依赖 GRAY-AREA-4 链式依赖）。其余 M/L 级是 actionability 边缘问题（ui-ux-pro-max install adapter 缺细节、AgentDefinition factory 接口未 sketched 等）。**8/8 capture 实质达成，但需 fix H1+H2+H3 后才推荐 ship phase 1.2.5；H1 + H2 是直接编辑可消除的 staleness，H3 需补 1 个段落。**

---

## § 1 8 支柱 Capture 验证

| 支柱 | Capture 文档 | 内容质量 | 状态 |
|---|---|---|---|
| **A1'** gstack 6+ 角色 | GRAY-AREA-2 § 2 + § 2.2 | 完整 11 行矩阵（CEO/EM/Designer/Paranoid/QA/CSO + 4 扩展角色 = 7 主 + 多扩展）+ 各 trigger / 强制级别 / 角色映射列。grep 命中"Designer\|QA\|CSO\|EM\|Paranoid\|CEO" 24 次，密度极高。sanity check 横切机制 § 2.1 单列。 | ✅ |
| **A2'** gstack 双职责 | GRAY-AREA-2 § 1 + § 1.1 + § 1.2 | "做什么"(Strategy) 与"是否值得做"(Governance) 双列对比表 + 各自详解 + 触发命令分组。grep "做什么\|是否值得做\|Strategy\|Governance" 4 次（在表头/小标题；正文中重复使用）。 | ✅ |
| **A3'** GSD 环境质量层 | ASSUMPTIONS § B + GRAY-AREA-1 § 5 | 7 维度表（CI 守恒 / Lockfile / Corepack / Cross-OS / 工具版本 / EOL / A7 守恒）— 都对应 phase 1.1-1.2 实证基线 + 各自 enforcement 来源；GRAY-AREA-1 § 5 列了 routing engine 如何继承这些约束到 subagent。 | ✅ |
| **A4'** karpathy 4 原则 1:1 enforce | GRAY-AREA-4 § 2.1-2.4 + § 3.1 (a-revised) | 4 原则各自单 § 含「含义 / 子任务实施 / 反例 / 检测」4 列；§ 3.1 main-process-driven AgentDefinition factory inject 伪代码；§ 3.4 推荐 (a-revised) + (b) 混合方案。grep 4 个原则名 4/4 hit。 | ✅ |
| **A5'** mattpocock 23 招式 phase routing | GRAY-AREA-3 § 2.2 (R2 实证) + § 3.1 schema | 18 active skills 进 v0.1 catalog（去除 4 deprecated + 2 personal + 3 in-progress）+ 5 phase × 命令 mapping 含 trigger 条件 yaml。但**文件标题、§ 1 引用块、§ 1.1 表格、§ 5 表头**仍写"16+"（H1 见下方）。 | ⚠ partial-quality |
| **A6'** 心法+招式配对 | GRAY-AREA-3 § 4 + GRAY-AREA-4 § 4 | 配对运作图 + 配对特性表 + JWT auth day-to-day 5 步实例。grep "心法\|招式\|always-on\|on-demand" 37 次。 | ✅ |
| **A7'** brainstorming + TDD 触发 | GRAY-AREA-1 § 4 | (a+b) hybrid — § 4.1 mandatory_tdd_triggers yaml + § 4.2 mattpocock /tdd 内置 + § 4.3 optional user-decide + § 4.4 brainstorming triggers (always_on + preferred_skill_routing)。 | ✅ |
| **A8'** 6 category × decision rules + curate criteria | GRAY-AREA-1 § 2 (decision_rules.yaml) + § 3 + GRAY-AREA-5 全文 | decision_rules.yaml 含 12 rule 实例（design 2 / content 2 / testing 4 / search 2 / meta 2）+ § 3 6 category 表 + GRAY-AREA-5 § 2.1 5 项 mandatory yaml + § 2.3 candidate 实测打分 + § 4.2 v0.4+ checklist。grep "meta\|engineering\|design\|content\|testing\|search" 45 次。 | ✅ |

**实质 capture 7/8 ✅ + A5' ⚠ partial-quality (内容达成但 doc front matter 未刷新)**

但若把"capture"严格视为"reader 读到内容就懂"，A5' 的旧标题与 § 1 表格里 "16+" 会让首次读者怀疑是否只列了 16 — 必须 patch（H1）。

---

## § 2 5 P0 决策 lock 一致性

| P0 | ASSUMPTIONS lock | RESEARCH 推荐 | ADR 0006 lock | GRAY-AREA schema | 一致? |
|---|---|---|---|---|---|
| **P0-1** | (a) 独立 `.planning/decision_rules.yaml` (ASSUMPTIONS L52) | R1 § 5.1 推荐 (a) | ADR 0006 L98 (a) DMN Priority Hit Policy | GRAY-AREA-1 § 2 完整 yaml schema + DMN Priority hit_policy: P | ✅ |
| **P0-2** | (b) 中等深度编码 (ASSUMPTIONS L53) | R1 § 5.2 推荐 (b) | ADR 0006 L99 (b) | GRAY-AREA-2 § 4 lock (b) + § 3.1 phase-level gates yaml + 注："enforcement 路径主流程触发，不 vendor prompt" | ✅ |
| **P0-3** | (c) phase-aware 渐进 (ASSUMPTIONS L54) | R2 § 4.2 推荐 (c) phase-aware | ADR 0006 L100 (c) | GRAY-AREA-5 § 1 phase 表 (v0.1/v0.2-0.3/v0.4+) + § 2.1 5 项 mandatory + § 4.2 community PR checklist | ✅ |
| **P0-4** | (c) 渐进 — workflow 模式 docs only + 部分 heuristic (ASSUMPTIONS L55) | R2 / 用户笔记自反思 | ADR 0006 L101 (c) | GA-1 testing category 已编码 (E2E+Python / 性能 a11y → chrome-devtools-mcp 强制) | ✅ |
| **P0-5** | (a+b) hybrid (ASSUMPTIONS L56) | R2 § 4.3 推荐 (a+b) hybrid | ADR 0006 L102 (a+b) | GRAY-AREA-1 § 4.1 mandatory_tdd_triggers yaml + § 4.2 heuristic mattpocock 内置 + § 4.3 optional user-decide | ✅ |

**5/5 ✅** — P0 lock 完全一致，且每个都从 RESEARCH → ASSUMPTIONS → ADR → GRAY-AREA 4 层链路畅通。

---

## § 3 ADR 0006 / PROJECT-SPEC / ROADMAP 一致性

### 3.1 双层架构

- **ADR 0006 § 1** 双层架构图 (Base 10 manifest + Extension 6 category × M 候选)
- **PROJECT-SPEC § 1.1** "双层架构" 段（Base layer = 10 固定 manifest + 3 workflow + B+C；Extension = 6 大 category × M 候选 + decision rules + curate criteria）
- ✅ 一致 — 表述方式不同但语义全同（10 manifest / 6 category 数据点匹配）

### 3.2 6 category × decision rules

- **PROJECT-SPEC § 2.2** Extension Layer 6 category 表 + decision rule anchor
- **ADR 0006** ADR body 未列 6 category 表（仅在 wedge 描述里"6 skill category"），通过 Reference 链到 GRAY-AREA-1 § 3
- **GRAY-AREA-1 § 3** 6 category × decision rules 总览表
- ✅ 内容一致（PROJECT-SPEC § 2.2 与 GRAY-AREA-1 § 3 是 1:1 mapping），但 ADR 0006 没把这个表抄进去 — 链式依赖（**M3 见下方**）

### 3.3 ROADMAP 重排一致性

- **ADR 0006 § 6** "ROADMAP 重排" 表（phase 1.3 / 1.4 / 1.5 / 2.x）
- **ASSUMPTIONS § E** "ROADMAP 顺序调整" 表（phase 1.3 / 1.4 / 1.5 / 2.x）
- **ROADMAP.md § 73-97** v3 重排段（phase 1.1 ✅ / 1.2 ✅ / 1.2.5 🔄 / 1.3 / 1.4 / 1.5）

3 处 v3 重排段彼此一致 ✅

但 **ROADMAP.md § 139-198 "Phase 2.x / 3.x 拆分"** + **§ 282-356 "Phase 之间的依赖图"** 仍是 v3 重排**前**的旧版（P1.3 = DAG + setup/doctor / P1.4 = research workflow / P2.1-2.4 = 旧 v0.2 拆分），与 § 73-97 直接冲突 — **H2 见下方**

### 3.4 manifest schema 字段（install_type / category / decision_rules）

- **PROJECT-SPEC § 2.2** L77-83 显式说"走 ADR 0007 errata"
- **ADR 0006** § 6 表 phase 1.3 行 + L139 Consequences 说 "manifest schema 加 install_type" 走 ADR 0007 errata
- **ASSUMPTIONS** D1.2.5-12
- ✅ 一致

---

## § 4 12 D1.2.5 决策追溯完整性

抽查 5 项：

- **D1.2.5-3** routing engine main-process-driven — ASSUMPTIONS L66 内容 + 来源 "R1 § 1 (4 GitHub issues + 4 官方 docs 实证) — F33"。RESEARCH-1 § 1 实存（450L），F33 实存（progress.md L105-128）。✅
- **D1.2.5-6** 6 大 category — ASSUMPTIONS L69 内容 + 来源 "R2 § 1 + § 4.1 实证"。RESEARCH-2 § 1 / § 4.1 实存。✅
- **D1.2.5-7** 23 mattpocock skills — ASSUMPTIONS L70 + 来源 "R2 § 3.1 GitHub API 实证"。RESEARCH-2 § 3.1 含 23 skill 表。✅
- **D1.2.5-9** karpathy enforcement 路径修正 — ASSUMPTIONS L72 + 来源 "F33 实证后修订 — R1 § 1.4 alternative 设计图"。RESEARCH-1 § 1.4 实存。✅
- **D1.2.5-11** ui-ux-pro-max install path — ASSUMPTIONS L74 + 来源 "R2 § 1.2 + § 4.4 风险"。RESEARCH-2 § 1.2 + § 4.4 风险 1 实存。✅

5/5 ✅ — 决策追溯完整。

**但** D1.2.5-1 ~ D1.2.5-12 在 progress.md § B.4 是空的（"empty — Wave B 完成后填 D1.2.5-1 ~ D1.2.5-N"）— **L1 见下方**

---

## § 5 F33/F34/F35 narrative 与现实一致

### F33 (subagent reload 不可行 → main-process-driven)

- 原文证据：RESEARCH-1 § 1.1-1.4 + 4 GitHub issues 链接（#32910 / #35641 / #37862 / #46040）+ 官方 docs 4 篇 ✅
- ADR 0006 § 3 "Main-Process-Driven Routing Engine（D1.2.5-3 lock）" L66-79 完整反映 ✅
- GRAY-AREA-1 § 1 architecture diagram main-process-driven ✅
- GRAY-AREA-2 § 4 § 3.1 "enforcement 路径：主流程 routing engine（D1.2.5-3 main-process-driven）" ✅
- GRAY-AREA-3 § 3.1 "enforcement 路径：主流程 routing engine 在 spawn subagent **之前**根据当前 phase + task 上下文决定招式触发" ✅
- GRAY-AREA-4 § 3.1 (a-revised) "main agent 在 AgentDefinition factory 构造 subagent 时 inject" + § 3.4 推荐方案 ✅

✅ 全部对齐。

### F34 (6 类 + 23 mattpocock，不是 4+ 16+)

- ASSUMPTIONS A5' / A8' / D1.2.5-6 / D1.2.5-7 全部使用 6 类 + 23 数字 ✅
- ADR 0006 wedge 描述 "23 招式 phase 路由 / 6 skill category" L17 ✅
- PROJECT-SPEC § 1 / § 1.1 / § 2.2 全用 6 大 category × 23 mattpocock 数字 ✅
- GRAY-AREA-1 § 3 6 category 表 ✅
- GRAY-AREA-3 § 2.2 R2 实证 23 文字明确 ✅
- ⚠ **GRAY-AREA-3 H1**: 文件**标题** "mattpocock 16+ 招式"、§ 1 引用块仍写"16+"、§ 1.1 表格"16+ 命令"、§ 5 capture verification 表头说"A5' 16+ 命令 list" — 与 § 2.2 体内 23 直接矛盾。**对外读者首次读 § 1 / § 5 verification 表会困惑**。

### F35 (skill 真实性 + 风险)

- jimliu/baoyu-skills license None → ASSUMPTIONS D1.2.5-10 + GRAY-AREA-5 § 2.3 表格 (jimliu pending_license + 实测打分) + GRAY-AREA-1 § 2 yaml `chinese-content-deck` 含 `warn: "license: None — D1.2.5-10 pending license verify"` ✅
- ui-ux-pro-max install path → ASSUMPTIONS D1.2.5-11 + GRAY-AREA-5 § 2.3 + GRAY-AREA-1 § 2 yaml install: ui-ux-pro-max with note "(D1.2.5-11 待实测 install path)" ✅
- chrome-devtools-mcp 是 MCP → ASSUMPTIONS D1.2.5-12 + PROJECT-SPEC § 2.2 manifest install_type 字段说明 + GRAY-AREA-1 § 2 yaml domain: testing → primary_expert: ChromeDevTools/chrome-devtools-mcp ✅
- brave-search-mcp 已弃用 → GRAY-AREA-1 § 2 yaml `deprecated:` 块 + RESEARCH-2 § 1.5 deprecated 行 ✅

✅ F35 narrative 全对齐。

---

## § 6 Paranoid 发现的潜在问题（H/M/L 分级）

### 🔴 H (high — 阻塞 ship)

#### H1: GRAY-AREA-3 文件标题 + § 1 + § 5 仍是"16+"，与 § 2.2 实证 23 直接矛盾

**位置**：
- L1 标题 "GRAY-AREA-3: mattpocock **16+** 招式 Phase Routing 决策树"
- L3 目的 "capture A5' (mattpocock **16+** 命令 phase routing)"
- L5 状态 "完整 **16+** list 待 R2 返回填充"
- L12 引用用户笔记原话（OK，是历史引用，可保留）
- L20 表格 "16+ 命令"（不是引用，是当前定义 — 矛盾）
- L272 § 5 capture verification 表头 "A5' **16+** 命令 list" + 状态 "🔄 partial (待 R2)"
- L285 § 6 R2 必填项 "真实 **16+** 命令清单（来自 GitHub repo verify）"

**实际现状**：§ 2.2 已 R2 实证为 23 skills（10 + 4 + 4 + 4 + 3 + 2）— 文件 prep 阶段写的"16+"占位字段未在 commit fd1a1c7 之后刷新。

**Suggested fix**:
- L1 标题 → "GRAY-AREA-3: mattpocock **23** 招式 Phase Routing 决策树"
- L3 → "capture A5' (mattpocock **23** 命令 phase routing)"
- L5 → "✅ 完成（R2 实证 23 skills）"
- L20 → "**23 命令**（v0.1 catalog 18 active）"
- L272 → "A5' **23 命令** list"，状态 → "✅"
- L285 → 删除整段 § 6 "R2 返回后必填项"（已完成）

**为什么 H 级**：phase 1.3 plan-phase agent 拿到 GA-3 第一眼读到 16+，必须查到 § 2.2 才知道是 23 — 增加 plan-phase context 读取负担；且文档版本一致性是 paranoid review 硬关卡。

#### H2: ROADMAP.md 自相矛盾 — § 73-97 v3 重排段 vs § 139-198 + § 282-356 旧版

**位置**：
- ✅ § 73-97 是 v3 重排段（phase 1.3 = base profile + categorization；phase 1.4 = routing engine v1；phase 1.5 = DAG + Semantic Router）
- ❌ § 139-198 "v0.2.0 phase 拆分"段 P2.1 = cc-plugin-marketplace + git-clone-with-setup installer / P2.2 = karpathy-skills behavior-rule / P2.3 = execute-task workflow / P2.4 = ralph-loop Win — **是原始 v0.2 拆分，未按 v3 后移**
- ❌ § 186-196 "v0.3.0 phase 拆分"段 P3.1-P3.4 = checkpoint / gstack 前缀 / aliases / 路由 ≥85% — **是原始 v0.3，未按 v3 后移**
- ❌ § 282-356 "Phase 之间的依赖图" P1.1 = schema + ADR / **P1.2 = cross-OS CI** / **P1.3 = DAG + setup/doctor** / **P1.4 = research workflow** + 整段 P2.1-P2.4 / P3.1-P3.4 / P4.1-P4.3 — **完全是 v3 重排前的旧 ascii art，与 § 73-97 直接冲突**

**实际现状**：ASSUMPTIONS § E + ADR 0006 § 6 + ROADMAP § 73-97 都说 phase 1.3-1.5 是新拆分；但 ROADMAP § 282 ascii art 里 P1.3 = "DAG + setup/doctor" / P1.4 = "research workflow" 仍是 ADR 0005 时代的版本 — phase 1.3 plan-phase agent 一旦 grep "phase 1.4" 拿到的会是冲突的两个内容。

**Suggested fix**:
- L139-198：v0.2.0 phase 拆分段需重写为 ASSUMPTIONS § E "phase 2.x = execute-task workflow + ralph-loop 完整集成 + plan-feature workflow + checkpoint engine（v0.2+ 范围）"
- L186-196：v0.3.0 phase 拆分段重新依次（v0.3 现在是 plan-feature 还是合并到 v0.2？— 需 main agent 决定）
- L282-356：依赖图 ascii art 重画 (P1.1 / P1.2 ✅ / P1.2.5 🔄 / P1.3 = base profile + categorization / P1.4 = routing engine v1 / P1.5 = DAG + Semantic Router / P2.x / P3.x)

**为什么 H 级**：ROADMAP 是 phase 1.3 plan-phase 的 SSOT，自相矛盾 = phase 1.3 启动会 confusion。**这是用户硬要求"准备 phase 1.3 implementation"的 acceptance gap**。

#### H3: ADR 0006 + PROJECT-SPEC § 1 / § 1.1 仅说"4 心法"未列 4 个原则名

**位置**：
- ADR 0006 全文 grep "Think Before Coding\|Simplicity First\|Surgical Changes\|Goal-Driven" → **0 hit**
- PROJECT-SPEC L92 提到 "karpathy simplicity" 但**无完整 4 原则名单**
- 仅 GRAY-AREA-4 § 2.1-2.4 详列 4 原则名

**实际现状**：ADR 0006 wedge 描述说"4 心法"L17，A4' 表 L88 仅说"karpathy 心法 4 原则 1:1 enforce + always-on 注入"+ 引到 GRAY-AREA-4。但 ADR 是**长期决策记录**，未来读者读 ADR 0006 应该能直接拿到 4 个原则名（不依赖去 GRAY-AREA-4 读 250 字）。

**Suggested fix**: ADR 0006 § 4 A4' 行扩展为 "karpathy 心法 4 原则 1:1 enforce + always-on 注入 — **(1) Think Before Coding (2) Simplicity First (3) Surgical Changes (4) Goal-Driven Execution**" 或在 § 4 后单加一段 "4 原则速查"。

**为什么 H 级**：用户硬要求"100% 实现核心理念" — 4 心法是核心理念 = ADR 0006 必须直接含原则名（不只是数量"4"）；且 ADR 是 phase 1.3+ 长期 reference 入口，依赖 GRAY-AREA-4 是 fragile 的（GRAY-AREA-4 是 .planning/ 文件，长期可能 archive；ADR 永久保留）。

### 🟡 M (medium — 应当 fix 但不阻塞)

#### M1: ADR 0006 § 4 8 支柱表未列具体内容（仅 capture 文档指向）

**位置**：ADR 0006 L83-92 § 4 表 — 每行只有 "支柱 / 内容描述（一句）/ Capture 文档"，但**内容描述并不是支柱实质**。例如 A1' 内容 "gstack 6+ 虚拟角色矩阵 + trigger + sanity check" 并没有把 6 个角色名列出。

**Suggested fix**: ADR 0006 § 4 表加第 4 列 "关键定义" 或在表后加 6 行 bullet list：
- A1': CEO / EM / Designer / Paranoid / QA / CSO（6 主 + Investigator/发布工程师/复盘官扩展）
- A2': Strategy（"做什么"）vs Governance（"是否值得做"）
- A3': CI 守恒 / Lockfile / Cross-OS / Corepack / EOL / A7 守恒
- A4': Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution
- A5': Discuss / Plan / Execute / 维护 / Token-省 — 共 23 skills (v0.1 catalog 18 active)
- A8': meta / engineering / design / content / testing / search

#### M2: GRAY-AREA-1 § 5 EOL 行尾约束 enforcement 不可行

**位置**：GRAY-AREA-1 § 5 表第 4 行 "**EOL 行尾** | subagent 写文件后 main agent 检查 `git ls-files --eol` — fail 则 ralph-loop COMPLETE 拒绝接受"

**问题**：`git ls-files --eol` 只查工作区 staged 状态，subagent 写完未 commit 时不会显示新文件 EOL；且如果文件刚写完，`--eol` 可能不会暴露 CRLF（只有 commit 后才能 reliable check）。phase 1.3 implementation 时这个 enforcement 接口需重新设计（用 `dos2unix --info-c <file>` 或读字节流）。

**Suggested fix**: GRAY-AREA-1 § 5 EOL 行 update 为 "subagent 写文件后 main agent 在 commit 前 check (e.g., 用 `Get-Content -Raw | %{$_ -match \"\`r\`n\"}` 或 grep 字节)"。或加 caveat "phase 1.3 实装时确定具体 enforcement 接口"。

#### M3: ADR 0006 内容自描述不足，过度依赖 GRAY-AREA cross-ref

**位置**：ADR 0006 全文 314 行，但 6 category × decision rules 表（A8' 核心）/ 4 心法名（A4'）/ 23 skills mapping（A5'）都是引到 GRAY-AREA-1/3/4。如果未来这些 GRAY-AREA 被 archive 或重写，ADR 0006 就成了"empty shell"。

**Suggested fix**: ADR 0006 § 1 / § 4 加摘要文字（不必 1:1 抄，但每核心点至少 2-3 行 self-contained）。或在 ADR 0006 末尾加 § "Quick reference snapshot" 列入关键数据点。

#### M4: GRAY-AREA-3 § 6 "R2 返回后必填项" check list 是 stale 状态

**位置**：GRAY-AREA-3 L283-291 整段 § 6 是 R2 调研前的占位 ("R2 (gsd-project-researcher) 完成后回填本文档")。R2 已完成。

**Suggested fix**: 直接删除 § 6 R2 必填项段，或改写为 "✅ R2 已完成 — 23 skill 实证清单见 § 2.2"。

#### M5: AgentDefinition factory 接口未 sketched — phase 1.3 implementation actionability gap

**位置**：GRAY-AREA-1 § 1 architecture diagram L31 写 "AgentDefinition factory: skills: [...], prompt: ..., tools: ..."，伪代码层；GRAY-AREA-4 § 3.1 (a-revised) L96-118 给了一个伪代码 example 但还是接口签名级别。

**问题**：phase 1.3 plan-phase agent 拿到这两份文档不能立即实装。需要：
- factory function signature（input: routing_decision + task；output: AgentDefinition）
- AgentDefinition 字段 schema（哪些 required 哪些 optional）
- skills 字段格式（plugin name OR full path?）
- 错误处理路径（routing 决策但 skill install 失败？）

**Suggested fix**: phase 1.3 plan-phase 必须含 "AgentDefinition factory contract" deliverable，可在 ROADMAP phase 1.4 加 explicit acceptance criterion。本 phase 1.2.5 不必补，但建议加一行 follow-up note。

### 🟢 L (low — informational)

#### L1: progress.md § B.4 D1.2.5 决策追溯表是空的

**位置**：progress.md L172-174 "[empty — Wave B 完成后填 D1.2.5-1 ~ D1.2.5-N]"

**Suggested fix**: 直接写 "见 ASSUMPTIONS § D 决策追溯表 D1.2.5-1 ~ D1.2.5-12（本表统一 SSOT）"。

#### L2: GRAY-AREA-4 § 5 verification 表"待 R2 返回后写"残留

**位置**：GRAY-AREA-4 L227 "A4' + A6' (部分) 100% capture ✅ — A6' 还需 GRAY-AREA-3 (mattpocock 16+ phase routing) 完成 cross-ref；待 R2 返回后写。"

**Suggested fix**: R2 完成 + GA-3 已捕获 → 改成 "A4' + A6' 100% capture ✅ — A6' cross-ref GA-3 § 4 已对齐"。

#### L3: PROJECT-SPEC § 11 "Ship 节奏与版本规划"未与 v3 ROADMAP 对齐

**位置**：PROJECT-SPEC L399-407 v0.1.0 / v0.2.0 / v0.3.0 / v0.4.0 总周期 ~14 周，仍是 ADR 0005 时代的 v2.x 版本。但 v3 重排后 phase 1.3 + 1.4 + 1.5 是 v0.1 范围（base + routing engine v1 + DAG/Semantic Router）— 周期估算应当上调。

**Suggested fix**: PROJECT-SPEC § 11 表格里 v0.1.0 周期改为"3-5 周"（含 phase 1.3 + 1.4 + 1.5）；可注 "phase 1.2.5 wedge 重定位后扩大 v0.1 范围；总工期 ~16-18 周"。

#### L4: GRAY-AREA-3 § 1.1 "心法 vs 招式" 表 L20 还说 "16+ 命令"

**位置**：GRAY-AREA-3 L20 行 "数量 | 4 核心原则 | **16+** 命令"（见 H1 同一处 line range，但是不同表格行）。

**Suggested fix**: 改为 "**23** 命令 (v0.1 catalog 18 active)"。

---

## § 7 A7 守恒验证

```
Bash: for n in 0001 0002 0003 0004 0005; do git diff adr-$n-accepted -- "docs/adr/$n-*.md" | wc -l; done
=== ADR 0001 diff vs baseline === 0
=== ADR 0002 diff vs baseline === 0
=== ADR 0003 diff vs baseline === 0
=== ADR 0004 diff vs baseline === 0
=== ADR 0005 diff vs baseline === 0
```

✅ ADR 0001-0005 main body 全部不动 — A7 守恒 100% 维护

```
Bash: git tag -l "adr-*"
adr-0001-accepted / adr-0002-accepted / adr-0003-accepted / adr-0004-accepted / adr-0005-accepted / adr-0006-accepted
```

✅ ADR 0006 是新文件且 baseline tag 已打（CI A7 step iterate 1-6 by commit 33da1a0 verified）

✅ EOL 守恒 — phase-1.2.5 / docs/adr/0006 全部 LF（git ls-files --eol verified）

---

## § 8 Phase 1.3 readiness 评估

**整体评估**：phase 1.3 plan-phase agent 拿到当前 phase 1.2.5 输出，**实质 capture 足够，但有 3 个 actionability gap**：

### 8.1 ADR 0007 errata schema 字段定义可写吗？

✅ 可写。PROJECT-SPEC § 2.2 L77-83 给出了 3 个新字段（`install_type` / `category` / `decision_rules`）的枚举值；GRAY-AREA-1 § 2 给了 `decision_rules.yaml` 全 schema 含 hit_policy / rules / fallback_supervisor / deprecated 主层结构；ASSUMPTIONS D1.2.5-12 lock。能写出 ADR 0007 errata。

### 8.2 decision_rules.yaml 解析 + AgentDefinition factory 实装可写吗？

⚠ **部分**。decision_rules.yaml schema lock 完整；但 AgentDefinition factory 接口（M5 提到）只在伪代码级；factory function signature / AgentDefinition 字段映射 / 错误处理需 phase 1.3 plan-phase 内自己设计。

**Suggested addition**: phase 1.3 plan-phase 应在 ROADMAP § Phase 1.3 行加：
- "AgentDefinition factory function signature contract（input/output schema）"
- "skill install + reload + verify 错误路径设计"

### 8.3 base profile 一键装齐 + ui-ux-pro-max install path 实测可启动吗？

✅ 可启动。ASSUMPTIONS D1.2.5-11 + GRAY-AREA-5 § 2.3 给出实测打分表 + 风险记录；GRAY-AREA-1 § 2 yaml 已含 install adapter 风险注。phase 1.3 可 immediately 跑 `npx skills@latest add midwayjs/midway` 实测。

**结论**：8/10 readiness — H1+H2+H3 修补后 → 9.5/10。M5 actionability gap 可 deferred 到 phase 1.3 plan-phase 内自闭环。

---

## § 9 Final verdict

**APPROVED WITH PATCHES**

**必须 fix 的 H 级 finding**（patch 后才推荐 ship phase 1.2.5 + 启动 phase 1.3）:

1. **H1** GRAY-AREA-3 标题 + § 1 + § 5 表头从 "16+" 改为 "23" — 1 处文件 6 行 surgical edit（< 5 min）
2. **H2** ROADMAP.md § 139-198 + § 282-356 重写为 v3 拆分（phase 2.x = execute-task + ralph-loop 完整集成 + plan-feature + checkpoint 重排）— 1 处文件 ~75 行重写（~15 min）
3. **H3** ADR 0006 § 4 A4' 行加 "Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution" 4 名 — 1 行扩展（< 1 min）

**应当 fix 的 M 级 finding（推荐 fix，不阻塞 ship）**：

4. **M1** ADR 0006 § 4 A1'/A2'/A3'/A5'/A8' 加关键定义列或后置 bullet list — 推荐随 H3 一起 fix（~5 min）
5. **M3** ADR 0006 加 § "Quick reference snapshot" 减少 cross-ref 依赖 — ~10 min
6. **M4** GRAY-AREA-3 § 6 stale "R2 必填项" 删除或改写 ✅ — ~1 min
7. **M2** GRAY-AREA-1 § 5 EOL enforcement 加 caveat — ~3 min
8. **M5** ROADMAP phase 1.3 行加 "AgentDefinition factory contract" deliverable — ~5 min

**L 级 (optional cleanup)**：
- L1 progress.md § B.4 链回 ASSUMPTIONS § D
- L2 GRAY-AREA-4 § 5 残留"待 R2 写"清理
- L3 PROJECT-SPEC § 11 ship 节奏 v3 update
- L4 GRAY-AREA-3 L20 "16+" → "23"

---

## § 10 Recommended next step

main agent 拿到本 review 后建议按以下顺序执行 Wave D.2 patches：

1. **immediately** apply H1 (GRAY-AREA-3 16+ → 23 surgical edit)
2. **immediately** apply H3 (ADR 0006 § 4 加 4 心法名)
3. **immediately** apply M1 + M3 (ADR 0006 内容自描述加强)
4. **single batch** apply H2 (ROADMAP.md § 139-198 + § 282-356 v3 重排) — 这是最大 chunk，约 15 min
5. **optional** apply M2 + M4 + M5 + L1-L4
6. **commit** "phase-1.2.5: Wave D.2 sister-review patches — H1+H2+H3+M1+M3 (+optional M2/M4/M5)"
7. 最终 verify：8/8 ✅ + ROADMAP self-consistent + ADR 0006 self-contained → push & merge → 进 phase 1.3 plan-phase

**ship gate**: H1 + H2 + H3 fix 完成 + 重 grep verify "16+" 在 phase-1.2.5 文档应 0 hit；ROADMAP "Phase 1.4" 应只指 routing engine v1 不再有歧义；ADR 0006 grep "Think Before Coding\|Simplicity First\|Surgical Changes\|Goal-Driven" 应 4/4 hit。

完成后即可 advance 到 phase 1.3 plan-phase。
