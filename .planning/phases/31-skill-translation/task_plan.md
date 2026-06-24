# Phase 31 task_plan (PWF) — SKILL.md surface translation

> Checklist + dep map. Spec: [PLAN.md](./PLAN.md). Decisions/landmines: [findings.md](./findings.md). Status: [progress.md](./progress.md).

## Dependency order
```
T31.B1 … T31.B7  (7 translation batches — INDEPENDENT, parallel subagent fan-out)
        └─> T31.V  (guard verification + gate — barrier: needs all 26 siblings)
```

## Checklist (26 SKILL.md → 26 SKILL.zh-Hans.md)
- [ ] **T31.B1** Standalone — `auto`, `research` (⚠4-key), `retro` (3 files)
- [ ] **T31.B2** discuss — `discuss/{auto,phase,strategic,subtask}` (4)
- [ ] **T31.B3** plan+ship masters — `plan/{auto,architecture,phase}`, `ship/auto` (4)
- [ ] **T31.B4** ship-preflight+task — `ship/preflight`, `task/{auto,clarify,code,deliver⚠}` (5)
- [ ] **T31.B5** task/test+verify masters — `task/test`, `verify/{auto,code-review}` (3)
- [ ] **T31.B6** verify subs A — `verify/{design,multispec,paranoid,progress}` (4)
- [ ] **T31.B7** verify subs B — `verify/{qa,security,simplify}` (3)
- [ ] **T31.V** guard exit 0 (26 pairs parity) + git-diff shows ONLY 26 new files (en byte-identical) + full gate green + surfacing spot-check

## TDD scope
**Prose translation → TDD-skip declared** (findings). Mechanism (resolve + guard) already built+tested in 29/30; Phase 31 = 26 markdown artifacts, no new code. Acceptance = Phase 30 guard green on real pairs + en byte-identical.

## Acceptance (REQ-v100-translation)
26 `.zh-Hans.md` siblings present + sync-guard green (frontmatter keys / placeholders / heading-level shape); resolve surfaces zh body under zh locale; en `SKILL.md` byte-identical; green gate.
