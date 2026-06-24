---
name: verify
description: |
  Stage ④ Verify 主控编排器 — 7 个条件子工作流，按打包的 Verify 阶段节奏执行：
  progress 必跑 → code-review 并行 → paranoid 关键模块强制 → qa/security/design 可选
  并行 conditional → simplify 末尾 → multispec 关键发布 Pattern C 4-specialist Agent Team。
  schema_version: harnessed.workflow.v3，含 delegates_to（7 sub：progress serial order 1 +
  5 parallel conditional + simplify serial order 99）+ disciplines_applied（6 default）+
  tools_available（10 entry）。通过 harnessed CLI `harnessed verify --phase <num>` 或
  `harnessed setup` 后的斜杠命令 `/verify`（裸命令，per ADR 0030 命名空间规范 D-02 LOCK）触发。
trigger_phrases:
  - "verify"
  - "验证阶段"
  - "stage 4 verify"
  - "verify work"
  - "代码审查 + 简化"
---

# verify 主控编排器（v3）

## 概述

4-stage 节奏 Stage ④ 主控编排器，委托给 7 个子工作流
（打包的 Verify 阶段节奏 — 9 阶段组合压缩为 7 个子委托
via stage-routing.yaml）：

| order/mode | sub | gate ref | mode | when fires |
| ---------- | --- | -------- | ---- | ---------- |
| 1 (serial) | `progress` | （无条件 — verify 起点） | serial | 当 stage=='verify' 时始终触发 |
| parallel | `code-review` | （无条件 — multi-agent fan-out） | parallel | 始终触发 |
| parallel | `paranoid` | `judgments.stage-routing.verify-paranoid-critical.fires` | parallel | phase.is_critical_module == true |
| parallel | `qa` | `judgments.stage-routing.verify-qa-ui.fires` | parallel | phase.has_ui_changes == true |
| parallel | `security` | `judgments.stage-routing.verify-security-secrets.fires` | parallel | phase.has_auth_or_secrets == true |
| parallel | `design` | `judgments.stage-routing.verify-design-changes.fires` | parallel | phase.has_design_changes == true |
| parallel | `multispec` | `judgments.stage-routing.verify-multispec-critical-release.fires` | parallel | is_critical_release == true（Pattern C 4-specialist Agent Team） |
| 99 (serial) | `simplify` | （无条件 — 末尾收尾） | serial | 始终触发 — code-simplifier 末尾移除重复 / 多余逻辑 |

引擎运行时 per T3.5.W0.1 `runMasterOrchestrator`：
- **串行链**：progress（order 1）起点 → ... → simplify（order 99）末尾收尾
- **并行 fan-out**：5 个条件子工作流（code-review + paranoid + qa + security + design + multispec）
  并发启动，按关卡求值结果决定触发或跳过
- K9 不变量强制执行：每个 serial 模式委托必须携带显式 `order`

## Verify 节奏（sister CLAUDE.md「Verify 阶段」原文）

1. 子任务完成后立即 `/gsd-verify-work` + `/gsd-progress`（sub progress 起点必跑串行）
2. 项目 / 大功能整体完成后：
   - 先 `code-review` 多 Agent 并行（sub code-review）
   - **关键模块强制** `/review` Paranoid Staff Engineer（sub paranoid，关卡 is_critical_module）
   - 可选 `/qa`（sub qa，关卡 has_ui_changes）/ `/cso`（sub security，关卡 has_auth_or_secrets）/ `/design-review`（sub design，关卡 has_design_changes）
   - **关键发布 / 大重构 PR** 升级 4-specialist Agent Team Pattern C（sub multispec，关卡 critical-release-upgrade）
   - 再 `code-simplifier` 末尾（sub simplify，serial order 99）

## 能力引用

Sister `workflows/capabilities.yaml`：
- `gsd-verify-work` + `gsd-progress` — Bucket 2（progress sub upstream）
- `code-review` + `code-simplifier` — Bucket 1 mattpocock（code-review + simplify subs）
- `gstack-review` + `gstack-qa` + `gstack-cso` + `gstack-design-review` — Bucket 3 治理关卡（paranoid/qa/security/design subs）
- `agent-teams-create` — Bucket 5 agent-platform（multispec Pattern C 4-specialist team）
- `planning-with-files` — Bucket 4 核心（progress.md sink throughout）

## 调用方式说明

- 斜杠命令：`/verify`（裸命令，per ADR 0030 命名空间规范 D-02 LOCK，在 `harnessed setup` 后使用）

## 如何调用

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run verify --task-stdin
```

若 `$ARGUMENTS` 为空，运行 `harnessed run verify`（不带 stdin pipe）。

执行完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一阶段操作。是否调用取决于对话上下文——该提示仅供参考，不具强制性。

<!-- harnessed-generated:v3.4.4 -->

## 参考资料

- D-01 主控编排器委托模式
- D-02 裸斜杠命令约定（ADR 0030 命名空间规范 LOCK）
- D-12 gstack 治理关卡引用（paranoid / qa / security / design subs）
- workflows/judgments/parallelism-gate.yaml — Pattern C 多维度审查（multispec sub 4-specialist 互相质询）
- workflows/judgments/stage-routing.yaml — verify-* 6 触发器（7 sub 委托）
- workflows/verify/{progress,code-review,paranoid,qa,security,design,simplify,multispec}/workflow.yaml
  — 8 个子工作流 Phase 3.4 SHIPPED
