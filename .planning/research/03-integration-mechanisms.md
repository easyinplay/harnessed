# Research 03 — Integration Mechanisms

> harnessed v0.1 立项调研 / Integration mechanisms domain
> 调研日期：2026-05-11
> 调研者：gsd-project-researcher #3
> 范围：4 种 manifest type 的真实 install / detect / uninstall 机制 + 路由可行性 + manifest schema v1 草案
> 整体置信度：**HIGH**（核心结论均有 Anthropic 官方文档支撑）

---

## 摘要（200 字）

四种 manifest type 在 Claude Code (CC) 生态中均有官方支持的安装路径，但成熟度差异显著：**plugin 最完整**（`claude plugin install`、`marketplace.json`、`ref + sha` 双重锁版本）；**MCP server 次之**（`claude mcp add` 三 transport，但 user scope 在 v2.1.122 有读写不一致 bug，必须 project scope `.mcp.json` 兜底）；**skill pack 半成熟**（filesystem-based、纯文件夹结构，但**社区实测 description 触发率仅 50-55%（Sonnet）/ 0-20%（Haiku）**，必须 B+C 混合）；**CLI npm 最朴素**（`npm i -g` + `npx`，跨平台用 `is-installed-globally` + `which` package 检测）。**UserPromptSubmit hook 真实可用**：stdout exit 0 唯一被注入为 context、官方推荐用于 prompt 增强、社区实测加 hook 后命中率从 50% → 84-100%。完整 manifest schema v1 草案见正文末尾。

---

## 1. CC plugin type（`cc-plugin`）

### 1.1 官方安装路径（HIGH confidence）

**命令真实存在**：

```bash
# 在 Claude Code 会话内（slash command）
/plugin marketplace add <owner/repo>          # 添加 marketplace
/plugin install <plugin-name>@<marketplace>   # 安装 plugin
/plugin marketplace remove <name>             # 移除 marketplace
/reload-plugins                               # 安装后激活

# CLI 命令（终端外）
claude plugin install <plugin>                # CLI 直装
claude plugin uninstall <plugin> [--prune] [--keep-data]
claude plugin enable <plugin>
claude plugin disable <plugin>
```

支持的 marketplace source：
- GitHub `owner/repo` 形式
- 任意 git URL（GitLab / Bitbucket / 自托管）
- 本地路径（指向 `marketplace.json`）

### 1.2 文件落地位置

plugin 安装后会被复制到本地 cache（不直接从 git 路径读，安全考虑）：

```
~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/   # plugin 文件
~/.claude/plugins/installed_plugins.json                     # 已装注册表
~/.claude/settings.json   → enabledPlugins                   # user-level 启用
~/.claude/settings.local.json → enabledPlugins               # local-level 启用
```

**重要：cache 是按版本隔离的**。每个版本一个目录，旧版本在卸载/更新后 7 天内被自动 GC（grace period 让并发 session 不崩）。

### 1.3 检测已安装（HIGH confidence）

最可靠的 4 步检测：

1. 检查 `~/.claude/plugins/installed_plugins.json` 有无对应 entry
2. 检查 `~/.claude/settings.json` `enabledPlugins` 字段
3. 检查 `~/.claude/settings.local.json` `enabledPlugins` 字段
4. 检查 cache 目录 `~/.claude/plugins/cache/<marketplace>/<plugin>/` 是否存在

**已知坑**：`/plugin` TUI 卸载不可靠（github issue #52456）—— TUI 经常残留 4 个状态位中的至少 1 个，导致下次启动 plugin 重新出现。**harnessed 必须用 CLI `claude plugin uninstall`，禁用 TUI 路径**。

### 1.4 版本锁机制（HIGH confidence）

`marketplace.json` 中 plugin source 支持双字段：

```json
{
  "name": "my-plugin",
  "source": {
    "source": "github",
    "repo": "owner/plugin-repo",
    "ref": "v2.0.0",                                          // tag/branch
    "sha": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"        // 精确 commit
  }
}
```

**关键区分**：
- marketplace **source** 只支持 `ref`
- plugin **source** 同时支持 `ref` + `sha`
- **`sha` 优先生效**，是 production 推荐方式（Anthropic 官方原话："This is the recommended approach for production environments"）

→ harnessed 的 `manifest.lock.yaml` 对所有 cc-plugin 类型应**强制使用 sha**，对应 SPEC § 5.5 的"git commit hash"决策。

### 1.5 marketplace 审核机制（MEDIUM confidence）

- 官方 marketplace `anthropics/claude-plugins-official` 默认开启 auto-update
- 第三方 marketplace 默认关闭 auto-update（用户 explicit 触发）
- **没有审核流程**：任何人可发布 marketplace，用户安装风险自担
- Anthropic 通过保留名（`claude-code-marketplace`、`anthropic-plugins` 等）防止冒名顶替
- 安全模型："Plugins and marketplaces are highly trusted components that can execute arbitrary code on your machine with your user privileges. Only install plugins and add marketplaces from sources you trust"

→ **harnessed 自己能不能发布 plugin / marketplace**：能。建议同时发：
1. 自己的 marketplace `harnessed-org/harnessed-marketplace`（聚合 harnessed plugin + 推荐 plugin）
2. 主项目作为 plugin 发布（本身是个 composition skill 集合）
3. 走 `/plugin marketplace add harnessed-org/harnessed-marketplace` + `/plugin install harnessed@harnessed-marketplace`

### 1.6 plugin 内部结构

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json       ← manifest（必须，且仅放这一个）
├── skills/               ← 自动注册为 /<plugin-name>:<skill-name>
│   └── code-review/
│       └── SKILL.md
├── commands/             ← 简单 markdown command
├── agents/               ← subagent
├── hooks/
│   └── hooks.json        ← plugin 提供的 hook
├── .mcp.json             ← plugin 自带 MCP server
├── bin/                  ← 加入 PATH
└── settings.json         ← 默认 settings
```

namespace 自动加前缀：`quality-review-plugin` 的 `hello` skill → `/quality-review-plugin:hello`

### 1.7 示例 manifest（cc-plugin）

```yaml
type: cc-plugin
name: gstack
display_name: gstack (Virtual Startup Team)
upstream:
  source: github
  repo: gstack-org/gstack
  marketplace: gstack-org/gstack-marketplace      # 可选；不写则直接 git
  plugin_id: gstack                                # 在 marketplace 中的 plugin name
lock:
  ref: v1.4.0
  sha: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0   # 必填（SPEC § 5.5）
install:
  method: claude_plugin_marketplace                # 走官方 marketplace
  commands:
    - "/plugin marketplace add gstack-org/gstack-marketplace"
    - "/plugin install gstack@gstack-marketplace"
detect:
  files:
    - "~/.claude/plugins/installed_plugins.json#gstack"
    - "~/.claude/plugins/cache/gstack-marketplace/gstack/v1.4.0/.claude-plugin/plugin.json"
  settings_keys:
    - "~/.claude/settings.json:enabledPlugins.gstack"
provides:
  commands: ["/office-hours", "/plan-ceo-review", "/plan-eng-review", "/autoplan", "/review"]
  skills: []
  hooks: []
uninstall:
  method: claude_plugin_cli
  command: "claude plugin uninstall gstack --prune"
  manual_cleanup_paths:                            # CLI 失败时的 fallback
    - "~/.claude/plugins/cache/gstack-marketplace/gstack/"
    - "settings.json:enabledPlugins.gstack"
```

---

## 2. CC skill pack type（`cc-skill-pack`）

### 2.1 skill vs plugin 的真实区别（HIGH confidence）

**skill 可以脱离 plugin 单独存在**：

| 来源 | 路径 | 触发名 |
|------|------|--------|
| user-level | `~/.claude/skills/<name>/SKILL.md` | `/<name>` |
| project-level | `.claude/skills/<name>/SKILL.md` | `/<name>` |
| plugin-bundled | `<plugin>/skills/<name>/SKILL.md` | `/<plugin>:<name>` |

**优先级**：project > user（同名 skill 时 project 覆盖）。

### 2.2 SKILL.md frontmatter（HIGH confidence）

```yaml
---
name: pdf-processing                    # 必填，≤64 字符，小写字母数字连字符
description: |                          # 必填，≤1024 字符，第三人称
  Extract text and tables from PDF files, fill forms, merge documents.
  Use when working with PDF files or when the user mentions PDFs, forms,
  or document extraction.
disable-model-invocation: false        # 可选；true = 仅用户能调用（适合 /commit /deploy）
user-invocable: true                   # 可选；false = 仅 Claude 自动调用（适合背景知识）
---

# Markdown 内容（≤5k token，触发后才加载）
```

### 2.3 触发机制：基于 description 的语义匹配 + 进度披露（HIGH confidence）

Anthropic 官方机制（"progressive disclosure"）：

1. **session 启动时**：CC 扫描所有 SKILL.md，每个 skill ~100 tokens（name + description）注入 system prompt
2. **用户提交 prompt**：模型读 `available_skills` 列表，**自主决定**是否调用 skill
3. **触发后**：CC 用 bash 读 SKILL.md 全文（≤5k token）入 context；引用的辅助文件再按需读

**核心：description 是唯一触发依据**。这是语义匹配（LLM 决策），不是关键词匹配，**也不是确定性的**。

### 2.4 触发命中率（社区实测 — MEDIUM-HIGH confidence）

⚠️ **这是 spec § 5.1 决策的关键证据**：

| 模型 | 仅 description（B 层） | + UserPromptSubmit hook（B+C 混合） |
|------|----------------------|-----------------------------------|
| Haiku 4.5 | 0-20% | 84% |
| Sonnet 4.5 | 50-55% | 100%（22 测试样本） |
| Opus 系列 | ~55% baseline | ≥85%（推算） |

社区测量 200+ prompts 实测：纯 skill ≈ 20%, 加 hook 跳到 84%（Scott Spence）。

**根因**：
1. **token budget overflow** —— description 总和超 1% context window 时被静默截断
2. **probabilistic retrieval** —— 模型自主决策，不是确定性 RAG
3. **under-trigger 倾向** —— Anthropic 官方都建议 "make descriptions a little bit pushy"

→ **直接证实 spec § 5.1 B+C 混合 + 30 样本 ≥ 85% 验收的合理性**。

### 2.5 Description 编写最佳实践（HIGH confidence）

官方推荐：
- 第三人称（描述 skill 做什么 + 何时使用）
- 包含明确的触发关键词
- "Be slightly pushy" —— 加 "ALWAYS invoke when..." / "Use when..."
- 避免 "Helps with X"（太泛）；用 "Runs the project's pytest suite when..."（具体）

社区数据：从 30% → 95% 命中率提升来自 description 优化。

### 2.6 多 skill 同名 / description 重叠

- **同名**：project > user > plugin namespace（plugin skill 自动加 `<plugin>:` 前缀避免冲突）
- **description 重叠**：CC 不仲裁，模型自主选；harnessed 应通过 routing/*.md SSOT + `/harnessed:` namespace 显式仲裁

### 2.7 detect skill pack（HIGH confidence）

```bash
# user-level
ls ~/.claude/skills/<name>/SKILL.md

# project-level
ls .claude/skills/<name>/SKILL.md

# plugin-bundled（间接）
检查 plugin 已安装 + plugin 目录下 skills/<name>/SKILL.md
```

programmatic：扫描目录 + 解析 frontmatter（YAML），无 SDK API。

### 2.8 示例 manifest（cc-skill-pack）

```yaml
type: cc-skill-pack
name: karpathy-skills
display_name: Andrej Karpathy Coding Mindset Skills
upstream:
  source: github
  repo: ai-coding/karpathy-skills
lock:
  ref: main
  sha: f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2c1d0   # SPEC § 5.5 必填
install:
  method: git_clone
  target: "~/.claude/skills/"                       # user-level 安装
  strategy: per_skill_subdir                        # 包内每个子目录是一个 skill
  skills:
    - think-before-coding
    - simplicity-first
    - surgical-changes
    - goal-driven-execution
detect:
  files:
    - "~/.claude/skills/think-before-coding/SKILL.md"
    - "~/.claude/skills/simplicity-first/SKILL.md"
provides:
  skills:
    - name: think-before-coding
      description_hint: "心法 — 写代码前先思考"
    - name: simplicity-first
      description_hint: "心法 — 最小有效代码"
uninstall:
  method: rm_dirs
  paths:
    - "~/.claude/skills/think-before-coding/"
    - "~/.claude/skills/simplicity-first/"
    - "~/.claude/skills/surgical-changes/"
    - "~/.claude/skills/goal-driven-execution/"
```

---

## 3. MCP server (npm) type（`mcp-npm`）

### 3.1 官方命令完整参数（HIGH confidence）

```bash
# 完整语法
claude mcp add <name> [options] -- <command> [args...]

# 关键 options（必须在 -- 之前）
--transport stdio | http | sse        # 默认 stdio；sse 已废弃
--scope local | project | user        # local 默认；project 写入 .mcp.json；user 写入 ~/.claude.json
--env KEY=value                       # 环境变量（多个用多次 --env）
--header "Header:Value"               # http 用，认证头
```

支持 transport：

| Transport | 用途 | 推荐度 |
|-----------|------|-------|
| **stdio** | 本地进程 / npx 包 | ⭐⭐⭐ MVP 唯一类型 |
| **http** | 远程 server | ⭐⭐ v0.5+ 加 |
| **sse** | 旧 server | ❌ 已 deprecated，禁用 |

**Tavily / Exa 是 npm 包形式 stdio MCP**，命令形如：

```bash
claude mcp add --transport stdio tavily-mcp \
  --env TAVILY_API_KEY=xxx \
  --scope project \
  -- npx -y @tavily/mcp-server
```

### 3.2 配置文件位置（HIGH confidence）

| Scope | 文件 | 用途 |
|-------|------|------|
| local（默认）| `~/.claude.json` 内 `<project_path>` 子键 | 私人 + 仅本项目 |
| project | `<project>/.mcp.json` | 团队共享，可 commit |
| user | `~/.claude.json` 顶层 `mcpServers` | 跨所有项目 |

**`.mcp.json` 结构**：

```json
{
  "mcpServers": {
    "tavily-mcp": {
      "command": "npx",
      "args": ["-y", "@tavily/mcp-server"],
      "env": { "TAVILY_API_KEY": "${TAVILY_API_KEY}" }
    }
  }
}
```

环境变量用 `${VAR}` 引用，**不在 .mcp.json 写明文 secret**（设计上支持，团队共享时安全）。

### 3.3 ⚠️ 已知 bugs（影响 idempotent）（HIGH confidence — github 已报）

1. **`--scope user` 写入但不可读**（v2.1.122 issue #54803）：写成功，但 `claude mcp list` / `/mcp` 看不到，server 不起作用
2. **`--scope project` 不显示在 list**（issue #5963）：runtime 工作但 list 不显示
3. **直接编辑 .mcp.json 不刷新**：必须重启 CC 或 `/mcp` 重连

→ **harnessed 决策建议**：
- **MVP 默认用 `--scope project`**（写 `.mcp.json` + 项目可控 + 团队可共享）
- **避开 user scope**（bug + 不可控）
- **避开 local scope**（隐藏在 `~/.claude.json` 大文件中，难管理）
- 安装后 print 提示用户重启 CC

### 3.4 idempotent 安装模式（推荐做法）

`claude mcp add` 本身**有重复检测**（user scope 时报 "already exists"），但更安全的 idempotent 模式是 **remove-then-add**：

```bash
# harnessed 内部安装算法
claude mcp remove <name> -s project 2>/dev/null || true   # 忽略 not found
claude mcp add <name> -s project --transport stdio \
  --env KEY=val -- npx -y <pkg>
```

⚠️ **绝对禁止整体覆盖 `~/.claude.json`**（issue #15797 警告：900+ bytes 重要数据可能丢失）。harnessed 只能用官方 CLI 或精确 surgical merge `mcpServers` 字段。

### 3.5 npm 包 MCP 的版本锁

`.mcp.json` 不直接支持版本锁（args 里 `npx -y @pkg/name` 默认 latest）。锁版本方式：

```json
{ "command": "npx", "args": ["-y", "@tavily/mcp-server@1.4.2"] }
```

**SPEC § 5.5 决策"^minor"** 落地：

```json
{ "command": "npx", "args": ["-y", "@tavily/mcp-server@^1.4.0"] }
```

但 npx 对 semver 范围支持有限（取决于 npm registry 解析）。**更稳妥**：harnessed 在安装前先 `npm view @pkg version` 拿当前最新满足 ^minor 的版本号，落定到 args（每次 `harnessed upgrade` 重新计算）。

### 3.6 health check（detect MCP working）

CC 内置：`/mcp` slash command 显示所有 server 状态（已连接 / 连接失败 / OAuth pending）。

programmatic detect：

```bash
# 1. 查 .mcp.json 是否有 entry
jq '.mcpServers["tavily-mcp"]' .mcp.json

# 2. 跑 claude mcp list（注意 project scope visibility bug）
claude mcp list

# 3. 实际 health（工具是否能调用）只能在 CC session 内验证 — harnessed doctor 限制
```

→ **harnessed doctor 输出限制**：能查 config 是否正确，无法跨进程验证 server 实际响应。需 CC session 内部跑 health check skill。

### 3.7 Windows 特殊问题（HIGH confidence）

native Windows（非 WSL）：stdio + npx 必须套 `cmd /c`：

```bash
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
```

→ harnessed installer 必须根据 `process.platform === 'win32'` 自动注入 `cmd /c` wrapper。

### 3.8 示例 manifest（mcp-npm）

```yaml
type: mcp-npm
name: tavily-mcp
display_name: Tavily MCP Server
upstream:
  npm_package: "@tavily/mcp-server"
lock:
  range: "^1.4.0"                           # SPEC § 5.5 ^minor
  resolved: "1.4.7"                         # 安装时 freeze 的精确版本
install:
  method: claude_mcp_add
  scope: project                            # MVP 强制 project，避开 user scope bug
  transport: stdio
  command: npx
  args: ["-y", "@tavily/mcp-server@1.4.7"]
  env_required: ["TAVILY_API_KEY"]          # 用户必须自备
  windows_wrapper: "cmd /c"                 # auto-inject on win32
detect:
  config_file: ".mcp.json"
  config_key: "mcpServers.tavily-mcp"
  health_check_skill: harnessed/internal-mcp-ping  # session 内验证
provides:
  mcp_tools:
    - tavily_search
    - tavily_extract
    - tavily_crawl
    - tavily_map
    - tavily_research
uninstall:
  method: claude_mcp_remove
  command: "claude mcp remove tavily-mcp -s project"
```

---

## 4. CLI (npm) type（`cli-npm`）

### 4.1 全局 `npm i -g` vs `npx` 取舍（HIGH confidence）

| 方式 | 优点 | 缺点 | harnessed 决策 |
|------|------|------|---------------|
| `npm i -g` | 命令进 PATH，调用极简，启动快 | 占全局，污染版本，需写权限 | 默认推荐（用户已有则跳过） |
| `npx <pkg>@latest` | 不污染全局，永远最新 | 每次启动有冷启延迟，version 不锁 | fallback（用户拒绝全局安装时） |

**harnessed 策略**：
- 默认提示用户 `npm i -g <pkg>`
- 用户拒绝则降级到 `npx <pkg>@<lock_version>` —— 显式告知降级（SPEC § 8.5）
- 不论哪种方式，工作流调用都用统一的 wrapper 函数

### 4.2 跨平台 detect 已可用（HIGH confidence）

| 平台 | shell 内置 | Node.js |
|------|-----------|---------|
| Unix (Mac/Linux) | `command -v <cmd>` | `which` npm package |
| Windows cmd | `where <cmd>` | `which` npm package |
| Windows PowerShell | `Get-Command <cmd>` | `which` npm package |

**推荐做法**：用 npm 包 `which`（跨平台 JS 实现），不依赖 shell：

```typescript
import which from 'which';
try {
  const path = await which('ctx7');     // 找到则返回路径
  return { installed: true, path };
} catch {
  return { installed: false };
}
```

或检测全局安装位置：

| 平台 | 全局 npm 路径 |
|------|--------------|
| Windows | `%APPDATA%\npm\node_modules` |
| Mac/Linux | `/usr/local/lib/node_modules` 或 `~/.npm-global` |

`is-installed-globally` npm 包（sindresorhus，18M+ 周下载）封装了这逻辑。

### 4.3 跨平台执行差异（HIGH confidence）

```typescript
// harnessed 内部统一 spawn wrapper
function spawnCli(cmd: string, args: string[]): ChildProcess {
  if (process.platform === 'win32') {
    // Windows 上 npx 需要 .cmd 后缀；cmd /c 兜底
    return spawn('cmd', ['/c', cmd, ...args], { shell: false });
  }
  return spawn(cmd, args, { shell: false });
}
```

`shell: false` 是安全要求（SPEC § 8.3 hooks 禁 shell 的延伸 — 所有用户输入路径绝不进 shell）。

### 4.4 ctx7 真实使用模式（HIGH confidence — 已 dogfooding）

```bash
# 推荐：全局安装
npm i -g ctx7
ctx7 library "Next.js" "routing"
ctx7 docs /vercel/next.js "app router"

# fallback：npx
npx ctx7@latest library "Next.js" "routing"
```

→ harnessed `manifests/tools/ctx7.yaml` 主推全局，npx fallback。

### 4.5 示例 manifest（cli-npm）

```yaml
type: cli-npm
name: ctx7
display_name: Context7 CLI (Library Docs)
upstream:
  npm_package: ctx7
lock:
  range: "^0.4.0"                       # SPEC § 5.5
  resolved: "0.4.1"
install:
  method: npm_global
  command: "npm install -g ctx7@0.4.1"
  fallback:
    method: npx
    command_template: "npx ctx7@0.4.1"  # 工作流调用时用此模板
detect:
  binary: ctx7                           # which / process.platform-aware
  version_check:
    command: "ctx7 --version"
    expected_pattern: "^0\\.4\\."
provides:
  cli_commands:
    - "ctx7 library <name> <query>"
    - "ctx7 docs <id> <query>"
uninstall:
  method: npm_global_uninstall
  command: "npm uninstall -g ctx7"
```

---

## 5. 路由机制可行性（B+C 混合）

### 5.1 UserPromptSubmit hook 真实可用（HIGH confidence）

**Anthropic 官方文档明确支持**（https://code.claude.com/docs/en/hooks）：

- hook event `UserPromptSubmit` once-per-turn 在用户提交 prompt 后、Claude 处理前触发
- input：JSON via stdin，包含 `session_id` / `transcript_path` / `cwd` / `prompt`
- output：JSON via stdout（exit 0 时）+ stderr（exit 2 时）
- **stdout 唯一被 special-case 注入为 context**（`UserPromptSubmit` / `UserPromptExpansion` / `SessionStart` 三个事件）

→ **直接证实 spec § 5.1 C 层可行**。

### 5.2 hook 输入输出格式（HIGH confidence）

**Input (stdin JSON)**：
```json
{
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "/path/to/project",
  "prompt": "用户原文"
}
```

**Output Option A — 注入 context（推荐用法）**：
```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "[harnessed 路由提示] 检测到 UI 任务，建议优先调用 ui-ux-pro-max skill；详见 routing/ui.md"
  }
}
```

**Output Option B — 阻断 prompt**：
```json
{
  "decision": "block",
  "reason": "Blocked: prompt contains forbidden pattern"
}
```

**Output Option C — exit 0 + stdout 文本**：直接打印的文本被 append 到 Claude context（最简方案）。

### 5.3 hook 配置文件 + 优先级（HIGH confidence）

| 文件 | scope | 优先级 |
|------|-------|--------|
| 企业 managed settings | 强制 | 最高（不可覆盖）|
| `.claude/settings.local.json` | per-machine | 项目本机 |
| `.claude/settings.json` | project | 团队共享 |
| `~/.claude/settings.json` | user | 全局 baseline |
| plugin `hooks/hooks.json` | plugin | 跟随 plugin 启用 |

**多 hook 同时存在时**：CC **全部执行**（按 hook 数组顺序）。结果合并：
- `additionalContext`：拼接（多个 hook 都贡献 context）
- `decision: block`：任一 hook 阻断则整体阻断
- exit 2：stderr 反馈 Claude

→ harnessed 的 hook 不能假设独占，必须设计为 **additive**（只加 context，不 block）。

### 5.4 hook 安全约束（HIGH confidence）

CC 限制：
1. `allowManagedHooksOnly: true`（企业用）禁用所有 user/project/plugin hook —— harnessed 在企业环境下可能完全失效（C 层降级为 B 层，符合 § 5.1 fallback 设计）
2. URL allowlist + env var allowlist 对 HTTP hook 限制
3. 同一 hook spawn subagent 时小心**无限循环**（subagent 会 trigger 同 hook） —— harnessed hook 必须检测 subagent 标记跳过
4. Hook 命令路径必须用 `$CLAUDE_PROJECT_DIR` 前缀防 cwd 漂移
5. exit code 2 = blocking error，stderr → Claude

**SPEC § 8.3 "hook 纯 yaml/markdown，禁 shell"** 是过激约束 —— 实际上 hook **必须** type=command 跑脚本（type=prompt / http / mcp_tool 是替代）。harnessed 的实现路径：

- harnessed install 时**自带一个 stub hook 脚本**（Node.js / Python，纯解析 routing/*.md yaml frontmatter，调 LLM API 输出 additionalContext）
- 脚本源码 install 时 print 全文（透明度）
- 脚本不 spawn 任意子进程，不读 routing-cache.json 之外的文件
- → 重新解读 § 8.3：hook **配置纯 yaml/md**（即 routing/*.md SSOT），**实现脚本严格审计 + 透明**

### 5.5 skill description 触发命中率经验数据（已在 § 2.4 列出）

社区实测核心结论：
- 纯 B 层（description）：Sonnet ~50-55%, Haiku 0-20%
- B + C 混合（hook）：Sonnet 100%（22 样本），Haiku 84%（200+ samples）

**SPEC § 5.1 验收标准 ≥ 85% 是合理且可达成的**，但前提：

1. C 层 hook 必须用 directive language 指令式 prompt 注入（"ALWAYS invoke ui-ux-pro-max when..."）
2. B 层 description 必须 pushy（Anthropic 官方建议）
3. 30 样本应覆盖 model 差异（同时测 Haiku / Sonnet / Opus）
4. token budget 监控（`/doctor` 命令）—— harnessed 的 skill description 总和不能超 1% context window

---

## 6. Manifest Schema v1 完整草案

### 6.1 顶层结构

```yaml
# manifests/<category>/<name>.yaml
schema_version: 1                          # 必填，未来 migration 用
type: cc-plugin | cc-skill-pack | mcp-npm | cli-npm   # 4 选 1
name: <kebab-case-id>                      # 全局唯一，匹配 [a-z][a-z0-9-]+
display_name: <human-readable>
description: <一行说明>
license: MIT | Apache-2.0 | BSD-3-Clause | ISC | 0BSD   # whitelist（SPEC § 8.2）

upstream:                                  # 类型相关，见各 type
  ...

lock:                                      # SPEC § 5.5 强制
  ...

install:                                   # 类型相关
  ...

detect:                                    # 检测已安装的 SSOT
  ...

provides:                                  # 此上游提供什么（commands/skills/mcp_tools/cli_commands）
  ...

uninstall:                                 # 卸载方法
  ...

routing_hints:                             # 可选，供 routing/*.md 引用
  preferred_for: []                        # 触发 keyword
  conflicts_with: []                       # 已知撞名

metadata:
  homepage: <url>
  maintainer: <name>
  added_at: 2026-05-11
  notes: <free text>
```

### 6.2 Type 共有 fields 定义

| Field | 必填 | Type | 说明 |
|-------|------|------|------|
| `schema_version` | ✅ | int | 版本，目前固定 1 |
| `type` | ✅ | enum | 4 种 type |
| `name` | ✅ | string | kebab-case 唯一 ID |
| `display_name` | ✅ | string | 人类可读名 |
| `description` | ✅ | string | 一行说明 |
| `license` | ✅ | enum | whitelist license |
| `upstream` | ✅ | object | type-specific |
| `lock` | ✅ | object | type-specific |
| `install` | ✅ | object | type-specific |
| `detect` | ✅ | object | type-specific |
| `provides` | ✅ | object | type-specific |
| `uninstall` | ✅ | object | type-specific |
| `routing_hints` | ⭕ | object | 路由层引用 |
| `metadata` | ⭕ | object | 非功能性元信息 |

### 6.3 lock schema（4 type 分支）

```yaml
# cc-plugin / cc-skill-pack（git-based）
lock:
  ref: <branch | tag>           # 必填
  sha: <40-char hex>            # 必填（SPEC § 5.5 production 要求）

# mcp-npm / cli-npm（npm-based）
lock:
  range: "^1.4.0"               # semver range（^minor）
  resolved: "1.4.7"             # 实际安装版本（每次 upgrade 刷新）
```

### 6.4 install schema 枚举

```yaml
install:
  method:
    | claude_plugin_marketplace          # cc-plugin
    | git_clone                          # cc-skill-pack
    | claude_mcp_add                     # mcp-npm
    | npm_global                         # cli-npm
    | npx                                # cli-npm fallback
  # method-specific 字段...
```

### 6.5 完整 schema 文件

```yaml
# manifests/SCHEMA.md（即 .planning 阶段产出，作为 § 8.1 schema-frozen 锁定）

schema_version: 1

# 共有字段
type:
  required: true
  enum: [cc-plugin, cc-skill-pack, mcp-npm, cli-npm]

name:
  required: true
  pattern: "^[a-z][a-z0-9-]+$"
  max_length: 64

display_name:
  required: true
  type: string

description:
  required: true
  type: string
  max_length: 256

license:
  required: true
  enum: [MIT, Apache-2.0, BSD-3-Clause, ISC, 0BSD, "Apache-2.0 OR MIT"]

# Type-specific schemas

cc-plugin:
  upstream:
    source: { enum: [github, gitlab, git, local] }
    repo: { pattern: "^[\\w-]+/[\\w-]+$" }
    marketplace: { optional: true, pattern: "^[\\w-]+/[\\w-]+$" }
    plugin_id: string
  lock:
    ref: string
    sha: { pattern: "^[0-9a-f]{40}$" }
  install:
    method: { const: claude_plugin_marketplace }
    commands: { type: array, items: string }
  detect:
    files: { type: array, items: string }
    settings_keys: { type: array, items: string }
  provides:
    commands: { type: array, items: string, default: [] }
    skills: { type: array, items: string, default: [] }
    hooks: { type: array, items: string, default: [] }
  uninstall:
    method: { const: claude_plugin_cli }
    command: string
    manual_cleanup_paths: { type: array, items: string }

cc-skill-pack:
  upstream:
    source: { enum: [github, gitlab, git] }
    repo: { pattern: "^[\\w-]+/[\\w-]+$" }
  lock:
    ref: string
    sha: { pattern: "^[0-9a-f]{40}$" }
  install:
    method: { const: git_clone }
    target: { enum: ["~/.claude/skills/", ".claude/skills/"] }
    strategy: { enum: [per_skill_subdir, single_skill] }
    skills: { type: array, items: string }
  detect:
    files: { type: array, items: string }
  provides:
    skills:
      type: array
      items:
        name: string
        description_hint: string
  uninstall:
    method: { const: rm_dirs }
    paths: { type: array, items: string }

mcp-npm:
  upstream:
    npm_package: { pattern: "^(@[\\w-]+/)?[\\w-]+$" }
  lock:
    range: { pattern: "^[\\^~]?\\d+\\.\\d+\\.\\d+$" }
    resolved: { pattern: "^\\d+\\.\\d+\\.\\d+$" }
  install:
    method: { const: claude_mcp_add }
    scope: { enum: [project, user, local], default: project }   # 默认 project（避开 user bug）
    transport: { enum: [stdio, http], default: stdio }          # 禁用 sse
    command: string
    args: { type: array, items: string }
    env_required: { type: array, items: string, default: [] }
    windows_wrapper: { optional: true, const: "cmd /c" }
  detect:
    config_file: { enum: [.mcp.json, "~/.claude.json"] }
    config_key: string
    health_check_skill: { optional: true, type: string }
  provides:
    mcp_tools: { type: array, items: string }
  uninstall:
    method: { const: claude_mcp_remove }
    command: string

cli-npm:
  upstream:
    npm_package: { pattern: "^(@[\\w-]+/)?[\\w-]+$" }
  lock:
    range: { pattern: "^[\\^~]?\\d+\\.\\d+\\.\\d+$" }
    resolved: { pattern: "^\\d+\\.\\d+\\.\\d+$" }
  install:
    method: { enum: [npm_global, npx] }
    command: string
    fallback:
      optional: true
      method: { const: npx }
      command_template: string
  detect:
    binary: string
    version_check:
      command: string
      expected_pattern: { description: "regex" }
  provides:
    cli_commands: { type: array, items: string }
  uninstall:
    method: { const: npm_global_uninstall }
    command: string

# 路由提示（共有）
routing_hints:
  optional: true
  preferred_for: { type: array, items: string }
  conflicts_with: { type: array, items: string }

metadata:
  optional: true
  homepage: { format: url }
  maintainer: string
  added_at: { format: date }
  notes: string
```

### 6.6 manifest.lock.yaml 顶层结构（SPEC § 5.5）

```yaml
# 项目根：manifest.lock.yaml
schema_version: 1
locked_at: 2026-05-11T10:23:45Z
upstreams:
  gstack:
    type: cc-plugin
    ref: v1.4.0
    sha: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
  GSD:
    type: cc-plugin
    ref: v0.8.2
    sha: ...
  superpowers:
    type: cc-plugin
    ref: v2.1.0
    sha: ...
  karpathy-skills:
    type: cc-skill-pack
    ref: main
    sha: f9e8d7c6b5a4...
  tavily-mcp:
    type: mcp-npm
    range: "^1.4.0"
    resolved: "1.4.7"
  exa-mcp:
    type: mcp-npm
    range: "^0.5.0"
    resolved: "0.5.3"
  ctx7:
    type: cli-npm
    range: "^0.4.0"
    resolved: "0.4.1"
```

---

## 7. ⚠️ 红旗清单

### 红旗 1：MCP user scope 完全不可用（v2.1.122 bug #54803）

**影响**：现有 spec 提到 "claude mcp add" 没限定 scope，但 user scope 写入但不可读。

**workaround**：MVP 强制 `--scope project`，所有 MCP server 写 `.mcp.json`。在 doctor 报告中提示用户 v2.1.122+ 启用 user scope 风险。

### 红旗 2：plugin TUI 卸载不可靠（issue #52456）

**影响**：harnessed uninstall 不能依赖 `/plugin` slash command。

**workaround**：必须用 `claude plugin uninstall <plugin> --prune` CLI；CLI 失败时回退到 4 步手动清理（installed_plugins.json + cache 目录 + 2 个 settings.json）。

### 红旗 3：skill description 触发率不可控（无 SDK API）

**影响**：纯 B 层（spec § 5.1 跨 harness 时砍 C 层）社区实测 50-55% 命中率，远低于 § 5.1 的 85% 验收标准。

**workaround**：
- 跨 harness 时**承认 30% 命中率损失**（SPEC § 5.1 已声明）
- description 必须 pushy + 关键词覆盖
- 提供 `/harnessed:<workflow>` 显式 slash command 作为命中率兜底（用户主动调用 100%）

### 红旗 4：SPEC § 8.3 "hook 禁 shell" 与 hook 现实冲突

**影响**：CC hook 仅支持 `command/http/prompt/mcp_tool/agent` 5 种 type，**最常用 command 必然 spawn 子进程**。"纯 yaml/md hook" 在 CC 体系内不存在。

**workaround**：重新解读 § 8.3：
- routing/*.md（hook **配置**）纯 yaml/md
- harnessed 自带的 hook **脚本**严格审计 + install 时 print 全文 + 不调任意 shell（用 Node.js 内置 fs/child_process 受控调用）
- 用户能 1-key uninstall 完全清理（settings.json hook entry + script files）

需要更新 PROJECT-SPEC § 8.3 措辞：从"禁 shell"改为"禁任意 shell；harnessed 自带 hook 脚本透明 + 审计 + 1-key 卸载"。

### 红旗 5：mcp-npm 版本锁的 npx 行为不稳定

**影响**：`npx -y @pkg@^1.4.0` 对 semver 范围支持取决于 npm registry，不一定每次都解析到一致版本。

**workaround**：harnessed 在 install / upgrade 时**先解析到精确版本**写入 manifest.lock.yaml `resolved` 字段，args 里用精确版本号（不留 ^range），SPEC § 5.5 的 weekly CI 升级精确版本。

### 红旗 6：Windows native 跨平台（spec § 5.5 cross-OS v0.4 验收）

**影响**：
- npx 必须套 `cmd /c`
- skill / plugin 文件路径分隔符差异（CC 内部已处理，但 harnessed 自己的 detect 逻辑要小心）
- shell 行为差异（PowerShell vs cmd）

**workaround**：
- 全用 Node.js path API（`path.join` / `path.resolve`），不拼字符串
- 所有 spawn 加 `process.platform === 'win32'` 分支
- 跨平台测试在 v0.1 就开始（不要拖到 v0.4）

### 红旗 7：plugin 自身的版本检查无 API

**影响**：harnessed doctor 想报告 "gstack 落后 5 个版本" 没有官方接口可查。

**workaround**：
- harnessed 自己拉 `<owner>/<repo>` 的 git tag list 比对（GitHub API）
- weekly CI 跑 latest 兼容性测，PR 升 lock（spec § 5.5 已有此设计）

### 红旗 8：Claude Code 版本依赖

**影响**：plugin monitors（v2.1.105+）、mcp_tool hook type（v2.1.118+）等新特性有 CC 版本下限。

**workaround**：
- harnessed `package.json` 不能强 pin CC 版本（用户已装），改为 doctor 检查 `claude --version` 输出
- manifest schema 加 `min_claude_version` 字段（可选）

---

## 8. 信息来源

### Anthropic 官方文档（HIGH confidence）

- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference) — plugin.json schema, 目录结构
- [Discover and install prebuilt plugins through marketplaces](https://code.claude.com/docs/en/discover-plugins) — `/plugin install`, marketplace add, ref/sha 锁版本
- [Extend Claude with skills](https://code.claude.com/docs/en/skills) — SKILL.md frontmatter, progressive disclosure, 触发机制
- [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp) — `claude mcp add`, scope, transport
- [Hooks reference](https://code.claude.com/docs/en/hooks) — UserPromptSubmit input/output, exit code, JSON schema
- [Claude Code settings](https://code.claude.com/docs/en/settings) — settings.json 优先级, `allowManagedHooksOnly`
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — pushy description, 第三人称
- [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) — 路径规则
- [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) — 官方 marketplace.json 实例
- [anthropics/claude-code plugins/README.md](https://github.com/anthropics/claude-code/blob/main/plugins/README.md) — 内部 plugin 文档

### GitHub Issues / Bug Reports（HIGH confidence — 实测证据）

- [#52456 /plugin TUI uninstall unreliable](https://github.com/anthropics/claude-code/issues/52456)
- [#16260 claude plugin uninstall scope error](https://github.com/anthropics/claude-code/issues/16260)
- [#54803 mcp add user scope invisible](https://github.com/anthropics/claude-code/issues/54803)
- [#5963 project-scope MCP not in mcp list](https://github.com/anthropics/claude-code/issues/5963)
- [#15215 project-level MCP not loading runtime](https://github.com/anthropics/claude-code/issues/15215)
- [#15797 .claude.json safety](https://github.com/anthropics/claude-code/issues/15797)
- [#16165 skills directory WSL behavior](https://github.com/anthropics/claude-code/issues/16165)
- [Community discussion #182117 Claude Skill activation unstable](https://github.com/orgs/community/discussions/182117)

### 社区文章 / 实测数据（MEDIUM-HIGH confidence — 多源交叉验证）

- [Measuring Claude Code Skill Activation With Sandboxed Evals (Scott Spence)](https://scottspence.com/posts/measuring-claude-code-skill-activation-with-sandboxed-evals) — 200+ prompts 实测, B+C 命中率数据
- [Why Claude Code Skills Don't Trigger (and How to Fix Them in 2026)](https://dev.to/lizechengnet/why-claude-code-skills-dont-trigger-and-how-to-fix-them-in-2026-o7h) — token budget overflow 根因
- [How to Activate Claude Skills Automatically: 2 Fixes for 95%](https://dev.to/oluwawunmiadesewa/claude-code-skills-not-triggering-2-fixes-for-100-activation-3b57)
- [How to Make Claude Code Skills Actually Activate (650 Trials)](https://medium.com/@ivan.seleznov1/why-claude-code-skills-dont-activate-and-how-to-fix-it-86f679409af1) — 650 trial 数据
- [Claude Code Plugin CLI: The Missing Manual (Gary Jarrel)](https://medium.com/@garyjarrel/claude-code-plugin-cli-the-missing-manual-0a4d3a7c99ce) — CLI plugin 命令完整参考
- [Claude Code MCP Servers: How to Connect (Builder.io)](https://www.builder.io/blog/claude-code-mcp-servers) — MCP 完整配置指南
- [Install and Configure MCP Servers in Claude Code 2026 (systemprompt.io)](https://systemprompt.io/guides/claude-code-mcp-servers-extensions)
- [Claude Code Settings Reference (claudefa.st)](https://claudefa.st/blog/guide/settings-reference) — 完整 settings.json 字段
- [Claude Code Hooks: Complete Guide to All 12 Lifecycle Events](https://claudefa.st/blog/tools/hooks/hooks-guide)
- [Hyperskill marketplace template](https://github.com/hyperskill/claude-code-marketplace) — marketplace 实例
- [ivan-magda/claude-code-plugin-template](https://github.com/ivan-magda/claude-code-plugin-template) — plugin 项目模板

### CLI / npm 检测工具（HIGH confidence）

- [is-installed-globally (sindresorhus)](https://www.npmjs.com/package/is-installed-globally) — 18M+ weekly downloads, 标准方案
- [which npm package](https://www.npmjs.com/package/which) — 跨平台 binary 检测
- [cross-os](https://www.npmjs.com/package/cross-os) — OS 分支 npm script

### 综合资源（MEDIUM confidence）

- [zebbern/claude-code-guide](https://github.com/zebbern/claude-code-guide) — Context7-indexed 综合 guide (1679 snippets)
- [Build with Claude Plugin Marketplace](https://buildwithclaude.com/) — 第三方 marketplace 聚合
- [claudemarketplaces.com](https://claudemarketplaces.com/) — 同上

---

**调研完成。下一步建议**：

1. spec § 8.3 措辞调整（红旗 4）
2. roadmap phase 1（v0.1）任务拆分时，将"manifest schema v1 冻结"放在最前（§ 8.1 ）—— 本报告 § 6 草案可作为冻结起点
3. roadmap 加入"Windows native cross-platform 测试"作为 v0.1 任务（不拖到 v0.4，红旗 6）
4. routing/*.md SSOT schema 设计时参考本报告 § 5.2 的 hook input/output JSON 格式
