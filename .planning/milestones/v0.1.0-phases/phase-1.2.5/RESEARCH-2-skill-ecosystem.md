# RESEARCH-2: 4+ Category Skill 生态调研

> 调研日期：2026-05-12
> 调研者：gsd-project-researcher
> 目的：为 phase 1.2.5 architecture revision 提供 8 支柱 A8' (4+ category) + P0-3 (curate criteria) + P0-5 (superpower 触发规则) 决策依据
> 主要工具：`ctx7 skills search`（context7 skills 索引）+ `gh api`（直接拉 GitHub）+ `WebFetch`（官方 docs）

**TL;DR — 关键发现**

1. **绝大多数候选都真实存在**，且来源高度集中：`anthropics/skills`（官方 5 类核心 skill）、`mattpocock/skills`（招式 23 个，全部已收录）、`ChromeDevTools/chrome-devtools-mcp`（39K ★，Apache-2.0 官方）、`microsoft/playwright-mcp`（32K ★）、`tavily-ai/tavily-mcp`（1.9K ★）、`exa-labs/exa-mcp-server`（4.4K ★）、`jimliu/baoyu-skills`（17.9K ★，21 skill 中文 content pack）。
2. **ui-ux-pro-max 的真实身份与笔记略有偏差**：它是 midwayjs/midway（7.7K ★ Node.js 框架）仓库内置的 `.codex/skills/ui-ux-pro-max/SKILL.md`，**Codex skill**（不是独立的 Claude Code plugin）。功能精确匹配笔记描述（50 styles / 21 palettes / 50 font pairings / 8 stacks / 数据驱动检索式）。**Trust 9.3 / 安装数 <100** — 优秀但小众。
3. **frontend-design 在 anthropics 官方仓库**（双仓双在）：`anthropics/skills/skills/frontend-design/` + `anthropics/claude-code/skills/frontend-design/`，与笔记描述一致（distinctive, production-grade frontend interfaces, avoid generic AI aesthetics）。Trust 8.8 / popularity ★★★★。
4. **mattpocock skills 完整命名空间已确认**：23 个 skill（10 engineering + 4 productivity + 4 misc + 4 deprecated + 3 in-progress + 2 personal），通过 `npx skills@latest add mattpocock/skills` 一行装。phase routing 在 README 内有作者亲自给出的 4 大失败模式 → skill 映射，可直接当 ground truth。
5. **curate criteria 无现成业界标准可直接 copy**：homebrew-core ≥75 stars / OSSF Scorecard 23 项 check 都很重，过 v0.1。**推荐 v0.1 用 5 项轻量门槛**（stars ≥ 100 / 6mo 活跃 / OSI license / non-personal owner / SKILL.md present），**v0.4+ 引 OSSF Scorecard subset + maintainer PR review**。

---

## § 1 4+ Category 真实生态全景

### 1.1 meta-skills

| 候选 | 真实状态 | repo / SKILL.md | install method | Trust / 安装数 | 推荐度 |
|---|---|---|---|---|---|
| **skill-creator** | ✅ 真实，Anthropic 官方 | [`anthropics/skills/skills/skill-creator/SKILL.md`](https://github.com/anthropics/skills/tree/main/skills/skill-creator) | `/plugin marketplace add anthropics/skills` + `/plugin install example-skills@anthropic-agent-skills` | Trust 8.5（ctx7）/ 1000+ installs | **必选 v0.1 base** |
| **find-skills** | ✅ 真实，vercel-labs 官方 | [`vercel-labs/skills/skills/find-skills/SKILL.md`](https://github.com/vercel-labs/skills) | `npx skills@latest add vercel-labs/skills`（skills.sh CLI） | Trust 9.6 / <500 installs | **必选 v0.1 base** |
| **write-a-skill**（mattpocock 备选） | ✅ 真实 | [`mattpocock/skills/skills/productivity/write-a-skill/`](https://github.com/mattpocock/skills/tree/main/skills/productivity/write-a-skill) | `npx skills@latest add mattpocock/skills` | High trust，小众 | 备选（与 skill-creator 重叠） |

**官方文档要点（来自 anthropics/skills/skills/skill-creator/SKILL.md 实际抓取）：**

> Create new skills, modify and improve existing skills, and measure skill performance. **流程**：Decide what skill should do → Write a draft → Create test prompts → Run claude-with-access-to-the-skill → Evaluate quantitatively (eval-viewer/generate_review.py) → Rewrite based on feedback → Repeat → Expand test set → Run skill description improver

**官方文档要点（来自 vercel-labs/skills/skills/find-skills/SKILL.md 实际抓取）：**

> The Skills CLI (`npx skills`) is the package manager for the open agent skills ecosystem.
> Key commands: `npx skills find [query]` / `npx skills add <package>` / `npx skills check` / `npx skills update`
> Browse skills at: https://skills.sh/
> 推荐流程：先 check leaderboard（按 install 数排序）→ 找现成 skill → CLI search

**Decision rules 实例（推荐 schema）：**

```yaml
# manifest.decision_rules
trigger: "user 想创建新 skill"
default: skill-creator
fallback:
  - condition: "skill 已经写好草稿，只想改进 description"
    use: skill-creator (skill description improver mode)

trigger: "user 不知道某个领域有没有现成 skill"
default: find-skills
note: "find-skills 内部会先 check skills.sh leaderboard 再 CLI search"
```

**社区生态观察：**
- Anthropic 自己有 `claude-plugins-official`（19K ★，2026-05-12 still active）作为 Anthropic-managed plugin marketplace，里面 internal plugins 包含 `skill-creator` / `frontend-design` / `feature-dev` / `code-review` / `code-simplifier` / `ralph-loop` / `mcp-server-dev` / `plugin-dev` / `hookify` 等 33+ Anthropic 自家 plugin。**这个仓库本身就是一个 curated marketplace 标杆 — harnessed 可以参考它的目录结构（`/plugins` 内部 + `/external_plugins` 第三方）**。
- skills.sh 是 Vercel Labs 维护的 skill 索引 + 排行榜，`npx skills` CLI 是事实标准入口。

---

### 1.2 design / UI

| 候选 | 真实状态 | 实际位置 | install | 数据 |
|---|---|---|---|---|
| **ui-ux-pro-max** | ✅ 真实，但**藏在 midwayjs/midway 仓库**作为 Codex skill | `https://github.com/midwayjs/midway/blob/main/.codex/skills/ui-ux-pro-max/SKILL.md` | git-clone midwayjs/midway 后 `.codex/skills/ui-ux-pro-max/` 拷出 OR 通过 `npx skills@latest add midwayjs/midway`（**待 verify**） | midwayjs 母仓 7.7K ★（不是为这 skill）/ ui-ux-pro-max ctx7 索引 Trust 9.3 / 安装数 <100 |
| **frontend-design** (anthropics/skills) | ✅ 真实，Anthropic 官方 | `https://github.com/anthropics/skills/tree/main/skills/frontend-design` | `/plugin marketplace add anthropics/skills` + `/plugin install example-skills@anthropic-agent-skills` | Trust 8.8 / popularity ★★★★ |
| **frontend-design** (anthropics/claude-code) | ✅ 真实，**同 skill 在两仓**（claude-code 仓库为 mirror/canonical） | `https://github.com/anthropics/claude-code` | 同上 | Trust 8.8 / popularity ★★ |

**ui-ux-pro-max 实际能力（来自 SKILL.md 实际抓取，midwayjs/midway/.codex/skills/ui-ux-pro-max/SKILL.md）：**

> UI/UX design intelligence. **50 styles, 21 palettes, 50 font pairings, 20 charts, 8 stacks** (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind).
>
> **核心数据驱动**：用户请求时通过 `python3 .shared/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain>` 检索本地 indexed knowledge base
>
> **Search domains 顺序**：1. Product → 2. Style → 3. Typography → 4. Color → 5. Landing → 6. Chart → 7. UX → 8. Stack
>
> **Default stack：html-tailwind**（无指定时）

→ **完美匹配 CLAUDE.md 描述**："数据驱动 / 标准化 / 可解释" — 因为它本质是个 indexed style-knowledge-base + Python search.py。

**frontend-design 实际能力（来自 anthropics/skills/skills/frontend-design/，ctx7 Trust 8.8 描述确认）：**

> Create distinctive, production-grade frontend interfaces with **high design quality**. Use this skill when the user asks to build web components, pages, or applications. Generates **creative, polished code that avoids generic AI aesthetics**.

→ **完美匹配 CLAUDE.md 描述**："layout / 动效 / 装饰细节"，"做出风格"。anti-AI-aesthetic 是它的 explicit pitch。

**Decision rules 实例（推荐 schema，匹配 CLAUDE.md 原话）：**

```yaml
# manifest.decision_rules
trigger: "user 请求 UI/UX 设计 / 前端组件"
default: ui-ux-pro-max
arbitration_rule: "ui-ux-pro-max 出主方案；frontend-design 补 layout / 动效 / 装饰"
conflict_resolution: "ui-ux-pro-max 优先（保证标准化、数据可解释）"
override_signals:
  - phrase: "做出风格" / "独特" / "creative" / "distinctive"
    use: frontend-design (主导)
  - phrase: "实验性" / "experimental"
    use: frontend-design (主导)
combo_default:
  primary: ui-ux-pro-max  # 50 styles / 21 palettes / 50 font pairings 主框架
  secondary: frontend-design  # 装饰 / 微动效 / 独特性
note: |
  schema 含义：subagent 启动时把 ui-ux-pro-max 作为 baseline preset，再让 frontend-design
  补足"独特性"维度。冲突时 ui-ux-pro-max 的标准化覆盖 frontend-design 的创意倾向，
  除非用户 explicit 触发 override_signals。
```

**关键风险（必须告知用户）：**
- ui-ux-pro-max 的安装路径**目前不是标准 Claude Code plugin marketplace 入口**，需要从 midwayjs/midway 仓库的 `.codex/skills/` 子目录手工取出。harnessed v0.1 必须验证 `npx skills@latest add midwayjs/midway` 是否能 install ui-ux-pro-max（context7 索引到了它，但 skills.sh CLI 是否支持 mid-repo skill 路径未知，**需 v0.1 实测**）。
- 它原本是 Codex skill（不是 Claude Code skill），SKILL.md 内部会引用 Codex 特有 tool 名（`Skill` tool / `imagegen` 等）。在 Claude Code runtime 下需要适配（or harnessed wrap 一层 transform）。

---

### 1.3 content creation

| 候选 | 真实状态 | repo | install | 数据 |
|---|---|---|---|---|
| **pptx** (anthropics/skills) | ✅ 真实，Anthropic 官方 | [`anthropics/skills/skills/pptx`](https://github.com/anthropics/skills/tree/main/skills/pptx) | `/plugin marketplace add anthropics/skills` | Trust 9.5 / popularity ★★★★ |
| **docx / xlsx / pdf** (anthropics/skills) | ✅ 真实，同 plugin pack | 同上 | 同上 | 同上（document-skills bundle） |
| **baoyu-skills** | ✅ 真实，活跃 | [`jimliu/baoyu-skills`](https://github.com/jimliu/baoyu-skills) | `npx skills@latest add jimliu/baoyu-skills`（ctx7 / openclaw 兼容） | 17,930 ★ / 2026-05-12 active / TypeScript |
| **slide-gif-creator / theme-factory / web-artifacts-builder / canvas-design / brand-guidelines / algorithmic-art / doc-coauthoring / internal-comms / claude-api / mcp-builder** | ✅ 真实，anthropics/skills 全 catalog | 同 anthropics/skills | 同上 | 全部官方 |

**baoyu-skills 完整 21 skill 清单（来自 GitHub API 实际抓取）：**

```
content (8): baoyu-article-illustrator / baoyu-comic / baoyu-cover-image /
             baoyu-image-cards / baoyu-infographic / baoyu-slide-deck /
             baoyu-xhs-images / baoyu-diagram
AI gen (3): baoyu-image-gen / baoyu-imagine / baoyu-danger-gemini-web
utility (8): baoyu-compress-image / baoyu-format-markdown /
             baoyu-markdown-to-html / baoyu-translate /
             baoyu-url-to-markdown / baoyu-youtube-transcript /
             baoyu-danger-x-to-markdown / baoyu-post-to-x
publish (2): baoyu-post-to-wechat / baoyu-post-to-weibo
```

**baoyu-slide-deck 实际功能（来自实际 SKILL.md 抓取）：**

> Generates professional slide deck images from content. Creates outlines with style instructions, then generates individual slide images. Use when user asks to "create slides", "make a presentation", "generate deck", "slide deck", or "PPT".
> **17 presets** (blueprint / chalkboard / corporate / minimal / sketch-notes / hand-drawn-edu / watercolor / dark-atmospheric / notion / bold-editorial / editorial-infographic / fantasy-animation / intuition-machine / pixel-art / scientific / vector-illustration / vintage)
> 4 dimensions (texture / mood / typography / density)
> **针对中文场景 first-class**（自动检测语言，中文输出）

→ **关键判断**：baoyu-skills 是**面向中文用户内容生产**的 high-quality skill pack，不只是图片生成 — 而是包含整个内容创作流（生成 → 格式化 → 翻译 → 发布到微信/微博/小红书）。harnessed 用户群（中文 AI coding 用户）天然契合。

**Anthropic 官方 pptx 与 baoyu-slide-deck 的差异：**
- `anthropics/skills/pptx` — 专注 .pptx 文件本身（创建 / 修改 / 添加 speaker notes / layout 操作），适合**真正的 PPT 文件级**任务。
- `baoyu-slide-deck` — 生成**幻灯片样式的图片序列**（用于阅读/分享，不用于演讲），最后 merge 成 .pptx 或 .pdf（通过 bun script）。

→ 两者**互补不替代**。harnessed 应同时收录。

**Decision rules 实例：**

```yaml
trigger: "user 想做演讲文档 / .pptx 文件"
use: anthropics/skills/pptx

trigger: "user 想生成可分享的图文 deck（小红书/微博风格）/ 中文场景"
use: baoyu-skills/baoyu-slide-deck

trigger: "user 中文文档 → 微信公众号 / 微博"
use: baoyu-skills/baoyu-post-to-wechat OR baoyu-skills/baoyu-post-to-weibo
```

---

### 1.4 testing（用户笔记 § 测试工具职责矩阵）

| 候选 | 真实状态 | repo | install | 数据 / 注 |
|---|---|---|---|---|
| **playwright-mcp** | ✅ Microsoft 官方 | [`microsoft/playwright-mcp`](https://github.com/microsoft/playwright-mcp) | MCP 协议（`.mcp.json` 注册）/ 通过 `claude-plugins-official/external_plugins/playwright/` plugin install | 32,407 ★ / Apache-2.0 / 2026-05-12 active |
| **playwright-cli** (Microsoft official skill in Codex) | ✅ 真实 | `microsoft/playwright`（Trust High，<500 installs） | 通过 ctx7 skills search 安装 | 笔记描述 "Bash 一行命令操作浏览器" 准确 |
| **@playwright/test** (npm 包，TS) | ✅ 真实，长期 | npm `@playwright/test` | `npm i -D @playwright/test` + `npx playwright install` | 行业标准，无需 ctx7 索引 |
| **webapp-testing** (anthropics) | ✅ 真实，官方 | [`anthropics/skills/skills/webapp-testing`](https://github.com/anthropics/skills/tree/main/skills/webapp-testing) | `/plugin marketplace add anthropics/skills` | Trust 9.9 / popularity ★★★★（顶级） |
| **chrome-devtools-mcp** | ✅ 真实，**ChromeDevTools 团队官方** | [`ChromeDevTools/chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp) | MCP 协议 | **39,338 ★** / Apache-2.0 / 2026-05-12 active — **生态超火** |

**重要观察：**
- `claude-plugins-official/external_plugins/playwright/` 直接收录了 microsoft/playwright-mcp（plugin.json 内部 author 是 "Microsoft"）→ **Anthropic 已官方背书 playwright 这条路径**。
- chrome-devtools-mcp 是 ChromeDevTools 团队官方维护（不是社区 wrap），39K ★ + Apache-2.0 → **业界 SOTA for performance/a11y/Core Web Vitals**。
- `anthropics/skills/skills/webapp-testing` 是 Anthropic 官方推荐的 webapp e2e 模式 — 与笔记的 "Python with_server.py + Tortoise ORM 后端 setup" 描述高度吻合（但需读其 SKILL.md verify Python 实现细节）。

**Decision rules 实例（笔记 § 测试工具职责矩阵的 schema 化）：**

```yaml
trigger: "AI 探查 / 一次性交互调试 / 拿 element ref"
use: playwright-cli (microsoft/playwright skill)
rationale: "Bash 一行命令，token 最省，不入库"

trigger: "端到端功能测试 / TS/JS/React/Vue 项目 / 测试 setup 只需浏览器+HTTP"
use: "@playwright/test"
artifact: "frontend/e2e/*.spec.ts，commit 进 repo"

trigger: "端到端测试 / Python 后端 (Tortoise ORM / pandas / Django) / 测试 setup 需直接调 Python"
use: webapp-testing (anthropics)
artifact: "tests/e2e/*.py + scripts/with_server.py，commit 进 repo"

trigger: "性能 / a11y / 内存泄漏诊断 / Core Web Vitals / LCP / heap snapshot / ARIA"
use: chrome-devtools-mcp
mandatory: "笔记里 explicit '不要用 playwright 系列做这类诊断'"

forbidden_combinations:
  - "playwright-cli 用于性能诊断 → 改 chrome-devtools-mcp"
  - "@playwright/test setup 含 Python 后端调用 → 改 webapp-testing"
```

---

### 1.5 search（用户笔记 § Web 搜索路由规则）

| 候选 | 真实状态 | repo | install | 数据 / 注 |
|---|---|---|---|---|
| **tavily-mcp** | ✅ Tavily 官方 | [`tavily-ai/tavily-mcp`](https://github.com/tavily-ai/tavily-mcp) | MCP 协议 + `TAVILY_API_KEY` env var | 1,954 ★ / MIT / 2026-05-12 active |
| **exa-mcp-server** | ✅ Exa 官方 | [`exa-labs/exa-mcp-server`](https://github.com/exa-labs/exa-mcp-server) | MCP 协议 + `EXA_API_KEY` env var | 4,415 ★ / MIT / 2026-05-12 active |

**两者真实能力对比（来自笔记 + repo descriptions）：**

| 维度 | tavily-mcp | exa-mcp-server |
|---|---|---|
| 类型 | 关键词搜索（传统） | 神经搜索（语义召回） |
| 强项 | 关键词查询、API 文档、新闻、时效 | 描述式查询、学术论文、批量 URL、token 敏感 |
| 工具数 | 多（search / extract / crawl / map / research） | 较少但语义强 |
| 笔记定位 | **默认** | 描述式 / 学术 / 批量 / token 敏感时强制使用 |

**Decision rules 实例（笔记 § Web 搜索路由的 schema 化）：**

```yaml
trigger: "Web 搜索 / 抓页面"
default: tavily-mcp
fallback: exa-mcp-server (description-style queries)

mandatory_exa_signals:
  - "找一篇对比 X 和 Y 的博客 / 找那种调性的内容" (描述式)
  - "学术 / 论文" 关键词
  - 批量抓多个已知 URL (使用 web_fetch_exa urls: [])
  - "深度调研 / 找语义相关内容" 用户 explicit
  - token 敏感工作流（Exa highlights 段落直出）

mandatory_tavily_signals:
  - 整站抓取 / 站点结构 (use crawl/map; Exa 没有对等)
  - 关键词查询 + 时效过滤 (time_range / country / include_domains)

parallel_strategy: "拿不准时两个并行打，对比后选优"
deprecated:
  - brave-search-mcp (API 改为 $5 月度信用额度 + 强制信用卡，已不实用)
```

---

### 1.6 4+ category 完整候选库（v0.1 推荐）

**v0.1 推荐 base layer (must-install)：**

| Category | Skill | Repo | 必选理由 |
|---|---|---|---|
| meta | skill-creator | anthropics/skills | Anthropic 官方，所有 skill 修改/创建/eval 入口 |
| meta | find-skills | vercel-labs/skills | skills.sh CLI 入口，find by description |
| engineering | mattpocock 全家桶 (10 engineering skills) | mattpocock/skills | 完整覆盖 Discuss/Plan/Execute/维护/Token-省 5 phase |
| engineering | superpowers (TDD / brainstorming) | obra/superpowers-skills | TDD 红绿重构标准，brainstorming 子任务设计澄清 |
| engineering | ralph-loop | anthropics/claude-plugins-official/plugins/ralph-loop | 子任务交付保证 |
| engineering | code-review / code-simplifier | anthropics/claude-plugins-official/plugins/ | Anthropic 官方 review/simplify pair |

**v0.1 推荐 extension layer (opt-in，按 user CLAUDE.md 路由触发)：**

| Category | Skill | Repo | 触发条件 |
|---|---|---|---|
| design | ui-ux-pro-max | midwayjs/midway/.codex/skills/ui-ux-pro-max | UI/UX 设计请求 → 默认 |
| design | frontend-design | anthropics/skills (= anthropics/claude-code) | UI/UX 设计请求 + "做出风格" override |
| content | pptx | anthropics/skills | .pptx 文件操作 |
| content | docx / xlsx / pdf | anthropics/skills | document 文件操作 |
| content | baoyu-skills (21 skills) | jimliu/baoyu-skills | 中文内容创作 / 微信微博小红书发布 |
| testing | webapp-testing | anthropics/skills | E2E 测试 + Python 后端 |
| testing | playwright (CLI + @playwright/test) | microsoft/playwright + npm | 浏览器自动化 |
| testing | chrome-devtools-mcp | ChromeDevTools/chrome-devtools-mcp | 性能/a11y/内存诊断 — **强制** |
| search | tavily-mcp | tavily-ai/tavily-mcp | 关键词搜索默认 |
| search | exa-mcp-server | exa-labs/exa-mcp-server | 描述式 / 学术 / 批量 |

**v0.1 deferred（待 v0.2+ 验证后再加）：**

- mattpocock in-progress skills (review / writing-beats / writing-fragments / writing-shape) — 还在迭代，签名不稳。
- mattpocock deprecated skills (design-an-interface / qa / request-refactor-plan / ubiquitous-language) — 作者已弃用。
- anthropics/skills 内的 algorithmic-art / theme-factory / canvas-design / web-artifacts-builder / brand-guidelines — 极小众，先不进 base catalog。
- 任何 ctx7 显示 Trust < 7 或 popularity 0 stars 的候选。

---

## § 2 curate criteria — 候选准入标准

### 2.1 业界参考

| 标的 | 准入维度 | 适用 v0.1? | 适用 v0.4+? |
|---|---|---|---|
| **homebrew-core** ([Acceptable Formulae](https://docs.brew.sh/Acceptable-Formulae)) | OSI license + stable upstream tag + 跨 OS build pass + **≥30 forks 或 ≥30 watchers 或 ≥75 stars**（self-submit 3×：≥90/90/225）+ 无 self-update + 无 binary-only + 无 unpatched CVE | ❌ skill 不需要 build pass | ✅ 可借鉴 stars/forks 阈值 + license 检查 |
| **OpenSSF Scorecard** ([repo](https://github.com/ossf/scorecard)) | 23 项 check：Maintained (≥90 天活跃) / Code-Review / License / Security-Policy / Signed-Releases / Pinned-Dependencies / Token-Permissions / Vulnerabilities / Dangerous-Workflow / SAST / Fuzzing / CII-Best-Practices / Branch-Protection / Webhooks / etc. | ❌ 太重，社区维护者负担大 | ✅ subset (≥5 critical checks) 适合 v0.4+ MR review |
| **awesome-* lists** ([awesome](https://github.com/sindresorhus/awesome) curation guide) | "Truly awesome" + 常用且经过验证 + 维护良好 + 1-paragraph 描述 + 评论 + 测试 + open source | ✅ 形式最轻量 | ✅ 适合 PR review checklist |
| **anthropics/claude-plugins-official** ([README](https://github.com/anthropics/claude-plugins-official/blob/main/README.md)) | 显式声明："External plugins must meet **quality and security standards** for approval. To submit a new plugin, use the [plugin directory submission form](https://clau.de/plugin-directory-submission)." 但具体 criteria 不公开。结构标准：`.claude-plugin/plugin.json` + commands/agents/skills/README.md | ✅ harnessed schema 可对齐 plugin.json | ✅ submission form 模式可借鉴 |
| **npm score / Snyk score** | 维护性（commit 频率、issue 响应）+ 流行度（downloads）+ quality（README、test）+ vulnerability scanning | ✅ 适合自动评分 | ✅ 可作 weight 输入 |
| **Avelino et al. 2016 OSS bus factor** ([phase 1.1 R04 引用](https://arxiv.org/abs/1605.07922)) | "single-maintainer 项目年掉队率 36%" → 推荐**至少 2 个活跃 contributors** | ✅ harnessed-curate-MUST | ✅ 同 |

### 2.2 推荐 v0.1 criteria（5 项轻量门槛）

```yaml
# .claude-plugins/curate-criteria-v0.1.yml
mandatory:
  - id: license_osi_approved
    rule: "license.spdx_id IN [MIT, Apache-2.0, BSD-3-Clause, BSD-2-Clause, ISC, Unlicense]"
    rationale: "OSI 兼容 → 商用安全"
    enforcement: "hard reject"

  - id: stars_minimum
    rule: "stargazers_count >= 100 OR (stargazers_count >= 50 AND last_commit_within_3mo)"
    rationale: "homebrew-core 75★ 起步；考虑到 skill 生态比 brew 小，下调到 100 + 活跃可放宽"
    enforcement: "hard reject 不达标 unless 'official maintainer' override"

  - id: maintenance_freshness
    rule: "last_commit_date >= now() - 6 months"
    rationale: "OSSF Scorecard Maintained check 是 90 天；但 skill 比 OSS 库节奏慢，6 月合理"
    enforcement: "hard reject"

  - id: structural_completeness
    rule: "has SKILL.md OR plugin.json (in .claude-plugin/)"
    rationale: "schema 兼容 anthropics/claude-plugins-official"
    enforcement: "hard reject"

  - id: owner_quality
    rule: "owner.type == 'Organization' OR (owner.type == 'User' AND >=2 active contributors in last 6 mo)"
    rationale: "Avelino 单 maintainer 36%/年掉队率 — Org 或 ≥2 contributors 是基本保险"
    enforcement: "warn (not hard reject) — phase 1.1 R04 的 36% 用作 expected value 提示"

advisory:  # 不强制但纳入 score
  - id: trust_score
    source: "ctx7 skills search Trust"
    weight: 0.3

  - id: install_count
    source: "ctx7 skills search 安装数 OR skills.sh leaderboard rank"
    weight: 0.3

  - id: official_maintainer
    rule: "owner IN ['anthropics', 'microsoft', 'vercel-labs', 'ChromeDevTools', 'tavily-ai', 'exa-labs']"
    weight: 0.2  # 官方背书加分

  - id: security_policy_present
    rule: "has SECURITY.md OR has security_policy in repo metadata"
    weight: 0.1
    rationale: "OSSF Security-Policy check 子集"

  - id: license_present
    rule: "has LICENSE file"
    weight: 0.1
```

**几个 v0.1 候选的实测打分（参考）：**

| Skill | Stars | License | 活跃 | Owner type | 验收 |
|---|---|---|---|---|---|
| anthropics/skills | 19,188 | (per skill, 多 OSS) | 2026-05-12 | Org | ✅ pass |
| mattpocock/skills | (small repo, but 60K newsletter readers) | MIT | active | User | ⚠ 单 maintainer warn (advisory) |
| jimliu/baoyu-skills | 17,930 | None set on repo | 2026-05-12 | User | ⚠⚠ 无 LICENSE = hard reject 候选；需 PR 让 jimliu 加 LICENSE，or harnessed 团队联系 maintainer |
| midwayjs/midway (含 ui-ux-pro-max) | 7,710 | (midwayjs Apache-2.0) | active | Org | ✅ pass |
| ChromeDevTools/chrome-devtools-mcp | 39,338 | Apache-2.0 | active | Org | ✅ pass (top tier) |
| tavily-ai/tavily-mcp | 1,954 | MIT | active | Org | ✅ pass |
| exa-labs/exa-mcp-server | 4,415 | MIT | active | Org | ✅ pass |
| microsoft/playwright-mcp | 32,407 | Apache-2.0 | active | Org | ✅ pass |
| vercel-labs/skills (find-skills 母仓) | (待补) | (待补) | active | Org | ✅ likely pass |

→ **关键警告**：jimliu/baoyu-skills 当前 **license: None / 单 maintainer (jimliu)**，按 v0.1 hard reject 规则不能进 base。但其安装数 17.9K ★ 表明社区接受度极高。建议：harnessed v0.1 把它列在 "candidate / pending license" 状态，不进 base catalog 但供 user 手工 opt-in 时显示警告。

### 2.3 v0.4+ community PR 模式

**渐进策略（P0-3 推荐选 c：phase-aware）：**

- **v0.1**：maintainer 手工 curate（5 项 mandatory 自动 check + advisory score 排名）。catalog 控制在 **15-25 skill** 内（base 4 大方向 + 4 个核心 extension category × 3-5 skills）。
- **v0.2-0.3**：社区可提议 issue（template 含 5 项 mandatory check 自填），maintainer 决定是否合入。catalog 扩展到 **30-50 skill**。
- **v0.4+**：community PR 模式开启 — 提交者填 `manifest.yml`（schema 含 5 项 mandatory + advisory score），CI 自动 check 5 项 mandatory，maintainer 做 sanity review（按下方检查表）：

```markdown
## v0.4+ community PR review checklist (maintainer 视角)

### A. 自动 check（CI 跑 mandatory 5 项）
- [ ] license OSI approved
- [ ] stars ≥ 100 (OR ≥50 + 3mo active)
- [ ] last commit ≤ 6 months
- [ ] has SKILL.md OR plugin.json
- [ ] owner Org OR ≥2 contributors

### B. 人工 sanity review（maintainer 5 min）
- [ ] SKILL.md 内 description 清晰，trigger conditions 可机械判断
- [ ] 与现有 catalog 中 skill **不重复**（如重复，提议合并 or 拒绝）
- [ ] 不包含明显恶意（运行 .py / .ts / .sh 脚本时无 reverse shell / data exfil）
- [ ] requires bins (bun / npx / python) 在 base layer 已声明
- [ ] decision_rules 与现有 schema 兼容（不引入新 grammar）
- [ ] 通过 Avelino bus factor warning：单 maintainer / Org? 流行度?

### C. 决策
- [ ] **accept** → merge to catalog
- [ ] **request changes** → 评论指出问题
- [ ] **reject** → 给出明确原因（不达 mandatory or 重复 or 安全顾虑）
```

---

## § 3 mattpocock 23 命令 phase routing

### 3.1 真实命令清单（来自 GitHub API 实际抓取 + README 实际抓取）

> 总数 **23**（10 engineering + 4 productivity + 4 misc + 4 deprecated + 3 in-progress + 2 personal）。

| Skill | 路径 | 1-line 描述（来自 README） |
|---|---|---|
| **diagnose** | engineering/diagnose | 系统化排错 loop：reproduce → minimise → hypothesise → instrument → fix → regression-test |
| **grill-with-docs** | engineering/grill-with-docs | grilling session + 更新 CONTEXT.md / ADR；建立 ubiquitous language |
| **triage** | engineering/triage | 通过 state machine 角色 triage GitHub issues |
| **improve-codebase-architecture** | engineering/improve-codebase-architecture | 找 deepening opportunities，基于 CONTEXT.md + ADR；推荐每几天跑一次 |
| **setup-matt-pocock-skills** | engineering/setup-matt-pocock-skills | scaffold per-repo config（issue tracker / triage labels / docs path）— 用其他 engineering skills 之前必跑 |
| **tdd** | engineering/tdd | red-green-refactor TDD loop，垂直切片建特性/修 bug |
| **to-issues** | engineering/to-issues | 把 plan/spec/PRD 拆成可独立认领的 GitHub issues |
| **to-prd** | engineering/to-prd | 把当前对话 context 沉淀成 PRD 并 submit GH issue |
| **zoom-out** | engineering/zoom-out | 让 agent 跳出局部代码看 broader context / 更高 perspective |
| **prototype** | engineering/prototype | 建 throwaway prototype（terminal app for state/business logic OR UI variants toggleable from one route） |
| **caveman** | productivity/caveman | 超压缩通信模式，省 ~75% tokens 同时保技术准确 |
| **grill-me** | productivity/grill-me | 非代码用途的 grilling session — 决策树每个分支被问到清晰 |
| **handoff** | productivity/handoff | 把当前对话 compact 成 handoff 文档供下个 agent 接 |
| **write-a-skill** | productivity/write-a-skill | 创建新 skill，含 progressive disclosure + bundled resources |
| **git-guardrails-claude-code** | misc/git-guardrails-claude-code | 设 Claude Code hooks 阻挡 dangerous git commands |
| **migrate-to-shoehorn** | misc/migrate-to-shoehorn | 把 `as` type assertions 迁到 @total-typescript/shoehorn |
| **scaffold-exercises** | misc/scaffold-exercises | 创建 exercise 目录结构（sections / problems / solutions / explainers） |
| **setup-pre-commit** | misc/setup-pre-commit | 设 Husky pre-commit hooks + lint-staged + Prettier + 类型检查 + tests |
| **(deprecated) design-an-interface** | deprecated/design-an-interface | 已弃用 |
| **(deprecated) qa** | deprecated/qa | 已弃用 |
| **(deprecated) request-refactor-plan** | deprecated/request-refactor-plan | 已弃用 |
| **(deprecated) ubiquitous-language** | deprecated/ubiquitous-language | 已弃用（合到 grill-with-docs 中） |
| **(in-progress) review** | in-progress/review | 在写中 |
| **(in-progress) writing-beats / writing-fragments / writing-shape** | in-progress/ | 在写中（写作类） |
| **(personal) edit-article / obsidian-vault** | personal/ | mattpocock 个人用 |

### 3.2 5 phase × 命令 mapping

> 笔记 explicit 给出的部分用 ★ 标记，其余基于 README rationale 推导。

| Phase | 命令 | 触发条件 |
|---|---|---|
| **Discuss** ★ | `/grill-me` | 非代码任务的设计澄清 / 决策树发散 |
| **Discuss** ★ | `/grill-with-docs` | 代码任务 + 维护 CONTEXT.md + ADR + ubiquitous language |
| **Discuss** ★ | `/to-prd` | 对话 context 已成熟 → 直接沉淀 PRD（不再 interview） |
| **Plan** ★ | `/to-issues` | PRD/plan/spec → GitHub issues 拆分 |
| **Plan** | `/zoom-out` | 进 plan 阶段前看陌生模块的 broader context |
| **Execute** ★ | `/tdd` | red-green-refactor 子任务 |
| **Execute** ★ | `/diagnose` | hard bug / perf regression 系统化排错 |
| **Execute** ★ | `/zoom-out` | 写代码时跨陌生模块跳转 |
| **Execute** | `/prototype` | UI/state/business 设计需要 throwaway 探索 |
| **Execute** | `/triage` | issue 进入 → role-based triage |
| **维护** ★ | `/improve-codebase-architecture` | 周期性架构健康检查（推荐每几天 1 次） |
| **维护** | `/setup-pre-commit` | 新项目 / pre-commit 缺失 → 一次性装 |
| **维护** | `/setup-matt-pocock-skills` | 装 mattpocock 全家桶后必须 run 一次（per repo） |
| **维护** | `/git-guardrails-claude-code` | 防 destructive git ops（CLAUDE.md hard rule 配套） |
| **Token-省** ★ | `/caveman` | 上下文紧 / 不需详细解释 / batch 提交 |
| **Token-省** | `/handoff` | 对话过长 → compact 给下个 session |
| **meta-skill** | `/write-a-skill` | 创建新 skill / progressive disclosure 模式 |
| **misc / 一次性** | `/migrate-to-shoehorn`, `/scaffold-exercises` | 特定迁移 / exercise 模板 — 一次性场景 |

### 3.3 mattpocock 5 phase × 命令的 schema 化（routing engine input）

```yaml
# routing/categories.md or manifest.decision_rules
mattpocock_phases:
  discuss:
    primary:
      - id: grill-with-docs
        signals: ["new feature", "architecture decision", "代码任务", "需要决策澄清"]
      - id: grill-me
        signals: ["non-code planning", "策略", "产品决策"]
      - id: to-prd
        signals: ["context 成熟", "需要沉淀 PRD"]

  plan:
    primary:
      - id: to-issues
        signals: ["plan 已成型", "PRD 已就绪", "需要拆 issues"]
      - id: zoom-out
        signals: ["陌生模块导航", "需要 broader context"]

  execute:
    primary:
      - id: tdd
        signals: ["核心业务逻辑", "算法", "高可靠性场景", "新功能"]
      - id: diagnose
        signals: ["hard bug", "perf regression", "需要系统化排错"]
      - id: zoom-out
        signals: ["跨陌生模块跳转"]
    secondary:
      - id: prototype
        signals: ["需要 UI/state/business 探索性设计"]

  maintenance:
    primary:
      - id: improve-codebase-architecture
        cadence: "every 3-7 days"
      - id: setup-pre-commit
        on_event: "new repo OR pre-commit missing"
      - id: git-guardrails-claude-code
        on_event: "new repo (CLAUDE.md hard rule 要求)"

  token_save:
    primary:
      - id: caveman
        signals: ["context 紧", "batch 操作", "不需详细解释"]
      - id: handoff
        signals: ["对话超过 N tokens", "需要跨 session compact"]
```

---

## § 4 给 Wave B 的 input

### 4.1 A8' 4+ category × decision rules — 推荐 v0.1 范围

**5 大 category × 决策规则建议（schema 完整）：**

```yaml
categories:
  - id: meta
    base_layer: [skill-creator, find-skills]
    extension_layer: []
    decision_rule_anchor: |
      创建 skill → skill-creator
      搜索现有 skill → find-skills (含 skills.sh leaderboard 优先)

  - id: engineering
    base_layer:
      - mattpocock/skills (10 engineering)
      - obra/superpowers-skills (TDD + brainstorming)
      - anthropics/claude-plugins-official/plugins/ralph-loop
      - anthropics/claude-plugins-official/plugins/code-review
      - anthropics/claude-plugins-official/plugins/code-simplifier
    decision_rule_anchor: |
      Discuss → grill-with-docs / grill-me / to-prd
      Plan → to-issues / zoom-out
      Execute → tdd / diagnose / zoom-out / prototype + ralph-loop wrapper
      维护 → improve-codebase-architecture (3-7d cadence)
      Token-省 → caveman / handoff
      Verify (review) → code-review (multi-agent) / code-simplifier
      具体路由参考 § 3.3 的 schema

  - id: design
    base_layer: []
    extension_layer:
      - midwayjs/midway/.codex/skills/ui-ux-pro-max  # 需 v0.1 实测 install path
      - anthropics/skills/skills/frontend-design
    decision_rule_anchor: |
      默认 ui-ux-pro-max（数据驱动 + 标准化）
      "做出风格" 信号 → frontend-design 主导
      冲突时 ui-ux-pro-max 优先（除非 override 信号）
      详见 § 1.2 的 schema

  - id: content
    base_layer: []
    extension_layer:
      - anthropics/skills/skills/pptx
      - anthropics/skills/skills/docx
      - anthropics/skills/skills/xlsx
      - anthropics/skills/skills/pdf
      - jimliu/baoyu-skills (21 skills, 中文场景)  # 注：license 待 verify，phase 1.2.5 标 advisory
    decision_rule_anchor: |
      .pptx 文件操作 → anthropics/skills/pptx
      可分享图文 deck / 中文场景 → baoyu-slide-deck (license warn)
      微信/微博/小红书发布 → baoyu-post-to-wechat / -to-weibo / -xhs-images
      .docx/.xlsx/.pdf → anthropics/skills/{docx,xlsx,pdf}

  - id: testing
    base_layer: []
    extension_layer:
      - anthropics/skills/skills/webapp-testing
      - microsoft/playwright (CLI skill via ctx7)
      - "@playwright/test" (npm)
      - ChromeDevTools/chrome-devtools-mcp (MCP)
    decision_rule_anchor: |
      AI 探查/调试 → playwright-cli (Bash 一行)
      E2E TS/JS 项目 → @playwright/test (frontend/e2e/*.spec.ts)
      E2E + Python 后端 → webapp-testing (anthropics)
      性能/a11y/内存 → chrome-devtools-mcp (强制，不允许用 playwright 系列)
      详见 § 1.4 的 forbidden_combinations

  - id: search
    base_layer: []
    extension_layer:
      - tavily-ai/tavily-mcp
      - exa-labs/exa-mcp-server
    decision_rule_anchor: |
      默认 tavily-mcp（关键词 + 时效 + 站点）
      描述式 / 学术 / 批量 URL / token 敏感 → exa-mcp-server 强制
      整站抓取 → tavily-mcp（Exa 没对等工具）
      不确定 → 并行打两个对比
      brave-search-mcp 已弃用（Brave $5/月信用 API + 强制信用卡）
      详见 § 1.5 的 mandatory_*_signals
```

**这 6 大 category（不是 4+）建议同时进 v0.1 schema** — 因为它们都被 user CLAUDE.md explicit 路由化，schema 不写它们 = 8 支柱 A8' 不达成 100%。

### 4.2 P0-3 curate criteria — 推荐 (c) phase-aware 渐进策略

**v0.1**：maintainer 手工 curate + 5 项 mandatory CI check（§ 2.2 schema），catalog ≤25 skill。

**v0.2-0.3**：社区 issue 提议（template 自填 5 项 check），maintainer 决定。catalog 扩到 30-50。

**v0.4+**：community PR 模式 + CI 自动 check + maintainer human review checklist（§ 2.3）。

**关键 deviation 提示**：
- jimliu/baoyu-skills license: None — 不能直接进 v0.1 base，但流行度（17.9K ★）极高。**建议**：harnessed v0.1 catalog 用 `pending_license` 状态收录，提供 user opt-in 时显式 warn，并在 phase 1.3+ 联系 maintainer 加 LICENSE。
- ui-ux-pro-max 路径不标准（嵌在 midwayjs 大仓库内）— 需 v0.1 实测 `npx skills@latest add midwayjs/midway` 是否真能定位到 `.codex/skills/ui-ux-pro-max/`。如不能，harnessed 需要包装一层 install adapter（git-clone + 拷贝 + symlink）。

### 4.3 P0-5 superpower brainstorming + TDD 触发规则 — 推荐 (a + b) hybrid

**hard-coded 部分（mandatory TDD 场景，对应 a）：**

```yaml
mandatory_tdd_triggers:
  - task_description_contains: ["核心业务逻辑", "algorithm", "数据处理", "data processing"]
  - task_description_contains: ["金融", "支付", "auth", "security", "encryption"]
  - module_classification: "core_business"  # 由 manifest 标注
  - reliability_requirement: ">=99.9%"  # SLA 标注
```

**heuristic 部分（mattpocock /tdd skill 自带 detection，对应 b）：**

mattpocock /tdd skill 内部已经做了 "build features OR fix bugs one vertical slice at a time" 的判断 — 利用其内置 heuristic 自动决定 red-green-refactor 切片粒度。

**user-decide 部分（避免过度 TDD，对应 c）：**

```yaml
optional_tdd_triggers:
  - condition: "task description 不在 mandatory 触发列表中"
  - prompt_user: "此任务是否需要 TDD red-green-refactor? (y/N) — 如不需要，将直接进入实现"
  - default: "N"  # 避免给非核心任务过重负担
```

**brainstorming 触发规则（superpowers brainstorming 与 mattpocock /grill-with-docs 重叠）：**

```yaml
brainstorming_triggers:
  always_on:
    - subagent 启动 + 子任务 description 长度 < 100 字符（信息不足）
    - 子任务 description 含 "TODO" / "?" / "unclear" / "需要决定"
  preferred_skill_routing:
    - if user 在 GSD Discuss phase: use mattpocock /grill-with-docs (含 CONTEXT.md/ADR 持久化优势)
    - if user 在 Execute 子任务: use superpowers/brainstorming (子任务级，不写 ADR)
  rationale: |
    superpowers brainstorming 和 mattpocock /grill-with-docs 功能高度重叠
    — 路由按 phase 分配避免冗余调用
```

### 4.4 关键风险（必须告知 Wave B / 用户）

1. **ui-ux-pro-max install path 待 v0.1 实测**
   - 风险：`npx skills@latest add midwayjs/midway` 可能不能定位到 `.codex/skills/ui-ux-pro-max/`
   - 缓解：harnessed v0.1 实现 install adapter（git-clone + 子目录拷贝 + symlink to `~/.claude/skills/`），或者 fork ui-ux-pro-max 到独立 repo 提交给 midwayjs 团队 OR 自己维护 mirror

2. **jimliu/baoyu-skills license 缺失**
   - 风险：法律层面不能直接二次分发
   - 缓解：v0.1 标 `pending_license` warn；v0.2 联系 maintainer 加 MIT/Apache-2.0；如未响应，从 base catalog 移除

3. **mattpocock 单 maintainer (Avelino 36%/年掉队率)**
   - 风险：mattpocock 个人 burn out → 23 skill 一夜不更新
   - 缓解：harnessed catalog 应允许 fork/mirror（与 phase 1.1 已实证的 fork-redundancy 维度一致）；考虑邀请 mattpocock 加入 harnessed maintainer pool

4. **anthropics/skills 是 Anthropic 内部 monorepo**
   - 风险：Anthropic 重组 / 删除 / 迁移 → 大批 skill 一夜失联
   - 缓解：harnessed 应 mirror anthropics/skills 关键 skill 到 backup repo（不分发，仅备份 SKILL.md）

5. **chrome-devtools-mcp 是 MCP 协议（不是 skill）**
   - 风险：harnessed schema 必须区分 "skill" vs "MCP server" 两种 install path
   - 缓解：manifest schema 增加 `install_type: skill | mcp | npm | git` 字段（参考 anthropics/claude-plugins-official 的 plugin.json `mcpServers` 字段惯例）

6. **brave-search-mcp 已弃用（笔记里 still 引用）**
   - 风险：用户 CLAUDE.md 里"Brave 已弃用"内容可能在 wave B/C 的 schema 里被遗漏
   - 缓解：manifest 显式声明 `deprecated: [brave-search-mcp]` 列表，subagent 启动时如检测到 brave-search-mcp 已装则警告

7. **superpowers / GSD / planning-with-files 部分仓库地址不明**
   - 笔记中 "superpowers" 实指 obra/superpowers-skills（ctx7 confirmed）；"GSD" 是 user 自己维护的 .planning 模式（不是 skill）；"planning-with-files" 是某个 skill（**未在本调研中 verify** — Wave B 应单独 R1+R3 调研补足）
   - 缓解：标记为 R3 调研项（如 wave A 还有 budget）

---

## § 5 References (访问日期 2026-05-12)

### Anthropic 官方
- [`anthropics/skills`](https://github.com/anthropics/skills) — Anthropic Agent Skills monorepo（含 skill-creator / frontend-design / pptx / docx / xlsx / pdf / webapp-testing / mcp-builder / canvas-design / theme-factory / etc., 17 skills total）
- [`anthropics/skills/spec`](https://github.com/anthropics/skills/tree/main/spec) — Agent Skills Standard
- [`anthropics/claude-plugins-official`](https://github.com/anthropics/claude-plugins-official) — Anthropic-managed plugin marketplace, 19,188 ★, "External plugins must meet quality and security standards"
- [`anthropics/claude-code/skills/frontend-design`](https://github.com/anthropics/claude-code) — frontend-design skill mirror

### 第三方 skill packs
- [`mattpocock/skills`](https://github.com/mattpocock/skills) — Skills For Real Engineers（23 skills，4 类失败模式 → skill 映射作者亲述）
- [`vercel-labs/skills`](https://github.com/vercel-labs/skills) — find-skills + Skills CLI 母仓
- [`jimliu/baoyu-skills`](https://github.com/jimliu/baoyu-skills) — 17,930 ★ 中文 content pack（21 skills），**license: None**
- [`obra/superpowers-skills`](https://github.com/obra/superpowers-skills) — Test-Driven Development (TDD) Trust 9.5
- [`midwayjs/midway/.codex/skills/ui-ux-pro-max`](https://github.com/midwayjs/midway/blob/main/.codex/skills/ui-ux-pro-max/SKILL.md) — UI/UX Pro Max（藏在 midwayjs 大仓库内）

### Test / Search MCP
- [`microsoft/playwright-mcp`](https://github.com/microsoft/playwright-mcp) — 32,407 ★ Apache-2.0
- [`ChromeDevTools/chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp) — 39,338 ★ Apache-2.0
- [`tavily-ai/tavily-mcp`](https://github.com/tavily-ai/tavily-mcp) — 1,954 ★ MIT
- [`exa-labs/exa-mcp-server`](https://github.com/exa-labs/exa-mcp-server) — 4,415 ★ MIT

### Curate criteria 业界参考
- [Homebrew Acceptable Formulae](https://docs.brew.sh/Acceptable-Formulae) — ≥30 forks/watchers OR ≥75 stars (3× for self-submit)
- [OpenSSF Scorecard](https://github.com/ossf/scorecard) — 23 项 OSS 安全/维护 check
- [Avelino et al. 2016, "A Novel Approach for Estimating Truck Factors"](https://arxiv.org/abs/1605.07922) — phase 1.1 R04 引用（单 maintainer 36%/年掉队率）
- [skills.sh](https://skills.sh/) — Vercel Labs 维护的 skill 索引 + leaderboard
- [Claude Plugin Directory submission form](https://clau.de/plugin-directory-submission) — Anthropic 官方第三方 plugin 提交入口

### 工具
- `npx ctx7@latest skills search <query>` — context7 索引的 skill 搜索（本调研主用工具）
- `npx ctx7@latest docs <libraryId> <query>` — 库文档检索
- `npx skills@latest add <repo>` — skills.sh CLI 安装命令（Vercel Labs 维护）
- `gh api repos/<owner>/<repo>/contents` — GitHub Contents API 直接抓 directory tree
