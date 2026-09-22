# Phase 64 SUMMARY — codex hooks 经本地插件(v16.0 / 1b)

**完成**:2026-09-23 · commit `6edac3f` · CI run 35761453264 三 OS 全绿 · 本机 54 测试文件 / 596 例绿 ·
`pnpm test:codex-live` 29/29(codex-cli 0.155.1,每 hook p95 765ms < 1s 预算)。

## 交付
- **插件承载**:`~/.codex/harnessed/marketplace` 生成 `harnessed-<hook>@harnessed-local`;命令字面量固定
  (npm `node "${PLUGIN_ROOT}/hook.cjs" <id> … --platform codex`,binary `harnessed <id> … --platform codex`,
  `command` / `commandWindows` 同文),升级只改 `${PLUGIN_DATA}/install.json` → `trusted_hash` 不失效。
  **不写 `~/.codex/hooks.json`**(位置信任键会毒化他人 hook)。
- **信任**:app-server JSON-RPC(`hooks/list` + `config/batchWrite`),正则命名空间守卫;交互同意 /
  `--trust-codex-hooks` / 非交互默认不信任;RPC 四态降级并明示。
- **hook 侧**:`--platform codex` 传宿主(hook 进程无 `CODEX_*`);codex 下 session id 取 stdin `session_id`。
- **doctor**:新增 codex hooks 检查(插件 / 信任状态 / shim / PATH),CHECKS 23 → 24。
- **卸载**:plugin remove → 清空 cache 目录 → `config/batchWrite` 删信任条目 → 删插件目录;并修既有 bug
  (`uninstall <name>` 现在也扫 `manifests/optional/`)。
- **live smoke**:`pnpm test:codex-live`(隔离 CODEX_HOME + 真实 home 的命名空间探针插件 + 自动清理)。
- ADR 0041;fixture 取自 0.154 真实 payload(脱敏)。

## 实施中推翻 / 修正的前提(均有实测)
1. **pwsh 压退出码** → codex 上 exit 2 的 PreToolUse 阻断到不了宿主;`check-docs` 改 stdout JSON
   (`permissionDecision: deny` / `systemMessage`,exit 0)。开工细化 R3「check-docs 不加参数」作废。
2. **既有缺陷**:`perturn-inject-invalidate` description 149 > schema 120(4.38.0 起),安装校验失败且在
   setup optional 列表静默缺席 → 已修 + `optional-manifests-valid.test.ts` 守住。
3. **凭据边界**:codex 上 `ccPluginMarketplace` 曾把 `config.toml` 纳入 backup(会复制含凭据的文件)→ 已改为不 backup。
4. **codex 契约补充**:`${PLUGIN_DATA}` = `<CODEX_HOME>/plugins/data/<plugin>-<marketplace>`(不预建);
   `plugin remove` 不删 data、留空 cache;`marketplace remove` 不幂等;信任删除 = 引号 keyPath + `value:null`;
   未知 app-server 方法返回 `-32600`;app-server 启动会在 `CODEX_HOME/.tmp` 拉后台 git fetch(临时 home 删除偶发 EPERM)。

## Lessons
- **提交必须带 pathspec**:本次不带 pathspec 的 `git commit` 把另一会话暂存区里的 3 个 README 一并推上 main
  (对方工作树更新版本仍在,未丢数据)。已记入项目记忆。
