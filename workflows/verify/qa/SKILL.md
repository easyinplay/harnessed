---
name: verify-qa
description: |
  Stage ④.d verify sub-workflow — gstack /qa 端到端 QA 验收 (has_ui_changes 触发, 可选 conditional,
  sister ~/.claude/CLAUDE.md "Verify 阶段 — 可选 /qa" verbatim)。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-qa + playwright-cli + playwright-test + webapp-testing) + 1 phase (gate ref
  has_ui_changes conditional)。
  Triggered by harnessed CLI `harnessed verify-qa --phase <num>` or slash command
  `/verify-qa` after `harnessed setup`.
trigger_phrases:
  - "verify qa"
  - "端到端 QA"
  - "E2E 验收"
  - "gstack qa"
  - "跑 verify-qa"
---

# verify-qa workflow (v3)

## Overview

1-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — 可选 /qa" onto harnessed runtime
(Phase v3.0-3.4 W0.13a — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 + Pattern A
sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-qa` | gstack | sonnet | `{{ capabilities.gstack-qa.cmd }}` | `judgments.stage-routing.verify-qa-ui.fires` |

Per-phase config loads from `workflows/verify/qa/workflow.yaml`; engine 4-level gate resolver
evaluates `phase.has_ui_changes == true` via expr-eval — true 则 invoke gstack `/qa` (端到端
QA 验收 + UI dogfood), false 则 skip。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gstack-qa` — Bucket 3 治理关卡 (impl: gstack, cmd: /qa, fires_when: has_ui_changes)
- `playwright-cli` — Bucket 2 special-purpose (impl: npm-cli, browser_probe)
- `playwright-test` — Bucket 2 special-purpose (impl: npm-cli, e2e_test typescript)
- `webapp-testing` — Bucket 2 special-purpose (impl: gstack, e2e_test python)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-qa-ui.fires` — `phase.stage == 'verify' and phase.has_ui_changes == true`

## Routing rules (sister ~/.claude/rules/web-testing.md)

- 写测试 提交 repo / CI 跑 → `@playwright/test` (默认 frontend/e2e/*.spec.ts)
- 探查 / 调试 / 一次性确认 → `playwright-cli` (token 最省)
- setup 需 Python 后端 (Tortoise ORM / pandas) → `webapp-testing` skill
- 性能 / a11y / 内存诊断 → 不在此 sub-workflow,用 `chrome-devtools-mcp`

## CLI invocation

```bash
# Dry-run preview — arbitrate-only, never spawns SDK.
harnessed verify-qa --phase <num> --dry-run --non-interactive

# Apply path — real SDK spawn (gate eval true 时).
harnessed verify-qa --phase <num> --apply
```

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- ~/.claude/CLAUDE.md "Verify 阶段 — 可选 /qa" verbatim
- ~/.claude/rules/web-testing.md — 三层职责矩阵 (脑 / 手 / 筋骨)
- workflows/capabilities.yaml — gstack-qa / playwright-cli / playwright-test / webapp-testing
- workflows/judgments/stage-routing.yaml — verify-qa-ui trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 05-qa-conditional sister verbatim
