---
name: verify-security
description: |
  Stage ④.e 验证子工作流 — gstack /cso 安全审查 OWASP/auth/secrets (has_auth_or_secrets
  触发, 可选 conditional; 捆绑 verify 阶段可选 /cso 步骤).
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-cso) + 1 phase (gate ref has_auth_or_secrets conditional)。
  Triggered by slash command
  `/verify-security` after `harnessed setup`.
trigger_phrases:
  - "verify security"
  - "安全审查"
  - "OWASP audit"
  - "gstack cso"
  - "跑 verify-security"
---

# verify-security workflow (v3)

## 概览

1-phase 子工作流，将 CLAUDE.md "Verify 阶段 — 可选 /cso" 映射到 harnessed 运行时
(Phase v3.0-3.4 W0.13b — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 + Pattern A
sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-cso` | gstack | opus | `{{ capabilities.gstack-cso.cmd }}` | `judgments.stage-routing.verify-security-secrets.fires` |

Per-phase 配置从 `workflows/verify/security/workflow.yaml` 加载；引擎 4-level gate
resolver 通过 expr-eval 计算 `phase.has_auth_or_secrets == true` — true 则调用 gstack
`/cso` (OWASP / auth / credentials / secrets 全面审查)，false 则跳过。

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `gstack-cso` — Bucket 3 治理关卡 (impl: gstack, cmd: /cso,
  fires_when: phase.stage == 'verify' AND phase.has_auth_or_secrets == true)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`：
- `verify-security-secrets.fires` — `phase.stage == 'verify' and phase.has_auth_or_secrets == true`

## 路由规则

- ✅ **触发**: auth flow / session / credentials / API keys / SQL injection 路径 / OWASP top 10 area
- ❌ **跳过**: docs / 纯 UI styling / 内部 refactor / non-security PR

## 如何调用

!`harnessed checkpoint intent verify-security`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-security` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt verify-security --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,然后用 harnessed 自己的完成闸门驱动交付:
   - subagent 返回后,把它的最终输出写入文件,跑 `harnessed checkpoint complete verify-security --result-file <path>` —— 该命令对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
   - 若被拦下,跑 `harnessed checkpoint fail verify-security --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
   - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:把 subagent 最终输出写入文件,再 Bash `harnessed checkpoint complete verify-security --result-file <path> --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。`--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
5. 若 complete 闸门拦下:Bash `harnessed checkpoint fail verify-security --failing-tests <n>` 记录本次尝试。命中停机条件时会打印 `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。

<!-- harnessed-generated:v4.12.0 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- workflows/capabilities.yaml — gstack-cso
- workflows/judgments/stage-routing.yaml — verify-security-secrets trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 06-cso-conditional sister verbatim
