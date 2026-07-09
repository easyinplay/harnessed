# task_plan — 4.22.0 /auto 合规结构化(dogfood:模型 freestyle 绕过引擎)

status: ready-to-execute
dogfood(KidsTetris,CC 自诊):/auto 下主 agent 判断"任务小"主动绕过全部 harnessed CLI
(无 gates JSON / 无 ledger / 无 evidence guard),手写 SPEC 直接开写。现有命令体已是
"编号序列 + 勿 freestyle"强措辞 — 纯指令已被证伪。三层结构化防御。
research 实证:CC `!`cmd`` 预执行 commands/*.md 与 SKILL.md 均支持(prompt 组装前执行、
输出原地注入;来源 code.claude.com/docs/en/skills § Inject dynamic context);非零退出行为
未文档化 → 预执行命令必须自身 fail-soft;$ARGUMENTS 转义规则未文档化 → 任务文本禁入预执行。
gates 实测 2.9s;对单页小游戏 fire 全部 5 masters(绕过动机 = 合规无轻量路径);
--skip-sub 重复传参只收最后一个(bug,顺修)。
TDD: T1/T3/T4 先测。

## 锁定决策
- D1 L1 引擎预启动 = **注入免疫的 intent 标记**(任务文本不进 shell):新 `harnessed checkpoint
  intent <master>` — 写 intent 标记(stateRoot,复用 ledger 的 session-scoped key;含 master + ts),
  stdout 一行 banner("engine engaged: /auto invoked — ledger awaiting plan; next: gates → checkpoint
  start")。`checkpoint start` 吸收/清除 intent;`status --recover` 报告 pending intent。命令自身
  fail-soft(任何错误 exit 0 + 静默,预执行失败不得污染 prompt)。
- D2 预执行接线:generateCommands orchestrator body 顶部 + workflows/{auto,discuss,plan,task,verify}
  master SKILL.md(en/zh)顶部加 `!`harnessed checkpoint intent <master>``;正文首行解释该 banner
  含义("引擎已挂起 intent,完成 step 2-3 才算入轨")。
- D3 L2 合规轻量路径(消除绕过动机):step 2 措辞追加 — 自包含小任务(单文件/单页面级)允许
  `--skip-sub verify --skip-sub retro` 最小 fire 集;skipped 仍进 ledger 带 reason;
  "lite 与 freestyle 的区别 = ledger/evidence 是否存在"。同时修 gates `--skip-sub` 可重复
  (commander variadic/可重复收集 + 逗号分隔兼容)。
- D4 L3 每 turn 护栏:perturn-inject(bin/harnessed-inject-state.mjs)— intent 存在且对应 ledger
  未 seed → 注入一行合规提醒(含 intent 年龄);ledger seeded 后回归现有 breadcrumb;intent TTL
  24h 过期静默(防永久唠叨);无 intent 行为与现状逐字节一致。
- D5 不做:硬阻断(hook block)——nag 而非 block,保留人类/模型的正当逃生;`harnessed run` 路径不动。

## T1 — checkpoint intent 子命令 + status --recover 报告 [src/cli/checkpoint.ts + status.ts]
## T2 — 预执行接线 + banner 文案 + L2 lite 措辞 [generateCommands.ts + 5 组 master SKILL en/zh]
## T3 — perturn-inject intent 护栏 [bin/harnessed-inject-state.mjs](D4;注意该 bin 零依赖纯 node 内置,保持)
## T4 — gates --skip-sub 可重复修复 [src/cli/gates.ts]
## T5 — 收尾:vitest 全量 + tsc + biome + scripts/check-*.mjs(i18n parity 双 gate);CHANGELOG
`## [4.22.0]`(中文,Edit 写)+ bump 4.22.0 + progress.md。commit 后立即 push(push-on-commit 规则);
tag 等用户确认。
