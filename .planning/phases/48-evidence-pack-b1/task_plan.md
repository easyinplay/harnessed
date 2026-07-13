# task_plan — B1 证据包:harnessed vs 裸跑 对照实验(一次性,非基建)

status: ready-to-execute
上游:eval 设计文档 P3 VALIDATED(mock report 实验:观望者答"装",2026-07-13)→ B 路线
解冻;用户裁决首切片 = B1 证据包(非 comet L1-L3 持续基建)。decision log 在案。

## 目标产物
一份可直接发给选型者的证据包:`docs/evidence/2026-07-b1/`
- METHODOLOGY.md(任务定义/验收 checklist/指标口径/运行协议/噪声声明 — 明示不声称
  统计显著,7pp harness 噪声 landscape 引用,全 transcript 公开供读者自证)
- 每任务每 arm 每 rep 的完整 transcript + 指标(完成度 checklist 得分/返工轮次/token)
- RESULTS.md 汇总表 + README 挂 summary 段

## 锁定决策
- D1 任务集(3-4 个,小而真实,各带机器可验的验收 checklist):
  a. bugfix:带失败测试的小 Node 项目,修到测试绿
  b. feature:给小 CLI/网页应用加一个明确规格的功能
  c. refactor:多文件重构且行为保持(既有测试作 harness)
  (d 可选. 文档任务 — 若前三跑顺)fixture 项目放 `fixtures/evidence-tasks/<task>/`,
  自包含可复制,任务 prompt 逐字固定。
- D2 双 arm 运行协议:同一任务 prompt、同一模型、同一起始 repo 状态;
  arm A = 裸 CC(headless `claude -p`,无 harnessed);arm B = harnessed(setup 后
  `/auto "<prompt>"` 驱动)。每 arm ≥2 reps。运行脚本 `scripts/evidence-pack/run.mjs`
  负责:workspace 隔离(临时副本)、transcript 捕获、token/轮次统计、验收 checklist
  自动跑(测试/断言脚本)、结果 JSON 落盘。
- D3 指标口径:①验收 checklist 通过率(机器可验为主)②到达验收的轮次/重试
  ③token 总量 ④违规面(裸跑无此项;harnessed arm 记 ledger/evidence 完整性)
  ⑤人工备注栏(产物质量主观项,标注为主观)。
- D4 成本门:W2 试点(1 任务 × 2 arm × 1 rep)先行,实测单 run token 成本,
  **全量开跑前把总预算估算呈用户确认**(真金 API/订阅用量)。
- D5 一次性非基建:不进 CI、不做持续跑;脚本与 fixture 入 repo 供复现,
  但无维护承诺(METHODOLOGY 声明快照日期与版本 4.31.1)。

## Waves
- W1(fork):METHODOLOGY 骨架 + 3 个 fixture 任务(含验收脚本)+ run.mjs 运行器
  (--task --arm --rep;先支持 dry-run 打印协议)— 零 token,纯建设。
- W2(主 session,过成本门):试点 1×2×1 真跑 → 校准协议与成本估算 → 呈用户。
- W3(确认后):全量 3×2×2+ → RESULTS 汇总 + README summary + 观望者 report 版式。
- 收尾:docs 落盘 commit;版本随下次 release 带 README(证据包本身不 bump)。
