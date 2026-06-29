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

下面这套编号序列**就是** state machine —— 逐步用 Bash 执行。**不要**从上方 Overview 自行演绎一套
等价流程:freestyle 会旁路引擎(无 per-sub ledger、无 evidence guard、无 recovery)。harnessed 是
编排大脑(`harnessed gates` 决定哪些 sub fire,`harnessed prompt` 给出每个 spawn-ready prompt,
`harnessed checkpoint` 记录 ledger);**你**(主 session)用 CC-native Task / Agent 工具做 spawn。

**不要** pipe 到 `harnessed run verify` —— 那是 CI/headless 路径(in-process SDK spawn,会阻塞
session、绕过 Agent Teams,在 Claude Code 内部调用时会挂死)。

1. 若 "$ARGUMENTS" 触发澄清判据(≥2 方案 / 核心算法 / API contract / 高错误成本),先在**本 session** 交互澄清(AskUserQuestion)并锁决策;否则透明 skip。产出 locked spec。
2. Bash: `harnessed gates verify --task "<locked spec>" --skip-sub clarify` → 解析 JSON `{fire, skip, parallelism}`。这是 plan SoT(不 spawn)。保留 verbatim JSON。
3. Bash: `harnessed checkpoint start verify --plan '<step 2 的 verbatim gates JSON>'` → seed per-sub ledger,让 `harnessed status --recover` 能在 compaction 后给你重新定位。
4. 若 `parallelism.escalate_to_teams === true`:读 `~/.claude/rules/agent-teams.md`,然后把 fired subs 作为 Agent Team 驱动(`TeamCreate` → 每个 sub `Agent(name, team_name, …)` + 其 `harnessed prompt <sub>` prompt → 用 `SendMessage` 协调 → `SendMessage shutdown_request` + `TeamDelete`)。每个 sub 仍按下方 checkpoint(`complete` / `fail`)。
5. 否则,对 `order` 里每个 fired sub(serial 串行、parallel 并发):
   - **若该项 `is_master: true`**(本身是 stage master —— 如 `/auto` fire `plan`/`task`/`verify`):**不要**直接 prompt+spawn。RECURSE:跑该 master 自己的 `harnessed gates <sub> --task "<spec>" --skip-sub clarify` → `harnessed checkpoint start <sub> --plan '<json>'` → 对它的 fired subs 重复本循环。
   - **否则(leaf sub):**
     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → 解析 `{prompt, max_iterations, model}`。
     b. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。
     c. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn 同一 sub。
     d. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete <sub> --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它,或仅在刻意覆盖时传 `--force`。
     e. 若 sub 无法达到 COMPLETE(max_iterations 耗尽 / 不可恢复错误):Bash `harnessed checkpoint fail <sub> --summary "<why>"`,然后 STOP 并向用户报告。
6. 所有 fired subs `done`(或记录 `failed`)后,Bash `harnessed status --recover` 确认 ledger,并向用户报告 per-sub fired/skipped/done/failed 摘要。

**若丢失上下文(compaction / resume):** 先跑 `harnessed status --recover` —— 它读 ledger 并打印「你在这里,下一步是什么」,让你从第一个 `pending` sub 续跑而非重启。若 ledger 为空,重跑 step 2-3。

<!-- harnessed-generated:v4.9.3 -->

## 参考资料

- D-01 主控编排器委托模式
- D-02 裸斜杠命令约定（ADR 0030 命名空间规范 LOCK）
- D-12 gstack 治理关卡引用（paranoid / qa / security / design subs）
- workflows/judgments/parallelism-gate.yaml — Pattern C 多维度审查（multispec sub 4-specialist 互相质询）
- workflows/judgments/stage-routing.yaml — verify-* 6 触发器（7 sub 委托）
- workflows/verify/{progress,code-review,paranoid,qa,security,design,simplify,multispec}/workflow.yaml
  — 8 个子工作流 Phase 3.4 SHIPPED
