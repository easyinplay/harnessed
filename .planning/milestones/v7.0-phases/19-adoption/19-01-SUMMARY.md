# Phase 19 SUMMARY — minimal adoption (G)

> Executed in the MAIN session, 2026-06-14. Docs-only (zero code, no TDD). LAST phase of v7.0. NOT yet committed — awaiting user review.

## Outcome

Published one honest positioning artifact and made the project legible to a first reader: `docs/comparison.md` (harnessed-vs-comet-vs-Trellis, snapshot-dated, downloads-are-noise caveat front-and-center) + a README "How it compares" pointer.

## Tasks

1. **`docs/comparison.md`** (NEW) — a factual 3-way comparison reusing the 2026-06-13 analysis: a metrics table (downloads / stars / ratio) that leads with the download÷star insight (harnessed's 8,627 downloads are CI/dogfood noise, not ~0 organic adoption at 2 stars); each tool's positioning; harnessed's genuine strengths (no-vendor composition, engineering rigor, audit/provenance) AND genuine lags (adoption, newer learning loop, best-effort CONTEXT injection, single-harness, the now-treated planning bloat). Bottom line recommends Trellis/comet for proven use today and states harnessed's bet plainly.
2. **README** — a one-line "How it compares" pointer to `docs/comparison.md` right under the header (minimal; the existing Quick Start / mermaid flow untouched).
3. **Verify** — below.

## Decisions honored (19-CONTEXT.md)

- D1 comparison post at `docs/comparison.md`, honest (downloads-noise + 2-stars caveats explicit). D2 minimal README touch (pointer only; English README.md). D3 accuracy over spin (every number carries the 2026-06-13 snapshot date; no over-claim). D4 docs-only.

## Evidence

- docs-only: `git diff --stat -- src tests` empty → zero src/tests change.
- Honesty markers present: `2026-06-13` snapshot date + "noise" caveat + the 2-stars reality.
- README link resolves: `docs/comparison.md` exists + README references it.
- Full suite: **1285 passed | 5 skipped | 1 todo, 0 failed** (unchanged — docs-only).
- `git diff --stat`: ROADMAP.md + README.md; untracked new: `docs/comparison.md` + phase docs.

## Acceptance — all met

1. ✅ docs/comparison.md: 3-way positioning + strengths + gaps + downloads-noise/2-stars caveats + 2026-06-13 snapshot dates
2. ✅ README links to it; install→first-command path (`npm install -g harnessed && harnessed setup` → `/auto`) is crisp and unchanged
3. ✅ factually accurate, no over-claim; link resolves
4. ✅ docs-only; full test gate green

## v7.0 milestone

Phase 19 is the LAST of v7.0 (Phases 13–19). With this committed, v7.0 Gap-Close & Memory Loop is 7/7. Next (post-commit, separate): npm release (4.5.0) + milestone archive.
