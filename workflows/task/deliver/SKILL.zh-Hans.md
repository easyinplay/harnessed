---
name: task-deliver
description: |
  task-deliver workflow v3 — Stage ③.d 子任务交付 sub-workflow (ralph-loop COMPLETE
  wrapper + Agent Teams conditional escalation + R20.10 explicit max_iterations_exceeded
  fallback)。2-phase composition: 01-deliver (ralph-loop SDK wrapper with completion_promise
  verbatim "COMPLETE" + parallelism judgments.parallelism-gate.ralph-loop-wrapper.fires +
  fallback emit_warning_and_halt exit_code 1) → 02-progress-mark (Claude Code plugin
  /plan mark subtask complete in progress.md)。
  schema_version: harnessed.workflow.v3 with disciplines_applied [6] + tools_available
  [ralph-loop, agent-teams-create, agent-teams-send-message, agent-teams-shutdown,
  planning-with-files]. Triggered by harnessed CLI `harnessed task-deliver --task <text>`
  or slash command `/task-deliver` after `harnessed setup`.
trigger_phrases:
  - "deliver this subtask"
  - "task-deliver workflow"
  - "Stage 3 deliver"
  - "ralph-loop COMPLETE"
  - "跑 task-deliver"
---

# task-deliver workflow (v3)

## Overview

2-phase 子工作流，将 CLAUDE.md Stage ③.d 子任务交付纪律映射到 harnessed runtime，
完整采用 `harnessed.workflow.v3` schema（Phase v3.0-3.4 W0 T3.4.W0.9 — D-09 L0
Discipline Substrate + D-10 ralph-loop SDK wrapper + D-11 Agent Teams 升级 5 触发
OR-chain + R20.10 explicit max_iterations_exceeded handler）。

| phase | id | upstream | model | capability / args / parallelism / fallback |
| ----- | -- | -------- | ----- | ------------------------------------------ |
| 1 | `01-deliver` | ralph-loop | haiku | `{{ capabilities.ralph-loop.cmd }}` + `args: {completion_promise: COMPLETE, max_iterations: ...}` + `parallelism: judgments.parallelism-gate.ralph-loop-wrapper.fires` + `fallback.max_iterations_exceeded.action: emit_warning_and_halt` |
| 2 | `02-progress-mark` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` / `invokes: /plan` / `artifacts_expected: [progress.md]` |

每阶段配置从 `workflows/task/deliver/workflow.yaml` 加载；engine.runRouting 通过
`@anthropic-ai/claude-agent-sdk` 0.3.142+ 将每个阶段 spawn 为 sub-agent。

## Phase 01 ralph-loop COMPLETE wrapper (R20.10 + D-10 + ADR 0011)

ralph-loop SDK wrapper 保 completion-promise verbatim string `"COMPLETE"`——sub-task
被认为完成的判据是子任务输出包含 verbatim "COMPLETE" string（NOT 启发式 / NOT
LLM-as-judge）。Sister capabilities.yaml `ralph-loop` entry impl `bundled-skill` +
`sdk_ref: src/workflow/lib/ralphLoop.ts`（Phase 2.2 v0.2.0 ship）。

### Parallelism — ralph-loop 正交 wrapper

`parallelism: judgments.parallelism-gate.ralph-loop-wrapper.fires` ref——遵循 R20.10
+ D-10，ralph-loop 是**正交 wrapper**，套在 subagent-default / agent-teams-upgrade /
main-session-fallback 任意 1 种模式外层（NOT 互斥触发器，而是 parallelism-gate.yaml
L42-45 中的 `wraps:` 正交字段）。Runtime engine 评估 wrapping mode 后 spawn 相应
执行单元并套 ralph-loop completion check。

### Agent Teams 条件性升级 (D-11 + agent-teams.md 5 OR-chain)

5 个升级触发（来自 capabilities.yaml `agent-teams-create.fires_when` + agent-teams.md）：
1. `teammate_send_message_needed == true` — teammate 间 SendMessage 互通（NOT fire-and-forget）
2. `subagent_context_overflow == true` — subagent 撞 context 上限
3. `shared_task_list == true` — 多 teammate 共享 task list 自协调
4. `opposing_hypothesis_debate == true` — 对立假设辩论
5. `fullstack_three_way == true` — 全栈三路协同

任 1 触发 → 升级 subagent fan-out → Agent Teams Pattern A/B/C。清理是强制的，
遵循 agent-teams.md 防呆清单（SendMessage shutdown_request + TeamDelete）——属于
engine 级别的连接，NOT yaml schema 的职责范围。

### R20.10 explicit max_iterations_exceeded handler（非静默中止）

phase.fallback.max_iterations_exceeded = `{action: emit_warning_and_halt, message,
exit_code: 1}`——通过 FallbackMaxIterationsExceeded Type.Literal(
'emit_warning_and_halt')（workflow.ts L70-77）做 schema 级强制约束。Sister Phase 2.4
W1.2 fallbackHandlers.ts engine.ts wire——ralph-loop 撞 max_iterations 时显式 emit
warning + halt with exit_code 1，NOT 静默中止/继续执行。

Brief enforcement W0.9: ✅ ralph-loop completion_promise COMPLETE / ✅ parallelism-gate
ref / ✅ R20.10 explicit max_iterations_exceeded handler。

## Phase 02 progress-mark planning-with-files (D-15 + Q-AUDIT-5a Option A)

02-progress-mark 调用 Claude Code plugin slash cmd `/plan`，在 `progress.md` 中将
subtask 标记为完成——对应 Phase 01-code progress update 模式，是 Stage ③ task chain
的最后一次调用。需要安装 `planning-with-files` Claude Code plugin（通过
Claude Code plugin marketplace 安装）。

## How to invoke

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run task-deliver --task-stdin
```

若 `$ARGUMENTS` 为空，运行 `harnessed run task-deliver`（不带 stdin pipe）。

执行完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一个阶段。根据对话上下文自行决定是否调用——该提示仅供参考，不具强制性。

<!-- harnessed-generated:v3.4.4 -->

## References

- D-09 — L0 Discipline Substrate always-on (6 disciplines)
- D-10 — ralph-loop 真接 SDK wrapper (NOT mock reference; v0.2.0 ship)
- D-11 — Agent Teams 升级 5 触发 OR-chain per bundled parallelism-gate rules
- R20.10 — ralph-loop max_iterations_exceeded explicit emit_warning_and_halt
  (acceptance c "NOT silent abort"); ralph-loop 正交 wrapper wraps 3 mode
- D-02 — SKILL.md `name:` bare slash cmd (`task-deliver` NOT `task/deliver`) per ADR 0030
- ADR 0011 — SDK + ralph-loop integration v0.2.0 baseline
- `workflows/judgments/parallelism-gate.yaml` triggers.ralph-loop-wrapper +
  agent-teams-upgrade + subagent-default + main-session-fallback
- `workflows/capabilities.yaml` — ralph-loop + agent-teams-{create,send-message,shutdown}
  + planning-with-files entries
- `workflows/defaults.yaml` — ralph_max_iterations.task-deliver.* values (T3.4.W2.2 followup)
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + Stage ③ Execute 章节
