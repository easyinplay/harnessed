# Phase 1.2.5 ASSUMPTIONS — 8 支柱 + 5 P0 决策 Locked

> **目的**: phase 1.2.5 architecture revision discuss-phase 的 SSOT lock 文档
> **状态**: ✅ 8 支柱 100% capture + 5 P0 全 locked (基于 R1 + R2 调研 + 用户笔记 + CLAUDE.md)
> **依据**: KICKOFF.md A1'-A8' 硬 acceptance bar + 用户硬要求"100% 实现核心理念"

---

## § A. 8 支柱 Capture 总览（A1'-A8'）

| 支柱 | 内容 | Capture 文档 | 状态 |
|---|---|---|---|
| **A1'** | gstack 6+ 虚拟角色矩阵 + trigger + sanity check | `GRAY-AREA-2-gstack-roles.md` § 2 | ✅ 100% |
| **A2'** | gstack 双职责区分（Strategy vs Governance）| `GRAY-AREA-2-gstack-roles.md` § 1 | ✅ 100% |
| **A3'** | GSD 环境质量层（CI/lockfile/Cross-OS/Corepack）| 本文件 § B (lock) + `GRAY-AREA-1-routing-engine.md` § 5 | ✅ 100% |
| **A4'** | karpathy 心法 4 原则 1:1 enforce | `GRAY-AREA-4-karpathy-enforcement.md` § 2 + § 3 (修订路径见 D1.2.5-9) | ✅ 100% |
| **A5'** | mattpocock **23 招式** phase routing 决策树 | `GRAY-AREA-3-mattpocock-phase-routing.md` § 2 (R2 实证 23 ≠ 16+) | ✅ 100% |
| **A6'** | 心法+招式配对 day-to-day 模式 | `GRAY-AREA-3` § 4 + `GRAY-AREA-4` § 4 | ✅ 100% |
| **A7'** | superpower brainstorming + TDD 触发规则 | `GRAY-AREA-1-routing-engine.md` § 4 (基于 R2 § 4.3 hybrid) | ✅ 100% |
| **A8'** | **6 大 category** × decision rules + curate criteria | `GRAY-AREA-1-routing-engine.md` § 3 + `GRAY-AREA-5-curate-criteria.md` (R2 实证 6 ≠ 4+) | ✅ 100% |

**用户硬要求 "100% 实现核心理念" — 8/8 ✅ 待 Wave D cross-validation 最终 verify。**

---

## § B. A3' GSD 环境质量层 Lock（轻量，不单独 GRAY-AREA）

GSD 项目经理职责（用户笔记原话）：orchestration + **环境质量** + 任务拆分 + 跨 session 稳定 + 状态持久化。

环境质量层 lock 内容（phase 1.1-1.2 已实证基线）：

| 维度 | 基线 | enforcement |
|---|---|---|
| **CI 守恒** | 3 平台 × Node 22；A7 守恒 5 baseline tag iterate | `.github/workflows/ci.yml` 已 ship |
| **Lockfile 一致性** | `pnpm install --frozen-lockfile` | CI step + corepack |
| **Corepack** | `corepack pnpm 10.12.0` 锁定 | `package.json` packageManager 字段 |
| **Cross-OS** | windows-latest / macos-latest / ubuntu-latest 全绿 | matrix CI |
| **工具版本** | Node 22 / pnpm 10.12.0 / biome 2 / vitest 4 锁定 | ADR 0002 |
| **EOL 行尾** | 所有源文件 LF (A8 守恒) | `.gitattributes` + `git ls-files --eol` |
| **A7 守恒** | ADR 0001-0005 main body 不动；本 phase 加 0006 → baseline tag 6 | CI A7 step iterate |

→ routing engine **不直接 enforce 这些**（它们是 GSD orchestration 层）；但 routing engine 在 spawn subagent 时**继承**这些约束（Cross-OS / EOL / 工具版本）。

→ **新加 phase（如 phase 1.3）必须沿袭** — 环境质量层是 phase 间 baseline，不是单 phase 决策。

---

## § C. 5 P0 灰色地带决策 Lock

| ID | 决策 | 选项 lock | 理由（含 R1/R2 引用）|
|---|---|---|---|
| **P0-1** | 决策规则存放位置 | **(a) 独立 `.planning/decision_rules.yaml`** | R1 § 5.1：与 git 版本化 / DMN-style YAML 可校验 / 不污染 CLAUDE.md（CLAUDE.md 给 Claude 读，规则给 routing engine 读）/ schema 模板见 R1 § 4.2 候选 1（DMN Priority Hit Policy） |
| **P0-2** | gstack 治理关卡编码深度 | **(b) 中等深度编码**：编码 *何时触发* 治理 skill，但 *不 vendor* 治理 skill 的 prompt | R1 § 5.2：gstack 是 mattpocock 生态成熟资产，harnessed 不应 vendor（守 wedge 不 vendor 原则）；但 *何时触发* 是 harnessed 核心 routing 逻辑 / phase-level BLOCKING gates 见 `GRAY-AREA-2` § 3.1 |
| **P0-3** | curate criteria | **(c) phase-aware 渐进策略**：v0.1 maintainer 手工 + 5 项 CI mandatory / v0.2-0.3 issue 提议 / v0.4+ community PR + checklist | R2 § 2.3 + § 4.2：5 项 mandatory（OSI license / ≥100 stars / 6mo 活跃 / SKILL.md 存在 / Org 或 ≥2 contributors）轻量门槛起步；v0.4+ 引 OSSF Scorecard subset；详 `GRAY-AREA-5` |
| **P0-4** | workflow 模式库范畴 | **(c) 渐进**：v0.1 docs only（pattern guide）+ 部分 heuristic 立即编码（debug_*.py vs test_*.py 法则 / 测试工具决策树）；v0.2+ 高频模式渐进编码 | 用户笔记里"Python E2E 迁移模式"是 task sequence（不适合单 routing 决策）；"测试工具决策树"已在 `GRAY-AREA-1` testing category 里编码；"debug_*.py vs test_*.py" 简单 heuristic 适合早期编码 |
| **P0-5** | superpower brainstorming + TDD 触发规则 | **(a + b) hybrid**：hard-coded mandatory TDD triggers + heuristic（mattpocock /tdd 内置）+ optional user-decide | R2 § 4.3：mandatory（核心业务/算法/auth/security/SLA≥99.9%）+ heuristic（mattpocock /tdd 自带 vertical slice detection）+ user-decide（避免过度 TDD）；详 `GRAY-AREA-1` § 4 |

---

## § D. 决策追溯表 D1.2.5-1 ~ D1.2.5-12

| 决策 ID | 内容 | 来源 |
|---|---|---|
| **D1.2.5-1** | architecture wedge = "完整三层栈方法论的可执行 engine — 6+ 虚拟角色 / 双职责 / 4 心法 / 23 招式 / 心法-招式配对 / brainstorming-TDD 触发 / 6 category × decision rules" | 用户 3 轮纠偏对话 + KICKOFF |
| **D1.2.5-2** | 双层 architecture：base layer (phase 1.1-1.2 已 ship 的 10 manifest + 3 workflow) + extension layer (6 category × M 候选 + decision rules) | 用户 "base + extension 叠加，不替换" 原话 |
| **D1.2.5-3** | routing engine **必须** main-process-driven（subagent 内 reload 不可行）| R1 § 1 (4 GitHub issues + 4 官方 docs 实证) — F33 |
| **D1.2.5-4** | subagent 隔离仍成立：context 完全隔离 + tool 权限隔离；fs / env 共享主进程；不能 spawn 嵌套 subagent；final message verbatim 回流 | R1 § 3.1 / § 3.3 — 官方 docs 完整 inheritance table |
| **D1.2.5-5** | decision_rules.yaml schema = DMN-style YAML + Priority Hit Policy（v0.1）→ Semantic Router 语义增强（v0.2+）| R1 § 4.2 候选方案对比 — DMN 关键词匹配 0ms / Semantic Router 5-30ms |
| **D1.2.5-6** | 6 大 category（不是 4+）= meta + engineering + design + content + testing + search | R2 § 1 + § 4.1 实证 |
| **D1.2.5-7** | mattpocock **23** skills（不是预测的 16+）= 10 engineering + 4 productivity + 4 misc + 4 deprecated + 3 in-progress + 2 personal | R2 § 3.1 GitHub API 实证 |
| **D1.2.5-8** | gstack 6+ 虚拟角色 = CEO / EM / Designer / Paranoid Staff Engineer / QA / CSO + 扩展（Investigator / 发布工程师 / 复盘官） | 用户笔记 § "gstack 介入节点速查表" + GRAY-AREA-2 |
| **D1.2.5-9** | karpathy 心法 enforcement 路径 = main agent 在 `AgentDefinition` factory 构造 subagent 时 inject 4 原则到 `prompt:` 字段（**修正自 GRAY-AREA-4 原 § 3.1 候选 (a) "subagent.start() inject"**）| F33 实证后修订 — R1 § 1.4 alternative 设计图 |
| **D1.2.5-10** | jimliu/baoyu-skills license: None — v0.1 标 `pending_license` warn 状态收录 + advisory；v0.2 联系 maintainer 加 LICENSE | R2 § 2.2 实测 + § 4.4 风险 |
| **D1.2.5-11** | ui-ux-pro-max install path 待 v0.1 实测 — phase 1.3 必须 verify `npx skills@latest add midwayjs/midway` 是否能定位到 `.codex/skills/`；如不能则 harnessed 提供 install adapter（git-clone + 子目录拷贝 + symlink）| R2 § 1.2 + § 4.4 风险 |
| **D1.2.5-12** | manifest schema 加 `install_type: skill \| mcp \| npm \| git` 字段 — 区分 skill / MCP server / npm / git 4 种安装路径（chrome-devtools-mcp 是 MCP 不是 skill）| R2 § 4.4 风险 5 / 参考 anthropics/claude-plugins-official `mcpServers` 字段惯例 |

---

## § E. ROADMAP 顺序调整（影响 phase 1.3+）

基于 D1.2.5-3 (routing engine 必须 main-process-driven) + D1.2.5-6 (6 category) + D1.2.5-12 (manifest schema 加 install_type 字段) lock：

| Phase | 原 ROADMAP | 新 ROADMAP（重排）|
|---|---|---|
| **1.3** | DAG resolver + harnessed-router 引擎 + setup 完整版 | **base profile + categorization schema + decision_rules.yaml v1**（新 ADR 0007 errata：manifest schema 加 `category` + `decision_rules` + `install_type` 字段；A7 守恒不动 0001）+ ADR 0006 wedge 重定位 ship + base profile install command (`harnessed install --base`) + ui-ux-pro-max install path 实测（D1.2.5-11）|
| **1.4** | research workflow 端到端 + routing/search.md SSOT | **routing engine v1 实装** — main-process-driven + DMN-style YAML + AgentDefinition factory + 6 category × decision rules MVP + research workflow 沿用其中 search category routing |
| **1.5** | (原本是 v0.2.0 起点) | **新加 phase 1.5**：DAG resolver + Semantic Router 语义增强（升级 routing engine v2）+ 高频 workflow 模式编码（D1.2.5-4 P0-4）|
| **2.x** | 后移调整 | execute-task workflow + ralph-loop 完整集成 + plan-feature workflow + checkpoint engine（v0.2+ 范围）|

---

## § F. Wave D Cross-validation 验收点（D 阶段用）

Wave D sister CC review 检查清单：

- [ ] 8 支柱 capture 100% — 每条按 progress.md § C 表格 grep 验证
- [ ] 5 P0 决策 lock 有据 — 引用 R1/R2 章节
- [ ] D1.2.5-1 ~ D1.2.5-12 决策追溯完整
- [ ] PROJECT-SPEC v3.0 / ADR 0006 / ROADMAP 修订与本 ASSUMPTIONS 一致
- [ ] 修订 GRAY-AREA-2/3/4 enforcement 路径与 D1.2.5-9 一致

---

## § G. References

- `RESEARCH-1-routing-engine.md` (450L HIGH confidence)
- `RESEARCH-2-skill-ecosystem.md` (700L HIGH confidence)
- `KICKOFF.md` § Acceptance Bar
- `GRAY-AREA-2-gstack-roles.md` (A1' + A2' capture)
- `GRAY-AREA-3-mattpocock-phase-routing.md` (A5' + A6' capture)
- `GRAY-AREA-4-karpathy-enforcement.md` (A4' capture)
- 用户笔记 § "核心原则与角色定位"
- CLAUDE.md
- 用户原话："必须在整体上保证笔记里角色主要职责和核心理念的 100% 实现"
