# 让 AI 安装 harnessed

复制下方整段粘贴进 Claude Code、Codex (或任何能跑 shell 的 AI 助手),AI 会检查 OS / 权限 / PATH / corepack 等 edge case。

---

帮我安装 **harnessed**(AI coding harness 包管理器,把 gstack + GSD + superpowers + karpathy + mattpocock 等 Claude Code 生态组件 composition 成统一 5-stage 工作流。npm: `harnessed`,仓库 https://github.com/easyinplay/harnessed,Apache-2.0)。请按以下流程执行,每步遇到错误自动诊断并修复,最后报告结果。

## 步骤

1. **首选:npm 渠道**(需要 Node.js ≥ 22;npm 与二进制两条通道同为一等公民)
   ```bash
   node --version    # <22 或未装 → 用户愿装 Node 则引导 https://nodejs.org / nvm / fnm;不愿装 → 转步骤 2
   npm install -g harnessed
   ```
   - macOS / Linux 权限报错 → `sudo npm install -g harnessed` 或改 npm prefix 到用户目录 (`npm config set prefix ~/.npm-global` + 加 `~/.npm-global/bin` 到 PATH)
   - Windows 权限报错 → 用管理员 PowerShell / cmd 重跑
   - npm 装后 **不会** 自动跑 setup → 继续步骤 3

2. **无 Node.js 回退:一行安装器(独立二进制,分平台)**

   先检测 OS,跑对应脚本:
   ```bash
   # macOS (Apple Silicon) / Linux (x64)
   curl -fsSL https://raw.githubusercontent.com/easyinplay/harnessed/main/install.sh | bash
   ```
   ```powershell
   # Windows (x64)
   irm https://raw.githubusercontent.com/easyinplay/harnessed/main/install.ps1 | iex
   ```
   - 脚本自带 sha256 校验 + `--version` smoke;落位 unix `~/.local/bin` / Windows `%LOCALAPPDATA%\harnessed\bin`
   - **交互式会征询 `run 'harnessed setup' now? (Y/n)`**:同意则安装器已按绝对路径跑完 setup → **跳过步骤 3**;非交互(纯管道无 TTY)不征询 → 照步骤 3 手动跑
   - **二进制安装成功不等于 setup 成功**:如果随后显示 `setup failed` 或 `setup incomplete`,保留已安装的二进制,按错误原因处理,再执行安装器打印的绝对路径 setup 重试命令。此时不能把流程记为完整安装成功,也不应仅重复下载二进制。
   - **注意 PATH 提示 + shadow 警告**:输出含 PATH 指令则替用户执行后重开 shell;若输出 `another 'harnessed' ... will shadow this binary`(先前 npm 全局装过),说明 bare `harnessed` 仍指旧那份 → 按提示 `npm uninstall -g harnessed`,或用打印的绝对路径调用
   - 后续升级 `harnessed update`(二进制原地自替换,保留上一版可回滚)
   - 不支持的平台(如 Intel Mac)脚本明确报错并指向 npm 渠道 → 回步骤 1

3. **跑 setup 装 workflow skills**(步骤 2 安装器已征询跑过则跳过)
   ```bash
   harnessed setup
   ```
   默认 immediate-write,安装 workflow skills、宿主命令和 base upstreams;末尾自动跑 skill 完整性校验与自愈。Codex 应显式选择宿主:
   ```bash
   harnessed setup --platform codex
   ```
   非交互安装需要全局 CLI 时,必须显式授权 L4,不能把缺失依赖记为成功:
   ```bash
   harnessed setup --platform codex --system --non-interactive
   ```
   Playwright 的 skill 与运行时分开安装: `playwright-test` 提供 skill,`playwright-cli` 提供 CLI 和 Chromium,并通过实际启动浏览器验收。`@playwright/test` 和 Python Playwright 是项目依赖,setup 不会修改用户项目的 `package.json` 或 Python 环境。独立二进制只免除 harnessed 自身的 Node 依赖;上游仍可能要求 Node/npm、Git、Bun、Python 或浏览器系统库,失败必须保留原因。

4. **健康检查**
   ```bash
   harnessed doctor
   ```
   多项 check (Node / MCP / Win bash / 路由 / token budget / skill 完整性 / GateGuard 冲突 / update-available 等)。任何 fail 报给用户;warn 附带修复指引。

5. **验证 slash command 已注册**
   ```bash
   ls ~/.claude/skills/ | sort
   ```
   Claude Code 应看到 `auto` / `discuss-strategic` / `plan-phase` / `task-code` / `verify-progress` 等 skill dir。Codex 使用 `~/.agents/skills/` 共享目录和 `~/.codex/skills/` 宿主目录,不要借 Claude Code 的目录判定安装成功;运行 `harnessed doctor --host codex` 检查对应宿主。

## 常见错误

- `harnessed: command not found` (安装器装后) — 落位目录不在 PATH。unix 把 `~/.local/bin` 加进 PATH;Windows 执行安装器打印的 `SetEnvironmentVariable` 指令后重开终端。
- `npm: command not found` — Node 没装 / 未加 PATH。走步骤 2 的一行安装器(无需 Node),或引导装 Node 22+。
- `harnessed: command not found` (npm 装后) — npm global bin 不在 PATH。跑 `npm config get prefix` 看路径,把 `<prefix>/bin` 加进 PATH。
- 二进制装后 `harnessed --version` 报的版本比刚装的旧 — 先前 npm 全局装过,PATH 上更靠前的那份遮蔽了新二进制。安装器已打印 shadow 警告:`npm uninstall -g harnessed` 移除旧的,或按打印的绝对路径调用新二进制。
- `~/.claude/ does not exist` — 先确认选择的宿主。Codex 不需要为了安装 harnessed 而安装 Claude Code;使用 `--platform codex`。
- `EPERM mkdir` Windows — 当前工作目录是只读 (例如 `C:\Program Files\`)。`cd` 到用户目录再跑。
- Windows SmartScreen/Defender 拦截二进制 — 无签名 exe 的已知误报,手动放行一次;介意则改走 npm 渠道。

## 完成后报告

报给用户:
- `harnessed --version` 输出 + 安装通道(二进制 / npm)
- 当前宿主的 skill 目录与实际可读文件数量
- `harnessed doctor` 的 pass / warn / fail,以及哪些 runtime 已实际启动验证
- 跳过的 L4、项目依赖、MCP 鉴权或审批限制;MCP 已注册不等于实际调用成功

## 下一步引导

用户安装完成后告诉他们,在 Claude Code 内可用:

- `/auto "<需求>"` — 一把跑完全部 stage(新手默认)
- `/discuss "<topic>"` — 战略 + Phase + 子任务 3 层澄清
- `/plan "<scope>"` — 架构 + 任务图持久化
- `/task "<subtask>"` — clarify → code → test → deliver
- `/verify "<phase>"` — multi-dimension 验证
- `/research "<topic>"` — 多源调研 (Tavily + Exa + ctx7)
- `/retro` — 里程碑总结

升级:任意时刻 `harnessed update`(二进制原地自替换 / npm 走 `npm i -g harnessed@latest`);`harnessed doctor` 与 `harnessed status` 会在有新版时提醒。
