---
name: verify-paranoid
description: |
  Stage ④.c verify sub-workflow — gstack /review Paranoid Staff Engineer 关键模块 PR 前强制
  (sister ~/.claude/CLAUDE.md "🔒 关键模块 PR 前强制" verbatim)。Gate:
  judgments.stage-routing.verify-paranoid-critical.fires (phase.is_critical_module == true) —
  默认 critical fire only; 非关键模块 skip (sister CLAUDE.md "关键模块" 限定语)。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-review) + 1 phase (gate ref is_critical_module conditional)。
  Triggered by harnessed CLI `harnessed verify-paranoid --phase <num>` or slash command
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

## CLI invocation

```bash
# Dry-run preview — arbitrate-only, never spawns SDK.
harnessed verify-paranoid --phase <num> --dry-run --non-interactive

# Apply path — real SDK spawn (gate eval true 时).
harnessed verify-paranoid --phase <num> --apply
```

## How to invoke

Use the SlashCommand tool to run: `{{ capabilities.gstack-review.cmd }}`

(If a `⚠️ ... not installed` warning was printed by `harnessed setup`, the backing
capability is missing on disk. Install it (`claude plugin install <name>` for
plugins, or follow the official install instructions for user-skills — e.g. for
gstack: `git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack` then
`cd ~/.claude/skills/gstack && ./setup`), then re-run `harnessed setup` to re-render
this SKILL.md and clear the warning.)

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡强制
- ~/.claude/CLAUDE.md "gstack 治理关卡 🔒 关键模块 PR 前强制" verbatim
- workflows/capabilities.yaml — gstack-review
- workflows/judgments/stage-routing.yaml — verify-paranoid-critical trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-paranoid.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 04-gstack-review-conditional sister verbatim
