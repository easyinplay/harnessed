---
name: verify-simplify
description: |
  Stage ④.g 验证子工作流 — code-simplifier 末尾串行 (移除重复 / 多余逻辑;
  捆绑 verify 阶段节奏 — tail-step code-simplifier).
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (code-simplifier) + 1 phase (gate ref is_final_step 末尾串行)。
  Triggered by slash command
  `/verify-simplify` after `harnessed setup`.
trigger_phrases:
  - "verify simplify"
  - "code simplify"
  - "代码简化"
  - "移除重复逻辑"
  - "跑 verify-simplify"
---

# verify-simplify workflow (v3)

## 概览

1-phase 子工作流，将 CLAUDE.md "Verify 阶段 — 末尾 code-simplifier" 映射到 harnessed
运行时 (Phase v3.0-3.4 W0.13d — D-04 Stage ④ Verify 7 sub + Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-simplify` | mattpocock-skills | sonnet | `{{ capabilities.code-simplifier.cmd }}` | `judgments.stage-routing.verify-simplify-tail.fires` |

Per-phase 配置从 `workflows/verify/simplify/workflow.yaml` 加载；引擎 4-level gate
resolver 通过 expr-eval 计算 `phase.is_final_step == true` — true 则调用
`/code-simplifier` (移除重复 / 多余逻辑)，false 则跳过。verify 链末尾步骤，
sister verify-work v2 phase 08-code-simplifier verbatim 位置。

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `code-simplifier` — Bucket 1 mattpocock 高频招式 (impl: mattpocock-skills,
  cmd: /code-simplifier, fires_when: stage=='verify' AND is_final_step)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`：
- `verify-simplify-tail.fires` — `phase.stage == 'verify' and phase.is_final_step == true`

## 路由规则

- ✅ **触发**: verify chain 末尾步骤 (所有其他 verify sub 已 ship，准备 code 简化收尾)
- ❌ **跳过**: verify chain 中间步骤 (避免过早简化干扰后续 review)

## 如何调用

CC-native 编排。**不要** pipe 到 `harnessed run verify-simplify` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/verify-simplify` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/verify-simplify.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/verify-simplify.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- workflows/capabilities.yaml — code-simplifier
- workflows/judgments/stage-routing.yaml — verify-simplify-tail trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-simplify.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 08-code-simplifier sister verbatim
