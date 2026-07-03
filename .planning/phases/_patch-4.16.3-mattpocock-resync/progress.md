# progress — 4.16.3 mattpocock 招式上游对账 + mcp formatSpawnFail 统一

- T1 capabilities.yaml 对账 — DONE
  - diagnose: cmd/skill_dir → diagnosing-bugs(KEY 保留);gsd-debug alias 链 + description 同步
  - zoom-out: entry 整体移除(D3 REVISED,用户指示不做兼容性保留),原位留移除说明注释
  - investigate: impl mattpocock-skills → gstack(skill_dir gstack);investigate-gstack 失效 mattpocock
    alias 移除,改 namespace-suffix 兼容别名;Bucket 7 头注释同步
  - 头部 bucket 注释:total 39 → 38,招式清单更新 + 4.16.3 对账注记
- T2 引用面同步 — DONE
  - 字面 `/diagnose` → `/diagnosing-bugs`:role-prompts.yaml(4)+ role-prompts.zh-Hans.yaml(4)+
    decision_rules.yaml triggers(1)+ capabilities alias/description(2)+ manifest description(实 + fixture)
    + check-mattpocock-skills.ts 注释;终扫字面残留 0
  - zoom-out 全清:task/code + task/auto 的 workflow.yaml(tools_available / invokes_tools / 注释)、
    SKILL.md + SKILL.zh-Hans.md(4 文件)、role-prompts en+zh(invoke 句 + 方法论条目 + description)、
    decision_rules(primary_skills / mattpocock_phases skills / triggers)
- T3 mcp formatSpawnFail — DONE(TDD:2 个 stdout-fallback 判别用例先红)
  - mcpStdioAdd + mcpHttpAdd 的 install spawn-fail 消息接入 formatSpawnFail(tail-END + stdout 兜底)
- T4 收尾 — DONE:CHANGELOG 4.16.3 + package.json 4.16.3;ANSI 检查 0

## 验证
- vitest 全量 1840 passed / 0 failed(204 files,+10)
- tsc --noEmit 0;biome clean(1 warning 为 HEAD 既有);scripts/check-*.mjs 7/7 OK
  (含 check-workflow-schema C1 / skill-i18n-parity / yaml-i18n-parity)

## 被更新的既有断言
- tests/dogfood/cycle-3-task.dogfood.test.ts F10:zoom-out toContain → not.toContain,标题 4→3 招式
- tests/workflow/rolePromptsMattpocock.test.ts cell 3:checklist ≥12 → ≥11,zoom-out 正断言 → 负断言
- tests/workflow/run.test.ts 11/12:synthetic mock 工具名 zoom-out → grill-with-docs(grep 卫生,断言语义不变)
- tests/unit/installers-mcp{Stdio,Http}Add.test.ts:新增 stdout-fallback 用例 ×2 + stdio 消息格式断言

## follow-up(D5,YAGNI 不扩容)
- 上游新增 skills 未收编:engineering/{ask-matt,codebase-design,domain-modeling,implement,prototype,
  research,resolving-merge-conflicts,triage},productivity/{grilling,handoff,teach,writing-great-skills}。
  如未来 workflow 需要再按 D-09 判据评估。
- decision_rules mattpocock_phases 仍含 caveman(上游现清单未见 caveman,本 patch 未点名不动;下次对账核实)。
