# task_plan — 4.18.0 setup optional 组件推荐块(codegraph 可从 setup 安装)

status: ready-to-execute
现状:manifests/optional/(codegraph npm-cli L4 / ecc cc-plugin / perturn-inject cc-hook)不进 Step B glob
(Phase 18 D2 opt-in 锁定);`harnessed install <name>` 三层解析已通(install.ts:72);setup 无任何入口。
用户指示:完善 — setup 能装 codegraph。
TDD: T1 先测。

## T1 — optional-offer 交互块 [新 src/cli/lib/optional-offer.ts + setup.ts]
- 时机:L4 rescue 块之后、setup.complete 摘要之前;门:TTY && !--non-interactive && !--dry-run。
- 行为:glob manifests/optional/*.yaml → validate → isAlreadyInstalled 探测 → 已装项跳过(输出一行
  already-installed 汇总);未装项逐个展示 display_name + description + install cmd → clack confirm
  (initialValue: false — opt-in 默认不装)→ 同意:runInstall(L4 → {system:true, nonInteractive:true,
  apply:true}(consent 即本 confirm,sister l4-rescue 注释先例);非 L4 → {apply:true, nonInteractive:true})。
- 结果行:✓ installed / ↷ skipped / ✗ failed + reason(formatSpawnFail 风格)。
- 非 TTY / --non-interactive:打印 advisory 一行(`N optional component(s) available — install with
  \`harnessed install <name>\`: codegraph, …`),不 prompt。
- 独立新模块(mock-export-gap 教训);setup.ts 动态 import(沿 l4-rescue 先例)。
- codegraph 装完若成功,追加提示行:`run \`codegraph init\` in each project to build its index`(上游两步语义)。

## T2 — codegraph manifest verify 稳健化 [manifests/optional/codegraph.yaml]
- verify cmd `codegraph status` → `codegraph --version`(status 需项目上下文与否未验,--version 仅证
  binary 就位;注释说明)。timeout 维持。upstream_health.last_check 更新。

## T3 — 收尾
- vitest 全量 + tsc + biome + scripts/check-*.mjs;CHANGELOG `## [4.18.0]`(中文,Edit 工具写)+
  bump 4.18.0 + progress.md。不 commit 不 push。
