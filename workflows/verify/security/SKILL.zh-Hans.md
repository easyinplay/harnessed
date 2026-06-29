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

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-security` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt verify-security --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,自循环:spawn → 检查 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete verify-security --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。

<!-- harnessed-generated:v4.9.3 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- workflows/capabilities.yaml — gstack-cso
- workflows/judgments/stage-routing.yaml — verify-security-secrets trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 06-cso-conditional sister verbatim
