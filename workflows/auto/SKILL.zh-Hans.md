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

CC-native 编排。**不要** pipe 到 `harnessed run auto` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/auto` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/auto.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/auto.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->
