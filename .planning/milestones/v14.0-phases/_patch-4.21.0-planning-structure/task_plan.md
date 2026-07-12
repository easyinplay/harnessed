# task_plan — 4.21.0 /auto 规划产物结构对齐 GSD(dogfood KidsTetris 结构漂移修复)

status: ready-to-execute
dogfood 实证(用户 /auto 开发 KidsTetris):产出 `.planning/phase-0-discuss/{brainstorm,findings,knowledge}.md`
+ `phase-1-plan/` + 手写 STATE.md;无 ROADMAP/REQUIREMENTS/phases/ 层级。
根因:(1) role-prompts fallback checklist 用松散占位符 `.planning/<phase>/`,agent 自造目录名;
(2) /auto 对全新项目缺 GSD 初始化引导(/gsd-new-project 不会被跑);(3) 指令未要求"GSD skill 在场时
调真命令优先"。capabilityResolver 渲染层无辜(user-skill cmd 保持正确)。
TDD:文本类改动以 gates(skill/yaml i18n parity + workflow-schema)+ 渲染测试为验收;涉及 generateCommands
共享模板则补断言。

## 锁定决策
- D1 目录约定统一:所有 role-prompts / workflow SKILL 中的规划持久化路径统一为 GSD 标准
  `.planning/phases/<NN>-<slug>/`(NN = 两位数、现有最大 + 1;slug = kebab 短名;指令中写死该命名规则,
  不留 `<phase>` 裸占位符)。discuss 产物 = findings.md + knowledge.md;plan 产物 = task_plan.md +
  progress.md(planning-with-files 三件套,与用户全局 CLAUDE.md T2 约定一致)。
- D2 新项目引导:stage-1(discuss)master 与 /auto master 的指令加前置步骤 —
  `.planning/ROADMAP.md` 缺失时:若 /gsd-new-project skill 可用 → 先调用它完成初始化;
  不可用 → 按内嵌最小骨架创建 ROADMAP.md(phase 一行表)/ STATE.md(digest 骨架,<100 行纪律)/
  REQUIREMENTS.md(编号验收表)再继续。骨架模板精简(每文件 ≤10 行示例)。
- D3 调真命令优先:discuss-phase / plan-phase(以及涉及 gsd capability 的同类角色)checklist 首条加
  "若 `/gsd-discuss-phase`(相应命令)可用,直接调用并以其产物结构为准;仅在不可用时按以下步骤手工执行"。
- D4 影响面:workflows/role-prompts.yaml + .zh-Hans.yaml、/auto 与 discuss master 的 SKILL.md + zh、
  research 角色的持久化行、generateCommands 若有共享模板同步;en/zh 成对,两个 i18n parity gate 绿。
- D5 不动:capabilities.yaml(cmd 正确)、GSD 本体、workflow-schema。

## T1 — role-prompts 持久化路径 + D3 首条 checklist(en/zh)
## T2 — /auto + discuss master 新项目引导(D2,en/zh SKILL)
## T3 — generateCommands 共享模板核对(grep `.planning/<phase>` 类占位符全仓清零)
## T4 — 收尾:vitest 全量 + tsc + biome + gates;CHANGELOG `## [4.21.0]`(中文,Edit 写)+ bump 4.21.0
+ progress.md。不 commit 不 push。
