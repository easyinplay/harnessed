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
