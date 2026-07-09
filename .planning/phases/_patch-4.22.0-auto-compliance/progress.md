# progress — 4.22.0 /auto 合规结构化

## 任务状态(TDD 先红后绿,红 phase 12 failed 实录)

- T1 checkpoint intent — DONE:`intent` action(session-scoped `intents` sidecar,additive-optional
  无 schema bump;绝对 fail-soft 含自身 path guard)+ `start` 吸收 + `status --recover` 顶部报告
  (仅 ledger 为空时,与 bin 口径一致 — 实现中统一的口径修正)。测试走**真实 state 层**
  (HARNESSED_ROOT_OVERRIDE tmp,新文件 tests/cli/checkpoint-intent.test.ts,5 cells)——
  规避 checkpoint.test.ts 的 state.js factory mock(mock-export-gap);既有 mock 缺 mutateStore
  被 intent/absorb 的 fail-soft try/catch 天然容忍,既有套件零改动。
- T2 预执行接线 — DONE:generateCommands orchestrator body(`!` 行 + banner 一句 + auto-only lite
  措辞并入 step 2)+ SKILL en/zh:auto + plan/task/verify 三个 stage master(共 8 文件)。
  **偏差:discuss master 未加**(其 SOP 是纯交互无 gates/start 步骤,intent 唠叨会指向其文档
  不存在的步骤;生成的 /discuss 命令体带引擎步骤,故命令面仍有 intent 行)。
- T3 perturn 护栏 — DONE:bin + injectState.ts 双端(parity 契约,2 个 bin parity cells,
  age 取 10.5m 中心防分钟边界抖动);TTL 24h;无 intent / seeded ledger 逐字节现状(专项 cell)。
- T4 gates --skip-sub — DONE:commander 累加器 + 逗号混用(cell 2b)。
- T5 收尾 — DONE:CHANGELOG 4.22.0(Edit 写入,ANSI 0)+ bump 4.22.0 + 本文件。

## bin 手跑实录(Windows,tmp HARNESSED_ROOT_OVERRIDE)

```
1) checkpoint intent auto → [harnessed] engine engaged: /auto invoked — intent registered...
2) bin(intent+空 ledger)→ <workflow-intent> intent: /auto invoked <1m ago — ledger NOT seeded + ENGINE 行
3) checkpoint start --plan(吸收)→ bin 回归 <workflow-state> ENGINE: mid state-machine(常态)
4) status --recover(intent 重登记 + 未 seed)→ ⚠ intent pending: /auto invoked <1m ago 置顶
```

## 验证

vitest 全量 **1915 passed / 0 failed**(+13:intent 5 + inject 6 + gates 1 + seeded-ledger 1);
tsc 0;biome clean(1 warning 为 HEAD 既有);scripts/check-*.mjs 全过(含 skill-i18n-parity /
yaml-i18n-parity — `!` 行 en/zh 成对,结构 parity 保持);build ok。

## 被更新的既有断言

无(全部新增;checkpoint.test.ts / status-recover.test.ts / injectState 既有 cells 未动)。

## 偏差说明

1. discuss master SKILL 不加 intent 预执行(理由见 T2;task_plan D2 原列 5 个 master)。
2. status --recover 的 intent 报告加 ledger-empty gate(task_plan 未明说;与 bin/L3 口径统一,
   手跑 case 4 暴露 seeded+重登记边缘态后决定)。
3. checkpoint 命令 description 顺手补 `intent |`(可发现性)。
