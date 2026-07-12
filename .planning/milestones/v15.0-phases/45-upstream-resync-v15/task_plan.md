# task_plan — v15.0 Upstream Re-sync(npm 4.29.0)

status: ready-to-execute
用户裁决 2026-07-13:双主菜 + 三顺手(侦察数据 = 本 session subagent 实测,嵌于上下文)。
既定重复模式(v5.1/v13.0 先例),战略 gate 按惯例跳过(pre-defined direction)。

## Scope(锁定)
- T1 主菜:planning-with-files v2.37.0 → **v3.4.1**(manifests/skill-packs/planning-with-files.yaml
  git_ref + last_known_good;上游明示默认行为字节兼容;收益 = Windows session-catchup 修复/
  autonomous 模式/PLANNING_DISABLED 逃生口;v3.3.0 hooks 激活时序变化 — grep 仓内是否有引用
  pwf hooks 行为的文档/role-prompts,有则同步措辞)。
- T2 主菜:mattpocock/skills 改名对齐 — git_ref pin 到当前 HEAD hash(替换 "main-76-commits"
  时代描述);installs_skills:−to-prd −to-issues +to-spec +to-tickets +wayfinder(以 clone 实测
  目录集为准,不猜);grep 全仓(workflows/capabilities.yaml、role-prompts、docs、README)
  /to-prd 与 /to-issues 引用改名;**用户全局 ~/.claude/CLAUDE.md 的 mattpocock 招式行**同步
  改名(surgical 一行,用户已授权)。
- T3 顺手:superpowers pin → v6.1.1(bootstrap token 压缩 + Codex hooks 修复;codex
  harness_overrides 路径核验);gstack git_ref → 当前 HEAD(1.60.1.0)+ lkg;gsd-core
  last_known_good → 1.6.1。
- T4 watch 项:TODOS.md 加 gsd-core 1.7.0 GA watch(host-integration interface 与安装通道相关)。
- 不动:karpathy / ui-ux-pro-max(零 delta)。

## T-final 收尾(主 session):vitest 全量 + tsc + lint + gates 7/7;CHANGELOG `## [4.29.0]`
+ bump + progress;MILESTONES v15.0 行 + STATE 同步(close lightweight);commit 即 push;
tag 等用户确认;发版后用户 `harnessed setup` 重装生效。
