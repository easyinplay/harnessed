# 让 AI 安装 harnessed

复制下方整段粘贴进 Claude Code (或任何能跑 shell 的 AI 助手),AI 会自动处理 OS / 权限 / PATH / corepack 等 edge case。

---

帮我安装 **harnessed**(AI coding harness 包管理器,把 gstack + GSD + superpowers + karpathy + mattpocock 等 Claude Code 生态组件 composition 成统一 4-stage 工作流。npm: `harnessed`,仓库 https://github.com/easyinplay/harnessed,Apache-2.0)。请按以下流程执行,每步遇到错误自动诊断并修复,最后报告结果。

## 步骤

1. **检查 Node.js ≥ 22**
   ```bash
   node --version
   ```
   若 <22 或未装,提示用户从 https://nodejs.org 装 Node 22+ (或用 nvm / fnm)。

2. **全局装 harnessed**
   ```bash
   npm install -g harnessed
   ```
   - macOS / Linux 权限报错 → 提示 `sudo npm install -g harnessed` 或改 npm prefix 到用户目录 (`npm config set prefix ~/.npm-global` + 加 `~/.npm-global/bin` 到 PATH)
   - Windows 权限报错 → 提示用管理员 PowerShell / cmd 重跑

3. **跑 setup 装 workflow skills**
   ```bash
   harnessed setup
   ```
   默认 immediate-write,会装 ~24 个 workflow skill 到 `~/.claude/skills/` 并注册 slash command。

4. **健康检查**
   ```bash
   harnessed doctor
   ```
   8 项 check (Node / corepack / MCP / Win bash / 路由 / token budget 等)。任何 fail 报给用户。

5. **验证 slash command 已注册**
   ```bash
   ls ~/.claude/skills/ | sort
   ```
   应看到 `discuss-strategic` / `plan-phase` / `task-code` / `verify-progress` 等 ~24 个 skill dir。

## 常见错误

- `npm: command not found` — Node 没装 / 未加 PATH。引导装 Node 22+。
- `harnessed: command not found` (装后) — npm global bin 不在 PATH。跑 `npm config get prefix` 看路径,把 `<prefix>/bin` 加进 PATH。
- `~/.claude/ does not exist` — Claude Code 没装。引导先装 Claude Code。
- `EPERM mkdir` Windows — 当前工作目录是只读 (例如 `C:\Program Files\`)。`cd` 到用户目录再跑。
- `corepack: command not found` — Node 22+ 自带,如果缺 → `npm install -g corepack`。

## 完成后报告

报给用户:
- `harnessed --version` 输出
- `~/.claude/skills/` skill 数量
- `harnessed doctor` 是否全 pass

## 下一步引导

用户安装完成后告诉他们,在 Claude Code 内可用:

- `/discuss "<topic>"` — 战略 + Phase + 子任务 3 层澄清
- `/plan "<scope>"` — 架构 + 任务图持久化
- `/task "<subtask>"` — clarify → code → test → deliver
- `/verify "<phase>"` — multi-dimension 验证
- `/research "<topic>"` — 多源调研 (Tavily + Exa + ctx7)
- `/retro` — 里程碑总结
