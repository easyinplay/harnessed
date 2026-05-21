---
name: verify-progress
description: |
  Stage ④.a verify sub-workflow — gsd-verify-work + gsd-progress 必跑串行 (verify-work 起点)
  + planning-with-files progress.md 持久化 (sister ~/.claude/CLAUDE.md "Verify 阶段" verbatim
  必跑串行 — gsd-verify-work UAT-driven acceptance + gsd-progress 状态同步 顺序不可调换)。
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

# verify-progress workflow (v3)

## Overview

3-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — 必跑串行" 起点 onto harnessed runtime
(Phase v3.0-3.4 W0.10 — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 ref + Pattern A
sub-workflow ship)。

| phase | id | upstream | model | capability / invokes | mode / artifacts |
| ----- | -- | -------- | ----- | -------------------- | ---------------- |
| 1 | `01-gsd-verify-work` | gsd | sonnet | `{{ capabilities.gsd-verify-work.cmd }}` | serial — UAT-driven acceptance |
| 2 | `02-gsd-progress` | gsd | haiku | `{{ capabilities.gsd-progress.cmd }}` | serial — ROADMAP/STATE/REQUIREMENTS 同步 |
| 3 | `03-progress-update` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` + `invokes: /plan` | `artifacts_expected: [progress.md]` |

Per-phase config loads from `workflows/verify/progress/workflow.yaml`; engine spawns each
phase as a sub-agent via `@anthropic-ai/claude-agent-sdk` 0.3.142+ in serial mode (顺序锁定 —
gsd-verify-work UAT 必先于 gsd-progress 状态同步)。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gsd-verify-work` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-verify-work)
- `gsd-progress` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-progress)
- `planning-with-files` — Bucket 4 核心 capability (impl: claude-code-plugin, cmd: /plan)

## Routing rules (sister CLAUDE.md "Verify 阶段")

总 fire 当 `phase.stage == 'verify'` (sister `workflows/judgments/stage-routing.yaml`
verify-progress-always trigger)。无 skip 条件 — verify-work 起点必跑。

## CLI invocation

```bash
# Dry-run preview — arbitrate-only, never spawns SDK.
harnessed verify-progress --phase <num> --dry-run --non-interactive

# Apply path — real SDK spawn + 3-phase serial chain.
harnessed verify-progress --phase <num> --apply
```

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡 ref (verify-paranoid 后续 sub)
- ~/.claude/CLAUDE.md "Verify 阶段 — gsd-verify-work + gsd-progress 必跑串行" verbatim
- workflows/capabilities.yaml — gsd-verify-work / gsd-progress / planning-with-files
- workflows/judgments/stage-routing.yaml — verify-progress-always trigger
- workflows/defaults.yaml — ralph_max_iterations.verify-progress.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 01-02 sister verbatim pattern
