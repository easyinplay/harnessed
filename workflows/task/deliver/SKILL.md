---
name: task-deliver
description: |
  task-deliver workflow v3 — Stage ③.d 子任务交付 sub-workflow (harnessed 自有 completion-gate
  + Agent Teams conditional escalation + R20.10 explicit max_iterations_exceeded
  fallback)。2-phase composition: 01-deliver (completion-gate with completion_promise
  verbatim "COMPLETE" + parallelism judgments.parallelism-gate.completion-gate-wrapper.fires +
  fallback emit_warning_and_halt exit_code 1) → 02-progress-mark (Claude Code plugin
  /plan mark subtask complete in progress.md)。
  schema_version: harnessed.workflow.v3 with disciplines_applied [6] + tools_available
  [completion-gate, verification-before-completion, agent-teams-create,
  agent-teams-send-message, agent-teams-shutdown,
  planning-with-files]. Triggered by harnessed CLI `harnessed task-deliver --task <text>`
  or slash command `/task-deliver` after `harnessed setup`.
trigger_phrases:
  - "deliver this subtask"
  - "task-deliver workflow"
  - "Stage 3 deliver"
  - "completion gate COMPLETE"
  - "跑 task-deliver"
---

# task-deliver workflow (v3)

## Overview

2-phase sub-workflow mapping the user's CLAUDE.md Stage ③.d 子任务交付 discipline
onto the harnessed runtime, fully `harnessed.workflow.v3` schema (Phase v3.0-3.4 W0
T3.4.W0.9 — D-09 L0 Discipline Substrate + D-10 completion gate + D-11 Agent
Teams 升级 5 触发 OR-chain + R20.10 explicit max_iterations_exceeded handler).

| phase | id | upstream | model | capability / args / parallelism / fallback |
| ----- | -- | -------- | ----- | ------------------------------------------ |
| 1 | `01-deliver` | (none — harnessed 自有 CLI) | haiku | `{{ capabilities.completion-gate.cmd }}` + `args: {completion_promise: COMPLETE, max_iterations: ...}` + `parallelism: judgments.parallelism-gate.completion-gate-wrapper.fires` + `fallback.max_iterations_exceeded.action: emit_warning_and_halt` |
| 2 | `02-progress-mark` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` / `invokes: /plan` / `artifacts_expected: [progress.md]` |

Per-phase config loads from `workflows/task/deliver/workflow.yaml`; engine.runRouting
spawns each phase as a sub-agent via `@anthropic-ai/claude-agent-sdk` 0.3.142+.

## Phase 01 completion gate (R20.10 + D-10 + ADR 0039)

完成判据是子任务输出包含 verbatim `"COMPLETE"` string (NOT 启发式 / NOT LLM-as-judge)。
4.36.0 起这条保证**完全内置**,跑在 harnessed 自己的 live path 上,不依赖任何上游 plugin:

- `harnessed checkpoint complete <sub> --result-file <path>` — fail-CLOSED,同时校验
  声明的 `artifacts_expected` 产物存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 /
  测试文件未被删除)、结果含 verbatim `<promise>COMPLETE</promise>`(或结构化 COMPLETE
  状态)。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。
  `--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
- `harnessed checkpoint fail <sub> --failing-tests <n>` — 记录本次尝试,并在命中停机
  条件时打印 `BUDGET-EXHAUSTED`(已用尝试次数 vs `workflows/defaults.yaml
  ralph_max_iterations`)/ `NO-PROGRESS`(连续 N 次无进展;失败测试数,省略该 flag 时退回
  证据产物摘要)/ `BREAK-LOOP`(该 sub 失败次数达阈值)。
- **仅当**这三条停机理由都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、
  修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。

这三条停机理由 == 上游 `/ralph-loop --max-iterations` + `--completion-promise` 曾经提供的
东西,只是长在自有路径上、没有「装没装」的问题(ADR 0039 supersedes ADR 0036 的
plugin → `/goal` → self-loop 三级链)。Sister capabilities.yaml `completion-gate` entry
impl `harnessed-bundled` + `sdk_ref: src/workflow/lib/ralphLoop.ts`。

### Parallelism — completion gate 正交 wrapper

`parallelism: judgments.parallelism-gate.completion-gate-wrapper.fires` ref — per R20.10
+ D-10, completion gate 是 **正交 wrapper** 套在 subagent-default / agent-teams-upgrade /
main-session-fallback 任 1 mode 外层 (NOT 互斥触发器, 而是 `wraps:` orthogonal field
in parallelism-gate.yaml). Runtime engine 评估 wrapping mode 后 spawn 相应
execution unit + 套 completion check。

### Agent Teams conditional escalation (D-11 + agent-teams.md 5 OR-chain)

5 升级触发 (per capabilities.yaml `agent-teams-create.fires_when` + agent-teams.md):
1. `teammate_send_message_needed == true` — teammate 间 SendMessage 互通 (NOT fire-and-forget)
2. `subagent_context_overflow == true` — subagent 撞 context 上限
3. `shared_task_list == true` — 多 teammate 共享 task list 自协调
4. `opposing_hypothesis_debate == true` — 对立假设辩论
5. `fullstack_three_way == true` — 全栈三路协同

任 1 fire → escalate subagent fan-out → Agent Teams Pattern A/B/C。Cleanup mandatory
per agent-teams.md 防呆清单 (lead 按名请求每个 teammate shut down; CC 2.1.178+ 无 teardown
工具,团目录 session 退出时自动清理 —— 剩下的纪律是别把 teammate 落在运行态) — engine-level
wiring, NOT yaml schema scope。

### R20.10 explicit max_iterations_exceeded handler (NOT silent abort)

phase.fallback.max_iterations_exceeded = `{action: emit_warning_and_halt, message,
exit_code: 1}` — schema-enforced via FallbackMaxIterationsExceeded Type.Literal(
'emit_warning_and_halt') (workflow.ts L70-77). Sister Phase 2.4 W1.2 fallbackHandlers.ts
engine.ts wire — 撞 max_iterations 时 explicit emit warning + halt with
exit_code 1, NOT silent abort / continue。交互面的对应物是 `checkpoint fail` 打印的
`BUDGET-EXHAUSTED`。

Brief enforcement W0.9: ✅ completion-gate completion_promise COMPLETE / ✅ parallelism-gate
ref / ✅ R20.10 explicit max_iterations_exceeded handler。

## Phase 02 progress-mark planning-with-files (D-15 + Q-AUDIT-5a Option A)

02-progress-mark invokes Claude Code plugin slash cmd `/plan` to mark subtask complete
in `progress.md` — sister Phase 01-code progress update pattern, last call in Stage
③ task chain. Requires `planning-with-files` Claude Code plugin (install via
Claude Code plugin marketplace).

## How to invoke

!`harnessed checkpoint intent task-deliver`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run task-deliver` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt task-deliver --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` and `model`, then drive delivery with harnessed's own completion gate:
   - on return, write the subagent's final output to a file and run `harnessed checkpoint complete task-deliver --result-file <path>` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
   - if it blocks, run `harnessed checkpoint fail task-deliver --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
   - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete task-deliver --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. `--force` records an audited override (`evidence_status=overridden`) — it does not silently pass.
5. If the complete gate blocked: Bash `harnessed checkpoint fail task-deliver --failing-tests <n>` to record the attempt. It prints `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.

<!-- harnessed-generated:v4.12.0 -->

## References

- D-09 — L0 Discipline Substrate always-on (6 disciplines)
- D-10 — 完成保证真接 SDK wrapper (NOT mock reference; v0.2.0 ship)
- D-11 — Agent Teams 升级 5 触发 OR-chain per bundled parallelism-gate rules
- R20.10 — max_iterations_exceeded explicit emit_warning_and_halt
  (acceptance c "NOT silent abort"); completion gate 正交 wrapper wraps 3 mode
- D-02 — SKILL.md `name:` bare slash cmd (`task-deliver` NOT `task/deliver`) per ADR 0030
- ADR 0011 — SDK + 完成保证 integration v0.2.0 baseline
- ADR 0039 — 完成保证内置化 + 摘除上游 `/ralph-loop` 依赖 (supersedes ADR 0036)
- `workflows/judgments/parallelism-gate.yaml` triggers.completion-gate-wrapper +
  agent-teams-upgrade + subagent-default + main-session-fallback
- `workflows/capabilities.yaml` — completion-gate + agent-teams-{create,send-message,shutdown}
  + planning-with-files entries
- `workflows/defaults.yaml` — ralph_max_iterations.task-deliver.* values (T3.4.W2.2 followup)
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + Stage ③ Execute 章节
