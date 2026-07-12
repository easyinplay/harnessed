# task_plan — 4.20.1 中性 spawn cwd(EBADDEVENGINES 环境污染免疫)

status: ready-to-execute
dogfood v4.20.0(同机):force-update 中 gsd/playwright-test/mattpocock/design-taste 4 个 npm/npx 类
安装 `npm error EBADDEVENGINES required bun 1.3.14`。
根因(本机复现实锤):npm exec 读 cwd 向上最近 package.json 的 devEngines;用户从 home 跑 setup,
home 存在 bun 生成的 `devEngines: {runtime: {name:'bun', onFail:'download'}}` package.json → npm 只认
runtime name "node" → 该目录下一切 npx 必死。上游三包(skills@latest/1.5.7、gsd-core)均无 devEngines,
排除上游。失败的 4 个全是 npm/npx 类,git/claude-plugin 类全过 — 边界干净。
TDD: T1 先测。

## 锁定决策
- D1 药方 = v3.0.2 getMcpSpawnCwd 先例推广:npm/npx 类安装是全局语义(-g / --global / --copy),
  cwd 本无意义,不应继承用户 shell cwd。新 `getNeutralSpawnCwd()`:`<stateRoot>/.spawn/`
  (mkdir -p 确保存在;保证无 package.json 祖先污染 — 注意 stateRoot 在 ~/.claude/harnessed,
  其祖先 ~/ 可能有 package.json!npm 会向上找 — 因此该目录必须自带**哨兵 package.json**
  (`{"name":"harnessed-neutral-spawn","private":true}`,无 devEngines)截断向上查找)。
- D2 生效面:npmCli + npxSkillInstaller 的 install spawn 与 verify spawn(binaryProbe 的 where/which
  不受影响);gitCloneWithSetup 不改(cmd 内嵌 cd,且 git 不读 devEngines);mcp/ccPlugin 已走
  getMcpSpawnCwd/runArgs 不动;manifest `install.cwd` 显式声明仍最高优先。
- D3 auto-install(doctor install_commands 的 spawnSync)与 l4-rescue / optional-offer 经 runInstall
  → 同一 spawn 路径自动获益;auto-install 的直接 spawnSync 也补 cwd 参数。
- D4 formatSpawnFail 不加 EBADDEVENGINES 特判(修复后不再发生;↳ 全文块已能自诊)。

## T1 — getNeutralSpawnCwd + 哨兵 [新 lib 或并入 safeCwd.ts(先看现有 getMcpSpawnCwd 的家)]
TDD:目录创建 + 哨兵 package.json 写入(已存在不覆盖)+ 返回路径;失败回退 ctx.cwd(fail-open 保持现状,
注释说明)。
## T2 — 接线 [npmCli.ts + npxSkillInstaller.ts + auto-install.ts]
TDD:spawn 调用的 cwd 断言(中性 vs manifest cwd override 优先)。
## T3 — 本机复现回归:devengines-repro 目录下跑 `node dist/cli.mjs install <npx 类>`(或等价单测/
集成)证明免疫;结果记 progress.md。
## T4 — 收尾:vitest 全量 + tsc + biome + gates;CHANGELOG `## [4.20.1]`(中文,Edit 写)+ bump +
progress.md。不 commit 不 push。
