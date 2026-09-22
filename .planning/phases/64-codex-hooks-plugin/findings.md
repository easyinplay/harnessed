# Phase 64 findings(预记,开工时 refine)

- **F1 hook 侧必须显式传宿主**:codex hook 进程的 env 是 app-server 父进程快照,**不含 `CODEX_*`**(实测);
  若 codex 从 CC 终端启动,快照里还带 `CLAUDE_CODE_SESSION_ID` → Phase 63 的 env 嗅探会判 claude。
  故插件 hooks.json 的命令字面量必须带 `--platform codex`(或 shim 设 `HARNESSED_PLATFORM=codex` 再转发)。
  CLI 侧(codex shell 内)两种 env 并存时判歧义落 pin,符合 ADR 0040。
- **F2 pwsh 压退出码(三 shell 契约测试揪出,偏离 R3)**:codex 在 Windows 用 `pwsh -NoProfile -Command <cmd>`
  跑 hook(codex-rs `core/src/shell.rs` derive_exec_args;`hooks/src/engine/command_runner.rs` build_command),
  pwsh 对任何失败的外部命令报 1(实测 exit 3 → 1)。codex PreToolUse 只认 exit 2 + stderr 或 exit 0 + JSON
  (`events/pre_tool_use.rs`),exit 1 只是 "hook exited with code 1" 错误 → doc-discipline-gate 在 Windows codex
  上不会阻断。修正:check-docs 也带 `--platform codex`,codex 下以 stdout JSON 表达裁决
  (halt → `permissionDecision: deny`,warn → `systemMessage`,exit 0)。R3「check-docs 不加参数」据此作废。
- **F3 codex 契约补充实测(codex-cli 0.155.1,隔离 CODEX_HOME)**:`codex plugin list --json` →
  `{installed:[{pluginId, installed, enabled}], available}`(表格为回退;单次 spawn 约 1.7 s → 进程内缓存);
  `marketplace add` / `plugin add` / `plugin remove` 幂等,`marketplace remove` 不幂等("is not configured" exit 1);
  重复 `plugin add` 刷新 cache 副本;`plugin remove` 不删 `plugins/data/<p>-<m>`、留空 `plugins/cache/<m>`;
  `${PLUGIN_DATA}` = `<CODEX_HOME>/plugins/data/<plugin>-<marketplace>`(codex-rs core-plugins/src/store.rs,不预建);
  信任删除 = `config/batchWrite {keyPath:'hooks.state."<key>"', value:null}`,删后 hooks/list 回到 untrusted;
  未知 app-server 方法 → -32600 "unknown variant"(非 -32601);app-server 启动在 `CODEX_HOME/.tmp` 起后台
  `git fetch`,退出后仍存活 → 临时 CODEX_HOME 删除偶发 EPERM(live 脚本清理 non-fatal)。
- **F4 既有缺陷**:`manifests/optional/perturn-inject-invalidate.yaml`(4.38.0)description 149 字符 > 120 →
  `harnessed install perturn-inject-invalidate` 校验失败,setup optional 勾选静默不列出。已修 + 全量校验测试。
- **F5 live smoke**(Windows,codex 0.155.1,pwsh):durationMs SessionStart 594 / UserPromptSubmit 565 /
  PreToolUse 765(p95 < 1000,余量不大);同一命令 pwsh p50 ≈ 360 ms vs `cmd /c` ≈ 100 ms(差额为 pwsh 启动)。
  注入以 hook `context` entry 回到会话。模型是否调用 shell 非确定,脚本把「PreToolUse 已触发」列为断言。
- **F6** 本机 codex 已升 0.155.1(fixture 捕获于 0.154,字段集未变);live 脚本打印 minor 漂移提示。
- **TDD 跳过声明**:`setup --trust-codex-hooks` 两行透传无独立测试(setup 测试全量 mock;被透传的
  `runOptionalOffer({ trustCodexHooks })` 分支已由 `cli-lib-optional-offer.test.ts` 覆盖)。T9 为表征测试(首跑即绿)。
