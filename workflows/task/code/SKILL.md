---
name: task-code
description: |
  task-code workflow v3 — Stage ③.b 子任务编码 sub-workflow (karpathy 4 心法
  always-on + mattpocock conditional route + planning-with-files progress.md update)。
  2-phase composition: 01-code (karpathy 心法 + zoom-out 陌生模块 / improve-arch
  周期审查 / diagnose bug conditional invokes_tools) → 02-progress (Claude Code plugin
  /plan 更新 progress.md 跨 session 进度同步)。
  schema_version: harnessed.workflow.v3 with disciplines_applied [6] + tools_available
  [zoom-out, improve-codebase-architecture, diagnose, planning-with-files]. Triggered
  by harnessed CLI `harnessed task-code --task <text>` or slash command `/task-code`
  after `harnessed setup`.
trigger_phrases:
  - "code this subtask"
  - "task-code workflow"
  - "Stage 3 code"
  - "跑 task-code"
---

# task-code workflow (v3)

## Overview

2-phase sub-workflow mapping the user's CLAUDE.md Stage ③.b 子任务编码 discipline
onto the harnessed runtime, fully `harnessed.workflow.v3` schema (Phase v3.0-3.4 W0
T3.4.W0.7 — D-09 L0 Discipline Substrate + D-05 conditional `invokes_tools` + D-15
planning-with-files plugin).

| phase | id | upstream | model | capability / invokes_tools |
| ----- | -- | -------- | ----- | -------------------------- |
| 1 | `01-code` | karpathy | sonnet | `invokes_tools: [{if: phase.unfamiliar_module, tool: zoom-out}, {if: phase.architecture_health_audit, tool: improve-codebase-architecture}, {if: subtask.bug_root_cause_unknown, tool: diagnose}]` |
| 2 | `02-progress` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` / `invokes: /plan` / `artifacts_expected: [progress.md]` |

Per-phase config loads from `workflows/task/code/workflow.yaml`; engine.runRouting
spawns each phase as a sub-agent via `@anthropic-ai/claude-agent-sdk` 0.3.142+.

## Karpathy 4 心法 (L0 Discipline Substrate always-on)

Phase 01-code 的 upstream 是 `karpathy` — runtime engine 加载 `workflows/disciplines/
karpathy.yaml` discipline rules 应用 cross-cutting (Think Before Coding / Simplicity
First / Surgical Changes / Goal-Driven Execution + ≤200L hard limit + no-feature-creep
+ trust-internal-code + no-comments-default). 不 invoke slash cmd, 通过 hook 强制
behavioral rule per D-09 L0 Discipline Substrate.

## mattpocock conditional route (D-05 invokes_tools)

Phase 01-code 按 phase fact context 条件性 fire 3 mattpocock 招式:
- `zoom-out` — 陌生模块导航 (when `phase.unfamiliar_module == true`)
- `improve-codebase-architecture` — 周期架构健康审查 (when `phase.architecture_health_audit == true`)
- `diagnose` — bug 系统化排错 (when `subtask.bug_root_cause_unknown == true`)

3 触发条件 OR-chain, 任 1 fire 即 invoke 对应招式 — 不互斥 (sister CLAUDE.md
"mattpocock 招式按需召唤" pattern, NOT exclusive). 无触发 = pure karpathy 心法 only.

## Phase 02-progress planning-with-files plugin 真接 (Q-AUDIT-5a LOCKED Option A)

02-progress invokes the **Claude Code plugin** slash command `/plan` to update
`progress.md` in `.planning/<phase-id>/` — 跟踪 subtask 完成 / blocked / next step
per CLAUDE.md "跨 session 恢复" 模式 + R20.6 Manus-style 持久化。Plugin path
verified at `~/.claude/plugins/cache/planning-with-files/planning-with-files/2.34.0/`
(2026-05-20).

## CLI invocation

```bash
# Dry-run preview — arbitrate-only, never spawns SDK.
harnessed task-code --task "<text>" --dry-run --non-interactive

# Apply path — real SDK spawn + 2-phase chain.
harnessed task-code --task "<text>" --apply
```

## Forward-looking note

The `trigger_phrases:` frontmatter is active after `harnessed setup` copies this
SKILL.md to `~/.claude/skills/task-code/` — Claude Code then loads the slash
command `/task-code` automatically (Gap B fix — sister v1.0.2 mechanism).

## How to invoke

Use the SlashCommand tool to run: `{{ capabilities.planning-with-files.cmd }}`

(If a `⚠️ ... not installed` warning was printed by `harnessed setup`, the backing
capability is missing on disk. Install it (`claude plugin install <name>` for
plugins, or follow the official install instructions for user-skills — e.g. for
gstack: `git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack` then
`cd ~/.claude/skills/gstack && ./setup`), then re-run `harnessed setup` to re-render
this SKILL.md and clear the warning.)

## References

- D-09 — L0 Discipline Substrate always-on (karpathy 心法 4 条 cross-cutting)
- D-05 — phase-level `invokes_tools` conditional tool fire
- D-15 + Q-AUDIT-5a — planning-with-files = Claude Code plugin slash cmd `/plan`
- D-02 — SKILL.md `name:` bare slash cmd (`task-code` NOT `task/code`) per ADR 0030
- ~/.claude/CLAUDE.md "Execute 阶段" 节 karpathy 心法 + mattpocock 招式按需召唤
- `workflows/disciplines/karpathy.yaml` — 4 心法 + ≤200L hard limit 等 rules (L0 substrate)
- `workflows/capabilities.yaml` — zoom-out / improve-codebase-architecture / diagnose / planning-with-files entries
- `workflows/defaults.yaml` — ralph_max_iterations.task-code.* values (T3.4.W2.2 followup)
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + Stage ③ Execute 章节
