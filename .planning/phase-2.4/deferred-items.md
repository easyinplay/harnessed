# Phase 2.4 deferred-items.md

> Phase 2.4 ship 期内识别的 deferred items (Wave 0 起累计)。
> 沿袭 Phase 2.3 deferred-items.md 模式 + D-OOS-1 .omc/ 2026-05-13 → 2026-05-15 三 phase 未 review process bug 根治。
> 触发条件: 每 phase ship 时 RETROSPECTIVE "## Deferred items review" 节强制 cat + 评估是否到 trigger。

## Active deferred items

### 1. T2.2 walker hard limit ≤100L → ≤130L soft-tolerance (Wave 2 ship 2026-05-16)

- **来源**: task_plan.md T2.2 acceptance L515 (`wc -l scripts/run-plan-checker.mjs ≤ 100`)
- **实际**: 130L post-biome (auto-format expansion of long single-line multi-clause statements + complex regex literals)
- **Rationale (deviation Rule 1 — biome blocking)**: biome formatter deterministically expands long single-line constructs (yaml-parse, scoring functions, JSON.stringify); the 4-regex scoring + threshold integration + walker recursion can not fit ≤100L while remaining biome-clean. Sister precedent: task_plan.md L596 `tests/integration/plan-checker-quant.test.ts ≤80 (~60L target)` — soft tolerance norm。 The functional intent (zero-dep walker, ENFORCE flag, multi-line regex aware, BLOCKER exit 1) is met。
- **Trigger to revisit**: Wave 6 T6.1 ADR 0013 finalize OR v0.3.0 if walker grows further。 Consider extracting regex/threshold into separate module if 150L breached。
- **Disposition**: ACCEPTED — Wave 2 ship.

### 2. T2.2 phase-2.4 self-check exit 1 mid-flight (Wave 2 ship 2026-05-16)

- **来源**: task_plan.md T2.2 acceptance L518 (`node scripts/run-plan-checker.mjs .planning/phase-2.4/ exit 0 (本 phase 自检 NOT BLOCKER)`)
- **实际**: phase-2.4 自检 task_plan.md = BLOCKER (fr=0.553 + weasel=17) mid-Wave-2
- **Rationale**: Acceptance bar is **end-state** post-Wave-6 invariant, NOT Wave 2 mid-flight。 (a) fr=0.553 因 Wave 3-6 大量 NEW file path 尚未 create (期望 Wave 6 ship 后 fr ≥ 0.80)；(b) weasel=17 全部 hits 是 task_plan.md 中**对 weasel 检测算法的元讨论** (quoting `assumed|presumably|should be|likely|probably|maybe` regex pattern 字面) — walker 无法区分的 inherent meta-discussion false-positive。
- **Trigger to revisit**: Wave 6 T6.x ship-time 重跑 walker on .planning/phase-2.4/ — 若 fr ≥ 0.80 (NEW files created) + weasel 仍 > 0 (meta) → 加 walker 白名单 `/dimension.*weasel|measurement.*regex/` OR 接受 phase-2.4 task_plan 永久 WARNING (3/4) given inherent self-referential nature。 v0.3.0 walker enhancement candidate。
- **Disposition**: ACCEPTED for Wave 2 ship — Wave 6 verify end-state.

(Phase 2.4 Wave 0 起 stub — 后续 Wave 识别的 deferred item 在此 append; Wave 6 ship-time review cadence 强制 cat)

## Resolved / promoted

(从 active 移到 resolved 时记录 commit hash + 触发原因)

---

*Phase 2.4 deferred-items.md created at Wave 0 T0.5 — stub for cadence walker (`scripts/check-deferred-items.mjs`) recognition + ship-time review enforcement.*
