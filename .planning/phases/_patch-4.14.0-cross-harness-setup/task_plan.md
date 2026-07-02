# task_plan — 4.14.0 cross-harness setup parity(完整方案,根因/research 见 findings.md)

status: ready-to-execute
scope: setup/uninstall 管线全平台化 — codex MCP 写入 + harness 门 + --agent 注入 + descriptor 路由 + 文案门控
TDD: T1-T5 核心路由/写入逻辑必须先测

## T1 — runClaudeArgs 泛化为 harness-CLI spawn [src/installers/lib/runClaudeArgs.ts]
- 新 `runHarnessArgs(bin: 'claude'|'codex', args, cwd, timeoutMs?)`;`runArgs` 保留为 claude 简写(现有调用零改动)。
- codex spawn ENOENT → 明确错误 "codex CLI not found on PATH — install Codex CLI or re-run setup on the claude platform"。
- stdio ignore 维持(4.13.0)。

## T2 — MCP installer 双平台路由 [mcpStdioAdd.ts / mcpHttpAdd.ts + readClaudeConfig.ts]
- descriptor.id==='claude' → 现行 `claude mcp add --scope user`。
- id==='codex' → `codex mcp add <name> -- npx --yes <pkg>@<ver>`(stdio)/ `codex mcp add <name> --url <url>`(http;manifest 带 headers 时 abort harness-mismatch + 说明)。
- 其他 id → aborted reason 'harness-mismatch'。
- verify:`isMcpServerRegistered(name)` 平台感知 — claude 现行 JSON 读;codex 读 config.toml 行首 header 正则(`[mcp_servers.<name>]` 与 `[mcp_servers."<name>"]` 两形,name 转义)。
- DiffPlan 文案按平台显示目标文件(~/.claude.json vs ~/.codex/config.toml)。
- idempotent:detectNative 增 mcp-stdio-add/mcp-http-add 分支 → isMcpServerRegistered(双平台原生,替代 shell `claude mcp list | grep` fallback)。

## T3 (REVISED 2026-07-02) — harness_overrides + per-component codex 路径 [schema + ccPluginMarketplace.ts + manifests]
> 用户指正:cc-plugin-marketplace 装的组件不一定 CC 专属。上游 README 逐个核查(实证见 findings.md 附录),
> codex CLI 有同构 headless plugin 面:`codex plugin marketplace add <owner/repo|url>` / `codex plugin add PLUGIN@MARKETPLACE` / `remove` / `list`。

- schema 增可选 `spec.harness_overrides.codex: { install: {...同 install 子 schema...}, verify?: {...} }`;
  runInstall dispatch 前按 detectPlatform().id 合并 override(codex 有 override → 用 override 的 method/cmd/idempotent_check/verify)。
- 无 override 且 method ∈ CC-only(cc-plugin-marketplace)→ aborted 'harness-mismatch' + hint(维持原 T3 兜底)。
- ccPluginMarketplace 在 codex override 下走 runHarnessArgs('codex', ['plugin','add','<p>@<m>'])(marketplace 预置时单步;
  cmd 含 marketplace add 时两步);verify 用 spawn `codex plugin list` + name 匹配(15s)。
- per-manifest codex override(全部实证):
  - superpowers → `codex plugin add superpowers@openai-curated`(openai-curated 为 codex 预置 marketplace,superpowers 在列)
  - karpathy-skills → npx-skill-installer `npx --yes skills@latest add forrestchang/andrej-karpathy-skills --copy -y`(repo 标准 skills/karpathy-guidelines 结构;notice 标注 README 无 codex 官方路径)
  - planning-with-files → npx-skill-installer `npx --yes skills@latest add OthmanAdi/planning-with-files --copy -y`(README 明确 60+ agents + .codex adapter)
  - gsd(npm-cli)→ `npx --yes @opengsd/gsd-core@latest --codex --global`(官方 docs 实证;装到 ~/.codex/skills/gsd-*/)
  - ui-ux-pro-max(git-clone)→ 同 clone,cp 目标改 `~/.agents/skills/ui-ux-pro-max`(上游源码本就在 midway .codex/skills/)
  - ralph-loop → 无 override(claude-plugins-official 专属,openai/plugins 无)→ harness-mismatch skip + hint
  - gstack → 无 override(CC 深度绑定)→ harness-mismatch skip + hint;上游 codex 支持标 follow-up
- InstallResult aborted reason union 增 'harness-mismatch'(全链路容纳)。
- detectNative 探测目录集增加 `~/.codex/skills`(gsd --codex 装那里;harnessSkillsDirs 或独立探测清单,选一处 SoT)。

## T4 — npx-skill --agent 按平台注入 [npxSkillInstaller.ts + manifests + check-mattpocock-skills.ts]
- manifests 撤掉 4.13.0 写死的 `--agent claude-code`(保留 `-y`);installer spawn 前 authoritative 追加 ` --agent <claude-code|codex>`(map: claude→claude-code, codex→codex;其他 id → 不注入,交给 skills CLI 自侦测)。注入值需过 checkCmdString。
- doctor INSTALL_COMMANDS 同步按 detectPlatform().id 计算 agent。

## T5 — uninstall 侧对齐 [src/uninstallers/* + src/cli/uninstall.ts]
- uninstallers/mcpStdioAdd + mcpHttpAdd:codex → `codex mcp remove <name>`(runHarnessArgs)。
- uninstallers/ccPluginMarketplace:id!=='claude' → 明确跳过。
- uninstallers/npxSkillInstaller.ts:23 + installers/npxSkillInstaller.ts:103 → getSkillsDir()。
- uninstallers/ccHookAdd.ts:26 → getSettingsPath();uninstall.ts:99-101,196 → descriptor resolvers。

## T6 — CC-only 文案/探测门控 [setup-helpers.ts / checkAgentTeams.ts / setup.ts / messages/*.json]
- warnIfAgentTeamsMissing:detectPlatform().id!=='claude' → 直接 return(Agent Teams CC-only)。
- checkAgentTeams:读 getSettingsPath() 而非硬编码(行为 claude 下不变)。
- setup.mcp_hint:claude 现行;codex 加 key `setup.mcp_hint_codex`("Run `codex mcp list` to verify MCP server connections.")双语(messages/en.json + zh-Hans.json 同步,防 i18n-parity gate)。
- confirmAt L3 文案:~/.claude.json → "the harness user-scope config"(通用化)。

## T7 — doctor checks descriptor 路由 [check-mattpocock-skills.ts / check-token-budget.ts / check-builtin.ts / check-planning-with-files.ts]
- 路径探测改 harnessSkillsDirs()/getSkillsDir()/getPluginsRegistry()(pluginsRegistry null → 跳过 plugin-cache probe)。
- check-builtin fix 文案按平台给 `claude mcp add` / `codex mcp add`。
- 行为约束:claude 平台下输出与现行 byte-compatible(测试断言)。

## T8 — 收尾
- vitest 全绿(全量串行 tally)+ tsc + biome + scripts/check-*.mjs(注意 messages/*.json 双语 parity)。
- CHANGELOG `## [4.14.0]`(中文,Fixed/Added 分节)+ package.json 4.14.0 + progress.md。
- 不 commit 不 push(主 session 验收提交)。

## 锁定的设计决策(不再开放)
- 写入走 codex CLI 而非直接 TOML merge(与 claude 路径同形、零新依赖、原子性交给 codex 自己)。
- 读侧存在性探测用 header 正则,不引 TOML parser。
- codex 不在 PATH → fail-loud 明确报错,不猜 AppData hash 目录。
- karpathy(cc-plugin)在 codex 下 = 诚实跳过,不做 codex 等价实现(codex 无 plugin 体系)。
