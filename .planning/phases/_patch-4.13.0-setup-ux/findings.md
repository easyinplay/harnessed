# findings — setup UX 用户反馈根因调查 (2026-07-02)

用户反馈原文(v4.12.0 `harnessed setup` 全新机器 C:\Users\easyinplay):
1. 检查上游时等待时间很长(300.3s),无提示/过场动画,像卡死
2. mattpocock-skills / design-taste-frontend / ctx7 / chrome-devtools-mcp / exa-mcp 总是检测不到 + 安装失败
3. 检查结果希望表格/列表输出

## 根因 1 — MCP 并行安装 race(chrome-devtools-mcp / exa-mcp failed,tavily 幸存)

- `runStepBInstall`(src/cli/lib/setup-helpers.ts:99)对全部 13 个 manifest `Promise.allSettled` 并行。
- 3 个 mcp-stdio-add manifest 各自 spawn `claude mcp add --scope user` → 每个进程读-改-写整个 `~/.claude.json` → lost update,最后写入者(tavily)幸存。
- 各 installer 的 verify(`isMcpServerRegistered` 直读 ~/.claude.json,mcpStdioAdd.ts:187)在被 clobber 后执行 → "not found in mcpServers map ... after install spawn exit 0(file may have been overwritten)" — 报错信息自己猜中了根因。
- 证据:用户输出 tavily installed、chrome/exa 双双同错;错误措辞逐字匹配 mcpStdioAdd.ts:196。

## 根因 2 — npx skills add 交互提示挂死 300s(mattpocock-skills / design-taste-frontend)

- spawnCmd(src/installers/lib/spawn.ts:130)spawn 时未设 stdio,stdin 默认 `pipe`(打开但永不喂数据)。
- vercel-labs `skills` CLI 有交互 prompt(agent 选择/确认);manifest cmd 未带 `-y`:
  - mattpocock: `npx --yes skills@latest add mattpocock/skills --copy --global`
  - design-taste: `npx --yes skills@latest add Leonxlnx/taste-skill --skill design-taste-frontend --copy`
- 全新机器上 CLI 弹 prompt → stdin 永不响应 → 300s DEFAULT_INSTALL_TIMEOUT_MS SIGKILL,"partial stderr:" 为空(prompt 走 stdout)。
- skills CLI 实测 flags(`npx skills@latest --help` 2026-07-02):`-y, --yes` Skip confirmation prompts;`-a, --agent <agents>`;`-s, --skill <skills>`;`--all`。
- 300.3s 总耗时 = 两个 npx 卡满 300s 超时(并行),这也是"像卡死"主因。

## 根因 3 — extractSkillName 不解析 `--skill`,verify 路径与真实布局不符("总是检测不到")

- `extractSkillName`(src/installers/lib/idempotent.ts:38)只取 `skills add <owner/repo>` 的 repo 段:
  - design-taste → `taste-skill`(错,应取 `--skill design-taste-frontend`)
  - mattpocock → `skills`(错;已有 INSTALLED_INDICATORS 兜底 detection,但 install 后 fs verify 仍用错误路径)
- npxSkillInstaller 主 verify `~/.claude/skills/<segment>/SKILL.md`(npxSkillInstaller.ts:104-105/149)用同一错误 segment → npx 成功也报 verify-failed。
- 真实布局(本机 easyi 实证):
  - mattpocock:散装 `~/.claude/skills/diagnose/`、`zoom-out/`(无 mattpocock-skills/ 父目录)
  - design-taste:`~/.agents/skills/design-taste-frontend/`(--copy 无 --global 也可能进 ~/.claude)
- INSTALLED_INDICATORS(idempotent.ts:82)只扫 `getSkillsDir()`(~/.claude/skills),不扫 ~/.agents/skills。
- manifest verify cmd 也错:mattpocock `test -f ~/.claude/skills/mattpocock-skills/diagnose.md`(实际是 diagnose/SKILL.md)。

## 根因 4 — ctx7 L4 被 setup 硬编码 nonInteractive 永久跳过

- ctx7 manifest = npm-cli `npm install -g ctx7` → detectLevel L4(npmCli.ts:26)。
- runStepBInstall 硬编码 `system: false, nonInteractive: true`(setup-helpers.ts:87-96)→ confirmAt L4 直接 `flag-missing`(confirm.ts:36-44)→ 每次 setup 都 "skipped — level-flag-missing"。
- npmCli 里的 H3 三向交互降级 prompt 被 nonInteractive 短路,永远到不了。
- setup 结尾 runAutoInstall 的 doctor CHECKS 里也没有 ctx7 → 无任何可交互安装路径。

## 根因 5 — Step B 静默(UX)

- runStepBInstall quiet:true,从起跑到汇总零输出;正常也要 10-60s,叠加根因 2 变成 5 分钟死寂。

## 附带发现

- playwright-test.yaml cmd 同样缺 `-y`(目前碰巧不 prompt,同样脆弱)。
- doctor check-mattpocock-skills 的 INSTALL_COMMANDS `npx skills@latest add mattpocock/skills` 缺 `-y --copy`(auto-install 用 stdio inherit 交互可用,但 CI 下会挂)。
- karpathy-skills 走 cc-plugin-marketplace(claude plugin install,非交互)→ 成功,解释了同类组件为何有装得上的。
