---
name: verify-qa
description: |
  Stage ④.d 验证子工作流 — gstack /qa 端到端 QA 验收 (has_ui_changes 触发, 可选 conditional;
  捆绑 verify 阶段可选 /qa 步骤).
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-qa + browse + playwright-cli + playwright-test + webapp-testing + chrome-devtools-mcp)
  + 5 phase (01-qa gate ref has_ui_changes conditional + 4 条 web-testing-routing lane)。
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

5-phase 子工作流，将 CLAUDE.md "Verify 阶段 — 可选 /qa" 映射到 harnessed 运行时
(Phase v3.0-3.4 W0.13a — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 + Pattern A
sub-workflow ship；T2.3 三层职责矩阵 + 非功能性诊断 4 条 lane 接线)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-qa` | gstack | sonnet | `{{ capabilities.gstack-qa.cmd }}` | `judgments.stage-routing.verify-qa-ui.fires` |
| 2 | `02-e2e-ci` | playwright-test | sonnet | (upstream 驱动) | `judgments.web-testing-routing.playwright-test-default.fires` |
| 3 | `03-browser-probe` | gstack | sonnet | `{{ capabilities.browse.cmd }}` | `judgments.web-testing-routing.browse-probe.fires` |
| 4 | `04-python-backend-e2e` | gstack | sonnet | `{{ capabilities.webapp-testing.cmd }}` | `judgments.web-testing-routing.webapp-testing-python-backend.fires` |
| 5 | `05-perf-a11y-diagnostic` | chrome-devtools-mcp | sonnet | (upstream 驱动) | `judgments.web-testing-routing.chrome-devtools-mcp-diagnostic.fires` |

Per-phase 配置从 `workflows/verify/qa/workflow.yaml` 加载；引擎 4-level gate resolver
通过 expr-eval 计算 `phase.has_ui_changes == true` — true 则调用 gstack `/qa` (端到端
QA 验收 + UI dogfood)，false 则跳过。Phase 02-05 是三层职责矩阵 + 非功能性诊断的 4 条 lane，
由 `subtask.test_type` 单值互斥选择——无 test_type 信号时全部跳过（只跑 01-qa）。

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `gstack-qa` — Bucket 3 治理关卡 (impl: gstack, cmd: /qa, fires_when: has_ui_changes)
- `browse` — Bucket 2 special-purpose (impl: gstack user-skill, cmd: /browse——手层主导)
- `playwright-cli` — Bucket 2 special-purpose (impl: npm-cli, browser_probe——未装 gstack 时的降级)
- `playwright-test` — Bucket 2 special-purpose (impl: npm-cli, e2e_test typescript)
- `webapp-testing` — Bucket 2 special-purpose (impl: gstack, e2e_test python)
- `chrome-devtools-mcp` — Bucket 4 tool-mcp (impl: mcp, cmd: chrome-devtools——有 provider 时
  非功能性诊断必用；provider 二选一: ecc bonus tier 或 optional 自装 manifest，两者都缺则
  该 lane 不 fire，由 gate fact `chrome_devtools_available` 强制)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`：
- `verify-qa-ui.fires` — `phase.stage == 'verify' and phase.has_ui_changes == true`

Sister `workflows/judgments/web-testing-routing.yaml`（T2.3 — 4 条 lane 各接一个 gate）：
- `playwright-test-default.fires` → phase 02
- `browse-probe.fires` → phase 03
- `webapp-testing-python-backend.fires` → phase 04
- `chrome-devtools-mcp-diagnostic.fires` → phase 05

## 路由规则（捆绑 web-testing 路由 — `workflows/judgments/web-testing-routing.yaml`）

- 写测试 提交 repo / CI 跑 → `@playwright/test` (默认 frontend/e2e/*.spec.ts)——phase 02
- 探查 / 调试 / 一次性确认 → `/browse` 主导（token 高效，可复用 cookies 与会话状态）；
  未装 gstack 时降级 `playwright-cli`——phase 03
- setup 需 Python 后端 (Tortoise ORM / pandas) → `webapp-testing` skill——phase 04
- 性能 / a11y / 内存诊断 → **provider 在场时必用** `chrome-devtools-mcp`
  （NOT playwright/test/cli/webapp-testing）——phase 05。
  chrome-devtools 有两个 provider，且都是 optional：**ecc plugin** 或**自装的
  chrome-devtools-mcp server**。两者都缺时本 lane 的 gate
  （`chrome-devtools-mcp-diagnostic.fires` 含 `chrome_devtools_available == true`）
  为 false，phase 05 不 fire —— 不要去调一个不存在的工具，也不要用
  playwright / webapp-testing 顶替它做非功能性诊断。
  开启路径二选一（只装一个，双装会产生同名双前缀调用歧义）：
  `harnessed install ecc`，或 `claude mcp add chrome-devtools-mcp`。
  当前机器的实测值：`harnessed facts verify` 的 `derived.chrome_devtools_available`
  （`source` 字段写明原因与开启路径）；`harnessed doctor` 的 `ecc` check 同样会报。

## 如何调用

!`harnessed checkpoint intent verify-qa`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-qa` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt verify-qa --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,然后用 harnessed 自己的完成闸门驱动交付:
   - subagent 返回后,把它的最终输出写入文件,跑 `harnessed checkpoint complete verify-qa --result-file <path>` —— 该命令对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
   - 若被拦下,跑 `harnessed checkpoint fail verify-qa --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
   - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:把 subagent 最终输出写入文件,再 Bash `harnessed checkpoint complete verify-qa --result-file <path> --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。`--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
5. 若 complete 闸门拦下:Bash `harnessed checkpoint fail verify-qa --failing-tests <n>` 记录本次尝试。命中停机条件时会打印 `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。

<!-- harnessed-generated:v4.12.0 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- workflows/judgments/web-testing-routing.yaml — 三层职责矩阵 (脑 / 手 / 筋骨)
- workflows/capabilities.yaml — gstack-qa / browse / playwright-cli / playwright-test / webapp-testing / chrome-devtools-mcp
- workflows/judgments/stage-routing.yaml — verify-qa-ui trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 05-qa-conditional sister verbatim
