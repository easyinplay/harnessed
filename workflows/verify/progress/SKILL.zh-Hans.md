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

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-progress` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt verify-progress --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,改用原生 goal gate(Claude Code 2.1.139+ / Codex):`/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"`,随后 spawn subagent,由 goal 评估器驱动重 spawn 直到目标清除。若 `/goal` 也不可用,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。goal 只在叶子 subtask 层设置 — `/goal` 每 session 单槽,嵌套 goal 会覆盖外层。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete verify-progress --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。

<!-- harnessed-generated:v4.9.3 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡 ref（verify-paranoid 后续 sub）
- workflows/capabilities.yaml — gsd-verify-work / gsd-progress / planning-with-files
- workflows/judgments/stage-routing.yaml — verify-progress-always trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-progress.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 01-02 sister verbatim pattern
