# task_plan — 4.15.1 WSL-bash 根因修复 + doctor 假阳性 + 输出打磨

status: ready-to-execute
根因(用户 dogfood v4.15.0,机器 easyinplay):PATH 上 bash = C:\Windows\System32\bash.exe(WSL stub,无发行版,
exit 1 + CP936 报错走 stdout)。4.14 起全部 posixShell spawn 打到它 → 二级 verify / ctx7 verify / force-update
refresh 全灭(组件实际装成功,doctor 证实)。doctor checkWinBash 早已检出但 setup 不消费。
TDD: T1/T2/T4 核心逻辑先测。

## T1 — Windows bash 显式解析(root cause)[src/installers/lib/spawn.ts + 新 lib/resolveBash.ts]
- `resolveBashPath(): string | null` 顺序:env HARNESSED_BASH → `where git` 派生(<git>\..\bin\bash.exe /
  usr\bin\bash.exe)→ 标准位置探测(Program Files\Git\bin、Program Files (x86)、%LOCALAPPDATA%\Programs\Git)→
  PATH 上 bash 但**拒绝** \Windows\System32\bash.exe 与 \Windows\Sysnative(WSL)→ null。结果 memoize。
- spawnCmd posixShell 分支用解析结果;null → 现有 'bash-missing' 错误路径,消息含 "PATH 上的 bash 是 WSL stub"
  场景说明 + Git Bash 安装/调序 hint(复用 doctor fix 文案)。
- checkWinBash 改用同一 resolver(SoT):Git Bash 可解析 → pass(即便 PATH 首位是 WSL,注明 harnessed 已绕过;
  ralph-loop fork 风险保留为 warn 而非 fail);WSL stub 输出乱码不再内嵌 — 消息截首行 + 过滤不可打印字符(cap 120)。

## T2 — test-chain 原生求值(零 shell 防御层)[新 lib/nativeTest.ts + spawn 调用点]
- 纯 `test -f|-d <path>` 以 `||`/`&&` 连接的 cmd(本仓 verify/idempotent 的主形态)→ fs.access 原生求值,
  `~/` 展开 homedir,不 spawn 任何 shell。spawnCmd 内 posixShell 且 cmd 匹配该文法时直接走原生;不匹配再 spawn。
- 覆盖:gsd/gstack/playwright/mattpocock/design-taste/ui-ux 的 verify+idempotent 全部零 shell 化。

## T3 — quiet 泄漏 + 空错误文本 [npmCli.ts + 各 installer 错误消息 + spawn.ts]
- npmCli "(L4 system install — global PATH change; see cmd above)" 行加 !quiet 门(setup quiet 下无 cmd 可看,
  且出现在进度流里错位)。
- verify 失败消息重构:`manifest verify failed (exit N): <cmd 截断 80> — <stderr 截断,空则取 stdout 截断,再空则 '(no output)'>`;
  杜绝 "exit 1 ≠ expected 0: " 悬空冒号。spawnCmd 错误消息同样 stderr 空时补 stdout tail(WSL 报错在 stdout)。

## T4 — doctor 假阳性 [check-builtin.ts + gstack probe]
- checkMcpScope:v3.0.2 起 `--scope user` 是设计意图(mcpStdioAdd 注释链),user-scope mcpServers → **pass**
  (message 说明 intended);不再引用 CC #54803 fail。名称改 'mcp scope';测试同步。
- gstack 检查(probe-gstack.ts / doctor 注册处):PATH 找二进制 → 改 probe `~/.claude/skills/gstack/office-hours/SKILL.md`
  (+ harnessSkillsDirs 遍历 + 旧布局 fallback);fix 文案改 `harnessed setup`(移除不存在的 `npm i -g @gstack/cli`)。

## T5 — setup 输出继续打磨(用户点名"看看还能继续改进")
- 分隔线宽度 = 实际列宽合计(现在近似值,视觉溢出)。
- force-update 二 pass 前打一行 `force-updating N plugin(s)...`(与首 pass 的 installing 行对称)。
- failed 行 note 现在有实内容(T3);kept-existing 提示行保留。
- 收尾失败摘要:存在 failed 时末尾一行 `N component(s) failed — see notes above; re-run \`harnessed setup\` or \`harnessed doctor\``(已有 doctor hint,合并措辞,别重复)。

## T6 — 收尾
- vitest 全量 + tsc + biome + scripts/check-*.mjs;不涉 typebox(无需 build:schema,若涉则按 memory 先 build)。
- CHANGELOG `## [4.15.1]`(中文)+ package.json bump + progress.md。不 commit 不 push。
