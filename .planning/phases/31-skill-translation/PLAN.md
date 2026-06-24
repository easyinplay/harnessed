---
phase: 31
milestone: v10.0
title: SKILL.md surface translation (26 → zh-Hans siblings)
status: ready-to-execute
created: 2026-06-24
requirement: REQ-v100-translation
depends_on: [29, 30]
blocks: []
verified_refs:
  - "scripts/check-skill-i18n-parity.mjs (exists — Phase 30 guard; validates each pair)"
  - "src/cli/lib/resolveSkillBody.ts (exists — Phase 29 resolve; surfaces zh body at setup)"
  - "src/cli/lib/renderSkillTemplates.ts (exists — Phase 29 render-step picks zh body → dest SKILL.md)"
  - "workflows/**/SKILL.md — 26 files (Phase-31 research inventory, exact list below)"
  - "26 NEW workflows/**/SKILL.zh-Hans.md siblings"
---

# Phase 31 — SKILL.md surface translation

## Goal

Produce a `SKILL.zh-Hans.md` sibling for each of the **26** `workflows/**/SKILL.md`, translating
prose + heading text to natural simplified Chinese while preserving every load-bearing token, so
that: (1) the Phase 30 guard (`scripts/check-skill-i18n-parity.mjs`) exits 0 — each pair in
structural parity; (2) the Phase 29 resolve layer surfaces the zh body end-to-end under a zh
locale; (3) every en `SKILL.md` is **byte-identical** (untouched). yaml is OUT (→ Phase 33).

## Type & TDD posture

**Prose translation — TDD-skip declared** (see findings). The mechanism (resolve + guard) was
built + tested in Phases 29/30; Phase 31 adds 26 markdown artifacts with NO new code. The
"test" is the Phase 30 guard passing on the 26 real pairs + en byte-identical. No red-green-refactor.

## Translation contract (per-file — ALL must hold or the guard fails)

NEVER translate / always preserve verbatim:
1. **`{{ capabilities.X }}` placeholders** — byte-for-byte (guard: placeholder-set equality; runtime: render substitution).
2. **Frontmatter KEYS** — `name` / `description` / `trigger_phrases` / `preamble-tier` / `schema_version` (guard: key-set equality, case-sensitive).
3. **Fenced code blocks + inline commands/paths** — bash, `harnessed run ...`, file paths.
4. **Heading LEVELS** — `##` stays `##` (guard: level-sequence equality). Heading TEXT *is* translated.
5. **Markdown table pipe structure** — `|...|...|`; code-token cells (`01-review`, `gstack`, `opus`) verbatim; prose cells translated.
6. **`<!-- harnessed-generated:vX.Y.Z -->` marker** — preserve (checked by `shouldOverwriteFile` in generateCommands.ts).
7. **Backtick routing tokens** — `` `01-deliver` ``, `` `task-deliver` ``, capability/slug names = load-bearing identifiers.

Frontmatter VALUE rules (values are never read by harnessed at runtime — name derives from dir path — so these are for guard-parity + reader clarity):
- `name:` value → keep verbatim (identifier).
- `description:` value → translate to Chinese.
- `trigger_phrases:` list → **copy the en list verbatim (keep BOTH the Chinese AND English phrases)**. Rationale: the resolve layer overwrites dest `SKILL.md` with the zh body and strips the sibling, so at runtime only ONE body is active; the zh body must retain the en trigger phrases or English triggers are lost. (Guard checks the KEY, not values — identical values pass.)
- `schema_version:` / `preamble-tier:` values → keep verbatim (routing metadata). NOTE: `research/SKILL.md` is the ONLY file with 4 keys (`name`/`description`/`preamble-tier`/`schema_version`, NO `trigger_phrases`) — its zh sibling must mirror exactly those 4 keys.

## Shared glossary (consistency across all 7 batches)

Keep English (per `~/.claude/CLAUDE.md` language rules): all code/identifiers/paths/CLI/flags;
tool & framework names (harnessed, gstack, GSD, ECC, superpowers, Claude Code, subagent, Agent
Teams, ralph-loop, TDD, CI, PR, MCP, token, context window, prompt); slash-command names; schema
ids. Recurring prose terms → consistent Chinese: phase=阶段 · stage=阶段(or keep "stage" when it
names the 4-stage pipeline) · workflow=工作流 · gate=门控/关卡 · orchestrator=编排器 · discipline=纪律 ·
capability=能力 · verify=验证 · review=审查 · plan=规划 · ship=发布 · fallback=兜底 · master=主控 ·
sub-workflow=子工作流. Match the bilingual register already present in the en bodies (they
interleave Chinese/English) — the zh sibling should read as natural technical Chinese, not a
literal word-for-word gloss.

## Tasks — 7 translation batches (parallel subagent fan-out) + verify

Each batch task = create the `.zh-Hans.md` siblings for its files per the contract + glossary.
Batches are independent (distinct files) → spawn as parallel subagents.

- **T31.B1 — Standalone (3 files, ~1,766w)**: `auto/`, `research/` (⚠ 4-key frontmatter, no trigger_phrases, big fallback Task-spawn prose block), `retro/`.
- **T31.B2 — discuss (4, ~1,431w)**: `discuss/auto`, `discuss/phase` (2 ph), `discuss/strategic` (3 ph), `discuss/subtask` (1 ph).
- **T31.B3 — plan + ship masters (4, ~1,285w)**: `plan/auto`, `plan/architecture` (1 ph), `plan/phase` (2 ph), `ship/auto`.
- **T31.B4 — ship-preflight + task (5, ~2,227w)**: `ship/preflight`, `task/auto`, `task/clarify` (1 ph), `task/code` (1 ph), `task/deliver` (⚠ heaviest 643w, OR-chain lists, 2 ph).
- **T31.B5 — task/test + verify masters (3, ~1,502w)**: `task/test` (2 ph), `verify/auto` (large routing table), `verify/code-review` (1 ph).
- **T31.B6 — verify subs A (4, ~1,389w)**: `verify/design`, `verify/multispec` (Agent Teams refs, 2 ph), `verify/paranoid`, `verify/progress` (3 ph).
- **T31.B7 — verify subs B (3, ~973w)**: `verify/qa`, `verify/security`, `verify/simplify`.

- **T31.V — guard verification + gate**:
  - Run `node scripts/check-skill-i18n-parity.mjs` → MUST exit 0 (all 26 pairs structural-parity). Fix any violation (placeholder/key/heading-shape drift) by correcting the offending sibling; re-run until green.
  - `git diff --stat` shows ONLY 26 new `SKILL.zh-Hans.md` files — **zero** changes to any `SKILL.md` (en byte-identical).
  - Full `vitest` green vs the 1423 baseline (no code → count unchanged; the guard fixture tests still pass). `tsc` + `biome` clean (markdown not linted; no TS/JS touched).
  - Spot-check 2-3 siblings for translation quality + a real `setup --lang zh-Hans` surfacing (the zh body lands in dest `SKILL.md`).

## Out of scope (later)
- yaml i18n (role-prompts / disciplines) → Phase 33. Internal capabilities/judgments descriptions → never.
- `must-exist` guard flip (every SKILL.md MUST have a sibling) → optional Phase-31-close add OR Phase 33; Phase 31 relies on the drift-only guard + the T31.V git-diff count (26 new) for completeness.
- CLI 14-key gap → Phase 32.

## Goal-backward check
Goal = "26 zh siblings, guard-green, resolve-surfacing, en untouched." B1–B7 produce all 26 under
the translation contract (which IS the guard contract); T31.V proves guard-green + en byte-identical
+ gate-green + a real surfacing spot-check. Every clause covered; yaml/must-exist explicitly deferred.
