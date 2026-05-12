# ADR-0006: Three-Stack Methodology Mechanization Wedge (架构重定位)

## Status

**Accepted** — 2026-05-12

## Context

Phase 1.2 + 1.2.1 hotfix SHIPPED 后用户在三轮深度对话中提出 **wedge 级修订**（详见 `.planning/phase-1.2.5/KICKOFF.md` § 触发原因）：

1. **第 1 轮**：harnessed 不是"装配市面 skill"，是"**N 大类 × M 候选 + 决策辅助 + 按需装**"
2. **第 2 轮**："**base 不动 + extension 叠加**"双层架构；harnessed-driven 主动决策路由（不是 user-driven 浏览）
3. **第 3 轮**：subagent isolation + ralph-loop wrap + **整个三层栈方法论的机器化**

最终 wedge 描述（用户硬要求 100% 实现）：

> **完整三层栈方法论的可执行 engine — 6+ 虚拟角色 / 双职责治理 / 环境质量 / 4 心法 / 23 招式 phase 路由 / 心法-招式配对 / brainstorming-TDD 触发规则 / 6 skill category — 全部从静态 CLAUDE.md 升级为 subagent-isolated routing engine**

### 触发的根本问题

Phase 1.1-1.2 的设计假设是"10 固定上游 manifest + 3 工程化 workflow"。这个假设**只覆盖了 engineering category 一个分支**，丢失了 wedge 的 4 个核心维度：

1. **6+ 虚拟角色矩阵** — gstack 不是单一治理工具，是 CEO/EM/Designer/Paranoid/QA/CSO 6+ 角色虚拟团队
2. **23 招式 phase routing** — mattpocock skills 不是"工具集"，是按 5 phase 精确路由的决策树
3. **6 skill category × decision rules** — 用户笔记里 UI/UX 决策（ui-ux-pro-max + frontend-design 默认/冲突仲裁/override "做出风格"）这种规则**不是配置**，是机器可执行的 routing logic
4. **subagent isolation + ralph-loop 交付保证** — 子任务执行不应污染主流程上下文

### Phase 1.2.5 调研支撑（HIGH confidence）

- `RESEARCH-1-routing-engine.md` (450L) — CC subagent skill 动态 reload 不可行（4 GitHub issues + 4 官方 docs）；唯一路径是 main-process-driven routing
- `RESEARCH-2-skill-ecosystem.md` (700L) — 6 大 category 实证（不是 4+）+ mattpocock 23 skills（不是 16+）+ ui-ux-pro-max 真实存在 + jimliu/baoyu license None 风险等

## Decision

### 1. 双层架构（Base + Extension 叠加，不替换）

```
┌─ Base Layer (phase 1.1-1.2 已 ship 不动) ────────────────┐
│  10 固定 manifest + 3 workflow MVP (research /            │
│  execute-task / plan-feature) + B+C 混合命令路由           │
│  → `harnessed install --base` 一键装齐 (phase 1.3 加)     │
└──────────────────────────────────────────────────────────┘
                          ▲
                   决策路由 engine (新核心模块)
                          ▼
┌─ Extension Layer (phase 1.3+ 加) ────────────────────────┐
│  6 大 category × M 精选候选 manifest:                     │
│    meta / engineering / design / content / testing / search│
│  + decision rules (DMN-style YAML)                       │
│  + curate criteria (v0.1 5 项 mandatory + advisory)      │
└──────────────────────────────────────────────────────────┘
```

### 2. 三角色横切 + 技术 Architecture 三层（正交）

**三层栈角色（横切，always-present）**：
- gstack (决策层 / 虚拟创业团队 / 治理关卡)
- GSD (项目经理 / orchestration / 环境质量)
- superpower (资深工程师团队 / brainstorming + TDD)

**技术 Architecture 三层（纵向）**：
- Layer 1: 主流程 (main agent — 含 routing engine + factory)
- Layer 2: subagent (isolated 上下文，仅 invoke 已注入 skill)
- Layer 3: skill universe (Base + Extension)

### 3. Main-Process-Driven Routing Engine（D1.2.5-3 lock）

routing engine 在主流程跑（**不在 subagent 内** — CC 架构禁止 subagent 内 install + reload，F33 实证）：

```
主进程: routing engine
  → 查 .planning/decision_rules.yaml (DMN Priority Hit Policy)
  → L1 关键词路由 + L2 LLM Supervisor fallback
  → 主进程 install + /reload-plugins
  → AgentDefinition factory 动态构造 subagent
    (skills/prompt 字段 startup 全文注入：心法 4 原则 + 子任务 context)
  → spawn subagent
  → 接收 final message verbatim → 解析 COMPLETE 标记
```

### 4. 8 支柱 100% Capture 验收（acceptance bar）

| 支柱 | 关键定义（self-contained） | Capture 文档 |
|---|---|---|
| **A1'** | gstack **6+ 虚拟角色矩阵**: CEO / EM (Engineering Manager) / Designer / Paranoid Staff Engineer / QA / CSO（+ Investigator / 发布工程师 / 复盘官扩展）+ 各角色 trigger + sanity check | `GRAY-AREA-2-gstack-roles.md` § 2 |
| **A2'** | gstack **双职责区分**: "做什么" Strategy（高层决策 / 商业战略 / scope 决策）vs "是否值得做" Governance（治理关卡 / sanity check / Paranoid 风险 / 安全 / 设计审查）| `GRAY-AREA-2-gstack-roles.md` § 1 |
| **A3'** | GSD **环境质量层 7 维度**: CI 守恒 / Lockfile / Cross-OS / Corepack / 工具版本 / EOL 行尾 / A7 守恒（adr-NNNN-accepted baseline tag iterate）| `ASSUMPTIONS.md` § B + `GRAY-AREA-1-routing-engine.md` § 5 |
| **A4'** | karpathy **心法 4 原则** 1:1 enforce + always-on 注入: **(1) Think Before Coding** （编码前必先 brainstorming） **(2) Simplicity First** （最小有效代码 / YAGNI） **(3) Surgical Changes** （atomic commit / single concern） **(4) Goal-Driven Execution** （每行代码服务明确 acceptance criterion）— 通过 main agent `AgentDefinition` factory inject 到 subagent prompt 字段 | `GRAY-AREA-4-karpathy-enforcement.md` § 2 + § 3.1 (a-revised) |
| **A5'** | mattpocock **23 招式** phase routing 决策树（v0.1 catalog **18 active**：10 engineering + 4 productivity + 4 misc + 4 deprecated 排除 + 3 in-progress + 2 personal deferred）— 5 phase 归类: Discuss / Plan / Execute / 维护 / Token-省 | `GRAY-AREA-3-mattpocock-phase-routing.md` § 2.2 (R2 实证) + § 3 |
| **A6'** | **心法+招式配对** day-to-day 模式: 心法 always-on baseline (CLAUDE.md inject) + 招式 on-demand by phase (trigger prompt) + ralph-loop wrap COMPLETE | `GRAY-AREA-3` § 4 + `GRAY-AREA-4` § 4 |
| **A7'** | superpower **brainstorming + TDD 触发 hybrid**: mandatory_tdd_triggers (核心业务 / 算法 / auth / SLA ≥ 99.9%) + heuristic (mattpocock /tdd 内置 vertical slice) + optional user-decide | `GRAY-AREA-1` § 4 |
| **A8'** | **6 大 skill category** × decision rules + **curate criteria 5 项 mandatory** (OSI license / ≥100 stars / 6mo 活跃 / SKILL.md / Org 或 ≥2 contributors): meta / engineering / design / content / testing / search | `GRAY-AREA-1` § 2 § 3 + `GRAY-AREA-5-curate-criteria.md` |

### 5. 5 P0 灰色地带 Lock

| ID | Lock | 来源 |
|---|---|---|
| P0-1 | (a) 独立 `.planning/decision_rules.yaml` (DMN Priority Hit Policy) | R1 § 5.1 |
| P0-2 | (b) 中等深度编码 — 编码 *何时触发* 治理 skill，*不 vendor* prompt | R1 § 5.2 (守 wedge 不 vendor 原则) |
| P0-3 | (c) phase-aware 渐进 (v0.1 maintainer / v0.2-0.3 issue / v0.4+ community PR) | R2 § 4.2 |
| P0-4 | (c) 渐进 — workflow 模式 docs only + 部分 heuristic 立即编码 | 用户笔记 + 自反思 |
| P0-5 | (a + b) hybrid — hard-coded mandatory TDD + heuristic + optional user-decide | R2 § 4.3 |

### 6. ROADMAP 重排（影响 phase 1.3+）

| Phase | 原 | 新 |
|---|---|---|
| 1.3 | DAG resolver + harnessed-router + setup full | **base profile + categorization schema + decision_rules.yaml v1**（新 ADR 0007 errata：manifest 加 `category` + `decision_rules` + `install_type` 字段，A7 守恒不动 0001）+ ADR 0006 ship + base profile install + ui-ux-pro-max install path 实测 |
| 1.4 | research workflow E2E + routing/search.md | **routing engine v1 实装** — main-process-driven + DMN-style YAML + AgentDefinition factory + 6 category × decision rules MVP + research workflow 沿用 search category routing |
| 1.5 | (原本 v0.2.0 起点) | **新加 phase 1.5**: DAG resolver + Semantic Router 语义增强 (v2 升级) + 高频 workflow 模式编码 |
| 2.x | 原 v0.2 顺序 | 后移：execute-task workflow + ralph-loop 完整集成 + plan-feature workflow + checkpoint engine |

## Consequences

### 正面

1. **wedge 真正实现** — harnessed 是"完整三层栈方法论的可执行 engine"，不是"另一个 plugin pack"
2. **8 支柱 100% capture** — 用户硬要求满足；任何遗漏的角色/职责/原则/招式都阻塞 ship
3. **subagent isolation 守住** — context 完全隔离 + ralph-loop 交付保证 + 主流程上下文不被污染
4. **A7 守恒持续** — Phase 1.1-1.2 已 ship 代码不 break；新 schema 字段走 ADR 0007 errata（不动 0001 main body）
5. **6 大 category extension layer 解锁** — 4 个新 category（design / content / testing / search）能在 phase 1.4-2.x 渐进引入
6. **决策路由 grammar 标准化** — DMN Priority Hit Policy 让规则可调试可观测，不是黑盒 LLM router

### 负面

1. **架构复杂度提升 ~30%** — main agent 不再"上下文最小化"，含 routing engine + install + factory（仍可控因为是函数式 logic 不是 LLM 推理）
2. **CC API 依赖** — AgentDefinition factory + skills 字段全文注入 + `/reload-plugins` 等都依赖 CC v2.1+ API；CC API 演进时 harnessed 需 wrap adapter 层
3. **Implementation 范围扩大** — phase 1.3 从 "DAG resolver + research workflow" 改为 "base profile + categorization schema + routing engine 准备"；phase 1.4-1.5 都受影响
4. **三红旗持续监控**:
   - 🔴 P0: subagent 不能嵌套（已 lock 到 main-process-driven）
   - 🟡 P1: `/reload-plugins` skill bug — 需 install 后 fresh subagent invoke 验证 fallback
   - 🟡 P1: subagent final message summarize 风险 — main agent system prompt 必须强制 verbatim COMPLETE
5. **Bus factor risk for some skills** — mattpocock 单 maintainer (Avelino 36%/年) / jimliu/baoyu license None — 见 GRAY-AREA-5 v0.1 candidate 实测打分表

### 中性

1. **decision_rules.yaml 进化路径** — v0.1 DMN-style YAML（关键词匹配 0ms）→ v0.2+ 加 Semantic Router 语义增强层（embedding kNN 5-30ms）→ phase 1.5 升级 routing engine v2
2. **Phase 1.3 推迟 DAG resolver** — 不是问题，因 base layer 已 ship 安装可用；DAG resolver 在 phase 1.5 与 Semantic Router 一起升级
3. **manifest schema 加 `install_type` 字段** — 区分 skill / mcp / npm / git 4 种安装路径（chrome-devtools-mcp 是 MCP 不是 skill）；走 ADR 0007 errata

## Compliance / Migration

### v0.1 phase 1.2.5 起的强制约束

- 任一 phase 1.3+ design 违反 8 支柱 100% capture → CI fail（phase 1.3 加 capture verification step）
- ADR 0006 main body 不变（A7 守恒；本 ADR commit 后立即打 `adr-0006-accepted` tag）
- `decision_rules.yaml` v1 schema 改动需走 ADR 0007+ errata
- Phase 1.1-1.2 已 ship 代码 / 10 manifest / 3 workflow 全部保留 — 不 break

### Wave D Cross-validation 验收点

ADR 0006 ship 前必须通过：

- [ ] 跨 session sister CC review verdict ≥ APPROVED WITH PATCHES
- [ ] 8 支柱 capture verification 8/8 ✅（按 progress.md § C 表格 grep 验证）
- [ ] 5 P0 决策追溯 → R1/R2 章节 lock 一致
- [ ] D1.2.5-1 ~ D1.2.5-12 决策追溯完整
- [ ] PROJECT-SPEC v2.1 → v3.0 patch 与本 ADR 一致
- [ ] ROADMAP phase 1.3+ 重排与本 ADR § 6 一致

### CI 守门（phase 1.3 实装时加）

```yaml
- name: Phase 1.2.5 wedge — 8 支柱 capture verification
  run: |
    bash scripts/ci/verify-8-pillars.sh
    # 验证 GRAY-AREA-1~5 + ASSUMPTIONS 在 docs/ 可达 + grep 8 支柱关键词全 hit
```

### Baseline Tag 升级

`adr-0006-accepted` 加入 A7 守恒 baseline tag iterate 列表（**6 个 baseline tag** = adr-0001 / 0002 / 0003 / 0004 / 0005 / 0006）；CI A7 step iterate 全部 6 tag。

## Quick Reference Snapshot (Self-Contained — 减少未来 cross-ref fragility)

> 此节为 ADR self-containment 加固（M3 sister review fix）— 长期未来 reader 只读本 ADR 即可拿到关键数据点，不依赖 GRAY-AREA 文件存活。

**双层架构**: Base (10 manifest + 3 workflow phase 1.1-1.2 已 ship) + Extension (6 category × M 候选 phase 1.3+ 加)

**6 大 category**:
- **meta** — skill-creator (anthropics) + find-skills (vercel-labs)
- **engineering** — gstack + GSD + superpower + planning-with-files + mattpocock(18) + karpathy + ralph-loop
- **design** — ui-ux-pro-max (midwayjs/midway/.codex) + frontend-design (anthropics)
- **content** — pptx + docx + xlsx + pdf (anthropics) + baoyu-skills(21 — license None warn)
- **testing** — webapp-testing + playwright-cli + @playwright/test + chrome-devtools-mcp
- **search** — tavily-mcp (default) + exa-mcp-server (描述式/学术/批量/token 敏感)

**6+ gstack 虚拟角色 + 强制级别**:
- 🔒 强制: `/office-hours` + `/plan-ceo-review` (新功能启动) / `/review` (关键模块 PR 前)
- ⚠️ 复杂架构: `/plan-eng-review`
- ⭐ 可选: `/design-review` / `/qa` / `/cso` / `/investigate` / `/ship` / `/retro`

**4 心法 (always-on)**: Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven Execution

**23 招式 5 phase 归类 (mattpocock — v0.1 catalog 18 active)**:
- Discuss: `/grill-with-docs` · `/grill-me` · `/to-prd`
- Plan: `/to-issues` · `/zoom-out`
- Execute: `/tdd` · `/diagnose` · `/zoom-out` · `/prototype` · `/triage`
- 维护: `/improve-codebase-architecture` · `/setup-pre-commit` · `/setup-matt-pocock-skills` · `/git-guardrails-claude-code`
- Token-省: `/caveman` · `/handoff`
- meta-skill (兼): `/write-a-skill`
- 一次性: `/migrate-to-shoehorn` · `/scaffold-exercises`
- 排除: deprecated 4 (design-an-interface / qa / request-refactor-plan / ubiquitous-language) + personal 2 + in-progress 3

**5 项 mandatory curate criteria (v0.1)**:
1. license OSI approved
2. stars ≥ 100 (OR ≥50 + 3mo active)
3. last commit ≤ 6 months
4. has SKILL.md OR plugin.json
5. owner Org OR ≥2 active contributors

**3 红旗 (RESEARCH-1 § 5.3)**:
- 🔴 P0: subagent 不能嵌套 — phase 1.4 routing engine **必须** main-process-driven (已 lock D1.2.5-3)
- 🟡 P1: `/reload-plugins` skill bug — install 后 fresh subagent invoke 验证 fallback
- 🟡 P1: subagent final message summarize 风险 — main agent system prompt 强制 verbatim COMPLETE marker

---

## References

### 内部依据

- `.planning/phase-1.2.5/KICKOFF.md` (8 支柱 acceptance bar + 5 P0 + 4 wave 分解)
- `.planning/phase-1.2.5/RESEARCH-1-routing-engine.md` (450L HIGH conf — F33 实证 subagent reload 不可行)
- `.planning/phase-1.2.5/RESEARCH-2-skill-ecosystem.md` (700L HIGH conf — 6 类 + 23 mattpocock + jimliu license / ui-ux-pro-max)
- `.planning/phase-1.2.5/ASSUMPTIONS.md` (8 支柱 + 5 P0 lock + D1.2.5-1~12 决策追溯)
- `.planning/phase-1.2.5/GRAY-AREA-1-routing-engine.md` (main-process-driven schema + decision_rules.yaml v1 + 6 category × 12 rules + A7' superpower triggers)
- `.planning/phase-1.2.5/GRAY-AREA-2-gstack-roles.md` (A1' + A2' capture)
- `.planning/phase-1.2.5/GRAY-AREA-3-mattpocock-phase-routing.md` (A5' + A6' capture)
- `.planning/phase-1.2.5/GRAY-AREA-4-karpathy-enforcement.md` (A4' capture + § 3.1 a-revised)
- `.planning/phase-1.2.5/GRAY-AREA-5-curate-criteria.md` (A8' 后半 — v0.1 5 项 + v0.4+ checklist + OSSF subset)
- `docs/adr/0001-manifest-schema-v1.md` (manifest schema base — 不动)
- `docs/adr/0005-marketplace-source-schema-errata.md` (categorization schema 前奏)
- 用户笔记: `我的 Claude Code 开发方案（gstack + GSD + Superpowers 三层栈式组合，结合 Planning with Files、andrej-karpathy-skills、Ralph Loop 等顶级技能）.md`
- CLAUDE.md (`C:\Users\easyi\.claude\CLAUDE.md`)
- 用户硬要求："必须在整体上保证笔记里角色主要职责和核心理念的 100% 实现"

### 外部参考

- CC AgentDefinition + skills/prompt 注入: https://code.claude.com/docs/en/agent-sdk/subagents
- CC subagent 不能嵌套: https://code.claude.com/docs/en/agent-sdk/subagents (官方 Note)
- `/reload-plugins` skill bug: https://github.com/anthropics/claude-code/issues/35641
- LangGraph Supervisor pattern: https://blog.langchain.com/langgraph-multi-agent-workflows/
- Semantic Router: https://github.com/aurelio-labs/semantic-router
- DMN Priority Hit Policy: https://docs.camunda.io/docs/components/modeler/dmn/decision-table-hit-policy/
- Avelino et al. 2016 OSS bus factor: https://arxiv.org/abs/1605.07922
- skills.sh leaderboard: https://skills.sh/
- Anthropic plugin directory: https://clau.de/plugin-directory-submission
