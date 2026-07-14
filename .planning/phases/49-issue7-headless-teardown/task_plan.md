# task_plan — 4.31.2 issue #7:headless 完工不退出(方向 B)

status: ready-to-execute
根因(Phase 1 诊断,内证充分):headless `claude -p` 下 /auto 的 spawn-based 编排
(Agent Teams 背景 spawn / ralph-loop 循环)遗留孤儿子进程,每个孤儿复制一套 MCP
子树,stdio 管道保持打开阻塞宿主退出。H1(hook)代码级排除、H2(MCP)bare 对照排除
为根因、H3 有 SKILL.md L119-120 verbatim 内证。用户裁决:内证直接修复,方向 B。

## 锁定决策(方向 B = A headless 禁 team 升级 + 强制 teardown 守卫)
- D1 headless 检测(gates.ts parallelism 计算处):检测优先级链 —
  ① 显式 `HARNESSED_HEADLESS=1`(evidence-pack runner / CI 可设,最高优先)
  ② CC 原生 headless 信号(**实施时先探测确认真实 env 名** — 读既有 evidence run
     transcript 的 `system init` 消息里的 env/entrypoint,不猜;候选
     `CLAUDE_CODE_ENTRYPOINT` / `CLAUDECODE` 之类,以实测为准)
  ③ 无可靠信号则不判 headless(保守:绝不误伤正常 TTY session 禁掉 team)。
  命中 headless → `escalate_to_teams` 强制 false + reason 注明
  "headless mode — Agent Teams are session-scoped, incompatible with -p"。
  检测函数 `detectHeadless(env, deps)` 纯逻辑可注入(单测覆盖三级链 + 保守兜底)。
- D2 SKILL 层强化(auto/plan/task/verify 四 master SKILL.md step 4 + verify-multispec
  + task-deliver 的 teams 节):
  ① headless 明示行:"若 headless(-p / gates 返回 escalate_to_teams=false 且检出
     headless):禁止 TeamCreate / 背景 Agent spawn,全部 sub 顺序驱动"。
  ② teardown 守卫强化:Agent Teams 清理从"尽力而为"升为 finally 契约 —
     "无论 max_iterations 是否耗尽 / 是否 done,收尾前必须 SendMessage
     shutdown_request 全 teammate + TeamDelete;跳过清理 = 留孤儿进程挂起宿主"。
     en/zh 镜像(role-prompts 若有 teams cleanup 措辞同步)。
- D3 诚实约束(task_plan 记录,不假装):Agent Teams 是 CC 原生、harnessed 引擎
  看不到 team 生命周期,故"引擎强制 teardown"不可能;B 的 teardown 部分是 SKILL
  契约层强化 + headless 禁 spawn(釜底抽薪)。真机 headless 闭环验证 CI 无法覆盖
  (CI 不跑 headless /auto),留用户 dogfood;单测覆盖 detectHeadless + gates 输出。
- D4 evidence-pack runner 顺带设 `HARNESSED_HEADLESS=1`(它就是 headless 场景;
  未来 arm 跑不再触发 team 升级 → 消除 issue #7 复发面)。
- D5 版本 4.31.2(patch);TDD 红先行。

## T1 测试红先行:detectHeadless 三级链 + 保守兜底;gates parallelism 在 headless
   信号下强制 escalate_to_teams=false(+ 非 headless 维持原 gate 行为);
   SKILL 文本断言(headless 禁 team 行 + finally teardown 契约,en/zh 条目数)
## T2 实现:探测 CC headless env 真名 → detectHeadless(src/cli/lib/) + gates.ts 接线
## T3 SKILL/role-prompts 强化(D2)+ evidence-pack runner env(D4)
## T4 收尾:vitest 全量 + tsc + lint + gates 7/7 + i18n parity;CHANGELOG 4.31.2 +
   bump + progress;commit 即 push;issue #7 回复(根因 + 修复 + 真机验证留 dogfood
   声明);tag 等确认
