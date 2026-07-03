# progress — 4.16.1 (2026-07-03)

## 任务状态
- T1 npm-cli 二进制探测 — DONE(TDD 先红):新模块 src/installers/lib/binaryProbe.ts
  (extractVerifyBinary:verify cmd 首 token,POSIX builtin/npx/node 等 NON_COMPONENT_TOKENS
  回退 metadata.name,非 bare → null;binaryOnPath:where/which DI 注入,探测不可用=false 不误报);
  idempotent.ts npm-cli 分支优先消费 → ctx7 第二次 setup already-installed,不再重复 L4 prompt。
- T2 尾部取值 + 死区 — DONE(TDD 先红):verifyMessage.ts 新 sanitizeOutputTailEnd(末行向前拼接
  ` | `,cap;单末行超 cap 取头+…);formatSpawnFail(300)/formatVerifyFail(160)/spawn 超时(200)接入;
  sanitizeOutputTail(头部单行)保留给 doctor checkWinBash。setup.ts ↳ 门槛改
  "渲染 note 未含完整 full 即打印"(修 90-100 死区)。
- T3 bun 检查 — DONE:src/cli/lib/check-bun.ts(warn-only,DI 可测,win=winget/darwin=brew
  install_commands,linux 仅 fix 文案不自动跑远程脚本管道);doctor-registry 注册为第 15 项
  (codegraph 与 update 之间)。
- T4 收尾 — DONE:CHANGELOG 4.16.1(Edit 工具写入,无 heredoc)+ bump + 本文件。

## 验证
- vitest 全量:**1830 passed / 0 failed**(204 files:201 passed + 3 skipped;净增 +21)
- tsc --noEmit 0;biome clean(1 warning 为 HEAD 既有 tests/unit/installers-mcpHttpAdd.test.ts
  noTemplateCurlyInString,本 patch 未触碰);scripts/check-*.mjs 7/7 OK

## 被更新的既有断言(2 文件,均为 doctor 第 15 项检查的计数必然后果)
- tests/cli/doctor.test.ts:cell 0/1/5 计数 14→15 + cell 1 增 'bun present' name 断言
- tests/cli/doctor-fixtures.test.ts:toHaveLength 14→15 + name 清单增 'bun present' + 用例标题

## 改动文件
- 新增 src:binaryProbe.ts、check-bun.ts
- 修改 src:idempotent.ts、verifyMessage.ts、spawn.ts、setup.ts、doctor-registry.ts
- 新增 tests:installers-lib-binaryProbe.test.ts、check-bun.test.ts
- 修改 tests:installers-lib-idempotent.test.ts(+npm-cli wiring 3 例)、
  installers-lib-verifyMessage.test.ts(+尾部 4 例)、setup.test.ts(+cell 9c)、
  doctor.test.ts、doctor-fixtures.test.ts
- CHANGELOG.md、package.json(4.16.1)

## 偏差说明
1. binaryProbe 的 NON_COMPONENT_TOKENS 额外纳入 git/claude/codex/corepack/pnpm/yarn/bun
   (task_plan 只点名 builtin;这些运行时/宿主 CLI 永远在 PATH,命中证明不了组件已装 — 防误报)。
2. 探测不可用(partial mock / spawnSync error)按 false 处理而非 null 三态穿透:调用点回落
   legacy 检测链,永不误报 already-installed(比 task_plan 弱化表述更保守,注释已说明)。
3. doctor-fixtures.test.ts 的计数断言未在 task_plan 预列(只点名 doctor.test.ts)— 同类必然后果,一并更新。

## 预期(下轮 dogfood 同机)
- ctx7:already-installed,无 L4 prompt。
- doctor:`bun present` warn + auto-install 提供 `winget install Oven-sh.Bun`;用户装 bun 后
  gstack force-refresh 应转绿;若仍败,↳ 全文块 + 尾部取值会给出完整真因。
