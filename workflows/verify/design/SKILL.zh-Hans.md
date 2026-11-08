---
name: verify-design
description: |
  可选：改动涉及设计时，用 gstack /design-review 做设计系统一致性与 AI 审美审查。
trigger_phrases:
  - "verify design"
  - "设计审查"
  - "design review"
  - "gstack design review"
  - "跑 verify-design"
---

# verify-design 工作流 (v3)

## 概览

3-phase 子工作流，将 CLAUDE.md「Verify 阶段 — 可选 /design-review」映射到 harnessed
运行时（Phase v3.0-3.4 W0.13c — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 +
Pattern A sub-workflow ship；T2.3 两段式 remediation lane 接线）。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-design-review` | gstack | sonnet | `{{ capabilities.gstack-design-review.cmd }}` | `judgments.web-design-routing.design-review-post.fires` |
| 2 | `02-ui-ux-structure` | ui-ux-pro-max | sonnet | `{{ capabilities.ui-ux-pro-max.cmd }}` | `judgments.web-design-routing.ui-ux-pro-max-structure.fires` |
| 3 | `03-design-taste-polish` | design-taste-frontend | sonnet | `{{ capabilities.design-taste-frontend.cmd }}` | `judgments.web-design-routing.design-taste-polish.fires` |

Per-phase 配置从 `workflows/verify/design/workflow.yaml` 加载；引擎 4-level gate
resolver 通过 expr-eval 计算 `phase.has_design_changes == true` — 为 true 则调用 gstack
`/design-review`（设计系统一致性 + AI 审美问题识别），为 false 则跳过。Phase 02 / 03 是
review 出问题清单后的两段式 remediation lane（结构问题 → Stage 1；视觉打磨 / AI 味 → Stage 2），
各由 `phase.has_ui_changes == true` 独立 gate。

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `gstack-design-review` — Bucket 3 治理关卡 (impl: gstack, cmd: /design-review,
  fires_when: has_design_changes)
- `ui-ux-pro-max` — Bucket 2 special-purpose (Stage 1 结构骨架, 数据驱动)
- `design-taste-frontend` — Bucket 2 special-purpose (Stage 2 视觉打磨叠加, anti-slop cross-agent)

## Gate ref

Sister `workflows/judgments/web-design-routing.yaml`：
- `design-review-post.fires` — `phase.stage == 'verify' and phase.has_design_changes == true`
- `ui-ux-pro-max-structure.fires` — `phase.has_ui_changes == true`
- `design-taste-polish.fires` — `phase.has_ui_changes == true`

`workflows/verify/auto/workflow.yaml` 的 `delegates_to` 也 gate 在
`design-review-post.fires` 上 —— 之前那条逐字等价的 `stage-routing.verify-design-changes`
副本已删,一个判据一个家。

## 路由规则（bundled web-design routing — `workflows/judgments/web-design-routing.yaml`）

- 两段式叠加（非仲裁）：Stage 1 `ui-ux-pro-max` 理清受众/交互逻辑/设计主轴（结构骨架，始终先跑）
- Stage 2 `design-taste-frontend` 在结构之上叠加细节 + 视觉打磨 → 高级感（anti-slop，默认凡 UI 改动都叠加）
- 设计完成后可选 gstack `/design-review` 一致性 + AI 审美问题识别

## 如何调用

!`harnessed checkpoint intent verify-design`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
{{ host.native }} {{ host.spawn_subagent.zh_tool }} spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-design` —— 那是 CI/headless 路径({{ host.harnessed_run_warning_note.execution_tail }}

1. Bash: `harnessed prompt verify-design --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model, result_file}`。
2. 用 {{ host.native }} subagent({{ host.spawn_subagent.zh_tool }})以该 `prompt` + `model` spawn。sub 自己把最终结果写入 `result_file`(prompt 里给出的那个路径)—— **完成信号是文件**,不是聊天消息:后台 / 被 re-parent 的 agent 消息可能永不到达,不要等它。然后用 harnessed 自己的完成闸门驱动交付:
   - 闸门是 `harnessed checkpoint complete verify-design --result-file <result_file> --wait 60` —— 单次调用最多等 60 秒,sub 需要更久就重复**同一条**命令;它对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
   - 若被拦下,跑 `harnessed checkpoint fail verify-design --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
   - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
3. 若 sub 的输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表(从 `result_file` 读 —— 聊天消息可能永不到达):STOP,用 {{ host.ask_user }} 原样转达,把答案 append 进 spec,再重 spawn。
4. 当 `result_file` 携带完成标记时:Bash `harnessed checkpoint complete verify-design --result-file <result_file> --wait 60 --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果文件含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--wait 60` 只约束**单次**调用为 60 秒 —— sub 需要更久就重复**同一条**命令,绝不无限等待。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。`result-wait-timeout` 退出码表示 sub 尚未发出完成信号 —— 重复同一条命令;`--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
5. 若 complete 闸门拦下:Bash `harnessed checkpoint fail verify-design --failing-tests <n>` 记录本次尝试。命中停机条件时会打印 `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。

<!-- harnessed-generated:v4.13.0 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- workflows/judgments/web-design-routing.yaml — 两段式 ui-ux-pro-max 结构 → design-taste-frontend 打磨
- workflows/capabilities.yaml — gstack-design-review / ui-ux-pro-max / design-taste-frontend
- workflows/verify/auto/workflow.yaml — `design` delegate gate = 同一个 design-review-post trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 07-design-review-conditional sister verbatim
