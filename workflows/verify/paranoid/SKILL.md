---
name: verify-paranoid
description: |
  Stage ④.c verify sub-workflow — gstack /review Paranoid Staff Engineer 关键模块 PR 前强制
  (bundled gstack governance gate — mandatory before critical-module PR)。Gate:
  judgments.stage-routing.verify-paranoid-critical.fires (phase.is_critical_module == true) —
  默认 critical fire only; 非关键模块 skip。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-review) + 1 phase (gate ref is_critical_module conditional)。
  Triggered by slash command
  `/verify-paranoid` after `harnessed setup`.
trigger_phrases:
  - "verify paranoid"
  - "paranoid staff engineer review"
  - "关键模块审查"
  - "gstack review"
  - "跑 verify-paranoid"
---

# verify-paranoid workflow (v3)

## Overview

1-phase sub-workflow mapping CLAUDE.md "gstack 治理关卡 🔒 关键模块 PR 前强制 — `/review`"
onto harnessed runtime (Phase v3.0-3.4 W0.12 — D-04 Stage ④ Verify 7 sub + D-12 gstack
治理关卡 + Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-review` | gstack | opus | `{{ capabilities.gstack-review.cmd }}` | `judgments.stage-routing.verify-paranoid-critical.fires` |

Per-phase config loads from `workflows/verify/paranoid/workflow.yaml`; engine 4-level gate
resolver evaluates `phase.is_critical_module == true` via expr-eval — true 则 invoke gstack
`/review`, false 则 skip (chain_isolation 3 铁律 R20.16 sister verify-work v2 phase 04)。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gstack-review` — Bucket 3 治理关卡 (impl: gstack, cmd: /review,
  fires_when: phase.is_critical_module == true)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-paranoid-critical.fires` — `phase.stage == 'verify' and phase.is_critical_module == true`
  (默认 critical fire only; 普通 PR 应跳过 — gstack-review 是 Paranoid Staff Engineer 重武器)

## Routing rules (sister CLAUDE.md "gstack 治理关卡")

- ✅ **触发**: 关键模块 PR 前 (auth / payment / data migration / core algorithm 等)
- ❌ **跳过**: 常规 PR / docs / config / 非核心 module

## How to invoke

Use the Bash tool to run:

```bash
echo "$ARGUMENTS" | harnessed run verify-paranoid --task-stdin
```

If `$ARGUMENTS` is empty, run `harnessed run verify-paranoid` (no stdin pipe).

After completion, the Bash output prints a `Next:` hint on stderr suggesting the next stage. Decide whether to invoke based on conversation context — the hint is informational, not prescriptive.

<!-- harnessed-generated:v3.4.4 -->

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡强制
- workflows/capabilities.yaml — gstack-review
- workflows/judgments/stage-routing.yaml — verify-paranoid-critical trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-paranoid.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 04-gstack-review-conditional sister verbatim
