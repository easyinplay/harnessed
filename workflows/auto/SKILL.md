---
name: auto
description: |
  Super-master orchestrator — 一行命令跑完整 6-stage feature 开发流 (research conditional →
  discuss → plan → task → verify → retro mandatory), 适合 trivial / well-defined feature OR 你
  想 hands-off。每 stage 内部仍 fan-out sub-workflow per 现有 stage-master orchestrator pattern。
  v3.2.0 强化:Phase 0 AI 1-shot complexity assessment + Phase 0.5 understanding check prompt
  + Phase 5 `/retro` mandatory。
  schema_version: harnessed.workflow.v3 with delegates_to (6 sub: research conditional order 0 +
  4 stage-master order 1-4 + retro mandatory order 5) + disciplines_applied (6 default)
  + tools_available (agent-teams-create + planning-with-files)。Fail-fast default; opt-in
  `--staged` flag (alias `--pause-between-stages` for backward-compat) 重现 v3.0.x stage gate
  UX。Triggered by slash command `/auto` (bare per ADR 0030 namespace policy D-02 LOCK)
  after `harnessed setup`.
trigger_phrases:
  - "auto"
  - "自动跑完"
  - "完整流程"
  - "一键开发"
  - "auto chain"
  - "super master"
---

# auto super-master orchestrator (v3.2.0 enhanced)

## Overview

v3.2.0 NEW — 6-stage cadence (research conditional → discuss → plan → task → verify → retro
mandatory), sister 4 stage-master `/discuss /plan /task /verify` 独立 invoke 仍 work;
`/auto` 是 opt-in 一行命令 chain。

| order | sub | gate ref | mode | when fires |
| ----- | --- | -------- | ---- | ---------- |
| 0 | `research` | `judgments.stage-routing.auto-research-unclear.fires` | serial | user_understanding_unclear == true (Phase 0.5 prompt n) |
| 1 | `discuss` | (unconditional — 4-stage chain 起点) | serial | always |
| 2 | `plan` | (unconditional — stage 2) | serial | always |
| 3 | `task` | (unconditional — stage 3) | serial | always |
| 4 | `verify` | (unconditional — stage 4 收尾) | serial | always |
| 5 | `retro` | (unconditional — auto mode mandatory) | serial | always |

Engine runtime spawns 6 sub workflow.yaml via `runMasterOrchestrator` per
T3.5.W0.1 — recursive 一层抽象 (super-master → stage-master OR standalone → sub-workflow):

- top-level invoke `/auto` → load `workflows/auto/workflow.yaml` → runAutoPreFlight hook
- pre-flight Phase 0: `assessComplexity(taskDescription)` → small/medium auto continue;
  large → prompt user 切 `--staged` (y) OR abort 建议手动 (n)
- pre-flight Phase 0.5: `promptUserUnderstanding()` → y skip research; n set
  `user_understanding_unclear = true` 进 ctx → research gate fires
- spawn order 0: `workflows/research/workflow.yaml` (if gate fires)
- spawn order 1-4: 4 stage-master `workflows/<sub>/auto/workflow.yaml`
- spawn order 5: `workflows/retro/workflow.yaml` (mandatory unconditional)

K8 ctx single snapshot:auto top-level invoke 1 snapshot, pass to all 6 spawn
(sister Phase 3.5 W0.1 pattern verbatim, 1 snapshot per top-level invoke 跨整个 cycle)。

## Default behavior

- **Pre-flight gates**: complexity assessment + understanding check (interactive prompts)
- **Continuous chain**: 6 stage 一行命令跑完, 中间不停
- **Fail-fast**: 任一 stage fail 立即停, `harnessed resume` 续
- **Context 自动传递**: planning-with-files `.planning/<phase>/` 喂下 stage
- **Retro mandatory**: auto mode hands-off scenario,末尾强制 `/retro` 总结 (无 opt-out flag)
- **沿用 sister planning-with-files /plan 持久化 cadence**

## Optional flag

- `--staged` opt-in (primary, 8 字符 ergonomic): 每 stage-master 跑完停, 等用户 review/confirm
  后跑下 stage (重现 v3.0.x stage gate UX)
- `--pause-between-stages` alias (backward-compat sister v3.1.0 — 仍 work for 旧脚本不破)

## When to use `/auto` vs 4 stage-master 手动

✅ **触发 `/auto`**:
- Trivial / well-defined feature (e.g. CRUD endpoint + standard pattern)
- Hands-off use case (你想"跑完再回来看")
- 跨 stage decision 都明显 (无 open question)
- AI 自动判断需求复杂度 small/medium → 直接 continue;large → 自动建议 `--staged`

❌ **跳过 `/auto` → 分阶段手动 `/discuss` → `/plan` → `/task` → `/verify`**:
- 关键发布 / 大重构 (需 stage gate review)
- 跨 stage 有 open implementation decisions
- 你想 stage 之间 hands-on review
- 不确定整体方向 (此时手动 `/discuss` 强 grill)
- AI complexity gate 判定 large 且 user 不切 `--staged` → 建议 abort 手动

## Capability refs

Sister `workflows/capabilities.yaml`:
- `agent-teams-create` — Bucket 5 agent-platform (multispec Pattern C 4-specialist team
  in verify stage if critical-release-upgrade gate fires)
- `planning-with-files` — Bucket 4 核心 capability (持久化 task_plan.md + progress.md
  跨 6 stage 自动 context 传递)
- Downstream sub refs:
  - sub `research` upstream → `workflows/research/workflow.yaml` (standalone)
  - sub `discuss` upstream → `workflows/discuss/auto/workflow.yaml` (stage-master)
  - sub `plan` upstream → `workflows/plan/auto/workflow.yaml` (stage-master)
  - sub `task` upstream → `workflows/task/auto/workflow.yaml` (stage-master)
  - sub `verify` upstream → `workflows/verify/auto/workflow.yaml` (stage-master)
  - sub `retro` upstream → `workflows/retro/workflow.yaml` (standalone)

## Invocation

- Slash command: `/auto <feature description>` (bare per ADR 0030 namespace policy D-02 LOCK
  after `harnessed setup`)
- 4 stage-master `/discuss /plan /task /verify` 仍可独立 invoke — `/auto` 是 opt-in NEW workflow
- `--staged` (primary) or `--pause-between-stages` (alias) opt-in for stage gate UX

## References

- D-01 master orchestrator delegation pattern
- D-02 bare slash cmd convention (ADR 0030 namespace policy LOCK)
- D-13 declarative SoT (delegates_to[] 声明 + engine consume)
- workflows/{research,retro}/workflow.yaml — 2 standalone (research conditional + retro mandatory)
- workflows/{discuss,plan,task,verify}/auto/workflow.yaml — 4 stage-master Phase 3.5 SHIPPED
- workflows/judgments/stage-routing.yaml — auto-research-unclear trigger (v3.2.0 NEW)
- src/workflow/masterOrchestrator.ts — 'auto' literal + recursive spawn + runAutoPreFlight hook
- CHANGELOG [3.2.0] — complexity gate + research/retro flow + `--staged` rename
