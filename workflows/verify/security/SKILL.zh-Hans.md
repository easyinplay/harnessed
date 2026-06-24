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

## 调用方式

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run verify-security --task-stdin
```

若 `$ARGUMENTS` 为空，则运行 `harnessed run verify-security`（不接管道输入）。

完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一阶段。是否调用取决于对话上下文 — 该提示仅供参考，非强制指令。

<!-- harnessed-generated:v3.4.4 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- workflows/capabilities.yaml — gstack-cso
- workflows/judgments/stage-routing.yaml — verify-security-secrets trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 06-cso-conditional sister verbatim
