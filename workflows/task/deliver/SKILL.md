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

2-phase sub-workflow mapping the user's CLAUDE.md Stage ③.d 子任务交付 discipline
onto the harnessed runtime, fully `harnessed.workflow.v3` schema (Phase v3.0-3.4 W0
T3.4.W0.9 — D-09 L0 Discipline Substrate + D-10 ralph-loop SDK wrapper + D-11 Agent
Teams 升级 5 触发 OR-chain + R20.10 explicit max_iterations_exceeded handler).

| phase | id | upstream | model | capability / args / parallelism / fallback |
| ----- | -- | -------- | ----- | ------------------------------------------ |
| 1 | `01-deliver` | ralph-loop | haiku | `{{ capabilities.ralph-loop.cmd }}` + `args: {completion_promise: COMPLETE, max_iterations: ...}` + `parallelism: judgments.parallelism-gate.ralph-loop-wrapper.fires` + `fallback.max_iterations_exceeded.action: emit_warning_and_halt` |
| 2 | `02-progress-mark` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` / `invokes: /plan` / `artifacts_expected: [progress.md]` |

Per-phase config loads from `workflows/task/deliver/workflow.yaml`; engine.runRouting
spawns each phase as a sub-agent via `@anthropic-ai/claude-agent-sdk` 0.3.142+.

## Phase 01 ralph-loop COMPLETE wrapper (R20.10 + D-10 + ADR 0011)

ralph-loop SDK wrapper 保 completion-promise verbatim string `"COMPLETE"` — sub-task
被认为完成的判据是子任务输出包含 verbatim "COMPLETE" string (NOT 启发式 / NOT
LLM-as-judge). Sister capabilities.yaml `ralph-loop` entry impl `bundled-skill` +
`sdk_ref: src/routing/lib/ralphLoop.ts` (Phase 2.2 v0.2.0 ship)。

### Parallelism — ralph-loop 正交 wrapper

`parallelism: judgments.parallelism-gate.ralph-loop-wrapper.fires` ref — per R20.10
+ D-10, ralph-loop 是 **正交 wrapper** 套在 subagent-default / agent-teams-upgrade /
main-session-fallback 任 1 mode 外层 (NOT 互斥触发器, 而是 `wraps:` orthogonal field
in parallelism-gate.yaml L42-45). Runtime engine 评估 wrapping mode 后 spawn 相应
execution unit + 套 ralph-loop completion check。

### Agent Teams conditional escalation (D-11 + agent-teams.md 5 OR-chain)

5 升级触发 (per capabilities.yaml `agent-teams-create.fires_when` + agent-teams.md):
1. `teammate_send_message_needed == true` — teammate 间 SendMessage 互通 (NOT fire-and-forget)
2. `subagent_context_overflow == true` — subagent 撞 context 上限
3. `shared_task_list == true` — 多 teammate 共享 task list 自协调
4. `opposing_hypothesis_debate == true` — 对立假设辩论
5. `fullstack_three_way == true` — 全栈三路协同

任 1 fire → escalate subagent fan-out → Agent Teams Pattern A/B/C。Cleanup mandatory
per agent-teams.md 防呆清单 (SendMessage shutdown_request + TeamDelete) — engine-level
wiring, NOT yaml schema scope。

### R20.10 explicit max_iterations_exceeded handler (NOT silent abort)

phase.fallback.max_iterations_exceeded = `{action: emit_warning_and_halt, message,
exit_code: 1}` — schema-enforced via FallbackMaxIterationsExceeded Type.Literal(
'emit_warning_and_halt') (workflow.ts L70-77). Sister Phase 2.4 W1.2 fallbackHandlers.ts
engine.ts wire — ralph-loop 撞 max_iterations 时 explicit emit warning + halt with
exit_code 1, NOT silent abort / continue。

Brief enforcement W0.9: ✅ ralph-loop completion_promise COMPLETE / ✅ parallelism-gate
ref / ✅ R20.10 explicit max_iterations_exceeded handler。

## Phase 02 progress-mark planning-with-files (D-15 + Q-AUDIT-5a Option A)

02-progress-mark invokes Claude Code plugin slash cmd `/plan` to mark subtask complete
in `progress.md` — sister Phase 01-code progress update pattern, last call in Stage
③ task chain。Plugin path `~/.claude/plugins/cache/planning-with-files/
planning-with-files/2.34.0/` verified (2026-05-20)。

## CLI invocation

```bash
# Dry-run preview — arbitrate-only, never spawns SDK.
harnessed task-deliver --task "<text>" --dry-run --non-interactive

# Apply path — real SDK spawn + 2-phase chain (ralph-loop COMPLETE + progress mark).
harnessed task-deliver --task "<text>" --apply
```

## Forward-looking note

The `trigger_phrases:` frontmatter is active after `harnessed setup` copies this
SKILL.md to `~/.claude/skills/task-deliver/` — Claude Code then loads the slash
command `/task-deliver` automatically (Gap B fix — sister v1.0.2 mechanism).

## How to invoke

Use the SlashCommand tool to run: `{{ capabilities.ralph-loop.cmd }}`

(If the rendered cmd above is the bare `/ralph-loop` accompanied by a `⚠️ ... not installed`
warning from `harnessed setup`, install the missing plugin first then re-run
`harnessed setup` to re-render this SKILL.md with the full namespaced cmd.)

## References

- D-09 — L0 Discipline Substrate always-on (6 disciplines)
- D-10 — ralph-loop 真接 SDK wrapper (NOT mock reference; v0.2.0 ship)
- D-11 — Agent Teams 升级 5 触发 OR-chain per ~/.claude/rules/agent-teams.md
- R20.10 — ralph-loop max_iterations_exceeded explicit emit_warning_and_halt
  (acceptance c "NOT silent abort"); ralph-loop 正交 wrapper wraps 3 mode
- D-02 — SKILL.md `name:` bare slash cmd (`task-deliver` NOT `task/deliver`) per ADR 0030
- ADR 0011 — SDK + ralph-loop integration v0.2.0 baseline
- ~/.claude/CLAUDE.md "Execute 阶段" 节 ralph-loop 至 verbatim COMPLETE +
  `子任务并行执行机制` Agent Teams 升级路由
- ~/.claude/rules/agent-teams.md — Pattern A/B/C + 防呆清单 cleanup mandatory
- `workflows/judgments/parallelism-gate.yaml` triggers.ralph-loop-wrapper +
  agent-teams-upgrade + subagent-default + main-session-fallback
- `workflows/capabilities.yaml` — ralph-loop + agent-teams-{create,send-message,shutdown}
  + planning-with-files entries
- `workflows/defaults.yaml` — ralph_max_iterations.task-deliver.* values (T3.4.W2.2 followup)
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + Stage ③ Execute 章节
