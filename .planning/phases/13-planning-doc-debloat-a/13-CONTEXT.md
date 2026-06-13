# Phase 13 CONTEXT — planning doc-debloat (A)

> Captured from v7.0 milestone discuss (2026-06-13, AskUserQuestion). No separate discuss-phase: scope is a single clear cleanup with the decision already locked. This file self-exemplifies the doc-discipline it enforces — terse, digest-first, no history inlined.

## Goal

Cut the planning-doc bloat that violates our own v6.0 doc-discipline, so the overview/status tier is a real digest and history lives only in archives (CHANGELOG / RETROSPECTIVE / milestone audits / git).

## Problem (evidence)

- `PROJECT-SPEC.md` line ~3 is a single `>` blockquote of ~4000 words: nested per-phase milestone bookkeeping (every phase's commits/tests/ADRs/tags inlined). This is exactly the "STATE = digest non archive" / "overview pointer not copy" anti-pattern the v6.0 `doc-discipline.yaml` rules flag.
- The doc-discipline `before-commit` enforcement exists (Phase 11) but PROJECT-SPEC predates it and was never retrofitted.

## Locked decisions

- **D1 — PROJECT-SPEC status digest**: collapse the ~4000-word status blockquote to a `<100`-line digest = current pointer (milestone + status + npm latest) + one line per shipped milestone (result + date + pointer to its archive) + pointer to CHANGELOG/RETROSPECTIVE for narrative. Delete the inlined per-phase narrative (it already lives in `.planning/milestones/*-MILESTONE-AUDIT.md` + `CHANGELOG.md` + `RETROSPECTIVE.md` — removal, not re-copy).
- **D2 — No data loss / no re-copy**: history is NOT moved into a new file; it is already archived elsewhere. Phase 13 only DELETES the duplicate inline copy from PROJECT-SPEC and leaves a pointer. Verify the archive target exists before deleting each inlined block.
- **D3 — ADRs untouched**: the 23 ADR files are one-fact-per-file and already doc-discipline-compliant. Do NOT index/merge/delete them. Out of scope.
- **D4 — README translations**: the 11 hand-maintained `README-*.md` translations are a maintenance-bloat source but deletion is destructive + user-facing. Decision: do NOT delete. Add a short "generated/best-effort, may lag English" header note to the non-English translations and stop treating them as hand-maintained SoT; actual generation tooling is OUT of scope (defer). English `README.md` + `README-cn.md` stay primary.
- **D5 — Self-exemplify**: every doc edited in this phase must itself pass the doc-discipline `before-commit` check (the phase eats its own dog food).

## Scope

- Edit `PROJECT-SPEC.md`: status blockquote → digest (D1/D2).
- Edit non-English `README-*.md`: add best-effort/stale header note (D4). English + cn untouched.
- Verify `.planning/STATE.md` + `.planning/ROADMAP.md` already comply (they were rewritten 2026-06-13; spot-check line counts).

## Out of scope (do NOT touch)

- Any `src/` / `tests/` code. Zero behavior change.
- ADR files (D3).
- README.md (English) + README-cn.md content.
- Building README translation-generation tooling (deferred).
- The doc-discipline rules themselves (Phase 11 owns them).

## Invariants

- KARPATHY-minimal: smallest effective diff; deletion of duplicated narrative, not rewriting.
- No data loss: confirm each removed inline block is already archived (CHANGELOG/RETROSPECTIVE/milestone audit) before deleting.
- doc-discipline `before-commit` check passes clean on every edited doc.
- biome preempt N/A (no TS/JS); but run the full gate to confirm zero code regression.
- NEVER push without approval.

## Acceptance

- `PROJECT-SPEC.md` status section `< 100` lines; no per-phase history inlined in the overview tier; a pointer to archives is present.
- Non-English README translations carry the best-effort header note.
- doc-discipline enforcement passes on all edited docs.
- `git diff --stat` shows docs-only changes; full test gate green (no code touched).
