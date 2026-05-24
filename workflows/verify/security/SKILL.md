---
name: verify-security
description: |
  Stage ④.e verify sub-workflow — gstack /cso 安全审查 OWASP/auth/secrets (has_auth_or_secrets
  触发, 可选 conditional, sister ~/.claude/CLAUDE.md "Verify 阶段 — 可选 /cso" verbatim)。
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

## Overview

1-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — 可选 /cso" onto harnessed runtime
(Phase v3.0-3.4 W0.13b — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 + Pattern A
sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-cso` | gstack | opus | `{{ capabilities.gstack-cso.cmd }}` | `judgments.stage-routing.verify-security-secrets.fires` |

Per-phase config loads from `workflows/verify/security/workflow.yaml`; engine 4-level gate
resolver evaluates `phase.has_auth_or_secrets == true` via expr-eval — true 则 invoke gstack
`/cso` (OWASP / auth / credentials / secrets 全面审查), false 则 skip。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gstack-cso` — Bucket 3 治理关卡 (impl: gstack, cmd: /cso,
  fires_when: phase.stage == 'verify' AND phase.has_auth_or_secrets == true)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-security-secrets.fires` — `phase.stage == 'verify' and phase.has_auth_or_secrets == true`

## Routing rules

- ✅ **触发**: auth flow / session / credentials / API keys / SQL injection 路径 / OWASP top 10 area
- ❌ **跳过**: docs / 纯 UI styling / 内部 refactor / non-security PR

## How to invoke

Use the Bash tool to run:

```bash
echo "$ARGUMENTS" | harnessed run verify-security --task-stdin
```

If `$ARGUMENTS` is empty, run `harnessed run verify-security` (no stdin pipe).

After completion, the Bash output prints a `Next:` hint on stderr suggesting the next stage. Decide whether to invoke based on conversation context — the hint is informational, not prescriptive.

<!-- harnessed-generated:v3.4.4 -->

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- ~/.claude/CLAUDE.md "Verify 阶段 — 可选 /cso" verbatim
- workflows/capabilities.yaml — gstack-cso
- workflows/judgments/stage-routing.yaml — verify-security-secrets trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 06-cso-conditional sister verbatim
