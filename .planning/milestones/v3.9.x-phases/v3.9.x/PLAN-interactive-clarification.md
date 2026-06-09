# PLAN: Option A — 交互式澄清在主 session, 执行阶段 spawn

> Phase: v3.9.x 维护系列 | 日期: 2026-05-30 | 状态: ✅ SHIPPED v3.9.26 (commit fdcbcfa)
> Discuss 阶段已完成（用户对话中选定 Option A, 2026-05-30）

## 问题

`/auto` / `/discuss` / `/task` 的命令体是 `echo "$ARGUMENTS" | harnessed run <name> --task-stdin`。
harnessed CLI spawn headless SDK subagent 跑所有 stage，包括 discuss/clarify。
subagent 无法向用户提问 → brainstorming 退化成自问自答 → 澄清形同虚设。

违反用户 CLAUDE.md 铁律: "澄清必须在主 session 完成后再下放"。

## 设计

### 命令分层

| 命令 | 新行为 |
|------|--------|
| `/auto` | CC 主 session 先跑交互式 discuss（AskUserQuestion 锁定 spec）→ 然后链式 `harnessed run plan/task/verify/retro`，task 带 `--skip-sub clarify` |
| `/discuss` + 3 subs | 纯主 session 交互（直接调 gstack / GSD / superpowers skills），不 spawn。结果持久化到 .planning/ |
| `/task` | 主 session 先交互 clarify（如 gate 判据触发）→ `harnessed run task --task-stdin --skip-sub clarify` |
| `/task-clarify` | 纯主 session 交互 |
| `/plan` `/verify` `/research` `/retro` + 其余 subs | 不变（无需用户交互，spawn 合理） |

### 新 CLI flag

`harnessed run <master> --skip-sub <name>[,<name>...]`
- gateContext.skip_subs = ['clarify', ...]
- masterOrchestrator 在 gate eval 前过滤 delegates_to: sub ∈ skip_subs → 直接标 skipped, reason "skipped via --skip-sub (done in main session)"

## 文件变更

| 文件 | 动作 |
|------|------|
| `src/cli/run.ts` | ADD `--skip-sub <names>` flag → gateContext.skip_subs |
| `src/workflow/masterOrchestrator.ts` | ADD pre-gate filter: delegates_to ∈ skip_subs → skipped |
| `src/cli/lib/generateCommands.ts` | MODIFY 命令体模板: interactive 类命令生成"主 session 澄清优先"指令 |
| `tests/workflow/masterOrchestrator.test.ts` | ADD skip_subs 测试 |
| `tests/cli/run-cli.test.ts` (或现有) | ADD --skip-sub flag 测试 |
| `tests/cli/generateCommands.test.ts` (现有) | UPDATE 模板断言 |

## TDD 顺序

1. RED: masterOrchestrator skip_subs 测试 → GREEN: 实现 filter
2. RED: run.ts --skip-sub flag 测试 → GREEN: 实现 flag
3. RED: generateCommands 模板测试 → GREEN: 实现新模板
4. 全量验证 + biome + 发布 v3.9.26

## 验收标准

1. `harnessed run task --skip-sub clarify` → clarify 标 skipped，不 spawn
2. 生成的 `commands/auto.md` 指示 CC 先交互 discuss 再链式 run
3. 生成的 `commands/discuss.md` 指示 CC 纯主 session 跑，不 spawn harnessed run
4. 生成的 `commands/verify.md` 等执行类命令不变
5. 1042+ tests pass / biome clean / tsc 0 errors
