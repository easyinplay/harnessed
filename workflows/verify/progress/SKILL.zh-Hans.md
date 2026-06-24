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

## 调用方式

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run verify-progress --task-stdin
```

若 `$ARGUMENTS` 为空，运行 `harnessed run verify-progress`（不带 stdin pipe）。

执行完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一阶段操作。是否继续调用，请根据对话上下文自行判断——该提示仅供参考，并非强制指令。

<!-- harnessed-generated:v3.4.4 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡 ref（verify-paranoid 后续 sub）
- workflows/capabilities.yaml — gsd-verify-work / gsd-progress / planning-with-files
- workflows/judgments/stage-routing.yaml — verify-progress-always trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-progress.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 01-02 sister verbatim pattern
