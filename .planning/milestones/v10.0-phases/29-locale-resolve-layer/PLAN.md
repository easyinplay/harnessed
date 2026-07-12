---
phase: 29
milestone: v10.0
title: Locale-aware skill/workflow resolve layer
status: ready-to-execute
created: 2026-06-24
requirement: REQ-v100-resolve-layer
depends_on: []
blocks: [31]
verified_refs:
  - "src/cli/lib/renderSkillTemplates.ts:55 renderSkillFile (exists)"
  - "src/cli/lib/renderSkillTemplates.ts:62 hardcoded 'SKILL.md' (exists — the hook point)"
  - "src/cli/lib/renderSkillTemplates.ts:96 renderAllSkills (exists)"
  - "src/cli/setup.ts:27 imports renderAllSkills (exists)"
  - "src/cli/lib/scan-nested.ts:39 scanWorkflowsNested + stat 'SKILL.md' gate (exists)"
  - "src/i18n/index.ts:100 getLocale(): SupportedLocale (exists, exported)"
  - "src/i18n/index.ts:93 setLocale (exists, exported)"
  - "src/i18n/index.ts:21 SupportedLocale = 'en'|'zh-Hans' (exists)"
  - "src/installers/lib/platform.ts:205 getSkillsDir (exists)"
  - "src/cli/lib/resolveSkillBody.ts (NEW)"
  - "tests/cli/resolveSkillBody.test.ts (NEW)"
---

# Phase 29 — Locale-aware skill/workflow resolve layer

## Goal

At `harnessed setup`, the destination `~/.claude/skills/<name>/SKILL.md` carries the
**locale-correct body**: when the resolved locale is `zh-Hans` and a `SKILL.zh-Hans.md`
sibling exists in the copied skill dir, render THAT body into the destination `SKILL.md`;
otherwise render `SKILL.md` (today's behavior). `en`-default stays **byte-identical**.

Mechanism-only phase (TDD). No translated `.zh-Hans.md` files exist yet (Phase 31 produces
them) — the resolver must fall back gracefully to `SKILL.md` and is tested against fixtures.

## Hard constraint (drives the whole design — from Phase 29 research)

Claude Code's Skill tool reads `~/.claude/skills/<name>/SKILL.md` by **exact filename** at
runtime; harnessed has **no runtime hook** — it acts only at `setup` (install) time. So the
localized body MUST be written into the destination `SKILL.md` at setup time; switching
locale = re-run `harnessed setup`. There is no read-time locale switch available to harnessed.

## Decision (OPEN-2 resolved 2026-06-24)

**render-step selection, dest single SKILL.md.** Source keeps both siblings
(`SKILL.md` + `SKILL.zh-Hans.md`); `cp -r` copies both (free, unchanged); `renderSkillFile`
picks the locale body, renders `{{ capabilities.* }}` placeholders, writes the result into
dest `SKILL.md`, then removes any `SKILL.<locale>.md` sibling from the dest so the install dir
holds a single locale-correct `SKILL.md`. Mirrors the `messages/{en,zh-Hans}.json` file-level
pattern; minimal touch; reuses `getLocale()`.

Locale source at install: explicit `harnessed setup --lang <code>` (→ `setLocale`) wins; else
`getLocale()` auto-detect (HARNESSED_LANG → LC_ALL → LANG → LANGUAGE → Intl → en).

## Tasks

### T29.1 — `resolveSkillBody` helper (TDD: red → green) — NEW
- **File**: `src/cli/lib/resolveSkillBody.ts` (NEW).
  - `skillBodyFilename(locale: SupportedLocale): string` — pure: `zh-Hans` → `'SKILL.zh-Hans.md'`, else `'SKILL.md'`.
  - `resolveSkillBodyFilename(skillDir: string, locale?: SupportedLocale): string` — locale defaults to `getLocale()`; returns `skillBodyFilename(locale)` ONLY when that file `existsSync(join(skillDir, name))`, else `'SKILL.md'` (graceful fallback when no sibling). Always returns `'SKILL.md'` for `en`.
- **Tests** (NEW `tests/cli/resolveSkillBody.test.ts`): en → SKILL.md (even if sibling exists); zh-Hans + sibling fixture → SKILL.zh-Hans.md; zh-Hans + no sibling → SKILL.md; default reads `getLocale()` (stubEnv HARNESSED_LANG=zh + sibling → zh); `__resetForTests()` between cases.
- **Acceptance**: red first (helper absent), then green; uses `existsSync` + `getLocale`; no third copy of `mapToSupported` (call `getLocale`, do NOT re-implement locale parsing — landmine, see findings).

### T29.2 — wire locale pick into render (renderSkillTemplates.ts)
- **File**: `src/cli/lib/renderSkillTemplates.ts` (MODIFY `renderSkillFile` L55-90 + `renderAllSkills` L96-138).
  - Add optional `locale?: SupportedLocale` param to both (default `getLocale()`); `renderAllSkills` threads it to each `renderSkillFile`.
  - In `renderSkillFile`: `const dir = join(skillsBase, skillName)`; `const srcName = resolveSkillBodyFilename(dir, locale)`; read `join(dir, srcName)`; render placeholders; **write rendered body to `join(dir, 'SKILL.md')`** (the dest exact name CC reads), not back to `srcName`; then `rm` any `SKILL.zh-Hans.md` (and future `SKILL.*.md` locale siblings) in `dir` so dest holds a single `SKILL.md`. Keep `result.skillPath = join(dir, 'SKILL.md')`. Preserve the non-fatal error posture (read/write failure → `result.error`, warn-and-continue).
- **Acceptance**: zh-Hans + sibling fixture → dest `SKILL.md` == rendered zh body, dest `.zh-Hans.md` gone; en or no-sibling → dest `SKILL.md` **byte-identical** to current behavior, no spurious deletes; existing render tests stay green; placeholder rendering still applied to whichever body is selected.

### T29.3 — setup threads resolved locale + `--lang` ordering (setup.ts)
- **File**: `src/cli/setup.ts` (MODIFY — pass `getLocale()` into `renderAllSkills`). Verify (grep) WHERE `--lang` → `setLocale` runs in CLI dispatch; ensure it executes BEFORE the render loop so `getLocale()` reflects it (if `--lang` is parsed in the bin/flags entry, no setup change beyond passing the locale; if not wired, wire it — record which in findings).
- **Tests** (integration, sister to `tests/cli/setup-platform.test.ts`): `setup --lang zh-Hans` over a fixture workflow dir carrying `SKILL.md` + `SKILL.zh-Hans.md` → installed `~/.claude/skills/<name>/SKILL.md` == rendered zh body; no `.zh-Hans.md` in dest. Default (no `--lang`, en env) → en body, byte-identical.
- **Acceptance**: end-to-end `setup --lang zh-Hans` surfaces the zh body in dest SKILL.md; en default unchanged; `HARNESSED_ROOT_OVERRIDE`/tmp isolation as in existing setup tests.

### T29.4 — install gate invariant unchanged (scan-nested)
- **File**: `src/cli/lib/scan-nested.ts` (NO CHANGE — assert-only). The `stat(join(src,'SKILL.md'))` gate stays: a dir with only `SKILL.zh-Hans.md` and NO `SKILL.md` is still skipped (no zh-only skills install). zh-Hans is bonus cargo, never the install gate.
- **Tests**: fixture dir with only `.zh-Hans.md` → `scanWorkflowsNested` omits it.
- **Acceptance**: gate semantics provably unchanged; test green.

### T29.5 — validation gate
- **Acceptance**: `corepack pnpm exec biome check --write` clean; `tsc` clean; full `vitest` green with NO regression vs the **1394-test baseline** (new tests add count); en-default byte-identical asserted (T29.2/T29.3); CI green on 3 platforms (Windows incl.).

## Out of scope (later phases)
- Actual `.zh-Hans.md` translation content → Phase 31.
- CI sync-guard enforcing en↔zh parity → Phase 30.
- CLI message table 14-key gap → Phase 32.

## Goal-backward check
Goal = "dest SKILL.md carries locale body, en byte-identical." T29.1 builds the picker;
T29.2 makes render honor it + keeps dest single-file; T29.3 wires the real setup path +
`--lang`; T29.4 guards the install gate; T29.5 proves no regression + byte-identical en.
Every goal clause is covered; no orphan tasks.
