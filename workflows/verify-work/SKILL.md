---
name: verify-work
description: |
  verify-work workflow v2 — Stage ④ Verify 9-phase composition per CLAUDE.md verbatim
  (gsd-verify-work + gsd-progress 必跑串行 → code-review 多 agent 并行 fan-out → gstack /review
  关键模块强制 → 可选 /qa /cso /design-review conditional → code-simplifier 末尾串行 →
  关键发布/大重构 PR 升级 4-specialist Agent Team Pattern C 多维度审查 互相质询)。
  schema_version: harnessed.workflow.v2 with capability template interpolation + parallelism
  gate refs + conditional `on` clauses. Triggered by harnessed CLI `harnessed verify-work
  --phase <num>` or slash command `/verify-work` after `harnessed setup`.
trigger_phrases:
  - "verify work"
  - "verify-work workflow"
  - "Stage 4 verify"
  - "跑 verify-work"
---

# verify-work workflow (v2)

## Overview

9-phase chain mapping the user's CLAUDE.md Stage ④ Verify discipline onto the harnessed
runtime, fully `harnessed.workflow.v2` schema (Phase v2.0-2.4 W2 T2.4.W2.2 — D-12
Q-AUDIT-2 amend + R20.12 + R20.11 + R20.14).

| phase | id | upstream | model | capability / invokes | gate / on / parallelism |
| ----- | -- | -------- | ----- | -------------------- | ----------------------- |
| 1 | `01-gsd-verify-work` | gsd | sonnet | `{{ capabilities.gsd-verify-work.cmd }}` | serial — `max_iterations: 3` |
| 2 | `02-gsd-progress` | gsd | haiku | `{{ capabilities.gsd-progress.cmd }}` | serial — `max_iterations: 2` |
| 3 | `03-code-review-parallel` | mattpocock-skills | sonnet | `{{ capabilities.code-review.cmd }}` | `parallelism: judgments.parallelism-gate.subagent-default.fires` |
| 4 | `04-gstack-review-conditional` | gstack | opus | `{{ capabilities.gstack-review.cmd }}` | `on: phase.is_critical_module → invoke / else skip` |
| 5 | `05-qa-conditional` | gstack | sonnet | `{{ capabilities.gstack-qa.cmd }}` | `on: phase.has_ui_changes → invoke / else skip` |
| 6 | `06-cso-conditional` | gstack | opus | `{{ capabilities.gstack-cso.cmd }}` | `on: phase.has_auth_or_secrets → invoke / else skip` |
| 7 | `07-design-review-conditional` | gstack | sonnet | `{{ capabilities.gstack-design-review.cmd }}` | `on: phase.has_design_changes → invoke / else skip` |
| 8 | `08-code-simplifier` | mattpocock-skills | sonnet | `{{ capabilities.code-simplifier.cmd }}` | serial 末尾 — `max_iterations: 5` |
| 9 | `09-agent-team-multispecialist` | claude-platform | opus | `{{ capabilities.agent-teams-create.cmd }}` | `parallelism: judgments.parallelism-gate.agent-teams-upgrade.fires`; `on: is_major_release OR is_large_refactor → invoke` |

Per-phase config loads from `workflows/verify-work/workflow.yaml`; engine.runRouting
spawns each phase as a sub-agent via `@anthropic-ai/claude-agent-sdk` 0.3.142+.

## Phase 9 Pattern C 4-specialist Agent Team (D-11 + R20.11)

The Agent Team upgrade phase (`09-agent-team-multispecialist`) follows the
bundled Agent Teams Pattern C 多维度审查 — 4 teammate
(code-review + gstack-review + gstack-cso + gstack-qa) 互相 SendMessage 质询
findings 是否真问题 (NOT fire-and-forget subagent fan-out)。Token estimate
`team_cost < 2 × subagent_cost` is a prereq (bundled cost guideline; engine-level
check, NOT yaml schema scope). Cleanup mandatory: `SendMessage shutdown_request`
+ `TeamDelete` after round-trip complete (bundled cleanup discipline).

Trigger condition: `phase.is_major_release == true OR phase.is_large_refactor
== true`. 常规 PR / 单点任务**不触发** Pattern C — code-review fan-out (phase 3)
+ gstack-review conditional (phase 4) 已够用且更省 token (per CLAUDE.md "Verify
阶段" 末段 "关键发布 / 大重构 PR" 限定语)。

## R20.16 chain_isolation 实装 (3 铁律 fallback)

每个 conditional phase (4-7, 9) 都实装 `on: [{if: ..., action: invoke}, {if:
..., action: skip}]` — skip 04-gstack-review **不**级联跳过 06-cso-conditional,
等等。验证脚本 `node scripts/check-workflow-schema.mjs` 严格 schema 校验 +
runtime engine 独立判 condition。

## CLI invocation

```bash
# Dry-run preview — arbitrate-only, never spawns SDK.
harnessed verify-work --phase <num> --dry-run --non-interactive

# Apply path — real SDK spawn + 9-phase chain (conditional phases evaluate by phase fact context).
harnessed verify-work --phase <num> --apply
```

## Forward-looking note

The `trigger_phrases:` frontmatter is active after `harnessed setup` copies this
SKILL.md to `<claude-home>/skills/verify-work/` — Claude Code then loads the slash
command `/verify-work` automatically (Gap B fix — v1.0.2 sister mechanism).

## References

- D-12 (Q-AUDIT-2 amend) — verify-work 7+ phase 完整 4-stage 重定
- R20.12 — verify-work full scope acceptance
- R20.11 — 4-specialist Agent Team upgrade
- R20.14 — special-purpose /qa /cso /design-review conditional
- R20.7 — D-08 verify-work NEW 2 之一
- R20.16 — fallback 3 铁律 chain_isolation
- `workflows/capabilities.yaml` — gsd-verify-work / gsd-progress / code-review / gstack-{review,qa,cso,design-review} / code-simplifier / agent-teams-create entries
- `workflows/judgments/parallelism-gate.yaml` — subagent-default + agent-teams-upgrade.fires
- `workflows/defaults.yaml` — ralph_max_iterations.verify-work.* values
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + Stage ④ Verify 章节
