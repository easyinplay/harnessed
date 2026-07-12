# task_plan — 4.17.0 CodeGraph 编排轻接线(用户选项 1)

status: ready-to-execute
research 实证(colbymchenry/codegraph README,2026-07-04):
- auto-sync 默认开启(文件 watcher,"index is never stale, nothing to re-run")→ 用户提的
  "每次 commit 触发重建" **不做**(逆上游设计的冗余;粒度还更粗),决策记录于此 + progress.md。
- 启用两步:`npx @colbymchenry/codegraph`(接 agent,装 MCP)+ 每项目 `codegraph init`(建 .codegraph/ 索引)。
  现 doctor fix 提示只有前者 — 准确性缺陷,一并修。
- capability 现状:capabilities.yaml `codegraph` entry(cmd codegraph_explore)零编排引用(built-but-unwired)。

## T1 — 轻接线:条件优先指令 [role-prompts(.zh-Hans).yaml + workflows/task/code]
- 在 execute/代码类角色指导中加一条:项目存在 `.codegraph/` 索引时,代码导航 / 符号查找 / 调用链 /
  影响面分析优先用 codegraph MCP 工具(codegraph_explore),替代 grep/glob/逐文件 Read 爬取;
  `.codegraph/` 不存在则不提(条件句写进指令,agent 运行时自判)。
- 落点收窄:role-prompts en+zh 的相关角色(执行/代码)+ workflows/task/code 的 SKILL.md/SKILL.zh-Hans.md
  (与 4.15.0 goal 接线同级的指令文本改动);不动 judgments、不建 gate(用户选项 1 明确轻量)。
- generateCommands 若有对应 spawnLoopSteps 类共享模板需同步则同步(grep 确认)。
- i18n parity 两 gate 必须绿。

## T2 — doctor 提示准确化 [check-codegraph.ts]
- fix 提示改两步:`npx @colbymchenry/codegraph`(wire agents)+ `codegraph init`(per-project index);
  present 分支消息不动。测试同步。

## T3 — 决策记录
- progress.md 记 "commit 触发重建不做" 的 research 依据(上游 auto-sync 默认开启),留将来复核锚点。

## T4 — 收尾
- vitest 全量 + tsc + biome + scripts/check-*.mjs;CHANGELOG `## [4.17.0]`(中文,Edit 工具写)+
  bump 4.17.0 + progress.md。不 commit 不 push。
