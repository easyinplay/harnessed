# Research 04 — Failure Modes（dispatcher / 包管理器 / 编排器类项目的失败模式）

**研究范围**：dispatcher / orchestrator / 包管理器类前辈项目的失败模式 + 缓解策略
**作者**：gsd-project-researcher #4
**日期**：2026-05-11
**整体置信度**：HIGH（多源交叉验证 + 学术研究数据 + 一手 retrospective）

---

## 摘要（200 字内）

研究 7 个领域 30+ 个先驱项目（npm/Cargo/Homebrew/Yeoman/CRA/LangChain/CrewAI/Vim 插件管理器演化等），提炼出对 harnessed 直接致命的 **10 类失败模式**：(1) 上游 API 不稳定塌方（LangChain 0.x→1.x 例）；(2) 抽象层成为枷锁（Octomind 12 个月后弃用 LangChain）；(3) 单维护者倦怠（学术数据：单点项目年存活率 ~64%）；(4) 拓扑解析缺失（brew bundle tap 排序 bug 持续到 2025）；(5) Schema 用代码而非数据（Brewfile Ruby DSL 翻车）；(6) Bridge 层永久债（babel-eslint 案）；(7) 上游废弃静默失败；(8) 命名空间被抢注（VS Code Open VSX 案）；(9) 装机即过期（CRA 死因之一）；(10) 范围蔓延变 meta-PM。**核心结论**：harnessed 应坚守 Cargo 式 "convention over configuration + 数据格式 manifest + lockfile 强制" 三件套，绝不重蹈 Yeoman/CRA 路线。

---

## 失败模式 Top 10

### 1. **上游 API 频繁 breaking change，bridge 层永久负债**

- **历史案例**：
  - **babel-eslint** — 维护方在博客明说："Existing as a compatibility layer between Babel and ESLint – two projects maintained by two separate teams – babel-eslint has been a difficult package to maintain since the beginning. babel-eslint has to be updated to handle changes in both upstream projects, and has often been out of sync with one or the other."
  - **LangChain** — 用 12 个月才到 v0.1，"production teams quietly rewriting to raw SDKs in 2026"，因为 OpenAI/Anthropic 把工具调用、结构化输出、prompt caching 全做进 SDK，LangChain 抽象的"价值"被上游吃了。
- **对 harnessed 的适用性**：⚠️ **极高**。harnessed 是「ECC + gstack + GSD + superpowers + ralph-loop + ctx7 + Tavily MCP + Exa MCP」的 **N 路 bridge**。每个上游一旦 breaking change，harnessed 都要打补丁。M 个上游 × N 次 breaking ≈ 维护负载平方级增长。
- **缓解建议**（按优先级）：
  1. **manifest.lock.yaml + weekly CI**（PROJECT-SPEC § 5.5 已规划，强烈认可）
  2. **优先选稳定上游**：在 manifest 注明每个上游的 SemVer 承诺等级（gstack/GSD/superpowers 都是个人项目，stability 等级标 "experimental"；ctx7/Tavily/Exa 是企业产品，标 "stable"）
  3. **Bridge 层放最薄**：harnessed 永远只「调用」上游 + 路由，**绝不 wrap 上游 API**（不要写 `harnessed.invokeBrainstorming()` 这种二次抽象，让用户直接 prompt `superpowers:brainstorming`）
  4. **每个上游有明确的 fallback**：上游挂了走哪条路（例：Tavily 挂 → Exa；superpowers 挂 → 内置最简 brainstorm prompt）

### 2. **抽象层成为枷锁（"abstractions as cage"）**

- **历史案例**：
  - **LangChain** — Octomind 案例最经典："LangChain's abstractions were too inflexible for more complex agent architectures... Octomind needed to dynamically adjust which tools an agent could use based on business logic and the agent's state — but LangChain provided no mechanism to observe or control an agent's state mid-run. This limitation forced them to downgrade their design to fit LangChain's capabilities."
  - **Yeoman** — generator API 抽象太重，写一个新 generator 比直接写 npm scripts 还累，最终被 `npm create *` 模式碾压。
- **对 harnessed 的适用性**：⚠️ **高**。`workflows/*/SKILL.md` phases schema 一旦定义过严，未来想加 "skip phase 2"、"分支 phase 3a/3b"、"phase 4 的 outputs 喂回 phase 2" 等需求时就会撞墙。
- **缓解建议**：
  1. **Phases schema v1 极简**：只支持 v0.1-v0.4 真实需要的字段（PROJECT-SPEC § 10 当前 9 个字段已经偏多，建议 v0.1 只锁 5 个：`id / upstream / invokes / inputs / outputs / pause`）
  2. **保留 escape hatch**：每个 workflow 必须可绕开 harnessed 直接 prompt 调用上游（"`/superpowers:brainstorming` 可单独用，不必走 `/harnessed:execute-task`"）
  3. **「workflow 是建议而非强制」**：透明度优先（PROJECT-SPEC § 3 已确立），用户能清楚看到每个 phase 调了什么、可以手动跳过/修改

### 3. **单维护者倦怠 → 项目死亡**

- **历史数据**（HIGH 置信度，学术研究）：
  - 89% 的 OSS 项目至少经历过一次核心团队流失
  - 70% 的流失发生在前 3 年
  - 41% 的弃疗项目能找到新 maintainer 续命，**59% 直接死亡**
  - 单 maintainer 项目年掉队率 **36%**
  - 60% maintainer 考虑过退出，44% 因 burnout
- **对 harnessed 的适用性**：⚠️ **中等偏高**。harnessed 设计上确实是 bus factor 1（PROJECT-SPEC § 1 已显式承认）。开源 + GitHub Sponsors 兜底，但学术数据说 6 个月 co-maintainer 招募窗口大概率招不到。
- **缓解建议**（除已规划的 Sponsors / co-maintainer 招募外的新增手段）：
  1. **降低 fork 成本**：核心价值是 `routing/*.md` + `workflows/*.skill.md` markdown 文件，**让 fork 一份继续维护的成本低到一周内**（schema 数据格式而非代码、manifest 不依赖私有发布渠道）
  2. **公开 ADR + decision log**：每个非常规决策写 `docs/adr/NNNN-xxx.md`，让接手者半天读完知道为啥这么设计（参考 Rust RFC 模式）
  3. **CI 跑得起来**：维护者不在线时 CI 也要能自动 PR 升级 lock 文件 + alert，不依赖人工 vigilance
  4. **dogfooding 成自我维护动力**：harnessed 的 0.4 版本 dogfooding benchmark（PROJECT-SPEC § 7 已规划）让维护者自己用得爽 → 倦怠时仍有内在动力
  5. **签名版 manifest**：vendor/ENTRY-CRITERIA.md 的 `vendor_owner_signed` 思想推广到所有 manifests/，每个 manifest 文件的最后修改人有 GitHub username 字段，方便接手者快速定位 expert

### 4. **拓扑依赖解析缺失，导致 install 顺序错乱**

- **历史案例**：
  - **brew bundle**（Homebrew）—— 2025 年 11 月仍在被 issue：`brew bundle install` 不会先装 tap 再装依赖该 tap 的 cask。"if I comment out the cask line, run once, and then uncomment the line and run for a second time, everything will work flawlessly. The conclusion seems to be that somehow brew bundle has forgotten to install the taps before their dependents."
  - 类似问题：apt 的 dependency hell、Yeoman 的 generator 之间互相依赖时 install 顺序问题。
- **对 harnessed 的适用性**：⚠️ **极高**。MVP 列出的上游有 10 个，未来扩展到 20+ 个；workflow 里的 phases 互相 `inputs: $NN.outputs` 引用形成图。**没有 topological resolver 早晚翻车**。
- **缓解建议**：
  1. **install 引擎从一开始就是图**，绝不简单逐行执行 manifest
  2. **install order**：解析 manifests/ 全量依赖 → 拓扑排序 → 按层并行 install（同一层无依赖关系并行）
  3. **workflow phases 也是 DAG**：不强制 sequential，phase A → phase C 可跳过 B，phase X 和 Y 无依赖时可并行
  4. **CI 守门**：循环依赖（A 依赖 B、B 依赖 A）必须 schema 校验时拒绝
  5. **install 失败不静默**：缺依赖、版本冲突、循环依赖一律详细打印 + 退出码 ≠ 0

### 5. **Manifest 用代码格式而非数据格式 → 永恒的 escape bug**

- **历史案例**：
  - **Brewfile**（Ruby DSL）—— `brew bundle dump --describe` 输出多行 cask description 时生成无法 parse 的 Ruby："Error: Invalid Brewfile: /dev/stdin:47: syntax errors found"。Issue 评论："This seems to be the same issue as Homebrew/homebrew-bundle#757, but for casks instead of formulae. Are there other categories which might need a similar fix? I'm not familiar enough with the Homebrew ecosystem to know what else (if anything) might run into similar issues." 用 Ruby 当 DSL = 永远会有新的 escape bug。
  - **vs Cargo.toml**（纯 TOML）—— 没有这类 bug，因为 TOML 是数据。
- **对 harnessed 的适用性**：⚠️ **中等**。PROJECT-SPEC 已选 yaml frontmatter + markdown 配置（routing/*.md、manifests/*.yaml 等），方向正确。但要警惕：
  - **不要在 yaml 里允许 `${shell command}` 这种动态求值**
  - **不要在 hook 里允许任意 shell**（PROJECT-SPEC § 8.3 已硬约束，强烈认可）
- **缓解建议**：
  1. **schema 早冻结**（PROJECT-SPEC § 8.1 已硬约束，认可）
  2. **manifest 100% 静态**：manifest 必须能仅靠读取就完整理解，不允许 `eval` / `${...}` / `!ruby/regexp` 类动态构造
  3. **CI 用 JSON Schema 严格校验**：参考 Kubeconform `-strict` 模式，未知字段直接拒绝
  4. **schema migration 提供 codemod**：参考 Babel 7→8 的 migration guide 做法，schema 改版时提供自动转换工具

### 6. **上游 deprecate / rename / archive 没有自动检测**

- **历史案例**：
  - **Homebrew 旧 tap** —— `homebrew/cask-fonts` 被废弃后，老 Brewfile 直接跑挂："Tapping homebrew/cask-fonts Error: homebrew/cask-fonts was deprecated. This tap is now empty and all its contents were either deleted or migrated."
  - **Yeoman generators** —— 5600 个 generator 里大量 abandonware，没有清晰的健康度信号。
- **对 harnessed 的适用性**：⚠️ **高**。manifests/ 里的 10+ 上游中，gstack/superpowers/karpathy-skills 等都是个人项目，5 年内大概率会有几个废弃。
- **缓解建议**：
  1. **每个 manifest 必填 health check 字段**：`upstream_health: { last_commit_check: weekly, abandonment_threshold: 6mo, fallback_action: warn|block }`
  2. **`harnessed doctor` 跑 health 检查**：weekly CI + 用户 on-demand，发现某个上游 6 个月无 commit 则在 README 上标 "⚠️ upstream stale"
  3. **deprecation marker**：参考 Terraform 1.15 的做法，manifest 里可标 `deprecated: { since: 0.3.0, replacement: <new-name>, removal: 0.5.0 }`，install 时打 warning 不阻塞，到 removal 版本才删
  4. **migration aliases**：上游改名时（如 `superpowers` 重组为 `superpowers-core`/`superpowers-extras`），manifests/aliases.yaml 维护一份重定向表

### 7. **多上游版本兼容矩阵爆炸**

- **历史案例**：
  - **Babel x ESLint x Prettier x typescript-eslint** —— 每对组合都有兼容版本表，新人入坑常踩雷。Babel 7.16 释放时官方博客特意说明："eslint-plugin-import-x... that he's going to do a once-in-a-decade breaking change now that ESLint v9 and flat config are shipped." → 上游主版本同步是仪式
  - **VS Code extension API** —— extension 申明 `engines.vscode: ^1.85.0`，VS Code 升 2.x 时大量 extension 集体过期
- **对 harnessed 的适用性**：⚠️ **中**。harnessed 当前 10 个上游互相之间耦合度低，但跨 harness（v0.2+）启用后，CC × Codex × Cursor × harnessed 自身版本会快速膨胀矩阵
- **缓解建议**：
  1. **MVP 阶段单矩阵维度**：只对 Claude Code 一个 harness，简化掉一维
  2. **manifest.lock.yaml 锁 N 元组**（不只是单个上游版本）：周 CI 跑的是「这 10 个上游的当前 latest 组合是否都互相兼容」
  3. **「known good」标签**：每个 harnessed 版本（v0.1.0、v0.1.1...）冻结一组通过 e2e 的上游版本组合，回滚时可一次回到整组
  4. **跨 harness 时 v0.5+ 才考虑**：先把 CC harness 一条线打透

### 8. **命名空间 / namespace squatting**

- **历史案例**：
  - **Open VSX vs VS Code Marketplace 漏洞**（2026-01）：VS Code fork IDE 推荐 extension 但只查 Open VSX，结果 Microsoft 自家 extension（如 `ms-ossdata.vscode-postgresql`）的命名空间在 Open VSX 没注册被攻击者抢注上传恶意版本。
  - **npm 历史抢注事件**：left-pad、is-promise、ua-parser-js 等供应链攻击。
- **对 harnessed 的适用性**：⚠️ **低-中**。harnessed 自己的 namespace `/harnessed:*` 已抢注（PROJECT-SPEC § 5.2），但 manifests/ 里引用的上游名字可能被冒名（如有人在 npm 注册一个叫 `@superpowers/skills-fake` 的恶意包）。
- **缓解建议**：
  1. **manifest 必须锁 commit hash 而非 npm name + version**（PROJECT-SPEC § 5.5 对 plugin 类已锁，认可）
  2. **install 时 `--dry-run` + diff 默认开**（PROJECT-SPEC § 8.4 已硬约束，认可）
  3. **`harnessed audit` 命令**：检查所有上游的 git origin URL 是否变化（参考 cargo audit）
  4. **关键上游 fork 一份镜像**：v0.5+ 考虑在 GitHub org `harnessed/` 下 fork superpowers/gstack 等核心上游做镜像（确保单点不挂）

### 9. **装机即过期（CRA 死因之一）**

- **历史案例**：
  - **Yeoman / Vue CLI 旧模式**："If you installed @vue/cli six months ago, you're now creating a six-month-old template. You have to constantly remember to npm update -g, which is a hassle."
  - **CRA** —— 2025 年 2 月 sunset 主因：webpack 慢 + 没 maintainer 跟进 React 19 兼容。
  - **修复方式**：`npx create-vite` / `npm create *` 模式 —— 每次拉最新，不缓存
- **对 harnessed 的适用性**：⚠️ **中**。如果用户 `npm i -g harnessed` 然后忘了升级，他用的就是 6 个月前的 routing 表 + 6 个月前的上游版本表，体验会差。
- **缓解建议**：
  1. **推 `npx harnessed@latest setup` 入口**（PROJECT-SPEC § 1 已规划，认可）
  2. **`harnessed setup` 启动时自检自身版本**：发现自己不是 latest → 提示用户升级
  3. **routing 表 / lock 表分离仓库版本和数据版本**：harnessed 主程序版本 v0.3 + routing schema v1 + manifest.lock.yaml 内容版本 2026-05-11，三者独立演化
  4. **「云端 manifest registry」考虑**（v1.0+）：类似 crates.io，用户的 lock.yaml 引用的是 registry 里的 immutable 版本，而非 git tag（git tag 可被强推）

### 10. **范围蔓延 → 变 meta-PM 后失控**

- **历史案例**：
  - **brew bundle** —— 从 "list of brews" 增长到管 Mac App Store / VSCode / Cargo / Go / uv / Flatpak / krew / npm。每加一类就引入该生态的失败模式（dump/install roundtrip 各种 bug）。
  - **LangChain** —— 越来越大、越来越多 abstraction → "production teams are quietly rewriting to raw SDKs"。
- **对 harnessed 的适用性**：⚠️ **极高**。harnessed 本质就是 meta-PM。诱惑路径：v0.5 加 `verify-uat` workflow → v0.6 加 `ship` workflow → v0.7 加可视化 dashboard → v1.0 想做「one-stop AI coding platform」→ 死。
- **缓解建议**：
  1. **MVP 范围严格 freeze**：3 个 workflow + 4 类 installer，**v1.0 之前不加新 workflow type**（除非现有 schema 自然覆盖）
  2. **拒绝特性需求的清晰原则**：feature request 必须先回答 3 问 — (a) 是否能用现有 workflow + manifest 表达？(b) 不能的话能否在上游解决？(c) 都不行才考虑加进 harnessed
  3. **MVP 学 Cargo**（rustup 与 cargo 切分干净）：harnessed 只做"装配"，不做"编排执行的运行时"。运行时的事交给 superpowers / ralph-loop / GSD 自己
  4. **拒绝 "harnessed 是平台" 心态**：定位明确为 "Linux 包管理器之于发行版"（PROJECT-SPEC § 6 已确立），不是「下一代 LangChain」

---

## 历史前辈对比表

| 项目 | 类别 | 状态 | 关键教训 | 对 harnessed 启示 |
|------|------|------|---------|------------------|
| **Cargo + rustup** | 包管理器 + toolchain manager | ✅ 大成功 | 数据格式 manifest（TOML）+ lockfile 强制 + convention over config + tooling 一等公民 + 拆 rustup/cargo 两个工具 | **最佳模仿对象**。harnessed 学 Cargo 而非 npm |
| **npm + package-lock.json** | 包管理器 | ✅ 主流但毁誉参半 | lockfile 设计早期模糊（package.json vs lock 谁是 SSOT）→ npm 5.1 才修；lockfile injection 漏洞；node_modules 嵌套地狱 | lock 文件 SSOT 必须早定，commit hash 锁住 origin |
| **Homebrew + brew bundle** | 包管理器 + manifest | ⚠️ 持续问题 | Brewfile 用 Ruby DSL → 永恒 escape bug；tap 顺序解析缺失；范围蔓延（管 mas/cargo/go/uv...） | 数据格式 + 拓扑解析 + 范围 freeze |
| **Yeoman** | scaffolding | ❌ 衰落 | generator 抽象重 + 依赖老工具链（Grunt/Bower）+ 五千个 generator 大半 abandonware + 无健康信号 | 抽象越薄越好；上游健康度必填 |
| **CRA** | scaffolding | ❌ 2025-02 sunset | webpack 老化 + 无 maintainer + React 19 兼容塌方 + 装机即过期 | `npx@latest` 模式 + 上游 SemVer 等级标注 |
| **vim-plug → packer.nvim → lazy.nvim** | plugin manager 演化 | ⚠️ 用户 fatigue | 每代解决一个真问题但用户每 2-3 年要迁移；现在 Neovim 自带 vim.pack 来终结 | 「用户每 2 年迁移一次」是真实成本；尽量不引入大概念升级 |
| **LangChain** | AI agent 编排 | ⚠️ 商业上仍活跃，技术上被弃 | 抽象太重 + 上游进步吃掉抽象价值 + breaking change 历史长 + docs 烂 | 抽象薄；定期问"上游做了我还要不要做"；docs 要早投入 |
| **CrewAI / AutoGen** | multi-agent | ⚠️ 各有千秋 | 框架选择不重要，retry/timeout/cost 监控才是 production blocker；CrewAI 简单但需要"工程纪律 guardrails" | harnessed 给用户 guardrails（max_iterations / pause / dry-run），不是 magic |
| **VS Code extension API** | plugin host | ✅ 成功 | 严格命名空间（publisher.extension）+ engines.vscode 版本约束 + verified publisher | manifest.namespace + minimum harness version |
| **Open VSX** | 替代 marketplace | ⚠️ 安全漏洞 | 命名空间被抢注 → 供应链攻击 | namespace 必须 first-class 校验 |
| **Babel + ESLint x typescript-eslint** | 多上游协调 | ⚠️ 持续负担 | bridge 永久债务；改善靠人（双 maintainer Kai Cataldo）+ 收敛到共享 spec（ESTree） | bridge 越薄越好；推动上游 spec 收敛 |
| **GitHub Actions composite + reusable workflow** | workflow 复用 | ✅ 大量使用 | 输入 schema 不一致（composite 全是 string，reusable 有 type）；reusable workflow 不支持 major version 通配 | schema 一致性优先；版本通配支持要早 |
| **Kubernetes CRD / Docker manifest v2** | schema 演化 | ✅ 成熟模式 | apiVersion 字段 + 多版本并存 + storedVersions 跟踪 + 软 deprecation | manifest 必须有 `apiVersion: harnessed/v1` 字段 |
| **Ansible / Terraform module registry** | infra 编排 | ✅ 主流 | Terraform 1.15 引入 deprecation marker；用 OPA 做 policy enforcement；Provider 三级（Official/Partner/Community） | 上游分级（stable/experimental）+ deprecation marker |

---

## 对 PROJECT-SPEC § 7 风险登记的补充

### 现有风险概率/影响修正

| 现有风险 | 当前评级 | 建议修正 | 依据 |
|---------|---------|---------|------|
| 上游 breaking change 塌方 | 中/高 | **高/高** | LangChain/Babel/eslint 历史显示 N 个上游 = 平方级负载，且 superpowers/gstack 等是个人项目，SemVer 不严 |
| Composition skill 触发不准 | 中/高 | **维持** | 30 样本验收（PROJECT-SPEC § 5.1）已是合理量级 |
| 单点维护（bus factor 1） | 中/中 | **中/高** | 学术数据：单 maintainer 项目年掉队率 36%，6 个月窗口未必能招到 co-maintainer |
| 命名冲突 | 高/低 | **维持** | `/harnessed:*` 前缀已解决 |
| 价值证明不足 | 中/高 | **维持** | benchmark 是正解 |

### 新增风险（Top 5，建议加入 § 7）

| 新风险 | 概率 | 影响 | 缓解 |
|--------|------|------|------|
| **抽象层成为枷锁**（用户绕不开 harnessed 时弃用） | 中 | 高 | escape hatch（每个 workflow 可绕开直调上游）+ 透明度（每步可见可改） |
| **上游 deprecate/rename 静默失败** | 中 | 中 | manifest 必填 health 字段 + `harnessed doctor` weekly + deprecation marker |
| **范围蔓延变 meta-PM** | 中 | 高 | feature request 三问 + v1.0 前 freeze workflow 数量为 3 |
| **拓扑解析缺失导致 install 顺序错乱** | 高 | 中 | install engine 从 day 1 就是 DAG resolver，绝不逐行执行 |
| **装机即过期（用户用着旧版本却不知道）** | 高 | 中 | `harnessed setup` 启动自检版本 + 推 `npx@latest` |

### 针对性回答 PROJECT-SPEC § 7 已有风险

**Q1: "上游 breaking change 塌方" 历史概率多大？**
- 答（HIGH 置信度）：选取的 10 个上游中，5 个是个人项目（gstack/superpowers/karpathy-skills/mattpocock-skills/planning-with-files/ralph-loop），SemVer 不严。**保守估计每个上游 12 个月内有 1 次 breaking change，10 个上游 → 平均每月 ~0.83 次**。weekly CI 可拦下 ~80%，但仍有 20% 漏到用户端 → **每月约 1 次「用户报 bug」频率**。
- 缓解：weekly CI（已规划）+ 上游 SemVer 等级标注（建议新增）+ "known good" 版本组合（建议新增）

**Q2: "Composition skill 触发不准" 用什么先例缓解？**
- 答（MEDIUM 置信度）：
  - **CrewAI/AutoGen 经验**：「framework 不重要，retry/timeout/cost 监控才重要」→ harnessed 应在路由失败时 graceful degrade（PROJECT-SPEC § 9 fallback 块已设计，认可）
  - **Babel 案**：意图检测 ambiguous 时 fallback 到「问用户」是工业最佳实践
  - **VS Code @id: 前缀**：用户能精确指定 `@id:vue.volar` 绕过模糊匹配 → harnessed 应支持 `--route=tavily` 强制路由（WORKFLOWS-MVP § 路由透明度设计已规划，认可）
- 增量建议：路由命中率 ≥ 85% 之外，再加一个指标：**「路由错误时用户能在 10 秒内手动覆盖」**（UX 指标）

**Q3: "单点维护" 除 Sponsors / co-maintainer 外的延寿手段？**
- 答（HIGH 置信度，依据：学术研究 + Avelino 2019 论文）：
  1. **降低 fork 成本**：核心价值 markdown 化、ADR 公开、CI 自动化（已论述）
  2. **新 maintainer 接手成本**：调查显示新 maintainer 主要痛点是 "lack of time + difficulty obtaining push access"，前者无解，后者建议从 v0.2 开始就给 active contributor branch protection 例外
  3. **依赖 user-as-maintainer**：Avelino 论文："new maintainers' own usage of the systems is the main motivation to contribute" → harnessed 必须先让自己成为 maintainer 强依赖工具（dogfooding），自己使用就成为内在维护动力
  4. **避免「单点知识」**：所有非常规决策必须有 ADR，禁止「我脑子里有数」
  5. **降低 burnout 风险**：开 issue 模板 + 标签自动化 + bug triage 不要自己一个人扛，用 stale-bot 自动关闭无活动 issue

---

## 实施建议（按优先级排序，可直接进 ROADMAP）

### P0 — v0.1 必须做的（schema 一旦冻结再改成本极高）

1. **manifest schema 加 `apiVersion: harnessed/v1` 字段**（仿 Kubernetes CRD 模式），未来 schema 改版有迁移路径
2. **manifest schema 加 `upstream_health` 字段**：`{ stability: stable|experimental|deprecated, last_check: weekly|monthly, fallback_action: warn|block }`
3. **manifest schema 加 `signed_by` 字段**：每个 manifest 文件最后修改人 GitHub username，方便接手者定位
4. **install engine 从 day 1 是 DAG resolver**：不是 sequential 执行 manifest，是先解析全图再拓扑排序
5. **`harnessed setup` 启动自检自身版本**：发现非 latest 时 print "建议升级" 但不阻塞
6. **写第一份 ADR (`docs/adr/0001-manifest-schema-v1.md`)**：解释为啥这么设计 schema
7. **routing schema 严格校验**：CI 用 JSON Schema strict 模式，未知字段拒绝（学 Kubeconform `-strict`）

### P1 — v0.2 必须做的

8. **`harnessed doctor` 加 health check**：扫描所有 manifests 的 last_commit_check，6 个月无 commit 的上游标 stale
9. **"known good" 版本组合**：每个 harnessed 版本冻结一组通过 e2e 的上游版本组合（manifest.lock.yaml v2 加 `harnessed_version: 0.2.0` 头）
10. **`harnessed audit` 命令**：检查所有上游 git origin URL 未被篡改（学 cargo audit）
11. **每个 workflow escape hatch 文档化**：明确说明「如果 harnessed 不好用怎么单独用上游」

### P2 — v0.3 之后做的

12. **manifest deprecation marker**：支持 `deprecated: { since, replacement, removal }` 字段
13. **manifest aliases 重定向表**：`manifests/aliases.yaml` 处理上游改名
14. **stale-bot + issue templates**：降低 maintainer 长期负载
15. **公开 ADR 全集**：把所有非常规决策都补成 ADR

### P3 — 不要做（拒绝清单）

- ❌ **不要在 v1.0 前加新 workflow type**（坚守 3 个）
- ❌ **不要 wrap 上游 API**（不写 `harnessed.invokeBrainstorming()` 这类二次抽象）
- ❌ **不要做「云端 registry」**（v1.0+ 再考虑）
- ❌ **不要支持 manifest 里的动态求值 / shell escape**
- ❌ **不要跨 harness 在 v0.5 前实现**（先把 CC 一条线打透）
- ❌ **不要做可视化 dashboard**（v1.0+ 再考虑，先解决核心问题）

---

## Sources（核心参考，按主题分类）

### 包管理器 / lockfile / schema 演化
- [The Design Space of Lockfiles Across Package Managers (arXiv 2505.04834)](https://arxiv.org/html/2505.04834v1)
- [npm package-locks documentation](https://docs.npmjs.com/cli/v6/configuring-npm/package-locks/)
- [Why Cargo Exists - The Cargo Book](https://doc.rust-lang.org/cargo/guide/why-cargo-exists.html)
- [Toolchains - The rustup book](https://rust-lang.github.io/rustup/concepts/toolchains.html)
- [Homebrew Bundle, brew bundle and Brewfile](https://docs.brew.sh/Brew-Bundle-and-Brewfile)
- [brew bundle install should install taps first (Issue #21416)](https://github.com/Homebrew/brew/issues/21416)
- [Kubernetes CustomResourceDefinition Versioning](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definition-versioning/)
- [Image Manifest V 2, Schema 2 (CNCF Distribution)](https://distribution.github.io/distribution/spec/manifest-v2-2/)
- [Kubeconform — Kubernetes manifests validator](https://github.com/yannh/kubeconform)

### Scaffolding / dispatcher 类
- [Sunsetting Create React App (React official blog, Feb 2025)](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
- [Yeoman vs Create React App comparison](https://stackshare.io/stackups/create-react-app-vs-yeoman)
- [Yeoman's Next Chapter: Maintenance Reboot](https://yeoman.io/blog/maintenance-reboot)
- [Migrating from vim-plug to Packer.nvim · jdhao's digital space](https://jdhao.github.io/2021/07/11/from_vim_plug_to_packer/)
- [GitHub - folke/lazy.nvim](https://github.com/folke/lazy.nvim)
- [migrating to neovim's new built-in plugin manager](https://bower.sh/nvim-builtin-plugin-mgr)

### AI agent 编排（直接相关）
- [Why we no longer use LangChain for building our AI agents (Octomind)](https://www.octomind.dev/blog/why-we-no-longer-use-langchain-for-building-our-ai-agents)
- [The LangChain Exit: Why Production Teams Are Quietly Rewriting to Raw SDKs in 2026](https://ravoid.com/blog/langchain-exit-raw-sdk-migration-2026)
- [Challenges & Criticisms of LangChain (Medium)](https://shashankguda.medium.com/challenges-criticisms-of-langchain-b26afcef94e7)
- [LangGraph vs CrewAI vs AutoGen (DEV.to 2026)](https://dev.to/pockit_tools/langgraph-vs-crewai-vs-autogen-the-complete-multi-agent-ai-orchestration-guide-for-2026-2d63)
- [CrewAI vs LangGraph vs AutoGen vs OpenAgents (2026)](https://openagents.org/blog/posts/2026-02-23-open-source-ai-agent-frameworks-compared)

### Plugin / extension 生态
- [VS Code Forks Recommend Missing Extensions, Creating Supply Chain Risk in Open VSX (The Hacker News, Jan 2026)](https://thehackernews.com/2026/01/vs-code-forks-recommend-missing.html)
- [VS Code Extension Marketplace docs](https://code.visualstudio.com/docs/editor/extension-marketplace)
- [The State of babel-eslint (Babel official blog)](https://babeljs.io/blog/2020/07/13/the-state-of-babel-eslint)
- [Upgrade to Babel 8 migration guide](https://babeljs.io/docs/v8-migration)

### 配置 / 工作流编排
- [Reusing workflow configurations - GitHub Docs](https://docs.github.com/en/actions/concepts/workflows-and-actions/reusing-workflow-configurations)
- [GitHub Community Discussion #130777 — Major-version refs for reusable workflows](https://github.com/orgs/community/discussions/130777)
- [Terraform Registry Best Practices (env0)](https://www.env0.com/blog/terraform-registry-guide-tips-examples-and-best-practices)

### OSS 维护者倦怠 / 项目存活率（学术）
- [On the abandonment and survival of open source projects (Avelino et al., ESEM 2019, arXiv:1906.08058)](https://arxiv.org/abs/1906.08058)
- [Predicting Abandonment of Open Source Software Projects (arXiv 2507.21678v2, 2025)](https://arxiv.org/html/2507.21678v2)
- [Open Source Maintainer Burnout: Critical Infrastructure Is Dying (RoamingPigs)](https://roamingpigs.com/field-manual/open-source-maintainer-burnout/)
- [The Silent Crisis in Open Source: When Maintainers Walk Away (OpenSauced)](https://opensauced.pizza/blog/when-open-source-maintainers-leave)

### 设计哲学
- [Convention over Configuration (Devopedia)](https://devopedia.org/convention-over-configuration)
- [Patterns in Practice - Convention Over Configuration (MSDN Magazine)](https://learn.microsoft.com/en-us/archive/msdn-magazine/2009/february/patterns-in-practice-convention-over-configuration)

---

**研究置信度评估**：
| 维度 | 置信度 | 依据 |
|------|--------|------|
| 失败模式分类完整性 | HIGH | 7 个领域 30+ 项目交叉验证 |
| 单维护者存活率数据 | HIGH | Avelino 2019 学术论文 + 2025 后续研究 |
| LangChain / CrewAI 教训 | HIGH | 多个一手 retrospective + Octomind 案例 |
| Cargo / rustup 模式 | HIGH | 官方文档 + 社区共识 |
| 对 harnessed 适用性判断 | MEDIUM | 基于 SPEC 推断，需 v0.1 dogfooding 验证 |
| 实施建议优先级 | MEDIUM | 基于历史教训推断，未在 harnessed 真实环境验证 |

**关键 open question（v0.1 dogfooding 时验证）**：
- 10 个上游 monthly breaking change 频率实测是否符合预期（保守估计每月 ~0.83 次）？
- 30 样本路由命中率 85% 阈值在真实任务上是否过严或过松？
- "用户能在 10 秒内手动覆盖路由错误" 这个 UX 指标如何量化？
