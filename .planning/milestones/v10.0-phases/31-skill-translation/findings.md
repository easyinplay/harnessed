# Phase 31 findings (PWF) — decisions / landmines / research

> Source: Explore subagent af427bcf2187e3408 (2026-06-24) + yaml-scope decision.

## TDD-skip declaration (per CLAUDE.md 强制判据)

**Phase 31 is prose translation — TDD red-green-refactor is SKIPPED, justified.** The mechanism
(locale resolve layer Phase 29 + structural-parity guard Phase 30) is already built and unit-tested.
Phase 31 produces 26 markdown artifacts with NO new code path. The verification is the Phase 30
guard passing on the 26 real pairs + en byte-identical (git-diff) + full gate green — not a new
unit suite. This satisfies the TDD-skip protocol (declared here, with reason; verification is the
guard + gate, not "I feel done").

## yaml-scope decision (resolved with user 2026-06-24)

**Phase 31 = SKILL.md-only; user-facing yaml → new Phase 33.** Evidence (research):
- `capabilities.yaml` `description` + `judgments/*.yaml` `description` — runtime NEVER reads them
  (`judgmentResolver` reads only `fires_when`/`skips_when`; capability loader reads only
  `cmd`/`install_type`/`plugin_id`/`skill_dir`). Internal docs → translating is pointless. Out forever.
- `role-prompts.yaml` (→ `commands/*.md` frontmatter + slash picker + subagent prompts via
  `buildAgentDef` run.ts:218) + `disciplines/*.yaml` `rule.description` (→ subagent prompt via
  `buildDisciplinesSection` prompt.ts:108) ARE user-facing — but need a **locale-aware loader**
  (mechanism), unlike SKILL.md's pure sibling-file approach. Carved into Phase 33 to keep prose (31)
  and yaml-loader mechanism (33) as separate, properly-planned phases. Honors the user's office-hours
  full-scope choice across the milestone; ROADMAP 4→5 phases.

## Inventory (26 SKILL.md, ~10,132 words) + count reconcile

Design doc / earlier ROADMAP said **28** — actual is **26** (filesystem scan; `disciplines/` +
`judgments/` excluded by `NON_WORKFLOW_DIRS` scan-nested.ts:32). All docs reconciled to 26.
Full per-file inventory + 7-batch grouping: see PLAN.md tasks. Total `{{ }}` placeholders = 29.

## Translation landmines (research Area C — preserve verbatim or guard/runtime breaks)

1. `{{ capabilities.X }}` placeholders — byte-exact (resolver regex `capabilityResolver.ts:212` + guard set-equality).
2. Frontmatter KEYS (guard key-set equality, case-sensitive).
3. Fenced code blocks + commands/paths.
4. Heading LEVELS (guard level-sequence); heading TEXT translates.
5. Table pipe structure; code-token cells verbatim.
6. `<!-- harnessed-generated:vX.Y.Z -->` marker (generateCommands.ts:330 `shouldOverwriteFile`).
7. Backtick routing tokens (`01-deliver`, `task-deliver`, slugs) = identifiers.

Frontmatter VALUES are never read by harnessed at runtime (name = dir-derived; trigger_phrases read
by CC platform). So: keep `name`/`schema_version`/`preamble-tier` values verbatim, translate
`description` value, **copy `trigger_phrases` list verbatim (keep BOTH zh + en phrases — the resolve
layer serves only ONE body at runtime, so the zh body must retain en triggers)**.

**⚠ `research/SKILL.md`** = ONLY file with 4 frontmatter keys (`name`/`description`/`preamble-tier`/
`schema_version`, NO `trigger_phrases`) — its sibling must mirror exactly those 4 keys.
**⚠ `task/deliver/SKILL.md`** = heaviest (643w, OR-chain lists, 2 placeholders).

## Consistency risk + mitigation
7 parallel translation subagents → terminology drift risk. Mitigated by the **shared glossary** in
PLAN.md (keep-English list + recurring-term Chinese renderings) embedded into every subagent brief.

## Deferred (not this phase)
yaml i18n → Phase 33. CLI 14-key gap → Phase 32. `must-exist` guard flip → optional close/Phase 33
(Phase 31 uses drift-only guard + T31.V git-diff count for completeness).
