# progress — 4.30.0 issue #6 Stop hook 自动恢复

- [x] issue #6 定性:spec 成熟(12k-turn 实证探测器 76/76 真阳 + 1 假阳有灭法),
      验收标准照单可实施;与用户全局 CLAUDE.md emission 规避节互补(预防 vs 兜底)
- [x] task_plan 锁定(D1 tag-in-text 不变量 + end-anchor 门 / D2 decision:block /
      D3 stop_hook_active + cap 2 + fail-soft / D4 双路由照 4.27.0 / D5 fixtures /
      D6 手动 snippet / D7 关系说明)
- [x] T1-T4 fork 实施(TDD 红先行 → 绿):
      - detectModeB 纯函数(src/checkpoint/modeBDetect.ts,7 cell)+ bin 端到端
        (tests/checkpoint/stopHook.test.ts,7 cell)
      - **end-anchor 从 ratio(0.5)改绝对窗口(200 字符)**:短 mode-B 消息的截断 params
        占比大,ratio 误判(实测 44% < 50%);绝对窗口对消息长度稳健,FP 仍灭
      - hookEntry stop-hook 身份(COMPILED_HOOK_IDENTITIES 泛化 inject-state+stop-hook,
        +5 cell)+ 子命令 stopHookCmd(2 cell)+ HookEvent schema +Stop(typebox+regen)
      - optional 自动 glob 实证收录;bin/ 整目录已入 B2 资产集(零额外接线)
- [x] T-final 复验:vitest 串行权威 2142/0(一轮 2 failed 为 load 抖动,复跑绿,memory 模式);
      tsc 0;lint 0(仅既有 warning);gates 7/7;真机三连(mode-B→block / active→silent /
      cap→silent)
- [x] docs/STOP-HOOK-RECOVER.md(探测器原理 + settings.json 手动 snippet);CHANGELOG 4.30.0 + bump
- [x] commit `e792038` + push;issue #6 已回复并 CLOSED;tag v4.30.0 等用户确认
- 备注:office-hours(eval harness 立项)暂停在设计文档批准门,#6 完成后恢复
