# Phase 29 findings (PWF) — decisions / landmines / research

> What PLAN/SUMMARY don't capture: the research that shaped the plan, the gray-area
> resolution, and traps for the executor. Source: Explore subagent ac6b309861fb10be6 (2026-06-24).

## The hard constraint that reshaped OPEN-2 (most important)

Claude Code's Skill tool reads `~/.claude/skills/<name>/SKILL.md` by **exact filename** at
runtime. harnessed has **no runtime hook** — it only acts at `setup` (install) time, and the
installed `SKILL.md` is consumed natively by CC, not re-read by harnessed
(`check-token-budget.ts` reads it but only as a doctor check). Therefore:
- A "ship both files, pick at read time" scheme is **impossible** — CC never reads a
  `.zh-Hans.md` sibling; it would be dead weight.
- The localized body MUST land in dest `SKILL.md` at setup time. Locale switch = re-run setup.

This is inherent, not a design choice. It collapsed OPEN-2 from "resolve-vs-bundle" into a
narrower "which install-time step does the pick."

## OPEN-2 decision (resolved with user 2026-06-24)

**render-step selection, dest single SKILL.md.** (User chose over: render-step-but-keep-both,
and copy-step filter/rename.) Rationale: `cp -r` already copies any sibling for free; the
post-copy `renderSkillFile` already reads the body by constructed path — that's the natural,
one-function hook. Dest ends with exactly one `SKILL.md` (locale-correct); siblings removed.
Mirrors `messages/{en,zh-Hans}.json` file-level pattern.

## Code map (verified paths + line numbers)

- **Install pipeline**: `scan-nested.ts:39` `scanWorkflowsNested` (gate = `stat SKILL.md`, L60/93) → `setup.ts:190-199` `cp(src, dst, {recursive:true,force:true})` → `renderSkillTemplates.ts:55` `renderSkillFile` reads `join(skillsBase, skillName, 'SKILL.md')` (L62, hardcoded) renders `{{capabilities.*}}` writes back in-place.
- **renderAllSkills** (`renderSkillTemplates.ts:96`) loops renderSkillFile; called from `setup.ts:27` import.
- **v9.0 layer**: `installers/lib/platform.ts` — `getSkillsDir(home?)` L205 (thin accessor pattern). Locale pick is a PEER helper, NOT a `PlatformDescriptor` field (descriptor = platform paths, not content locale).
- **i18n**: `i18n/index.ts` — `getLocale()` L100 (lazy, memoized, returns `'en'|'zh-Hans'`), `setLocale()` L93 (from `--lang`), `mapToSupported()` L36 (zh* → zh-Hans), `__resetForTests()` L106, `SupportedLocale` L21.
- **bundling**: `package.json` `files` includes `workflows` + `messages` → `.zh-Hans.md` siblings ship in npm verbatim. Runtime path = `getPackageRoot()` → `<pkgRoot>/workflows`; identical dev vs installed; no `~/.harnessed/` override (locked `setup.ts:338`).

## Landmines for the executor

1. **Do NOT re-implement locale parsing.** `enableUserLangInSettings.ts:47` `detectUserLang` ALREADY duplicates `mapToSupported` inline (with a comment admitting it). Do NOT add a THIRD copy — call `getLocale()` from `i18n/index.ts` directly.
2. **Write to `SKILL.md`, not back to the source name.** When zh body selected, read `SKILL.zh-Hans.md` but WRITE the rendered result to dest `SKILL.md` (the exact name CC reads). Then remove the dest `.zh-Hans.md`. Getting this wrong = CC reads the un-rendered/wrong file.
3. **Byte-identical en is a hard invariant.** When locale=en or no sibling: read+render+write `SKILL.md` exactly as today; do NOT introduce spurious deletes/writes that change bytes. Today no `.zh-Hans.md` exists, so en install must be provably unchanged.
4. **Chicken-egg**: no real `.zh-Hans.md` exists until Phase 31. Test the resolver/render against FIXTURE zh siblings (tmp dirs), not repo files.
5. **scan-nested gate stays**: `SKILL.md` presence is the install gate; a `.zh-Hans.md`-only dir must still be skipped (no zh-only skills). Assert it (T29.4), don't change it.
6. **`--lang` ordering**: confirm `--lang`→`setLocale` runs before the render loop in CLI dispatch (grep first). Robust path: setup calls `getLocale()` once and passes the value into `renderAllSkills` (don't rely on each renderSkillFile re-detecting).
7. **Non-fatal posture**: keep `renderSkillFile`'s warn-and-continue error handling (sister fallback 铁律 1) — read/write failures set `result.error`, never throw.

## Deferred (not this phase)
OPEN-1 (sync-guard granularity) → Phase 30. Translation content → Phase 31. CLI 14-key gap → Phase 32.
