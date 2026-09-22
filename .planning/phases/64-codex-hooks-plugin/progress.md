# Phase 64 progress

- 2026-09-22 T1 done — `src/installers/lib/codexHookPlugin.ts`(生成器 + shim)；`tests/installers/codexHookPlugin.test.ts` 红→绿 18/18；三 shell 契约 `codexHookShell.contract.test.ts` 12/12(cmd/pwsh/sh 本机全跑,无 skip)。契约测试揪出 pwsh 压退出码(F2)。
- 2026-09-22 T2 done — `src/checkpoint/hookHost.ts`(NEW,dep-free)+ injectStateMain `--platform` / stdin `session_id`;`bin/harnessed-inject-state.mjs` 重生成;`injectStateCmd` 接受 `--platform`;check-docs `--platform codex` 走 JSON verdict(F2 修正)。`injectState-codexHook.test.ts` 3 红→4 绿;`check-docs-codex.test.ts` 6 红→绿;`injectStateCmd.test.ts` 1 红→绿。
- 2026-09-22 T3 done — `src/installers/lib/codexHookTrust.ts`(NEW):app-server client,四态 + spawn-failed;命名空间守卫 `harnessed-*@harnessed-local:`;删除 = null + 引号 keyPath(隔离 CODEX_HOME 实测)。`codexHookTrust.test.ts` 缺模块红 → 18 绿。
- 2026-09-22 T4 done — `src/installers/codexHookAdd.ts`(NEW)+ `ccHookAdd.ts` codex 分派 + `CLAUDE_ONLY_METHODS` 去 cc-hook-add;`InstallOpts.codexHookTrust` / `InstallResult.trustPending`;`withCodexPluginLock`(R5)。`codexHookAdd.test.ts` 13 红 → 15 绿;`ccHookAdd.test.ts` codex 段改为分派断言。
- 2026-09-22 T5 done — `src/installers/lib/codexPlugins.ts`(NEW,`codex plugin list --json` + 表格回退 + 进程内缓存);`readClaudeConfig.isPluginRegistered` codex 分支迁移、删 `isPluginInToml`;`idempotent.ts` cc-hook-add codex 分支。`codexPlugins.test.ts`(含 fs 打桩:不打开 config.toml)缺模块红 → 8 绿。
- 2026-09-22 T6 done — `install --trust-codex-hooks`(交互 ask / 非交互 deny)、optional-offer(ask / grant)、`setup --trust-codex-hooks` 透传;trustPending 输出。`cli-install.test.ts` 3 红 → 绿,`cli-lib-optional-offer.test.ts` 1 红 → 绿;setup 透传两行无独立测试(见 findings)。
- 2026-09-22 T7 done — `removeCodexHook`(plugin remove → 删空 cache/harnessed-local → untrust(hooks/list 预取 + 确定性 key)→ 删插件 / data 目录 → 末个时 marketplace remove);R7 `uninstall.ts` 扫 optional/。`codexHookAdd.test.ts` uninstall 3 例、`uninstall.test.ts` R7 1 红 → 绿。
- 2026-09-23 T8 done — `src/cli/lib/check-codex-hooks.ts`(NEW)+ doctor-registry 第 24 项;`check-codex-hooks.test.ts` 缺模块红 → 10 绿(含「不读 config.toml」);`doctor.test.ts` 计数 23→24 + mock。
- 2026-09-23 T9 done — `tests/fixtures/codex-hooks/0.154/`(5 份脱敏 payload)+ `codexHookPayload.fixtures.test.ts` 7 绿(表征测试)。
- 2026-09-23 T10 done — `scripts/codex-live/run.mjs` + `pnpm test:codex-live`:29/29 PASS;durationMs SessionStart 594 / UserPromptSubmit 565 / PreToolUse 765;probe 插件清理确认。live 揪出 F4(perturn-inject-invalidate 校验失败)→ 已修 + `optional-manifests-valid.test.ts` 1 红 → 7 绿。
- 2026-09-23 T11 done — ADR 0041 + ADR README 行 + `manifests/SCHEMA.md` harness_overrides 行 + CHANGELOG `[Unreleased]`。
- 2026-09-23 verify — `tsc --noEmit` 0;`biome check .` 0 error(17 warning,含既有 noTemplateCurlyInString);9 个 `scripts/check-*.mjs` 全 exit 0;相关 vitest 全绿(高负载下 5s 超时属环境 flake,隔离重跑 8+13 文件 275 例全绿);`pnpm test:codex-live` 29/29。CI 三 OS 待验证。
