---
name: verify-progress
description: |
  Stage ④.a verify 子工作流 — gsd-verify-work + gsd-progress 必跑串行（verify-work 起点）
  + planning-with-files progress.md 持久化（bundled verify-stage cadence — mandatory serial:
  gsd-verify-work UAT-driven acceptance + gsd-progress 状态同步，顺序不可调换）。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gsd-verify-work + gsd-progress + planning-with-files) + 3 phases (serial 01→02 + persist
  progress.md sink)。Triggered by harnessed CLI `harnessed verify-progress --phase <num>` or
  slash command `/verify-progress` after `harnessed setup`.
trigger_phrases:
  - "verify progress"
  - "进度同步"
  - "gsd verify work"
  - "ROADMAP 状态同步"
  - "跑 verify-progress"
---

# verify-progress 工作流 (v3)

## 概览

3-phase 子工作流，将 CLAUDE.md「Verify 阶段 — 必跑串行」起点映射到 harnessed 运行时
（Phase v3.0-3.4 W0.10 — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 ref + Pattern A
sub-workflow ship）。

| phase | id | upstream | model | capability / invokes | mode / artifacts |
| ----- | -- | -------- | ----- | -------------------- | ---------------- |
| 1 | `01-gsd-verify-work` | gsd | sonnet | `{{ capabilities.gsd-verify-work.cmd }}` | serial — UAT-driven acceptance |
| 2 | `02-gsd-progress` | gsd | haiku | `{{ capabilities.gsd-progress.cmd }}` | serial — ROADMAP/STATE/REQUIREMENTS 同步 |
| 3 | `03-progress-update` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` + `invokes: /plan` | `artifacts_expected: [progress.md]` |

Per-phase 配置从 `workflows/verify/progress/workflow.yaml` 加载；引擎通过 `@anthropic-ai/claude-agent-sdk` 0.3.142+ 以串行模式将每个 phase 作为子 agent 启动（顺序锁定 —
gsd-verify-work UAT 必先于 gsd-progress 状态同步）。

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `gsd-verify-work` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-verify-work)
- `gsd-progress` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-progress)
- `planning-with-files` — Bucket 4 核心 capability (impl: claude-code-plugin, cmd: /plan)

## 路由规则（sister CLAUDE.md「Verify 阶段」）

总 fire 当 `phase.stage == 'verify'`（sister `workflows/judgments/stage-routing.yaml`
verify-progress-always trigger）。无 skip 条件 — verify-work 起点必跑。

## 如何调用

!`harnessed checkpoint intent verify-progress`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-progress` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt verify-progress --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,然后用 harnessed 自己的完成闸门驱动交付:
   - subagent 返回后,把它的最终输出写入文件,跑 `harnessed checkpoint complete verify-progress --result-file <path>` —— 该命令对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
   - 若被拦下,跑 `harnessed checkpoint fail verify-progress --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
   - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:把 subagent 最终输出写入文件,再 Bash `harnessed checkpoint complete verify-progress --result-file <path> --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。`--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
5. 若 complete 闸门拦下:Bash `harnessed checkpoint fail verify-progress --failing-tests <n>` 记录本次尝试。命中停机条件时会打印 `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。

<!-- harnessed-generated:v4.12.0 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡 ref（verify-paranoid 后续 sub）
- workflows/capabilities.yaml — gsd-verify-work / gsd-progress / planning-with-files
- workflows/judgments/stage-routing.yaml — verify-progress-always trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-progress.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 01-02 sister verbatim pattern
