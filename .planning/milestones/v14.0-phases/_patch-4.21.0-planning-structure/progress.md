# progress — 4.21.0 /auto 规划产物结构对齐

- T1 role-prompts(en/zh)— DONE:discuss-phase / plan-phase 各 +1 条 D3 首条 checklist(调真命令优先)
  + 持久化路径改 `.planning/phases/<NN>-<slug>/`(含命名规则);research 持久化行同改。
  en/zh 条目数逐一核对相等(discuss-phase 6→7、plan-phase 7→8 两侧一致)。
- T2 新项目引导 — DONE:workflows/discuss/auto/SKILL(.zh-Hans).md 加 step 0(/gsd-new-project 优先,
  否则 ROADMAP/STATE/REQUIREMENTS 内嵌骨架,每文件 ≤4 行模板);步骤 4 路径同改;
  workflows/auto/SKILL(.zh-Hans).md Default behavior 加 New-project bootstrap 行 + Context 传递行路径修正。
- T3 占位符清零 — DONE:基线 8 处 / 6 文件(auto SKILL en+zh、role-prompts en+zh ×2、task/code en+zh)
  + generateCommands.ts 共享模板 1 处(生成的 /discuss 命令面,同类松散,一并修 + step 0 引导);
  终扫 `.planning/<phase|<phase>/|<phase-id>` 残留 = 0(排除 .planning/phase-v3* 历史目录实名引用)。
- T4 收尾 — DONE:biome clean / tsc 0 / vitest 全量 1902 passed 0 failed / scripts/check-*.mjs 7/7
  (含 skill-i18n-parity + yaml-i18n-parity)/ CHANGELOG `## [4.21.0]` + bump 4.21.0。

被更新的既有断言:无(全量 1902 与改动前持平,无测试钉旧文本)。

偏差说明:
1. generateCommands.ts 的裸 `.planning/` 模板行不在 task_plan 枚举内(它是生成 commands 的实际消费面,
   同类松散),按 T3 精神一并修,+step 0 引导与 SKILL.md 保持同构。
2. 骨架模板在 SKILL 内以行内反引号形式给出(≤4 行/文件),未建独立模板文件 — 守 token budget 约束。

发布状态:与 4.20.1(已提交 b16268e)同批待发,建议单 tag v4.21.0。
