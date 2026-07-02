---
name: auto
description: |
  超级主控编排器 — 一行命令跑完整 6-stage 功能开发流 (research conditional →
  discuss → plan → task → verify → retro mandatory), 适合 trivial / well-defined feature OR 你
  想 hands-off。每 stage 内部仍 fan-out sub-workflow per 现有 stage-master orchestrator pattern。
  v3.2.0 强化:Phase 0 AI 1-shot complexity assessment + Phase 0.5 understanding check prompt
  + Phase 5 `/retro` mandatory。
  schema_version: harnessed.workflow.v3 with delegates_to (6 sub: research conditional order 0 +
  4 stage-master order 1-4 + retro mandatory order 5) + disciplines_applied (6 default)
  + tools_available (agent-teams-create + planning-with-files)。Fail-fast default; opt-in
  `--staged` flag 重现 stage gate UX (每 stage 完停 user review)。
  Triggered by slash command `/auto` (bare per ADR 0030 namespace policy D-02 LOCK)
  after `harnessed setup`.
trigger_phrases:
  - "auto"
  - "自动跑完"
  - "完整流程"
  - "一键开发"
  - "auto chain"
  - "super master"
---

# auto 超级主控编排器 (v3.2.0 增强版)

## 概述

v3.2.0 新增 — 6-stage 节奏 (research conditional → discuss → plan → task → verify → retro
mandatory), sister 四个 stage-master `/discuss /plan /task /verify` 仍可独立调用；
`/auto` 是可选的一行命令 chain。

| order | sub | gate ref | mode | when fires |
| ----- | --- | -------- | ---- | ---------- |
| 0 | `research` | `judgments.stage-routing.auto-research-unclear.fires` | serial | user_understanding_unclear == true (Phase 0.5 prompt n) |
| 1 | `discuss` | (unconditional — 4-stage chain 起点) | serial | always |
| 2 | `plan` | (unconditional — stage 2) | serial | always |
| 3 | `task` | (unconditional — stage 3) | serial | always |
| 4 | `verify` | (unconditional — stage 4 收尾) | serial | always |
| 5 | `retro` | (unconditional — auto mode mandatory) | serial | always |

引擎运行时通过 `runMasterOrchestrator` 依次 spawn 6 个子工作流 yaml，遵循
T3.5.W0.1 — 递归单层抽象 (super-master → stage-master OR standalone → sub-workflow):

- 顶层调用 `/auto` → 加载 `workflows/auto/workflow.yaml` → runAutoPreFlight hook
- pre-flight Phase 0: `assessComplexity(taskDescription)` → small/medium 自动 continue；
  large → 提示用户切 `--staged` (y) OR abort 建议手动 (n)
- pre-flight Phase 0.5: `promptUserUnderstanding()` → y 跳过 research；n 设置
  `user_understanding_unclear = true` 进 ctx → research 关卡触发
- spawn order 0: `workflows/research/workflow.yaml` (if gate fires)
- spawn order 1-4: 4 个 stage-master `workflows/<sub>/auto/workflow.yaml`
- spawn order 5: `workflows/retro/workflow.yaml` (mandatory unconditional)

K8 ctx single snapshot：auto 顶层调用 1 个 snapshot，传递给全部 6 个 spawn
(sister Phase 3.5 W0.1 pattern verbatim，1 snapshot per top-level invoke 跨整个 cycle)。

## 默认行为

- **Pre-flight 关卡**: complexity assessment + understanding check (交互式提示)
- **连续 chain**: 6 个 stage 一行命令跑完，中间不停
- **Fail-fast**: 任一 stage 失败立即停止，`harnessed resume` 续跑
- **Context 自动传递**: planning-with-files `.planning/<phase>/` 喂给下游 stage
- **Retro mandatory**: auto mode hands-off 场景，末尾强制 `/retro` 总结 (无 opt-out flag)
- **沿用 sister planning-with-files /plan 持久化 cadence**

## 可选 flag

- `--staged` opt-in: 每个 stage-master 跑完后停止，等用户 review/confirm 后跑下一个 stage (stage gate UX)

## 何时用 `/auto` vs 4 个 stage-master 手动

✅ **触发 `/auto`**:
- Trivial / well-defined feature (e.g. CRUD endpoint + standard pattern)
- Hands-off 场景 (你想"跑完再回来看")
- 跨 stage decision 都明显 (无 open question)
- AI 自动判断需求复杂度 small/medium → 直接 continue；large → 自动建议 `--staged`

❌ **跳过 `/auto` → 分阶段手动 `/discuss` → `/plan` → `/task` → `/verify`**:
- 关键发布 / 大重构 (需 stage gate 审查)
- 跨 stage 有 open implementation decisions
- 你想在 stage 之间做 hands-on 审查
- 不确定整体方向 (此时手动 `/discuss` 强 grill)
- AI complexity gate 判定 large 且用户不切 `--staged` → 建议 abort 手动

## Capability refs

Sister `workflows/capabilities.yaml`:
- `agent-teams-create` — Bucket 5 agent-platform (verify 阶段 multispec Pattern C 4-specialist team，当 critical-release-upgrade 关卡触发时)
- `planning-with-files` — Bucket 4 核心能力 (持久化 task_plan.md + progress.md
  跨 6 个 stage 自动传递 context)
- Downstream sub refs:
  - sub `research` upstream → `workflows/research/workflow.yaml` (standalone)
  - sub `discuss` upstream → `workflows/discuss/auto/workflow.yaml` (stage-master)
  - sub `plan` upstream → `workflows/plan/auto/workflow.yaml` (stage-master)
  - sub `task` upstream → `workflows/task/auto/workflow.yaml` (stage-master)
  - sub `verify` upstream → `workflows/verify/auto/workflow.yaml` (stage-master)
  - sub `retro` upstream → `workflows/retro/workflow.yaml` (standalone)

## 调用方式

- Slash command: `/auto <feature description>` (bare per ADR 0030 namespace policy D-02 LOCK
  after `harnessed setup`)
- 4 个 stage-master `/discuss /plan /task /verify` 仍可独立调用 — `/auto` 是可选的新工作流
- `--staged` opt-in 启用 stage gate UX (每 stage 跑完后停止等用户 review)

## 如何调用

下面这套编号序列**就是** state machine —— 逐步用 Bash 执行。**不要**从上方 Overview 自行演绎一套
等价流程:freestyle 会旁路引擎(无 per-sub ledger、无 evidence guard、无 recovery)。harnessed 是
编排大脑(`harnessed gates` 决定哪些 sub fire,`harnessed prompt` 给出每个 spawn-ready prompt,
`harnessed checkpoint` 记录 ledger);**你**(主 session)用 CC-native Task / Agent 工具做 spawn。

**不要** pipe 到 `harnessed run auto` —— 那是 CI/headless 路径(in-process SDK spawn,会阻塞
session、绕过 Agent Teams,在 Claude Code 内部调用时会挂死)。

1. 先在**本 session** 交互式跑 discuss 阶段(spawned subagent 无法向用户提问):对 "$ARGUMENTS" 评估 strategic / phase / subtask 澄清判据,对每个 fire 的层用 AskUserQuestion 与用户对话锁决策,其余透明 skip。产出 locked spec。
2. Bash: `harnessed gates auto --task "<locked spec>" --skip-sub clarify` → 解析 JSON `{fire, skip, parallelism}`。这是 plan SoT(不 spawn)。保留 verbatim JSON。
3. Bash: `harnessed checkpoint start auto --plan '<step 2 的 verbatim gates JSON>'` → seed per-sub ledger,让 `harnessed status --recover` 能在 compaction 后给你重新定位。
4. 若 `parallelism.escalate_to_teams === true`:读 `~/.claude/rules/agent-teams.md`,然后把 fired subs 作为 Agent Team 驱动(`TeamCreate` → 每个 sub `Agent(name, team_name, …)` + 其 `harnessed prompt <sub>` prompt → 用 `SendMessage` 协调 → `SendMessage shutdown_request` + `TeamDelete`)。每个 sub 仍按下方 checkpoint(`complete` / `fail`)。
5. 否则,对 `order` 里每个 fired sub(serial 串行、parallel 并发):
   - **若该项 `is_master: true`**(本身是 stage master —— 如 `/auto` fire `plan`/`task`/`verify`):**不要**直接 prompt+spawn。RECURSE:跑该 master 自己的 `harnessed gates <sub> --task "<spec>" --skip-sub clarify` → `harnessed checkpoint start <sub> --plan '<json>'` → 对它的 fired subs 重复本循环。
   - **否则(leaf sub):**
     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → 解析 `{prompt, max_iterations, model}`。
     b. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,改用原生 goal gate(Claude Code 2.1.139+ / Codex):`/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"`,随后 spawn subagent,由 goal 评估器驱动重 spawn 直到目标清除。若 `/goal` 也不可用,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。goal 只在叶子 subtask 层设置 — `/goal` 每 session 单槽,嵌套 goal 会覆盖外层。
     c. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn 同一 sub。
     d. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete <sub> --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它,或仅在刻意覆盖时传 `--force`。
     e. 若 sub 无法达到 COMPLETE(max_iterations 耗尽 / 不可恢复错误):Bash `harnessed checkpoint fail <sub> --summary "<why>"`,然后 STOP 并向用户报告。
6. 所有 fired subs `done`(或记录 `failed`)后,Bash `harnessed status --recover` 确认 ledger,并向用户报告 per-sub fired/skipped/done/failed 摘要。 然后跑 `retro` 阶段沉淀 lessons。

**若丢失上下文(compaction / resume):** 先跑 `harnessed status --recover` —— 它读 ledger 并打印「你在这里,下一步是什么」,让你从第一个 `pending` sub 续跑而非重启。若 ledger 为空,重跑 step 2-3。

<!-- harnessed-generated:v4.9.3 -->

## 参考文档

- D-01 master orchestrator 委托模式
- D-02 bare slash cmd 约定 (ADR 0030 namespace policy LOCK)
- D-13 declarative SoT (delegates_to[] 声明 + engine 消费)
- workflows/{research,retro}/workflow.yaml — 2 个 standalone (research conditional + retro mandatory)
- workflows/{discuss,plan,task,verify}/auto/workflow.yaml — 4 个 stage-master Phase 3.5 SHIPPED
- workflows/judgments/stage-routing.yaml — auto-research-unclear trigger (v3.2.0 新增)
- src/workflow/masterOrchestrator.ts — 'auto' literal + recursive spawn + runAutoPreFlight hook
- CHANGELOG [3.2.0] — complexity gate + research/retro flow + `--staged` rename
