# ADR 0041 — codex hooks 经本地 codex 插件承载;信任经 app-server RPC、须用户同意

- **Status**: Accepted
- **Date**: 2026-09-22
- **Relates to**: ADR 0040(宿主判定);`.planning/specs/2026-09-22-codex-host-parity-v16.md`「Phase 64」;
  `.planning/phases/64-codex-hooks-plugin/`
- **Milestone**: v16.0 Codex Host Parity / Phase 64(minor)

## Context

harnessed 的 first-party hook(per-turn 注入、SessionStart 缓存失效、提交时文档纪律闸门)在 Claude Code
上写进 `~/.claude/settings.json`。codex 也有同形的 hook 协议(实测 codex-cli 0.154:stdin 字段与 CC 一致,
UserPromptSubmit 的纯文本 / `additionalContext` 都进上下文,PreToolUse 的 shell 工具名是 `Bash`),但:

1. codex 的用户 hook 文件 `~/.codex/hooks.json` 的信任键是**位置性**的(`<path>:<event>:<组>:<条>`)——
   harnessed 往里插一条就会让别人 hook 的键漂移,已信任的变成未信任。
2. 信任存在 `config.toml [hooks.state."<key>"].trusted_hash`,hash 取**未展开**的 hook 条目;未信任或条目
   改过(`modified`)的 hook **静默不跑**。
3. `config.toml` 同时存放凭据;SPEC 已定边界:harnessed 代码不写也不读它。

## Decision

1. **每个 hook manifest 一个本地 codex 插件** `harnessed-<manifest>@harnessed-local`,共用 harnessed 自有的
   本地 marketplace `~/.codex/harnessed/marketplace`(`CODEX_HOME` 优先)。安装 =
   `codex plugin marketplace add <dir>`(幂等)+ `codex plugin add`;卸载 = `codex plugin remove` → 删
   codex 留下的空 `plugins/cache/harnessed-local` → 删信任条目 → 删插件目录与 `plugins/data/<p>-harnessed-local`
   → 最后一个插件卸载时 `codex plugin marketplace remove`。插件 hook 的信任键带插件命名空间
   (`<p>@<m>:hooks/hooks.json:<event>:0:0`),与他人 hook 互不干扰。
2. **命令字面量 hash 稳定**:npm 模式 `node "${PLUGIN_ROOT}/hook.cjs" <id> [args] --platform codex`,binary
   模式 `harnessed <id> [args] --platform codex`;`command` 与 `commandWindows` 同文;首 token 不加引号(codex
   用用户 shell 跑 hook,pwsh 拒绝带引号的首 token)。会变的部分(harnessed 资产根)放
   `${PLUGIN_DATA}/install.json`,由 shim 运行时读取 —— 升级 / 重装 / 换 Node 不改 hash、不掉信任。
3. **hook 侧显式宿主**:codex hook 进程没有 `CODEX_*` env(还可能继承 `CLAUDE_CODE_SESSION_ID`),所以
   `--platform codex` 走 ADR 0040 的显式通道;会话 id 取 hook stdin 的 `session_id`(与 codex shell 的
   `CODEX_SESSION_ID` 同源)。Claude Code 侧不带该参数,行为逐字节不变。
4. **codex 上不以退出码表达裁决**:codex 在 Windows 用 `pwsh -NoProfile -Command` 跑 hook,pwsh 对任何失败的
   外部命令都报 1,exit 2 的 PreToolUse 阻断到不了 codex。`check-docs --hook --platform codex` 改用 stdout JSON:
   halt → `hookSpecificOutput.permissionDecision: "deny"`,warn → `systemMessage`,exit 0。
5. **信任经 codex 自己的 RPC 写,且须同意**:`codex app-server` 的 `hooks/list` + `config/batchWrite`(upsert
   `hooks.state`;删除 = 引号 keyPath + `null`)。只触碰 `harnessed-*@harnessed-local:` 键。交互安装征得同意;
   非交互默认不信任,`--trust-codex-hooks` 显式同意;RPC 缺失 / 超时 / 非 JSON → 安装成功但结果标
   「待信任」并给出指引,不报成功。doctor 报 trusted / untrusted / modified / unknown。
6. **「已装」判定改由 `codex plugin list --json`**(旧版本回退表格输出),顺带把既有 codex 插件探测从读
   `config.toml` 段头迁移过来;`available` 与 “not installed” 行不算已装。codex 插件操作模块内串行。

## Consequences

- codex 用户能用 `harnessed install perturn-inject | perturn-inject-invalidate | doc-discipline-gate`;
  `stop-hook-recover` 在 codex 上诚实返回 `harness-mismatch`(依赖 CC transcript 形态)。
  `dashboard-autospawn` 不 port(任何 CLI 路径都不扫描 `manifests/cc-hooks/`,claude 上同样不可达)。
- 非交互安装后 hook 默认不跑,直到用户同意信任 —— 这是信任提示作为安全机制的本意,由结果与 doctor 明示。
- 本地 marketplace 目录与 `plugins/data` 下的 install 信息是 harnessed 在 `~/.codex` 下仅有的写入。
- 延迟:live smoke(codex 0.155.1,Windows,pwsh)实测 SessionStart 594 ms / UserPromptSubmit 565 ms /
  PreToolUse 765 ms(`pnpm test:codex-live`);`cmd /c` 直跑同一命令 p50 约 100 ms,差额主要是 pwsh 启动。

## Alternatives rejected

- 写 `~/.codex/hooks.json`:位置信任键会毒化他人 hook(见 Context 1)。
- 命令里写绝对 node / 资产路径:每次升级都改 hash,已信任的 hook 静默变 `modified`。
- 读 `config.toml` 判断信任 / 已装:越过凭据文件边界;`hooks/list` 与 `codex plugin list` 已给出同样信息。
