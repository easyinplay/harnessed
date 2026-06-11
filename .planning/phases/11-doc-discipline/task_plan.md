# Phase 11 — task_plan (tracking surface)

> planning-with-files tracker. Canonical spec = `11-PLAN.md` (do NOT duplicate detail here).
> Grounding = `findings.md`. Requirements = `REQUIREMENTS.md` REQ-v60-doc-discipline + REQ-v60-validation.

## Tasks (7, 3 waves) — detail in 11-PLAN.md

- [x] **T11.1** [W1] NEW `workflows/disciplines/doc-discipline.yaml` (6 rules, schema harnessed.discipline.v1)
- [x] **T11.2** [W1] MODIFY `workflows/capabilities.yaml` — register `doc-discipline` behavioral entry
- [x] **T11.3** [W2] MODIFY discipline.test.ts + disciplineLoader.test.ts (7 assertions; TDD)
- [x] **T11.4** [W2] MODIFY `before-commit.ts` — STATE >100-line halt + override (TDD core)
- [x] **T11.5** [W2] MODIFY before-commit.test.ts (5 cases; TDD pair with T11.4)
- [x] **T11.6** [W2] MODIFY `disciplineLoader.ts` — append `doc` to DEFAULT_APPLIED (revise D6)
- [x] **T11.7** [W3] Validation gate: biome + tsc + full vitest (≥1179) + Windows `\r?\n` check

## Acceptance (phase done = TRUE)

- doc-discipline.yaml validates harnessed.discipline.v1; capability registered + resolver green.
- before-commit halts on >100-line STATE without override, passes with `HARNESSED_ALLOW_LONG_STATE`.
- biome + tsc clean; full vitest green, no regression vs 1167 baseline; Windows CI green.

## Coordination note (from planner)

- T11.3 D6 ↔ T11.6: D6 must assert `DEFAULT_APPLIED.includes('doc') === true` (length 7) — whichever task authored second reflects final state.
