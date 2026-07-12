# task_plan — 4.23.1 deferrable relay gate(issue #4)

status: ready-to-execute
issue #4:discuss-phase 灰区决策分 blocking/deferrable/resolved,但 `deferrable` 全仓无 relay
契约 — plan 阶段直接采纳 agent 建议默认值,用户全程不可见("可推迟排期"被静默升格为
"agent 代决")。真实案例:deferrable 默认值把验收需求从"可测试断言"改成"结构恒真",
验收方法被无声改变。grep 实证:`deferrable` 仅存在于 role-prompts en/zh 定义行;
auto SKILL step 1 只写 "lock decisions"(实际只锁 blocking 集)。

## 锁定决策(issue 两条要求照单,doc/workflow 层最小改动)
- D1 relay 契约:blocking 集锁定后,deferrable 集必须以**单轮批量 AskUserQuestion** 呈给
  用户(agent 建议默认值预选);仅当用户明确再推迟才可跳过。落点:
  - `workflows/auto/SKILL.md` step 1(+ zh 镜像 step 1)
  - `workflows/discuss/auto/SKILL.md` step 2(+ zh 镜像)— standalone /discuss→/plan 衔接
- D2 升格规则:deferrable 判定加判据 — 默认值若改变需求本质(可测试断言→结构恒真、
  验收方法变更、跨 phase 契约形变)或不可逆,必须升格 blocking;"两个候选都满足现有
  需求"不足以 defer。落点:`workflows/role-prompts.yaml` discuss-phase checklist
  (+ zh 镜像,条目数保持 en/zh 相等 — yaml-i18n-parity gate)。
- D3 role-prompts 同时把 relay 语义写进 checklist(deferrable = "用户有一次 override 机会
  后才可默认",不是 "无需用户"),让 spawn 出的 discuss-phase 子代理产物自带该契约。
- D4 回归测试:新增 `tests/workflow/deferrableRelay.test.ts`(仿 rolePromptsMattpocock
  pattern:loadRolePrompts + raw SKILL.md readFileSync),锁 en/zh 六处关键词。TDD 红先行。
- D5 版本 4.23.1(patch:workflow 文档层 + 测试,无 CLI 面变更);
  `<!-- harnessed-generated:v4.9.3 -->` 源 marker 不动(memory 规则)。

## T1 回归测试红先行 [tests/workflow/deferrableRelay.test.ts]
## T2 role-prompts en/zh — D2 升格判据 + D3 relay 语义(checklist 条目 en/zh 数量一致)
## T3 auto SKILL en/zh step 1 + discuss auto SKILL en/zh — D1 relay 行
## T4 收尾:vitest 全量 + tsc + pnpm lint(全域真实退出码)+ scripts/check-*.mjs gates
   (skill-i18n-parity / yaml-i18n-parity 重点)+ CHANGELOG `## [4.23.1]` + bump +
   progress.md;commit 即 push;issue #4 回复修复说明 + `Fixes #4` 关闭;tag 等用户确认。
