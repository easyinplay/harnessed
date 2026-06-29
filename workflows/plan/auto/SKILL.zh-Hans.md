---
name: plan
description: |
  Stage ② Plan 主控编排器 — 串行 invoke 2 个子工作流（architecture 条件触发 → phase 始终触发）。
  复杂架构 gstack /plan-eng-review 锁定架构后再 GSD /gsd-plan-phase + planning-with-files 持久化
  task_plan.md。schema_version: harnessed.workflow.v3 with delegates_to (2 sub: architecture
  serial order 1 + phase serial order 2) + disciplines_applied (6 default) + tools_available
  (planning-with-files + plan-eng-review + gsd-plan-phase)。
  Triggered by slash command `/plan`
  (bare per ADR 0030 namespace policy D-02 LOCK) after `harnessed setup`.
trigger_phrases:
  - "plan"
  - "计划阶段"
  - "stage 2 plan"
  - "持久化计划"
  - "task_plan"
---

# plan 主控编排器 (v3)

## 概述

4-stage cadence Stage ② 主控编排器，委派给 2 个串行子工作流
（打包的 Plan 阶段节奏 + D-06 planning-with-files 横切工具）：

| order | sub | gate ref | mode | when fires |
| ----- | --- | -------- | ---- | ---------- |
| 1 | `architecture` | `judgments.stage-routing.plan-architecture-delegate.fires` | serial | phase.is_complex_architecture == true |
| 2 | `phase` | (unconditional — plan-phase always fires when stage=='plan') | serial | always |

引擎运行时通过 `runMasterOrchestrator` 按 T3.5.W0.1 顺序派发 2 个子工作流阶段：
order 1（architecture 条件触发）必须完成后，order 2 才启动
（phase 无条件，GSD plan-phase + planning-with-files `/plan` task_plan.md 持久化）。
K9 invariant 强制：每个 serial mode 委派必须携带显式 `order`。

## 能力引用

Sister `workflows/capabilities.yaml`：
- `planning-with-files` — Bucket 4 核心 capability (impl: claude-code-plugin, cmd: /plan)
- `plan-eng-review` — Bucket 7 gstack 33 optional (impl: gstack, cmd: /plan-eng-review)
- `gsd-plan-phase` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-plan-phase)
- sub `architecture` upstream → `plan-eng-review`
- sub `phase` upstream → `gsd-plan-phase` + `planning-with-files`

## 路由规则（sister CLAUDE.md "Plan 阶段"）

- **复杂架构必须先跑** `/plan-eng-review` 锁定架构后再进入 plan-phase (sister CLAUDE.md "⚠️")
- 普通 phase 跳过 architecture sub（gate `phase.is_complex_architecture == false`）
- **禁止在规划阶段直接使用** `superpowers:writing-plans` 输出大文档（除非用户明确要求）

## 调用方式

- Slash command：`/plan <text>`（bare per ADR 0030 namespace policy D-02 LOCK，`harnessed setup` 后生效）

## 如何调用

下面这套编号序列**就是** state machine —— 逐步用 Bash 执行。**不要**从上方 Overview 自行演绎一套
等价流程:freestyle 会旁路引擎(无 per-sub ledger、无 evidence guard、无 recovery)。harnessed 是
编排大脑(`harnessed gates` 决定哪些 sub fire,`harnessed prompt` 给出每个 spawn-ready prompt,
`harnessed checkpoint` 记录 ledger);**你**(主 session)用 CC-native Task / Agent 工具做 spawn。

**不要** pipe 到 `harnessed run plan` —— 那是 CI/headless 路径(in-process SDK spawn,会阻塞
session、绕过 Agent Teams,在 Claude Code 内部调用时会挂死)。

1. 若 "$ARGUMENTS" 触发澄清判据(≥2 方案 / 核心算法 / API contract / 高错误成本),先在**本 session** 交互澄清(AskUserQuestion)并锁决策;否则透明 skip。产出 locked spec。
2. Bash: `harnessed gates plan --task "<locked spec>" --skip-sub clarify` → 解析 JSON `{fire, skip, parallelism}`。这是 plan SoT(不 spawn)。保留 verbatim JSON。
3. Bash: `harnessed checkpoint start plan --plan '<step 2 的 verbatim gates JSON>'` → seed per-sub ledger,让 `harnessed status --recover` 能在 compaction 后给你重新定位。
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

## 参考文档

- D-01 主控编排器委派模式
- D-02 bare slash cmd 约定（ADR 0030 namespace policy LOCK）
- D-06 planning-with-files 横切工具（NOT 独立 sub-workflow）
- workflows/judgments/stage-routing.yaml — plan-{architecture,phase}-delegate triggers
- workflows/plan/{architecture,phase}/workflow.yaml — 2 sub-workflow Phase 3.4 SHIPPED
