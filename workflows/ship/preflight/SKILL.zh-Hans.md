---
name: ship-preflight
description: |
  Stage ⑤.a Ship 子工作流 — 发布前置门控。运行 `harnessed release-preflight`
  （只读检查：CHANGELOG [Unreleased] 非空 + 版本号 + git 工作区干净 + tag 不存在）。
  任一检查失败则阻断发布流程。此处不会推送/发布/打 tag。
trigger_phrases:
  - "release preflight"
  - "release ready"
  - "ship preflight"
  - "发布就绪检查"
---

# ship-preflight (Stage ⑤.a)

## Overview

可机器化验证的「PR 就绪 ≠ 发布就绪」关卡。运行 harnessed 原生命令
`harnessed release-preflight`，以只读方式检查仓库是否具备打 tag 发布的条件：

| 检查项 | 通过条件 |
| ----- | ----------- |
| `changelog` | `## [Unreleased]` 下有实质性内容（本次发布已有文档） |
| `version` | `package.json` 包含有效的 semver 版本号 |
| `git-clean` | 工作区无未提交的改动 |
| `tag-absent` | `v<version>` tag 尚不存在 |

## Process

1. 运行 `harnessed release-preflight`。
2. 若任意检查失败，立即 STOP——展示 `fix:` 提示，不得继续推进至 PR/打 tag 环节。
   - `[Unreleased]` 为空是最常见的失败原因：请先完善发布文档。
3. 全部通过后，仓库达到 **tag-ready** 状态。ship master 继续执行 PR/部署流程。

## Boundary

此关卡为只读操作，不会推送、发布或创建 tag。实际的 `npm publish` + GitHub release
在显式用户批准后，由 `publish.yml` CI 在推送 `v<version>` tag 时触发。

## 如何调用

!`harnessed checkpoint intent ship-preflight`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run ship-preflight` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt ship-preflight --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,改用原生 goal gate(Claude Code 2.1.139+ / Codex):`/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"`,随后 spawn subagent,由 goal 评估器驱动重 spawn 直到目标清除。若 `/goal` 也不可用,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。goal 只在叶子 subtask 层设置 — `/goal` 每 session 单槽,嵌套 goal 会覆盖外层。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete ship-preflight --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。

<!-- harnessed-generated:v4.9.3 -->
