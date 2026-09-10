---
phase: 58
name: Brainstorming Skip Conjunction
status: complete
created: 2026-09-10
completed: 2026-09-10
gates_passed:
  - strategic gate SKIPPED (declared): calibration of an existing governance gate,
    not a new product direction.
  - user decision: option A — conjoin the skip; the pin-withdrawal half of that
    option was measured to be harmful and is documented below as a deviation.
verified_refs:
  - "workflows/judgments/subtask-gate.yaml triggers.brainstorming (edited)"
  - "workflows/task/auto/workflow.yaml:43,48 — gate + skip_gate refs (read)"
  - "src/cli/lib/gateContext.ts — seeded approaches:2 / has_api_contract:true (read, NOT changed)"
  - "src/workflow/schema/phaseFactContext.ts:40 ErrorCost = low|medium|high (read)"
  - "src/cli/facts.ts:436 subtask.lines ← git diff --numstat (read)"
  - "superpowers 6.3.0 skills/brainstorming/SKILL.md:24-50 spike/bounded/architectural (read)"
  - "tests/workflow/subtask-gate-veto.test.ts (NEW, 7 cells)"
---

# Phase 58 — Brainstorming Skip Conjunction

## The defect, measured not argued

`skips_when` was `subtask.type in ['crud','standard_lib_call'] or subtask.lines
< 20`, evaluated independently of every risk fact. Run against the real engine
(`harnessed gates task --context …`):

| approaches | core_algorithm | has_api_contract | error_cost | type | lines | clarify |
|---|---|---|---|---|---|---|
| 3 | true | true | high | general | 15 | **SKIP** |
| 3 | true | true | high | general | 25 | FIRE |
| 3 | true | true | high | crud | 500 | **SKIP** |

The engine says it plainly: `sub vetoed despite its gate firing`. Ten lines
flipped a governance gate, and the `crud` label vetoed at any size.

Root cause: the skip encoded the **symptom** rather than the condition.
`~/.claude/CLAUDE.md` reads "常规 CRUD" and "**单一明显实现**（< 20 行 / 一个文件）"
— size is a modifier on *single obvious implementation*, not the criterion. When
`approaches >= 2`, the implementation is by definition not obvious.

Upstream superpowers 6.3.0 draws the same line on its own axis: spike / bounded /
architectural measures whether the flow being changed already exists in this repo,
never the diff size. ("Bounded measures the repo, not your familiarity.")

## Two of my earlier claims, corrected

1. **"This needs measurement, not a number change."** Neither. It needed a
   *conjunction*. No A/B was required — the defect is structural and reproducible
   in one command.
2. **"6.3.0 made ceremony cheaper, so maybe harnessed should stop skipping."**
   What got cheaper is the *document* ceremony. The approval gate did not:
   "a bounded task's approval is as hard a gate as an architectural one." For a
   subtask the cost that matters is the stop-for-approval, so the premise for
   recalibrating on those grounds was void.

## Deviation from the chosen option, and why

The user chose option A: conjoin the skip **and** withdraw the seeded
`approaches: 2` / `has_api_contract: true` pins. The conjunction shipped; the
pin withdrawal did **not**, because measuring it showed the option description
(mine) was wrong about its effect.

With both pins withdrawn, all four `fires_when` arms go false under the seeded
defaults — `approaches >= 2` false, `core_algorithm` already false,
`has_api_contract` false, `error_cost` already 'low'. The gate would then never
fire without supplied facts: exactly the silent deletion ADR-0038 forbids, and
exactly what that option was chosen to avoid.

With the conjunction in place the pins change role. They are no longer "fire on
everything"; they are what makes the *skip's* conjunction false when nothing was
measured. Unknown → cannot skip → gate fires → safe side. So the conjunction
alone delivers every target cell, and withdrawing the pins is both unnecessary
and harmful.

## Verification

`tests/workflow/subtask-gate-veto.test.ts` — 7 cells against the **real**
`workflows/judgments/subtask-gate.yaml` through the real resolver, no fixture:

| cell | before | after |
|---|---|---|
| tiny + high risk | SKIP | **RUNS** |
| tiny + no risk | SKIP | SKIP |
| crud + high risk | SKIP | **RUNS** |
| crud + no risk | SKIP | SKIP |
| tiny + only approaches≥2 | SKIP | **RUNS** |
| seeded defaults, nothing measured | RUNS | RUNS |
| lines 15 vs 25 at equal risk | differ | identical |

Cell 5 is the one the narrower fix (dropping only `core_algorithm` /
`error_cost` from the skip) would still have vetoed — and "≥2 approaches" is the
first line of the user's own criteria.

Also green: workflow-schema gate, skill i18n parity (both `task/clarify`
SKILL.md files updated), upstream-freshness, biome, tsc.

## Note for later

`subtask.lines` is derived from `git diff --numstat` (uncommitted work), so at
the START of a subtask — clean tree — it is null and the model estimates it;
only mid-work is it measured. Same shape as the `countChangedFiles` correction
earlier in this arc. Not a defect now that size alone cannot veto, but it means
`lines` is a soft signal in both directions and should never regain veto power.
