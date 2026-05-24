---
name: plan-architecture
description: |
  Stage ②.a 架构层 plan sub-workflow — gstack /plan-eng-review (复杂架构强制治理关卡;
  bundled plan-stage cadence: mandatory before complex-architecture phases)。schema_version:
  harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  [plan-eng-review] + 1 phase (01-plan-eng-review) + gate literal expr
  `phase.is_complex_architecture == true`。Triggered by harnessed CLI `harnessed
  plan-architecture --module <name>` or slash command `/plan-architecture` after
  `harnessed setup`.
trigger_phrases:
  - "plan architecture"
  - "架构审查"
  - "plan eng review"
  - "复杂架构"
  - "跑 plan-architecture"
---

# plan-architecture workflow (v3)

## Overview

1-phase sub-workflow mapping CLAUDE.md "⚠️ 复杂架构前 — plan-eng-review" onto harnessed
runtime (Phase v3.0-3.4 W0.4 — D-04 Stage ② Plan 二层 + D-12 gstack 治理关卡 + Pattern A
sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-plan-eng-review` | gstack | opus | `{{ capabilities.plan-eng-review.cmd }}` | `gate: phase.is_complex_architecture == true` (literal expr) |

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `plan-eng-review` — Bucket 7 gstack 33 optional (impl: gstack, cmd: /plan-eng-review)
  - Pattern A E.2 LOCK: no `gstack-` prefix per CLAUDE.md gstack skill routing convention

## Gate ref

Inline literal expr `phase.is_complex_architecture == true` — sister capability
`fires_when` clause verbatim。W2.2 backfill 可加 `judgments/phase-gate.yaml`
trigger `is-complex-architecture` 重构 ref。

## Invocation

- Slash command: `/plan-architecture <name>` (after `harnessed setup`)

## Routing rules

触发条件 (sister CLAUDE.md "⚠️ 复杂架构前"):
- 涉及多模块跨界设计 (≥3 模块协同)
- 新引入核心抽象 (新 framework / 新数据模型 / 新协议)
- 性能 / scaling 关键路径
- 引入显著技术债 / migration 风险

## How to invoke

Use the Bash tool to run:

```bash
echo "$ARGUMENTS" | harnessed run plan-architecture --task-stdin
```

If `$ARGUMENTS` is empty, run `harnessed run plan-architecture` (no stdin pipe).

After completion, the Bash output prints a `Next:` hint on stderr suggesting the next stage. Decide whether to invoke based on conversation context — the hint is informational, not prescriptive.

<!-- harnessed-generated:v3.4.4 -->

## References

- D-04 Stage ② Plan 二层 (架构 / 计划)
- D-12 gstack 治理关卡 (复杂架构强制)
- workflows/capabilities.yaml — plan-eng-review (Bucket 7)
- workflows/defaults.yaml — ralph_max_iterations.plan-architecture.* values (W2.2 backfill)
