# task_plan — B2 资产解包数据源 + bun 编译管线 + CI/发布(bun-compile 路线 Phase 2)

status: ready-to-execute
上游:B1 seam 已发布(4.19.0,getAssetsRoot compiled 分支 fail-loud 待接解包);spike findings。
原则:npm 渠道(tsup dist)零改动;二进制是**新增**产物。
TDD: T1/T2/T4 先测。

## 锁定决策
- D1 资产打包格式:build 脚本生成 `assets-bundle.json`(单 JSON:{version, files: {relPath: base64}};
  资产集 = workflows/ manifests/ messages/ routing/ config-templates/ schemas/;总量 ~2MB 文本,base64 可接受)。
  零新依赖(否 tar/zip);生成物进 .gitignore,不进 npm files。
- D2 编译入口:新 `src/compile/entry.ts` — import assets-bundle.json(仅此入口引用,tsup/npm 不受影响)
  → 首跑解包:assetsRoot 目标缺失时原子写 `<stateRoot>/assets/<version>/`(临时目录 + rename,
  已存在跳过;写失败 fail-loud 保留 B1 消息)→ 动态 import 现有 cli 主入口。
  `bun build --compile src/compile/entry.ts`(bun 原生吃 TS;npm 的 tsup 管线不动)。
- D3 构建脚本:`scripts/build-binary.mjs`(生成 bundle json + 调 bun build --compile,--target 参数
  透传;输出 dist-bin/harnessed-<os>-<arch>[.exe])+ package.json script `build:binary`。
  版本号进 bundle json(compiled 模式 --version/update-check 不再依赖 packageRoot 的 package.json)。
- D4 CI/发布:ci.yml 增 binary-smoke job(3-OS matrix:oven-sh/setup-bun → pnpm build 前置?entry 走 src
  不需 dist → build:binary → 冒烟:--version 断言 + 异地 cwd `setup --dry-run` stdout 含 28 workflows 计数
  + doctor exit 0);publish.yml 增 per-OS build-binary job,tag 发布后 `gh release upload <tag> dist-bin/*`。
  交叉编译(--target)不作为 CI 路径(spike 未实测,各 OS 原生编译更稳),--target 仅本地便利。
- D5 i18n 遗留接线(B1 撤回项):messagesDir 候选加 assetsRoot,但解析改**惰性**(首次 t() 调用时才触
  getAssetsRoot,规避 vitest setupFiles 预加载 vs vi.mock 时序 — B1 progress.md 有击穿 17 测试的记录,
  验收 = 该 17 测试保持绿 + compiled 下 zh-Hans 从解包目录读到)。
- D6 已知限制(记录不深做):perturn-inject hook cmd 依赖 node;二进制用户可能无 node — 该 manifest
  notice + optional-offer 展示处加一句提示即可。
- D7 解包完整性:bundle json 带 files 计数;解包后校验计数一致才 rename 生效;版本目录隔离
  (assets/<ver>/)天然处理升级,旧版本目录不清理(留 doctor/gc 未来处理,记 follow-up)。

## T1 — build 脚本 + bundle 生成 [scripts/build-binary.mjs + .gitignore + package.json]
TDD:bundle 生成器纯函数(资产枚举/编码/计数)单测;脚本本体薄壳。

## T2 — compile entry + 首跑解包 [src/compile/entry.ts + 解包 lib(独立模块,可单测)]
TDD:解包器(缺失→写+计数校验+原子 rename;已存在→跳过;写失败→fail-loud)deps 注入单测。

## T3 — 本机端到端(Windows,bun 已装)
build:binary → exe 异地 cwd:--version 输出 4.20.0;setup --dry-run 列 28 workflows(自动化断言,
B1 是手工验证);doctor 通过;二次运行走已存在跳过(解包只发生一次)。结果记 progress.md。

## T4 — i18n 惰性接线 [src/i18n/index.ts](D5)

## T5 — CI/发布 yml [ci.yml + publish.yml](D4;yml 无法本地全验,语法用 actionlint/仔细 review,
标注"首个 tag 发布时验证"风险)

## T6 — 收尾
vitest 全量 + tsc + biome + scripts/check-*.mjs;CHANGELOG `## [4.20.0]`(中文,Edit 工具写;注明
二进制为新增渠道 + D6 限制)+ bump 4.20.0 + progress.md(含 D7 gc follow-up)。不 commit 不 push。
