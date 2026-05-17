# harnessed — 立项参数 Spec Sheet (v3)

> 状态：✅ **Locked v3** + 🎯 **v0.2.0 MILESTONE 4/4 SHIPPED & ARCHIVED 2026-05-16** + **Phase 3.3 SHIPPED 2026-05-17** — aliases.yaml RICH 5-field redirect (D-01 schema 12th surface) + DOCTOR-ONLY-WARN install 安静 (D-02 1-line resolveAlias surgical) + doctor 7th check 人读 audit + known-good YAML manifest lazy-load 版本 lock (D-03 schema 13th surface) + STATE dual-SSOT 5-recurrence terminus COLLAPSE (D-04 (b) LOCKED) + ADR 0016 9 章节 errata 合并 + **Phase 3.2 SHIPPED 2026-05-17** — gstack 前缀探测 PROBE + workflow JINJA `{{prefix}}` 插值 + plan-feature 5-phase WIRED reference + governance.json PUSH veto halt_workflow + ADR 0015 9 章节 errata 合并 + **Phase 3.1 SHIPPED 2026-05-16** — checkpoint 引擎 TEMPLATE + archive 双轨 + harnessed resume 12th CLI + compact 75% placeholder + T4.4 closure infra activation 闭环 (D-04 WIRE-IN 实证) + ADR 0014 9 章节 errata 合并（v0.1.0 100% SHIPPED & ARCHIVED 2026-05-15；Phase 2.1 SHIPPED 2026-05-15；Phase 2.2 SHIPPED 2026-05-15 — execute-task workflow + ralph-loop full SDK integration + ADR 0011 9 章节 errata 合并；Phase 2.3 SHIPPED 2026-05-16 — extension category MVP + karpathy SKILL-ONLY 注入 + EE-5 5-question CLI gate + CD-3 negative-space arbitrate redirect + 30/30 routing 100% + ADR 0012 9 章节 errata 合并；**Phase 2.4 SHIPPED 2026-05-16** — doctor 完整版 + EE-4 plan-checker 4 维 SSOT + dashboard C 路径 3 子 FULL absorb + audit hard-fail + ralph-loop Win sentinel + ADR 0013 9 章节 errata 合并；progress 13/17 = 76.5%）
> v2 决策完成日期：2026-05-11
> v3 wedge 升级：2026-05-12（基于 phase 1.2.5 RESEARCH-1/2 + 8 支柱 100% capture + 5 P0 lock）
> 下一步：Phase 3.4 路由命中率 ≥ 85% 验收 + token budget 监控 + DEFERRED #AC/#AD/#AE 兑现 (aliases.yaml dogfood entries + install.ts package.json version read + path traversal regex 若 surface real attack vector)

---

## 1. 已敲定参数（v3 wedge 升级）

| 维度 | 决策 | 理由 |
|------|------|------|
| **项目名** | `harnessed` | 商标干净 + 单词形式 + npm/GitHub 全可注册 + 圈内人秒懂 AI agent harness 语义 |
| **定位** (v3 升级) | **完整三层栈方法论的可执行 engine — 6+ 虚拟角色 / 双职责治理 / 环境质量 / 4 心法 / 23 招式 phase 路由 / 心法-招式配对 / brainstorming-TDD 触发规则 / 6 skill category — 全部从静态 CLAUDE.md 升级为 subagent-isolated routing engine** | 不是"装配市面 skill"，是"把 CLAUDE.md 协作规则机器化"（详 ADR 0006）|
| **目标用户** | 开源社区（非商业化，GitHub Sponsors 兜底） | |
| **跨 harness** | 架构保留多 harness 抽象层，**Claude Code 先行** | 全做工作量指数级，CC 用户基数最大 |
| **实现语言** | Node.js + TypeScript | (a) CC 用户 100% 有 Node；(b) `npx <pkg>@latest setup` 是生态事实标准；(c) 大多数被 orchestrate 的组件本身是 npm 包；(d) 跨 harness 时其他 harness 也是 Node 生态 |
| **集成模型** | **方案 Z (Composition Skill)** — 不 vendor 上游代码（v3 强化：base + extension 叠加，extension 走 routing engine 按需装）| License 0 负担、上游升级自动收益、品牌内聚、轻量 |
| **MVP workflow** | `research` → `execute-task` → `plan-feature`（**按 v0.1→v0.3 递增 ship**，不砍范围） | 每个版本验证一类核心能力，风险分摊 |
| **License** | **Apache-2.0**（v2 升级自 MIT）| 专利授权明确，适合「路由元规则 / composition schema」类 IP |
| **命名空间** | `/harnessed:*` 完整前缀 | 可读 > 短，撞名风险归零 |
| **路由机制** | **B+C 混合**（已 ship phase 1.1-1.2）+ **Main-Process-Driven Routing Engine**（v3 新加，phase 1.4 ship）：base layer 用 B+C 命令路由；extension layer 用 routing engine 决策路由（DMN Priority Hit Policy + L2 LLM Supervisor fallback）| ADR 0006 + GRAY-AREA-1 |
| **发布渠道** | npm + Claude Code marketplace 双轨 | MVP 双轨即可 |
| **持续性** | GitHub Sponsors + 6 个月 co-maintainer 招募窗口；无应招者则进入 maintenance-only | 单点维护风险显式兜底 |

### 1.1 v3 Wedge 升级要点（新加 — ADR 0006 lock）

**之前 wedge** (v1-v2): "AI coding harness 生态的「装配主义包管理器 + composition orchestrator」— 不 vendor 上游代码"

**v3 wedge**: "**完整三层栈方法论的可执行 engine** — 把用户 CLAUDE.md 里写好的协作规则（gstack 6+ 角色 / GSD orchestration / superpower brainstorming+TDD / karpathy 4 心法 / mattpocock 23 招式 / 心法-招式配对 / 6 skill category × decision rules）从**静态文档**升级为 **subagent-isolated routing engine** 机器化执行"

**双层架构**:
- **Base Layer** (phase 1.1-1.2 已 ship)：10 固定 manifest + 3 workflow MVP + B+C 命令路由 → `harnessed install --base` 一键装齐
- **Extension Layer** (phase 1.3+ 加)：6 大 category × M 候选 + decision rules + curate criteria → main-process-driven routing engine 按需 install + invoke

**核心 wedge 守恒**: 不 vendor 上游 prompt（违反 wedge）；只编码 *何时触发* + *如何决策*（routing logic）；subagent 仅 invoke 已注入 skill。

---

## 2. 上游依赖清单（v3 双层架构）

### 2.1 Base Layer (phase 1.1-1.2 已 ship — 不动)

每个 workflow 隐式声明依赖，setup 引擎自动解析依赖图。

| 上游 | 类型 | workflow 引用 | 安装方式 | 锁版本策略 |
|------|------|--------------|---------|-----------|
| **gstack** | CC skill-pack（开源 93.5k★）| plan-feature | `git clone + ./setup` | git commit hash |
| **GSD** | CLI npm（开源 61.4k★）| plan-feature, execute-task | `npx get-shit-done-cc@latest` | git commit hash |
| **superpowers** | CC plugin（开源 186k★）| plan-feature, execute-task | `claude plugin install`（marketplace）| git commit hash |
| **planning-with-files** | skill 包 | plan-feature | `claude plugin install` 或 `npx skills@latest add` | git commit hash |
| **mattpocock-skills** | skills 集合（开源 70.6k★）| execute-task | `npx skills@latest add mattpocock/skills` | git commit hash |
| **karpathy-skills** | **behavior-rule** | execute-task | `npx skills@latest add` + CLAUDE.md merge | git commit hash |
| **ralph-loop** | CC plugin（开源）| execute-task | `claude plugin install` | git commit hash |
| **Tavily MCP** | MCP server (本地 npm) | research | `claude mcp add --scope project` + npx | `^minor` |
| **Exa MCP** | MCP server (本地 npm) | research | `claude mcp add --scope project` + npx | `^minor` |
| **ctx7** | CLI (npm global) | research | `npm i -g` 或 `npx`（fallback）| `^minor` |

### 2.2 Extension Layer (phase 1.3+ — 6 大 category × M 候选)

每个 extension skill 通过 manifest `category` + `decision_rules` 字段声明（ADR 0007 errata 加，A7 守恒不动 0001）；routing engine 按 task 上下文决定 install + invoke。

详尽候选库见 `RESEARCH-2-skill-ecosystem.md` § 1 + `GRAY-AREA-1-routing-engine.md` § 3 (6 category × decision rules schema)。

| Category | Base 已含 (phase 1.1-1.2) | Extension 候选 (phase 1.3+ 按需装) | Decision rule anchor |
|---|---|---|---|
| **meta** | (none) | skill-creator (anthropics) + find-skills (vercel-labs) | 创建 → skill-creator / 搜索 → find-skills |
| **engineering** | gstack + GSD + superpower + planning-with-files + mattpocock + karpathy + ralph-loop | (engineering 类已被 base 全覆盖) | 详 GRAY-AREA-3 § 3.3 mattpocock 5 phase × 18 active 命令 |
| **design** | (none) | ui-ux-pro-max (midwayjs/midway/.codex) + frontend-design (anthropics) | 默认 ui-ux-pro-max；override "做出风格" → frontend-design 主导 |
| **content** | (none) | pptx + docx + xlsx + pdf (anthropics) + baoyu-skills 21 (jimliu — license: None warn) | .pptx → pptx；中文 deck → baoyu (license warn)；微信微博 → baoyu-post-* |
| **testing** | (none) | webapp-testing (anthropics) + playwright-cli (microsoft) + @playwright/test (npm) + chrome-devtools-mcp (ChromeDevTools) | perf/a11y/memory → chrome-devtools-mcp 强制；E2E+Python → webapp-testing；E2E TS → @playwright/test；探查 → playwright-cli |
| **search** | tavily-mcp + exa-mcp（已 base） | (search 类已被 base 覆盖；可选其他 search MCP) | 默认 tavily；学术/描述式/批量 URL/token 敏感 → exa；整站抓 → tavily 强制 |

**Manifest type 覆盖（v3 仍 4 种）**：`cc-plugin` / `cc-skill-pack` / `mcp-npm` / `cli-npm`（ADR 0001 不动；A7 守恒）

**Manifest install method 覆盖（v3 仍 6 种）**：详 ADR 0003 errata。

**Manifest install_type 字段（v3 新加，走 ADR 0007 errata）**：`skill | mcp | npm | git`（区分 skill / MCP server / npm / git 4 种安装路径，因 chrome-devtools-mcp 是 MCP 不是 skill — D1.2.5-12）

**Manifest category 字段（v3 新加，走 ADR 0007 errata）**：`meta | engineering | design | content | testing | search`（A8' 6 大 category）

**Manifest decision_rules 字段（v3 新加，走 ADR 0007 errata）**：optional YAML 块，含 `trigger` / `default_expert` / `arbitration_rule` / `override_signals` 字段（详 GRAY-AREA-1 § 2 schema）

---

## 3. 设计哲学（从 CLAUDE.md 提炼）

1. **不 vendor**：上游代码永不进仓库，只声明「在哪、怎么装、怎么用」
2. **包管理器思维**：`harnessed install` 像 `brew bundle install` — idempotent、可重入、可 doctor
3. **路由 > 组件**：项目 80% 价值在 `routing/*.md` 和 `workflows/*.skill.md`，不在 manifests
4. **karpathy simplicity**：最小有效代码，避免不必要复杂度
5. **强意见**：用户面对 `/harnessed:*` 统一入口，路由由 harnessed 决定（**配套：每次路由决策必须可见输出，透明度优先**）

---

## 4. 仓库架构（4 层 + runtime 目录）

```
harnessed/                            # 项目仓库
├── manifests/                        # Layer 1: 外部依赖描述（install + check）
│   ├── tools/                        # 纯工具类: github-mcp, tavily, code-review, playwright...
│   └── skill-packs/                  # 流程包: superpowers, gsd, mattpocock...
├── workflows/                        # Layer 2: ★核心价值★ composition skills
│   ├── SCHEMA.md                     # 【新】phases schema 标准定义（§ 10）
│   ├── plan-feature/                 # /harnessed:plan-feature
│   ├── research/                     # /harnessed:research
│   └── execute-task/                 # /harnessed:execute-task
├── routing/                          # Layer 3: 路由元规则（SSOT，§ 9）
│   ├── SCHEMA.md                     # 【新】routing yaml schema
│   ├── ui.md
│   ├── testing.md
│   └── search.md
├── config-templates/                 # Layer 4: 配置注入
│   ├── statusline.json
│   ├── hooks/                        # 必须纯 yaml/md，禁 shell（§ 8.3）
│   └── claude-md-block.md
├── vendor/                           # 例外：仅必要时
│   └── ENTRY-CRITERIA.md             # 【新】vendor 准入门槛（§ 8.2）
├── src/                              # 引擎实现 (TS)
│   ├── installers/                   # 各 type 的安装器
│   ├── doctor/
│   ├── routing-engine/               # B+C 混合路由实现
│   └── checkpoint/                   # 【新】checkpoint-based execution（§ 12）
├── manifest.lock.yaml                # 【新】上游版本锁（§ 5.5）
├── tests/
└── package.json
```

```
<user-project>/.harnessed/             # 用户项目运行时目录（由 setup 创建）
├── current-workflow.json              # 当前活跃 workflow + phase
├── checkpoints/                       # 摘要 — 进 context（§ 12）
│   ├── 01-decision.md
│   ├── 02-design-memo.md
│   └── ...
├── archive/                           # 详情 — 不进 context，仅供回溯
│   └── 01-decision-full.md
├── routing-cache.json                 # 路由决策缓存
└── .harnessed-backup/                 # rollback 备份（CLAUDE.md/settings.json/hooks）
```

---

## 5. ✅ 已决决策记录（原 § 5 未决项已全部锁定）

### 5.1 路由机制 → **B+C 混合方案**

```
默认层 (B): workflows/*.skill.md 强声明 description
          → 从 routing/*.md 的 soft_hint.description_template 自动生成
          
硬路由层 (C): UserPromptSubmit hook 解析意图
            → 关键路径（ui / testing / search）注入 routing hint
            → 从 routing/*.md 的 trigger / hard_route 决策
            → hook 失败时降级回 B（不阻塞用户）

跨 harness 时 (v0.2+): 砍 C 层只留 B；命中率降至 50-55%（Sonnet）/ 0-20%（Haiku），损失 30-50%（model-dependent）换跨平台
```

**验收标准**：v0.4 ship 前在 30 个真实任务样本上达成路由命中率 ≥ 85%。30 样本必须覆盖 model 差异（Haiku / Sonnet / Opus 各 ≥ 8 样本）+ token budget 监控（skill description 总和不超 1% context window）。

> 实测数据来源（R03 § 2.4）：B 层（仅 description）触发率 Sonnet 50-55%、Haiku 0-20%；B+C 混合 Sonnet 100%（22 样本）、Haiku 84%（200+ 样本）。

### 5.2 命名空间 → `/harnessed:*` 完整前缀

可读 > 短。`/h:*` 易撞名（多个 plugin 都用 h 开头），`/hn:*` 折中但不直观。

### 5.3 跨 harness → **先 CC，留接口注释，不实现**

YAGNI。manifest schema 在 `type` 字段保留 `cc-plugin / cc-skill-pack` 命名（不写死 cc-only），第二个 harness 真出现时再 retrofit `codex-plugin` 等。

### 5.4 发布渠道 → **npm + CC marketplace 双轨（MVP）**

GitHub Releases / Homebrew tap 推 v2+。

### 5.5 上游版本锁 → **4 类分别处理 + manifest.lock.yaml + weekly CI**

| 上游类型 | 锁版本策略 | 理由 |
|---------|----------|------|
| CC plugin | **git commit hash** | plugin 没有 npm 版本概念 |
| skill 包（git clone 来源） | **git commit hash 或 tag** | 同上 |
| MCP server (npm) | **`^minor`**（如 `^1.4.0`） | npm 生态约定 |
| CLI（ctx7） | **`^minor`** | 同上 |

**配套**：

- `manifest.lock.yaml` 记录每个上游锁定版本
- weekly CI 在 GitHub Actions free tier 跑：取上游 latest → critical path e2e → 通过则 PR 更新 lock，失败则发 issue 不动 lock
- `harnessed upgrade` 输出 changelog diff，用户 explicit confirm

### 5.6 商业模式 → **GitHub Sponsors only（MVP）+ Apache-2.0 保留未来弹性**

不在 MVP 阶段为变现分心。Apache-2.0 不阻碍未来 enterprise plugin。

---

## 6. 与 ECC 的差异化（vs Everything Claude Code）

| 维度 | ECC | harnessed |
|------|-----|-----------|
| 哲学 | All-in-one 自建（30 agents/135 skills/60 commands） | 装配主义（manifest + composition skill） |
| 仓库大小 | 大（自家组件全集） | 小（< 100 个 markdown skill + TS 引擎） |
| 上游依赖 | 0（自给自足） | 有（manifest 描述） |
| 上游升级 | 不受影响 | 自动受益 / 可能踩 breaking change |
| 用户学习成本 | 学 ECC 一套 | 学 harnessed workflow，底层透明 |
| 跨 harness | ✅ 8 个 | 架构保留，CC 先行 |
| 维护者 | 单人 + 商业化 | 开源社区 + GitHub Sponsors |

**核心差异化**：harnessed **不和 ECC 竞争组件库地位**，而是定位为「**组件市场的 dispatcher**」— 类比 Linux 包管理器之于发行版。

**Wedge（一句话）**：「不让你卸 ECC，让你按需装配」。

---

## 7. 风险登记（v2.1 已根据 4 份调研修订）

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 上游 breaking change 塌方 | **高** ⬆ | 高 | manifest.lock.yaml + weekly CI + 4 类版本策略（§ 5.5）+ `tested_with_versions` 字段 |
| Harness.io 商标投诉 | 低 | 中 | README "Not affiliated with Harness Inc." disclaimer |
| 命名冲突 | 高 | 低 | `/harnessed:*` 前缀 + conflicts.yaml 显式仲裁 |
| License 兼容性 | 低 | 高 | NOTICES.md + vendor whitelist（§ 8.2） |
| 价值证明不足 | 中 | 高 | dogfooding benchmark v0.4 ship 前进 README |
| Composition skill 触发不准 | 中 | 高 | B+C 混合 + 30 样本命中率 ≥ 85%（已被 R03 实测证实） |
| 单点维护（bus factor 1） | 中 | **高** ⬆ | GitHub Sponsors + 6 月 co-maintainer 窗口 + 降低 fork 成本（schema 数据化 + ADR 公开 + CI 自动化）— Avelino 2019 实证单 maintainer 年掉队率 36% |
| 供应链风险（npm registry） | 低 | 中 | install 默认 dry-run + diff 预览 + explicit confirm + manifest `signed_by` |
| Hook 注入安全 | 低 | 高 | hook 配置数据化 + 自带脚本严格审计（§ 8.3） |
| **【新】抽象层成为枷锁（用户绕不开 harnessed 时弃用）** | 中 | 高 | escape hatch（每个 workflow 可绕开直调上游）+ 透明度（每步可见可改）— Octomind 弃用 LangChain 教训 |
| **【新】上游 deprecate / rename 静默失败** | 中 | 中 | manifest 必填 `upstream_health` + doctor weekly 检查 + deprecation marker + `manifests/aliases.yaml` |
| **【新】范围蔓延变 meta-PM** | 中 | 高 | feature request 三问 + v1.0 前 freeze workflow 数量为 3（拒绝清单） |
| **【新】拓扑解析缺失导致 install 顺序错乱** | 高 | 中 | install engine **Day 1 是 DAG resolver**，循环依赖 schema 校验拒绝 — brew bundle issue #21416 教训 |
| **【新】装机即过期（用户用旧版本却不知道）** | 高 | 中 | `harnessed setup` 启动自检 + 推 `npx@latest` + version skew 警告 — CRA 教训 |

---

## 8. 工程纪律（硬约束 — CI 守门）

### 8.1 manifest schema v1 先于代码冻结

第一行 installer 代码前，manifest schema v1 必须 tag 锁定。后续改 schema = 所有 manifest 文件 migration，成本极高。schema 变更走 ADR 流程。

### 8.2 vendor/ 准入门槛（vendor/ENTRY-CRITERIA.md）

```yaml
mandatory:
  - license: [MIT, Apache-2.0, BSD-3-Clause, ISC, 0BSD]   # whitelist
  - upstream_archived_or_unmaintained: true                # 上游必须已停摆
  - vendor_size_max_kb: 500                                # 单个 vendor ≤ 500KB
  - vendor_owner_signed: true                              # PR 必须 maintainer 显式签字
forbidden:
  - GPL / AGPL / SSPL 上游
  - binary 二进制
```

CI 跑 vendor/ 体积监控，超限自动 fail。

### 8.3 hook 配置数据化 + 自带脚本严格审计

UserPromptSubmit hook（B+C 混合的 C 层）= 任意代码执行入口（CC hook 体系仅 5 种 type — `command/http/prompt/mcp_tool/agent`，最常用 `command` 必然 spawn 子进程；"纯 yaml hook" 在 CC 体系内不存在）。约束：

1. **routing/*.md（hook 配置）必须纯 yaml/markdown** — 数据驱动，无可执行逻辑
2. **harnessed 自带的 hook 脚本严格受控** — 用 Node.js 内置 `fs` / `child_process` 受控调用；禁动态 shell escape（无 `eval` / `${shell command}` / `!ruby/regexp`）
3. **install 时 print 全部 hook 脚本代码 + 配置 diff**（100% 透明，用户可逐字 review）
4. **1-key uninstall** 完全清理 settings.json hook entry + 所有 script files（无残留）
5. **routing-cache.json 纯数据** — 绝不包含可执行代码或路径
6. **企业 `allowManagedHooksOnly` 场景**：检测到时自动 detect + 警告 + 退化到纯 B 层（v0.4 cross-OS 阶段处理）

### 8.4 setup 写用户文件前必须 explicit confirm

setup 会改 user `CLAUDE.md` / `settings.json` / hooks，必须：

- dry-run 预览 diff
- `.harnessed-backup/` 存 rollback 副本
- explicit confirm，不允许默认 yes

**MCP server 修改强制走 CLI**：所有 mcpServers 修改必须用 `claude mcp add/remove` CLI，禁止直接编辑 `~/.claude.json`（CC issue #15797：直接编辑会丢配置）。MCP installer 必须强制 `--scope project`（避开 v2.1.122 user scope bug — CC issue #54803 已知未修）。所有 MCP server 配置写到项目 `.mcp.json`，不写 user scope。

### 8.5 所有降级显式告知用户

上游不可用 fallback 到备选时，必须 print 降级原因，禁止「静默跳过」。

---

## 9. 路由 SSOT Schema（routing/*.md 格式）

**B+C 混合方案的实现关键**：B 层与 C 层共享同一份 yaml frontmatter，避免双轨维护。

```yaml
# routing/ui.md
---
trigger:
  keywords: [ui, ux, frontend, layout, design, 前端, 界面, 设计稿]
  file_globs: ["**/*.tsx", "**/*.vue", "**/*.css", "**/*.scss"]

hard_route:                       # C 层 hook 读这块
  primary: ui-ux-pro-max
  secondary: frontend-design
  override:
    condition: "用户明确说'做出风格'/'要风格'/'独特设计'"
    primary: frontend-design
    secondary: ui-ux-pro-max

soft_hint:                        # B 层 skill description 自动生成
  description_template: "标准化、数据驱动的 UI 设计；优先于 frontend-design 用于布局/规范类任务"

fallback:
  on_hook_fail: degrade_to_soft_hint     # hook 失败时降级回 B 层
  on_both_fail: prompt_user              # 都失败时直接问用户
---

# 人类可读的路由说明（markdown 部分）
（详细规则、边界场景、历史决策……）
```

**好处**：

1. 改一处两层同步生效
2. CI 校验 routing schema 合法性
3. 用户读 markdown 部分学习路由逻辑；引擎读 frontmatter 自动决策
4. 跨 harness 时砍 `hard_route` 块即可，`soft_hint` 跨平台通用

---

## 10. Workflows Phases Schema（workflows/*/SKILL.md frontmatter 标准）

**plan-feature 作为 reference implementation**，所有 workflow 套这个 schema：

```yaml
# workflows/plan-feature/SKILL.md
---
name: plan-feature
namespace: /harnessed:plan-feature
phases:
  - id: 01-gstack-decision
    layer: governance              # 三层栈：governance / orchestration / execution
    upstream: gstack
    invokes: [/office-hours, /plan-ceo-review, /plan-eng-review]
    inputs: [user_request]
    outputs: .harnessed/checkpoints/01-decision.md
    pause: human_review
    on_veto: halt_workflow

  - id: 02-brainstorm
    layer: execution
    upstream: superpowers
    invokes: [brainstorming]
    inputs: [user_request, $01.outputs]
    outputs: .harnessed/checkpoints/02-design-memo.md
    conditional:
      if: ui_task_detected         # 来自 routing/ui.md
      then_also_invoke: [ui-ux-pro-max]

  - id: 03-gsd-discuss
    layer: orchestration
    upstream: GSD
    invokes: [/gsd-discuss-phase]
    inputs: [$01.outputs, $02.outputs]
    outputs: gsd_phase_doc

  - id: 04-gsd-plan
    layer: orchestration
    upstream: GSD
    invokes: [/gsd-plan-phase]
    inputs: [$03.outputs]
    outputs: [PLAN.md, ROADMAP.md, REQUIREMENTS.md]

  - id: 05-persist
    layer: execution
    upstream: planning-with-files
    inputs: [$04.outputs]
    outputs: [task_plan.md, progress.md, findings.md]
    pause: human_review
---
```

**Schema 字段定义**（标准化在 `workflows/SCHEMA.md`）：

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `id` | ✅ | string | 阶段 id（`NN-name` 格式） |
| `layer` | ✅ | enum | `governance` / `orchestration` / `execution`（三层栈） |
| `upstream` | ✅ | string | 依赖的上游名（必须在 manifests/ 中存在） |
| `invokes` | ✅ | array | 调用的具体命令 / skill |
| `inputs` | ✅ | array | 引用前阶段产出（`$NN.outputs` 语法） |
| `outputs` | ✅ | string\|array | 产出文件路径 |
| `pause` | optional | enum | `human_review` 时阻塞等用户 approve |
| `on_veto` | optional | enum | 用户拒绝时行为：`halt_workflow` / `rollback_to_phase_N` |
| `conditional` | optional | object | 条件触发（如 ui_task_detected） |

**收益**：每阶段 idempotent、可单步重跑、session 断了能从最近 checkpoint 恢复、`harnessed status` 可视化当前 phase。

---

## 11. Ship 节奏与版本规划

**保留 3 个 workflow 全部范围，按复杂度递增 ship**：

| 版本 | 周期 | 内容 | 验证目标 |
|------|------|------|---------|
| **v0.1.0** | **3-5 周** (v3 扩大范围 — 含 phase 1.3 + 1.4 + 1.5) | base profile + manifest 引擎 + setup/doctor + `research` workflow + categorization schema (ADR 0007 errata) + routing engine v1 (main-process-driven) + DAG + Semantic Router + cross-OS 基线 + ADR 0001 / 0002 / 0006 | 6 install method 全部覆盖 base 7 上游 + decision_rules.yaml v1 + 6 category routing engine MVP + 三平台 e2e + 8 支柱 100% capture verify |
| **v0.2.0** | 2-3 周 | + `execute-task` workflow + ralph-loop 编排 + 剩 2 种 installer（cc-plugin-marketplace + npx-skill-installer/git-clone-with-setup）+ harnessed doctor 健康检查 + harnessed audit | 子任务级编排（高频场景）+ TDD 集成 + Windows ralph-loop fix（jq+bash 路径） |
| **v0.3.0** | 3-4 周 | + `plan-feature` workflow + 三层栈编排 + checkpoint 机制 + B+C 路由实测命中率 ≥ 85% + gstack 命令前缀探测 + manifests/aliases.yaml | 长链路 + pause 点 + 跨 phase 状态传递 |
| **v0.4.0** | 2-3 周 | dogfooding benchmark + co-maintainer 招募 + 路由透明度日志 + GitHub Sponsors 启用 | 进入稳定期 |

**总工期 ~14 周**（单人保守估）。每 3-4 周一个版本，社区反馈早 + 风险分摊到 4 个里程碑。

---

## 12. Checkpoint-Based Execution（解决长链路上下文腐烂）

**问题**：plan-feature 走完 4 个上游产出累计 30k+ token，单 session 必爆 context。

**方案**：分层 markdown — 摘要进 context，详情留磁盘。

```
.harnessed/
├── current-workflow.json          # 当前 phase
├── checkpoints/                   # 摘要（< 1k token/file）— 进后续阶段 context
│   ├── 01-decision.md             # gstack 输出压缩到核心结论
│   ├── 02-design-memo.md
│   ├── 03-gsd-discuss-summary.md
│   └── 04-plan-summary.md
└── archive/                       # 完整原始产出 — 不进 context，仅供回溯
    ├── 01-decision-full.md
    └── ...
```

**关键设计**：

1. 后续阶段**只读 checkpoint，不读 archive**
2. 每个 pause 点强制 compact — workflow 引擎在写入 checkpoint 时自动调用上游 `summarize` 能力（如有），否则保留前 N 行 + 末尾结论
3. session 中断时 `harnessed resume` 从 `current-workflow.json` 找到当前 phase，重读 checkpoint，继续执行

这是 planning-with-files 思想的延伸：不只是「写 markdown 解决腐烂」，而是「分层 markdown：摘要 vs 详情」。

---

## 13. 下一步

1. ✅ gstack `/autoplan` 三关卡完成（2026-05-11）
2. ⏳ **本次进行中**：GSD `/gsd-new-project` 立项
   - 4 个 gsd-project-researcher 并行调研 domain ecosystem
   - gsd-research-synthesizer 综合
   - gsd-roadmapper 创建 roadmap
3. ⏳ planning-with-files 落地 `task_plan.md` / `progress.md` / `findings.md`
4. ⏳ phase 1（v0.1.0）实现：manifest schema v1 冻结 → setup/doctor 引擎 → `research` workflow
