# Research 01: Competitive Landscape

> **Domain:** AI coding harness 编排 / 装配类项目
> **Researched:** 2026-05-11
> **Researcher:** gsd-project-researcher (Domain 1 of 4)
> **Overall confidence:** HIGH

---

## 摘要（200 字内 — 给 synthesizer 用）

AI coding harness 生态在 2026 年已极度拥挤但极度同质：85K+ stars 的 ECC 与 150K stars 的 Superpowers 占据 mindshare，二者均是「all-in-one 自建派」。社区目录类（rohitg00 awesome-toolkit、jeremylongshore tonsofskills + ccpi、Anthropic 官方 marketplace）走数量路线，本质是 **plugin 自营集市**。MCP 端有 mcpfinder / Smithery / 官方 registry 解决「装单件」。**harnessed 真正切入的空白：跨 vendor 的 composition orchestration（manifest 描述 + 路由 + checkpoint），同时不 vendor 上游代码**。直接威胁为 0；最接近的 ccpi/ECC 都在「装载自家组件」。wedge 一句话：**「不让你卸 ECC，让你按需装配」**。

---

## 关键发现

- **ECC（Everything Claude Code）已是 mindshare 巨兽**：170K stars、48 agents / 184 skills / 79 commands；有商业层（ECC Tools, $19/mo）；但社区批评集中在「过度工程 / 大多数人只需要好的 CLAUDE.md」。
- **Superpowers（obra/Jesse Vincent）是 ECC 的方法论对手**：150K stars、入选 Anthropic 官方 marketplace、定义了"7 阶段 pipeline + brainstorming-first"工作流标准。
- **`ccpi`（jeremylongshore/tonsofskills）是名义最接近 harnessed 的项目**：自称 "package manager"、CLI 安装器、425 plugins / 2810 skills / 200 agents。但**它装载的全是自家集市内容**，不是 harnessed 的「manifest 声明上游 + composition skill 编排上游」模式。**这是 harnessed 真正的差异保留地。**
- **MCP 端：**`mcpfinder` 已经做了「跨 registry 发现 / 安装」（25K servers across Smithery + Glama + 官方 registry），但**只针对单 MCP server，不做 workflow 编排**。
- **Anthropic 官方 marketplace** 已是 4200+ skills / 770+ MCP 的大平台 — 单件分发问题已被解决，**编排问题没人解决**。
- **Yeoman / create-react-app / brew bundle** 历史教训：CRA 因为不接受社区 PR + 跟不上生态升级在 2025 年正式 deprecated，留下"模板僵化"教训；Yeoman 仍在但 mindshare 跌出主流；Brewfile 模型证明「declarative manifest + composition」是健壮模式。
- **LangChain / CrewAI / AutoGen** 的 dispatcher 模式（GroupChat / Crew / Graph）告诉我们：**编排范式有标准答案**（声明式 graph + state checkpoint + conditional dispatch），harnessed 的 phases schema 设计与之同构。
- **2026.4 政策转折**：Anthropic 限制 Pro/Max 订阅在多数第三方 agent 框架上的使用，挤压了 cc-mirror / vibeproxy 等"路由层"。harnessed 是**纯本地 composition / 不代理 API**，不在这条监管路径上 — 这是结构性安全。

---

## 各竞品深度分析

### 类别 A：直接对标（all-in-one harness 派）

| 项目 | 状态 | 规模 | 哲学 | 与 harnessed 关系 |
|------|------|------|------|------------------|
| **ECC** (affaan-m) | 🔥 极活跃，商业化 | 170K★、48 agents / 184 skills / 79 commands | All-in-one 自建、跨 5 个 vendor (CC/Cursor/OpenCode/Codex/Antigravity) | **主参照系**。占据 mindshare，不和它正面竞争 |
| **Superpowers** (obra) | 🔥 极活跃，官方 marketplace | 150K★、7-stage pipeline、subagent-driven | Methodology-first（先 brainstorm 再写）、git worktree 自动化 | **harnessed 上游依赖之一**。MVP 在 plan-feature/execute-task 中 invoke `brainstorming` |
| **GSD** (gsd-build/gsd-2) | 🔥 活跃 | 69 commands / 24 agents、phase-based workflow | Spec-driven、context-rot 解决方案 | **harnessed 上游依赖之一**。MVP 复用 GSD discuss/plan/execute/verify phases |
| **claude-code-plugins-plus-skills** (jeremylongshore) | 活跃 | 425 plugins / 2810 skills、自带 `ccpi` CLI | 自营 marketplace + CLI 包管理器 | **名义最像 harnessed**，**实质不同**：装载自家集市内容，无 composition skill 概念 |
| **awesome-claude-code-toolkit** (rohitg00) | 活跃 | 135 agents / 400K skills via SkillKit、176+ plugins | 大杂烩 awesome-list 风格 | 目录型，不竞争 |

#### ECC 短评（最重要）

ECC 的核心问题在社区已经显化：「**Most people just need a good CLAUDE.md, not an entire ecosystem**」。它解决了"配置零散"问题但带来"配置爆炸"新问题（hook 冲突、selective install 复杂度、3 个 vendor identifier 互相不通）。**harnessed 的"装配派"提案——不 vendor 上游、用 manifest 描述、用 composition skill 编排——直接命中 ECC 的痛点：用户可以保留自己已经在用的 ECC，再在外面套 harnessed 路由**。这是 wedge：「不让你卸 ECC，让你按需装配」。

#### ccpi 短评（最像但实质不同）

`tonsofskills.com` + `ccpi` CLI 是名字最像 harnessed 的项目（"package manager for Claude Code"）。但拆开看：

- ccpi 装载的是 jeremylongshore **自营 namespace** 下的 418 个 plugin（claude-code-plugins/）
- 它没有「manifest 描述上游 + composition skill 编排」的二阶设计
- 它本质是 npm/pnpm 的 thin wrapper，跑 `ccpi install <pack>` 等同于 `pnpm add`
- 不解决「跨 vendor / 跨上游 workflow 串接」问题

**结论：ccpi 是「集市 + 安装器」，harnessed 是「dispatcher + composer」**。两者不互斥，harnessed 的 manifest 甚至可以引 ccpi 的 plugin 做上游。

---

### 类别 B：MCP 端编排（间接借鉴）

| 项目 | 规模 / 状态 | 关键能力 | 对 harnessed 的启发 |
|------|-------------|----------|---------------------|
| **官方 MCP Registry** (registry.modelcontextprotocol.io) | Anthropic 维护，2025.9 preview | 客户端发现 MCP 的 canonical source | manifest 锁版本时可参考其 schema |
| **Smithery** | 6000 distinct servers、CLI + TypeScript SDK 开源 | "MCP 的 brew tap"、安装器 + 配置生成 | harnessed 的 MCP type installer 可借 Smithery API 做 fallback discovery |
| **mcpfinder** | 25K servers cross-registry | 跨 Smithery + Glama + 官方 registry 的 meta-search | 验证「meta-dispatcher」模式有用户需求 |
| **mcp.so / mcpservers.org** | 20K+ servers (大量重复) | 目录与 awesome-list | 数据噪声大，不直接复用 |

**关键事实**：MCP 端的"装单件"问题已被多方解决；**没有任何项目解决"workflow 编排多个 MCP + 多个 plugin + 多个 skill"问题**。这是 harnessed 的处女地。

**安全警示**：30+ CVE 被报告 against MCP servers in 2026.1-2；66% 流行 servers 有安全发现。harnessed § 8.4 dry-run + explicit confirm + § 8.3 hook 禁 shell 的纪律是必要的，**还应在 manifest schema 中加 supply chain checksum 字段**。

---

### 类别 C：Agent 编排框架（范式借鉴）

| 框架 | dispatcher 范式 | 与 harnessed 的关联 |
|------|----------------|---------------------|
| **LangGraph** (LangChain) | Directed graph + 条件 edge + checkpointing + time travel | **直接同构 harnessed phases schema**（§ 10）。`pause: human_review` 对应 LangGraph 的 interrupt；`$NN.outputs` 对应 graph state |
| **CrewAI** | 角色驱动 + Crews/Flows 双层 | "声明式 + role-based" — harnessed 的 `layer: governance/orchestration/execution` 三层栈与 CrewAI Flow + Crew 同构 |
| **AutoGen / AG2 / Microsoft Agent Framework** | GroupChat + Speaker Selector | 对 harnessed 借鉴有限（IM 风格不适合本地 CLI） |

**关键洞察（来自 cordum.io 2026 production test）**：
> The framework decides how the agent plans and invokes tools; **a control plane decides whether a risky action is authorized before dispatch**.

这正是 harnessed § 8.4「写用户文件前 explicit confirm」+ § 9 路由透明度的设计意图。**harnessed 是 "plugin-level control plane"**，类比生产 agent 框架的 governance layer，但目标是 dev tool 装配而非生产 dispatch。

---

### 类别 D：历史前辈（教训池）

| 项目 | 现状 | 教训 |
|------|------|------|
| **Yeoman** (`yo` + generators) | 跌出主流，仍在维护 | 「scaffolding tool + build tool + package manager 三件套」模型曾经流行，**但被 create-* / npx 模式取代** — 安装路径越短越好 |
| **create-react-app** | 2025.2 正式 deprecated | 不接受社区 PR + 跟不上 React 19 peer dep → "perfect storm of incompatibility"。**教训：单点维护 + 不及时升级 = 死亡** |
| **`npm create xxx` / npx pattern** | 事实标准 | `npx <pkg>@latest setup` 的安装心智被全网验证，harnessed 选 Node + npx 是正确技术决策 |
| **Brewfile / brew bundle** | 长期稳定 | declarative manifest + idempotent re-run 是健壮模式。**harnessed 的 manifest 引擎应该 = brew bundle 的体验** |
| **Bundler / Gemfile** | 长期稳定 | `manifest.lock` 方案是经典，harnessed § 5.5 manifest.lock.yaml 同构 |

**整合教训**：
1. **维护持续性是核心风险**（CRA 死因）。harnessed § 5.6 GitHub Sponsors + 6 月 co-maintainer 招募 + maintenance-only fallback 是直接回应。
2. **安装路径越短越好**。Yeoman 死于 `npm i -g yo && npm i -g generator-react && yo react` 三步太长；harnessed 必须做到 `npx harnessed setup` 一行。
3. **`brew bundle` 是体验北极星**。harnessed install/doctor/upgrade 三件套应直接抄 Brewfile 心智模型。

---

### 类别 E：harnessed-adjacent skill 集（确认是上游而非竞品）

| 项目 | 状态 | 关系 |
|------|------|------|
| **planning-with-files** (OthmanAdi) | 活跃 | **harnessed 上游依赖**。MVP plan-feature 步骤 5 直接 invoke |
| **ralph-loop** (anthropics 官方) | Anthropic 官方 plugin | **harnessed 上游依赖**。MVP execute-task 步骤 4 invoke `/ralph-loop` |
| **karpathy-skills** | skill 集 | harnessed 上游依赖，编码心法层 |
| **mattpocock-skills** | search 未直接命中（可能 namespace 在变化） | **⚠️ 风险点：上游存在性不确定**，建议 v0.1 dogfooding 时验证，否则替换为同等能力的 mattpocock 个人 skill 集 |

**⚠️ 警示给 synthesizer**：mattpocock-skills 的具体仓库地址在公开搜索中没明确命中，只看到 Matt Pocock 个人对 ralph-loop 的背书。**v0.1 实施前必须确认这个上游真实存在并稳定**，否则需要从 manifests 中替换或临时 vendor。

---

## 对 harnessed 的具体建议（可执行）

### 1. wedge 与 messaging（高优先级）

**README 第一句必须是**：
> **harnessed 不和 ECC 竞争组件库地位，是组件市场的 dispatcher** —— 类比 Linux 包管理器之于发行版。

第二段强调三个差异点：
- 不 vendor 上游（License 0 负担）
- 上游升级自动收益（你不被锁在 ECC 的发布节奏上）
- 跨 workflow 编排（ECC/Superpowers/GSD 没人解决）

**避免的反模式**：不要把自己描述成"another awesome-list / 又一个 plugin pack"。市场上这种已经有 5 个，全部沦为目录。

### 2. 与 ECC 的非对抗共存（高优先级）

manifests/ 中**应该包含 ECC manifest**（type: cc-plugin），让 harnessed 用户可以 `harnessed install ecc` 把 ECC 装为上游而不是替代。这把 "ECC vs harnessed" 叙事直接转成 "ECC + harnessed"，把 ECC 用户群从威胁变盟友。

**配套**：写一篇 docs/ecosystem-position.md，明确 "When to use ECC alone / When to add harnessed on top"。

### 3. ccpi 借鉴而非竞争（中优先级）

`ccpi` CLI 的 `install / search / list / update` 命令面是经过用户验证的好心智模型。harnessed CLI 应该接近这个心智，但**多出 `compose / route / status / resume` 这些 ccpi 没有的二阶能力**，以可视化彰显差异。

### 4. MVP scope 警惕（高优先级）

ECC 用 4 年长到 184 skills 还被批"过度工程"。**harnessed v0.1-v0.3 必须严守 3 个 workflow 不扩张**，证明"少即是多"。每个版本 ship 时在 README 显式更新 "skills count"，对照 ECC 184 vs harnessed N，把"装配派 = 极简"做成视觉证据。

### 5. 安全 / 供应链（高优先级，对应 § 8）

借鉴 2026 年 MCP 30+ CVE 教训，manifest schema v1 必须包含：
- `checksum: sha256:xxx`（上游版本锁的强校验）
- `signature: ...` 字段（v0.4+ 启用，对接 sigstore / cosign）
- `permission_scope: [filesystem, network, exec]`（声明式权限）

**对应 harnessed § 5.5 weekly CI**：除了跑 e2e，还要跑 `npm audit` / `osv-scanner` 自动化漏洞扫描。

### 6. checkpoint 设计可借 LangGraph（中优先级）

harnessed § 12 checkpoint-based execution 与 LangGraph 1.0 的 checkpointing + time travel 高度同构。**研究 LangGraph 的 `MemorySaver` / `SqliteSaver` 实现**作为 `.harnessed/checkpoints/` 目录布局的工程参考，避免重新发明轮子。

### 7. 路由透明度借鉴 cordum.io 教训（中优先级）

harnessed § 9 「每次路由决策必须可见输出」直接对应 cordum.io 2026 production test 的核心结论："policy-before-dispatch + audit evidence"。**v0.1 ship 时就把路由日志输出到 `.harnessed/audit.log`**，每条决策记录：query / 命中规则 / 备选 / 实际执行命令 / 用户 confirm。这是harnessed 区别于"黑盒 LLM 路由"的关键证据。

### 8. mattpocock-skills 风险预案（高优先级）

公开搜索未直接命中 mattpocock-skills 的具体仓库地址。**v0.1 实施前必须由维护者确认上游存在性**。如果是私人非正式集合，要么：
- (a) 在 manifests/ 中用 `type: vendor` + § 8.2 准入门槛 vendor 一份镜像（保险）
- (b) 替换为等效能力的官方/活跃 skill 集（更可持续）

### 9. dogfooding 必须公开（中优先级）

ECC v1 → v2 的 churn 在 issue tracker 公开（issue #1405 identifier confusion 等）。harnessed v0.4 的 "dogfooding benchmark" 不应只是内部跑通，要**公开发布到 docs/benchmarks/**：30 个真实任务 + 路由命中率 ≥85% + 上游升级 e2e 测试结果。这是回应 ECC "过度工程" 批评的硬证据。

### 10. 商标 / 命名（低优先级 — 已处理）

PROJECT-SPEC § 7 已经预案了 Harness.io disclaimer。补充建议：在 README 顶部增加一句 "harnessed is the past tense of harness — to put a harness on. Not affiliated with Harness Inc., Anthropic, or any vendor mentioned in manifests/." 把语义说透。

---

## 对 roadmap 的隐含建议

| Phase | 研究信号 | 建议 |
|-------|---------|------|
| v0.1 (research workflow) | MCP 端"装单件"已被解决，但 ctx7 / Tavily / Exa 三选一 dispatch 没人做 | **MVP 切入点正确**。3 上游够小、可证概念、且 dispatch 价值清晰 |
| v0.2 (execute-task) | superpowers brainstorming + ralph-loop + karpathy 心法的组合在社区单独流行 | **wedge 强**。三者 stitching 是用户痛点（每个单独装都散乱） |
| v0.3 (plan-feature) | gstack 概念在搜索中**完全未见**，可能是私人/小众 | **⚠️ 必须 v0.1 dogfooding 时验证 gstack 是否真的是 plugin 形态**（PROJECT-SPEC § 13 已 flag） |
| v0.4 (benchmark + cross-OS) | ECC churn 教训表明：单维持者 + 多平台支持 = 维护地狱 | **保守做：先 mac+linux，windows 推 v0.5**（PROJECT-SPEC 当前规划 OK） |

---

## 信息来源（按确认强度排序）

### HIGH confidence — 多源交叉验证 + 官方仓库

- [Everything Claude Code (affaan-m/everything-claude-code)](https://github.com/affaan-m/everything-claude-code) — ECC 主仓库
- [DeepWiki: ECC architecture](https://deepwiki.com/affaan-m/everything-claude-code) — 架构与安装机制
- [Augment Code: ECC hits 170K stars](https://www.augmentcode.com/learn/everything-claude-code-github-stars) — 规模数据
- [Superpowers (obra/superpowers)](https://github.com/obra/superpowers) — 主仓库
- [GSD (gsd-build/gsd-2)](https://github.com/gsd-build/gsd-2) + [b-r-a-n/gsd-claude](https://github.com/b-r-a-n/gsd-claude) — phase-based workflow
- [planning-with-files (OthmanAdi)](https://github.com/othmanadi/planning-with-files) — Manus-style markdown planning
- [Ralph Loop (anthropics 官方 plugin)](https://claude.com/plugins/ralph-loop) — autonomous loops
- [Anthropic Claude Code Plugin Marketplace](https://code.claude.com/docs/en/discover-plugins) — 官方分发渠道

### MEDIUM confidence — 单一权威来源 / 较新博客

- [Medium: ECC 82K-Star analysis (Ewan Mak)](https://medium.com/@tentenco/everything-claude-code-inside-the-82k-star-agent-harness-thats-dividing-the-developer-community-4fe54feccbc1) — 社区批评汇总
- [DEV: ECC Cheatsheet (shimo4228)](https://dev.to/shimo4228/everything-claude-code-ecc-complete-cheatsheet-24ok)
- [stevengonsalvez: GSD playbook](https://stevengonsalvez.com/tools-tips/gsd) — GSD 实战使用
- [LangChain vs CrewAI vs AutoGen 2026 comparison (cordum.io)](https://cordum.io/blog/ai-agent-frameworks-comparison) — agent framework 范式
- [paddo.dev: Ralph Wiggum technique](https://paddo.dev/blog/ralph-wiggum-autonomous-loops/) — ralph-loop 起源
- [claudefa.st: Claude Code 2026 changelog](https://claudefa.st/blog/guide/changelog) — 2026.4 政策变化
- [thoughtbot: Brewfile is a Gemfile for Homebrew](https://thoughtbot.com/blog/brewfile-a-gemfile-but-for-homebrew) — declarative manifest 范式
- [devclass: CRA deprecation](https://devclass.com/2025/02/18/react-team-formally-deprecates-create-react-app-following-perfect-storm-of-incompatibility) — 历史教训

### MEDIUM confidence — 目录型 / 数据点

- [claudemarketplaces.com](https://claudemarketplaces.com/) — 4200+ skills 数据
- [mcp.so](https://mcp.so/) + [mcpservers.org](https://mcpservers.org/) — MCP 目录规模
- [official MCP Registry](https://registry.modelcontextprotocol.io/) — canonical source
- [mcpfinder](https://github.com/mcpfinder/mcpfinder) — meta-dispatcher 验证
- [tonsofskills (jeremylongshore)](https://github.com/jeremylongshore/claude-code-plugins-plus-skills) — ccpi CLI 最像 harnessed 但实质不同
- [awesome-claude-code-toolkit (rohitg00)](https://github.com/rohitg00/awesome-claude-code-toolkit) — 大杂烩对照

### LOW confidence — 仅启发，不依据决策

- mattpocock-skills 具体仓库地址 — **未确认**，需 v0.1 实施前由维护者验证
- gstack 公开存在性 — 公开搜索未命中，**疑为私人/小众**，需 v0.1 dogfooding 验证（与 PROJECT-SPEC § 13 一致）

---

## 给 synthesizer 的核心 takeaways

1. **harnessed 直接威胁为 0**。最像的 ccpi 走的是「自营集市」路线，与"装配派 + composition skill"实质不同。
2. **ECC mindshare 强大但有清晰反模式**（"过度工程"批评），**harnessed 应"non-rivalry"路线**：把 ECC 作为可装配上游，不正面竞争。
3. **MVP 范围控制是生死线**。ECC churn 教训直接威胁 harnessed 单点维护。
4. **mattpocock-skills + gstack 上游存在性需 v0.1 dogfooding 验证**（这是 PROJECT-SPEC § 13 已知 flag 的延伸）。
5. **MCP 安全教训需对应到 manifest schema v1**（checksum + signature + permission_scope）。
6. **wedge 一句话锁定**：「不让你卸 ECC，让你按需装配」 — 这句话应进 README、homepage、第一条 tweet。
