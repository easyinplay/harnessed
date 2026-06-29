---
name: ship
description: |
  Stage ⑤ Ship 主控编排器 — Verify 之后的发布阶段。ship-preflight
  必跑串行（release-readiness 关卡）→ 委派 PR/deploy 给 gstack /ship → publish 留
  publish.yml CI（tag push 触发）。schema_version: harnessed.workflow.v3 with delegates_to
  (1 sub: preflight serial order 1) + disciplines_applied (6 default) + tools_available
  (release-preflight + ship + planning-with-files)。Triggered by `/ship` (bare per ADR 0030)
  or `harnessed ship` after `harnessed verify`. Deploy boundary = TAG-READY (no push/publish/tag).
trigger_phrases:
  - "ship"
  - "发布阶段"
  - "stage 5 ship"
  - "release stage"
  - "send it"
---

# ship 主控编排器 (v3) — Stage ⑤

## 概述

第 5 个阶段，位于 Verify 之后。harnessed 已具备各个环节（release-preflight 关卡、gstack
`/ship`、`publish.yml` CI）——此主控编排器将它们串联成一条可重复执行的发布路径，
就像 comet（archive）、Trellis（finish-work）和 Claude-Harness（`/harness-release`）
各自闭环的方式一样。

| order/mode | sub | when fires |
| ---------- | --- | ---------- |
| 1 (serial) | `preflight` | always when stage=='ship' — read-only release-readiness gate |

preflight 通过后，主控将 PR + deploy 委派给 gstack `/ship`（组合复用——harnessed 不重新实现），
实际的 `npm publish` + GitHub release 在 tag push 时由 `publish.yml` CI 执行。

## 流程

1. **preflight（始终执行）** — 运行 `harnessed release-preflight`。若任何检查失败（最常见的是
   `## [Unreleased]` 为空），立即 STOP，先补充 release 文档 / 清理工作树。
2. **PR / deploy（委派）** — 调用 gstack `/ship` 完成 PR 创建 + 合并前审查。
3. **publish（CI）** — 推送 `v<version>` tag（需用户明确批准）→ `publish.yml`
   执行 `npm publish` + 创建 GitHub release。

## 边界（重要）

此阶段止步于 **tag-ready**。它不会自行推送到远端、不会发布到 npm、也不会创建 git tag。
这些操作属于 CI + 显式批准动作，是有意为之——"PR ready != release ready"，
"release ready != already published"。

## 如何调用

下面这套编号序列**就是** state machine —— 逐步用 Bash 执行。**不要**从上方 Overview 自行演绎一套
等价流程:freestyle 会旁路引擎(无 per-sub ledger、无 evidence guard、无 recovery)。harnessed 是
编排大脑(`harnessed gates` 决定哪些 sub fire,`harnessed prompt` 给出每个 spawn-ready prompt,
`harnessed checkpoint` 记录 ledger);**你**(主 session)用 CC-native Task / Agent 工具做 spawn。

**不要** pipe 到 `harnessed run ship` —— 那是 CI/headless 路径(in-process SDK spawn,会阻塞
session、绕过 Agent Teams,在 Claude Code 内部调用时会挂死)。

1. 若 "$ARGUMENTS" 触发澄清判据(≥2 方案 / 核心算法 / API contract / 高错误成本),先在**本 session** 交互澄清(AskUserQuestion)并锁决策;否则透明 skip。产出 locked spec。
2. Bash: `harnessed gates ship --task "<locked spec>" --skip-sub clarify` → 解析 JSON `{fire, skip, parallelism}`。这是 plan SoT(不 spawn)。保留 verbatim JSON。
3. Bash: `harnessed checkpoint start ship --plan '<step 2 的 verbatim gates JSON>'` → seed per-sub ledger,让 `harnessed status --recover` 能在 compaction 后给你重新定位。
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
