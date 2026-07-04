# progress — 4.17.0 CodeGraph 编排轻接线

- T1 轻接线 — DONE
  - `workflows/role-prompts.yaml` + `role-prompts.zh-Hans.yaml`:`task-code` checklist 第 2 位插入
    条件优先指令(`.codegraph/` 存在 → codegraph_explore 优先于 grep/glob/Read 爬取),en/zh 成对。
  - `workflows/task/code/SKILL.md` + `SKILL.zh-Hans.md`:新增 "## CodeGraph navigation (opt-in, v4.17.0)"
    小节(同级 heading,en/zh 成对,i18n 结构 parity 保持)。
  - generateCommands.ts 无 navigation 类共享模板(grep 0 命中)— checklist 经 role-prompts 数据流
    自动进入生成的 commands/<x>.md,无需代码改动。
  - 顺手修复(同文件卫生):task/code SKILL en+zh 的 "3 mattpocock 招式 / 3 触发条件" 计数
    在 4.16.3 zoom-out 移除后未同步 → 修正为 2。
- T2 doctor 提示准确化 — DONE(TDD 先红:新增 "fix hint covers BOTH enable steps" 用例先 fail,
  实现后绿):`check-codegraph.ts` fix 提示补第二步 `codegraph init`(上游 README step 3;
  旧提示止步 step 2 的 agent wiring,用户启用后索引仍不存在)。
- T3 决策记录 — **"每次 commit 触发 CodeGraph 重建" 不做**。依据(colbymchenry/codegraph README
  2026-07-04 实证):auto-sync 默认开启,文件 watcher 逐文件变更即时更新,"The index is never
  stale, and there is nothing to re-run"。commit 粒度重建 = 逆上游设计的冗余,且比 watcher 更迟钝。
  复核锚点:若实际使用观察到索引漂移(如 watcher 未随 MCP 起动的场景),再评估 CC PostToolUse
  hook(matcher Bash + git commit 过滤)方案 — harnessed 已有 cc-hook-add 机制可承载。
- T4 收尾 — DONE:CHANGELOG `## [4.17.0]`(Edit 工具写入)+ package.json 4.17.0 + 本文件。

## 被更新的既有断言
- 无(check-codegraph.test.ts 为新增用例;role-prompts/SKILL 文本改动未命中既有断言,
  yaml-i18n-parity 为 field-key 集比对,en/zh 同步 +1 项保持 parity)。

## 验证
- 见主 session 验收(vitest 全量 / tsc / biome / scripts/check-*.mjs)。
