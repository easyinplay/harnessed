# Phase 31 SUMMARY — SKILL.md surface translation

> v10.0 Phase 31 (REQ-v100-translation). Shipped 2026-06-24. Plan: [PLAN.md](./PLAN.md). Decisions: [findings.md](./findings.md).

## What shipped

**26 new `workflows/**/SKILL.zh-Hans.md`** — a full Simplified-Chinese translation of the
skill/workflow surface (~10,132 words / 2,023 inserted lines), commit `d1d2834`.

Produced via **7 parallel translation subagents** (B1–B7, sonnet) under a shared translation
contract + glossary embedded in each brief. Prose translation — **TDD-skip** (mechanism was
built + tested in Phases 29/30; this phase adds markdown artifacts, no code).

## Verify (self-verified, not trusting subagent self-checks)

- **Guard `scripts/check-skill-i18n-parity.mjs` exits 0** — all 26 pairs in structural parity
  (frontmatter key-set / `{{ capabilities.X }}` placeholder set / heading-level shape).
- **en byte-identical** — `git status` shows zero changes to any `SKILL.md` (only 26 new files).
- **full vitest 1423 passed / 0 failed** (no regression; no new tests — prose).
- **Quality spot-check** — `research/SKILL.zh-Hans.md` (the trickiest: 4-key frontmatter + a big
  injected role-prompt block): natural technical Chinese, identifiers/tools/versions kept English.

## Accepted translation decisions

- **Injected role-prompt blocks kept English** (e.g. `research/`'s fallback Task-spawn `> You are a
  Research analyst…` block) — they are functional prompt templates fed to spawned subagents, not
  reader-facing prose; English is more reliable for subagent instruction + consistent with how
  harnessed prompts work. Surrounding context is Chinese.
- **`trigger_phrases` keep BOTH zh + en** verbatim from the en file — the resolve layer serves only
  ONE body at runtime, so the zh body must retain English triggers or they'd be lost.
- **`research/` mirrors its 4-key frontmatter** (`name`/`description`/`preamble-tier`/`schema_version`,
  no `trigger_phrases`); all other 25 files are the standard 3-key shape.
- Count reconciled **28 → 26** (the design-doc figure was wrong; actual filesystem count is 26).

## Commits (local, no push)
- `d1d2834` feat — 26 zh-Hans siblings
- (this) docs — SUMMARY + digest reconcile

## Out of scope → later
- user-facing yaml i18n (role-prompts / disciplines, needs a locale-aware loader) → **Phase 33**.
- internal capabilities/judgments descriptions → never (runtime never reads them).
- `must-exist` guard flip → optional Phase-33/close (Phase 31 used drift-only guard + 26-new-file count).
- CLI 14-key gap → Phase 32.
