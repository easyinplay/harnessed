# 你问过"凭什么证明 harnessed 比裸跑强" — 这是我们跑的实验

我们没有拿营销话术回答这个问题,而是真的跑了对照实验,并把**全部原始 transcript 公开**([runs/](./runs/)),你可以逐条自证。先说结论:**在本实验的形态下,数据不支持"harnessed 更强"** — 请读完边界声明再下判断。

## 实验

4 个自包含任务(bugfix / feature / refactor / 7 验收项复合 feature),每个任务两条 arm 各 ≥2 次:同一台机器、同一模型、逐字相同的任务书,唯一变量 = 是否经 harnessed `/auto` 编排。验收全部机器判定(测试 + 结构断言),不靠人评。完整口径:[METHODOLOGY.md](./METHODOLOGY.md)。

## 数据(细表见 [RESULTS.md](./RESULTS.md))

| 任务 | bare 通过率 / 均价 | harnessed 通过率 / 均价 |
|------|-------------------|------------------------|
| bugfix(边界 bug) | 1.00 / $1.54 | 1.00 / $6.81 |
| feature(CLI 新旗标) | 1.00 / $1.75 | 1.00 / $8.93 |
| refactor(行为保持) | 1.00 / $1.97 | 1.00 / $9.33 |
| compound(7 验收项) | 1.00 / $3.93 | 1.00(salvaged×2)/ 计费不可得 |

三条如实结论:

1. 显式 spec + 机器验收下,双 arm 验收质量**无差异**;bare 便宜 4-5×。小而明确的任务,直接用裸 Claude Code(或 harnessed 的 auto-lite)。
2. harnessed 在 headless 下有一个真实缺陷:两次可验的挂起都是**工作做完了、进程不退出**(一次挂了 11 小时)。已立 issue 跟踪;headless 用它请自带超时。
3. 本实验**没有**考察 harnessed 的核心主张面 — 隐式需求澄清、模糊 spec 下的证据纪律、跨 session 状态。这些需要另一种实验形态。

## 边界声明(为什么这不是终局答案)

这组任务是"规格写满、一次 session 内做完"的理想态 — 恰好是编排价值最小的区间。harnessed 的设计针对的是另一个区间:需求模糊要先澄清、周期长要跨 session 接续、验收纪律靠流程而不是靠模型自觉。**如果你的真实场景在后一个区间,欢迎给我们一个你的真实任务,我们照本方法论跑双 arm 对照,transcript 照样全公开** — 无论结果偏向谁。

利益声明:实验由 harnessed 作者执行,自测无第三方公信力 — 所以每一个字节的 transcript 都在 [runs/](./runs/) 里,方法论的每次校准变更都在 [METHODOLOGY.md](./METHODOLOGY.md) 里留痕。

*快照:harnessed v4.31.1,2026-07-13~14。*
