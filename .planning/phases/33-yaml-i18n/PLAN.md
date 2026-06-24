---
phase: 33
milestone: v10.0
title: user-facing yaml i18n (locale loader + bilingual role-prompts/disciplines)
status: ready-to-execute
created: 2026-06-24
requirement: REQ-v100-yaml-i18n
depends_on: [29, 30, 31]
blocks: []
verified_refs:
  - "src/cli/lib/generateCommands.ts:72 loadRolePrompts (exists — add locale)"
  - "src/cli/lib/generateCommands.ts:301 description → commands/*.md frontmatter (exists)"
  - "src/workflow/run.ts:200 buildAgentDef injects specialist/responsibility/checklist/severity/description (exists)"
  - "src/cli/prompt.ts:96 buildDisciplinesSection reads rules[].description (exists — add locale)"
  - "src/workflow/disciplineLoader.ts:21 DEFAULT_APPLIED (7 disciplines) (exists)"
  - "src/i18n/index.ts:100 getLocale() (exists — reuse)"
  - "src/workflow/schema/discipline.ts:58 Discipline TypeBox (rules[].description: String) — siblings reuse, NO schema change"
  - "scripts/check-skill-i18n-parity.mjs (exists — sister model for yaml parity guard)"
  - "workflows/role-prompts.yaml — English source, 24 roles (verified)"
  - "workflows/disciplines/{karpathy,output-style,priority}.yaml — CHINESE source; operational mixed 6zh/1en; language mixed; doc-discipline English (verified)"
  - "8 NEW *.zh-Hans.yaml siblings + 5 rewritten English base discipline files + scripts/check-yaml-i18n-parity.mjs (NEW)"
---

# Phase 33 — user-facing yaml i18n (the last v10.0 phase)

## Goal

Make the two genuinely user-facing yaml surfaces (`role-prompts.yaml` + the surfaced
`disciplines/*.yaml` `rule.description`) bilingual via a **locale-aware sibling-yaml loader**, AND
fix the **pre-existing en-default bug** the research surfaced: English-locale users today receive
**Chinese** discipline text (karpathy/output-style/priority Chinese; operational mostly Chinese)
because those yaml are authored in Chinese.

End state: every user-facing yaml surface has an English **base** + a `.zh-Hans.yaml` sibling; the
loader serves the locale-correct one (`getLocale()` → base for `en`, sibling for `zh-Hans`, base
fallback if no sibling). For `zh-Hans` users, discipline behavior is **byte-identical to today**
(today's Chinese content moves verbatim into the siblings); for `en` users, disciplines are now
**correct English**.

## en-default invariant (clarified for this phase)

The milestone invariant "en-default byte-identical" assumed en-default was already correct English.
For `role-prompts.yaml` + `doc-discipline.yaml` (English source) the base IS unchanged (byte-identical).
For the Chinese-source disciplines the base **intentionally changes Chinese→English** — that is the
bug fix, not a regression. The preserved-byte-identical guarantee shifts to the **zh-Hans sibling**
(= today's Chinese content verbatim) so existing zh behavior is unchanged.

## Loader design (decided): sibling yaml files

Zero schema change (sibling validates against the same TypeBox `Discipline` schema; role-prompts has
no schema). Mirrors Phase 29 SKILL.md siblings + `messages/{en,zh-Hans}.json`. Rejected in-yaml
`{en,zh-Hans}` maps (breaks `Type.String()` → schema_version bump + interface breakage).

## Tasks

### T33.1 — locale-aware yaml loader (TDD: red → green)
- **Files**: `src/cli/lib/generateCommands.ts` (`loadRolePrompts`) + `src/cli/prompt.ts` (`buildDisciplinesSection`).
  - `loadRolePrompts(workflowsDir, locale?)`: try `role-prompts.${locale}.yaml`, fallback `role-prompts.yaml`. Default `locale = getLocale()`. en → base (byte-identical path).
  - `buildDisciplinesSection(...)`: per discipline name, try `${name}.${locale}.yaml`, fallback `${name}.yaml`. Reuse `getLocale()`.
  - Thread locale from the call sites (`run.ts:417`, `prompt.ts:194`, `gates.ts`) — default `getLocale()` so explicit `--lang`/env flows through (sister Phase 29).
- **Tests** (fixtures): en → base; zh + sibling → sibling content; zh + NO sibling → base fallback; default reads `getLocale()`. Red first.
- **Acceptance**: red→green; en path serves the base file unchanged; biome/tsc/vitest green.

### T33.2 — role-prompts.zh-Hans.yaml (translation; TDD-skip prose)
- **File**: `workflows/role-prompts.zh-Hans.yaml` (NEW). Translate all 24 roles' `description` / `responsibility` / `checklist` / `severity` / `specialist` to Chinese. Keep verbatim: role keys, `primary_cap`, `is_master`, `schema_version`, identifiers/tool names per glossary. Base `role-prompts.yaml` **unchanged**.
- **Acceptance**: yaml parses; same role keys + same per-role fields as base; identifiers preserved; parity guard green.

### T33.3 — doc-discipline.zh-Hans.yaml (translation; TDD-skip prose)
- **File**: `workflows/disciplines/doc-discipline.zh-Hans.yaml` (NEW). Translate the 6 English rule descriptions → Chinese. Keep `id`/`enforcement`/`trigger`/`check_method`/`schema_version`/`discipline` verbatim. Base unchanged.
- **Acceptance**: validates `harnessed.discipline.v1`; same rule ids + fields as base; parity guard green.

### T33.4 — fix Chinese-source disciplines (en bug fix + zh sibling; TDD-skip prose)
For `karpathy`, `output-style`, `priority`, `operational`, `language`:
- **Create `<name>.zh-Hans.yaml`** = the CURRENT base's Chinese `rule.description` content **verbatim** (so zh behavior is byte-identical to today). Keep all non-description fields.
- **Rewrite base `<name>.yaml`** `rule.description` → **English** (faithful translation of the Chinese rules). For `operational` (6 zh / 1 en) + `language` (mixed): per-rule — English in base, the original in the zh sibling.
- **Acceptance**: base = English descriptions, validates `harnessed.discipline.v1`; sibling = today's Chinese verbatim; `disciplineLoader` (enforcement path) still validates both; same rule ids/fields; parity guard green. NOTE: this changes the base bytes for these 5 files (the intended en-default fix) — call it out, don't treat as a regression.

### T33.5 — yaml i18n parity guard (TDD: red → green)
- **File**: `scripts/check-yaml-i18n-parity.mjs` (NEW, sister `check-skill-i18n-parity.mjs`). For each `<base>.yaml` with a `<base>.zh-Hans.yaml` sibling under `workflows/role-prompts*` + `workflows/disciplines/*`, assert structural parity: same top-level keys, same role keys / rule `id` set, same per-entry field presence (values differ by translation). drift-only (no sibling = ok). Export + `import.meta.url` main-guard (dep-free, pre-install) per Phase 30 pattern.
- **Wire**: add a hard-fail CI step in `.github/workflows/ci.yml` (sister the Phase 30 skill parity step).
- **Tests** (fixtures): in-parity → ok; missing rule id in sibling → violation; orphan sibling → violation.
- **Acceptance**: red→green; guard exits 0 against the real `workflows/` after T33.2–T33.4; CI step hard-fail.

### T33.6 — gate + end-to-end verify
- **Acceptance**: `corepack pnpm exec biome check --write` clean; `tsc` clean; full `vitest` green vs the 1426 baseline (+ new loader/guard tests). End-to-end: `harnessed prompt <verify-sub>` under `HARNESSED_LANG=en` → English disciplines + English role prompt; under `zh-Hans` → Chinese. `commands/<name>.md` `description` (generated) → English under en, Chinese under zh. en-default now correct.

## Out of scope
- internal `capabilities.yaml` + `judgments/*.yaml` descriptions → never (runtime never reads them).
- `protocols.yaml` (no surfaced rules) → no sibling needed.

## Goal-backward check
Goal = "all user-facing yaml bilingual via a sibling loader, en-default correct English." T33.1 builds
the loader; T33.2/T33.3 add the clean (English-source) siblings; T33.4 fixes the Chinese-source
disciplines (English base + Chinese sibling); T33.5 guards parity; T33.6 proves end-to-end + gate.
Every clause covered.
