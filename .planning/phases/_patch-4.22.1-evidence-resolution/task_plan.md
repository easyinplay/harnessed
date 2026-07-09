# task_plan — 4.22.1 evidence guard 路径解析对齐 + step-0 加固(dogfood 首次合规运行暴露)

status: ready-to-execute
dogfood(neon Tetris,首个走完 gates→start→spawn→complete 的合规运行):evidence guard
fail-closed 正确咬住,但其中一口是冤枉的 — `artifacts_expected: [findings.md, knowledge.md]`
裸文件名解析基 = 项目 cwd 根,而 4.21.0 写入约定是动态 `.planning/phases/<NN>-<slug>/`;
两契约从未对齐(此前无合规运行走到 complete,首次暴露)。次要:模型跳过 step-0 骨架
(.planning/STATE.md 缺失被 checkPlanningSync 正确拦截 — 行为对,但可低成本前移提示)。
TDD: T1/T2 先测。

## 锁定决策
- D1 裸名多基解析(不改 yaml,向后兼容):checkArtifacts 中**不含路径分隔符**的声明按序探测:
  (1) cwd 根(现状,兼容真在根的产物)→ (2) `.planning/phases/*/`(mtime 降序,取最新命中)→
  (3) `.planning/*/`(legacy 布局,mtime 降序)。含分隔符的声明维持精确 cwd 相对语义不变。
  found[].path 仍存绝对路径(drift 契约不变);missing[] 报裸名 + 已探测基提示。
- D2 弱化风险接受并记录:旧 phase 目录的同名文件可满足新 sub 的 guard(mtime 最新优先缓解);
  证据语义 = "产物已持久化",可接受;注释写明。
- D3 step-0 前移提示:`checkpoint start` 时 cwd 存在 `.planning/` 但缺 STATE.md 或 ROADMAP.md →
  stderr 一行警告("step 0 skeleton missing — evidence guard 的 planning-sync 门将拦截 complete;
  先按 SKILL step 0 建骨架")。不阻断(guard 在 complete 侧已 fail-closed,start 侧只提示)。
- D4 不做:artifacts_expected glob 语法(YAGNI,裸名多基已覆盖);用户机器的反 slop hook 与
  findings.md 命名冲突属用户侧配置(建议 .planning/ 豁免),harnessed 不改契约命名。

## T1 — checkArtifacts 裸名多基解析 [src/checkpoint/evidence.ts]
TDD:根命中 / phases 最新命中 / legacy 命中 / 全 miss 报基提示 / 含分隔符路径行为逐字节不变 /
drift 用绝对路径不受影响。
## T2 — checkpoint start step-0 警告 [src/cli/checkpoint.ts]
TDD:缺 STATE/ROADMAP 警告、齐全静默、无 .planning/ 静默(非 GSD 用户不打扰)。
## T3 — 收尾:vitest 全量 + tsc + biome + gates;CHANGELOG `## [4.22.1]`(中文,Edit 写)+
bump 4.22.1 + progress.md(D2 风险记录)。commit 即 push;tag 等确认。
