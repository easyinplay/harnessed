# progress — 4.16.0 force-refresh 四失败修复

## 任务状态
- T1 D-15 降级(gitCloneWithSetup)— DONE:rev-parse 不可执行 → warn 降级(两模式);SHA mismatch → force-update warn 降级 / fresh 硬 fail 保留;warn 走 console.warn 无条件(quiet 只抑制 diff 预览;InstallResult ok 变体无消息通道)。TDD 先红。
- T2 mattpocock 上游更名对齐 — DONE:manifest verify/idempotent_check(tdd + diagnosing-bugs × 双目录 OR 链)、INSTALLED_INDICATORS(['tdd','diagnosing-bugs','grill-with-docs','diagnose'],legacy diagnose 保留防 pre-rename 机器误报)、doctor indicators + REMEDIATION 文案同步。
- T3 npx 硬崩单次重试 — DONE:HARD_CRASH_EXITS {3221226505, 3221225477},500ms 后重试一次;无平台门(POSIX exit ≤255,NTSTATUS 值天然 win32-only)。TDD 先红(崩→成 / 双崩)。
- T4 全文原因块 — DONE:printGrouped entries 携带 full,组表格后输出 `↳ <name>: <full ≤400>`(failed→stderr / kept-existing→warn),note 列维持截断。
- T5 formatSpawnFail — DONE:verifyMessage.ts 新 helper(stderr → stdout → (no output),sanitize);npxSkillInstaller / gitCloneWithSetup / npmCli / ccPluginMarketplace 4 处接入(mcp 两处为 4.14.0 平台化消息,未列入 task_plan 范围,保持)。
- T6 收尾 — DONE:CHANGELOG 4.16.0 + bump + ADR 0037(amends ADR 0010 D-15)+ ADR README 索引行。

## 验证
- vitest 全量:1809 passed / 0 failed(202 files,净增 +9)
- tsc --noEmit 0;biome clean(1 warning 为 HEAD 既有 installers-mcpHttpAdd.test.ts noTemplateCurlyInString);scripts/check-*.mjs 7/7 OK

## 被更新的既有断言(1 处)
- tests/unit/installers-gitCloneWithSetup.test.ts 'D-15 SHA-mismatch':BASE_OPTS updateInstalled:true 下 mismatch 现为降级 — 重写为 fresh-install 模式(updateInstalled:false + 前置 idempotent 探测 spawn step),硬 fail 语义保留在 fresh 侧。

## follow-up(未做,记录)
- capabilities.yaml mattpocock 12 招式 cmd 与上游新名全量对账(/diagnose → /diagnosing-bugs、/zoom-out 已删等):涉 workflow 渲染面 + role-prompts,属 upstream re-sync 工作(v13.0 milestone 同类),本 patch 只修安装/检测面。
- gstack force-refresh 的 `bash ./setup` 段 exit 1 真因(疑缺 bun):4.16.0 的全文原因块下轮 dogfood 直读;若为 bun 缺失可评估 manifest 前置依赖声明。
- 主 session 注意:一次 shell 反引号插值事故曾把 ANSI 垃圾写进 CHANGELOG(已修复重写,`grep -cP '\x1b'` = 0);教训:CHANGELOG 多行中文条目一律走 Edit/Write 工具,不走 bash 内联 node -e。
