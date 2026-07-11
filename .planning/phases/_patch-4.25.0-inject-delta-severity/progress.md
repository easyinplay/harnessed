# progress — 4.25.0 B1 注入 delta 化 + B3 分级

- [x] 现状核实:bin 每轮全量重注 pc(≤1500 token);sid(v11.0 composite key)可作缓存键;
      doctor 已有 pass/warn/fail
- [x] task_plan 锁定:D1 会话级 delta(hash 命中跳过 + REFRESH_N=10 周期重注对冲 compaction,
      无 sid 字节等同旧行为)/ D2 verify 家族 severity 纪律 / D3 doctor fail 面对账 / D4 4.25.0
- [ ] T1-T3 fork 实施中(TDD 红先行)
- [ ] T4 主 session 复验 + CHANGELOG + bump + intel 回填(B1/B3 IMPL)+ commit/push
- [ ] tag v4.25.0(等用户确认)
