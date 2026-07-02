# task_plan — patch 4.13.0 setup UX(根因见 findings.md)

status: ready-to-execute
scope: setup 安装管线 5 根因修复 + 进度输出 + 表格化结果
TDD: T1-T4 核心安装/检测逻辑必须先测(红→绿);T5/T6 输出格式类以快照/字符串断言覆盖

## T1 — spawn stdin 关闭(防交互挂死)[src/installers/lib/spawn.ts]
- 所有 spawn 调用加 `stdio: ['ignore', 'pipe', 'pipe']`(win cmd.exe / bash / posix sh 三分支)。
- 验收:交互式子进程无法等待 stdin;现有 spawn 测试不回归。

## T2 — MCP 安装串行化 [src/cli/lib/setup-helpers.ts]
- runStepBInstall:先统一 read+validate;按 `spec.install.method ∈ {mcp-stdio-add, mcp-http-add}` 分区;
  MCP 组顺序 await(共享 ~/.claude.json 写),其余保持 Promise.allSettled 并行;结果合并、elapsedMs 不变语义。
- 验收:单测模拟 3 个 mcp manifest 断言顺序执行(mock runInstall 记录并发数 max=1);非 MCP 并发不受限。

## T3 — skill 名解析 + 检测/verify 对齐真实布局 [src/installers/lib/idempotent.ts + npxSkillInstaller.ts]
- extractSkillName:优先解析 `--skill <name>`(含 `-s`);无则现行 repo 段回退。
- INSTALLED_INDICATORS 遍历 `harnessSkillsDirs()`(~/.claude/skills + ~/.agents/skills)而非仅 getSkillsDir()。
- npxSkillInstaller install 后主 verify 改用与 detectNative 同源逻辑(indicators-aware + 双目录),不再拼 `~/.claude/skills/<segment>/SKILL.md` 单路径。
- 验收:design-taste cmd → `design-taste-frontend`;mattpocock 装完(散装 diagnose/)verify 通过。

## T4 — L4 post-pass 交互安装(ctx7)[src/cli/setup.ts]
- printGrouped 后:收集 skipped reason==='level-flag-missing' 项;TTY 且非 --non-interactive 时逐项 clack confirm
  (展示 install.cmd),同意 → 以 `{system:true, apply:true, nonInteractive:true}` 重跑该 manifest runInstall,输出结果行。
- 验收:非 TTY 行为不变;确认后 ctx7 走 npm -g 安装 + verify。

## T5 — Step B 进度输出 [setup-helpers.ts + setup.ts]
- runStepBInstall 加 `onProgress?: (ev: {done,total,name,status}) => void`,每 settle 回调。
- setup 传 printer:起始行 `installing N upstream components (parallel)...` + 每完成一行 `  [done/total] <status> <name>`。
- 验收:非 TTY 也有逐行输出;quiet 传 installer 不变。

## T6 — 分组结果表格化 [setup.ts printGrouped]
- 每组渲染对齐表格列:status | component | note(note 截断 ~100 chars);failed 用 console.error、kept-existing 用 warn(保留现有流语义);状态附 glyph(✓ ✗ ↷ ●)。
- 验收:字符串快照测试;宽度按组内最长 name 计算。

## T7 — manifest 修正 [manifests/]
- mattpocock-skills.yaml:cmd 加 `-y --agent claude-code`;verify/idempotent_check 改
  `test -f ~/.claude/skills/diagnose/SKILL.md || test -f ~/.agents/skills/diagnose/SKILL.md`。
- design-taste-frontend.yaml:cmd 加 `-y --agent claude-code`;verify 加 `|| test -f ~/.agents/skills/design-taste-frontend/SKILL.md`。
- playwright-test.yaml:cmd 加 `-y --agent claude-code`(防御)。
- 验收:manifest schema 校验通过(validateManifestFile)。

## T8 — doctor/auto-install 一致性 [src/cli/lib/check-mattpocock-skills.ts]
- INSTALL_COMMANDS 改 `npx skills@latest add mattpocock/skills --copy -y --agent claude-code`。

## 收尾
- `pnpm exec biome check --write` → vitest 全绿 → scripts/check-*.mjs 本地 gate → CHANGELOG 4.13.0 条目 → commit(不 push,等用户批准)。
