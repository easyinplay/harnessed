---
phase: 30
milestone: v10.0
title: en↔zh-Hans skill sync-guard (CI pair-parity hard gate)
status: ready-to-execute
created: 2026-06-24
requirement: REQ-v100-sync-guard
depends_on: [29]
blocks: [31]
verified_refs:
  - ".github/workflows/ci.yml:124/133/140/160 pure-node check-*.mjs steps run BEFORE 'corepack pnpm install' L163 (exists — insertion pattern)"
  - "scripts/check-provenance.mjs (exists — sister pure-node hard-gate pattern)"
  - "scripts/check-workflow-schema.mjs (exists — but imports typebox → runs AFTER install; our guard is dep-free → BEFORE install)"
  - "package.json:65 test = vitest run; :69 lint = biome check . (so new .mjs must be biome-clean)"
  - "tests/checkpoint/injectState.test.ts (exists — precedent: vitest TS test imports a bin/*.mjs)"
  - "workflows/**/SKILL.md — 26 files (actual count; design doc said 28)"
  - "scripts/check-skill-i18n-parity.mjs (NEW)"
  - "tests/scripts/skill-i18n-parity.test.ts (NEW)"
---

# Phase 30 — en↔zh-Hans skill sync-guard

## Goal

A CI **hard-gate** enforcing en↔zh-Hans `SKILL.md` pair parity, turning the dual-maintenance
drift risk (design doc primary risk) into a checkable constraint. **drift-only**: when a
`SKILL.zh-Hans.md` sibling exists it MUST be in structural parity with its `SKILL.md`; absence
is OK (no `must-exist` requirement) so the guard is green NOW (no siblings yet) and stays green
as Phase 31 lands siblings in parity.

## Decision (OPEN-1 resolved 2026-06-24): structural parity

Granularity = **structural parity** (over presence-only and structural+anchor). When a sibling
exists, check these **translation-invariant** features (NOT translated prose / heading text):
1. **Frontmatter key-set identical** — same top-level keys (`name`/`description`/`trigger_phrases`/…); values are translated, keys are not.
2. **`{{ capabilities.X }}` placeholder set identical** — placeholders are rendered (Phase 29), never translated; must match exactly.
3. **Heading hierarchy shape identical** — the sequence of heading levels (e.g. `[1,2,2,3,2]`) must match; catches a section added to en but not zh. Heading TEXT is NOT compared (translated).
4. **No orphan zh** — a `SKILL.zh-Hans.md` with no `SKILL.md` sibling is a violation.

Rationale: presence-only does not mitigate the stated primary risk (content drift); the anchor
variant adds a bump-ritual maintenance tax. Structural parity catches real drift with zero
prose comparison.

## Architecture (from Phase 30 research)

- **Pattern**: a `scripts/check-<name>.mjs` pure-node script + a `ci.yml` step (sister
  `check-provenance.mjs`). Dep-free → runs BEFORE `corepack pnpm install` (the `yaml` package is
  NOT available pre-install → parse frontmatter keys by regex, not the yaml lib).
- **Testability**: the script EXPORTS a pure fn `checkSkillI18nParity(workflowsDir)` and has a
  CLI `main()` guarded by an `import.meta.url` entry check. Vitest imports the `.mjs` fn directly
  (precedent: `injectState.test.ts` tests `bin/*.mjs`). This gives TDD without a build step.

## Tasks

### T30.1 — parity checker (TDD: red → green) — NEW
- **File**: `scripts/check-skill-i18n-parity.mjs` (NEW).
  - Export `checkSkillI18nParity(workflowsDir: string): { ok: boolean, violations: Array<{file, kind, detail}> }`. Walk `workflows/**/`; for each dir containing `SKILL.md`: if `SKILL.zh-Hans.md` exists, compare the 4 structural features; collect violations. Also flag orphan `SKILL.zh-Hans.md` (no en sibling). Absence of a sibling = OK (drift-only).
  - Helpers (pure, dep-free): `frontmatterKeys(text)` (lines between first two `---`, regex `^([A-Za-z_][\w-]*):` top-level), `placeholderSet(text)` (regex `/\{\{\s*capabilities\.([\w.-]+)[\s\S]*?\}\}/g`), `headingShape(text)` (regex `^(#{1,6})\s` per line → level sequence).
  - CLI `main()` (guarded `if (import.meta.url === pathToFileURL(process.argv[1]).href)`): run against `workflows/`, print `::error::` per violation, `process.exit(violations ? 1 : 0)`.
- **Tests** (NEW `tests/scripts/skill-i18n-parity.test.ts`, tmp-dir fixtures): in-parity pair → ok; en-only (no sibling) → ok (drift-only); extra heading in en → violation(heading-shape); placeholder mismatch → violation(placeholder); frontmatter key mismatch → violation(frontmatter); orphan zh → violation(orphan). Each asserts `kind`.
- **Acceptance**: red first; pure/dep-free; the 4 features + orphan covered; running against the REAL `workflows/` today → `ok: true` (no siblings exist).

### T30.2 — wire into CI (hard-fail, pre-install)
- **File**: `.github/workflows/ci.yml` (MODIFY — add a step among the pure-node checks BEFORE `corepack pnpm install` at L163, sister `check-provenance` L140). Hard-fail (NO `continue-on-error`), per design doc "hard gate, not advisory". A commented header naming the phase + drift-only semantics.
- **Acceptance**: step runs `node scripts/check-skill-i18n-parity.mjs`; CI green on all 3 OS at current repo state (no siblings); a deliberately-drifted fixture (local, not committed) would fail it.

### T30.3 — validation gate
- **Acceptance**: `corepack pnpm exec biome check --write` clean (the new `.mjs` + `.ts` test); `tsc` clean; full `vitest` green with NO regression vs the **1416-test baseline** (new tests add count); the guard runs green against real `workflows/`.

## Out of scope (later phases)
- The 48 surfacing **yaml** string parity → folded into the guard at **Phase 31** when the yaml
  i18n mechanism is decided (no yaml i18n mechanism exists yet — guard would have nothing to check).
- `must-exist` enforcement (every SKILL.md MUST have a sibling) → a Phase 31 close concern, after
  all 26 are translated. Phase 30 is drift-only.
- Actual translation content → Phase 31.

## Goal-backward check
Goal = "CI hard-gate enforcing structural en↔zh parity, drift-only, green now." T30.1 builds +
unit-tests the structural checker (incl. the drift-only + orphan semantics); T30.2 wires it as a
hard-fail CI step green at current state; T30.3 proves gate-green + no regression. Every clause
covered; yaml + must-exist explicitly deferred.
