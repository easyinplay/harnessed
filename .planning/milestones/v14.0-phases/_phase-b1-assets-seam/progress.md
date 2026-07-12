# progress — B1 资产解析 seam(4.19.0)

## 任务状态
- T1 assetsRoot seam — DONE(TDD 先红:模块缺失确认红 → 10/10 绿)
- T2 消费点迁移 — DONE(10 文件,清单见下)
- T3 i18n 内嵌 en 兜底 — DONE(TDD 先红 3 例;messagesDir 的 assetsRoot 候选**撤回**,原因见"实测教训")
- T4 install already-installed 显示 — DONE(TDD 先红 1 例;i18n keys en/zh 手术式 +2 行)
- T5 收尾 — DONE(CHANGELOG 4.19.0 + bump + 本文件)

## D3 消费点迁移清单(全部为资产读取;非资产用途 0 处)
| 文件 | 资产 |
|---|---|
| src/cli/setup.ts | workflows/ + manifests/(Step A/B) |
| src/cli/install-base.ts | manifests/ |
| src/cli/install.ts | manifests/(三层 tier) |
| src/cli/uninstall.ts | workflows/ + manifests/ |
| src/cli/prompt.ts | workflows/ |
| src/cli/run.ts | workflows/(模块级 const) |
| src/cli/research.ts | workflows/(模块级 const) |
| src/cli/gates.ts | workflows/ |
| src/cli/checkpoint.ts | workflows/(动态 import,evidence checkArtifacts) |
| src/cli/update.ts | CHANGELOG.md |
- i18n messages/:经内嵌 en 兜底覆盖 compiled 场景;目录候选保持 import.meta 双候选(见教训)。

## 实测教训(两条,均已入代码注释)
1. **setupFiles 预加载击穿 mock**:tests/setup-i18n.ts 在任何 vi.mock 注册前加载 i18n;
   i18n 若静态 import assetsRoot→packagePath,会把依赖链钉进未 mock 缓存,gates/setup-locale
   的 packagePath mock 全体失效(14+3 测试红)。修:撤 i18n→assetsRoot 静态依赖,compiled
   可用性由内嵌 en 承担;Phase 2 若接 messages 解包需用惰性方案。
2. **bun import.meta.url 百分号编码**:compiled 产物实测 `file:///B:/%7EBUN/root/cli.exe`
   (`~`→`%7E`),检测必须先 decodeURIComponent;测试已钉真实观测形。
   另:assetsRoot 的 stateRoot 必须惰性 thunk(急切 detectPlatform 在部分 mock 环境抛)。

## 端到端验证(本机,Windows + bun 1.3.14)
- compiled exe + 手工铺设 ~/.claude/harnessed/assets/4.18.0/{workflows,manifests,messages,routing,config-templates}
  → 异地 cwd `setup --dry-run` 列出全部 28 workflows ✓
- 移除 assets 目录 → exit 1 + 英文报错指向 assets 路径(内嵌 en 生效,不再裸奔 key)✓
- 勘误:spike 记录的 "exit 0" 是管道吞退出码的测量伪影,真实一直 exit 1。

## 验证
- vitest 全量:终验见最终回复 tally;红→绿全程记录
- tsc 0;biome clean(1 warning 为 HEAD 既有);scripts/check-*.mjs 见终验
- dist 内嵌验证:`already-installed {{name}}`×2 / `mcp_hint`×3 in dist/cli.mjs ✓

## 被更新的既有断言
无(全部新增用例:assetsRoot 10 + i18n 4 + install 1;既有 1852 全绿保持)。

## Phase 2 待办(边界外,已知)
- 资产嵌入/解包数据源(tar/清单 → assets/<ver>/)+ bun 编译管线 + CI 冒烟 job
- messages/ 解包接线(惰性方案,避开 setupFiles 教训)
- 发布管线:3 平台交叉编译 / 签名 / gh release 资产 / 自更新
