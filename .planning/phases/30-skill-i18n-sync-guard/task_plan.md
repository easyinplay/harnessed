# Phase 30 task_plan (PWF) — en↔zh-Hans sync-guard

> Checklist + dep map. Spec: [PLAN.md](./PLAN.md). Decisions/landmines: [findings.md](./findings.md). Status: [progress.md](./progress.md).

## Dependency order
```
T30.1 (parity checker .mjs + tests, TDD)
   └─> T30.2 (wire ci.yml hard-fail step, pre-install)
          └─> T30.3 (validation gate)
```

## Checklist
- [ ] **T30.1** NEW `scripts/check-skill-i18n-parity.mjs` (export `checkSkillI18nParity` + CLI main-guard) + `tests/scripts/skill-i18n-parity.test.ts`. Structural parity: frontmatter key-set + `{{capabilities.X}}` placeholder set + heading-shape + orphan-zh. **drift-only** (no sibling = ok). Red → green. Dep-free (regex frontmatter, no `yaml` pkg — runs pre-install).
- [ ] **T30.2** MODIFY `.github/workflows/ci.yml` — add hard-fail step `node scripts/check-skill-i18n-parity.mjs` among pure-node checks BEFORE `corepack pnpm install`. Green at current repo (no siblings).
- [ ] **T30.3** GATE — biome --write clean (new .mjs + .ts), tsc clean, full vitest green vs 1416 baseline, guard green vs real `workflows/`, CI 3-OS green.

## TDD scope
Mechanism (parity checker) = **TDD red-green-refactor required** (T30.1). No prose. No TDD-skip declaration needed.

## Acceptance (phase-level, REQ-v100-sync-guard)
Guard fails CI when a sibling missing-by-orphan or drifts past structural parity, passes when pair in parity OR no sibling; transparent `::error::` naming the offending file; runs in CI on 3 OS; unit tests fire/pass; green gate.
