# task_plan — 4.16.2 force-update 收尾三项(dogfood v4.16.1:13/14 绿,余噪声/尾巴)

status: ready-to-execute
用户点名 force-update 两处 ⚠ + ctx7 force pass 尾巴。定性:
- gstack ⚠ = 设计内警告(ADR 0037 force-update SHA 漂移降级)但行动项在我们:pin 过期该 bump
- ui-ux ⚠ = 永久性噪声:cmd 设计内自删 clone 目录,SHA 天生不可验,每轮 force-update 都会 warn 一遍
- ctx7 force pass `skipped — level-flag-missing`:force 语义 bypass 已装探测 → 直撞 L4 门,文案误导
  (首 pass already-installed 已修好;这是 force pass 专属尾巴)

## T1 — gstack git_ref bump [manifests/skill-packs/gstack.yaml]
- 14fc0866... → 11de390be1be6849eb9a15f91ff4922dd16c589a(base + codex override 两处),
  upstream_health.last_check 更新为今日、last_known_good_version 按上游当前版本(README/tag 可查则填,
  查不到保留原值并注明)。

## T2 — 自删 clone 目录的 SHA 检查静默跳过 [gitCloneWithSetup.ts]
- cmd 中 clone 之后出现针对 cloneTarget 的 `rm -rf`(字符串定位:rm -rf 片段含 cloneTarget 路径尾段且
  位置在 git clone 之后)→ 判定 self-cleaning by design → 跳过 rev-parse,**不输出 warn**(注释说明:
  SHA unverifiable by design,manifest verify 是 authority;ADR 0037 已记该模式)。
- cloneTarget 因其他原因缺失(非 self-cleaning cmd)→ 保留 4.16.0 的 warn 降级路径。
- TDD:self-cleaning(ui-ux cmd 形状)静默 + 非 self-cleaning 缺目录仍 warn 两用例。

## T3 — L4 force-pass 文案 [npmCli.ts / setup-helpers 映射]
- force-update(ctx.opts.updateInstalled && nonInteractive && 无 system)撞 L4 门时,skip reason 改
  `L4 system-scope — excluded from force-update; update manually: npm update -g <pkg>`(reason 为自由文本,
  链路已支持);普通 pass 的 'level-flag-missing'(供 L4 rescue 过滤)保持不变——rescue 的 filter 依赖该
  字面值,勿破坏。
- TDD:force 与非 force 两分支 reason 断言。

## T4 — 收尾
- vitest 全量 + tsc + biome + scripts/check-*.mjs;CHANGELOG `## [4.16.2]`(中文,Edit 工具写)+
  bump 4.16.2 + progress.md。不 commit 不 push。
