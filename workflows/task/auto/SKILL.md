---
name: task
description: |
  Stage ③ Task master orchestrator — 串行 invoke 4 sub per subtask (clarify → code → test → deliver)。
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

# task master orchestrator (v3)

## Overview

4-stage cadence Stage ③ master orchestrator delegating to 4 sequential sub-workflows
per subtask (bundled Execute-stage cadence + karpathy 心法 always-on):

| order | sub | gate ref | mode | when fires |
| ----- | --- | -------- | ---- | ---------- |
| 1 | `clarify` | `judgments.subtask-gate.brainstorming.fires` | serial | approaches ≥ 2 / core_algorithm / has_api_contract / error_cost=high |
| 2 | `code` | (unconditional — karpathy 心法 always-on + mattpocock conditional route) | serial | always |
| 3 | `test` | `judgments.tdd-gate.tdd-strongly-suggested.fires` | serial | 核心业务 / 算法 / 数据处理 / 回归 risk / reliability (6 fires_when OR-chain) |
| 4 | `deliver` | (unconditional — ralph-loop COMPLETE wrapper) | serial | always |

Engine runtime spawns 4 sub-workflow phases sequentially via `runMasterOrchestrator`
per T3.5.W0.1 — clarify → code → test → deliver。K9 invariant enforced: every serial
mode delegate carries explicit `order`。Each subtask 入口走一次此 master orchestrator。

## ralph-loop orthogonal wrapper (D-10)

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

Use the Bash tool to run:

```bash
echo "$ARGUMENTS" | harnessed run task --task-stdin
```

If `$ARGUMENTS` is empty, run `harnessed run task` (no stdin pipe).

After completion, the Bash output prints a `Next:` hint on stderr suggesting the next stage. Decide whether to invoke based on conversation context — the hint is informational, not prescriptive.

<!-- harnessed-generated:v3.4.4 -->

## References

- D-01 master orchestrator delegation pattern
- D-02 bare slash cmd convention (ADR 0030 namespace policy LOCK)
- D-10 ralph-loop orthogonal wrapper
- workflows/judgments/{subtask-gate,tdd-gate}.yaml — brainstorming + tdd-strongly-suggested triggers
- workflows/task/{clarify,code,test,deliver}/workflow.yaml — 4 sub-workflow Phase 3.4 SHIPPED
