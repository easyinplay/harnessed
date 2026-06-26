---
name: verify-qa
description: |
  Stage ④.d 验证子工作流 — gstack /qa 端到端 QA 验收 (has_ui_changes 触发, 可选 conditional;
  捆绑 verify 阶段可选 /qa 步骤).
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-qa + playwright-cli + playwright-test + webapp-testing) + 1 phase (gate ref
  has_ui_changes conditional)。
  Triggered by slash command
  `/verify-qa` after `harnessed setup`.
trigger_phrases:
  - "verify qa"
  - "端到端 QA"
  - "E2E 验收"
  - "gstack qa"
  - "跑 verify-qa"
---

# verify-qa workflow (v3)

## 概览

1-phase 子工作流，将 CLAUDE.md "Verify 阶段 — 可选 /qa" 映射到 harnessed 运行时
(Phase v3.0-3.4 W0.13a — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 + Pattern A
sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-qa` | gstack | sonnet | `{{ capabilities.gstack-qa.cmd }}` | `judgments.stage-routing.verify-qa-ui.fires` |

Per-phase 配置从 `workflows/verify/qa/workflow.yaml` 加载；引擎 4-level gate resolver
通过 expr-eval 计算 `phase.has_ui_changes == true` — true 则调用 gstack `/qa` (端到端
QA 验收 + UI dogfood)，false 则跳过。

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `gstack-qa` — Bucket 3 治理关卡 (impl: gstack, cmd: /qa, fires_when: has_ui_changes)
- `playwright-cli` — Bucket 2 special-purpose (impl: npm-cli, browser_probe)
- `playwright-test` — Bucket 2 special-purpose (impl: npm-cli, e2e_test typescript)
- `webapp-testing` — Bucket 2 special-purpose (impl: gstack, e2e_test python)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`：
- `verify-qa-ui.fires` — `phase.stage == 'verify' and phase.has_ui_changes == true`

## 路由规则（捆绑 web-testing 路由 — `workflows/judgments/web-testing-routing.yaml`）

- 写测试 提交 repo / CI 跑 → `@playwright/test` (默认 frontend/e2e/*.spec.ts)
- 探查 / 调试 / 一次性确认 → `playwright-cli` (token 最省)
- setup 需 Python 后端 (Tortoise ORM / pandas) → `webapp-testing` skill
- 性能 / a11y / 内存诊断 → 不在此子工作流，用 `chrome-devtools-mcp`

## 如何调用

CC-native 编排。**不要** pipe 到 `harnessed run verify-qa` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/verify-qa` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/verify-qa.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/verify-qa.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- workflows/judgments/web-testing-routing.yaml — 三层职责矩阵 (脑 / 手 / 筋骨)
- workflows/capabilities.yaml — gstack-qa / playwright-cli / playwright-test / webapp-testing
- workflows/judgments/stage-routing.yaml — verify-qa-ui trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 05-qa-conditional sister verbatim
