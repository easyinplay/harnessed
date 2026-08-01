---
name: verify-qa
description: |
  Stage ④.d verify sub-workflow — gstack /qa 端到端 QA 验收 (has_ui_changes 触发, 可选 conditional;
  bundled verify-stage optional /qa step).
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-qa + browse + playwright-cli + playwright-test + webapp-testing + chrome-devtools-mcp)
  + 5 phase (01-qa gate ref has_ui_changes conditional + 4 条 web-testing-routing lane)。
  Triggered by slash command
  `/verify-qa` after `harnessed setup`.
trigger_phrases:
  - "verify qa"
  - "端到端 QA"
  - "E2E 验收"
  - "gstack qa"
  - "跑 verify-qa"
---

# verify-qa workflow (v3)

## Overview

5-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — 可选 /qa" onto harnessed runtime
(Phase v3.0-3.4 W0.13a — D-04 Stage ④ Verify 7 sub + D-12 gstack 治理关卡 + Pattern A
sub-workflow ship; T2.3 三层职责矩阵 + 非功能性诊断 4 条 lane 接线)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-qa` | gstack | sonnet | `{{ capabilities.gstack-qa.cmd }}` | `judgments.stage-routing.verify-qa-ui.fires` |
| 2 | `02-e2e-ci` | playwright-test | sonnet | (upstream-driven) | `judgments.web-testing-routing.playwright-test-default.fires` |
| 3 | `03-browser-probe` | gstack | sonnet | `{{ capabilities.browse.cmd }}` | `judgments.web-testing-routing.browse-probe.fires` |
| 4 | `04-python-backend-e2e` | gstack | sonnet | `{{ capabilities.webapp-testing.cmd }}` | `judgments.web-testing-routing.webapp-testing-python-backend.fires` |
| 5 | `05-perf-a11y-diagnostic` | chrome-devtools-mcp | sonnet | (upstream-driven) | `judgments.web-testing-routing.chrome-devtools-mcp-diagnostic.fires` |

Per-phase config loads from `workflows/verify/qa/workflow.yaml`; engine 4-level gate resolver
evaluates `phase.has_ui_changes == true` via expr-eval — true 则 invoke gstack `/qa` (端到端
QA 验收 + UI dogfood), false 则 skip。Phase 02-05 是三层职责矩阵 + 非功能性诊断的 4 条 lane,
由 `subtask.test_type` 单值互斥选择 — 无 test_type 信号时全 skip (只跑 01-qa)。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gstack-qa` — Bucket 3 治理关卡 (impl: gstack, cmd: /qa, fires_when: has_ui_changes)
- `browse` — Bucket 2 special-purpose (impl: gstack user-skill, cmd: /browse — 手层主导)
- `playwright-cli` — Bucket 2 special-purpose (impl: npm-cli, browser_probe — 未装 gstack 时的降级)
- `playwright-test` — Bucket 2 special-purpose (impl: npm-cli, e2e_test typescript)
- `webapp-testing` — Bucket 2 special-purpose (impl: gstack, e2e_test python)
- `chrome-devtools-mcp` — Bucket 4 tool-mcp (impl: mcp, cmd: chrome-devtools — 非功能性诊断必用;
  provider 二选一: ecc bonus tier 或 optional 自装 manifest,两者都缺则该 lane 不可用)

## Gate ref

Sister `workflows/judgments/stage-routing.yaml`:
- `verify-qa-ui.fires` — `phase.stage == 'verify' and phase.has_ui_changes == true`

Sister `workflows/judgments/web-testing-routing.yaml` (T2.3 — 4 条 lane 各接一个 gate):
- `playwright-test-default.fires` → phase 02
- `browse-probe.fires` → phase 03
- `webapp-testing-python-backend.fires` → phase 04
- `chrome-devtools-mcp-diagnostic.fires` → phase 05

## Routing rules (bundled web-testing routing — `workflows/judgments/web-testing-routing.yaml`)

- 写测试 提交 repo / CI 跑 → `@playwright/test` (默认 frontend/e2e/*.spec.ts) — phase 02
- 探查 / 调试 / 一次性确认 → `/browse` 主导 (token 高效, 可复用 cookies 与会话状态);
  未装 gstack 时降级 `playwright-cli` — phase 03
- setup 需 Python 后端 (Tortoise ORM / pandas) → `webapp-testing` skill — phase 04
- 性能 / a11y / 内存诊断 → **必用** `chrome-devtools-mcp` (NOT playwright/test/cli/webapp-testing) — phase 05

## How to invoke

!`harnessed checkpoint intent verify-qa`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run verify-qa` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt verify-qa --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` and `model`, then drive delivery with harnessed's own completion gate:
   - on return, write the subagent's final output to a file and run `harnessed checkpoint complete verify-qa --result-file <path>` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
   - if it blocks, run `harnessed checkpoint fail verify-qa --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
   - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete verify-qa --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. `--force` records an audited override (`evidence_status=overridden`) — it does not silently pass.
5. If the complete gate blocked: Bash `harnessed checkpoint fail verify-qa --failing-tests <n>` to record the attempt. It prints `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.

<!-- harnessed-generated:v4.12.0 -->

## References

- D-04 Stage ④ Verify 7 sub 分解
- D-12 gstack 治理关卡可选
- workflows/judgments/web-testing-routing.yaml — 三层职责矩阵 (脑 / 手 / 筋骨)
- workflows/capabilities.yaml — gstack-qa / browse / playwright-cli / playwright-test / webapp-testing / chrome-devtools-mcp
- workflows/judgments/stage-routing.yaml — verify-qa-ui trigger
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 05-qa-conditional sister verbatim
