---
name: verify-code-review
description: |
  Stage ④.b verify sub-workflow — code-review 多 agent 并行 fan-out 高置信度 finding
  (subagent default per ~/.claude/CLAUDE.md 子任务并行机制 — Task / Agent 工具 spawn
  多 subagent fan-out, context 隔离, token 敏感)。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (code-review) + 1 phase (parallelism ref judgments.parallelism-gate.subagent-default.fires)。
  Triggered by slash command
  `/verify-code-review` after `harnessed setup`.
trigger_phrases:
  - "verify code review"
  - "代码审查"
  - "multi-agent code review"
  - "并行 review"
  - "跑 verify-code-review"
---

# verify-code-review workflow (v3)

## Overview

1-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — code-review 多 agent 并行" 章节
onto harnessed runtime (Phase v3.0-3.4 W0.11 — D-04 Stage ④ Verify 7 sub + 子任务并行
机制 subagent default routing 机器化 + Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability | parallelism |
| ----- | -- | -------- | ----- | ---------- | ----------- |
| 1 | `01-code-review` | mattpocock-skills | sonnet | `{{ capabilities.code-review.cmd }}` | `judgments.parallelism-gate.subagent-default.fires` |

Per-phase config loads from `workflows/verify/code-review/workflow.yaml`; engine spawns
multiple subagent in parallel fan-out (sister `~/.claude/CLAUDE.md` 子任务并行机制 默认 —
Task / Agent 工具 spawn 多任务并发, context 隔离, summary 折叠回主 context)。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `code-review` — Bucket 1 mattpocock 高频招式 (impl: mattpocock-skills, cmd: /code-review)

## Parallelism gate ref

Sister `workflows/judgments/parallelism-gate.yaml`:
- `subagent-default.fires` — `subtask.parallel_count <= 3 and subtask.communication_needed == false`
  (默认 fan-out, focused 任务 research / verify / review 单文件 / 跑测试 / 抓 doc / 探索模块)

## Routing rules

总 fire 当 `phase.stage == 'verify'` 后必跑串行 (verify-progress) 之后并行 fan-out。无 skip
条件 — code-review 多 agent 是 verify-work 第 3 phase 默认 fan-out (sister CLAUDE.md verbatim)。

## How to invoke

Use the Bash tool to run:

```bash
echo "$ARGUMENTS" | harnessed run verify-code-review --task-stdin
```

If `$ARGUMENTS` is empty, run `harnessed run verify-code-review` (no stdin pipe).

After completion, the Bash output prints a `Next:` hint on stderr suggesting the next stage. Decide whether to invoke based on conversation context — the hint is informational, not prescriptive.

<!-- harnessed-generated:v3.4.4 -->

## References

- D-04 Stage ④ Verify 7 sub 分解
- ~/.claude/CLAUDE.md "Verify 阶段 — code-review 多 agent 并行" verbatim
- ~/.claude/CLAUDE.md "子任务并行执行机制 — subagent vs Agent Teams 路由" subagent default
- workflows/capabilities.yaml — code-review
- workflows/judgments/parallelism-gate.yaml — subagent-default.fires
- workflows/defaults.yaml — ralph_max_iterations.verify-code-review.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 03-code-review-parallel sister verbatim
