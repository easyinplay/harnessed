# RESULTS — B1 证据包(harnessed /auto vs 裸 Claude Code,headless)

> 实验设计与口径见 [METHODOLOGY.md](./METHODOLOGY.md);全部原始 transcript 与逐 run 记录在 [runs/](./runs/)。
> 快照:harnessed v4.31.1,claude CLI headless(`-p`),2026-07-13~14。
> 本文件只陈述数据,不做推销;读者应以 transcript 自证。

## 逐 run 全表

| Task | Arm | Rep | 验收通过率 | Turns | Cost (USD) | 终态 |
|------|-----|-----|-----------|-------|------------|------|
| bugfix-todo-api | bare | r1 | 1.00 | 5 | $1.47 | success |
| bugfix-todo-api | bare | r2 | 1.00 | 6 | $1.60 | success |
| bugfix-todo-api | harnessed | r1 | 1.00 | 26 | $7.75 | success |
| bugfix-todo-api | harnessed | r2 | 1.00 | 22 | $5.87 | success |
| compound-recurring-todos | bare | r1 | 1.00 | 23 | $3.51 | success |
| compound-recurring-todos | bare | r2 | 1.00 | 14 | $4.36 | success |
| compound-recurring-todos | harnessed | r1 | 1.00(salvaged) | — | — | wedged-killed(11h) |
| compound-recurring-todos | harnessed | r2 | 1.00(salvaged) | — | — | timeout-capped(30min) |
| feature-cli-stats | bare | r1 | 1.00 | 7 | $1.93 | success |
| feature-cli-stats | bare | r2 | 1.00 | 7 | $1.57 | success |
| feature-cli-stats | harnessed | r1 | 1.00 | 33 | $8.33 | success |
| feature-cli-stats | harnessed | r3 | 1.00 | 24 | $9.54 | success |
| refactor-parser | bare | r1 | 1.00 | 8 | $1.90 | success |
| refactor-parser | bare | r2 | 1.00 | 10 | $2.04 | success |
| refactor-parser | harnessed | r1 | 1.00 | 31 | $10.58 | success |
| refactor-parser | harnessed | r3 | 1.00 | 27 | $8.07 | success |

## 任务 × arm 汇总

| Task | Arm | 平均通过率 | 平均 turns | 平均 cost |
|------|-----|-----------|-----------|-----------|
| bugfix-todo-api | bare | 1.00 | 5.5 | $1.54 |
| bugfix-todo-api | harnessed | 1.00 | 24.0 | $6.81 |
| compound-recurring-todos | bare | 1.00 | 18.5 | $3.93 |
| compound-recurring-todos | harnessed | 1.00(salvaged×2) | 不可得 | 不可得 |
| feature-cli-stats | bare | 1.00 | 7.0 | $1.75 |
| feature-cli-stats | harnessed | 1.00 | 28.5 | $8.93 |
| refactor-parser | bare | 1.00 | 9.0 | $1.97 |
| refactor-parser | harnessed | 1.00 | 29.0 | $9.33 |

计量口径:干净退出 16 runs 实测合计 **$68.53**;另有 4 次 harnessed 不终止/超时 run 计费不可得(估 +$35-45,见 METHODOLOGY 成本口径节)。

## 可靠性(headless 终止行为)

bare arm:8/8 次干净退出,0 事件。harnessed arm:6/10 次干净退出,4 次不终止/超时事件:

1. feature-cli-stats harnessed r2 — 30 分钟 DNF(matrix driver 超时杀;无残留可验;后由 r3 干净补齐,7/7 通过)
2. refactor-parser harnessed r2 — 同上(r3 干净补齐)
3. compound harnessed r1 — **工作全部完成后进程不退出**,挂 11 小时后人工杀树;杀后 workspace 机器验收 7/7。取证:该 claude 进程下挂 11 条相同的 hook 子进程链 + 全套用户级 MCP server(obsidian/uv/python 等),全部与主进程同龄零进展 — 挂起点在收尾环节,不在任务执行。
4. compound harnessed r2 — 外部 30 分钟上限杀止(exit=124);杀后验收 7/7,与 r1 同型:**工作完成、进程不终止**。

要点:4 次事件中可验的 2 次(compound r1/r2)都属"完工不退出",不是"干不完活" — 这是 harnessed(或其 hook/MCP 继承面)在 headless 下的终止缺陷,将立 GitHub issue 跟踪修复。

## 结论(三条,如实)

1. **验收质量无差异,成本差 4-5×**:在"显式 spec + 机器验收"的实验形态下,四个任务(含 7 验收项的复合任务)双 arm 全部满分;bare 平均成本约为 harnessed 的 1/4~1/5,轮次约 1/3~1/4。小型、规格明确的任务直接用 bare(或 harnessed 的 auto-lite 路径)更划算 — 这与 harnessed 自身的 complexity gate 设计一致。
2. **harnessed headless 存在"完工不退出"缺陷**:两次可验的不终止事件均为工作完成后挂起,取证指向 headless 运行继承的全局 hook/MCP 面(11 条相同 hook 子进程链 + 全套 MCP server 挂起)。已立 issue 跟踪;在修复前,headless 驱动 /auto 必须自带外部超时。
3. **本实验不构成对 harnessed 核心主张的检验**:harnessed 主张的价值在隐式需求澄清、模糊 spec 下的证据纪律、跨 session 状态存续 — 而本实验刻意使用显式 spec + 单 session 短任务,这些面未被考察。差异化验证需要另一种实验形态(模糊需求/长周期/中断恢复),这是后续工作,不在本包内。
