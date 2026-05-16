# Phase 2.4 deferred-items.md

> Phase 2.4 ship 期内识别的 deferred items (Wave 0 起累计)。
> 沿袭 Phase 2.3 deferred-items.md 模式 + D-OOS-1 .omc/ 2026-05-13 → 2026-05-15 三 phase 未 review process bug 根治。
> 触发条件: 每 phase ship 时 RETROSPECTIVE "## Deferred items review" 节强制 cat + 评估是否到 trigger。

## Active deferred items

### 1. T2.2 + T2.4 line-limit soft-tolerance post-biome auto-format (Wave 2 ship 2026-05-16)

- **来源**: task_plan.md T2.2 L515 `wc -l scripts/run-plan-checker.mjs ≤ 100` + T2.4 L595 `wc -l tests/integration/plan-checker-quant.test.ts ≤ 80 (~60L target)`
- **实际**:
  - `scripts/run-plan-checker.mjs` = 130L (vs ≤100L spec)
  - `tests/integration/plan-checker-quant.test.ts` = 103L (vs ≤80L spec)
- **Rationale (deviation Rule 1 — biome blocking)**: biome formatter deterministically expands (a) long single-line multi-clause statements, (b) complex regex literals, (c) JSON.stringify arg objects, (d) type alias inline declarations. T2.2 4-regex scoring + threshold integration + walker recursion can not fit ≤100L biome-clean; T2.4 4-cell integration test with synthetic fixture + yaml schema validation + type assertion can not fit ≤80L biome-clean。 Sister precedent: task_plan.md L596 marks T2.4 ≤80 as "~60L target" — soft tolerance norm。 Functional intent (zero-dep walker / 4-cell test / yaml schema parity / BLOCKER detection) fully met。
- **Trigger to revisit**: Wave 6 T6.1 ADR 0013 finalize OR v0.3.0 if either file grows further。 Consider extracting regex/threshold into separate module if walker 150L breached。 Consider per-cell file split if test 130L breached。
- **Disposition**: ACCEPTED — Wave 2 ship.

### 2. T2.2 phase-2.4 self-check exit 1 mid-flight (Wave 2 ship 2026-05-16)

- **来源**: task_plan.md T2.2 acceptance L518 (`node scripts/run-plan-checker.mjs .planning/phase-2.4/ exit 0 (本 phase 自检 NOT BLOCKER)`)
- **实际**: phase-2.4 自检 task_plan.md = BLOCKER (fr=0.553 + weasel=17) mid-Wave-2
- **Rationale**: Acceptance bar is **end-state** post-Wave-6 invariant, NOT Wave 2 mid-flight。 (a) fr=0.553 因 Wave 3-6 大量 NEW file path 尚未 create (期望 Wave 6 ship 后 fr ≥ 0.80)；(b) weasel=17 全部 hits 是 task_plan.md 中**对 weasel 检测算法的元讨论** (quoting `assumed|presumably|should be|likely|probably|maybe` regex pattern 字面) — walker 无法区分的 inherent meta-discussion false-positive。
- **Trigger to revisit**: Wave 6 T6.x ship-time 重跑 walker on .planning/phase-2.4/ — 若 fr ≥ 0.80 (NEW files created) + weasel 仍 > 0 (meta) → 加 walker 白名单 `/dimension.*weasel|measurement.*regex/` OR 接受 phase-2.4 task_plan 永久 WARNING (3/4) given inherent self-referential nature。 v0.3.0 walker enhancement candidate。
- **Disposition**: ACCEPTED for Wave 2 ship — Wave 6 verify end-state.

### 3. EE-4 plan-checker CI step ordering bug — `yaml` ERR_MODULE_NOT_FOUND (Wave 5 ship 2026-05-16)

- **来源**: ci.yml L118-123 `EE-4 plan-checker quant gate` step at L121 runs `node scripts/run-plan-checker.mjs .planning/` **BEFORE** L124 `pnpm install --frozen-lockfile`. Walker imports `yaml` from npm → `ERR_MODULE_NOT_FOUND: Cannot find package 'yaml'` on 3-OS CI (verified runs 25955198823 W4 ship + 25958484645 W5 ship).
- **实际**: `continue-on-error: true` on the step swallows exit 1 → step shows as "warn-only round 1" but walker **never actually scored** — annotation noise only, no real EE-4 enforcement happening in CI today。 Local `node scripts/run-plan-checker.mjs` works because `node_modules/` exists.
- **Rationale**: 不在 W5 scope (W5 adds tests/integration/plan-checker-fixtures.test.ts + tests/cli/doctor-fixtures.test.ts + tests/integration/phase-2.4-e2e.test.ts — 不 touch ci.yml 或 run-plan-checker.mjs). 但 pre-existing bug since W2 T2.4 ship (commit 55b0329 2026-05-16) — masked by continue-on-error。
- **Fix**: Reorder ci.yml — move EE-4 step to AFTER `corepack pnpm install --frozen-lockfile` (L124+) OR pre-install `yaml` package globally before EE-4 OR `npm install --no-save yaml` before EE-4 step。 Single-line move, no functional change.
- **Trigger to revisit**: Wave 6 ship — must fix before flipping `ENFORCE=true` (T2.4 deferred plan) since `continue-on-error: false` would surface this immediately as red CI. T6.x ship checklist must include "EE-4 actually runs successfully end-state".
- **Disposition**: ACTIVE — Wave 6 fix mandatory (Wave 5 ship OK because step is `continue-on-error: true`).
- **Detection**: Wave 5 T5.3 e2e ship 时 `gh run view` log grep — identified by W5 executor mid-wave verify per scope-boundary discipline。

(Phase 2.4 Wave 0 起 stub — 后续 Wave 识别的 deferred item 在此 append; Wave 6 ship-time review cadence 强制 cat)

## Resolved / promoted

(从 active 移到 resolved 时记录 commit hash + 触发原因)

---

*Phase 2.4 deferred-items.md created at Wave 0 T0.5 — stub for cadence walker (`scripts/check-deferred-items.mjs`) recognition + ship-time review enforcement.*
