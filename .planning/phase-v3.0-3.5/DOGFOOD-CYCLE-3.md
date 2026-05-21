# Phase v3.0-3.5 W2 Cycle 3 — /task Master Orchestrator Dogfood

**Date**: 2026-05-21
**Phase**: v3.0-3.5 W2 T3.5.W2.1 Cycle 3 (sister Phase 2.5 5-cycle reduced to 4)
**Scope**: `/task` master orchestrator — serial 4 sub (clarify order 1 + code order 2 + test order 3 + deliver order 4)
**Test artifact**: `tests/dogfood/cycle-3-task.dogfood.test.ts` (10 fixture)
**Verdict**: **PASS** (10/10 fixture green, 0 production bug caught this cycle)

---

## Scope verbatim per PLAN L590

> Cycle 3 `/task`: master invoke + serial 4 sub (clarify → code → test → deliver) →
> 验证 ralph-loop wrapper + tdd-gate fire + planning-with-files progress.md update

---

## Fixture matrix

| # | Fixture | Axis verified |
|---|---------|---------------|
| F1 | `task/auto/workflow.yaml` Value.Check pass + workflow=task + `delegates_to=4` | Master yaml shape |
| F2 | 4 sub `mode=serial` + order=1,2,3,4 (clarify→code→test→deliver) | K9 serial order LOCK |
| F3 | clarify `gate=subtask-gate.brainstorming` + test `gate=tdd-gate.tdd-strongly-suggested` + code/deliver NO gate | Gate convention |
| F4 | high-stakes ctx (multi-approach + core algorithm) → fired=4 全 in order 1-2-3-4 | All-fire happy path |
| F5 | CRUD low-stakes ctx → fired=[code, deliver] + clarify+test skipped | Conditional skip via skips_when (subtask) + low TDD (tdd-gate) |
| F6 | Serial 4-step order respect — clarify end < code start < test start < deliver start | Sequential proof |
| F7 | Transparency block 4-step `Firing 4 sub in serial: → ... serial order=1..4 → Complete: 4 fired, 0 skipped` | RESEARCH § Area 3 |
| F8 | ralph-loop NOT master scope (D-10 orthogonal wrapper) — `tools_available` declare 但 master 不 delegate | D-10 orthogonal wrapper |
| F9 | tdd-gate 5 OR-chain branch — `is_data_processing` 单独 trigger fire (其它 4 branch 全 false) | tdd-gate OR-chain enumeration |
| F10 | `tools_available` 含 planning-with-files (progress.md sink) + 4 mattpocock 招式 (grill-with-docs/zoom-out/improve-codebase-architecture/diagnose) | Tool surface declared |

---

## Key contract proven

### 1. Serial 4-step order respect (F4 + F6)

`masterOrchestrator.ts` L143-145 `serialClauses.sort((a,b) => (a.order??0) - (b.order??0))` +
L169-173 sequential `await spawnDriver(...)`。F6 用 timestamp proof: 4-step pairwise check
`end[i] ≤ start[i+1]` 全过 (clarify→code→test→deliver 严格 sequential)。

### 2. Conditional clarify + test gate evaluation (F5 + F9)

- `subtask.type='crud' OR subtask.lines<20` → `subtask-gate.brainstorming` skip (skips_when)
- `is_core_business_logic / is_algorithm / is_data_processing / regression_risk=high / reliability_required` 任一
  true → `tdd-gate.tdd-strongly-suggested` fires (5 OR-chain branch)

F9 单独验 `is_data_processing=true` (其它 4 branch 全 false) — tdd 仍 fire,证 OR-chain 各 branch
独立 trigger,sister Phase 2.5 W2 5-bug-class type 4 yaml-runtime divergence catch pattern。

### 3. D-10 ralph-loop orthogonal wrapper (F8)

per `~/.claude/CLAUDE.md` "ralph-loop 是正交 wrapper" — `tools_available` declare ralph-loop 但
master `delegates_to` 不含。ralph-loop 在 deliver sub workflow.yaml 内 04-deliver phase 通过
`capability: '{{ capabilities.ralph-loop.cmd }}'` invoke + `completion_promise=COMPLETE` enforce
(per execute-task v2 pattern Phase 2.4 W1.1 SHIPPED)。

### 4. mattpocock conditional route declared (F10)

`tools_available` 含 4 招式 — grill-with-docs (澄清规格) / zoom-out (陌生模块) /
improve-codebase-architecture (架构健康) / diagnose (系统化排错)。Per D-05 conditional `on:` clause
在 code sub workflow.yaml `invokes_tools` 字段 fire — master 仅 declare 不 invoke。

---

## Production bugs caught this cycle

**0 bug** — fixture 一遍过。4-step serial + 2 conditional gate + tdd-gate 5 OR-chain + D-10
orthogonal wrapper 全 SHIPPED state 行为符合预期。

L-3 advisory ship。

---

## Next

Cycle 4 — `/verify` master 7 sub mixed (progress serial + 5 parallel conditional + simplify
tail serial + multispec critical-release Pattern C) → 完整 Verify stage 流程 + **Master Path A
SDK vs Path B sub-shell LOCK decision (Open Q4 final 决策点)**。

---

*Phase v3.0-3.5 W2 Cycle 3 — /task master orchestrator dogfood evidence*
*Run: 2026-05-21*
