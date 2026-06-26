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

## 如何调用

CC-native 编排。**不要** pipe 到 `harnessed run verify-paranoid` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/verify-paranoid` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/verify-paranoid.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/verify-paranoid.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡强制
- workflows/capabilities.yaml — gstack-review
- workflows/judgments/stage-routing.yaml — verify-paranoid-critical trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-paranoid.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 04-gstack-review-conditional sister verbatim
