# progress — 4.18.0 setup optional 组件推荐块

| 任务 | 状态 | 说明 |
|---|---|---|
| T1 optional-offer 交互块 | DONE | TDD 先红(module missing)后绿;新模块 `src/cli/lib/optional-offer.ts`(沿 l4-rescue 独立模块 + setup.ts 动态 import 先例);readdir glob optional/ → validate → isAlreadyInstalled 探测 → 已装静默入桶、未装逐项 confirm(default No)→ 同意 runInstall(npm-cli → system:true,confirm 即 L4 opt-in;其余 method system:false);codegraph 装毕追加 `codegraph init` 提示;非交互一行 advisory(全装则静默) |
| T2 codegraph verify 稳健化 | DONE | `codegraph status` → `codegraph --version`(status 无项目上下文语义未验;--version 只断言 binary 就位)+ 注释;last_check 2026-07-04 |
| T3 收尾 | DONE | CHANGELOG `## [4.18.0]`(Edit 工具写,ANSI 0)+ package.json 4.18.0 + 本文件 |

## 验证
- vitest 全量:**1849 passed / 0 failed**(+8 新用例,tests/unit/cli-lib-optional-offer.test.ts)
- tsc --noEmit 0;biome clean(1 warning 为 HEAD 既有 installers-mcpHttpAdd.test.ts noTemplateCurlyInString);scripts/check-*.mjs 7/7 OK
- setup.test.ts 等既有测试零改动(非 TTY advisory 仅在存在未装 optional 组件时输出;CLI 集成测试环境未触发断言冲突)

## 被更新的既有断言
无 — 全部为新增用例。

## 设计要点(复核锚点)
- `system:true` 仅对 method === 'npm-cli' 传递:confirmAt 只在 L4 消费 opts.system;codegraph 的 `npm i -g`
  缩写不匹配 detectLevel 的 `npm install -g` 正则、落 safest-default L4 分支(行为正确);optional-offer 的
  confirm 即 L4 显式 opt-in,nonInteractive:true 防二次 prompt。
- 探测复用 isAlreadyInstalled(PROBE_OPTS 与 makeIdempotentProbe 同形):codegraph 的已装检测走 4.16.1
  binaryProbe(verify 首 token `codegraph` + where/which)。
- 非交互 advisory 在"存在未装项"时才输出(全装静默),避免 CI 日志噪声。

## 偏差说明
1. 测试文件为独立新文件 tests/unit/cli-lib-optional-offer.test.ts(8 用例,含 task_plan 未点名的
   "全装静默" 与 "目录缺失" 两个边界)。
2. setup.ts 接线点在 L4 rescue 之后、failure trailer 之前(task_plan 说 "setup.complete 摘要之前",
   实际放在 trailer 前更合理 — offer 的失败不计入 Step B 的 failed 统计,两者语义独立)。
