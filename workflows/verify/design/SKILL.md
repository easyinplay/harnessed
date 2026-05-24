---
name: verify-design
description: |
  Stage ④.f verify sub-workflow — gstack /design-review 设计系统一致性 + AI 审美问题识别
  (has_design_changes 触发, 可选 conditional, sister ~/.claude/CLAUDE.md "Verify 阶段 — 可选
  /design-review" verbatim)。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-design-review + ui-ux-pro-max + frontend-design) + 1 phase (gate ref has_design_changes
  conditional)。Triggered by harnessed CLI `harnessed verify-design --phase <num>` or slash
  command `/verify-design` after `harnessed setup`.
trigger_phrases:
  - "verify design"
  - "设计审查"
  - "design review"
  - "gstack design review"
  - "跑 verify-design"
---

# verify-design workflow (v3)

## Overview

1-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — 可选 /design-review" onto harnessed
runtime (Phase v3.0-3.4 W0.13c — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 +
Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-design-review` | gstack | sonnet | `{{ capabilities.gstack-design-review.cmd }}` | `judgments.stage-routing.verify-design-changes.fires` |

Per-phase config loads from `workflows/verify/design/workflow.yaml`; engine 4-level gate
resolver evaluates `phase.has_design_changes == true` via expr-eval — true 则 invoke gstack
`/design-review` (设计系统一致性 + AI 审美问题识别), false 则 skip。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gstack-design-review` — Bucket 3 治理关卡 (impl: gstack, cmd: /design-review,
  fires_when: has_design_changes)
- `ui-ux-pro-max` — Bucket 2 special-purpose (impl: gstack, 默认主方案 数据驱动)
- `frontend-design` — Bucket 2 special-purpose (impl: gstack, UI 创意 / 装饰补充)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-design-changes.fires` — `phase.stage == 'verify' and phase.has_design_changes == true`

## Routing rules (sister ~/.claude/rules/web-design.md)

- 默认主方案 → `ui-ux-pro-max` (数据驱动、标准化、可解释)
- 创意补充 / 不要 AI 味 → `frontend-design`
- 用户明示「独特 / 不要 AI 感」→ frontend-design 主导, 否则 ui-ux-pro-max 优先

## CLI invocation

```bash
# Dry-run preview — arbitrate-only, never spawns SDK.
harnessed verify-design --phase <num> --dry-run --non-interactive

# Apply path — real SDK spawn (gate eval true 时).
harnessed verify-design --phase <num> --apply
```

## How to invoke

Use the SlashCommand tool to run: `{{ capabilities.gstack-design-review.cmd }}`

(If the rendered cmd above is the bare `/gstack-design-review` accompanied by a `⚠️ ... not installed`
warning from `harnessed setup`, install the missing plugin first then re-run
`harnessed setup` to re-render this SKILL.md with the full namespaced cmd.)

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- ~/.claude/CLAUDE.md "Verify 阶段 — 可选 /design-review" verbatim
- ~/.claude/rules/web-design.md — ui-ux-pro-max 默认 + frontend-design 补充
- workflows/capabilities.yaml — gstack-design-review / ui-ux-pro-max / frontend-design
- workflows/judgments/stage-routing.yaml — verify-design-changes trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 07-design-review-conditional sister verbatim
