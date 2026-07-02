# findings — setup CC-only 残留审计 + codex research (2026-07-02)

背景:harnessed 已支持 `--platform claude|codex`(v9.0 PlatformDescriptor seam),用户要求检查 setup 里只适配 CC 的情况,并按"完整方案"修复(含 codex MCP 写入)。

## 已正确适配(不动)
- Step A:getSkillsDir()/getCommandsDir() descriptor 路由
- enableAgentTeamsInSettings / enableUserLangInSettings:supportsEnvKeyWrite 门控
- isPluginRegistered:codex pluginsRegistry=null 容忍
- detectSkillPresence / harnessSkillsDirs:双目录 descriptor 派生
- l4-rescue(npm -g)平台中立;--platform pin 机制完好

## CC-only 残留清单(按严重度)
1. mcpStdioAdd.ts:159 / mcpHttpAdd.ts:233:硬编码 spawn `claude mcp add --scope user`(runClaudeArgs 前缀 'claude')。codex-only 机器 spawn 失败;双装机器悄悄写进 CC 的 ~/.claude.json(错平台副作用)。verify isMcpServerRegistered 读 getMcpConfigPath()=config.toml 却 JSON.parse → 永远 {}。
2. preflight.ts:49:只有 OS platform 门,无 harness 门;CC-only method 在 codex 下不会被跳过。
3. ccPluginMarketplace.ts:186,194(karpathy-skills):`claude plugin marketplace add` + `claude plugin install`,codex 无 plugin 体系。
4. manifests 3 个 + check-mattpocock-skills.ts INSTALL_COMMANDS:4.13.0 加的 `--agent claude-code` 钉死 CC 落点。
5. npxSkillInstaller.ts:103(uninstallers/npxSkillInstaller.ts:23 同):DiffPlan/backup 硬编码 homedir()/.claude/skills。
6. setup-helpers.ts warnIfAgentTeamsMissing + checkAgentTeams.ts:24,45:codex 下仍读 ~/.claude/settings.json、打印 `claude config set` 建议(Agent Teams 是 CC-only 概念)。
7. setup.ts:426 setup.mcp_hint:"Run /mcp in Claude Code..." 无条件打印。
8. doctor checks:check-mattpocock-skills(~/.claude/skills + plugins/cache)、check-token-budget:27、check-builtin:72(`claude mcp add` fix 建议)。
9. uninstall.ts:99-101,196、uninstallers/ccHookAdd.ts:26:同类硬编码(setup 之外,一并修)。
10. confirmAt L3 文案提 ~/.claude.json(纯文案,低优先)。
11. uninstallers/mcp*/ccPluginMarketplace:runArgs('claude ...') 同 #1/#3。

## codex research(2026-07-02 本机实证,codex-cli 0.133.0-alpha.1)
- `codex mcp` 子命令:list / get / add / remove / login / logout。
  - stdio:`codex mcp add <NAME> -- <COMMAND>...`(`--env KEY=VALUE` 仅 stdio 有效)
  - http:`codex mcp add <NAME> --url <URL>`
  - 卸载:`codex mcp remove <NAME>`
- ~/.codex/config.toml 实测 schema:
  - stdio:`[mcp_servers.<name>]` + `command = "..."` + `args = [...]`(可选 `startup_timeout_sec`、`[mcp_servers.<name>.env]`)
  - http:`[mcp_servers.<name>]` + `url = "..."`
  - codex 自己的 `mcp add` 在 Windows 上写成 `command="cmd", args=["/c","npx",...]` 包装
- verify/idempotent 读侧:存在性探测用行首 header 正则 `[mcp_servers.<name>]` / `[mcp_servers."<name>"]`(TOML 名含点会加引号),不需要完整 TOML parser;repo 无 TOML 依赖,不新增。
- skills CLI valid agents(`npx skills ls --agent` 报错清单实证):含 `claude-code`、`codex` → `--agent` 可按 descriptor.id 注入。
- 本机 codex.exe 不在 PATH(AppData\Local\OpenAI\Codex\bin\<hash>\codex.exe)。运行时策略:spawn PATH 上的 `codex`,ENOENT → 明确报错 "codex CLI not found on PATH",不去猜 hash 目录。

## 附录 — cc-plugin/git-clone/npm 组件上游多 agent 安装法核查(2026-07-02 实证)

用户指正触发:cc-plugin-marketplace 只是安装方法,上游不一定 CC 专属。逐个 README/CLI 核查:

- codex CLI plugin 面(codex-cli 0.133.0 本机实证):`codex plugin marketplace add <local|owner/repo[@ref]|git-url>`、
  `codex plugin add <PLUGIN[@MARKETPLACE]>`、`codex plugin remove`、`codex plugin list` — 与 claude 同构 headless。
- superpowers(obra/superpowers):README 官方支持 Claude Code / Antigravity / Codex App / Codex CLI / Cursor / Droid /
  Copilot CLI / Kimi / OpenCode / Pi。openai/plugins marketplace 含 superpowers;本机 codex `plugin list` 显示
  `superpowers@openai-curated (not installed)` — openai-curated 为预置 marketplace,单步 `codex plugin add` 即可。
- planning-with-files(OthmanAdi):README "installs across 60+ agents via the SKILL.md standard",明确 `npx skills add`
  + Codex(.codex hooks adapter、docs/codex.md),v3.1.x changelog 大量 codex 修复。
- karpathy-skills(forrestchang):README 仅 CC plugin / CLAUDE.md / Cursor rule 三路径;但 repo 为标准 skills/
  结构(skills/karpathy-guidelines),skills CLI 可装任意含 SKILL.md 的 repo → codex 走 skills CLI(非官方路径,notice 标注)。
- ralph-loop:anthropics/claude-plugins-official 专属;openai/plugins 无 ralph-loop → codex 无等价,诚实跳过。
- gsd(open-gsd/gsd-core):官方支持 Claude/OpenCode/Gemini/Kimi/Kilo/Codex/Copilot/Cursor/Windsurf;
  docs/how-to/install-on-your-runtime.md 实证 `npx @opengsd/gsd-core@latest --codex --global`,装到
  `~/.codex/skills/gsd-*/SKILL.md` + config.toml per-agent TOML。
- ui-ux-pro-max(midwayjs/midway):manifest 现行 cmd 就是从上游 `.codex/skills/ui-ux-pro-max` 拷出来装进
  ~/.claude/skills — 上游本体即 codex 形态,codex override 只需换 cp 目标。
- gstack(garrytan/gstack):clone 到 ~/.claude/skills/gstack + setup.sh,CC 深度绑定;codex 支持未见 → 跳过 + follow-up。

设计落点:manifest schema 增可选 `spec.harness_overrides.codex`(install/verify 子块),dispatch 按平台合并;
无 override 的 CC-only method → 'harness-mismatch' 诚实跳过。
