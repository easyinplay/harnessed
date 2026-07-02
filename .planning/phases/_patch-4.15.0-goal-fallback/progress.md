# progress — 4.15.0 completion-gate 三级偏好链

- T1 SKILL.md 三级链文本 — DONE:23 en + 23 zh-Hans 全部替换(scratchpad 幂等脚本,en 尾句单变体、zh 尾句双变体统一);抽查 5 文件前缀("b."/"2.")与缩进无破坏;task/deliver 双语叙述段各补一段三级链说明。
- T1 追加(计划外命中面)— DONE:src/cli/lib/generateCommands.ts `spawnLoopSteps` 补 /goal 层(commands/<x>.md 生成面);连带修 `leafSpawnLoop` 的 `slice(0,5)→slice(0,6)`(插行后原切片把 step c NEEDS_CLARIFICATION 挤掉,cell 23/24 测试抓红后修复)。scripts/rewrite-skill-invoke-sections.mjs 为历史一次性迁移脚本(无 CI/package.json 引用),按契约不动。
- T2 capabilities.yaml — DONE:ralph-loop entry description 三级链措辞 + D-10 注释补 v4.15.0/ADR 0036 指针;未加 schema 字段。
- T3 deliver workflow.yaml — DONE:头注释补三级链 + defaults.ralph_max_iterations 语义不变声明。
- T4 ADR 0036 — DONE:docs/adr/0036-completion-gate-three-tier-fallback.md(Accepted;amends 0011 D-10 + 0028 交互面;4 项 trade-off 入 Consequences)+ README.md 索引行。
- T5 收尾 — DONE:biome clean、tsc 0、vitest 全量 1761 passed / 0 failed(5 skipped + 1 todo)、scripts/check-*.mjs 7/7 OK(含 skill-i18n-parity / workflow-schema)、CHANGELOG `## [4.15.0]` + package.json 4.15.0。

## 被更新的既有断言清单
- 无既有断言文本更新。tests/unit/generate-commands.test.ts cell 23/24 的两次失败是我插行触发的真 bug(slice 越界裁剪),修 src 后测试原样通过,断言未改。

## 禁改清单核对
ralphLoop.ts / promiseExtract / fallbackHandlers / manifests/tools/ralph-loop.yaml / defaults.yaml 数值 — `git diff` 零命中,确认未动。

## 偏差说明
1. generateCommands.ts 属于交互指令生成面,task_plan 未点名但与 T1 同类,一并纳入(否则 setup 生成的 commands/<x>.md 与 SKILL.md 链条不一致,违反 doc 与 code 零矛盾)。
2. workflows/role-prompts.yaml task-deliver 角色描述仍为两级措辞 — 属 persona 描述非执行指令,未纳入本 patch;如需对齐可作 follow-up。
