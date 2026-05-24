---
name: verify-simplify
description: |
  Stage ④.g verify sub-workflow — code-simplifier 末尾串行 (移除重复 / 多余逻辑,
  sister ~/.claude/CLAUDE.md "Verify 阶段 — 末尾 code-simplifier" verbatim)。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (code-simplifier) + 1 phase (gate ref is_final_step 末尾串行)。
  Triggered by harnessed CLI `harnessed verify-simplify --phase <num>` or slash command
  `/verify-simplify` after `harnessed setup`.
trigger_phrases:
  - "verify simplify"
  - "code simplify"
  - "代码简化"
  - "移除重复逻辑"
  - "跑 verify-simplify"
---

# verify-simplify workflow (v3)

## Overview

1-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — 末尾 code-simplifier" onto harnessed
runtime (Phase v3.0-3.4 W0.13d — D-04 Stage ④ Verify 7 sub + Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-simplify` | mattpocock-skills | sonnet | `{{ capabilities.code-simplifier.cmd }}` | `judgments.stage-routing.verify-simplify-tail.fires` |

Per-phase config loads from `workflows/verify/simplify/workflow.yaml`; engine 4-level gate
resolver evaluates `phase.is_final_step == true` via expr-eval — true 则 invoke
`/code-simplifier` (移除重复 / 多余逻辑), false 则 skip。verify 链末尾步骤,
sister verify-work v2 phase 08-code-simplifier verbatim 位置。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `code-simplifier` — Bucket 1 mattpocock 高频招式 (impl: mattpocock-skills,
  cmd: /code-simplifier, fires_when: stage=='verify' AND is_final_step)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-simplify-tail.fires` — `phase.stage == 'verify' and phase.is_final_step == true`

## Routing rules

- ✅ **触发**: verify chain 末尾步骤 (所有其他 verify sub 已 ship, 准备 code 简化收尾)
- ❌ **跳过**: verify chain 中间步骤 (避免过早简化干扰后续 review)

## CLI invocation

```bash
# Dry-run preview — arbitrate-only, never spawns SDK.
harnessed verify-simplify --phase <num> --dry-run --non-interactive

# Apply path — real SDK spawn (gate eval true 时).
harnessed verify-simplify --phase <num> --apply
```

## How to invoke

Use the SlashCommand tool to run: `{{ capabilities.code-simplifier.cmd }}`

(If a `⚠️ ... not installed` warning was printed by `harnessed setup`, the backing
capability is missing on disk. Install it (`claude plugin install <name>` for
plugins, or follow the official install instructions for user-skills — e.g. for
gstack: `git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack` then
`cd ~/.claude/skills/gstack && ./setup`), then re-run `harnessed setup` to re-render
this SKILL.md and clear the warning.)

## References

- D-04 Stage ④ Verify 7 sub 分解
- ~/.claude/CLAUDE.md "Verify 阶段 — 末尾 code-simplifier" verbatim
- workflows/capabilities.yaml — code-simplifier
- workflows/judgments/stage-routing.yaml — verify-simplify-tail trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-simplify.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 08-code-simplifier sister verbatim
