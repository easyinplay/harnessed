# progress — 4.16.2 force-update 收尾三项

## 任务状态
- T1 gstack git_ref bump — DONE:14fc0866 → 11de390b(base + codex override 两处;gh api HEAD 实证);
  last_check 2026-07-03、last_known_good_version 1.58.0.0 → 1.58.5.0(上游 VERSION 文件实证)。
- T2 self-cleaning SHA 静音 — DONE(TDD 先红 6 例):`extractRawCloneDest` 从 `extractCloneTarget` 拆出
  (raw token vs `~` 展开,detector 需与 cmd 字符串逐字匹配);新导出 `isSelfCleaningCloneCmd`
  (clone 之后的 `rm -rf <dest>` + 词边界防前缀误匹配;clone 前预清理不算)→ 命中即静默跳过 rev-parse,
  manifest verify 保持 authority;非 self-cleaning 缺目录仍走 4.16.0 warn。
- T3 L4 force-pass 文案 — DONE(TDD 先红 1 例 + 契约对照例):runStepBInstall runOne 的 skipped 映射处
  (沿 harness-mismatch 展开先例)`level-flag-missing` && runOpts.updateInstalled → 自解释文案含手动命令;
  普通 pass 保持字面值(l4-rescue `reason === 'level-flag-missing'` 过滤契约,grep 消费方确认未破)。
- T4 收尾 — DONE:CHANGELOG `## [4.16.2]`(Edit 工具写,无 ANSI)+ package.json 4.16.2。

## 验证
- vitest 全量 1838 passed / 0 failed(+8 新测试);bump 后补跑 version 相邻 3 文件 11/11 绿
- tsc --noEmit 0;biome clean(1 warning 为 HEAD 既有);scripts/check-*.mjs 7/7 OK

## 被更新的既有断言
- 无(全部新增用例;stepb 测试的 manifestFor mock 补了 `cmd` 字段,对既有用例无影响)

## 偏差说明
- task_plan T3 说 "reason 为自由文本,链路已支持" 在 installer 层不成立(InstallResult aborted reason
  是封闭 union)— 改在 setup-helpers 的 display 映射层实现(StepBResult.skipped.reason 是 string),
  与 harness-mismatch 展开同点位,不动 union、不碰 npmCli。
- gstack 上游无 tag,版本取 VERSION 文件(1.58.5.0)与 package.json 一致。
