# task_plan — 4.16.0 force-refresh 四失败修复(dogfood v4.15.2 kept-existing 带因确诊)

status: ready-to-execute
TDD: T1/T2/T3 先测。

## 确诊(2026-07-03 实证)
- mattpocock 上游重构:skills/ 分类子目录化,`diagnose`→`diagnosing-bugs`,`zoom-out` 消失,`tdd`/`grill-with-docs`/`code-review` 仍在(gh api skills/engineering 列表)
- ui-ux:gitCloneWithSetup 的 D-15 `git rev-parse` 在 cloneTarget(.cache/midway-uiux)跑,而 cmd 末尾自删该目录 → 必挂;且 pinned SHA 与 --branch HEAD 漂移
- gstack:clone 成功、`bash ./setup` 段 exit 1(疑缺 bun;4.15.2 的 90 char 截断看不到全文);SHA 漂移同样在后面等着
- design-taste:npx exit 3221226505(0xC0000409 node 硬崩,疑瞬态);spawn 阶段错误消息无 stdout 兜底

## T1 — D-15 SHA 验证与 force-update / 自删 cache 兼容 [gitCloneWithSetup.ts]
- rev-parse 目标目录不存在(cmd 设计内自删,如 ui-ux cache)→ 不 fail:降级 warn 语义(结果消息记 "SHA unverifiable: clone dir removed by install cmd"),以 manifest verify(native test 链)为准。
- SHA mismatch 且 ctx.opts.updateInstalled===true(force-update 语义 = 追上游新版)→ 同样降级为 ok + 警示消息
  (提示 manifest git_ref 需 bump);fresh install(非 force)保持 fail(supply-chain gate 不放松)。
- 以上契约变化写入 ADR 0010 errata 注记(docs/adr/0010 追加 errata 小节或新 errata 文件,按仓库惯例)。

## T2 — mattpocock 上游更名对齐 [manifests + idempotent.ts + check-mattpocock-skills.ts]
- INSTALLED_INDICATORS['mattpocock-skills'] → ['tdd','diagnosing-bugs','grill-with-docs'](diagnose/zoom-out 失效);
- manifest verify/idempotent_check → 同 OR 链 × 双目录;doctor indicators 同步;
- capabilities.yaml 里 mattpocock 12 招式 cmd(/diagnose 等)与上游新名的全量对账 **不在本 patch**(记 follow-up 到
  progress.md:属 upstream re-sync 工作,涉 workflow 渲染面)。

## T3 — npx 硬崩单次重试 [npxSkillInstaller.ts 或 spawn 层]
- win32 且 exit ∈ {3221226505(0xC0000409), 3221225477(0xC0000005)} → 延迟 ~1s 重试一次;二连崩才 fail。
  注释说明 Windows node/npx 偶发硬崩类别。范围:仅 install spawn(verify 已 native/cmd.exe)。

## T4 — 失败/kept-existing 全文原因展示 [setup.ts printGrouped]
- note 列维持截断;每组表格后对 failed / kept-existing 条目输出全文原因块(sanitize + 软换行缩进,cap ~400)。
  gstack 的 setup 段真因下轮直读。

## T5 — spawn 阶段错误消息 stdout 兜底 [npxSkillInstaller / gitCloneWithSetup / npmCli / ccPluginMarketplace]
- `... exited N: ${stderr.slice}` 全部改共享 helper(stderr 空取 stdout,再空 '(no output)';复用 verifyMessage 的
  sanitize;消灭 "exited 3221226505: " 空尾)。

## T6 — 收尾
- vitest 全量 + tsc + biome + scripts/check-*.mjs;CHANGELOG `## [4.16.0]`(中文)+ bump 4.16.0 + progress.md
  (含 capabilities 对账 follow-up 记录)。不 commit 不 push。
