# progress — 4.25.0 B1 注入 delta 化 + B3 分级

- [x] 现状核实:bin 每轮全量重注 pc(≤1500 token);sid(v11.0 composite key)可作缓存键;
      doctor 已有 pass/warn/fail
- [x] task_plan 锁定:D1 会话级 delta(hash 命中跳过 + REFRESH_N=10 周期重注对冲 compaction,
      无 sid 字节等同旧行为)/ D2 verify 家族 severity 纪律 / D3 doctor fail 面对账 / D4 4.25.0
- [x] T1-T3 fork 实施(TDD 红 6 → 绿;8 文件 + 25 新 cell;bin skip 决策仅在缓存持久化
      成功后生效的加固;D3 audit 4 处 fail 全合规零降级)
- [x] T4 主 session 复验:vitest 全量 2060 passed / 0 failed;tsc 0;lint 0;gates 7/7;
      diagnostics 报的缺模块/unused 经真实验证均为陈旧快照
- [x] CHANGELOG `## [4.25.0]` + bump + intel 回填;commit `07ad913` + push main
- [ ] tag v4.25.0(等用户确认)
