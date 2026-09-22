# Phase 63 findings

- **F1 brainstorming 跳过**:设计全部在 SPEC 锁定(office-hours / CEO / ENG 三关 + codex 实测),无多方案待比较。TDD 执行(核心判定逻辑,回归敏感)。
- **F2 getSettingsPath 调用方(12 文件,rg 核实 2026-09-22)**:
  `src/installers/ccHookAdd.ts:67` · `src/uninstallers/ccHookAdd.ts:35` · `src/cli/lib/check-stale-hooks.ts:29` ·
  `src/installers/lib/readClaudeConfig.ts:195` · `src/installers/lib/idempotent.ts:252` · `src/cli/lib/settingsWriter.ts:58` ·
  `src/cli/lib/check-guard-conflict.ts:43` · `src/cli/lib/search-mcp-keys.ts:58` · `src/cli/lib/guard-exemption.ts:126,164` ·
  `src/cli/lib/checkAgentTeams.ts:24` · `src/cli/lib/check-inject-invalidate.ts:39`。
- **F3 config.toml 断言作用域**:`readClaudeConfig.ts` 经 `getMcpConfigPath()` 读 codex `config.toml` 做 `[mcp_servers.*]` / `[plugins."p@m"]` 段头探测 —— 既有、有意的 MCP/插件安装校验,**不在本 phase 改动范围**。「从不打开 config.toml」断言只针对 settingsPath 链(T3 的 12 处)。`readClaudeConfig.ts:195` 循环里 `getSettingsPath()` 在 codex 上为 null 时跳过该项即可。
- **F4 bin 是产物**:`bin/harnessed-{stop-hook,inject-state}.mjs` 由 `scripts/build-hooks.mjs` esbuild 生成;复制品在 `src/checkpoint/hookStateRoot.ts` 与 `injectStateMain.ts:67`。
- **F5 测试隔离**:tests 下 33 文件依赖 `HARNESSED_ROOT_OVERRIDE` 强制 claude;override 语义改为只换根后,由 T5 的 setupFile 清宿主 env 保证这些测试仍解析为 claude(无 env、无 pin、目录探测在隔离 root 下)。若某测试因目录探测命中真实 `~/.codex` 而变 codex → 该测试需显式 `HARNESSED_PLATFORM=claude` 或注入 home。
