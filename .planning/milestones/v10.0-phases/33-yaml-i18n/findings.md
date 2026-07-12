# Phase 33 findings (PWF) — decisions / landmines / research

> Source: Explore subagent a8b30f1bd2834574d (2026-06-24) + Area-D scope decision.

## TDD posture
- **Mechanism (TDD red-green-refactor)**: T33.1 locale loader, T33.5 yaml parity guard.
- **Prose translation (TDD-skip, justified)**: T33.2/T33.3/T33.4 yaml content — verified by the
  parity guard (structure) + T33.6 e2e (`harnessed prompt` per locale), not a unit suite.

## The pre-existing en-default bug (the pivotal finding)

English-locale users TODAY receive **Chinese** discipline text in spawned-subagent system prompts
(`## Disciplines` section via `buildDisciplinesSection` prompt.ts:96), because karpathy/output-style/
priority are Chinese-source and operational is 6/7 Chinese. This predates v10.0 (the yaml directly
encode the user's Chinese CLAUDE.md). **Area-D decision = Full**: fix it — English base + Chinese
`.zh-Hans.yaml` sibling. The "en-default byte-identical" invariant shifts: preserved for the
English-source files (role-prompts, doc-discipline); for the 5 Chinese-source disciplines the base
**intentionally** changes Chinese→English (the fix), and byte-identical-for-zh is guaranteed by
copying today's Chinese verbatim into the siblings.

## Current-language reality (per surface)

| Surface | Today | Phase 33 action |
|---|---|---|
| `role-prompts.yaml` (24 roles, all fields) | English | base unchanged + NEW `.zh-Hans.yaml` |
| `disciplines/doc-discipline.yaml` (6 rules) | English | base unchanged + NEW `.zh-Hans.yaml` |
| `disciplines/karpathy.yaml` (5) | Chinese | base→English; Chinese→`.zh-Hans.yaml` |
| `disciplines/output-style.yaml` (7) | Chinese | base→English; Chinese→`.zh-Hans.yaml` |
| `disciplines/priority.yaml` (1) | Chinese | base→English; Chinese→`.zh-Hans.yaml` |
| `disciplines/operational.yaml` (7) | 6 zh / 1 en | per-rule: base→English; orig→`.zh-Hans.yaml` |
| `disciplines/language.yaml` (4) | mixed | per-rule: base→English; orig→`.zh-Hans.yaml` |
| `disciplines/protocols.yaml` | rules:[] (not surfaced) | no sibling needed |

## Surfacing paths (verified)
- `role-prompts.yaml`: `loadRolePrompts` generateCommands.ts:72 → (1) `description` → `commands/<name>.md` frontmatter (generateCommands.ts:301) + AgentDefinition.description; (2) `specialist`/`responsibility`/`checklist`/`severity` → subagent prompt via `buildAgentDef` run.ts:200-237. Also `harnessed prompt <sub>` prompt.ts:194.
- `disciplines/*.yaml`: surfaced ONLY via `buildDisciplinesSection` prompt.ts:96-124 (reads `rules[].description`). The enforcement path `disciplineLoader.ts` validates TypeBox but does not surface text.

## Loader landmines
1. **Sibling yaml, NOT in-yaml maps** — in-yaml `{en,zh}` breaks `Discipline` TypeBox `rules[].description: Type.String()` (discipline.ts:58 + check-workflow-schema.mjs:204) → would force schema_version bump. Sibling = zero schema change.
2. **Two loaders to make locale-aware**: `loadRolePrompts` (generateCommands.ts:72) + `buildDisciplinesSection`'s per-file read (prompt.ts ~109). Both: try `X.${locale}.yaml`, fallback base. Default `locale=getLocale()` (reuse src/i18n/index.ts:100; do NOT re-implement locale parsing).
3. **`buildDisciplinesSection` filters `language`** (handled by `buildLanguageSection` separately) — confirm whether `language.yaml` rule descriptions are even surfaced via the disciplines section before translating; if `language` is excluded there, its sibling matters only for the enforcement/other path. VERIFY at execute (grep prompt.ts).
4. **`disciplineLoader.ts` enforcement path** validates BOTH base + (if it loads siblings) — ensure the English base still validates `harnessed.discipline.v1` (same shape, only description text changes).
5. **zh sibling = today's Chinese VERBATIM** for the 5 fixed files → zh users byte-identical. Do not "improve" while moving.

## Translation glossary
Reuse the Phase 31 glossary (keep-English list + term renderings). role-prompts `specialist`/`severity`
are short labels — translate naturally. Keep `primary_cap` values + rule `id`/`enforcement`/`trigger`/
`check_method` + `schema_version` verbatim (identifiers).

## Parity guard (T33.5)
Sister `check-skill-i18n-parity.mjs` but for yaml: compare top-level keys + role-key set + rule `id`
set + per-entry field presence (values differ by translation). dep-free (pre-install), export +
`import.meta.url` main-guard. drift-only.

## Execute-time scope refinement: `language.yaml` EXCLUDED from T33.4 (landmine #3 resolved)

Landmine #3 ("VERIFY at execute: is `language.yaml` surfaced?") resolved with grep evidence:
- `buildDisciplinesSection` (prompt.ts:101) FILTERS OUT `language` — its rule.description never
  reaches the surfaced `## Disciplines` block.
- The enforcement hooks that load `language` (`after-output.ts`) read NO description text —
  after-output.ts:26 comment: "no field reads needed today"; it uses hardcoded regexes. The other
  hooks (before-commit/before-spawn/before-phase-execute) read only `id`/`enforcement`/`auto_fix_cmd`/
  `priority_hierarchy`/`check_method`, never `description`.
- Conclusion: `language.yaml` description is NEVER surfaced as user-facing text → it has NO en-default
  bug and a `language.zh-Hans.yaml` sibling would be dead weight (the loader skips `language`; the
  enforcement path uses a fixed basename, not locale-aware — out of scope).
- Decision: T33.4 = **4 files** (karpathy/output-style/priority/operational), `language` EXCLUDED.
  Consistent with the approved "全 **surface** 双语 + 修 en bug" intent — `language` is not a surface
  and has no bug. karpathy-minimal (no dead artifact). Recorded transparently here.

## T33.5 guard: `yaml`-package parse (deviation from PLAN "dep-free") — justified

PLAN said "dep-free (pre-install) per Phase 30 pattern". Refined at execute: the yaml parity guard
uses the `yaml` package (robust structural parse) and the CI step runs AFTER `pnpm install` (sister
`check-workflow-schema.mjs`). Rationale: regex-parsing yaml STRUCTURE (block scalars, indentation)
would itself be a bug source; the dep-free constraint was Phase-30-specific (pre-install sibling to
check-provenance) and the yaml guard has no pre-install ordering need. Export + `import.meta.url`
main-guard + `.d.mts` pattern retained.

## Deferred
None within v10.0 — Phase 33 is the last phase. After: milestone close + release pass consideration.
