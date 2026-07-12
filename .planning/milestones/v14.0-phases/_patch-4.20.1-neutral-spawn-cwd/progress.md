# progress — 4.20.1 中性 spawn cwd(EBADDEVENGINES 免疫)

## 任务状态

- T1 getNeutralSpawnCwd — DONE(TDD 先红):安置于 safeCwd.ts(与 getMcpSpawnCwd 同家;grep 确认全仓
  无任何对 safeCwd 的 vi.mock factory,新增导出无 mock-export-gap 风险)。解析:env `HARNESSED_SPAWN_CWD`
  verbatim(trim)→ `<stateRoot>/.spawn/` mkdir + 哨兵 package.json(`{"name":"harnessed-neutral-spawn",
  "private":true}`,无 devEngines/engines;已存在不覆盖)→ 任意 fs 失败 return null(fail-open)。
  哨兵是方案核心:stateRoot 在被污染 home 之下,无哨兵仍会被祖先 package.json 命中。
- T2 接线 — DONE:spawnCmd 新 `opts.neutralCwd`(`installCfg.cwd ?? (neutralCwd ? neutral ?? ctx.cwd : ctx.cwd)`,
  manifest cwd 最高优先);npmCli install+verify、npxSkillInstaller install+硬崩重试+verify 共 5 个
  spawnCmd 调用点;auto-install spawnSync 加 `cwd: getNeutralSpawnCwd() ?? undefined`。
  gitCloneWithSetup 不改(cmd 内嵌 cd 且 git 不读 devEngines);mcp/ccPlugin 走 runArgs/getMcpSpawnCwd 不动。
- T3 复现回归 — DONE(真跑,Windows + npm 11.16):
  ```
  A) 污染目录(devengines-repro,package.json 带 devEngines runtime bun)直跑:
     npx --yes skills@1.5.7 --version → npm error code EBADDEVENGINES(Invalid name "bun" ≠ "node")
  B) 同一污染树下的哨兵子目录(.spawn/ + name-only package.json):
     npx --yes skills@1.5.7 --version → 1.5.7,exit 0
  ```
  证据链:单测证 helper 产出 {dir + 哨兵};E2E 证 {dir + 哨兵} 击败 npm 向上查找(生产同拓扑:
  ~ 污染 + ~/.claude/harnessed/.spawn 哨兵)。
- T4 收尾 — DONE:CHANGELOG `## [4.20.1]`(Edit 写入,ANSI 0)+ package.json 4.20.1。

## 测试基建说明

tests/setup-i18n.ts 全局钉 `HARNESSED_SPAWN_CWD` = `<os.tmpdir()>/harnessed-test-neutral-spawn`(mkdir
确保存在):既有套件经真实 spawnCmd 触达 helper 时不再对真实/伪造 homedir 做 fs 写(npxSkill 套件
mock homedir='/tmp/fake-home',无该钉扎会在宿主真实创建垃圾目录)。installers-lib-safeCwd.test.ts
逐 cell 删除该 env + 用 HARNESSED_ROOTOVERRIDE→tmp 走真实 fs 分支。

## 验证

- vitest 全量(--no-file-parallelism 权威 tally):**1902 passed / 0 failed**(212 files,净增 +9:
  safeCwd 4 + spawn 路由 2 + npmCli 1 + npxSkill 1 + auto-install 1)。
  注:一轮并行跑出现过 16 file 抖动失败,复跑 + 串行均 0 fail — memory 已记录的负载抖动类,非回归。
- tsc 0;biome clean(1 warning 为 HEAD 既有);scripts/check-*.mjs 7/7 OK。

## 被更新的既有断言

无 — 全部为新增 cell;auto-install 套件新增 node:child_process + @clack/prompts 顶层 mock(既有 cell
不 spawn 不 prompt,mock 惰性)。

## 偏差说明

1. auto-install 的 cwd 断言 cell(F5)需要交互路径 → 给该套件补了 child_process/clack mock,与其
   头注释 "Real spawnSync NOT exercised" 精神一致(仍未真 spawn)。
2. npmCli 的 verify spawn 也接了 neutralCwd(task_plan D2 含 verify;`ctx7 --version` 类经此免疫)。
