---
name: task
description: |
  Stage ③ Task 主控编排器 — 串行 invoke 4 sub per subtask (clarify → code → test → deliver)。
  completion gate (harnessed 自有 checkpoint CLI) 在 deliver phase 内 (D-10 orthogonal wrapper)。tdd-gate conditional
  fire on test sub。schema_version: harnessed.workflow.v3 with delegates_to (4 sub: clarify order 1
  conditional + code order 2 + test order 3 conditional + deliver order 4) + disciplines_applied
  (6 default) + tools_available (8 entry: superpowers-brainstorming + tdd + grill-with-docs +
  improve-codebase-architecture + diagnose + completion-gate + planning-with-files)。
  Triggered by slash command `/task`
  (bare per ADR 0030 namespace policy D-02 LOCK) after `harnessed setup`.
trigger_phrases:
  - "task"
  - "子任务执行"
  - "stage 3 execute"
  - "completion gate"
  - "执行子任务"
---

# task 主控编排器 (v3)

## Overview

4-stage cadence Stage ③ 主控编排器，针对每个 subtask 依次委托给 4 个串行子工作流
（捆绑 Execute-stage cadence + karpathy 心法 always-on）：

| order | sub | gate ref | mode | 触发条件 |
| ----- | --- | -------- | ---- | ---------- |
| 1 | `clarify` | `judgments.subtask-gate.brainstorming.fires` | serial | approaches ≥ 2 / core_algorithm / has_api_contract / error_cost=high |
| 2 | `code` | （无条件 — karpathy 心法 always-on + mattpocock conditional route） | serial | 始终触发 |
| 3 | `test` | `judgments.tdd-gate.tdd-strongly-suggested.fires` | serial | 核心业务 / 算法 / 数据处理 / 回归 risk / reliability (6 fires_when OR-chain) |
| 4 | `deliver` | （无条件 — completion gate COMPLETE wrapper） | serial | 始终触发 |

Engine runtime 通过 `runMasterOrchestrator` 按顺序 spawn 4 个子工作流阶段
（依照 T3.5.W0.1：clarify → code → test → deliver）。K9 invariant 强制执行：每个 serial
mode delegate 必须携带显式 `order`。每个 subtask 入口走一次此主控编排器。

## 完成闸门正交 wrapper (D-10)

完成闸门是正交 wrapper, 套在 deliver sub 的 01-deliver phase 外层保 completion-promise
verbatim "COMPLETE" (R20.10)。任何执行单元 (subagent / team / 主 session) 都可外层套它
保 completion-promise (bundled subagent vs Agent Teams routing — orthogonal wrapper rule).

它是 harnessed 自有的 CLI,不是上游 plugin (ADR 0039,4.36.0 摘除 `/ralph-loop` 依赖):
`harnessed checkpoint complete <sub> --result-file <path>` 对产物 / TDD boundary / verbatim
`<promise>COMPLETE</promise>` 三重 fail-closed;被拦下时 `harnessed checkpoint fail <sub>
--failing-tests <n>` 记录尝试并在命中停机条件时打印 BUDGET-EXHAUSTED / NO-PROGRESS /
BREAK-LOOP。**仅当**三者都未触发才允许重 spawn;任一触发即停。

## Capability refs

Sister `workflows/capabilities.yaml`:
- `superpowers-brainstorming` — Bucket 4 核心 capability (sub clarify upstream)
- `tdd` — Bucket 4 核心 capability TDD red-green-refactor (sub test upstream)
- `grill-with-docs` — Bucket 1 mattpocock conditional invoke (clarify)
- `improve-codebase-architecture` — Bucket 1 mattpocock conditional invoke (code, architecture_health_audit)
- `diagnose` — Bucket 1 mattpocock conditional invoke (code/test, bug_root_cause_unknown / test_fail)
- `completion-gate` — Bucket 4 核心 capability orthogonal wrapper (deliver;harnessed 自有 `harnessed checkpoint complete` / `fail`,无上游 plugin)
- `planning-with-files` — Bucket 4 核心 capability (code + deliver progress.md update)

## Invocation

- Slash command: `/task <text>` (bare per ADR 0030 namespace policy D-02 LOCK after `harnessed setup`)

## 如何调用

!`harnessed checkpoint intent task`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:下方 step 2-3 完成 ledger seed 前,每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 逐步用 Bash 执行。**不要**从上方 Overview 自行演绎一套
等价流程:freestyle 会旁路引擎(无 per-sub ledger、无 evidence guard、无 recovery)。harnessed 是
编排大脑(`harnessed gates` 决定哪些 sub fire,`harnessed prompt` 给出每个 spawn-ready prompt,
`harnessed checkpoint` 记录 ledger);**你**(主 session)用 CC-native Task / Agent 工具做 spawn。

**不要** pipe 到 `harnessed run task` —— 那是 CI/headless 路径(in-process SDK spawn,会阻塞
session、绕过 Agent Teams,在 Claude Code 内部调用时会挂死)。

1. 若 "$ARGUMENTS" 触发澄清判据(≥2 方案 / 核心算法 / API contract / 高错误成本),先在**本 session** 交互澄清(AskUserQuestion)并锁决策;否则透明 skip。产出 locked spec。
1b. Bash: `harnessed facts task --out .harnessed-facts.json` → 它只列出**本阶段 gate 真正读取**的 fact:能确定性推导的已填好(改动行数 / 触及文件数 / stage,来自 git),判断题留 `null` 并附一行说明。编辑该文件,把 `facts` 里每个 `null` 按 locked spec 换成你的真实判断 —— 只有确实无法判断时才留 null(此时回退内置默认值)。**不要**跳过本步,也**不要**自行编造命令没问的 fact。
2. Bash: `harnessed gates task --task "<locked spec>" --context-file .harnessed-facts.json --skip-sub discuss` → 解析 JSON `{fire, skip, parallelism}`。这是 plan SoT(不 spawn)。保留 verbatim JSON。
3. Bash: `harnessed checkpoint start task --plan '<step 2 的 verbatim gates JSON>'` → seed per-sub ledger,让 `harnessed status --recover` 能在 compaction 后给你重新定位。
4. 若 `parallelism.escalate_to_teams === true`:读 `~/.claude/rules/agent-teams.md`,然后把 fired subs 作为 Agent Team 驱动。**没有建团步骤、也没有建团工具** —— 对每个 fired sub 用 `Agent(name: <sub>, run_in_background: true, prompt: <该 sub 的 `harnessed prompt <sub>` prompt>)` spawn 一个后台 teammate,团在**第一个** spawn 时隐式形成,本 session 即 lead(`team_name` 入参被接受但忽略 —— 团名由 session 派生)。用 `SendMessage` 协调;某个 sub 完成后,**按名**请求该 teammate 关闭(例如「ask the verify-qa teammate to shut down」)。每个 sub 仍按下方 checkpoint(`complete` / `fail`)。
5. 否则,对 `order` 里每个 fired sub(serial 串行、parallel 并发):
   - **若该项 `is_master: true`**(本身是 stage master —— 如 `/auto` fire `plan`/`task`/`verify`):**不要**直接 prompt+spawn。RECURSE:跑该 master 自己的 `harnessed facts <sub> --out .harnessed-facts.json`(填完 null)→ `harnessed gates <sub> --task "<spec>" --context-file .harnessed-facts.json --skip-sub discuss` → `harnessed checkpoint start <sub> --plan '<json>'` → 对它的 fired subs 重复本循环。
   - **否则(leaf sub):**
     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → 解析 `{prompt, max_iterations, model}`。
     b. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,然后用 harnessed 自己的完成闸门驱动交付:
        - subagent 返回后,把它的最终输出写入文件,跑 `harnessed checkpoint complete <sub> --result-file <path>` —— 该命令对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
        - 若被拦下,跑 `harnessed checkpoint fail <sub> --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
        - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
     c. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn 同一 sub。
     d. 命中 `<promise>COMPLETE</promise>`:把 subagent 最终输出写入文件,再 Bash `harnessed checkpoint complete <sub> --result-file <path> --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。exit 非零即表示该 sub **未** done —— 重 spawn 补齐,或仅在刻意覆盖时传 `--force`(记录 `evidence_status=overridden`,是可审计的覆盖而非静默放行)。
     e. 若 complete 闸门拦下:Bash `harnessed checkpoint fail <sub> --failing-tests <n>` 记录本次尝试(该 sub 无测试时省略该 flag —— 回退用证据产物摘要作进展度量)。命中停机条件时它会打印 `BUDGET-EXHAUSTED`(已用尝试次数 vs `workflows/defaults.yaml ralph_max_iterations`)、`NO-PROGRESS`(连续 N 次无进展)或 `BREAK-LOOP`(该 sub 失败次数达阈值)。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛范围、修掉阻塞点或上报用户,并说明情况。
6. 所有 fired subs `done`(或记录 `failed`)后,Bash `harnessed status --recover` 确认 ledger,并向用户报告 per-sub fired/skipped/done/failed 摘要。

**若丢失上下文(compaction / resume):** 先跑 `harnessed status --recover` —— 它读 ledger 并打印「你在这里,下一步是什么」,让你从第一个 `pending` sub 续跑而非重启。若 ledger 为空,重跑 step 2-3。

<!-- harnessed-generated:v4.12.0 -->

## References

- D-01 master orchestrator delegation pattern
- D-02 bare slash cmd convention (ADR 0030 namespace policy LOCK)
- D-10 completion gate orthogonal wrapper (ADR 0039 — 内置化后摘除上游 `/ralph-loop`)
- workflows/judgments/{subtask-gate,tdd-gate}.yaml — brainstorming + tdd-strongly-suggested triggers
- workflows/task/{clarify,code,test,deliver}/workflow.yaml — 4 sub-workflow Phase 3.4 SHIPPED
