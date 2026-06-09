# v4.0 ARCHITECTURE SPEC — harnessed as 编排大脑 + Prompt 库

> 状态: ready-to-plan | 日期: 2026-05-30
> Discuss 阶段: 用户对话完成 (Option A 后续架构讨论, 2026-05-30)
> Sister docs: [v3.9.x/PLAN-interactive-clarification.md](../v3.9.x/PLAN-interactive-clarification.md) · [STATE.md](../STATE.md)

```yaml
verified_refs:
  - "src/workflow/lib/sdkSpawn.ts (exists, 4.4K)"
  - "src/workflow/lib/ralphLoop.ts (exists, 2.6K)"
  - "src/workflow/judgmentResolver.ts:42 resolveJudgmentGate (exists)"
  - "src/workflow/masterOrchestrator-helpers.ts:25 resolveMasterYamlPath (exists)"
  - "src/workflow/masterOrchestrator-helpers.ts:172 emitGateTransparency (exists)"
  - "src/cli/lib/generateCommands.ts:71 loadRolePrompts (exists)"
  - "src/cli/lib/generateCommands.ts:232 generateCommandFile (exists)"
  - "src/workflow/run.ts buildAgentDef (exists, v3.9.x verified)"
  - "workflows/role-prompts.yaml (exists, 523L, 24 entries)"
  - "workflows/judgments/ (exists, 11 yaml)"
  - "workflows/defaults.yaml ralph_max_iterations (exists)"
  - "ralph-loop:ralph-loop plugin skill (user installed, verified in skill list)"
  - "CC Agent Teams: TeamCreate / SendMessage / TeamDelete (user env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)"
```

---

## 1. 问题（为什么要 v4.0）

v3.x 架构: CC 命令体 → Bash 阻塞调 `harnessed run` → harnessed 内部 SDK spawn 自己的 agent 体系。

三宗罪:
1. **主 session 被阻塞** — `harnessed run auto` 一跑 30+ 分钟，CC 主 session 变看门狗
2. **平行 agent 体系** — SDK spawn 绕过 CC 原生 subagent/Agent Teams，SendMessage / 互怼 / contract 对齐全用不上
3. **澄清往返断裂** — spawn 的 agent 离用户隔两层，执行中涌现的选择项用户看不到

违反用户 CLAUDE.md 方法论: 主 session = 对话 + 编排决策（轻量）；具体任务 = CC 原生 subagent / Agent Teams。

## 2. 锁定决策

| # | 决策 | 选择 |
|---|------|------|
| D0 | 架构方向 | harnessed = 编排大脑 + prompt 库；执行 = CC 原生 spawn |
| D1 | `harnessed run` SDK spawn 路径 | **保留**作 CI/headless 模式（CI 无用户可问，headless 合理）；CC 命令体不再使用 |
| D2 | ralph-loop 控制者 | **ralph-loop 插件**（用户已装 `ralph-loop:ralph-loop` skill）；命令体指示 CC 用它包裹 spawn |
| D3 | 迁移节奏 | **一次到位 v4.0.0**；用户重跑 `harnessed setup` 完成迁移 |

## 3. 新 CLI 表面（3 个新子命令，全部秒级、零 spawn）

### 3.1 `harnessed gates <master> [--task <text>] [--context <json>] [--skip-sub <names>]`

Gate 评估。复用 `resolveJudgmentGate` (src/workflow/judgmentResolver.ts:42 ✓ existing) + masterOrchestrator 的 gate eval 循环（剥离 spawn driver）。

```bash
$ harnessed gates task --task "实现 Trino MCP 认证"
{
  "master": "task",
  "fire": [
    {"sub": "clarify", "order": 1, "mode": "serial", "gate": "judgments.subtask-gate.brainstorming.fires"},
    {"sub": "code", "order": 2, "mode": "serial"},
    {"sub": "test", "order": 3, "mode": "serial", "gate": "judgments.tdd-gate.tdd-strongly-suggested.fires"},
    {"sub": "deliver", "order": 4, "mode": "serial"}
  ],
  "skip": [],
  "parallelism": {"escalate_to_teams": false, "reason": null}
}
```

- stdout = JSON（CC 直接 parse）
- `parallelism` 字段: 评估 judgments/parallelism-gate.yaml → 告诉 CC 是否该用 Agent Teams
- exit 0 = 评估成功；exit 1 = yaml 错误

### 3.2 `harnessed prompt <sub> [--task <text>]`

Spawn-ready prompt 组合。复用 `buildAgentDef` (src/workflow/run.ts ✓ existing) + `loadRolePrompts` (generateCommands.ts:71 ✓ existing) + disciplines 注入。

```bash
$ harnessed prompt task-code --task "实现 Trino MCP 认证"
# stdout: 完整 prompt 文本 ↓
You are a Senior Implementation Engineer (karpathy 心法 always-on).

## Task
实现 Trino MCP 认证

## Responsibility
<role-prompts.yaml responsibility>

## Checklist
1. ...

## Disciplines (always-on)
<karpathy + output-style + operational ...>

## Completion protocol
When done emit: <promise>COMPLETE</promise>
If you hit a gray area you cannot decide: emit STATUS: NEEDS_CLARIFICATION + numbered question list. Do NOT self-decide.
```

- prompt 内嵌 NEEDS_CLARIFICATION 协议（执行中澄清往返的基础）
- prompt 内嵌 COMPLETE promise（ralph-loop 插件的 completion-promise 对接）

### 3.3 `harnessed checkpoint <complete|fail> <sub> [--summary <text>]`

状态持久化。复用现有 checkpoint/state 模块（engineHook.ts ✓ existing）。CC 主 session 每完成一个 sub 调一次。

## 4. 新命令体（CC 编排脚本）

`generateCommandFile` (generateCommands.ts:232 ✓ existing) 重写三类模板:

### 4.1 INTERACTIVE（discuss 族 + task-clarify）— v3.9.26 已有，保持

主 session 对话，不 spawn。

### 4.2 ORCHESTRATOR（auto / discuss / plan / task / verify — 全部 master）

```markdown
# /task

1. 澄清判据触发 → 主 session 对话锁 spec（AskUserQuestion）
2. Bash: `harnessed gates task --task "<spec>"` → 拿 fire 列表 + parallelism 建议
3. parallelism.escalate_to_teams == true → 走 Agent Teams 路径:
   按 ~/.claude/rules/agent-teams.md: TeamCreate → Agent(name, team_name) × N → SendMessage 协调 → shutdown + TeamDelete
4. 否则对每个 fired sub 按 order:
   a. Bash: `harnessed prompt <sub> --task "<spec>"` → 拿 prompt
   b. 用 ralph-loop 插件包裹 CC 原生 Task spawn:
      /ralph-loop "<prompt>" --max-iterations <defaults.yaml 值> --completion-promise "COMPLETE"
   c. subagent 输出含 STATUS: NEEDS_CLARIFICATION → AskUserQuestion 转达 → 答案拼进 task 重 spawn
   d. COMPLETE → Bash: `harnessed checkpoint complete <sub>`
5. 全部完成 → 汇总报告
```

### 4.3 EXECUTION（execution subs: task-code / task-test / verify-* / research / retro 等）

单 sub 直接 spawn 版（无 master 编排）:

```markdown
# /verify-paranoid
1. Bash: `harnessed prompt verify-paranoid --task "$ARGUMENTS"` → prompt
2. CC 原生 Task spawn（或 ralph-loop 包裹）
3. NEEDS_CLARIFICATION → 问用户 → 重 spawn
4. COMPLETE → checkpoint
```

## 5. 代码映射

| 现有 | v4.0 动作 |
|------|----------|
| `src/workflow/masterOrchestrator.ts` gate eval 段 | EXTRACT → `src/cli/gates.ts`（新 CLI，复用 resolveJudgmentGate） |
| `src/workflow/masterOrchestrator.ts` spawn driver 段 | 保留（CI 模式 `harnessed run` 用） |
| `src/workflow/run.ts` buildAgentDef + RULES 注入 | EXTRACT → `src/cli/prompt.ts`（新 CLI） |
| `src/workflow/lib/sdkSpawn.ts` + `ralphLoop.ts` | 保留（CI 模式） |
| `src/checkpoint/engineHook.ts` | EXTRACT → `src/cli/checkpoint.ts`（新 CLI 包装） |
| `src/cli/lib/generateCommands.ts` 三类模板 | REWRITE → INTERACTIVE / ORCHESTRATOR / EXECUTION |
| `src/cli/run.ts` | 保留 + 文档标注 "CI/headless mode" |
| workflows/*.yaml + judgments + disciplines + role-prompts | 不变（SoT 不动） |
| setup / uninstall / doctor / install | 不变 |

## 6. NEEDS_CLARIFICATION 协议（v4.0 核心新能力）

```
prompt 注入 (harnessed prompt 输出):
  "If you hit a gray area you cannot decide: emit
   STATUS: NEEDS_CLARIFICATION
   1. <question>
   2. <question>
   Do NOT self-decide."

CC 命令体指示:
  "subagent 输出含 STATUS: NEEDS_CLARIFICATION →
   用 AskUserQuestion 把问题列表转达给用户 →
   把答案追加到 task 文本 → 重新 spawn 同一 sub"
```

往返成立的根本原因: spawn 者是 CC 主 session（能对话），不再是 harnessed CLI（不能对话）。

## 7. Wave 拆解（v4.0.0 一次发布）

| Wave | 内容 | 产出 |
|------|------|------|
| W1 | 新 CLI × 3: gates / prompt / checkpoint | src/cli/gates.ts + prompt.ts + checkpoint.ts + 注册 + 测试 |
| W2 | 命令体模板重写（3 类） | generateCommands.ts + 测试 |
| W3 | `harnessed run` 标注 CI 模式 + README/docs 重写 | run.ts JSDoc + README 10 语言 + WORKFLOW.md |
| W4 | E2E dogfood（真实需求跑 /auto 全链）+ 发布 | v4.0.0 npm |

预估: W1 ~1 天 / W2 ~0.5 天 / W3 ~0.5 天 / W4 ~0.5 天

## 8. 风险

| 风险 | 缓解 |
|------|------|
| CC 不按命令体编排（LLM 不遵指令） | 命令体步骤编号 + 每步给精确 Bash 命令；dogfood 验证 |
| ralph-loop 插件不在用户机器 | doctor 检查 + 命令体 fallback: 无插件时 CC 自己控制重 spawn 循环 |
| gates JSON 被 CC 误读 | JSON schema 极简（fire/skip/parallelism 三键）；命令体内嵌输出示例 |
| 24 命令文件重新生成后用户自定义丢失 | 现有 marker 机制保护用户自定义文件（shouldOverwriteFile ✓ existing） |

## 9. Open Questions

(无 — D0-D3 已锁定，无 OPEN 项)
