# task_plan — 4.32.0 eval Slice C:显式录制导出(record → scenario)

status: ready-to-execute
上游:eval 设计文档 Approach C(A 的第二阶段,APPROVED);Slice A(4.31.0/4.31.1)已交付
手写 scenario + runner + golden 机制。用户裁决(2026-07-15):A 显式导出命令 + 默认脱敏。
战略门跳过(既定 approach,非新方向)。

## 锁定决策
- D1 触发 = 显式命令(非自动后台):`harnessed eval record --from <checkpoint-dir> [--out <dir>] [--include-text]`。
  把一次真实运行的 checkpoint ledger(<stateRoot>/checkpoints/*.json + current-workflow envelope)
  转成 Slice A 格式 scenario.yaml + golden.json。零后台开销,用户控制何时导出什么。
- D2 默认脱敏(隐私优先,与 scrubSecrets/4.31.2 同哲学):
  - task 文本 → 占位符(`<TASK-REDACTED>` 或结构保留的短摘要,不留原文)
  - 文件路径 → 规范化(`<TMP>` / `<REPO>` / `<STATE>`,复用 runner 的 normalizeGolden 归一集)
  - checkpoint summary → 保结构去内容(保留 sub 名/status/evidence_status,summary 文本 → `<SUMMARY-REDACTED>`)
  - secret shape → 复用 scrubSecrets(从 evidence-pack 提取为共享 util 或 inline 同款正则)
  - `--include-text` 显式开关才保留原文(命令帮助明示"仅在确认无敏感内容时用")
- D3 格式统一(设计文档待定项):导出的 scenario 必须能被现有 runner 原样回放 +
  golden 匹配 —— 即 record 是 Slice A 手写格式的自动生成器,非新格式。用一条真实
  checkpoint 序列往返验证(record → runner replay → PASS 自身 golden)。
- D4 映射:checkpoint 事件序列(start/complete/fail + gates 调用)→ scenario steps
  (file setup + checkpoint/gates 动作);envelope 终态 → golden 的 workflow 字段。
  无法完整还原的动作(真实 spawn/外部副作用)标注为 record 的已知边界(不入回放)。
- D5 版本 4.32.0(minor:新子命令);TDD 红先行。schema 若碰 typebox 走 build:schema 铁律。

## T1 测试红先行:脱敏映射(task/path/summary/secret 各一)/ record→scenario 生成 /
   round-trip(record 出的 scenario 经 runner replay 自匹配 golden)/ --include-text 保原文 /
   缺失 checkpoint-dir 报错
## T2 实现:src/eval/record.ts(checkpoint 序列 → scenario+golden,脱敏内建)+
   evalCmd record 子命令接线
## T3 fixture:一个真实 checkpoint 序列样本(可用 4.31.x 某 phase 的 checkpoint 或构造)
   → 录制 → 回放自证;doc(METHODOLOGY 补 record 用法 + 脱敏声明)
## T4 收尾:vitest 全量 + tsc + lint + gates 7/7;CHANGELOG 4.32.0 + bump + progress +
   intel/TODOS 回填(Slice C IMPL);commit 即 push;tag 等确认
