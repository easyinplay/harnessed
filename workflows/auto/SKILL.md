---
name: auto
description: |
  Super-master orchestrator — 一行命令跑完整 4-stage feature 开发流 (discuss → plan → task → verify),
  适合 trivial / well-defined feature OR 你想 hands-off。每 stage 内部仍 fan-out sub-workflow per
  现有 stage-master orchestrator pattern (一层抽象 verbatim — top-master /auto → stage-master /discuss
  → sub-workflow discuss-strategic + discuss-phase + discuss-subtask)。
  schema_version: harnessed.workflow.v3 with delegates_to (4 sub: discuss serial order 1 + plan
  serial order 2 + task serial order 3 + verify serial order 4) + disciplines_applied (6 default)
  + tools_available (agent-teams-create + planning-with-files)。Fail-fast default; opt-in
  `--pause-between-stages` flag 重现 v3.0.x stage gate UX。Triggered by slash command `/auto`
  (bare per ADR 0030 namespace policy D-02 LOCK) after `harnessed setup`.
trigger_phrases:
  - "auto"
  - "自动跑完"
  - "完整流程"
  - "一键开发"
  - "auto chain"
  - "super master"
---

# auto super-master orchestrator (v3.1.0 NEW)

## Overview

v3.1.0 NEW — 5th master 跨 4 stage chain (sister 4 stage-master `/discuss /plan /task /verify`
独立 invoke 仍 work, `/auto` 是 opt-in 一行命令 chain)。

| order | sub (stage-master) | gate ref | mode | when fires |
| ----- | ------------------ | -------- | ---- | ---------- |
| 1 | `discuss` | (unconditional — 4-stage chain 起点) | serial | always |
| 2 | `plan` | (unconditional — stage 2) | serial | always |
| 3 | `task` | (unconditional — stage 3) | serial | always |
| 4 | `verify` | (unconditional — stage 4 收尾) | serial | always |

Engine runtime spawns 4 stage-master workflow.yaml via `runMasterOrchestrator` per
T3.5.W0.1 — recursive 一层抽象 (super-master → stage-master → sub-workflow):

- top-level invoke `/auto` → load `workflows/auto/workflow.yaml`
- spawn stage 1: `workflows/discuss/auto/workflow.yaml` (discuss master) → 内部 fan-out 3 sub
- spawn stage 2: `workflows/plan/auto/workflow.yaml` (plan master) → 内部 fan-out 2 sub
- spawn stage 3: `workflows/task/auto/workflow.yaml` (task master) → 内部 fan-out 4 sub
- spawn stage 4: `workflows/verify/auto/workflow.yaml` (verify master) → 内部 fan-out 7 sub

K8 ctx single snapshot:auto top-level invoke 1 snapshot, pass to all 4 stage-master spawn
(sister Phase 3.5 W0.1 pattern verbatim, 1 snapshot per top-level invoke 跨整个 cycle)。

## Default behavior

- **Continuous chain**: 4 stage 一行命令跑完, 中间不停
- **Fail-fast**: 任一 stage fail 立即停, `harnessed resume` 续
- **Context 自动传递**: planning-with-files `.planning/<phase>/` 喂下 stage
- **沿用 sister planning-with-files /plan 持久化 cadence**

## Optional flag

- `--pause-between-stages` opt-in: 每 stage-master 跑完停, 等用户 review/confirm 后跑下 stage
  (重现 v3.0.x stage gate UX)

## When to use `/auto` vs 4 stage-master 手动

✅ **触发 `/auto`**:
- Trivial / well-defined feature (e.g. CRUD endpoint + standard pattern)
- Hands-off use case (你想"跑完再回来看")
- 跨 stage decision 都明显 (无 open question)

❌ **跳过 `/auto` → 分阶段手动 `/discuss` → `/plan` → `/task` → `/verify`**:
- 关键发布 / 大重构 (需 stage gate review)
- 跨 stage 有 open implementation decisions
- 你想 stage 之间 hands-on review
- 不确定整体方向 (此时手动 `/discuss` 强 grill)

## Capability refs

Sister `workflows/capabilities.yaml`:
- `agent-teams-create` — Bucket 5 agent-platform (multispec Pattern C 4-specialist team
  in verify stage if critical-release-upgrade gate fires)
- `planning-with-files` — Bucket 4 核心 capability (持久化 task_plan.md + progress.md
  跨 4 stage 自动 context 传递)
- Downstream stage-master refs:
  - sub `discuss` upstream → `workflows/discuss/auto/workflow.yaml`
  - sub `plan` upstream → `workflows/plan/auto/workflow.yaml`
  - sub `task` upstream → `workflows/task/auto/workflow.yaml`
  - sub `verify` upstream → `workflows/verify/auto/workflow.yaml`

## Invocation

- Slash command: `/auto <feature description>` (bare per ADR 0030 namespace policy D-02 LOCK
  after `harnessed setup`)
- 4 stage-master `/discuss /plan /task /verify` 仍可独立 invoke — `/auto` 是 opt-in NEW workflow

## References

- D-01 master orchestrator delegation pattern
- D-02 bare slash cmd convention (ADR 0030 namespace policy LOCK)
- D-13 declarative SoT (delegates_to[] 声明 + engine consume)
- workflows/{discuss,plan,task,verify}/auto/workflow.yaml — 4 stage-master Phase 3.5 SHIPPED
- src/workflow/masterOrchestrator.ts — 'auto' literal + recursive spawn driver
- CHANGELOG [3.1.0] — NEW super-master + --pause-between-stages opt-in
