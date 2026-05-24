---
name: verify
description: |
  Stage ④ Verify master orchestrator — 7 sub conditional per bundled Verify-stage cadence:
  progress 必跑 → code-review 并行 → paranoid 关键模块强制 → qa/security/design 可选
  并行 conditional → simplify 末尾 → multispec 关键发布 Pattern C 4-specialist Agent Team。
  schema_version: harnessed.workflow.v3 with delegates_to (7 sub: progress serial order 1 +
  5 parallel conditional + simplify serial order 99) + disciplines_applied (6 default) +
  tools_available (10 entry)。Triggered by harnessed CLI `harnessed verify --phase <num>` or
  slash command `/verify` (bare per ADR 0030 namespace policy D-02 LOCK) after `harnessed setup`.
trigger_phrases:
  - "verify"
  - "验证阶段"
  - "stage 4 verify"
  - "verify work"
  - "代码审查 + 简化"
---

# verify master orchestrator (v3)

## Overview

4-stage cadence Stage ④ master orchestrator delegating to 7 sub-workflows
(bundled Verify-stage cadence — 9-phase composition compressed into 7 sub delegation
via stage-routing.yaml):

| order/mode | sub | gate ref | mode | when fires |
| ---------- | --- | -------- | ---- | ---------- |
| 1 (serial) | `progress` | (unconditional — verify 起点) | serial | always when stage=='verify' |
| parallel | `code-review` | (unconditional — multi-agent fan-out) | parallel | always |
| parallel | `paranoid` | `judgments.stage-routing.verify-paranoid-critical.fires` | parallel | phase.is_critical_module == true |
| parallel | `qa` | `judgments.stage-routing.verify-qa-ui.fires` | parallel | phase.has_ui_changes == true |
| parallel | `security` | `judgments.stage-routing.verify-security-secrets.fires` | parallel | phase.has_auth_or_secrets == true |
| parallel | `design` | `judgments.stage-routing.verify-design-changes.fires` | parallel | phase.has_design_changes == true |
| parallel | `multispec` | `judgments.stage-routing.verify-multispec-critical-release.fires` | parallel | is_critical_release == true (Pattern C 4-specialist Agent Team) |
| 99 (serial) | `simplify` | (unconditional — 末尾 tail) | serial | always — code-simplifier 末尾移除重复 / 多余逻辑 |

Engine runtime per T3.5.W0.1 `runMasterOrchestrator`:
- **serial chain**: progress (order 1) 起点 → ... → simplify (order 99) 末尾收尾
- **parallel fan-out**: 5 conditional sub (code-review + paranoid + qa + security + design + multispec)
  spawn 并发, 按 gate-eval 结果 fire-or-skip
- K9 invariant enforced: every serial mode delegate carries explicit `order`

## Verify cadence (sister CLAUDE.md "Verify 阶段" verbatim)

1. 子任务完成后立即 `/gsd-verify-work` + `/gsd-progress` (sub progress 起点必跑串行)
2. 项目 / 大功能整体完成后:
   - 先 `code-review` 多 Agent 并行 (sub code-review)
   - **关键模块强制** `/review` Paranoid Staff Engineer (sub paranoid, gate is_critical_module)
   - 可选 `/qa` (sub qa, gate has_ui_changes) / `/cso` (sub security, gate has_auth_or_secrets) / `/design-review` (sub design, gate has_design_changes)
   - **关键发布 / 大重构 PR** 升级 4-specialist Agent Team Pattern C (sub multispec, gate critical-release-upgrade)
   - 再 `code-simplifier` 末尾 (sub simplify, serial order 99)

## Capability refs

Sister `workflows/capabilities.yaml`:
- `gsd-verify-work` + `gsd-progress` — Bucket 2 (progress sub upstream)
- `code-review` + `code-simplifier` — Bucket 1 mattpocock (code-review + simplify subs)
- `gstack-review` + `gstack-qa` + `gstack-cso` + `gstack-design-review` — Bucket 3 治理关卡 (paranoid/qa/security/design subs)
- `agent-teams-create` — Bucket 5 agent-platform (multispec Pattern C 4-specialist team)
- `planning-with-files` — Bucket 4 核心 (progress.md sink throughout)

## Invocation

- Slash command: `/verify` (bare per ADR 0030 namespace policy D-02 LOCK after `harnessed setup`)

## How to invoke

Use the Bash tool to run:

```bash
echo "$ARGUMENTS" | harnessed run verify --task-stdin
```

If `$ARGUMENTS` is empty, run `harnessed run verify` (no stdin pipe).

After completion, the Bash output prints a `Next:` hint on stderr suggesting the next stage. Decide whether to invoke based on conversation context — the hint is informational, not prescriptive.

<!-- harnessed-generated:v3.4.4 -->

## References

- D-01 master orchestrator delegation pattern
- D-02 bare slash cmd convention (ADR 0030 namespace policy LOCK)
- D-12 gstack 治理关卡 ref (paranoid / qa / security / design subs)
- workflows/judgments/parallelism-gate.yaml — Pattern C 多维度审查 (multispec sub 4-specialist 互相质询)
- workflows/judgments/stage-routing.yaml — verify-* 6 triggers (7 sub delegation)
- workflows/verify/{progress,code-review,paranoid,qa,security,design,simplify,multispec}/workflow.yaml
  — 8 sub-workflow Phase 3.4 SHIPPED
