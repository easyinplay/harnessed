---
name: harnessed-update
description: |
  预览、确认并执行确定性 harnessed 更新。如实展示 partial,
  只有在第二次确认后才提供有边界的 agent repair。
trigger_phrases:
  - "harnessed update"
  - "update harnessed"
  - "更新 harnessed"
---

# harnessed-update

## 概述

为确定性 self-update、harnessed 自有资产刷新及已安装第三方组件的经审查更新,
提供统一交互入口。CLI 是结果的唯一依据,不得由 agent 解读安装日志后自行判定成功。

## 执行流程

1. 运行 `harnessed update --all --dry-run --json` 获取只读 preview。
   分别保留 stdout、stderr 与 exit code。即使 exit 非零,也读取 stdout 中唯一的
   JSON 对象;stderr 是诊断,不是结果数据。验证 `schemaVersion=1`、
   `operation=update`、`mode`、`host` 和 `runtime`。JSON 缺失、格式错误、`error`
   或 failed 预览组件均 STOP。含 `unsupported` 的 preview 仍为 partial,必须展示限制。
2. 展示计划变更,通过 {{ host.ask_user }} 获得明确确认。
   取消、沉默或无法确认均 STOP,不得修改。被委派且尚无授权的 subagent 必须返回
   `STATUS: NEEDS_CLARIFICATION`,由主 session 询问用户。
3. 确认后仅运行一次 `harnessed update --all --json`。P1 self-update 与经验证的
   absolute-path P2 continuation 均由 CLI 管理;不得自行启动 continuation,
   不得在被替换的 runtime 中刷新资产。
4. 展示 `status`、`components`、`warnings` 和 `error`。逐组件展示 `id`、`status`、
   `before`、`target`、`after`、`reasonCode`、`verified` 与 `restartRequired`。
   未知版本保留 `null`,不得推断为 `current`。
5. `unsupported` 与 `retained` 表示 `partial`,不是全部成功。`unsupported` 没有经审查的
   更新路径。`retained` 表示刷新失败但旧安装仍通过验证,不是已更新。
   `not-installed` 表示保持缺失,不是已安装或已更新。保留 CLI 的顶层结果。
6. 任一 `restartRequired=true` 均 STOP,要求用户重启 {{ host.native }} 后再进行其他
   workflow 工作,即使更新已经完成也不能继续旧 session。
    `handoff-failed`、`invalid-continuation`、`error` 或 exit 非零均 STOP。
    failed 或 partial 组件不代表成功:保留结果与诊断,然后只能继续第 7 步的有边界
    repair proposal。

7. 如果应用结果包含 `failed`、`unsupported` 或 `retained` 的已审查第三方组件,
   在任何 repair 前展示第二份 repair proposal。明确说明 harnessed 编排上游开源组件,
   repair 可能读取安装状态、执行上游安装器或验证命令、修改列出的 skill/plugin/host
   目标,并启动选定的宿主 agent。明确说明它不会授予 plugin 或 MCP trust、读取凭据、
   扩大 host root,也不会触碰列表之外的组件。
8. 要求用户确认 proposal 中的精确组件 id。确认后只运行一次:
   `harnessed update --all --repair --yes --json`。
   `--yes` 只代表本次有边界的 repair 已获得明确授权,不是未来永久授权。用户拒绝、无法确认,
   或 non-interactive 且没有 `--yes` 时,不得调用 agent,保留确定性 `partial` 或 `failed` 结果。
9. `agentRepair.status=completed` 只能作为过程状态。CLI 必须在重新运行确定性 verifier 后报告
   `agentRepair.verified=true`;否则报告 `verification-failed` 或 `failed`。不得根据 agent 回复
   改写原组件结果或声称整体成功。

## 边界

Phase 79 提供有边界的 repair 路径。没有第二次明确确认不得启动 agent repair。不得安装缺失的第三方组件、从 manifest 推断更新
命令、读取凭据、授予 trust、改写所有权或切换 host root。repair runner 只允许处理精确的已
审查组件列表,并且必须以确定性 verifier 的结果结束。

上述 STOP 规则优先于下方通用 invoke loop:对于 partial、failed 或 restart 阻塞结果,
不得 respawn、重试确定性更新、使用 `checkpoint --force` 或宣称 COMPLETE。partial 或
failed 结果唯一允许的下一步是第 7 步的二次确认 repair;否则报告证据并将控制权交还用户。
只有经验证的 `complete` 且无需 restart 时才能完成 workflow;
preview 的 `planned` 不代表已执行更新。

## 如何调用

!`harnessed checkpoint intent harnessed-update`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
{{ host.native }} {{ host.spawn_subagent.zh_tool }} spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run harnessed-update` —— 那是 CI/headless 路径({{ host.harnessed_run_warning_note.execution_tail }}

1. Bash: `harnessed prompt harnessed-update --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 {{ host.native }} subagent({{ host.spawn_subagent.zh_tool }})以该 `prompt` + `model` spawn,然后用 harnessed 自己的完成闸门驱动交付:
   - subagent 返回后,把它的最终输出写入文件,跑 `harnessed checkpoint complete harnessed-update --result-file <path>` —— 该命令对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
   - 若被拦下,跑 `harnessed checkpoint fail harnessed-update --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
   - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 {{ host.ask_user }} 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:把 subagent 最终输出写入文件,再 Bash `harnessed checkpoint complete harnessed-update --result-file <path> --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。`--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
5. 若 complete 闸门拦下:Bash `harnessed checkpoint fail harnessed-update --failing-tests <n>` 记录本次尝试。命中停机条件时会打印 `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。

<!-- harnessed-generated:v4.12.0 -->
