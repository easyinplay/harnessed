# Phase 33 task_plan (PWF) — user-facing yaml i18n

> Checklist + dep map. Spec: [PLAN.md](./PLAN.md). Decisions/landmines: [findings.md](./findings.md). Status: [progress.md](./progress.md).

## Dependency order
```
T33.1 (locale loader, TDD) ──┐
T33.2 role-prompts.zh-Hans   ─┤
T33.3 doc-discipline.zh-Hans ─┼─> T33.5 (yaml parity guard, TDD) ─> T33.6 (gate + e2e verify)
T33.4 fix Chinese disciplines ┘   (guard needs the siblings to exist)
```
T33.2/3/4 (translation) are independent of each other → parallel subagent fan-out. T33.1 (loader) independent. T33.5 needs the siblings present.

## Checklist
- [x] **T33.1** `resolveLocaleYaml` helper (src/i18n/localeYaml.ts NEW) + locale-aware `loadRolePrompts` + `buildDisciplinesSection` (exported). TDD red→green. en→base byte-identical.
- [x] **T33.2** NEW `workflows/role-prompts.zh-Hans.yaml` — 24 roles translated; base unchanged.
- [x] **T33.3** NEW `workflows/disciplines/doc-discipline.zh-Hans.yaml` — 6 rules translated; base unchanged.
- [x] **T33.4** FIX **4** Chinese-source disciplines (karpathy/output-style/priority/operational) — `<name>.zh-Hans.yaml` = today's Chinese verbatim (HEAD-identical); base rewritten to English. `language` EXCLUDED (never surfaced — see findings).
- [x] **T33.5** NEW `scripts/check-yaml-i18n-parity.mjs` (+ `.d.mts`) + ci.yml post-install hard-fail step — structural parity (top-keys / role keys / rule ids / fields), drift-only. TDD (9 cells).
- [x] **T33.6** GATE — biome+tsc clean; vitest **1446**/0 (baseline 1426 +20); e2e `prompt task-code` en→English / zh→Chinese; guard exit 0 on real workflows.

## TDD scope
- **Mechanism (TDD red-green)**: T33.1 loader, T33.5 parity guard.
- **Prose translation (TDD-skip declared in findings)**: T33.2/T33.3/T33.4 — yaml content; verified by the parity guard + e2e, not unit tests.

## Acceptance (REQ-v100-yaml-i18n)
locale loader selects zh-Hans yaml under zh locale, en-default byte-identical for English-source files (role-prompts/doc-discipline) + correct English for the fixed disciplines; `harnessed prompt`/`commands` surface zh under zh; yaml parity guard covers the pairs; green gate.
