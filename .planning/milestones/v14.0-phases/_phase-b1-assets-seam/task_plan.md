# task_plan — B1 资产解析 seam(bun-compile 路线 Phase 1)+ spike bug 双修

status: ready-to-execute
上游依据:.planning/phases/_spike-bun-compile/findings.md(2026-07-04 实测)。
定位:v9.0 PlatformDescriptor seam 同款打法 — Phase 1 建 seam + npm 现状零行为变化;
真正的资产嵌入/解包数据源与编译管线一起放 Phase 2。用户已拍板 B 档方向(binary 与 npm 并行)。
TDD: T1/T3/T4 先测。

## 锁定决策
- D1 新 resolver `getAssetsRoot()`(单一 SoT,src/cli/lib/packagePath.ts 内或独立模块——注意该文件被
  vi.mock 的消费面,倾向独立新模块 assetsRoot.ts,mock-export-gap 教训):
  优先级 (1) env `HARNESSED_ASSETS_OVERRIDE`(测试/逃生) → (2) compiled 检测为真 → `<stateRoot>/assets/<version>/`
  且做存在性校验,缺失 → fail-loud(明确消息:"compiled binary assets not unpacked — Phase 2 管线未就位/损坏,
  重装或用 npm 渠道",本 phase 不实现解包) → (3) 默认 = getPackageRoot()(npm/dev,零变化)。
- D2 compiled 检测:import.meta.url 指向 bun 虚拟文件系统(`/$bunfs/` 或 Windows `B:/~BUN/` 前缀;
  两形都判,写成常量 + 注释引用 spike 实测)。
- D3 资产消费点迁移:grep getPackageRoot 全部消费方(setup/install-base/install/prompt/run/research/
  checkpoint/gates/uninstall/update + renderSkillTemplates/generateCommands 等间接),凡读 workflows/ /
  manifests/ / messages/ / routing/ / config-templates/ 的改走 getAssetsRoot();非资产用途(如版本读取
  package.json)保留 getPackageRoot 并逐处判别记录。npm 模式下两者相等 → 行为逐字节不变(回归网 1852)。
- D4 i18n 兜底(spike bug #1 的根治):build 时把 messages/en.json 作为模块内嵌(tsup json import),
  t() 加载顺序:文件系统 locale json(现状)→ 缺失/读失败 → 内嵌 en 兜底 → 仍缺 key → 现状 key 裸奔。
  同时 workflows_not_found 路径 exit code 改非 0(现状 exit 0 是 bug)。
- D5 install 显示修复(spike bug #2):already-installed 结果打印 `already-installed <name>@<ver>`
  (不再冒充 installed);相邻 aborted/failed 输出核对一遍措辞。
- D6 不做:资产嵌入与解包实现、bun 编译管线、CI bun job(全部 Phase 2);开发工具链不动。

## T1 — assetsRoot 模块 + compiled 检测 [新 src/cli/lib/assetsRoot.ts]
TDD:override 优先 / compiled 检测两形 / compiled 缺资产 fail-loud 消息 / 默认回落 packageRoot。

## T2 — 消费点迁移 [D3 清单]
每处迁移在 progress.md 记一行(路径 + 资产类别);npm 模式等价性靠全量回归网。

## T3 — i18n 内嵌兜底 + exit code [src/i18n/index.ts + setup.ts]
TDD:messagesDir 缺失时 t() 返回 en 文案(非 key);setup workflows_not_found → exit(1)。
注意 zh-Hans 缺失 → 内嵌 en(可用性优先于语言偏好),注释说明。

## T4 — install already-installed 显示 [src/cli/install.ts]
TDD:alreadyInstalled 结果行断言。

## T5 — 收尾
vitest 全量 + tsc + biome + scripts/check-*.mjs;若 tsup json import 影响 build → 先 build 再验;
CHANGELOG `## [4.19.0]`(中文,Edit 工具写,注明 B1 seam 定位与 Phase 2 边界)+ bump 4.19.0 + progress.md。
不 commit 不 push。
