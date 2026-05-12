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

- ✅ **A1'** gstack 6+ 虚拟角色矩阵 + 触发条件 + sanity check (GRAY-AREA-2 § 2 完整 + § 4 P0-2 lock (b))
- ✅ **A2'** gstack 双职责区分（"做什么" vs "是否值得做"）(GRAY-AREA-2 § 1)
- ✅ **A3'** GSD 环境质量层（CI/lockfile/Cross-OS/Corepack/EOL/A7） (ASSUMPTIONS § B + GRAY-AREA-1 § 5)
- ✅ **A4'** karpathy 心法 4 原则 1:1 enforce + always-on 注入 (GRAY-AREA-4 § 2 + § 3.1 修订为 a-revised main agent factory inject)
- ✅ **A5'** mattpocock **23** 招式 phase routing 决策树 (GRAY-AREA-3 § 2.2 R2 实证 + § 3 schema main-process-driven)
- ✅ **A6'** 心法+招式配对（主流程注入 + subagent phase trigger） (GRAY-AREA-3 § 4 + GRAY-AREA-4 § 4)
- ✅ **A7'** superpower brainstorming + TDD 触发规则 (GRAY-AREA-1 § 4 hybrid: mandatory + heuristic + optional)
- ✅ **A8'** **6 大 category** × decision rules + curate criteria (GRAY-AREA-1 § 2 § 3 + GRAY-AREA-5 完整 v0.1 5 项 + v0.4+ checklist)

**8/8 ✅ Capture 完成 — 待 Wave D cross-validation 最终 verify**

### A.3 Wave 进度概览

| Wave | 内容 | Steps | 状态 |
|------|------|-------|------|
| A | Researcher 调研 (R1 routing engine + R2 skill ecosystem) | R1 + R2 (parallel async) | ✅ done (R1 450L HIGH conf + R2 700L HIGH conf; F33 实证 + F34 6 类 + 23 命令实证) |
| B | 综合 (ASSUMPTIONS + 5 GRAY-AREA) | B.1 - B.6 | ✅ done (5 GRAY-AREA + ASSUMPTIONS; 8/8 capture; D1.2.5-1 ~ D1.2.5-12 lock; GA-2/3/4 enforcement 路径与 D1.2.5-3/-9 对齐) |
| C | Spec 修订 (PROJECT-SPEC v3.0 + ADR 0006 + ROADMAP 重排) | C.1 - C.3 | ⏳ pending |
| D | Cross-validation (sister CC review + paranoid + final acceptance) | D.1 - D.4 | ⏳ pending |

### A.4 进度日志（追加式 — newest at bottom）

<!-- 示例：2026-MM-DD | <wave>.<step> | <result> | <commit-shorthash> -->

2026-05-12 | A.start | KICKOFF.md created (156L); 8 支柱 acceptance bar A1'-A8' locked; 5 P0 灰色地带 enumerated; 4 wave 分解; researcher R1+R2 spawned async parallel | (in-progress)
2026-05-12 | B.prep.1 | progress.md 框架 created (本文件) | aea12e5
2026-05-12 | B.prep.2 | GRAY-AREA-2-gstack-roles.md prepared (A1'+A2' 完整 capture from 用户笔记 + CLAUDE.md, 不依赖 researcher) | f1298ff
2026-05-12 | B.prep.3 | GRAY-AREA-4-karpathy-enforcement.md prepared (A4' 完整 capture from 用户笔记) | 41e986c
2026-05-12 | B.prep.4 | GRAY-AREA-3-mattpocock-phase-routing.md prepared (A5' partial schema + A6' 100% capture; § 2.2 完整 16+ 命令清单待 R2) | fd1a1c7
2026-05-12 | A.R1 | RESEARCH-1-routing-engine.md done (450L; HIGH confidence); 🔴 F33 实证 — subagent 内 reload 不可行; 🟢 main-process-driven routing 唯一路径; P0-1 → (a) 独立 decision_rules.yaml; P0-2 → (b) 中等深度编码 (不 vendor 治理 skill prompt); 推荐双层 router (Semantic Router + LangGraph Supervisor); 3 红旗 + 6 open questions; see § B F33 narrative | (pending commit)
2026-05-12 | A.R2 | RESEARCH-2-skill-ecosystem.md done (700L; HIGH confidence); 6 大 category 实证 (不是 4+ — meta/engineering/design/content/testing/search); 23 mattpocock skills (不是 16+); 17 anthropics + 21 baoyu 全实测可访问; ui-ux-pro-max 在 midwayjs/midway/.codex/skills/ 是 Codex skill (待 v0.1 实测 install path); jimliu/baoyu-skills license: None warn; brave-search-mcp 已弃; chrome-devtools-mcp 是 MCP 不是 skill; P0-3 → (c) phase-aware 渐进; P0-5 → (a+b) hybrid; see § B F34 | (pending commit)
2026-05-12 | B.1 | ASSUMPTIONS.md (227L) — 8 支柱 capture 总览 + A3' 环境质量层 lock + 5 P0 lock + D1.2.5-1 ~ D1.2.5-12 决策追溯表 + ROADMAP 重排 (phase 1.3 = base profile + categorization schema; phase 1.4 = routing engine v1; phase 1.5 = DAG + Semantic Router 升级) | c8cb344
2026-05-12 | B.2 | GRAY-AREA-1-routing-engine.md (348L) — main-process-driven architecture diagram (D1.2.5-3) + decision_rules.yaml v1 schema (DMN Priority Hit Policy + 6 category × 12 rules 实例) + § 4 superpower brainstorming + TDD 触发 hybrid (A7') + § 5 GSD env quality enforcement (A3' partial) + § 6 main agent system prompt (verbatim COMPLETE F33 P1 mitigation) | c8cb344
2026-05-12 | B.6 | GRAY-AREA-5-curate-criteria.md (191L) — v0.1 5 项 mandatory + advisory score + v0.1 candidate 实测打分表 (jimliu pending_license + mattpocock warn) + official maintainer override 列表 + v0.4+ community PR checklist + OSSF Scorecard subset | c8cb344
2026-05-12 | B.3 | GRAY-AREA-2 修订 — § 4 P0-2 lock 改为 (b) 中等深度 (与 ASSUMPTIONS 一致；R1 § 5.2 推荐) + enforcement 路径 main-process-driven | (pending commit)
2026-05-12 | B.4 | GRAY-AREA-3 修订 — § 2.2 加 R2 实证 23 真实命令清单 (18 active 进 v0.1 catalog；4 deprecated + 2 personal + 3 in-progress 排除) + § 3.1 schema 修订为 main-process-driven (主进程 install + AgentDefinition factory inject — F33 实证) | (pending commit)
2026-05-12 | B.5 | GRAY-AREA-4 修订 — § 3.1 候选 (a) → (a-revised) main agent factory 构造时 inject prompt 字段 (D1.2.5-9) + § 3.4 推荐 (a-revised) + 部分 (b) hook reminder | (pending commit)

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

#### F33: routing engine subagent reload 可行性（**已实证 — 🔴 不可行**）

- **Date**: 2026-05-12
- **Wave**: A.R1
- **Type**: discovery → blocker (架构 wedge 修订必须)
- **Severity**: P0（影响整个 phase 1.4 routing engine 设计）
- **Context**: 用户提议的 subagent isolation = 决策路由 + skill 安装 + invoke 全在 subagent 内。R1 调研 (450L HIGH confidence) 实证此路径**不可行**。
- **Investigation**:
  - 4 篇官方 docs + 4 个 GitHub issues + 多个第三方文章交叉印证
  - 事实 A: subagent 不继承 main agent skill description（`AgentDefinition.skills: [...]` 必须显式列）
  - 事实 B: live change detection 仅覆盖部分目录，project root skill 需完整 restart（issue #46040 仍 open）
  - 事实 C: `/reload-plugins` 是 **main session 命令**，不是 subagent 命令；且 issue #35641 / #37862 仍 open
  - 事实 D: subagent **不能 spawn 嵌套 subagent**（官方明文禁止 — `Agent` 不允许在 subagent's `tools` 数组）
- **Resolution**: 架构 wedge 修订 — **routing engine 必须 main-process-driven**：
  - 主进程查 `decision_rules.yaml` → 主进程 `claude plugin install` + `/reload-plugins` → 主进程用 `AgentDefinition` factory 动态构造 subagent（`skills:` 字段 startup 全文注入）→ subagent 仅 invoke 已注入 skill → ralph-loop COMPLETE 通过 final message **verbatim** 回流
- **Impact**:
  - 之前 architecture 图 "Layer 2 subagent 内 routing engine activate" 错误 — 必须修订为 "Layer 1 主流程含 routing engine"
  - subagent isolation 仍成立（仅 invoke 已注入 skill；context 完全隔离）
  - 但主流程不再"上下文最小化" — 含 routing logic + install + factory 构造（仍可控因为是函数式 logic，不是 LLM 推理）
  - GRAY-AREA-2 / GRAY-AREA-3 / GRAY-AREA-4 enforcement schema 需要 Wave B 综合时修订（"subagent.start() inject" → "main agent factory 构造时 prompt 字段注入"）
- **Cross-ref**: 
  - `RESEARCH-1-routing-engine.md` § 1 (subagent reload 不可行) + § 1.4 (alternative 设计图)
  - GitHub issues: #32910 / #35641 / #37862 / #46040
  - 官方 docs: code.claude.com/docs/en/agent-sdk/subagents

#### F33-followup: 3 P0/P1 红旗（来自 R1 § 5.3）

- **🔴 P0**: subagent 不能嵌套 — phase 1.4 routing engine **必须** main-process-driven（已 lock 到 F33 resolution）
- **🟡 P1**: `/reload-plugins` skill bug (issue #35641) — 设计 fallback：每次 install 后**主进程**用 fresh subagent invoke 验证 skill 可用
- **🟡 P1**: subagent final message 可能被主 summarize → ralph-loop COMPLETE 检测会失效 — main agent system prompt **必须**强制 "verbatim return COMPLETE marker"

#### F34: 6 大 category + 23 mattpocock skills 实证（已 ✅）

- **Date**: 2026-05-12
- **Wave**: A.R2
- **Type**: discovery
- **Severity**: P2 (架构数据修正)
- **Context**: 用户笔记里提议 4+ category（meta/engineering/design/content）+ 16+ mattpocock skills；R2 实证后修正为 6 类 + 23 skills。
- **Investigation**:
  - GitHub API 直接抓 mattpocock/skills repo → 23 skills (10 engineering + 4 productivity + 4 misc + 4 deprecated + 3 in-progress + 2 personal)
  - ctx7 skills search + WebFetch 各 candidate 真实性 verify
  - 用户笔记笼统说"4+"，调研后确定 6 类（加 testing + search 是用户 CLAUDE.md 隐含但未单独 enumerate 的类）
- **Resolution**:
  - 6 大 category lock (D1.2.5-6) — meta + engineering + design + content + testing + search
  - 23 mattpocock skills lock (D1.2.5-7) — 18 active 进 v0.1 catalog；4 deprecated 排除；3 in-progress + 2 personal deferred
- **Impact**: 
  - GRAY-AREA-1 § 3 / decision_rules.yaml 含 6 category × 12 rules 实例
  - GRAY-AREA-3 § 2.2 真实 18 active 命令归类（取代 placeholder）
- **Cross-ref**: RESEARCH-2 § 1 + § 3.1 / ASSUMPTIONS § C P0-3 + D1.2.5-6 / D1.2.5-7

#### F35: 关键 skill 真实性 + 风险（部分 ⚠️ + ✅）

- **Date**: 2026-05-12
- **Wave**: A.R2
- **Type**: discovery + risk
- **Severity**: P2 (v0.1 必修)
- **Resolution**:
  - ✅ ui-ux-pro-max 真实存在但藏在 midwayjs/midway/.codex/skills/ — Codex skill 不是独立 CC plugin → D1.2.5-11 phase 1.3 必须实测 install path
  - ⚠️ jimliu/baoyu-skills license: None — D1.2.5-10 v0.1 标 pending_license advisory 收录 + warn user opt-in；v0.2 联系 maintainer 加 LICENSE
  - ⚠️ mattpocock 单 maintainer (Avelino 36%/年风险) — GRAY-AREA-5 § 2.3 advisory warn + phase 2.x mirror backup 计划
  - ✅ chrome-devtools-mcp / playwright-mcp / tavily-mcp / exa-mcp 全 Org 维护 + Apache-2.0/MIT + 高 stars
  - ❌ brave-search-mcp 已弃用 (CLAUDE.md 已记录) — manifest 显式 deprecated 列表
- **Impact**:
  - manifest schema 加 `install_type: skill | mcp | npm | git` 字段 (D1.2.5-12)
  - GRAY-AREA-5 § 2.3 candidate 实测打分表
- **Cross-ref**: RESEARCH-2 § 4.4 风险 / GRAY-AREA-5 / ASSUMPTIONS D1.2.5-10/-11/-12

### B.4 已锁定决策追溯表（Wave B ASSUMPTIONS 完成后填）

[empty — Wave B 完成后填 D1.2.5-1 ~ D1.2.5-N]

### B.5 ADR 升级索引

| ADR | Status | Trigger | Date |
|-----|--------|---------|------|
| 0006 | ⏳ planned (Wave C C.2) | 三层栈机器化 wedge 重定位 | TBD |
| 0007 | ⏳ open slot (phase 1.3) | manifest schema 加 `category` + `decision_rules` 字段 errata (A7 守恒不动 0001) | TBD |

### B.6 Wave-level retrospective

#### Wave A ✅ retro (2026-05-12)

**What worked**:
- R1 + R2 parallel async — 总用时 ~10 min vs 串行 ~30 min（节省 67%）
- R1 / R2 工具分配清晰：R1 主用 WebSearch + WebFetch 官方 docs；R2 主用 ctx7 skills search + gh api + WebFetch GitHub repo
- 两个 researcher 输出质量都 HIGH confidence（450L + 700L），References 含完整 access date 印证

**What was inefficient**:
- 用户笔记里"4+ category"和"16+ mattpocock skills"过于笼统 — R2 调研花约 20% 时间纠正数据（6 类 / 23 skills）
- ui-ux-pro-max 隐藏在 midwayjs/midway/.codex/skills/ 不在标准路径 — R2 探索成本高

**Phase 1.3+ 沿用**:
- parallel async researcher 模式可复用（GA-researcher 替代单 main agent 顺序调研）
- ctx7 skills search 应当在 phase 1.3 build 时直接集成（用户体验：`harnessed search <query>` 内部调 ctx7）

#### Wave B ✅ retro (2026-05-12)

**What worked**:
- B.prep (B.3/B.4/B.5 prep) 等 researcher 期间做不依赖 R1/R2 的工作 — 节省后 30% 时间
- ASSUMPTIONS / GRAY-AREA-1 / GRAY-AREA-5 single batch commit — 3 文件 703L 一次 ship 减少 commit graph 噪音
- GRAY-AREA-2/3/4 enforcement 路径修订用 surgical Edit（4 patches）非 rewrite — 守住 phase 1.1-1.2 atomic commit 风格
- D1.2.5-3 (main-process-driven) 一旦 lock 后，所有 GRAY-AREA enforcement 路径自动统一到一处（factory inject）

**What was inefficient**:
- GA-2 § 4 P0-2 (a) "1:1 enforce" 与 ASSUMPTIONS lock (b) "中等深度" 表面冲突，实际相容 — patch 时需小心 word choice 避免歧义
- GA-3 § 2.2 placeholder → R2 实证替换 — 应在 prep 阶段就标注 "R2 完成后必填" 提示更早

**Phase 1.3+ 沿用**:
- decision_rules.yaml DMN Priority Hit Policy schema 已 lock — phase 1.4 实装时直接 reference GRAY-AREA-1 § 2
- 6 category × decision rules 表已 lock — phase 1.3 manifest schema 加 `category` + `decision_rules` 字段时 1:1 mapping

[Wave C / Wave D retro 各自 wave 完成后追加]

---

## Section C — Acceptance Bar 8 支柱 Capture Verification (Wave D 用)

> Wave D cross-validation 时按本表逐条 verify；任一 ✗ 都 block phase 1.2.5 ship。

| 支柱 | 验证文档 | 验证查询 (cmd / grep / 文件检查) | 状态 |
|---|---|---|---|
| **A1'** gstack 6+ 角色矩阵 | GRAY-AREA-2 § 2 + ADR 0006 § X (Wave C 待) | grep "Designer\|QA\|CSO\|EM\|Paranoid\|CEO" 全 hit + matrix table 含触发条件列 | ✅ Wave B (待 Wave D verify) |
| **A2'** gstack 双职责 | GRAY-AREA-2 § 1 + ADR 0006 (Wave C 待) | grep "做什么\|是否值得做\|Strategy.*Governance" 区分明确 | ✅ Wave B (待 Wave D verify) |
| **A3'** GSD 环境质量层 | ASSUMPTIONS § B + GRAY-AREA-1 § 5 + ADR 0006 + ROADMAP (Wave C 待) | grep "环境质量\|CI 守恒\|lockfile\|Cross-OS\|Corepack" 全 hit | ✅ Wave B (待 Wave D verify) |
| **A4'** karpathy 4 原则 1:1 enforce | GRAY-AREA-4 § 2 + § 3.1 修订 (a-revised) + ADR 0006 (Wave C 待) | grep "Think Before Coding\|Simplicity First\|Surgical Changes\|Goal-Driven" 4/4 hit + always-on 注入机制描述 | ✅ Wave B (待 Wave D verify) |
| **A5'** mattpocock 23 招式 phase routing | GRAY-AREA-3 § 2.2 (R2 实证) + § 3 schema + ADR 0006 (Wave C 待) | 23 命令 list 含 phase 归类 + 5 phase × 命令 mapping table | ✅ Wave B (待 Wave D verify) |
| **A6'** 心法+招式配对 | GRAY-AREA-3 § 4 + GRAY-AREA-4 § 4 + ADR 0006 (Wave C 待) | 显式描述 "心法 always-on + 招式 on-demand by phase" 配对机制 | ✅ Wave B (待 Wave D verify) |
| **A7'** superpower brainstorming + TDD 触发 | GRAY-AREA-1 § 4 (mandatory + heuristic + optional) + ADR 0006 (Wave C 待) | 核心业务/算法/高可靠性 识别规则 + 触发流程 schema | ✅ Wave B (待 Wave D verify) |
| **A8'** 6 category × decision rules + curate criteria | GRAY-AREA-1 § 2 § 3 + GRAY-AREA-5 + ADR 0006 (Wave C 待) | category list = 6 + 每 category 至少 1 个 decision rule 实例 + curate criteria 5+ 项 | ✅ Wave B (待 Wave D verify) |

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
