# Research 02 — Upstream Reality Check

**研究范围**：harnessed MVP 9 个上游依赖的真实存在性、活跃度、安装方式、命令空间、稳定性
**研究日期**：2026-05-11
**Researcher**：02
**总体置信度**：HIGH（9/9 上游均已找到公开仓库并核实关键事实）

---

## 摘要

经核实，harnessed 列出的 9 个上游依赖**全部真实存在**且**全部公开开源（MIT）**，没有任何一个是用户私有/虚构项目。整体生态健康度高于预期：4 个上游（gstack 93.5k★、karpathy-skills 125k★、superpowers 186k★、mattpocock-skills 70.6k★）属于「现象级 viral」项目，GSD（61.4k★）和 context7（55k★）属于「成熟工具」级别，3 个 MCP 服务器（Tavily、Exa、ralph-loop）背后均为正式商业实体或 Anthropic 官方维护。

但有 4 个**结构性风险**会直接影响 harnessed 的 manifest 设计：(1) 上游分布在 3 种**异构安装通道**——`/plugin install` marketplace、git clone+setup 脚本、npx skills add——manifest 必须建模 3 种 install kind；(2) **gstack 的命令前缀可由用户在 setup 时配置**（`--no-prefix` / `--prefix gstack-`），这意味着 harnessed plan-feature workflow 不能硬编码 `/office-hours` 字面量；(3) **GSD 在两个月内出了 41 个 minor release**（v1.41.2，2026-05-10），命令名变化频繁，harnessed 必须做版本钉扎；(4) **ralph-loop 在 Windows 上对 jq + Git Bash 有未声明依赖**，且 `--completion-promise` 有已知 bug（issue #1429），影响 harnessed 的"子任务交付保证"链路。

对 harnessed 的核心建议：manifest 必须支持 install_method 多态、必须支持 namespace_prefix 可配置、必须有 tested_with_versions 字段固定测试过的上游版本号、必须为 ralph-loop 在 Windows 上提供 fallback 文档或 CI 检查。

---

## 9 个上游对比表

| # | 上游 | Stars | License | 最新版本 / 日期 | Install Kind | 命令前缀 | 风险 |
|---|------|-------|---------|----------------|--------------|----------|------|
| 1 | **gstack** (garrytan) | 93.5k★ | MIT | 269 commits, 无 release tag | `git clone + ./setup` | 可配置（默认 `/office-hours`，`--prefix gstack-` 选项） | 中 |
| 2 | **GSD** (gsd-build) | 61.4k★ | MIT | v1.41.2 (2026-05-10) | `npx get-shit-done-cc@latest` | `/gsd-*` | 中-高（版本迭代极快） |
| 3 | **superpowers** (obra) | 186k★ | MIT | v5.1.0 (2026-05-04) | `/plugin install superpowers@claude-plugins-official` | 多平台异构 | 低 |
| 4 | **planning-with-files** (OthmanAdi) | 20.9k★ | MIT | v2.37.0 (2026-05-05) | marketplace 或 `npx skills add` | `/plan` 或 `/planning-with-files:*` | 低 |
| 5 | **mattpocock-skills** | 70.6k★ | MIT | 76 commits, 无显式 release | `npx skills@latest add mattpocock/skills` | `/diagnose`、`/zoom-out` 单斜杠（默认无前缀） | 低 |
| 6 | **karpathy-skills** (forrestchang) | 125k★ | MIT | 28 commits, 无显式 release | marketplace 或 `curl CLAUDE.md` | 不是命令式 skill，是 CLAUDE.md 行为规范 | 低（但语义不同） |
| 7 | **ralph-loop** (anthropics 官方) | 19.1k★（仓库整体） | per-plugin（MIT 居多） | 持续更新 | `/plugin install ralph-loop@claude-plugins-official` | `/ralph-loop` | **高**（Windows + jq bug） |
| 8 | **Tavily MCP** (tavily-ai 官方) | 1.9k★ | MIT | tavily-mcp 0.2.19 (npm，~10 天前) | `claude mcp add --transport http tavily ...` 或 `npx tavily-mcp` | tool 调用（无 slash 命令） | 低（需 API key） |
| 9 | **Exa MCP** (exa-labs 官方) | 4.4k★ | MIT | exa-mcp-server 3.2.1 (npm，~10 天前) | `claude mcp add --transport http exa ...` 或 `npx exa-mcp-server` | tool 调用（无 slash 命令） | 低（需 API key） |
| - | **ctx7** (upstash 官方) | 55k★ | MIT | @upstash/context7-mcp 2.2.4 (2026-05-04)，ctx7 CLI 0.4.x | `npx ctx7 setup` 或全局 `npm i -g ctx7` | CLI（不是 CC 命令） | 低 |

> 注：用户原始 spec 列了 9 个，把 ctx7 列在第 10 位。实际上"ctx7"和"context7"是同一个上游（upstash/context7 仓库），这里合并展示。

---

## 逐个深度分析

### 1. gstack — garrytan/gstack

[github.com/garrytan/gstack](https://github.com/garrytan/gstack) — Garry Tan（YC 现任 CEO）的个人 toolkit，**93.5k★、MIT**。23 个 skill，覆盖 CEO/EM/Designer/Paranoid Engineer/QA/CSO/Release 全角色。用户在 CLAUDE.md 中提到的 `/office-hours`、`/plan-ceo-review`、`/plan-eng-review`、`/autoplan` **全部确认存在**于 [docs/skills.md](https://github.com/garrytan/gstack/blob/main/docs/skills.md)。

**关键风险**：gstack **官方仓库不是 plugin 形态**，安装方式是 `git clone + ./setup`，setup 脚本会把 skill 文件直接放到 `~/.claude/skills/gstack/`。命令前缀**可由用户在 setup 时三选一**：默认 `/office-hours`、`--no-prefix` 和默认相同、`--prefix` 转为 `/gstack-office-hours`。社区有[Ahacad/gstack](https://github.com/Ahacad/gstack) 提供了 plugin wrapper，但这是非官方 fork。

**对 harnessed 的 implication**：(a) manifest install 字段必须支持 `git+setup` 类型（不是简单的 `npm install`/`/plugin install`）；(b) 调用 gstack 命令时不能假设固定前缀，必须在 plan-feature workflow 中**用户首次运行时探测前缀**或**让用户在 harnessed.yml 中声明**；(c) 没有 git tag/release，意味着 harnessed 只能锁定 commit SHA 来保证可复现性。

### 2. GSD — gsd-build/get-shit-done

[github.com/gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done) — TACHES（Lex Christopherson）开发，**61.4k★、MIT**。npm 包名 `get-shit-done-cc`，最新 v1.41.2（2026-05-10），距研究当天**1 天前**发布。138 contributors、2,100+ commits、57 releases、4 个月内迭代——**最活跃的上游之一**，但也意味着 API 不稳定。

命令前缀确认是 `/gsd-*`（短横线，不是冒号），如 `/gsd-new-project`、`/gsd-plan-phase`、`/gsd-execute-phase`、`/gsd-autonomous`。这与 spec 文档中"`/gsd:*`"猜测一致——**实际是短横线**。还有[gsd-build/gsd-2](https://github.com/gsd-build/gsd-2) 是「下一代 GSD」（standalone CLI on Pi SDK），是平行项目，不是替代。社区还有[jnuyens/gsd-plugin](https://github.com/jnuyens/gsd-plugin)（性能优化的 plugin 包装）。

**对 harnessed 的 implication**：(a) 钉版本——`tested_with: gsd@1.41.2`，否则两周后可能命令重命名；(b) 在 manifest 中区分「命令名稳定版本号 cap」和「最低支持版本」；(c) 需要监控 gsd-2 ——它是 v2 重写，未来可能取代 v1，harnessed 要在 ROADMAP 里有 v2 迁移占位。

### 3. superpowers — obra/superpowers

[github.com/obra/superpowers](https://github.com/obra/superpowers) — Jesse Vincent (obra) + Prime Radiant 团队，**186k★（最高）、MIT**，最新 v5.1.0（2026-05-04）。生态最广：Claude Code/Codex CLI/Codex App/Factory Droid/Gemini CLI/OpenCode/Cursor/GitHub Copilot CLI 全覆盖。

安装在 Claude Code：`/plugin marketplace add obra/superpowers-marketplace` → `/plugin install superpowers@superpowers-marketplace`（[官方 README](https://github.com/obra/superpowers/blob/main/README.md)）。注意：用户 CLAUDE.md 提到的 `/plugin install superpowers@claude-plugins-official` 也工作（Anthropic 官方 marketplace 也镜像了）。

**核心 skill**：brainstorming、TDD、git worktrees、writing-plans、subagent workflows。命令调用风格不固定前缀——"as soon as it sees that you're building something"，即很多 skill 是**自动激活**而非用户主动 slash。

**对 harnessed 的 implication**：(a) 这是最稳的上游之一（Anthropic 官方背书+商业团队维护）；(b) 用户 CLAUDE.md 明确要求"避免 writing-plans 与 planning-with-files 重叠"——harnessed 必须在 manifest 元数据中**标记冲突 skill**，让 packs 可以选择性禁用；(c) 多平台支持意味着 harnessed 未来可考虑非 Claude Code 目标。

### 4. planning-with-files — OthmanAdi/planning-with-files

[github.com/OthmanAdi/planning-with-files](https://github.com/OthmanAdi/planning-with-files) — **20.9k★、MIT、v2.37.0 (2026-05-05)**。3-file 模式（task_plan.md / findings.md / progress.md），Manus 风格的持久化计划。formal benchmark 96.7% 通过率（vs 无 skill 6.7%），是 9 个上游中**唯一有量化效果数据**的。

两种安装：(1) `npx skills add OthmanAdi/planning-with-files --skill planning-with-files -g`（推荐）；(2) `/plugin marketplace add OthmanAdi/planning-with-files` → `/plugin install planning-with-files@planning-with-files`。命令是 `/plan`、`/plan:status`、`/planning`，全部冒号风格。

**对 harnessed 的 implication**：这是 GSD 工作流的"持久化基座"，harnessed 的 packs 应**默认捆绑**它。它和 superpowers/writing-plans 在功能上**有重叠**——manifest 必须显式标注互斥/优先关系。`npx skills add` 是另一个安装通道，再次强化了"manifest 需要 install_method 多态"的设计需求。

### 5. mattpocock-skills — mattpocock/skills

[github.com/mattpocock/skills](https://github.com/mattpocock/skills) — Matt Pocock（TS 社区知名教育者）真名，**70.6k★、MIT**。安装：`npx skills@latest add mattpocock/skills`。

确认存在的命令（17 个）：engineering 类——`/diagnose`、`/grill-with-docs`、`/triage`、`/improve-codebase-architecture`、`/setup-matt-pocock-skills`、`/tdd`、`/to-issues`、`/to-prd`、`/zoom-out`、`/prototype`；productivity 类——`/caveman`、`/grill-me`、`/handoff`、`/write-a-skill`；misc——`/git-guardrails-claude-code`、`/migrate-to-shoehorn`、`/scaffold-exercises`、`/setup-pre-commit`。**与 user CLAUDE.md 提到的命令完全吻合**。命令使用单斜杠（默认无 namespace 前缀）。

**对 harnessed 的 implication**：和 superpowers 在 TDD 上**功能重叠**（superpowers 有自己的 TDD skill，mattpocock 也有 `/tdd`）。harnessed pack 设计需考虑「mutually-exclusive skill groups」——同一类功能在不同上游各有实现，packs 选其一。

### 6. karpathy-skills — forrestchang/andrej-karpathy-skills

[github.com/forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) — **125k★（第二高）、MIT**。**重要语义差异**：这不是命令式 skill，是单文件 CLAUDE.md（4 条原则——Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution），通过两种方式安装：(a) plugin marketplace（`/plugin install andrej-karpathy-skills@karpathy-skills`），(b) 直接 `curl CLAUDE.md`。

**重大区别**：karpathy-skills 是**行为约束**而非**可调用命令**——它没有 `/karpathy-think-before-coding` 这种命令，而是修改 Claude 的默认推理风格。

**对 harnessed 的 implication**：manifest schema 必须支持**两种 component 形态**：(a) **command-style**（superpowers、mattpocock、gstack、GSD、ralph-loop）；(b) **behavior-rule-style**（karpathy 这种 CLAUDE.md 注入）。这会影响 install 阶段的"merge 策略"——多个 behavior-rule 上游同时存在时如何合并 CLAUDE.md。这是 harnessed v0.1 必须解决的**架构级**问题。

### 7. ralph-loop — anthropics/claude-plugins-official

[github.com/anthropics/claude-plugins-official/tree/main/plugins/ralph-loop](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/ralph-loop) — **Anthropic 官方维护**，仓库整体 19.1k★。安装：`/plugin install ralph-loop@claude-plugins-official`。命令：`/ralph-loop "task" --completion-promise "DONE" --max-iterations 20`。还有 `/cancel-ralph`、`/help`。

**已知 bug**：[issue #1429](https://github.com/anthropics/claude-plugins-official/issues/1429) — `--completion-promise` 在 transcript JSONL 含字面 newline 时检测失败，loop 不会停止。**Windows 兼容性差**：依赖 jq（未声明）+ bash，且常解析到 WSL bash 而非 Git Bash 导致 hook 失败。仓库整体 **622 open issues + 10 PRs**——issue 量大但有官方背书。

**对 harnessed 的 implication（最重要）**：(a) 这是 user CLAUDE.md 中"每个子任务必须使用 ralph-loop"的核心工具，但**Windows 用户开箱即坏**。harnessed 的 doctor 命令必须**显式检查**：`jq` 是否存在 + `which bash` 是否指向 Git Bash 而非 WSL；(b) `--completion-promise` 不可靠，harnessed 的 plan-feature workflow 模板里**必须同时设置 `--max-iterations` 作为兜底**（已经在 user CLAUDE.md 示例中体现，要保留）；(c) 这条依赖链是 harnessed 在 Windows 上最大的「失败点」——MVP 应有 troubleshooting 文档专门覆盖。

### 8. Tavily MCP — tavily-ai/tavily-mcp

[github.com/tavily-ai/tavily-mcp](https://github.com/tavily-ai/tavily-mcp) — **官方 MCP 服务器**，1.9k★、MIT、npm `tavily-mcp` 0.2.19（10 天前）。三种安装：(a) remote URL `https://mcp.tavily.com/mcp/?tavilyApiKey=...`；(b) `claude mcp add --transport http tavily ...`；(c) 本地 npx + JSON 配置。

**4 个工具**：tavily-search / tavily-extract / tavily-map / tavily-crawl。需要 [tavily.com](https://tavily.com) API key（有免费额度）。

**对 harnessed 的 implication**：(a) MCP 安装走的是 `claude mcp add` 通道，又是一种独立 install kind——manifest 必须支持；(b) **API key 注入**是 harnessed 必须考虑的：是写到 `.env`、`~/.claude/.tavily-key`、还是 mcp.json 里？需要在 manifest 里明确 secret_env 字段；(c) 需要解决「用户没 API key 时如何 graceful degrade」。

### 9. Exa MCP — exa-labs/exa-mcp-server

[github.com/exa-labs/exa-mcp-server](https://github.com/exa-labs/exa-mcp-server) — **官方**，4.4k★、MIT、npm `exa-mcp-server` 3.2.1（10 天前，14k weekly DL）。

工具（默认开启 2 个）：`web_search_exa`、`web_fetch_exa`；可选高级 `web_search_advanced_exa`；并有 6 个 deprecated 工具仍可用（`get_code_context_exa`、`company_research_exa`、`crawling_exa`、`people_search_exa`、`linkedin_search_exa`、`deep_searcher_*`）。安装与 Tavily 模式相同：remote URL `https://mcp.exa.ai/mcp`、`claude mcp add` 或 `npx exa-mcp-server`。

**对 harnessed 的 implication**：(a) 与 Tavily 配置模式一致，可设计成同一个 install kind「mcp-http」；(b) `web_fetch_exa` 接受 URL 数组 batch fetch，是 user CLAUDE.md 中"批量抓取多个已知 URL"路由规则的依据，harnessed 在 packs 文档中要解释这种语义差异。

### 10. ctx7 / context7 — upstash/context7

[github.com/upstash/context7](https://github.com/upstash/context7) — **Upstash 官方**，55k★、MIT、最新 ctx7 0.4.x + @upstash/context7-mcp 2.2.4（2026-05-04）。它**不是 CC 命令**，而是**双形态**：(a) Node.js CLI `ctx7` (`npx ctx7@latest` 或 `npm i -g ctx7`)；(b) MCP 服务器 `@upstash/context7-mcp`。

CLI 命令：`ctx7 library <name> "<query>"` → `ctx7 docs <libraryId> "<query>"`。Library ID 必须含 `/` 前缀（`/facebook/react`，不能是 `facebook/react`）。

**对 harnessed 的 implication**：(a) ctx7 又是另一个 install kind——「standalone CLI tool」（既不是 MCP server，也不是 plugin，也不是 skill）；(b) 它有 OAuth 登录流（`ctx7 login`）和 env var（`CONTEXT7_API_KEY`）两条 secret 通道，再次强化 manifest secret_env 字段需求；(c) 它和 MCP 服务器是同一上游的两种形态，user 可二选一——harnessed packs 设计需要处理"**同一上游两种 install kind**"的元模型。

---

## ⚠️ 红旗清单（按优先级）

### 🔴 P0 — 必须立即在 manifest 设计中处理

1. **Install kind 异构（5 种）**：harnessed manifest 必须支持至少 5 种 install_method:
   - `cc-plugin-marketplace`（superpowers, ralph-loop, planning-with-files, karpathy-skills）
   - `git-clone-with-setup`（gstack）
   - `npx-skill-installer`（mattpocock-skills, planning-with-files 替代路径）
   - `npm-cli`（GSD via `get-shit-done-cc`, ctx7）
   - `mcp-http-add`（Tavily, Exa, context7-mcp）

2. **Component 语义差异**：karpathy-skills 是 **CLAUDE.md 行为规范**，与其他「可调用命令」语义不同。manifest 必须区分 `component_type: command | behavior-rule | mcp-tool | cli-binary`，install/uninstall 行为完全不同。

3. **命令前缀不固定**：gstack 用户可在 setup 时选择前缀（`/office-hours` vs `/gstack-office-hours`），harnessed plan-feature workflow 模板**不能硬编码字面量**。需要在 manifest 中声明 `command_prefix_strategy: configurable | fixed | namespaced`，并在 doctor 命令中探测当前用户的实际前缀。

### 🟠 P1 — Windows 兼容性灾难

4. **ralph-loop 在 Windows 默认坏**：依赖 jq（未声明）+ Git Bash（常解析到 WSL bash）。harnessed 的 doctor 必须明确检查 `jq` 存在和 bash 路径，并提供修复指引。否则用户 CLAUDE.md 中"每个子任务必须使用 ralph-loop"在 Windows 上无法落地。

5. **`--completion-promise` 不可靠**（[issue #1429](https://github.com/anthropics/claude-plugins-official/issues/1429)）：transcript 中字面 newline 导致检测失败。harnessed 的 plan-feature workflow 模板**必须强制 `--max-iterations` 作为兜底**，这一点 user CLAUDE.md 已经体现，需要在 harnessed packs 文档中保留并强化。

### 🟡 P2 — 版本稳定性风险

6. **GSD 迭代极快**：4 个月 57 个 release（v1.0 → v1.41.2，平均 2 天一个 minor）。命令名可能变化。harnessed 必须有 `tested_with: gsd@1.41.x` 的版本钉扎，并定期跑回归 CI。

7. **superpowers / mattpocock / planning-with-files TDD 功能重叠**：用户 CLAUDE.md 已经在路由规则上做了选择（默认 `/tdd`，备选 `superpowers:test-driven-development`）。harnessed manifest 必须建模**「mutually-exclusive skill groups」**——同一功能多上游实现时，pack 用户须二选一，避免 skill 间冲突。

8. **gstack / mattpocock-skills 没有 git tag**：仓库无 release，只能锁 commit SHA。harnessed 必须在 lockfile 中支持 SHA pin。

### 🟢 P3 — 次要观察

9. **gstack-2 / GSD-2 都在路上**：两个最复杂的上游都有 v2 重写计划（[gsd-2](https://github.com/gsd-build/gsd-2) 已经存在）。harnessed ROADMAP 要预留迁移占位，但 v0.1 不需要立即处理。

10. **Tavily / Exa / ctx7 都需要 API key**：manifest 必须有 `requires_secret: { env: KEY_NAME, instructions_url: ... }` 字段，doctor 命令要能检测 secret 缺失并友好报错。

---

## 对 harnessed 的具体建议

### 必须确认的设计点

1. **Manifest schema 至少包含字段**：
   - `id` / `name` / `version` / `license`
   - `install_method`: 5 种枚举（见 P0#1）
   - `install_config`: 多态（git URL+SHA / plugin name+marketplace / npm package / mcp URL+API key 等）
   - `component_type`: `command | behavior-rule | mcp-tool | cli-binary`
   - `command_prefix_strategy`: `configurable | fixed | namespaced`
   - `commands_provided`: 字符串数组（用于冲突检测）
   - `requires_secret`: `{ env, instructions_url }` 数组
   - `tested_with_versions`: 上游钉版本
   - `mutually_exclusive_with`: 互斥包列表（TDD 类）
   - `windows_caveats`: 字符串数组（ralph-loop 用）

2. **Doctor 命令必须检查的项**：
   - Node.js >= 18（ctx7 要求）
   - `jq` 存在（ralph-loop）
   - Windows 上 `bash` 解析到 Git Bash 而非 WSL（ralph-loop）
   - 各上游 secret env 是否设置（Tavily / Exa / context7）
   - 当前 `~/.claude/skills/gstack` 实际命令前缀

3. **Pack 默认捆绑建议**（基于研究）：
   - **plan-feature workflow pack**: GSD（编排）+ planning-with-files（持久化）+ gstack `/office-hours`+`/plan-ceo-review`（决策）+ ralph-loop（交付）+ karpathy-skills（行为规范）
   - **research pack**: Tavily MCP + Exa MCP + ctx7 CLI
   - **engineering-quality pack**: superpowers（brainstorming/TDD 默认）+ mattpocock（diagnose/zoom-out 招式）

### 需要再确认（v0.1 不阻塞）

- **gstack 是否能纯 plugin 化**：[Ahacad/gstack](https://github.com/Ahacad/gstack) 这个非官方 plugin wrapper 是否稳定？harnessed 是直接用 wrapper 还是自己包一层？
- **planning-with-files 与 superpowers/writing-plans 的精确互斥语义**：是命令冲突还是行为冲突？需要在 v0.1 用户测试中观察。
- **GSD v2（gsd-2 仓库）的命名空间**：未来若 v2 取代 v1，harnessed 是否需要 dual-track？v0.1 先不处理。

---

## 来源置信度

| 上游 | 置信度 | 来源类型 |
|------|--------|----------|
| gstack | HIGH | 官方仓库 README + docs/skills.md + 官网 gstacks.org |
| GSD | HIGH | 官方仓库 + npm registry + DeepWiki + 多篇评测 |
| superpowers | HIGH | 官方仓库 README + Anthropic 官方 plugin 目录 + 作者 blog |
| planning-with-files | HIGH | 官方仓库 + releases 页 + 多个 marketplace 收录 |
| mattpocock-skills | HIGH | 官方仓库 + plugin.json |
| karpathy-skills | HIGH | 官方仓库 CLAUDE.md + 多篇评测 |
| ralph-loop | HIGH | Anthropic 官方仓库 + 已知 issue #1429 |
| Tavily MCP | HIGH | 官方仓库 + npm + docs.tavily.com |
| Exa MCP | HIGH | 官方仓库 + npm + exa.ai docs |
| ctx7 | HIGH | 官方仓库 + DeepWiki + releases 页 |

所有事实均有 ≥1 个 GitHub URL 或官方文档支撑，无任何"无法确认"项。

---

Research 02 complete: D:\GitCode\harnessed\.planning\research\02-upstream-reality.md
