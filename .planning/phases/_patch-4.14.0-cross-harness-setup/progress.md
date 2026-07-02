# progress — patch 4.14.0 cross-harness setup parity (2026-07-02)

## 任务状态(T3 按 REVISED 版执行)

- T1 runHarnessArgs 泛化 — DONE:`runClaudeArgs.ts` 新 `runHarnessArgs('claude'|'codex', ...)`;`runArgs` 保留 claude 简写;codex ENOENT → "codex CLI not found on PATH" fail-loud;`ProcResult` 增 `stdout`(codex plugin list verify 用);stdin ignore 维持
- T2 MCP 双平台路由 — DONE:mcpStdioAdd / mcpHttpAdd 按 descriptor.id 分支(claude args 逐字节不变;codex `mcp add <name> -- npx...` / `--url`;其他 id → harness-mismatch);http+headers 在 codex → fail-loud `harness-unsupported-headers`;`isMcpServerRegistered` 平台感知(codex = config.toml header 正则 `isMcpServerInToml`,含 quoted/sub-table/转义);DiffPlan target/文案按平台;detectNative 增 MCP 原生探测分支(只 short-circuit true)
- T3 REVISED harness_overrides — DONE:schema `spec.harness_overrides.codex{install, verify?}`(复用 install union + Verify,additionalProperties:false);`resolveForHarness` 导出 + runInstall dispatch 前合并;CLAUDE_ONLY_METHODS = {cc-plugin-marketplace, cc-hook-add} 无 override 兜底 harness-mismatch;ccPluginMarketplace codex 分支(parseCmd 认 `plugin add`、`codex plugin add <p>@<m>`、verify spawn `codex plugin list` stdout 15s、installer 级 gate 认 codex-flavored cmd);5 manifest override 落地(superpowers/karpathy/planning-with-files/gsd/ui-ux-pro-max),ralph-loop/gstack 不加;runStepBInstall 把 harness-mismatch 展开为 "claude-only install method (no <id> equivalent)"
- T4 --agent 注入 — DONE:3 manifest 撤 `--agent claude-code`(保留 -y);npxSkillInstaller 按平台注入(claude→claude-code / codex→codex / 其他→不注入;显式 --agent/-a 优先);doctor check-mattpocock INSTALL_COMMANDS 改函数按平台计算
- T5 uninstall 对齐 — DONE:mcp 卸载 bin 按平台;ccPlugin 卸载非 claude → ok:false preflight(提示 `codex plugin remove`);npxSkill uninstall → getSkillsDir();ccHookAdd → getSettingsPath();uninstall.ts unified 三路径 + state-dir 守卫 → descriptor
- T6 文案/探测门控 — DONE:warnIfAgentTeamsMissing + check-agent-teams-doctor 非 claude 直接 pass-skip;checkAgentTeams 读 getSettingsPath();setup.mcp_hint 按平台(新 key `setup.mcp_hint_codex` en/zh-Hans 同步);confirmAt L3 文案通用化
- T7 doctor checks — DONE:check-mattpocock(registry 门控 + harnessSkillsDirs 遍历)/ check-planning-with-files(registry null → pass-skip)/ checkMcpScope(非 claude pass-skip)/ check-token-budget(getSkillsDir)
- T8 收尾 — DONE:CHANGELOG `## [4.14.0]` + package.json 4.14.0 + SCHEMA.md § 3 增 2 行 harness_overrides + 本文件

## 验证

- vitest 全量:**1760 passed / 0 failed**(195 files passed + 3 skipped;5 skip + 1 todo)
- `tsc --noEmit` 0 errors;biome check --write clean(8 files 格式化)
- 7 个 scripts/check-*.mjs 全 OK;新增全量真实 manifest schema 校验 sweep(13+ manifests 全过,含 5 个 override manifest)
- TDD:新测试先红后绿(首轮 9 files failed → 实现后 79/79)

## 既有断言变更(仅 2 处,均为 harnessSkillsDirs 第三项的必然后果)

1. tests/installers/platform-codex.test.ts `harnessSkillsDirs` — 2 项 → 3 项(+~/.codex/skills;T3 REVISED 第 5 点)
2. tests/integration/dual-platform.test.ts 同一断言 — 同上

## 偏差说明

1. mcp-http `--header` 在 codex:task_plan 写 "abort harness-mismatch + 说明",但 aborted 无消息通道 → 实现为 `ok:false phase:preflight`(keyword `harness-unsupported-headers` + suggest),语义更忠实于 "+说明"。
2. `cc-hook-add` 一并加入 CLAUDE_ONLY_METHODS(hooks 写 settings.json 是 CC 专属;task_plan 未点名但同类)。
3. uninstall dispatch 未做 override 合并(codex 装的 superpowers 需手动 `codex plugin remove`,uninstaller 返回明确提示)— follow-up 项。
4. karpathy codex override cmd 加了 `--skill karpathy-guidelines`(repo 单 skill 结构,显式化让 extractSkillName/verify 精确;task_plan 原文无此 flag)。
5. 附带发现(未动,超范围):check-builtin `checkMcpScope` 的语义与 v3.0.2 `--scope user` 设计相矛盾(装完 MCP 后 doctor 会 FAIL "user-scope mcpServers")— 建议后续 phase 重审该 check。

## 新增/改动文件清单

见 git status;新增:src/…/(无新 src 模块,resolveForHarness 在 index.ts)、tests/unit/{installers-lib-runClaudeArgs,installers-lib-readClaudeConfig-toml,installers-harness-overrides,uninstallers-harness,cli-harness-gates}.test.ts
