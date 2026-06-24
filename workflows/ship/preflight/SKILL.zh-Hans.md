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
