# task_plan — 4.16.1 ctx7 重复 L4 + 错误取尾 + 死区 + bun 依赖显性化

status: ready-to-execute
dogfood v4.16.0(同机):9/10 转绿。残留:(1) ctx7 已装但每次 setup 仍 level-flag-missing + 重复 L4 prompt;
(2) gstack kept-existing 原因仍被截断且 ↳ 详细块未出现;(3) 真因已实证 = 上游 setup 首查 `command -v bun`
缺失即 exit 1,报错在 stderr 尾部,而 spawn-fail 消息取头部把它裁掉。
TDD: T1/T2 先测。

## T1 — npm-cli 原生已装检测(ctx7 重复 L4 根因)[idempotent.ts]
- detectNative 的 npm-cli 分支:现只查 `<skillsDir>/<name>`(对 CLI 工具无意义)→ 增加二进制探测:
  `where <bin>`(win)/`which <bin>`(unix)via spawnSync(参考 check-builtin checkJq 模式,try/catch 容忍
  partial mock)。bin 名取 manifest verify cmd 首 token(`ctx7 --version` → `ctx7`),回退 metadata.name。
- 效果:第二次 setup ctx7 → already-installed,不再进 L4 gate / 不再重复 prompt。

## T2 — spawn-fail 消息取尾部 + 详细块死区修复 [verifyMessage.ts + setup.ts]
- formatSpawnFail / spawn 超时消息:输出摘录改取 stderr(空则 stdout)的**尾部** ~300 chars(错误在末尾;
  git clone 场景头部全是进度),sanitize 保留;`Cloning into` 头部噪声自然消失,gstack 将直接显示
  "Error: bun is required but not installed."。
- printGrouped 详细块触发条件修复:不再比较 `full.length <= NOTE_MAX`(90-100 死区),改为
  "渲染后的 note 发生截断 OR note 内容 ≠ full" 即打印 ↳ 全文(cap 400)。

## T3 — bun 依赖显性化 [check-builtin.ts 或新 check + doctor 注册]
- 新 doctor check `bun present`(warn-only,非 fail):`where/which bun`;缺失 → warn,message 注明
  "gstack setup 构建依赖(browse binary)",install_commands 按平台:win `winget install Oven-sh.Bun`、
  darwin `brew install oven-sh/bun/bun`、linux 官方 curl 脚本提示(auto-install 只给可静默命令,linux 给 fix 文案)。
- setup 末 runAutoInstall 自动纳入(CHECKS 注册)。

## T4 — 收尾
- vitest 全量 + tsc + biome + scripts/check-*.mjs;CHANGELOG `## [4.16.1]`(中文,含 bun 真因故事)+
  bump 4.16.1 + progress.md。不 commit 不 push。
