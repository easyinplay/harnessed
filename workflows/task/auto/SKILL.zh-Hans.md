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

## How to invoke

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run task --task-stdin
```

若 `$ARGUMENTS` 为空，运行 `harnessed run task`（不带 stdin pipe）。

执行完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一个阶段。根据对话上下文自行决定是否调用——该提示仅供参考，不具强制性。

<!-- harnessed-generated:v3.4.4 -->

## References

- D-01 master orchestrator delegation pattern
- D-02 bare slash cmd convention (ADR 0030 namespace policy LOCK)
- D-10 ralph-loop orthogonal wrapper
- workflows/judgments/{subtask-gate,tdd-gate}.yaml — brainstorming + tdd-strongly-suggested triggers
- workflows/task/{clarify,code,test,deliver}/workflow.yaml — 4 sub-workflow Phase 3.4 SHIPPED
