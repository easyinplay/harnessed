---
name: discuss
description: |
  Stage ① Discuss master orchestrator — 3 sub-workflow parallel gate-eval (chain-isolation 铁律)。
  战略层 / Phase 层 / 子任务层独立判断 gate, 可能 3 个全跑 / 1-2 个 / 全跳 + 透明声明。
  schema_version: harnessed.workflow.v3 with delegates_to (3 sub: strategic + phase + subtask, mode parallel)
  + disciplines_applied (6 default) + tools_available (planning-with-files)。
  Triggered by slash command `/discuss`
  (bare per ADR 0030 namespace policy D-02 LOCK) after `harnessed setup`.
trigger_phrases:
  - "discuss"
  - "讨论澄清"
  - "新功能澄清"
  - "stage 1 discuss"
  - "三层澄清"
---

# discuss master orchestrator (v3)

## Overview

4-stage cadence Stage ① master orchestrator delegating to 3 independent sub-workflows
(bundled 3-tier independent clarification: strategic / phase / subtask):

| sub | gate ref | mode | when fires |
| --- | -------- | ---- | ---------- |
| `strategic` | `judgments.stage-routing.discuss-strategic-delegate.fires` | parallel | new_project / new_milestone / new_feature / is_major_release |
| `phase` | `judgments.stage-routing.discuss-phase-delegate.fires` | parallel | open_decisions ≥ 2 / cross_phase_data_flow / scope_days > 1 |
| `subtask` | `judgments.stage-routing.discuss-subtask-delegate.fires` | parallel | approaches ≥ 2 / core_algorithm / has_api_contract / error_cost=high |

Engine runtime spawns 3 sub-workflow phases via `runMasterOrchestrator` per
T3.5.W0.1 (sister sub-workflow `runWorkflow` SDK pattern, parallel fan-out via
subagent default — Path A `query()` parallel OR Path B sub-shell fallback per
T3.5.W2.1 dogfood cycle decision LOCK)。

## Chain-isolation 铁律 (sister CLAUDE.md "Fallback 三条铁律")

- 拿不准 → 倾向跳过, 但在响应里**透明声明**: "这次跳过了 X, 因为 Y。如果你认为需要请明说"
- 用户明示 → 覆盖判据 (用户说 "先 brainstorm" / "跑 office-hours" / "讨论一下" 时无条件激活)
- **链式互不前置**: 跳过战略层 ≠ 必须跳过 phase 层; 每层独立判断 (防止 "上层没跑下层不敢跑" 的死板)

## Capability refs

Sister `workflows/capabilities.yaml`:
- `planning-with-files` — Bucket 4 核心 capability (impl: claude-code-plugin, cmd: /plan, discuss sink findings.md)
- sub `strategic` upstream → `gstack-office-hours` + `gstack-plan-ceo-review`
- sub `phase` upstream → `gsd-discuss-phase`
- sub `subtask` upstream → `superpowers-brainstorming` + `grill-with-docs` + `grill-me`

## Invocation

- Slash command: `/discuss <text>` (bare per ADR 0030 namespace policy D-02 LOCK after `harnessed setup`)

## How to invoke

Clarification needs real user dialogue, so run this stage directly in THIS session — do NOT
spawn it, and do NOT improvise: follow these steps so the locked spec is persisted for the
execution stages.

0. **New-project bootstrap** — if `.planning/ROADMAP.md` does not exist: invoke `/gsd-new-project` when that skill is available; otherwise create the minimal skeleton before continuing (then phase dirs follow `.planning/phases/<NN>-<slug>/`):
   - `ROADMAP.md`: `# Roadmap` + one table row per phase: `| 01 | <slug> | <one-line goal> | in-progress |`
   - `STATE.md`: `# STATE (digest — keep <100 lines)` + `current: phase 01-<slug> / stage discuss` + `next: <action>`
   - `REQUIREMENTS.md`: `# Requirements` + numbered rows `- R1: <verifiable acceptance criterion>`
1. Evaluate the clarification criteria for "$ARGUMENTS":
   - **Strategic** — new feature / milestone / unclear business scope → gstack `/office-hours` + `/plan-ceo-review`
   - **Phase** — ≥2 open implementation decisions / unclear cross-phase API contract → GSD `/gsd-discuss-phase`
   - **Subtask** — ≥2 distinct approaches / core algorithm / API contract design / high error cost → superpowers brainstorming
2. For each layer that fires, hold the dialogue with the user (use AskUserQuestion for option-style decisions) and lock every open decision.
3. Transparent-skip layers that don't fire — state which were skipped and why.
4. Persist the locked decisions to `.planning/phases/<NN>-<slug>/` via planning-with-files (`findings.md` / `task_plan.md`; NN = two-digit, one above the highest existing phase dir).

Output: a locked spec the execution stages (`/plan` → `/task` → `/verify`) consume without further user input.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-01 master orchestrator delegation pattern
- D-02 bare slash cmd convention (ADR 0030 namespace policy LOCK)
- D-04 Stage ① Discuss 三层独立判
- workflows/judgments/stage-routing.yaml — discuss-{strategic,phase,subtask}-delegate triggers
- workflows/discuss/{strategic,phase,subtask}/workflow.yaml — 3 sub-workflow Phase 3.4 SHIPPED
- workflows/judgments/fallback.yaml — 链式互不前置 chain-isolation 铁律
