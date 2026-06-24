---
name: verify-design
description: |
  Stage ④.f verify 子工作流 — gstack /design-review 设计系统一致性 + AI 审美问题识别
  (has_design_changes 触发, 可选 conditional; bundled verify-stage optional /design-review step).
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-design-review + ui-ux-pro-max + frontend-design) + 1 phase (gate ref has_design_changes
  conditional)。Triggered by harnessed CLI `harnessed verify-design --phase <num>` or slash
  command `/verify-design` after `harnessed setup`.
trigger_phrases:
  - "verify design"
  - "设计审查"
  - "design review"
  - "gstack design review"
  - "跑 verify-design"
---

# verify-design 工作流 (v3)

## 概览

1-phase 子工作流，将 CLAUDE.md「Verify 阶段 — 可选 /design-review」映射到 harnessed
运行时（Phase v3.0-3.4 W0.13c — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 +
Pattern A sub-workflow ship）。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-design-review` | gstack | sonnet | `{{ capabilities.gstack-design-review.cmd }}` | `judgments.stage-routing.verify-design-changes.fires` |

Per-phase 配置从 `workflows/verify/design/workflow.yaml` 加载；引擎 4-level gate
resolver 通过 expr-eval 计算 `phase.has_design_changes == true` — 为 true 则调用 gstack
`/design-review`（设计系统一致性 + AI 审美问题识别），为 false 则跳过。

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `gstack-design-review` — Bucket 3 治理关卡 (impl: gstack, cmd: /design-review,
  fires_when: has_design_changes)
- `ui-ux-pro-max` — Bucket 2 special-purpose (impl: gstack, 默认主方案 数据驱动)
- `frontend-design` — Bucket 2 special-purpose (impl: gstack, UI 创意 / 装饰补充)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`：
- `verify-design-changes.fires` — `phase.stage == 'verify' and phase.has_design_changes == true`

## 路由规则（bundled web-design routing — `workflows/judgments/web-design-routing.yaml`）

- 默认主方案 → `ui-ux-pro-max`（数据驱动、标准化、可解释）
- 创意补充 / 不要 AI 味 → `frontend-design`
- 用户明示「独特 / 不要 AI 感」→ frontend-design 主导，否则 ui-ux-pro-max 优先

## 调用方式

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run verify-design --task-stdin
```

若 `$ARGUMENTS` 为空，运行 `harnessed run verify-design`（不带 stdin pipe）。

执行完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一阶段操作。是否继续调用，请根据对话上下文自行判断——该提示仅供参考，并非强制指令。

<!-- harnessed-generated:v3.4.4 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- workflows/judgments/web-design-routing.yaml — ui-ux-pro-max 默认 + frontend-design 补充
- workflows/capabilities.yaml — gstack-design-review / ui-ux-pro-max / frontend-design
- workflows/judgments/stage-routing.yaml — verify-design-changes trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 07-design-review-conditional sister verbatim
