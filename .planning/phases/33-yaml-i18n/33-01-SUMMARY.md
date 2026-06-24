# Phase 33 SUMMARY — user-facing yaml i18n

> v10.0 Phase 33 (REQ-v100-yaml-i18n), the LAST v10.0 phase. Shipped 2026-06-24. Plan: [PLAN.md](./PLAN.md). Findings: [findings.md](./findings.md).

## What shipped

A locale-aware sibling-yaml loader makes the two genuinely user-facing yaml surfaces bilingual,
AND fixes a pre-existing en-default bug (English-locale users were receiving Chinese discipline text).

- **T33.1** NEW `src/i18n/localeYaml.ts` `resolveLocaleYaml(dir, baseName, locale=getLocale())` —
  en → base (byte-identical), non-en → `<baseName>.<locale>.yaml` if present else base. Wired into
  `loadRolePrompts` (generateCommands.ts) + `buildDisciplinesSection` (prompt.ts, now exported).
  TDD red→green. No schema change (siblings reuse the `Discipline` TypeBox).
- **T33.2** NEW `workflows/role-prompts.zh-Hans.yaml` — 24 roles translated (specialist /
  responsibility / checklist / severity / description); keys + primary_cap + is_master verbatim.
- **T33.3** NEW `workflows/disciplines/doc-discipline.zh-Hans.yaml` — 6 rule descriptions translated.
- **T33.4** fix **4** Chinese-source disciplines (karpathy / output-style / priority / operational):
  `<name>.zh-Hans.yaml` = today's Chinese verbatim (HEAD byte-identical → zh behavior unchanged);
  base `<name>.yaml` `rule.description` rewritten to English (the en-default fix).
- **T33.5** NEW `scripts/check-yaml-i18n-parity.mjs` (+ `.d.mts`), 9-cell TDD. Structural parity
  (top-keys / role-key + rule-id sets / per-entry field presence), drift-only. ci.yml hard-fail step.

## Verify (self-verified)

- biome clean; tsc clean.
- **vitest 1446 passed / 0 failed** (baseline 1426 + 20: locale-yaml 5 + prompt-disc-locale 3 +
  generate-commands +3 + yaml-parity 9).
- e2e: `HARNESSED_LANG=en prompt task-code` → English disciplines + role; `zh-Hans` → Chinese.
- 4 zh siblings **byte-identical to HEAD originals** (`git show HEAD:… | diff` clean).
- schema validate green (12 disciplines incl. 5 zh siblings validate `harnessed.discipline.v1`).
- guard against real `workflows/`: structural parity, exit 0.

## Decisions (execute-time refinements, transparent)

- **`language.yaml` EXCLUDED from T33.4** (5 → 4 files). Grep-verified it is NEVER surfaced:
  `buildDisciplinesSection` filters `language`; the enforcement hooks read no `description` text. So
  no en-default bug for it and a sibling would be dead weight. Consistent with "全 surface 双语 + 修
  en bug" (language is not a surface). karpathy-minimal.
- **T33.5 guard uses the `yaml` package** (robust structural parse) → CI step runs AFTER `pnpm
  install` (sister check-workflow-schema), a deviation from the PLAN's "dep-free (pre-install)" note.
  Regex-parsing yaml structure would itself be a bug source; the dep-free constraint was
  Phase-30-specific. Export + `import.meta.url` main-guard + `.d.mts` retained.

## Commits (local, no push)

- `5e0b2de` feat(33-PLAN) — locale loader + 8 siblings + 4 base rewrites + guard + ci + PWF
- (this) docs — SUMMARY + phase/milestone digest

## Out of scope (held)

- internal `capabilities.yaml` + `judgments/*.yaml` descriptions (runtime never reads them) → never.
- `protocols.yaml` (no surfaced rules) → no sibling.
- Real-world `HARNESSED_USER_LANG → getLocale()` wiring is the existing i18n-layer concern (Phase 29);
  e2e proves the mechanism via explicit `HARNESSED_LANG`.
