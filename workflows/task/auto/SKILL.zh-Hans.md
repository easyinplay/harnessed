---
name: task
description: |
  Stage ③ Task 主控编排器 — 串行 invoke 4 sub per subtask (clarify → code → test → deliver)。
  ralph-loop COMPLETE wrapper 在 deliver phase 内 (D-10 orthogonal wrapper)。tdd-gate conditional
  fire on test sub。schema_version: harnessed.workflow.v3 with delegates_to (4 sub: clarify order 1
  conditional + code order 2 + test order 3 conditional + deliver order 4) + disciplines_applied
  (6 default) + tools_available (8 entry: superpowers-brainstorming + tdd + grill-with-docs +
  zoom-out + improve-codebase-architecture + diagnose + ralph-loop + planning-with-files)。
  Triggered by slash command `/task`
  (bare per ADR 0030 namespace policy D-02 LOCK) after `harnessed setup`.
trigger_phrases:
  - "task"
  - "子任务执行"
  - "stage 3 execute"
  - "ralph loop"
  - "执行子任务"
---

# task 主控编排器 (v3)

## Overview

4-stage cadence Stage ③ 主控编排器，针对每个 subtask 依次委托给 4 个串行子工作流
（捆绑 Execute-stage cadence + karpathy 心法 always-on）：

| order | sub | gate ref | mode | 触发条件 |
| ----- | --- | -------- | ---- | ---------- |
| 1 | `clarify` | `judgments.subtask-gate.brainstorming.fires` | serial | approaches ≥ 2 / core_algorithm / has_api_contract / error_cost=high |
| 2 | `code` | （无条件 — karpathy 心法 always-on + mattpocock conditional route） | serial | 始终触发 |
| 3 | `test` | `judgments.tdd-gate.tdd-strongly-suggested.fires` | serial | 核心业务 / 算法 / 数据处理 / 回归 risk / reliability (6 fires_when OR-chain) |
| 4 | `deliver` | （无条件 — ralph-loop COMPLETE wrapper） | serial | 始终触发 |

Engine runtime 通过 `runMasterOrchestrator` 按顺序 spawn 4 个子工作流阶段
（依照 T3.5.W0.1：clarify → code → test → deliver）。K9 invariant 强制执行：每个 serial
mode delegate 必须携带显式 `order`。每个 subtask 入口走一次此主控编排器。

## ralph-loop 正交 wrapper (D-10)

ralph-loop 是正交 wrapper, 套在 deliver sub 的 01-deliver phase 外层保 completion-promise
verbatim "COMPLETE" (R20.10)。任何执行单元 (subagent / team / 主 session) 都可外层套 ralph-loop
保 completion-promise (bundled subagent vs Agent Teams routing — orthogonal wrapper rule).

## Capability refs

Sister `workflows/capabilities.yaml`:
- `superpowers-brainstorming` — Bucket 4 核心 capability (sub clarify upstream)
- `tdd` — Bucket 4 核心 capability TDD red-green-refactor (sub test upstream)
- `grill-with-docs` — Bucket 1 mattpocock conditional invoke (clarify)
- `zoom-out` — Bucket 1 mattpocock conditional invoke (code, unfamiliar_module)
- `improve-codebase-architecture` — Bucket 1 mattpocock conditional invoke (code, architecture_health_audit)
- `diagnose` — Bucket 1 mattpocock conditional invoke (code/test, bug_root_cause_unknown / test_fail)
- `ralph-loop` — Bucket 4 核心 capability orthogonal wrapper (deliver)
- `planning-with-files` — Bucket 4 核心 capability (code + deliver progress.md update)

## Invocation

- Slash command: `/task <text>` (bare per ADR 0030 namespace policy D-02 LOCK after `harnessed setup`)

## 如何调用

下面这套编号序列**就是** state machine —— 逐步用 Bash 执行。**不要**从上方 Overview 自行演绎一套
等价流程:freestyle 会旁路引擎(无 per-sub ledger、无 evidence guard、无 recovery)。harnessed 是
编排大脑(`harnessed gates` 决定哪些 sub fire,`harnessed prompt` 给出每个 spawn-ready prompt,
`harnessed checkpoint` 记录 ledger);**你**(主 session)用 CC-native Task / Agent 工具做 spawn。

**不要** pipe 到 `harnessed run task` —— 那是 CI/headless 路径(in-process SDK spawn,会阻塞
session、绕过 Agent Teams,在 Claude Code 内部调用时会挂死)。

1. 若 "$ARGUMENTS" 触发澄清判据(≥2 方案 / 核心算法 / API contract / 高错误成本),先在**本 session** 交互澄清(AskUserQuestion)并锁决策;否则透明 skip。产出 locked spec。
2. Bash: `harnessed gates task --task "<locked spec>" --skip-sub clarify` → 解析 JSON `{fire, skip, parallelism}`。这是 plan SoT(不 spawn)。保留 verbatim JSON。
3. Bash: `harnessed checkpoint start task --plan '<step 2 的 verbatim gates JSON>'` → seed per-sub ledger,让 `harnessed status --recover` 能在 compaction 后给你重新定位。
4. 若 `parallelism.escalate_to_teams === true`:读 `~/.claude/rules/agent-teams.md`,然后把 fired subs 作为 Agent Team 驱动(`TeamCreate` → 每个 sub `Agent(name, team_name, …)` + 其 `harnessed prompt <sub>` prompt → 用 `SendMessage` 协调 → `SendMessage shutdown_request` + `TeamDelete`)。每个 sub 仍按下方 checkpoint(`complete` / `fail`)。
5. 否则,对 `order` 里每个 fired sub(serial 串行、parallel 并发):
   - **若该项 `is_master: true`**(本身是 stage master —— 如 `/auto` fire `plan`/`task`/`verify`):**不要**直接 prompt+spawn。RECURSE:跑该 master 自己的 `harnessed gates <sub> --task "<spec>" --skip-sub clarify` → `harnessed checkpoint start <sub> --plan '<json>'` → 对它的 fired subs 重复本循环。
   - **否则(leaf sub):**
     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → 解析 `{prompt, max_iterations, model}`。
     b. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。
     c. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn 同一 sub。
     d. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete <sub> --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它,或仅在刻意覆盖时传 `--force`。
     e. 若 sub 无法达到 COMPLETE(max_iterations 耗尽 / 不可恢复错误):Bash `harnessed checkpoint fail <sub> --summary "<why>"`,然后 STOP 并向用户报告。
6. 所有 fired subs `done`(或记录 `failed`)后,Bash `harnessed status --recover` 确认 ledger,并向用户报告 per-sub fired/skipped/done/failed 摘要。

**若丢失上下文(compaction / resume):** 先跑 `harnessed status --recover` —— 它读 ledger 并打印「你在这里,下一步是什么」,让你从第一个 `pending` sub 续跑而非重启。若 ledger 为空,重跑 step 2-3。

<!-- harnessed-generated:v4.9.3 -->

## References

- D-01 master orchestrator delegation pattern
- D-02 bare slash cmd convention (ADR 0030 namespace policy LOCK)
- D-10 ralph-loop orthogonal wrapper
- workflows/judgments/{subtask-gate,tdd-gate}.yaml — brainstorming + tdd-strongly-suggested triggers
- workflows/task/{clarify,code,test,deliver}/workflow.yaml — 4 sub-workflow Phase 3.4 SHIPPED
