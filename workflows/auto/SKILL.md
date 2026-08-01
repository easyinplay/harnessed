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
  `--staged` flag 重现 stage gate UX (每 stage 完停 user review)。
  Triggered by slash command `/auto` (bare per ADR 0030 namespace policy D-02 LOCK)
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
- **New-project bootstrap**: `.planning/ROADMAP.md` missing → stage ① runs `/gsd-new-project` (when available) or creates the minimal ROADMAP/STATE/REQUIREMENTS skeleton first
- **Context 自动传递**: planning-with-files `.planning/phases/<NN>-<slug>/` 喂下 stage
- **Retro mandatory**: auto mode hands-off scenario,末尾强制 `/retro` 总结 (无 opt-out flag)
- **沿用 sister planning-with-files /plan 持久化 cadence**

## Optional flag

- `--staged` opt-in: 每 stage-master 跑完停, 等用户 review/confirm 后跑下 stage (stage gate UX)

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
- `--staged` opt-in for stage gate UX (每 stage 完停 user review)

## How to invoke

!`harnessed checkpoint intent auto`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: steps 2-3 below seed the ledger, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it step by step with Bash.
Do NOT improvise an equivalent flow from the Overview above: freelancing bypasses the engine
(no per-sub ledger, no evidence guard, no recovery). harnessed is the orchestration brain
(`harnessed gates` says which subs fire, `harnessed prompt` gives each spawn-ready prompt,
`harnessed checkpoint` records the ledger); YOU spawn with CC-native Task / Agent tools.

Do NOT pipe to `harnessed run auto` — that is the CI/headless path (in-process SDK spawn
that blocks the session, bypasses Agent Teams, and hangs inside Claude Code).

1. FIRST run the discuss stage interactively in THIS session (spawned subagents cannot ask the user questions). Evaluate strategic / phase / subtask clarification criteria for "$ARGUMENTS"; dialogue with the user (AskUserQuestion) for each layer that fires, lock decisions, transparent-skip the rest. After locking blocking decisions, relay the deferrable set to the user in a single batched AskUserQuestion with each agent-recommended default pre-selected — deferrable defers scheduling, not user authority; only skip an item if the user explicitly defers it again. Produce a locked spec.
1b. Bash: `harnessed facts auto --out .harnessed-facts.json` → it lists ONLY the facts this stage’s gates actually read: deterministic ones already filled (change size / files touched / stage, from git), judgement calls left `null` with a one-line hint of what to judge. Edit the file and replace each `null` in `facts` with your honest answer from the locked spec — leave one null only if you genuinely cannot judge it (it then falls back to the built-in default). Do NOT skip this step and do NOT invent facts the command did not ask for.
2. Bash: `harnessed gates auto --task "<locked spec>" --context-file .harnessed-facts.json --skip-sub discuss` → parse the JSON `{fire, skip, parallelism}`. This is the plan SoT (no spawn). Keep the verbatim JSON. For a small self-contained task (single-file / single-page class), the sanctioned lite path is adding `--skip-sub verify --skip-sub retro` (repeatable / comma-separated) — skipped subs are still recorded in the ledger with reasons; lite ≠ freestyle (the ledger/evidence IS the difference).
3. Bash: `harnessed checkpoint start auto --plan '<the verbatim gates JSON from step 2>'` → seeds the per-sub ledger so `harnessed status --recover` can re-orient you after compaction.
4. If `parallelism.escalate_to_teams === true`: read `~/.claude/rules/agent-teams.md`, then drive the fired subs as an Agent Team. There is NO create step and no create tool — spawn one background teammate per fired sub with `Agent(name: <sub>, run_in_background: true, prompt: <that sub's `harnessed prompt <sub>` prompt>)` and the team forms implicitly on the FIRST spawn, with this session as lead (the `team_name` input is accepted but ignored — the name is session-derived). Coordinate via `SendMessage`; when a sub is finished, ask that teammate to shut down BY NAME (e.g. "ask the verify-qa teammate to shut down"). Still checkpoint each sub (`complete` / `fail`) as below.
   - **Shut every teammate down before you finish — MUST-in-finally, not best-effort**: regardless of whether every sub reached COMPLETE, max_iterations was exhausted, or you consider the work done, ask each teammate to shut down by name before you end the run, and confirm it actually stopped. Shutdown is a REQUEST: the teammate finishes its current tool call first and may reject with a reason, so re-ask rather than assume. The team directory is removed automatically at session exit (there is no teardown tool), but a teammate you never stopped keeps consuming tokens and can hang the host (headless especially — issue #7: an 11h hang, work complete but the process never exited).
   - **Headless never spawns teams**: in a headless session (`claude -p`) `harnessed gates` already returns `escalate_to_teams: false` (Agent Teams are session-scoped — lost on `/resume`, incompatible with `-p`). Do NOT spawn teammates or background-`Agent` in headless even if you think it would parallelize — run the fired subs sequentially in-session instead.
5. Otherwise, for each fired sub in `order` (serial subs sequentially, parallel subs concurrently):
   - **If the entry has `is_master: true`** (a stage master — e.g. `/auto` firing `plan`/`task`/`verify`): do NOT prompt+spawn it. RECURSE: run that master’s own `harnessed facts <sub> --out .harnessed-facts.json` (fill the nulls) → `harnessed gates <sub> --task "<spec>" --context-file .harnessed-facts.json --skip-sub discuss` → `harnessed checkpoint start <sub> --plan '<json>'` → repeat this loop for ITS fired subs.
   - **Else (leaf sub):**
     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → parse `{prompt, max_iterations, model}`.
     b. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` and `model`, then drive delivery with harnessed's own completion gate:
        - on return, write the subagent's final output to a file and run `harnessed checkpoint complete <sub> --result-file <path>` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
        - if it blocks, run `harnessed checkpoint fail <sub> --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
        - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
     c. If the output contains `STATUS: NEEDS_CLARIFICATION` + questions: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
     d. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete <sub> --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. On a non-zero exit the sub is NOT done — re-spawn to close the gap, or pass `--force` only to deliberately override (records `evidence_status=overridden`, an audited override rather than a silent pass).
     e. If the complete gate blocked: Bash `harnessed checkpoint fail <sub> --failing-tests <n>` to record the attempt (omit the flag when the sub has no tests — the evidence-artifact digest is the fallback progress metric). It prints `BUDGET-EXHAUSTED` (attempts spent vs `workflows/defaults.yaml ralph_max_iterations`), `NO-PROGRESS` (no improvement for N consecutive attempts) or `BREAK-LOOP` (this sub failed >= the threshold) once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope, fix the blocker, or escalate to the user, and report it.
6. After all fired subs are `done` (or recorded `failed`), Bash `harnessed status --recover` to confirm the ledger and report a per-sub fired/skipped/done/failed summary to the user. Then run the `retro` stage to capture lessons.

**If you lose context (compaction / resume):** run `harnessed status --recover` first — it reads the ledger and prints "you are here, this is next" so you resume at the first `pending` sub instead of restarting. If the ledger is empty, re-run steps 2-3.

<!-- harnessed-generated:v4.12.0 -->

## References

- D-01 master orchestrator delegation pattern
- D-02 bare slash cmd convention (ADR 0030 namespace policy LOCK)
- D-13 declarative SoT (delegates_to[] 声明 + engine consume)
- workflows/{research,retro}/workflow.yaml — 2 standalone (research conditional + retro mandatory)
- workflows/{discuss,plan,task,verify}/auto/workflow.yaml — 4 stage-master Phase 3.5 SHIPPED
- workflows/judgments/stage-routing.yaml — auto-research-unclear trigger (v3.2.0 NEW)
- src/workflow/masterOrchestrator.ts — 'auto' literal + recursive spawn + runAutoPreFlight hook
- CHANGELOG [3.2.0] — complexity gate + research/retro flow + `--staged` rename
