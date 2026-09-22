# Phase 64 — codex hooks 经本地插件(v16.0 / 1b,minor)

SPEC:`.planning/specs/2026-09-22-codex-host-parity-v16.md` §「Phase 64」(唯一真相源)+ 本文件的「开工细化」(对 SPEC 的落地修正,2026-09-22 按代码实测)。
Status: in-progress

## 开工细化(对 SPEC 的修正,均源自代码实测)

- R1 入口:**不新增 `--with`**。沿用既有入口 `harnessed install <name>`(扫 `manifests/optional/`,`src/cli/install.ts:72`)与 setup 的 optional 勾选(`src/cli/lib/optional-offer.ts`)。
- R2 port 集合:perturn-inject、perturn-inject-invalidate、doc-discipline-gate。**dashboard-autospawn 不 port**(`manifests/cc-hooks/` 任何 CLI 路径都不扫描,claude 上同样不可达;记为已知限制)。stop-hook-recover skip(CC transcript 专用)。
- R3 hook 宿主识别:inject-state 接受 `--platform codex`(在 `detectPlatform()` 前设 `HARNESSED_PLATFORM`);codex 下 session id 取 hook **stdin 的 `session_id`**(hook 进程无 `CODEX_*` env);check-docs 无平台依赖,不加参数。
- R4 命令字面量(hash 稳定):npm 模式 `node "${PLUGIN_ROOT}/hook.cjs" <id> [args] --platform codex`,shim 从 `${PLUGIN_DATA}` 下的 `install.json` 读 harnessed 资产根并转发(stdin 透传、退出码透传);binary 模式 `harnessed <id> [args] --platform codex`(PATH)。`command` 与 `commandWindows` 同文。
- R5 codex 插件操作**串行**(模块级互斥),防并发 `codex plugin add` 竞写 config.toml。
- R6 「已装」探测改用 `codex plugin list` 输出;**顺带迁移** `readClaudeConfig.ts` 的 codex 插件探测(当前读 config.toml 正则段头)到同一来源 —— 兑现「不读 config.toml」边界。MCP 探测(`[mcp_servers.*]`)不在本 phase。
- R7 修既有 bug:`harnessed uninstall <name>` 查找 manifest 时也扫 `optional/`(`src/cli/uninstall.ts:306-325`)。
- R8 同意:`harnessed install` / setup optional 路径交互时征得同意再写信任;非交互默认不信任,`--trust-codex-hooks` 显式同意。

## 验收

- [x] `tsc --noEmit` 0;biome 绿;`scripts/check-*.mjs` 全绿(注意 check-schema-consumers:新 schema 字段必须有读取方)
- [ ] 相关测试本机绿;CI 三 OS 绿
- [x] 三 shell(cmd / pwsh / sh)契约测试:真实执行生成的 `command` / `commandWindows`(shim 链路)
- [x] fs 打桩:新 codex 路径与迁移后的插件探测不打开 config.toml
- [x] `pnpm test:codex-live` 在本机跑通并记录 durationMs(p95 < 1s)
- [x] CHANGELOG `[Unreleased]` + ADR 0041 + `manifests/SCHEMA.md` 行 62 更新

## 任务(TDD,顺序)

| T | 内容 | 主要文件 |
|---|---|---|
| T1 | 插件生成器:marketplace.json / plugin.json / hooks.json(R4 字面量)/ shim(`hook.cjs`)/ `install.json`(PLUGIN_DATA);纯函数 + 快照测试 | `src/installers/lib/codexHookPlugin.ts`(NEW) |
| T2 | inject-state `--platform` + codex 下 stdin `session_id`;重生成 bin | `src/checkpoint/injectStateMain.ts`, `src/cli/injectStateCmd.ts`, `bin/*` |
| T3 | 信任客户端:app-server JSON-RPC(initialize → hooks/list → config/batchWrite upsert `hooks.state`),四态(成功 / 方法缺失 / 超时 / 非 JSON),只触碰 `harnessed-*@harnessed-local` key | `src/installers/lib/codexHookTrust.ts`(NEW) |
| T4 | 安装分派:codex 上 `cc-hook-add` → 生成插件 + marketplace add(幂等)+ plugin add + 同意后信任;串行互斥(R5);InstallResult 结果区分「待信任」 | `src/installers/index.ts`, `src/installers/ccHookAdd.ts`, `src/installers/lib/types.ts` |
| T5 | 「已装」探测改 `codex plugin list`(R6),含既有 codex 插件探测迁移 | `src/installers/lib/readClaudeConfig.ts`, `idempotent.ts` |
| T6 | 同意交互 + `--trust-codex-hooks` + 非交互默认不信任(R8) | `src/cli/install.ts`, `src/cli/lib/optional-offer.ts`, `src/cli/setup.ts` |
| T7 | 卸载:plugin remove → 删空 cache 目录 → batchWrite 删信任条目(先实测删除语义)→ 删插件目录;修 R7 | `src/uninstallers/ccHookAdd.ts`, `src/cli/uninstall.ts` |
| T8 | doctor:codex 分支(插件已装、信任状态 trusted/untrusted/modified/未知、shim 链路、binary 在 PATH) | `src/cli/lib/check-stale-hooks.ts` / 新 check,`doctor-registry.ts`,`tests/cli/doctor.test.ts` 计数 |
| T9 | 真实 payload fixture(脱敏)→ `tests/fixtures/codex-hooks/0.154/`,驱动 hook 输入解析测试 | tests |
| T10 | `pnpm test:codex-live`(`scripts/codex-live/`):隔离 CODEX_HOME 验 hooks/list + 信任;真实 home 用 `harnessed-probe-*` 命名空间插件验注入可见 + 清理;记录 durationMs | scripts, package.json |
| T11 | ADR 0041 + SCHEMA.md + CHANGELOG | docs |
