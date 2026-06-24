---
name: verify-paranoid
description: |
  Stage ④.c verify 子工作流 — gstack /review Paranoid Staff Engineer 关键模块 PR 前强制
  (bundled gstack governance gate — mandatory before critical-module PR)。Gate:
  judgments.stage-routing.verify-paranoid-critical.fires (phase.is_critical_module == true) —
  默认 critical fire only；非关键模块 skip。
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

# verify-paranoid 工作流 (v3)

## 概览

1-phase 子工作流，将 CLAUDE.md「gstack 治理关卡 🔒 关键模块 PR 前强制 — `/review`」
映射到 harnessed 运行时（Phase v3.0-3.4 W0.12 — D-04 Stage ④ Verify 7 sub + D-12 gstack
治理关卡 + Pattern A sub-workflow ship）。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-review` | gstack | opus | `{{ capabilities.gstack-review.cmd }}` | `judgments.stage-routing.verify-paranoid-critical.fires` |

Per-phase 配置从 `workflows/verify/paranoid/workflow.yaml` 加载；引擎 4-level gate
resolver 通过 expr-eval 计算 `phase.is_critical_module == true` — 为 true 则调用 gstack
`/review`，为 false 则跳过（chain_isolation 3 铁律 R20.16 sister verify-work v2 phase 04）。

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `gstack-review` — Bucket 3 治理关卡 (impl: gstack, cmd: /review,
  fires_when: phase.is_critical_module == true)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`：
- `verify-paranoid-critical.fires` — `phase.stage == 'verify' and phase.is_critical_module == true`
  （默认 critical fire only；普通 PR 应跳过 — gstack-review 是 Paranoid Staff Engineer 重武器）

## 路由规则（sister CLAUDE.md「gstack 治理关卡」）

- ✅ **触发**：关键模块 PR 前（auth / payment / data migration / core algorithm 等）
- ❌ **跳过**：常规 PR / docs / config / 非核心 module

## 调用方式

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run verify-paranoid --task-stdin
```

若 `$ARGUMENTS` 为空，运行 `harnessed run verify-paranoid`（不带 stdin pipe）。

执行完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一阶段操作。是否继续调用，请根据对话上下文自行判断——该提示仅供参考，并非强制指令。

<!-- harnessed-generated:v3.4.4 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡强制
- workflows/capabilities.yaml — gstack-review
- workflows/judgments/stage-routing.yaml — verify-paranoid-critical trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-paranoid.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 04-gstack-review-conditional sister verbatim
