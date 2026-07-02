# progress — patch 4.13.0 setup UX

- T1 spawn stdin ignore — DONE (spawn.ts 3 分支 + runClaudeArgs.ts;测试 installers-lib-spawn.test.ts 新增 stdio 断言)
- T2 MCP 串行化 — DONE (runStepBInstall 按 method 分区;测试 cli-setup-helpers-stepb.test.ts 并发跟踪断言 mcp max=1 / rest >1)
- T3 extractSkillName --skill + indicators 双目录 + detectSkillPresence 统一 verify — DONE (idempotent.ts + npxSkillInstaller.ts;新测试 installers-lib-idempotent.test.ts 9 例)
- T4 L4 post-pass rescue — DONE (新模块 src/cli/lib/l4-rescue.ts,setup.ts TTY-gated 动态 import;测试 cli-lib-l4-rescue.test.ts 4 例)
- T5 Step B 进度输出 — DONE (onProgress 回调 + setup printer 起始行/逐行完成)
- T6 printGrouped 表格化 — DONE (glyph + 对齐列 + note 截断;setup.test.ts cell 9 直测)
- T7 manifests — DONE (mattpocock / design-taste / playwright cmd +`-y --agent claude-code`;verify/idempotent_check 双路径真实布局)
- T8 doctor INSTALL_COMMANDS — DONE (check-mattpocock-skills.ts + 测试同步)

## 验证

- biome check src/ tests/: clean(剩余告警均在 .understand-anything/.trash-*/ 未跟踪垃圾目录)
- tsc --noEmit: 0 errors(修掉 2 个初版类型误差:StepBEntry 窄化 + vi.fn 参数签名)
- vitest 串行 --no-file-parallelism 终跑: **1720 passed / 0 failed**(193 files: 190 passed + 3 skipped);此前一轮的 check-workflow-schema + cli-run-e2e 偶发失败为 spawn 超时型负载抖动,隔离与终跑均绿
- scripts/check-*.mjs 7 个 gate 全 OK
- CHANGELOG 4.13.0 + package.json 4.13.0 — DONE
